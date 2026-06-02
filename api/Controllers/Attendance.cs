using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using System.Text.Json;
using danentang.Services;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class AttendanceController : ControllerBase
{
    private readonly JsonFileService _fileService;
    private readonly string _path = "attendance.json";

    // Tiêm Service vào đây
    public AttendanceController(JsonFileService fileService)
    {
        _fileService = fileService;
    }

    [HttpPost("check-in")]
    public IActionResult CheckIn([FromBody] CheckInRequest request)
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value);

        // Dùng Service để lấy dữ liệu
        var list = _fileService.GetData<Attendance>(_path);

        if (list.Any(a => a.EmployeeID == userId && a.CheckOutTime == null))
            return BadRequest("Bạn chưa Check-out ca trước!");

        var entry = new Attendance
        {
            AttendanceID = list.Count + 1,
            EmployeeID = userId,
            ShiftID = request.ShiftID,
            CheckInMethod = request.Method,
            CheckInTime = DateTime.Now
        };

        list.Add(entry);

        // Dùng Service để lưu dữ liệu
        _fileService.SaveData(_path, list);

        return Ok(entry);
    }

    [HttpPost("check-out")]
    public IActionResult CheckOut()
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value);
        var list = _fileService.GetData<Attendance>(_path);

        var attendance = list.LastOrDefault(a => a.EmployeeID == userId && a.CheckOutTime == null);
        if (attendance == null) return BadRequest("Không thấy lượt vào!");

        attendance.CheckOutTime = DateTime.Now;
        var diff = attendance.CheckOutTime.Value - attendance.CheckInTime;

        // Tính toán: $$TotalHours = \frac{Minutes}{60}$$
        attendance.TotalHours = (decimal)Math.Round(diff.TotalHours, 2);

        _fileService.SaveData(_path, list);
        return Ok(attendance);
    }
}