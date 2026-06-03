namespace danentang.Models
{
    public class InventoryCheck
    {
        public int CheckID { get; set; }
        public int EquipmentID { get; set; }
        public string EquipmentName { get; set; } = string.Empty;
        public int SystemQuantity { get; set; }
        public int ActualQuantity { get; set; }
        public int Discrepancy { get; set; }
        public string Notes { get; set; } = string.Empty;
        public int CheckedByEmployeeID { get; set; }
        public string CheckedByName { get; set; } = string.Empty;
        public DateTime CheckDate { get; set; } = DateTime.Now;
    }
}
