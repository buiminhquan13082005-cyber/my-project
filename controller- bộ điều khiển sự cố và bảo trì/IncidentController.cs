using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using danentang.Models;
using danentang.Services;

namespace danentang.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class IncidentController : ControllerBase
    {
        private readonly JsonFileService _fs;
        private readonly string _path = "data/incidents.json";

        public IncidentController(JsonFileService fs) { _fs = fs; }

        [HttpGet]
        public IActionResult GetAll([FromQuery] string? status = null)
        {
            var list = _fs.GetData<Incident>(_path);
            if (!string.IsNullOrEmpty(status))
                list = list.Where(i => i.Status.Equals(status, StringComparison.OrdinalIgnoreCase)).ToList();
            return Ok(list.OrderByDescending(i => i.ReportedAt));
        }

        [HttpPost]
        public IActionResult Create([FromBody] Incident incident)
        {
            var list = _fs.GetData<Incident>(_path);
            incident.IncidentID = list.Count > 0 ? list.Max(x => x.IncidentID) + 1 : 1;
            incident.ReportedAt = DateTime.Now;
            incident.Status = "Open";
            list.Add(incident);
            _fs.SaveData(_path, list);
            return Ok(incident);
        }

        [HttpPut("{id}/status")]
        public IActionResult UpdateStatus(int id, [FromBody] StatusUpdateRequest req)
        {
            var list = _fs.GetData<Incident>(_path);
            var inc = list.FirstOrDefault(x => x.IncidentID == id);
            if (inc == null) return NotFound();
            inc.Status = req.Status;
            _fs.SaveData(_path, list);
            return Ok(inc);
        }
    }

    public class StatusUpdateRequest
    {
        public string Status { get; set; } = string.Empty;
    }
}
