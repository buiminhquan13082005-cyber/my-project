using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace danentang.Data.Entities
{
    /// <summary>EF Core entity ánh xạ bảng Seats.</summary>
    [Table("Seats")]
    public class SeatEntity
    {
        [Key]
        public int SeatID { get; set; }

        public int RoomID { get; set; }

        /// <summary>Hàng ghế: 'A', 'B', ... Lưu CHAR(2) trong DB.</summary>
        [Required, MaxLength(2)]
        public string SeatRow { get; set; } = string.Empty;

        public int SeatNumber { get; set; }

        /// <summary>ENUM: 'Standard', 'VIP', 'Couple', 'IMAX'</summary>
        [MaxLength(20)]
        public string SeatType { get; set; } = "Standard";

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        // Navigation
        [ForeignKey(nameof(RoomID))]
        public RoomEntity? Room { get; set; }
    }
}
