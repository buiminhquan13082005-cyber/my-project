namespace danentang.Models
{
    public class EquipmentSchedule
    {
        public int ScheduleID { get; set; }
        public int EquipmentID { get; set; }
        public string EquipmentName { get; set; } = string.Empty;
        public DateTime LastMaintenanceDate { get; set; }
        public DateTime NextMaintenanceDate { get; set; }
        public int MaintenanceIntervalDays { get; set; } = 90; // Mặc định 3 tháng
        public DateTime? WarrantyExpiry { get; set; }
        public DateTime? ShelfLifeExpiry { get; set; } // Hạn sử dụng
    }
}
