namespace danentang.Models
{
    public class Room
    {
        public int RoomID { get; set; }
        public string RoomName { get; set; } = string.Empty;
        public int Capacity { get; set; }
        public string RoomStatus { get; set; } = "Active"; // "Active", "Maintenance", "Inactive"
    }
}
