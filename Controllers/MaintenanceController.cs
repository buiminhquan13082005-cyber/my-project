using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using danentang.Models;
using danentang.Data;
using danentang.Data.Entities;

namespace danentang.Controllers
{
    /// <summary>
    /// Controller quản lý bảo trì thiết bị - tạo yêu cầu, phân việc, ghi nhật ký và hoàn tất bảo trì.
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class MaintenanceController : ControllerBase
    {
        private readonly CinemaDbContext _context;

        public MaintenanceController(CinemaDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// GET: api/maintenance - Lấy danh sách yêu cầu bảo trì, hỗ trợ lọc theo trạng thái.
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] string? status = null, [FromQuery] string? priority = null, [FromQuery] string? type = null)
        {
            var query = _context.MaintenanceRequests.AsQueryable();
            if (!string.IsNullOrEmpty(status))
                query = query.Where(r => r.Status == status);
            if (!string.IsNullOrEmpty(priority))
                query = query.Where(r => r.Priority == priority);
            if (!string.IsNullOrEmpty(type))
                query = query.Where(r => r.RequestType == type);
            var requests = await query.OrderByDescending(r => r.CreatedAt).ToListAsync();
            return Ok(requests);
        }

        /// <summary>
        /// GET: api/maintenance/{id} - Lấy chi tiết yêu cầu bảo trì theo ID.
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var req = await _context.MaintenanceRequests.FindAsync(id);
            if (req == null) return NotFound(new { message = "Không tìm thấy yêu cầu." });
            return Ok(req);
        }

        /// <summary>
        /// POST: api/maintenance - Tạo yêu cầu bảo trì mới.
        /// Tự động gán trạng thái "Pending" và thời gian tạo.
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> CreateRequest([FromBody] MaintenanceRequestEntity request)
        {
            request.Status = "Pending";
            request.CreatedAt = DateTime.Now;
            _context.MaintenanceRequests.Add(request);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = request.RequestID }, request);
        }

        /// <summary>
        /// PUT: api/maintenance/{id}/assign - Phân công nhân viên kỹ thuật xử lý bảo trì.
        /// Chuyển trạng thái sang "Assigned".
        /// </summary>
        [HttpPut("{id}/assign")]
        [Authorize(Roles = "Manager")]
        public async Task<IActionResult> AssignTechnician(int id, [FromBody] AssignRequest assignReq)
        {
            var req = await _context.MaintenanceRequests.FindAsync(id);
            if (req == null) return NotFound();

            req.AssignedToEmployeeID = assignReq.EmployeeID;
            req.AssignedToName = assignReq.EmployeeName;
            req.Status = "Assigned";
            
            await _context.SaveChangesAsync();
            return Ok(req);
        }

        /// <summary>
        /// POST: api/maintenance/{id}/log - Ghi nhật ký bảo trì.
        /// Cập nhật trạng thái yêu cầu tùy theo hành động.
        /// </summary>
        [HttpPost("{id}/log")]
        public async Task<IActionResult> AddLog(int id, [FromBody] MaintenanceLogEntity log)
        {
            var req = await _context.MaintenanceRequests.FindAsync(id);
            if (req == null) return NotFound();

            log.RequestID = id;
            log.Timestamp = DateTime.Now;
            _context.MaintenanceLogs.Add(log);

            req.Status = (log.ActionTaken == "UsedSpare" || log.ActionTaken == "Replaced")
                ? "NeedReplacement" : "InProgress";

            await _context.SaveChangesAsync();
            return Ok(log);
        }

        /// <summary>
        /// PUT: api/maintenance/{id}/complete - Đánh dấu hoàn tất bảo trì.
        /// Cập nhật lịch bảo trì định kỳ và tự động đánh dấu sự cố liên kết là đã giải quyết.
        /// </summary>
        [HttpPut("{id}/complete")]
        public async Task<IActionResult> Complete(int id)
        {
            var req = await _context.MaintenanceRequests.FindAsync(id);
            if (req == null) return NotFound();

            req.Status = "Completed";
            req.CompletedAt = DateTime.Now;

            var sch = await _context.EquipmentSchedules.FirstOrDefaultAsync(s => s.EquipmentID == req.EquipmentID);
            if (sch != null)
            {
                sch.LastMaintenanceDate = DateTime.Now;
                sch.NextMaintenanceDate = DateTime.Now.AddDays(sch.MaintenanceIntervalDays);
            }

            // Tự động đánh dấu sự cố liên kết là đã giải quyết và khôi phục trạng thái phòng chiếu
            if (req.IncidentID.HasValue)
            {
                var incident = await _context.Incidents.FindAsync(req.IncidentID.Value);
                if (incident != null)
                {
                    if (incident.Status != "Resolved")
                    {
                        incident.Status = "Resolved";
                    }

                    // Kiểm tra xem phòng đó còn bất kỳ sự cố chưa giải quyết nào khác không
                    var hasOtherActiveIncidents = await _context.Incidents.AnyAsync(i => 
                        i.RoomID == incident.RoomID && 
                        i.IncidentID != incident.IncidentID && 
                        i.Status != "Resolved");

                    if (!hasOtherActiveIncidents)
                    {
                        var room = await _context.Rooms.FindAsync(incident.RoomID);
                        // Chỉ khôi phục về Active nếu trạng thái phòng hiện tại đang là Maintenance
                        if (room != null && room.RoomStatus == "Maintenance")
                        {
                            room.RoomStatus = "Active";
                        }
                    }
                }
            }

            await _context.SaveChangesAsync();
            return Ok(req);
        }

        /// <summary>
        /// GET: api/maintenance/{id}/logs - Lấy danh sách nhật ký bảo trì của yêu cầu.
        /// </summary>
        [HttpGet("{id}/logs")]
        public async Task<IActionResult> GetLogs(int id)
        {
            var logs = await _context.MaintenanceLogs
                .Where(l => l.RequestID == id)
                .OrderByDescending(l => l.Timestamp)
                .ToListAsync();
            return Ok(logs);
        }

        /// <summary>
        /// POST: api/maintenance/scan - Quét và tự động tạo yêu cầu bảo trì định kỳ.
        /// Kiểm tra lịch bảo trì trong vòng 7 ngày tới và tạo yêu cầu mới nếu chưa có.
        /// </summary>
        [HttpPost("scan")]
        public async Task<IActionResult> ScanForMaintenance()
        {
            var due = await _context.EquipmentSchedules
                .Where(s => s.NextMaintenanceDate <= DateTime.Now.AddDays(7))
                .ToListAsync();
            
            var created = new List<MaintenanceRequestEntity>();

            foreach (var s in due)
            {
                bool hasPending = await _context.MaintenanceRequests
                    .AnyAsync(r => r.EquipmentID == s.EquipmentID && r.Status != "Completed" && r.RequestType == "Scheduled");
                
                if (!hasPending)
                {
                    var nr = new MaintenanceRequestEntity
                    {
                        EquipmentID = s.EquipmentID,
                        EquipmentName = s.EquipmentName,
                        RequestType = "Scheduled",
                        Description = $"Bảo trì định kỳ - Hạn: {s.NextMaintenanceDate:dd/MM/yyyy}",
                        Priority = s.NextMaintenanceDate <= DateTime.Now ? "High" : "Normal",
                        Status = "Pending",
                        CreatedAt = DateTime.Now
                    };
                    _context.MaintenanceRequests.Add(nr);
                    created.Add(nr);
                }
            }
            
            if (created.Any())
            {
                await _context.SaveChangesAsync();
            }
            
            return Ok(new { dueCount = due.Count, newRequests = created.Count, requests = created });
        }

        /// <summary>
        /// DELETE: api/maintenance/{id} - Xóa một yêu cầu bảo trì.
        /// </summary>
        [HttpDelete("{id}")]
        [Authorize(Roles = "Manager")]
        public async Task<IActionResult> Delete(int id)
        {
            var req = await _context.MaintenanceRequests.FindAsync(id);
            if (req == null) return NotFound(new { message = "Không tìm thấy yêu cầu bảo trì." });

            // Xóa tất cả nhật ký bảo trì liên kết để tránh vi phạm khóa ngoại
            var logs = await _context.MaintenanceLogs.Where(l => l.RequestID == id).ToListAsync();
            if (logs.Any())
            {
                _context.MaintenanceLogs.RemoveRange(logs);
            }

            _context.MaintenanceRequests.Remove(req);
            await _context.SaveChangesAsync();
            return Ok(new { status = "success", message = "Đã xóa lịch sử bảo trì." });
        }
    }

    /// <summary>
    /// Request model để phân công nhân viên xử lý bảo trì.
    /// </summary>
    public class AssignRequest
    {
        public int EmployeeID { get; set; }
        public string EmployeeName { get; set; } = string.Empty;
    }
}
