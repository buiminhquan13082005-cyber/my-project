using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using danentang.Models;
using danentang.Services.Cinema;

namespace danentang.Controllers
{
    /// <summary>
    /// Controller quản lý phòng chiếu - CRUD phòng và quản lý sơ đồ ghế ngồi.
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class RoomController : ControllerBase
    {
        private readonly IRoomRepository _repo;

        public RoomController(IRoomRepository repo) { _repo = repo; }

        /// <summary>
        /// GET: api/room - Lấy danh sách tất cả phòng chiếu.
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            return Ok(await _repo.GetAllAsync());
        }

        /// <summary>
        /// GET: api/room/{id} - Lấy chi tiết phòng chiếu theo ID.
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var r = await _repo.GetByIdAsync(id);
            if (r == null) return NotFound();
            return Ok(r);
        }

        /// <summary>
        /// POST: api/room - Tạo phòng chiếu mới.
        /// </summary>
        [HttpPost]
        [Authorize(Roles = "Manager")]
        public async Task<IActionResult> Create([FromBody] Room room)
        {
            var created = await _repo.CreateAsync(room);
            return Ok(created);
        }

        /// <summary>
        /// PUT: api/room/{id} - Cập nhật thông tin phòng chiếu.
        /// </summary>
        [HttpPut("{id}")]
        [Authorize(Roles = "Manager")]
        public async Task<IActionResult> Update(int id, [FromBody] Room room)
        {
            var updated = await _repo.UpdateAsync(id, room);
            if (updated == null) return NotFound();
            return Ok(updated);
        }

        /// <summary>
        /// DELETE: api/room/{id} - Xóa phòng chiếu theo ID.
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
        /// GET: api/room/{id}/seats - Lấy danh sách ghế ngồi của phòng chiếu.
        /// Sắp xếp theo hàng và số ghế.
        /// </summary>
        [HttpGet("{id}/seats")]
        public async Task<IActionResult> GetSeats(int id)
        {
            var seats = await _repo.GetSeatsByRoomIdAsync(id);
            return Ok(seats);
        }

        /// <summary>
        /// POST: api/room/{id}/seats/generate - Tự động tạo sơ đồ ghế ngồi cho phòng.
        /// Xóa ghế cũ và tạo lại theo số hàng, số ghế/hàng, số hàng VIP.
        /// </summary>
        [HttpPost("{id}/seats/generate")]
        [Authorize(Roles = "Manager")]
        public async Task<IActionResult> GenerateSeats(int id, [FromBody] GenerateSeatsRequest req)
        {
            var result = await _repo.GenerateSeatsAsync(id, req.Rows, req.SeatsPerRow, req.VipRows);
            if (!result.Success) return BadRequest(new { message = result.Message });
            
            return Ok(new { message = result.Message, capacity = result.Capacity });
        }
    }

    /// <summary>
    /// Request model để tạo ghế tự động cho phòng chiếu.
    /// </summary>
    public class GenerateSeatsRequest
    {
        public int Rows { get; set; } = 8;
        public int SeatsPerRow { get; set; } = 12;
        public int VipRows { get; set; } = 2;
    }
}
