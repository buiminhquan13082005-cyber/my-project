namespace danentang.Models
{
    public class Incident
    {
        public int IncidentID { get; set; }
        public int EmployeeID { get; set; }
        public string EmployeeName { get; set; } = string.Empty;
        public int RoomID { get; set; }
        public string RoomName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime ReportedAt { get; set; } = DateTime.Now;
        public string Status { get; set; } = "Open"; // "Open", "InProgress", "Resolved"
    }
}
