using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace danentang.Data.Entities
{
    [Table("StockTransactions")]
    public class StockTransactionEntity
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int TransactionID { get; set; }

        [Required]
        public int EquipmentID { get; set; }

        [MaxLength(255)]
        public string? EquipmentName { get; set; }

        [MaxLength(50)]
        public string TransactionType { get; set; } = "Import";

        public int Quantity { get; set; } = 0;

        [Column(TypeName = "decimal(12,2)")]
        public decimal UnitPrice { get; set; } = 0.00m;

        [MaxLength(255)]
        public string? Supplier { get; set; }

        [Required]
        public int EmployeeID { get; set; }

        [MaxLength(150)]
        public string? EmployeeName { get; set; }

        public string? Reason { get; set; }

        public DateTime TransactionDate { get; set; } = DateTime.Now;

        [ForeignKey("EquipmentID")]
        public virtual EquipmentEntity? Equipment { get; set; }
    }
}
