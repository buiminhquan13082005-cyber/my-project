using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using danentang.Models;
using danentang.Services.Cinema;

namespace danentang.Controllers
{
    /// <summary>
    /// Controller quản lý phim - CRUD thông tin phim chiếu rạp.
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class MovieController : ControllerBase
    {
        private readonly IMovieRepository _repo;

        public MovieController(IMovieRepository repo) { _repo = repo; }

        /// <summary>
        /// GET: api/movie - Lấy danh sách phim, hỗ trợ lọc theo trạng thái (NowShowing, ComingSoon, Ended).
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] string? status = null)
        {
            var list = await _repo.GetAllAsync(status);
            return Ok(list);
        }

        /// <summary>
        /// GET: api/movie/{id} - Lấy chi tiết phim theo ID.
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var m = await _repo.GetByIdAsync(id);
            if (m == null) return NotFound();
            return Ok(m);
        }

        /// <summary>
        /// POST: api/movie - Thêm phim mới vào hệ thống.
        /// </summary>
        [HttpPost]
        [Authorize(Roles = "Manager")]
        public async Task<IActionResult> Create([FromBody] Movie movie)
        {
            if (movie.EndDate <= movie.ReleaseDate)
            {
                return BadRequest(new { message = "Ngày kết thúc phải sau Ngày bắt đầu." });
            }

            if (movie.Status == "NowShowing" && movie.ReleaseDate > DateTime.Now)
            {
                return BadRequest(new { message = "Không thể thêm phim 'Đang chiếu' với Ngày bắt đầu ở trong tương lai." });
            }

            var created = await _repo.CreateAsync(movie);
            return Ok(created);
        }

        /// <summary>
        /// PUT: api/movie/{id} - Cập nhật thông tin phim theo ID.
        /// </summary>
        [HttpPut("{id}")]
        [Authorize(Roles = "Manager")]
        public async Task<IActionResult> Update(int id, [FromBody] Movie movie)
        {
            if (movie.EndDate <= movie.ReleaseDate)
            {
                return BadRequest(new { message = "Ngày kết thúc phải sau Ngày bắt đầu." });
            }

            var existingMovie = await _repo.GetByIdAsync(id);
            if (existingMovie == null) return NotFound();

            if (existingMovie.Status == "ComingSoon" && movie.Status == "Ended")
            {
                return BadRequest(new { message = "Phim 'Sắp chiếu' chưa ra mắt nên không thể chuyển thẳng sang 'Đã kết thúc'." });
            }

            if (movie.Status == "NowShowing" && movie.ReleaseDate > DateTime.Now)
            {
                return BadRequest(new { message = "Không thể đổi sang 'Đang chiếu' vì Ngày bắt đầu ở trong tương lai." });
            }

            var updated = await _repo.UpdateAsync(id, movie);
            if (updated == null) return NotFound();
            return Ok(updated);
        }

        /// <summary>
        /// DELETE: api/movie/{id} - Xóa phim theo ID.
        /// </summary>
        [HttpDelete("{id}")]
        [Authorize(Roles = "Manager")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _repo.DeleteAsync(id);
            if (!result.Success) return BadRequest(new { message = result.Message });
            return Ok(new { message = result.Message });
        }
    }
}
