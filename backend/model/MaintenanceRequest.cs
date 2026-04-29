namespace danentang.Models
{
    public class MaintenanceRequest
    {
        public int RequestID { get; set; }
        public int EquipmentID { get; set; }
        public string EquipmentName { get; set; } = string.Empty;
        public int? ReportedByEmployeeID { get; set; }
        public string ReportedByName { get; set; } = string.Empty;
        public int? AssignedToEmployeeID { get; set; }
        public string AssignedToName { get; set; } = string.Empty;
        public string RequestType { get; set; } = "Scheduled"; // "Scheduled" (định kỳ) hoặc "Emergency" (hỏng bất ngờ)
        public string Description { get; set; } = string.Empty;
        public string Priority { get; set; } = "Normal"; // "Low", "Normal", "High", "Critical"
        public string Status { get; set; } = "Pending"; // "Pending", "Assigned", "InProgress", "NeedReplacement", "Completed"
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public DateTime? CompletedAt { get; set; }
    }
}
