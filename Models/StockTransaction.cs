namespace danentang.Models
{
    public class StockTransaction
    {
        public int TransactionID { get; set; }
        public int EquipmentID { get; set; }
        public string EquipmentName { get; set; } = string.Empty;
        public string TransactionType { get; set; } = "Import"; // "Import", "Export", "Damaged", "Disposed"
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public string Supplier { get; set; } = string.Empty;
        public int EmployeeID { get; set; }
        public string EmployeeName { get; set; } = string.Empty;
        public string Reason { get; set; } = string.Empty;
        public DateTime TransactionDate { get; set; } = DateTime.Now;
    }
}
