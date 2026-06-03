using danentang.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace danentang.Services.Cinema
{
    public interface IMovieRepository
    {
        Task<List<Movie>> GetAllAsync(string? status = null);
        Task<Movie?> GetByIdAsync(int id);
        Task<Movie> CreateAsync(Movie movie);
        Task<Movie?> UpdateAsync(int id, Movie movie);
        Task<(bool Success, string Message)> DeleteAsync(int id);
    }
}
