using danentang.Data;
using danentang.Data.Entities;
using danentang.Models;
using Microsoft.EntityFrameworkCore;

namespace danentang.Services.Cinema
{
    public class BookingRepository : IBookingRepository
    {
        private readonly CinemaDbContext _context;

        public BookingRepository(CinemaDbContext context)
        {
            _context = context;
        }

        public async Task<List<Booking>> GetAllAsync(int? showtimeId = null, string? status = null)
        {
            var query = _context.VwBookingDetails.AsQueryable();

            if (showtimeId.HasValue)
            {
                query = query.Where(b => b.ShowtimeID == showtimeId.Value);
            }
            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(b => b.Status == status);
            }

            var entities = await query.OrderByDescending(b => b.BookingTime).ToListAsync();
            return entities.Select(MapFromView).ToList();
        }

        public async Task<Booking?> GetByIdAsync(int id)
        {
            var entity = await _context.VwBookingDetails
                .FirstOrDefaultAsync(b => b.BookingID == id);

            return entity == null ? null : MapFromView(entity);
        }

        public async Task<List<Booking>> LookupByPhoneAsync(string phone)
        {
            var entities = await _context.VwBookingDetails
                .Where(b => b.CustomerPhone == phone && b.Status == "Confirmed")
                .OrderByDescending(b => b.BookingTime)
                .ToListAsync();

            return entities.Select(MapFromView).ToList();
        }

        public async Task<(bool Success, List<Booking> Bookings, string Message)> CreateBookingAsync(
            int showtimeId, List<int> seatIds, string customerName, string customerPhone)
        {
            // Dùng transaction với IsolationLevel Serializable để tránh race condition
            using var transaction = await _context.Database.BeginTransactionAsync(System.Data.IsolationLevel.Serializable);
            try
            {
                var showtime = await _context.Showtimes.FindAsync(showtimeId);
                if (showtime == null) return (false, new List<Booking>(), "Không tìm thấy xuất chiếu.");

                var roomSeats = await _context.Seats.Where(s => s.RoomID == showtime.RoomID).ToListAsync();
                var roomSeatIds = roomSeats.Select(s => s.SeatID).ToHashSet();
                
                var invalidSeats = seatIds.Where(id => !roomSeatIds.Contains(id)).ToList();
                if (invalidSeats.Any())
                    return (false, new List<Booking>(), $"Ghế không hợp lệ: {string.Join(", ", invalidSeats)}");

                // Kiểm tra ghế đã đặt chưa (trong transaction, DB lock sẽ đảm bảo tính toàn vẹn)
                var bookedSeatIds = await _context.Bookings
                    .Where(b => b.ShowtimeID == showtimeId && b.Status == "Confirmed")
                    .Select(b => b.SeatID)
                    .ToListAsync();

                var alreadyBooked = seatIds.Where(id => bookedSeatIds.Contains(id)).ToList();
                if (alreadyBooked.Any())
                {
                    var bookedNames = roomSeats
                        .Where(s => alreadyBooked.Contains(s.SeatID))
                        .Select(s => $"{s.SeatRow}{s.SeatNumber}")
                        .ToList();
                    return (false, new List<Booking>(), $"Ghế đã được đặt: {string.Join(", ", bookedNames)}");
                }

                var newEntities = new List<BookingEntity>();
                var now = DateTime.Now;

                foreach (var seatId in seatIds)
                {
                    newEntities.Add(new BookingEntity
                    {
                        ShowtimeID = showtimeId,
                        SeatID = seatId,
                        CustomerName = customerName,
                        CustomerPhone = customerPhone,
                        Status = "Confirmed",
                        BookingTime = now,
                        CreatedAt = now,
                        UpdatedAt = now
                    });
                }

                _context.Bookings.AddRange(newEntities);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                // Lấy thông tin đầy đủ trả về (như DTO cũ)
                var newBookingIds = newEntities.Select(e => e.BookingID).ToList();
                var resultEntities = await _context.VwBookingDetails
                    .Where(v => newBookingIds.Contains(v.BookingID))
                    .ToListAsync();

                return (true, resultEntities.Select(MapFromView).ToList(), $"Đặt vé thành công! ({newEntities.Count} ghế)");
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return (false, new List<Booking>(), $"Lỗi hệ thống: {ex.Message}");
            }
        }

        public async Task<(bool Success, Booking? Data, string Message)> CancelBookingAsync(int id)
        {
            var entity = await _context.Bookings.FindAsync(id);
            if (entity == null) return (false, null, "Không tìm thấy vé.");

            entity.Status = "Cancelled";
            entity.UpdatedAt = DateTime.Now;

            await _context.SaveChangesAsync();

            var viewEntity = await _context.VwBookingDetails.FirstOrDefaultAsync(v => v.BookingID == id);
            return (true, viewEntity != null ? MapFromView(viewEntity) : null, "Đã hủy vé thành công.");
        }

        private Booking MapFromView(VwBookingDetailEntity v)
        {
            return new Booking
            {
                BookingID = v.BookingID,
                ShowtimeID = v.ShowtimeID,
                SeatID = v.SeatID,
                CustomerName = v.CustomerName,
                CustomerPhone = v.CustomerPhone,
                Status = v.Status,
                BookingTime = v.BookingTime,
                MovieTitle = v.MovieTitle,
                RoomName = v.RoomName,
                SeatRow = v.SeatRow,
                SeatNumber = v.SeatNumber,
                SeatType = v.SeatType,
                StartTime = v.StartTime
            };
        }
    }
}
