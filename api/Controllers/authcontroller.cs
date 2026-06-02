using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using danentang.Models;
using BCrypt.Net;
using danentang.Services;

namespace danentang.Controllers
{
    [Route("api/[controller]")] // Đường dẫn sẽ là: /api/auth
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IConfiguration _configuration;

        // Tiêm (Inject) IConfiguration để đọc file appsettings.json
        public AuthController(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        private readonly string _usersPath = "data/users.json";

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request, [FromServices] JsonFileService fileService)
        {
            // 1. Đọc dữ liệu từ file JSON thông qua Service
            var users = fileService.GetData<User>(_usersPath);

            // 2. Dùng LINQ để tìm User theo Email
            var userInDb = users.FirstOrDefault(u => u.Email == request.Email);

            if (userInDb == null)
            {
                return Unauthorized(new { status = "error", message = "Tài khoản không tồn tại." });
            }

            // 3. Kiểm tra mật khẩu (BCrypt)
            bool isPasswordValid = BCrypt.Net.BCrypt.Verify(request.Password, userInDb.PasswordHash);

            if (!isPasswordValid)
            {
                return Unauthorized(new { status = "error", message = "Mật khẩu không đúng." });
            }

            // 5. Nếu thành công, tạo JWT Token
            string token = GenerateJwtToken(userInDb);

            // 6. Trả về Token (OK - 200)
            return Ok(new
            {
                status = "success",
                data = new { token = token, fullName = userInDb.FullName }
            });
        }

        [HttpPost("register")]
        public IActionResult Register([FromBody] RegisterRequest request, [FromServices] JsonFileService fileService)
        {
            var users = fileService.GetData<User>(_usersPath);

            if (users.Any(u => u.Email == request.Email))
            {
                return BadRequest(new { status = "error", message = "Email đã tồn tại." });
            }

            var newUser = new User
            {
                Id = users.Count > 0 ? users.Max(u => u.Id) + 1 : 1,
                Email = request.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                FullName = request.FullName
            };

            users.Add(newUser);
            fileService.SaveData(_usersPath, users);

            return Ok(new { status = "success", message = "Đăng ký thành công.", data = new { id = newUser.Id, email = newUser.Email, fullName = newUser.FullName } });
        }

        // Hàm hỗ trợ tạo JWT Token
        private string GenerateJwtToken(User user)
        {
            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            // Chứa thông tin đính kèm vào Token (Ví dụ: Id của user)
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Name, user.FullName)
            };

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.Now.AddHours(2), // Thời gian sống của token (2 giờ)
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }

    public class RegisterRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
    }
}