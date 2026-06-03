using Microsoft.AspNetCore.Authentication.JwtBearer;
using Scalar.AspNetCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using danentang.Data;
using danentang.Services.Cinema;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddOpenApi();

// Cấu hình Database
var connectionString = builder.Configuration.GetConnectionString("CinemaDb");
builder.Services.AddDbContext<CinemaDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));

// Đăng ký Services & Repositories
builder.Services.AddScoped<IMovieRepository, MovieRepository>();
builder.Services.AddScoped<IRoomRepository, RoomRepository>();
builder.Services.AddScoped<IShowtimeRepository, ShowtimeRepository>();
builder.Services.AddScoped<IBookingRepository, BookingRepository>();

// Cấu hình CORS cho Frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddAuthentication(options =>
{
    // Đặt JWT làm phương thức mặc định
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.SaveToken = true;
    options.RequireHttpsMetadata = false; // Tắt yêu cầu HTTPS nếu bạn đang chạy localhost
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidAudience = builder.Configuration["Jwt:Audience"],
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]))
    };
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

app.UseRouting();
app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();
// app.UseHttpsRedirection();
app.MapControllers();

// Seed database with test users
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<CinemaDbContext>();
        context.Database.EnsureCreated();

        // Seed Manager (Admin)
        if (!context.Users.Any(u => u.Email == "admin@test.com"))
        {
            context.Users.Add(new danentang.Data.Entities.UserEntity
            {
                Email = "admin@test.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin"),
                FullName = "System Admin",
                Role = "Manager"
            });
        }

        // Seed Staff (quan@test.com)
        if (!context.Users.Any(u => u.Email == "quan@test.com"))
        {
            context.Users.Add(new danentang.Data.Entities.UserEntity
            {
                Email = "quan@test.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("quan"),
                FullName = "Bùi Minh Quân",
                Role = "Staff"
            });
        }

        // Seed Staff (staff@test.com)
        if (!context.Users.Any(u => u.Email == "staff@test.com"))
        {
            context.Users.Add(new danentang.Data.Entities.UserEntity
            {
                Email = "staff@test.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("staff"),
                FullName = "Staff Test Mobile",
                Role = "Staff"
            });
        }

        context.SaveChanges();
        Console.WriteLine("Database seeding completed successfully.");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"An error occurred during database seeding: {ex.Message}");
    }
}

app.Run();