using danentang.Data;
using danentang.Data.Entities;
using danentang.Models;
using Microsoft.EntityFrameworkCore;

namespace danentang.Services.Cinema
{
    public class MovieRepository : IMovieRepository
    {
        private readonly CinemaDbContext _context;

        public MovieRepository(CinemaDbContext context)
        {
            _context = context;
        }

        public async Task<List<Movie>> GetAllAsync(string? status = null)
        {
            var query = _context.Movies.AsQueryable();

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(m => m.Status.ToLower() == status.ToLower());
            }

            var entities = await query.OrderByDescending(m => m.ReleaseDate).ToListAsync();
            return entities.Select(MapToModel).ToList();
        }

        public async Task<Movie?> GetByIdAsync(int id)
        {
            var entity = await _context.Movies.FindAsync(id);
            return entity == null ? null : MapToModel(entity);
        }

        public async Task<Movie> CreateAsync(Movie movie)
        {
            var entity = new MovieEntity
            {
                Title = movie.Title,
                Duration = movie.Duration,
                Genre = movie.Genre,
                Description = movie.Description,
                ReleaseDate = movie.ReleaseDate,
                EndDate = movie.EndDate,
                Status = movie.Status,
                PosterURL = movie.PosterURL,
                TrailerURL = movie.TrailerURL,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };

            _context.Movies.Add(entity);
            await _context.SaveChangesAsync();

            return MapToModel(entity);
        }

        public async Task<Movie?> UpdateAsync(int id, Movie movie)
        {
            var entity = await _context.Movies.FindAsync(id);
            if (entity == null) return null;

            entity.Title = movie.Title;
            entity.Duration = movie.Duration;
            entity.Genre = movie.Genre;
            entity.Description = movie.Description;
            entity.ReleaseDate = movie.ReleaseDate;
            entity.EndDate = movie.EndDate;
            entity.Status = movie.Status;
            entity.PosterURL = movie.PosterURL;
            entity.TrailerURL = movie.TrailerURL;
            entity.UpdatedAt = DateTime.Now;

            await _context.SaveChangesAsync();
            return MapToModel(entity);
        }

        public async Task<(bool Success, string Message)> DeleteAsync(int id)
        {
            var entity = await _context.Movies.FindAsync(id);
            if (entity == null) return (false, "Không tìm thấy phim.");

            var hasShowtimes = await _context.Showtimes.AnyAsync(s => s.MovieID == id);
            if (hasShowtimes)
            {
                return (false, "Không thể xóa phim này vì đã có suất chiếu liên quan.");
            }

            _context.Movies.Remove(entity);
            await _context.SaveChangesAsync();
            return (true, "Xóa phim thành công.");
        }

        private Movie MapToModel(MovieEntity entity)
        {
            return new Movie
            {
                MovieID = entity.MovieID,
                Title = entity.Title,
                Duration = entity.Duration,
                Genre = entity.Genre ?? string.Empty,
                Description = entity.Description ?? string.Empty,
                ReleaseDate = entity.ReleaseDate ?? DateTime.MinValue,
                EndDate = entity.EndDate ?? DateTime.MinValue,
                Status = entity.Status,
                PosterURL = entity.PosterURL ?? string.Empty,
                TrailerURL = entity.TrailerURL ?? string.Empty
            };
        }
    }
}
