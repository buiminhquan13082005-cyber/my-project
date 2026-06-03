using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Linq;
using System.Threading.Tasks;
using System;
using danentang.Models;
using danentang.Data;
using danentang.Data.Entities;

namespace danentang.Controllers
{
    /// <summary>
    /// Controller quản lý chấm công nhân viên (Check-in / Check-out).
    /// Yêu cầu xác thực JWT để sử dụng.
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class AttendanceController : ControllerBase
    {
        private readonly CinemaDbContext _context;

        public AttendanceController(CinemaDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// POST: api/attendance/check-in
        /// Ghi nhận thời điểm nhân viên bắt đầu ca làm việc.
        /// Kiểm tra nếu nhân viên chưa check-out ca trước thì không cho check-in.
        /// </summary>
        [HttpPost("check-in")]
        public async Task<IActionResult> CheckIn([FromBody] CheckInRequest request)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            bool hasOpenCheckin = await _context.Attendances
                .AnyAsync(a => a.EmployeeID == userId && a.CheckOutTime == null);

            if (hasOpenCheckin)
                return BadRequest("Bạn chưa Check-out ca trước!");

            var entry = new AttendanceEntity
            {
                EmployeeID = userId,
                ShiftID = request.ShiftID,
                CheckInMethod = request.Method,
                CheckInTime = DateTime.Now
            };

            _context.Attendances.Add(entry);
            await _context.SaveChangesAsync();

            return Ok(entry);
        }

        /// <summary>
        /// POST: api/attendance/check-out
        /// Ghi nhận thời điểm nhân viên kết thúc ca làm việc.
        /// Tự động tính tổng số giờ làm việc dựa trên thời gian check-in và check-out.
        /// </summary>
        [HttpPost("check-out")]
        public async Task<IActionResult> CheckOut()
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            var attendance = await _context.Attendances
                .Where(a => a.EmployeeID == userId && a.CheckOutTime == null)
                .OrderByDescending(a => a.CheckInTime)
                .FirstOrDefaultAsync();

            if (attendance == null) return BadRequest("Không thấy lượt vào!");

            attendance.CheckOutTime = DateTime.Now;
            var diff = attendance.CheckOutTime.Value - attendance.CheckInTime;

            attendance.TotalHours = (decimal)Math.Round(diff.TotalHours, 2);

            await _context.SaveChangesAsync();
            return Ok(attendance);
        }
    }
}