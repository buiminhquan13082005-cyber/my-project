using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using danentang.Models;
using danentang.Services.Cinema;

namespace danentang.Controllers
{
    /// <summary>
    /// Controller quản lý suất chiếu phim - CRUD lịch chiếu và kiểm tra trùng lịch.
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ShowtimeController : ControllerBase
    {
        private readonly IShowtimeRepository _repo;

        public ShowtimeController(IShowtimeRepository repo) { _repo = repo; }

        /// <summary>
        /// GET: api/showtime - Lấy danh sách suất chiếu.
        /// Hỗ trợ lọc theo ngày (date) và phòng chiếu (roomId).
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] string? date = null, [FromQuery] int? roomId = null)
        {
            DateTime? parsedDate = null;
            if (!string.IsNullOrEmpty(date) && DateTime.TryParse(date, out var d))
                parsedDate = d;

            var list = await _repo.GetAllAsync(parsedDate, roomId);
            return Ok(list);
        }

        /// <summary>
        /// GET: api/showtime/{id} - Lấy chi tiết suất chiếu theo ID.
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var s = await _repo.GetByIdAsync(id);
            if (s == null) return NotFound();
            return Ok(s);
        }

        /// <summary>
        /// POST: api/showtime - Tạo suất chiếu mới.
        /// Kiểm tra trùng lịch chiếu trong cùng phòng trước khi tạo.
        /// </summary>
        [HttpPost]
        [Authorize(Roles = "Manager")]
        public async Task<IActionResult> Create([FromBody] Showtime showtime)
        {
            var result = await _repo.CreateAsync(showtime);
            if (!result.Success) return BadRequest(new { message = result.Message });
            return Ok(result.Data);
        }

        /// <summary>
        /// PUT: api/showtime/{id} - Cập nhật thông tin suất chiếu theo ID.
        /// </summary>
        [HttpPut("{id}")]
        [Authorize(Roles = "Manager")]
        public async Task<IActionResult> Update(int id, [FromBody] Showtime showtime)
        {
            var result = await _repo.UpdateAsync(id, showtime);
            if (!result.Success) return BadRequest(new { message = result.Message });
            return Ok(result.Data);
        }

        /// <summary>
        /// DELETE: api/showtime/{id} - Xóa suất chiếu theo ID.
        /// </summary>
        [HttpDelete("{id}")]
        [Authorize(Roles = "Manager")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _repo.DeleteAsync(id);
            if (!result.Success) return BadRequest(new { message = result.Message });
            return Ok(new { message = result.Message });
        }

        /// <summary>
        /// GET: api/showtime/today - Lấy danh sách suất chiếu hôm nay.
        /// Dùng cho app nhân viên để xem lịch chiếu trong ngày.
        /// </summary>
        [HttpGet("today")]
        public async Task<IActionResult> GetToday()
        {
            var today = await _repo.GetTodayShowtimesAsync();
            return Ok(today);
        }
    }
}
