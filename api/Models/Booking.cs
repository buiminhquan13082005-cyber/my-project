namespace danentang.Models
{
    /// <summary>
    /// Model đặt vé - liên kết giữa Showtime và Seat.
    /// Mỗi booking đại diện cho 1 ghế được đặt trong 1 xuất chiếu cụ thể.
    /// </summary>
    public class Booking
    {
        public int BookingID { get; set; }
        public int ShowtimeID { get; set; }
        public int SeatID { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public string CustomerPhone { get; set; } = string.Empty;
        public string Status { get; set; } = "Confirmed"; // "Confirmed", "Cancelled"
        public DateTime BookingTime { get; set; } = DateTime.Now;

        // Thông tin hiển thị (denormalized)
        public string? MovieTitle { get; set; }
        public string? RoomName { get; set; }
        public string? SeatRow { get; set; }
        public int? SeatNumber { get; set; }
        public string? SeatType { get; set; }
        public DateTime? StartTime { get; set; }
    }
}
