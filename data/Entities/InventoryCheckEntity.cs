using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace danentang.Data.Entities
{
    [Table("InventoryChecks")]
    public class InventoryCheckEntity
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int CheckID { get; set; }

        [Required]
        public int EquipmentID { get; set; }

        [MaxLength(255)]
        public string? EquipmentName { get; set; }

        public int SystemQuantity { get; set; } = 0;
        public int ActualQuantity { get; set; } = 0;
        public int Discrepancy { get; set; } = 0;

        public string? Notes { get; set; }

        [Required]
        public int CheckedByEmployeeID { get; set; }

        [MaxLength(150)]
        public string? CheckedByName { get; set; }

        public DateTime CheckDate { get; set; } = DateTime.Now;

        [ForeignKey("EquipmentID")]
        public virtual EquipmentEntity? Equipment { get; set; }
    }
}
