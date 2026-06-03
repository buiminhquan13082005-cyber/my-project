using danentang.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace danentang.Services.Cinema
{
    public interface IBookingRepository
    {
        Task<List<Booking>> GetAllAsync(int? showtimeId = null, string? status = null);
        Task<Booking?> GetByIdAsync(int id);
        Task<List<Booking>> LookupByPhoneAsync(string phone);
        Task<(bool Success, List<Booking> Bookings, string Message)> CreateBookingAsync(int showtimeId, List<int> seatIds, string customerName, string customerPhone);
        Task<(bool Success, Booking? Data, string Message)> CancelBookingAsync(int id);
    }
}
