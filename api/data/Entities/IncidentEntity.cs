using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace danentang.Data.Entities
{
    [Table("Incidents")]
    public class IncidentEntity
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int IncidentID { get; set; }

        [Required]
        public int EmployeeID { get; set; }

        [MaxLength(150)]
        public string? EmployeeName { get; set; }

        [Required]
        public int RoomID { get; set; }

        [MaxLength(100)]
        public string? RoomName { get; set; }

        public string? Description { get; set; }

        public DateTime ReportedAt { get; set; } = DateTime.Now;

        [MaxLength(50)]
        public string Status { get; set; } = "Open";

        [ForeignKey("RoomID")]
        public virtual RoomEntity? Room { get; set; }
    }
}
