using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace danentang.Data.Entities
{
    /// <summary>
    /// EF Core entity ánh xạ bảng Bookings.
    /// Mỗi record = 1 ghế được đặt trong 1 suất chiếu.
    /// UNIQUE KEY (ShowtimeID, SeatID) trong DB đảm bảo không đặt trùng.
    /// </summary>
    [Table("Bookings")]
    public class BookingEntity
    {
        [Key]
        public int BookingID { get; set; }

        public int ShowtimeID { get; set; }
        public int SeatID { get; set; }

        [Required, MaxLength(150)]
        public string CustomerName { get; set; } = string.Empty;

        [Required, MaxLength(20)]
        public string CustomerPhone { get; set; } = string.Empty;

        /// <summary>ENUM: 'Pending', 'Confirmed', 'Cancelled', 'CheckedIn'</summary>
        [MaxLength(20)]
        public string Status { get; set; } = "Confirmed";

        public DateTime BookingTime { get; set; } = DateTime.Now;

        /// <summary>Giá vé tại thời điểm đặt — lưu để tránh thay đổi giá sau.</summary>
        [Column(TypeName = "decimal(10,2)")]
        public decimal? TotalPrice { get; set; }

        public string? Notes { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public DateTime UpdatedAt { get; set; } = DateTime.Now;

        // Navigation — dùng để JOIN lấy thông tin hiển thị
        [ForeignKey(nameof(ShowtimeID))]
        public ShowtimeEntity? Showtime { get; set; }

        [ForeignKey(nameof(SeatID))]
        public SeatEntity? Seat { get; set; }
    }
}
