using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace danentang.Data.Entities
{
    [Table("EquipmentSchedules")]
    public class EquipmentScheduleEntity
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int ScheduleID { get; set; }

        [Required]
        public int EquipmentID { get; set; }

        [MaxLength(255)]
        public string? EquipmentName { get; set; }

        public DateTime? LastMaintenanceDate { get; set; }
        public DateTime? NextMaintenanceDate { get; set; }
        public int MaintenanceIntervalDays { get; set; } = 90;
        public DateTime? WarrantyExpiry { get; set; }
        public DateTime? ShelfLifeExpiry { get; set; }

        [ForeignKey("EquipmentID")]
        public virtual EquipmentEntity? Equipment { get; set; }
    }
}
