public class Attendance
{
    public int AttendanceID { get; set; }
    public int EmployeeID { get; set; }
    public int ShiftID { get; set; }
    public DateTime CheckInTime { get; set; }
    public DateTime? CheckOutTime { get; set; }
    public string CheckInMethod { get; set; } // "QR", "GPS", "Face"
    public decimal? TotalHours { get; set; }
}