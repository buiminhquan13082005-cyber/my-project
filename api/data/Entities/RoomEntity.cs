using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace danentang.Data.Entities
{
    /// <summary>EF Core entity ánh xạ bảng Rooms.</summary>
    [Table("Rooms")]
    public class RoomEntity
    {
        [Key]
        public int RoomID { get; set; }

        [Required, MaxLength(100)]
        public string RoomName { get; set; } = string.Empty;

        public int Capacity { get; set; }

        /// <summary>ENUM: 'Active', 'Inactive', 'Maintenance'</summary>
        [MaxLength(20)]
        public string RoomStatus { get; set; } = "Active";

        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public DateTime UpdatedAt { get; set; } = DateTime.Now;

        // Navigation: một phòng có nhiều ghế
        public ICollection<SeatEntity> Seats { get; set; } = new List<SeatEntity>();
    }
}
