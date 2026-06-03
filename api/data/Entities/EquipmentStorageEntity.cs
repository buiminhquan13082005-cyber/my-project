using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace danentang.Data.Entities
{
    [Table("EquipmentStorages")]
    public class EquipmentStorageEntity
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int StorageID { get; set; }

        [Required]
        public int EquipmentID { get; set; }

        public int CurrentQuantity { get; set; } = 0;

        [MaxLength(50)]
        public string ConditionStatus { get; set; } = "Good";

        public int MinRequiredQuantity { get; set; } = 1;

        [MaxLength(255)]
        public string? WarehouseLocation { get; set; }

        [ForeignKey("EquipmentID")]
        public virtual EquipmentEntity? Equipment { get; set; }
    }
}
