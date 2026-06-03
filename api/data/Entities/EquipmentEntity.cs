using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace danentang.Data.Entities
{
    [Table("Equipments")]
    public class EquipmentEntity
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int EquipmentID { get; set; }

        [Required]
        [MaxLength(255)]
        public string EquipmentName { get; set; } = string.Empty;

        [MaxLength(100)]
        public string? Category { get; set; }

        public string? TechnicalSpecs { get; set; }

        [MaxLength(150)]
        public string? Manufacturer { get; set; }

        [MaxLength(50)]
        public string? Unit { get; set; }
    }
}
