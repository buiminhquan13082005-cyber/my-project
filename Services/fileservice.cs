using System.Text.Json;
using danentang.Models;

namespace danentang.Services
{
    public class JsonFileService
    {
        private readonly string _filePath = "D:\\da nen tang\\danentang\\temporarydata.json";

        // Hàm đọc danh sách User từ file
        public async Task<List<User>> GetUsersAsync()
        {
            if (!File.Exists(_filePath)) return new List<User>();

            var json = await File.ReadAllTextAsync(_filePath);
            return JsonSerializer.Deserialize<List<User>>(json) ?? new List<User>();
        }

        // Hàm lưu danh sách User vào file (Dùng khi bạn làm tính năng Đăng ký)
        public async Task SaveUsersAsync(List<User> users)
        {
            var json = JsonSerializer.Serialize(users, new JsonSerializerOptions { WriteIndented = true });
            await File.WriteAllTextAsync(_filePath, json);
        }
    }
}