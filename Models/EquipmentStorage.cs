namespace danentang.Models
{
    public class EquipmentStorage
    {
        public int StorageID { get; set; }
        public int EquipmentID { get; set; }
        public int CurrentQuantity { get; set; }
        public string ConditionStatus { get; set; } = "Good"; // "Good", "Damaged", "NeedMaintenance"
        public int MinRequiredQuantity { get; set; }
        public string WarehouseLocation { get; set; } = string.Empty;
    }
}
