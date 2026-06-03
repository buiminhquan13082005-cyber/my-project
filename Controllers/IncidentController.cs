using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using danentang.Models;
using danentang.Data;
using danentang.Data.Entities;

namespace danentang.Controllers
{
    /// <summary>
    /// Controller quản lý sự cố trong rạp - báo cáo và cập nhật trạng thái sự cố.
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class IncidentController : ControllerBase
    {
        private readonly CinemaDbContext _context;

        public IncidentController(CinemaDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// GET: api/incident - Lấy danh sách sự cố, hỗ trợ lọc theo trạng thái (Open, InProgress, Resolved).
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] string? status = null)
        {
            var query = _context.Incidents.AsQueryable();
            if (!string.IsNullOrEmpty(status))
                query = query.Where(i => i.Status == status);
            
            var list = await query.OrderByDescending(i => i.ReportedAt).ToListAsync();
            return Ok(list);
        }

        /// <summary>
        /// POST: api/incident - Tạo báo cáo sự cố mới.
        /// Tự động gán thời gian báo cáo và trạng thái "Open".
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] IncidentEntity incident)
        {
            var room = await _context.Rooms.FindAsync(incident.RoomID);
            if (room == null)
            {
                return BadRequest(new { message = "Phòng chiếu không tồn tại." });
            }

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                incident.ReportedAt = DateTime.Now;
                incident.Status = "Open";
                incident.RoomName = room.RoomName;
                
                _context.Incidents.Add(incident);

                // Tự động chuyển phòng sang trạng thái bảo trì
                room.RoomStatus = "Maintenance";

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(incident);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { message = "Lỗi khi lưu sự cố: " + ex.Message });
            }
        }

        /// <summary>
        /// PUT: api/incident/{id}/status - Cập nhật trạng thái sự cố (Open → InProgress → Resolved).
        /// </summary>
        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] StatusUpdateRequest req)
        {
            var inc = await _context.Incidents.FindAsync(id);
            if (inc == null) return NotFound();
            
            inc.Status = req.Status;
            await _context.SaveChangesAsync();
            return Ok(inc);
        }
    }

    /// <summary>
    /// Request model để cập nhật trạng thái sự cố.
    /// </summary>
    public class StatusUpdateRequest
    {
        public string Status { get; set; } = string.Empty;
    }
}
