using danentang.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace danentang.Services.Cinema
{
    public interface IRoomRepository
    {
        Task<List<Room>> GetAllAsync();
        Task<Room?> GetByIdAsync(int id);
        Task<Room> CreateAsync(Room room);
        Task<Room?> UpdateAsync(int id, Room room);
        Task<(bool Success, string Message)> DeleteAsync(int id);
        
        Task<List<Seat>> GetSeatsByRoomIdAsync(int roomId);
        Task<(bool Success, int Capacity, string Message)> GenerateSeatsAsync(int roomId, int rows, int seatsPerRow, int vipRows);
    }
}
