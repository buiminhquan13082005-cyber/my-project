using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using danentang.Models;
using BCrypt.Net;
using Microsoft.EntityFrameworkCore;
using danentang.Data;
using danentang.Data.Entities;
using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;

namespace danentang.Controllers
{
    /// <summary>
    /// Controller xác thực - đăng nhập, đăng ký, làm mới token, đổi mật khẩu và lấy profile.
    /// Sử dụng JWT cho access token và refresh token rotation.
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly CinemaDbContext _context;

        public AuthController(IConfiguration configuration, CinemaDbContext context)
        {
            _configuration = configuration;
            _context = context;
        }

        /// <summary>
        /// POST: api/auth/login - Đăng nhập với email và mật khẩu.
        /// Trả về access token (JWT) và refresh token nếu thành công.
        /// </summary>
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            Console.WriteLine($"[Login Attempt] Email: '{request.Email}', Password length: {request.Password?.Length}");
            var userInDb = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);

            if (userInDb == null)
            {
                return Unauthorized(new { status = "error", message = "Tài khoản không tồn tại." });
            }

            bool isPasswordValid = BCrypt.Net.BCrypt.Verify(request.Password, userInDb.PasswordHash);

            if (!isPasswordValid)
            {
                return Unauthorized(new { status = "error", message = "Mật khẩu không đúng." });
            }

            string accessToken = GenerateJwtToken(userInDb);
            string refreshToken = GenerateRefreshToken();
            
            await SaveRefreshTokenAsync(refreshToken, userInDb.Id);

            return Ok(new
            {
                status = "success",
                data = new
                {
                    token = accessToken,
                    refreshToken = refreshToken,
                    fullName = userInDb.FullName,
                    role = userInDb.Role
                }
            });
        }

        /// <summary>
        /// POST: api/auth/refresh - Làm mới access token bằng refresh token.
        /// Áp dụng Refresh Token Rotation: thu hồi token cũ và tạo cặp token mới.
        /// </summary>
        [HttpPost("refresh")]
        public async Task<IActionResult> Refresh([FromBody] RefreshRequest request)
        {
            var storedToken = await _context.RefreshTokens
                .FirstOrDefaultAsync(t => t.Token == request.RefreshToken && !t.IsRevoked);

            if (storedToken == null)
            {
                return Unauthorized(new { status = "error", message = "Refresh token không hợp lệ." });
            }

            if (storedToken.ExpiresAt < DateTime.UtcNow)
            {
                storedToken.IsRevoked = true;
                await _context.SaveChangesAsync();
                return Unauthorized(new { status = "error", message = "Refresh token đã hết hạn." });
            }

            var user = await _context.Users.FindAsync(storedToken.UserId);
            if (user == null)
            {
                return Unauthorized(new { status = "error", message = "Người dùng không tồn tại." });
            }

            storedToken.IsRevoked = true;

            string newAccessToken = GenerateJwtToken(user);
            string newRefreshToken = GenerateRefreshToken();
            await SaveRefreshTokenAsync(newRefreshToken, user.Id);

            return Ok(new
            {
                status = "success",
                data = new
                {
                    token = newAccessToken,
                    refreshToken = newRefreshToken,
                    fullName = user.FullName,
                    role = user.Role
                }
            });
        }

        /// <summary>
        /// POST: api/auth/logout - Đăng xuất và thu hồi refresh token.
        /// </summary>
        [HttpPost("logout")]
        public async Task<IActionResult> LogoutApi([FromBody] RefreshRequest request)
        {
            var storedToken = await _context.RefreshTokens
                .FirstOrDefaultAsync(t => t.Token == request.RefreshToken && !t.IsRevoked);
            
            if (storedToken != null)
            {
                storedToken.IsRevoked = true;
                await _context.SaveChangesAsync();
            }
            return Ok(new { status = "success", message = "Đã đăng xuất." });
        }

        /// <summary>
        /// POST: api/auth/register - Đăng ký tài khoản mới.
        /// </summary>
        [HttpPost("register")]
        [Authorize(Roles = "Manager")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            if (await _context.Users.AnyAsync(u => u.Email == request.Email))
            {
                return BadRequest(new { status = "error", message = "Email đã tồn tại." });
            }

            var newUser = new UserEntity
            {
                Email = request.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                FullName = request.FullName
            };

            _context.Users.Add(newUser);
            await _context.SaveChangesAsync();

            return Ok(new { status = "success", message = "Đăng ký thành công.", data = new { id = newUser.Id, email = newUser.Email, fullName = newUser.FullName } });
        }

        /// <summary>
        /// GET: api/auth/employees - Lấy danh sách nhân viên.
        /// </summary>
        [HttpGet("employees")]
        [Authorize]
        public async Task<IActionResult> GetEmployees()
        {
            var employees = await _context.Users
                .Select(u => new { id = u.Id, fullName = u.FullName })
                .ToListAsync();
            return Ok(employees);
        }

        /// <summary>
        /// GET: api/auth/me - Lấy thông tin user hiện tại từ JWT claims.
        /// </summary>
        [HttpGet("me")]
        [Authorize]
        public IActionResult GetProfile()
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var email = User.FindFirst(ClaimTypes.Email)?.Value ?? "";
            var fullName = User.FindFirst(ClaimTypes.Name)?.Value ?? "";
            var role = User.FindFirst(ClaimTypes.Role)?.Value ?? "Staff";

            return Ok(new { id = userId, email, fullName, role });
        }

        /// <summary>
        /// PUT: api/auth/change-password - Đổi mật khẩu người dùng.
        /// </summary>
        [HttpPut("change-password")]
        [Authorize]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var user = await _context.Users.FindAsync(userId);

            if (user == null)
                return NotFound(new { status = "error", message = "Người dùng không tồn tại." });

            if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
                return BadRequest(new { status = "error", message = "Mật khẩu hiện tại không đúng." });

            if (BCrypt.Net.BCrypt.Verify(request.NewPassword, user.PasswordHash))
                return BadRequest(new { status = "error", message = "Mật khẩu mới không được trùng mật khẩu cũ." });

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            await _context.SaveChangesAsync();

            return Ok(new { status = "success", message = "Đổi mật khẩu thành công." });
        }

        private string GenerateJwtToken(UserEntity user)
        {
            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Name, user.FullName),
                new Claim(ClaimTypes.Role, user.Role)
            };

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(15),
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private string GenerateRefreshToken()
        {
            var randomBytes = new byte[64];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(randomBytes);
            return Convert.ToBase64String(randomBytes);
        }

        private async Task SaveRefreshTokenAsync(string token, int userId)
        {
            _context.RefreshTokens.Add(new RefreshTokenEntity
            {
                Token = token,
                UserId = userId,
                ExpiresAt = DateTime.UtcNow.AddDays(7),
                CreatedAt = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();
        }
    }

    public class RegisterRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
    }

    public class ChangePasswordRequest
    {
        public string CurrentPassword { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
    }
}