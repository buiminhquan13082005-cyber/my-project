using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using danentang.Models;
using danentang.Services;

namespace danentang.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class MovieController : ControllerBase
    {
        private readonly JsonFileService _fs;
        private readonly string _path = "data/movies.json";

        public MovieController(JsonFileService fs) { _fs = fs; }

        [HttpGet]
        public IActionResult GetAll([FromQuery] string? status = null)
        {
            var list = _fs.GetData<Movie>(_path);
            if (!string.IsNullOrEmpty(status))
                list = list.Where(m => m.Status.Equals(status, StringComparison.OrdinalIgnoreCase)).ToList();
            return Ok(list.OrderByDescending(m => m.ReleaseDate));
        }

        [HttpGet("{id}")]
        public IActionResult GetById(int id)
        {
            var m = _fs.GetData<Movie>(_path).FirstOrDefault(x => x.MovieID == id);
            if (m == null) return NotFound();
            return Ok(m);
        }

        [HttpPost]
        public IActionResult Create([FromBody] Movie movie)
        {
            var list = _fs.GetData<Movie>(_path);
            movie.MovieID = list.Count > 0 ? list.Max(x => x.MovieID) + 1 : 1;
            list.Add(movie);
            _fs.SaveData(_path, list);
            return Ok(movie);
        }

        [HttpPut("{id}")]
        public IActionResult Update(int id, [FromBody] Movie movie)
        {
            var list = _fs.GetData<Movie>(_path);
            var idx = list.FindIndex(x => x.MovieID == id);
            if (idx == -1) return NotFound();
            movie.MovieID = id;
            list[idx] = movie;
            _fs.SaveData(_path, list);
            return Ok(movie);
        }

        [HttpDelete("{id}")]
        public IActionResult Delete(int id)
        {
            var list = _fs.GetData<Movie>(_path);
            var m = list.FirstOrDefault(x => x.MovieID == id);
            if (m == null) return NotFound();
            list.Remove(m);
            _fs.SaveData(_path, list);
            return Ok(new { message = "Đã xóa phim." });
        }
    }
}
