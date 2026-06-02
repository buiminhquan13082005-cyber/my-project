namespace danentang.Models
{
    public class Seat
    {
        public int SeatID { get; set; }
        public int RoomID { get; set; }
        public string SeatRow { get; set; } = string.Empty; // "A", "B", "C"...
        public int SeatNumber { get; set; }
        public string SeatType { get; set; } = "Standard"; // "Standard", "VIP", "Couple"
    }
}
