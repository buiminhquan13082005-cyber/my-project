using danentang.Data;
using danentang.Data.Entities;
using danentang.Models;
using Microsoft.EntityFrameworkCore;

namespace danentang.Services.Cinema
{
    public class RoomRepository : IRoomRepository
    {
        private readonly CinemaDbContext _context;

        public RoomRepository(CinemaDbContext context)
        {
            _context = context;
        }

        public async Task<List<Room>> GetAllAsync()
        {
            var entities = await _context.Rooms.ToListAsync();
            return entities.Select(MapToModel).ToList();
        }

        public async Task<Room?> GetByIdAsync(int id)
        {
            var entity = await _context.Rooms.FindAsync(id);
            return entity == null ? null : MapToModel(entity);
        }

        public async Task<Room> CreateAsync(Room room)
        {
            var entity = new RoomEntity
            {
                RoomName = room.RoomName,
                Capacity = room.Capacity,
                RoomStatus = room.RoomStatus,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };

            _context.Rooms.Add(entity);
            await _context.SaveChangesAsync();
            return MapToModel(entity);
        }

        public async Task<Room?> UpdateAsync(int id, Room room)
        {
            var entity = await _context.Rooms.FindAsync(id);
            if (entity == null) return null;

            entity.RoomName = room.RoomName;
            entity.Capacity = room.Capacity;
            entity.RoomStatus = room.RoomStatus;
            entity.UpdatedAt = DateTime.Now;

            await _context.SaveChangesAsync();
            return MapToModel(entity);
        }

        public async Task<(bool Success, string Message)> DeleteAsync(int id)
        {
            var entity = await _context.Rooms.FindAsync(id);
            if (entity == null) return (false, "Không tìm thấy phòng chiếu.");

            var hasShowtimes = await _context.Showtimes.AnyAsync(s => s.RoomID == id);
            if (hasShowtimes) return (false, "Không thể xóa phòng đang có suất chiếu.");

            var hasIncidents = await _context.Incidents.AnyAsync(i => i.RoomID == id);
            if (hasIncidents) return (false, "Không thể xóa phòng chiếu này vì đang có lịch sử sự cố liên quan.");

            _context.Rooms.Remove(entity);
            await _context.SaveChangesAsync();
            return (true, "Xóa phòng thành công.");
        }

        public async Task<List<Seat>> GetSeatsByRoomIdAsync(int roomId)
        {
            var entities = await _context.Seats
                .Where(s => s.RoomID == roomId)
                .OrderBy(s => s.SeatRow)
                .ThenBy(s => s.SeatNumber)
                .ToListAsync();

            return entities.Select(e => new Seat
            {
                SeatID = e.SeatID,
                RoomID = e.RoomID,
                SeatRow = e.SeatRow,
                SeatNumber = e.SeatNumber,
                SeatType = e.SeatType
            }).ToList();
        }

        public async Task<(bool Success, int Capacity, string Message)> GenerateSeatsAsync(int roomId, int rows, int seatsPerRow, int vipRows)
        {
            var room = await _context.Rooms.FindAsync(roomId);
            if (room == null) return (false, 0, "Không tìm thấy phòng chiếu.");

            if (rows <= 0 || rows > 26)
                return (false, 0, "Số hàng phải từ 1 đến 26 (A-Z).");
            if (seatsPerRow <= 0)
                return (false, 0, "Số ghế mỗi hàng phải lớn hơn 0.");
            if (vipRows < 0 || vipRows > rows)
                return (false, 0, "Số hàng VIP không hợp lệ.");

            var hasBookings = await _context.Bookings.AnyAsync(b => b.Showtime.RoomID == roomId);
            if (hasBookings)
            {
                return (false, 0, "Phòng chiếu này đã có dữ liệu đặt vé. Không thể thay đổi sơ đồ ghế.");
            }

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {

                // Xóa ghế cũ
                var oldSeats = await _context.Seats.Where(s => s.RoomID == roomId).ToListAsync();
                _context.Seats.RemoveRange(oldSeats);
                await _context.SaveChangesAsync();

                // Tạo ghế mới
                var newSeats = new List<SeatEntity>();
                for (int r = 0; r < rows; r++)
                {
                    string row = ((char)('A' + r)).ToString();
                    for (int n = 1; n <= seatsPerRow; n++)
                    {
                        newSeats.Add(new SeatEntity
                        {
                            RoomID = roomId,
                            SeatRow = row,
                            SeatNumber = n,
                            SeatType = r >= rows - vipRows ? "VIP" : "Standard",
                            CreatedAt = DateTime.Now
                        });
                    }
                }

                _context.Seats.AddRange(newSeats);
                
                // Cập nhật Capacity
                room.Capacity = rows * seatsPerRow;
                room.UpdatedAt = DateTime.Now;

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return (true, room.Capacity, $"Đã tạo {room.Capacity} ghế.");
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return (false, 0, $"Lỗi tạo ghế: {ex.Message}");
            }
        }

        private Room MapToModel(RoomEntity entity)
        {
            return new Room
            {
                RoomID = entity.RoomID,
                RoomName = entity.RoomName,
                Capacity = entity.Capacity,
                RoomStatus = entity.RoomStatus
            };
        }
    }
}
