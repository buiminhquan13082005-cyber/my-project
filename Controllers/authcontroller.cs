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

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request, [FromServices] JsonFileService fileService)
        {
            // 1. Đọc dữ liệu từ file JSON thông qua Service
            var users = await fileService.GetUsersAsync();

            // 2. Dùng LINQ để tìm User theo Email
            var userInDb = users.FirstOrDefault(u => u.Email == request.Email);

            if (userInDb == null)
            {
                return Unauthorized(new { status = "error", message = "Tài khoản không tồn tại." });
            }

            //Console.WriteLine(">>> HASH CHUẨN LÀ: " + BCrypt.Net.BCrypt.HashPassword(request.Password));
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
                data = new { token = token }
            });
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
                new Claim(ClaimTypes.Email, user.Email)
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
}