public class CheckInRequest
{
    public int ShiftID { get; set; }
    public string Method { get; set; } // App gửi lên là "QR" hoặc "GPS"
}