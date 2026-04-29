using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using danentang.Models;
using danentang.Services;

namespace danentang.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class MaintenanceController : ControllerBase
    {
        private readonly JsonFileService _fileService;
        private readonly string _requestPath = "data/maintenance_requests.json";
        private readonly string _logPath = "data/maintenance_logs.json";
        private readonly string _schedulePath = "data/equipment_schedules.json";

        public MaintenanceController(JsonFileService fileService)
        {
            _fileService = fileService;
        }

        [HttpGet]
        public IActionResult GetAll([FromQuery] string? status = null)
        {
            var requests = _fileService.GetData<MaintenanceRequest>(_requestPath);
            if (!string.IsNullOrEmpty(status))
                requests = requests.Where(r => r.Status.Equals(status, StringComparison.OrdinalIgnoreCase)).ToList();
            return Ok(requests.OrderByDescending(r => r.CreatedAt));
        }

        [HttpGet("{id}")]
        public IActionResult GetById(int id)
        {
            var requests = _fileService.GetData<MaintenanceRequest>(_requestPath);
            var req = requests.FirstOrDefault(r => r.RequestID == id);
            if (req == null) return NotFound(new { message = "Không tìm thấy yêu cầu." });
            return Ok(req);
        }

        [HttpPost]
        public IActionResult CreateRequest([FromBody] MaintenanceRequest request)
        {
            var requests = _fileService.GetData<MaintenanceRequest>(_requestPath);
            request.RequestID = requests.Count > 0 ? requests.Max(r => r.RequestID) + 1 : 1;
            request.Status = "Pending";
            request.CreatedAt = DateTime.Now;
            requests.Add(request);
            _fileService.SaveData(_requestPath, requests);
            return CreatedAtAction(nameof(GetById), new { id = request.RequestID }, request);
        }

        [HttpPut("{id}/assign")]
        public IActionResult AssignTechnician(int id, [FromBody] AssignRequest assignReq)
        {
            var requests = _fileService.GetData<MaintenanceRequest>(_requestPath);
            var req = requests.FirstOrDefault(r => r.RequestID == id);
            if (req == null) return NotFound();
            req.AssignedToEmployeeID = assignReq.EmployeeID;
            req.AssignedToName = assignReq.EmployeeName;
            req.Status = "Assigned";
            _fileService.SaveData(_requestPath, requests);
            return Ok(req);
        }

        [HttpPost("{id}/log")]
        public IActionResult AddLog(int id, [FromBody] MaintenanceLog log)
        {
            var requests = _fileService.GetData<MaintenanceRequest>(_requestPath);
            var req = requests.FirstOrDefault(r => r.RequestID == id);
            if (req == null) return NotFound();

            var logs = _fileService.GetData<MaintenanceLog>(_logPath);
            log.LogID = logs.Count > 0 ? logs.Max(l => l.LogID) + 1 : 1;
            log.RequestID = id;
            log.Timestamp = DateTime.Now;
            logs.Add(log);
            _fileService.SaveData(_logPath, logs);

            req.Status = (log.ActionTaken == "UsedSpare" || log.ActionTaken == "Replaced")
                ? "NeedReplacement" : "InProgress";
            _fileService.SaveData(_requestPath, requests);
            return Ok(log);
        }

        [HttpPut("{id}/complete")]
        public IActionResult Complete(int id)
        {
            var requests = _fileService.GetData<MaintenanceRequest>(_requestPath);
            var req = requests.FirstOrDefault(r => r.RequestID == id);
            if (req == null) return NotFound();

            req.Status = "Completed";
            req.CompletedAt = DateTime.Now;
            _fileService.SaveData(_requestPath, requests);

            var schedules = _fileService.GetData<EquipmentSchedule>(_schedulePath);
            var sch = schedules.FirstOrDefault(s => s.EquipmentID == req.EquipmentID);
            if (sch != null)
            {
                sch.LastMaintenanceDate = DateTime.Now;
                sch.NextMaintenanceDate = DateTime.Now.AddDays(sch.MaintenanceIntervalDays);
                _fileService.SaveData(_schedulePath, schedules);
            }
            return Ok(req);
        }

        [HttpGet("{id}/logs")]
        public IActionResult GetLogs(int id)
        {
            var logs = _fileService.GetData<MaintenanceLog>(_logPath);
            return Ok(logs.Where(l => l.RequestID == id).OrderByDescending(l => l.Timestamp));
        }

        [HttpPost("scan")]
        public IActionResult ScanForMaintenance()
        {
            var schedules = _fileService.GetData<EquipmentSchedule>(_schedulePath);
            var requests = _fileService.GetData<MaintenanceRequest>(_requestPath);
            var due = schedules.Where(s => s.NextMaintenanceDate <= DateTime.Now.AddDays(7)).ToList();
            var created = new List<MaintenanceRequest>();

            foreach (var s in due)
            {
                if (!requests.Any(r => r.EquipmentID == s.EquipmentID && r.Status != "Completed" && r.RequestType == "Scheduled"))
                {
                    var nr = new MaintenanceRequest
                    {
                        RequestID = requests.Count > 0 ? requests.Max(r => r.RequestID) + 1 : 1,
                        EquipmentID = s.EquipmentID,
                        EquipmentName = s.EquipmentName,
                        RequestType = "Scheduled",
                        Description = $"Bảo trì định kỳ - Hạn: {s.NextMaintenanceDate:dd/MM/yyyy}",
                        Priority = s.NextMaintenanceDate <= DateTime.Now ? "High" : "Normal",
                        Status = "Pending",
                        CreatedAt = DateTime.Now
                    };
                    requests.Add(nr);
                    created.Add(nr);
                }
            }
            if (created.Any()) _fileService.SaveData(_requestPath, requests);
            return Ok(new { dueCount = due.Count, newRequests = created.Count, requests = created });
        }
    }

    public class AssignRequest
    {
        public int EmployeeID { get; set; }
        public string EmployeeName { get; set; } = string.Empty;
    }
}
