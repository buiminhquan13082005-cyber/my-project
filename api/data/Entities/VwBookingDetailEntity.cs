using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace danentang.Data.Entities
{
    /// <summary>
    /// Keyless entity ánh xạ VIEW vw_BookingDetails trong MySQL.
    /// View này JOIN Bookings + Showtimes + Movies + Rooms + Seats
    /// để trả về đầy đủ thông tin denormalized — đúng cấu trúc mà
    /// controller BookingController đang mong đợi (Booking DTO).
    /// </summary>
    public class VwBookingDetailEntity
    {
        public int BookingID { get; set; }
        public int ShowtimeID { get; set; }
        public int SeatID { get; set; }

        [MaxLength(150)]
        public string CustomerName { get; set; } = string.Empty;

        [MaxLength(20)]
        public string CustomerPhone { get; set; } = string.Empty;

        [MaxLength(20)]
        public string Status { get; set; } = string.Empty;

        public DateTime BookingTime { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal? TotalPrice { get; set; }

        // Thông tin từ Movies
        public string? MovieTitle { get; set; }

        // Thông tin từ Rooms
        public string? RoomName { get; set; }

        // Thông tin từ Seats
        [MaxLength(2)]
        public string? SeatRow { get; set; }
        public int? SeatNumber { get; set; }

        [MaxLength(20)]
        public string? SeatType { get; set; }

        // Thông tin từ Showtimes
        public DateTime? StartTime { get; set; }
        public DateTime? EndTime { get; set; }
    }
}
