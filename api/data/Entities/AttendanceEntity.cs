using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace danentang.Data.Entities
{
    [Table("Attendances")]
    public class AttendanceEntity
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int AttendanceID { get; set; }

        [Required]
        public int EmployeeID { get; set; }

        [Required]
        public int ShiftID { get; set; }

        [Required]
        public DateTime CheckInTime { get; set; }

        public DateTime? CheckOutTime { get; set; }

        [MaxLength(50)]
        public string CheckInMethod { get; set; } = "QR";

        [Column(TypeName = "decimal(5,2)")]
        public decimal TotalHours { get; set; } = 0.00m;
    }
}
