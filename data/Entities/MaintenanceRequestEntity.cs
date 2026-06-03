using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace danentang.Data.Entities
{
    [Table("MaintenanceRequests")]
    public class MaintenanceRequestEntity
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int RequestID { get; set; }

        [Required]
        public int EquipmentID { get; set; }

        [MaxLength(255)]
        public string? EquipmentName { get; set; }

        public int? ReportedByEmployeeID { get; set; }

        [Required]
        [MaxLength(150)]
        public string ReportedByName { get; set; } = string.Empty;

        public int? AssignedToEmployeeID { get; set; }

        [MaxLength(150)]
        public string? AssignedToName { get; set; }

        [MaxLength(50)]
        public string RequestType { get; set; } = "Scheduled";

        public string? Description { get; set; }

        [MaxLength(50)]
        public string Priority { get; set; } = "Normal";

        [MaxLength(50)]
        public string Status { get; set; } = "Pending";

        public int? IncidentID { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public DateTime? CompletedAt { get; set; }

        [ForeignKey("EquipmentID")]
        public virtual EquipmentEntity? Equipment { get; set; }
    }
}
