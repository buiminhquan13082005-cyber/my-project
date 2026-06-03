using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace danentang.Data.Entities
{
    /// <summary>
    /// EF Core entity ánh xạ bảng Showtimes.
    /// Navigation properties sang Movie và Room để lấy Title/RoomName mà không cần JOIN thủ công.
    /// </summary>
    [Table("Showtimes")]
    public class ShowtimeEntity
    {
        [Key]
        public int ShowtimeID { get; set; }

        public int MovieID { get; set; }
        public int RoomID { get; set; }

        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }

        /// <summary>Giá vé mặc định của suất chiếu này.</summary>
        [Column(TypeName = "decimal(10,2)")]
        public decimal Price { get; set; }

        /// <summary>ENUM: 'Scheduled', 'Cancelled', 'Finished'</summary>
        [MaxLength(20)]
        public string Status { get; set; } = "Scheduled";

        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public DateTime UpdatedAt { get; set; } = DateTime.Now;

        // Navigation
        [ForeignKey(nameof(MovieID))]
        public MovieEntity? Movie { get; set; }

        [ForeignKey(nameof(RoomID))]
        public RoomEntity? Room { get; set; }
    }
}
