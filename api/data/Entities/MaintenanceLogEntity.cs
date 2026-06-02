using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace danentang.Data.Entities
{
    [Table("MaintenanceLogs")]
    public class MaintenanceLogEntity
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int LogID { get; set; }

        [Required]
        public int RequestID { get; set; }

        [Required]
        public int EmployeeID { get; set; }

        [MaxLength(150)]
        public string? EmployeeName { get; set; }

        [MaxLength(100)]
        public string? ActionTaken { get; set; }

        public string? Notes { get; set; }

        public bool IsResolved { get; set; } = false;

        public DateTime Timestamp { get; set; } = DateTime.Now;

        [ForeignKey("RequestID")]
        public virtual MaintenanceRequestEntity? Request { get; set; }
    }
}
