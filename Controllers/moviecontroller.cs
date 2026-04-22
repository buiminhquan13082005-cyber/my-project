using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Nodes;
using danentang.Models;
using danentang.DTOs;

namespace danentang.Controllers
{
    [ApiController]
    [Route("api/movies")]
    public class MoviesController : ControllerBase
    {
        private readonly string _dataPath = "temporarydata.json";

        private JsonObject GetDatabase()
        {
            if (!System.IO.File.Exists(_dataPath)) return new JsonObject();
            string json = System.IO.File.ReadAllText(_dataPath);
            if (string.IsNullOrWhiteSpace(json)) return new JsonObject();
            return JsonNode.Parse(json).AsObject();
        }

        private List<Movie> GetMoviesList(JsonObject db)
        {
            if (!db.ContainsKey("Movies")) return new List<Movie>();
            return JsonSerializer.Deserialize<List<Movie>>(db["Movies"].ToString(), new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        }

        private void SaveDatabase(JsonObject db, List<Movie> movies)
        {
            db["Movies"] = JsonNode.Parse(JsonSerializer.Serialize(movies));
            System.IO.File.WriteAllText(_dataPath, db.ToJsonString(new JsonSerializerOptions { WriteIndented = true }));
        }

        [HttpGet]
        public IActionResult GetAllMovies()
        {
            var db = GetDatabase();
            var movies = GetMoviesList(db);
            var activeMovies = movies.Where(m => m.Status != 4).Select(m => new MovieSummaryDTO
            {
                Id = m.Id,
                TitleVietnamese = m.TitleVietnamese,
                Slug = m.Slug,
                PosterUrl = m.PosterUrl,
                DurationMinutes = m.DurationMinutes,
                AgeRating = m.AgeRating
            }).ToList();
            
            return Ok(activeMovies);
        }

        [HttpPost]
        public IActionResult CreateMovie([FromBody] MovieCreateDTO request)
        {
            var db = GetDatabase();
            var movies = GetMoviesList(db);

            var newMovie = new Movie
            {
                Id = Guid.NewGuid(),
                TitleOriginal = request.TitleOriginal,
                TitleVietnamese = request.TitleVietnamese,
                Slug = request.TitleVietnamese.ToLower().Replace(" ", "-"),
                Synopsis = request.Synopsis,
                DurationMinutes = request.DurationMinutes,
                AgeRating = request.AgeRating,
                ReleaseDate = request.ReleaseDate,
                EndDate = request.EndDate,
                PosterUrl = request.PosterUrl,
                Status = 1 
            };

            movies.Add(newMovie);
            SaveDatabase(db, movies);

            return Ok(newMovie);
        }

        [HttpDelete("{id}")]
        public IActionResult DeleteMovie(Guid id)
        {
            var db = GetDatabase();
            var movies = GetMoviesList(db);
            
            var movie = movies.FirstOrDefault(m => m.Id == id);
            if (movie == null) return NotFound("Không tìm thấy phim.");

            movie.Status = 4;
            SaveDatabase(db, movies);

            return Ok("Đã đưa bộ phim vào kho lưu trữ thành công.");
        }
    }
}