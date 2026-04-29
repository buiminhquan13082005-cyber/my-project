using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using danentang.Models;
using danentang.Services;

namespace danentang.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ShowtimeController : ControllerBase
    {
        private readonly JsonFileService _fs;
        private readonly string _path = "data/showtimes.json";

        public ShowtimeController(JsonFileService fs) { _fs = fs; }

        [HttpGet]
        public IActionResult GetAll([FromQuery] string? date = null, [FromQuery] int? roomId = null)
        {
            var list = _fs.GetData<Showtime>(_path);
            if (!string.IsNullOrEmpty(date) && DateTime.TryParse(date, out var d))
                list = list.Where(s => s.StartTime.Date == d.Date).ToList();
            if (roomId.HasValue)
                list = list.Where(s => s.RoomID == roomId.Value).ToList();
            return Ok(list.OrderBy(s => s.StartTime));
        }

        [HttpGet("{id}")]
        public IActionResult GetById(int id)
        {
            var s = _fs.GetData<Showtime>(_path).FirstOrDefault(x => x.ShowtimeID == id);
            if (s == null) return NotFound();
            return Ok(s);
        }

        [HttpPost]
        public IActionResult Create([FromBody] Showtime showtime)
        {
            var list = _fs.GetData<Showtime>(_path);

            // Kiểm tra trùng lịch chiếu
            var conflict = list.Any(s =>
                s.RoomID == showtime.RoomID &&
                s.StartTime < showtime.EndTime &&
                s.EndTime > showtime.StartTime);
            if (conflict) return BadRequest(new { message = "Trùng lịch chiếu trong phòng này!" });

            showtime.ShowtimeID = list.Count > 0 ? list.Max(x => x.ShowtimeID) + 1 : 1;
            list.Add(showtime);
            _fs.SaveData(_path, list);
            return Ok(showtime);
        }

        [HttpPut("{id}")]
        public IActionResult Update(int id, [FromBody] Showtime showtime)
        {
            var list = _fs.GetData<Showtime>(_path);
            var idx = list.FindIndex(x => x.ShowtimeID == id);
            if (idx == -1) return NotFound();
            showtime.ShowtimeID = id;
            list[idx] = showtime;
            _fs.SaveData(_path, list);
            return Ok(showtime);
        }

        [HttpDelete("{id}")]
        public IActionResult Delete(int id)
        {
            var list = _fs.GetData<Showtime>(_path);
            var s = list.FirstOrDefault(x => x.ShowtimeID == id);
            if (s == null) return NotFound();
            list.Remove(s);
            _fs.SaveData(_path, list);
            return Ok(new { message = "Đã xóa suất chiếu." });
        }

        // GET: api/showtime/today - Lịch chiếu hôm nay (cho nhân viên)
        [HttpGet("today")]
        public IActionResult GetToday()
        {
            var list = _fs.GetData<Showtime>(_path);
            var today = list.Where(s => s.StartTime.Date == DateTime.Today).OrderBy(s => s.StartTime);
            return Ok(today);
        }
    }
}
