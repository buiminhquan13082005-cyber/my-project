namespace danentang.Models
{
    public class MaintenanceLog
    {
        public int LogID { get; set; }
        public int RequestID { get; set; }
        public int EmployeeID { get; set; }
        public string EmployeeName { get; set; } = string.Empty;
        public string ActionTaken { get; set; } = string.Empty; // "Inspected", "Repaired", "Replaced", "UsedSpare"
        public string Notes { get; set; } = string.Empty;
        public bool IsResolved { get; set; } = false;
        public DateTime Timestamp { get; set; } = DateTime.Now;
    }
}
