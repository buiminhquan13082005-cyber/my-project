using danentang.Models;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace danentang.Services.Cinema
{
    public interface IShowtimeRepository
    {
        Task<List<Showtime>> GetAllAsync(DateTime? date = null, int? roomId = null);
        Task<Showtime?> GetByIdAsync(int id);
        Task<(bool Success, Showtime? Data, string Message)> CreateAsync(Showtime showtime);
        Task<(bool Success, Showtime? Data, string Message)> UpdateAsync(int id, Showtime showtime);
        Task<(bool Success, string Message)> DeleteAsync(int id);
        Task<List<Showtime>> GetTodayShowtimesAsync();
    }
}
