using danentang.Data;
using danentang.Data.Entities;
using danentang.Models;
using Microsoft.EntityFrameworkCore;

namespace danentang.Services.Cinema
{
    public class ShowtimeRepository : IShowtimeRepository
    {
        private readonly CinemaDbContext _context;

        public ShowtimeRepository(CinemaDbContext context)
        {
            _context = context;
        }

        public async Task<List<Showtime>> GetAllAsync(DateTime? date = null, int? roomId = null)
        {
            var query = _context.Showtimes
                .Include(s => s.Movie)
                .Include(s => s.Room)
                .AsQueryable();

            if (date.HasValue)
            {
                query = query.Where(s => s.StartTime.Date == date.Value.Date);
            }

            if (roomId.HasValue)
            {
                query = query.Where(s => s.RoomID == roomId.Value);
            }

            var entities = await query.OrderBy(s => s.StartTime).ToListAsync();
            return entities.Select(MapToModel).ToList();
        }

        public async Task<Showtime?> GetByIdAsync(int id)
        {
            var entity = await _context.Showtimes
                .Include(s => s.Movie)
                .Include(s => s.Room)
                .FirstOrDefaultAsync(s => s.ShowtimeID == id);

            return entity == null ? null : MapToModel(entity);
        }

        public async Task<(bool Success, Showtime? Data, string Message)> CreateAsync(Showtime showtime)
        {
            if (showtime.EndTime <= showtime.StartTime)
                return (false, null, "Giờ kết thúc phải sau giờ bắt đầu.");

            if (showtime.StartTime < DateTime.Now)
                return (false, null, "Không thể tạo suất chiếu trong quá khứ.");

            var movie = await _context.Movies.FindAsync(showtime.MovieID);
            if (movie == null) return (false, null, "Phim không tồn tại.");

            var room = await _context.Rooms.FindAsync(showtime.RoomID);
            if (room == null) return (false, null, "Phòng chiếu không tồn tại.");

            if (room.RoomStatus != "Active")
                return (false, null, "Không thể xếp lịch vào phòng đang bảo trì hoặc ngừng hoạt động.");

            if (movie.ReleaseDate.HasValue && showtime.StartTime.Date < movie.ReleaseDate.Value.Date)
                return (false, null, "Không thể tạo suất chiếu trước ngày công chiếu của phim.");

            if (movie.EndDate.HasValue && showtime.StartTime.Date > movie.EndDate.Value.Date)
                return (false, null, "Không thể tạo suất chiếu sau ngày kết thúc của phim.");

            // Kiểm tra trùng lịch chiếu
            var conflict = await _context.Showtimes.AnyAsync(s =>
                s.RoomID == showtime.RoomID &&
                s.StartTime < showtime.EndTime &&
                s.EndTime > showtime.StartTime);

            if (conflict)
            {
                return (false, null, "Trùng lịch chiếu trong phòng này!");
            }

            var entity = new ShowtimeEntity
            {
                MovieID = showtime.MovieID,
                RoomID = showtime.RoomID,
                StartTime = showtime.StartTime,
                EndTime = showtime.EndTime,
                Price = 0, // Mặc định từ Model cũ chưa có Price, hoặc lấy từ req nếu có
                Status = "Scheduled",
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };

            _context.Showtimes.Add(entity);
            await _context.SaveChangesAsync();
            
            // Reload with includes
            return (true, await GetByIdAsync(entity.ShowtimeID), "Tạo thành công");
        }

        public async Task<(bool Success, Showtime? Data, string Message)> UpdateAsync(int id, Showtime showtime)
        {
            var entity = await _context.Showtimes.FindAsync(id);
            if (entity == null) return (false, null, "Không tìm thấy suất chiếu.");

            if (entity.StartTime <= DateTime.Now)
                return (false, null, "Không thể sửa suất chiếu đã bắt đầu hoặc kết thúc.");

            if (showtime.EndTime <= showtime.StartTime)
                return (false, null, "Giờ kết thúc phải sau giờ bắt đầu.");

            if (showtime.StartTime < DateTime.Now)
                return (false, null, "Không thể dời suất chiếu về quá khứ.");

            var movie = await _context.Movies.FindAsync(showtime.MovieID);
            if (movie == null) return (false, null, "Phim không tồn tại.");

            var room = await _context.Rooms.FindAsync(showtime.RoomID);
            if (room == null) return (false, null, "Phòng chiếu không tồn tại.");

            if (room.RoomStatus != "Active")
                return (false, null, "Không thể xếp lịch vào phòng đang bảo trì hoặc ngừng hoạt động.");

            if (movie.ReleaseDate.HasValue && showtime.StartTime.Date < movie.ReleaseDate.Value.Date)
                return (false, null, "Không thể tạo suất chiếu trước ngày công chiếu của phim.");

            if (movie.EndDate.HasValue && showtime.StartTime.Date > movie.EndDate.Value.Date)
                return (false, null, "Không thể tạo suất chiếu sau ngày kết thúc của phim.");

            var conflict = await _context.Showtimes.AnyAsync(s =>
                s.ShowtimeID != id &&
                s.RoomID == showtime.RoomID &&
                s.StartTime < showtime.EndTime &&
                s.EndTime > showtime.StartTime);

            if (conflict)
                return (false, null, "Trùng lịch chiếu trong phòng này!");

            entity.MovieID = showtime.MovieID;
            entity.RoomID = showtime.RoomID;
            entity.StartTime = showtime.StartTime;
            entity.EndTime = showtime.EndTime;
            entity.UpdatedAt = DateTime.Now;

            await _context.SaveChangesAsync();
            return (true, await GetByIdAsync(id), "Cập nhật thành công.");
        }

        public async Task<(bool Success, string Message)> DeleteAsync(int id)
        {
            var entity = await _context.Showtimes.FindAsync(id);
            if (entity == null) return (false, "Không tìm thấy suất chiếu.");

            if (entity.StartTime <= DateTime.Now)
                return (false, "Không thể xóa suất chiếu đã bắt đầu hoặc kết thúc.");

            var hasBookings = await _context.Bookings.AnyAsync(b => b.ShowtimeID == id);
            if (hasBookings)
                return (false, "Không thể xóa vì suất chiếu này đã có khách đặt vé.");

            _context.Showtimes.Remove(entity);
            await _context.SaveChangesAsync();
            return (true, "Xóa suất chiếu thành công.");
        }

        public async Task<List<Showtime>> GetTodayShowtimesAsync()
        {
            return await GetAllAsync(date: DateTime.Today);
        }

        private Showtime MapToModel(ShowtimeEntity entity)
        {
            return new Showtime
            {
                ShowtimeID = entity.ShowtimeID,
                MovieID = entity.MovieID,
                MovieTitle = entity.Movie?.Title ?? "Unknown",
                RoomID = entity.RoomID,
                RoomName = entity.Room?.RoomName ?? "Unknown",
                StartTime = entity.StartTime,
                EndTime = entity.EndTime
            };
        }
    }
}
