using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using danentang.Models;
using danentang.Services;

namespace danentang.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class RoomController : ControllerBase
    {
        private readonly JsonFileService _fs;
        private readonly string _path = "data/rooms.json";
        private readonly string _seatPath = "data/seats.json";

        public RoomController(JsonFileService fs) { _fs = fs; }

        [HttpGet]
        public IActionResult GetAll()
        {
            return Ok(_fs.GetData<Room>(_path));
        }

        [HttpGet("{id}")]
        public IActionResult GetById(int id)
        {
            var r = _fs.GetData<Room>(_path).FirstOrDefault(x => x.RoomID == id);
            if (r == null) return NotFound();
            return Ok(r);
        }

        [HttpPost]
        public IActionResult Create([FromBody] Room room)
        {
            var list = _fs.GetData<Room>(_path);
            room.RoomID = list.Count > 0 ? list.Max(x => x.RoomID) + 1 : 1;
            list.Add(room);
            _fs.SaveData(_path, list);
            return Ok(room);
        }

        [HttpPut("{id}")]
        public IActionResult Update(int id, [FromBody] Room room)
        {
            var list = _fs.GetData<Room>(_path);
            var idx = list.FindIndex(x => x.RoomID == id);
            if (idx == -1) return NotFound();
            room.RoomID = id;
            list[idx] = room;
            _fs.SaveData(_path, list);
            return Ok(room);
        }

        [HttpDelete("{id}")]
        public IActionResult Delete(int id)
        {
            var list = _fs.GetData<Room>(_path);
            var r = list.FirstOrDefault(x => x.RoomID == id);
            if (r == null) return NotFound();
            list.Remove(r);
            _fs.SaveData(_path, list);
            return Ok(new { message = "Đã xóa." });
        }

        // GET: api/room/1/seats
        [HttpGet("{id}/seats")]
        public IActionResult GetSeats(int id)
        {
            var seats = _fs.GetData<Seat>(_seatPath).Where(s => s.RoomID == id)
                .OrderBy(s => s.SeatRow).ThenBy(s => s.SeatNumber);
            return Ok(seats);
        }

        // POST: api/room/1/seats/generate - Tạo ghế tự động
        [HttpPost("{id}/seats/generate")]
        public IActionResult GenerateSeats(int id, [FromBody] GenerateSeatsRequest req)
        {
            var rooms = _fs.GetData<Room>(_path);
            var room = rooms.FirstOrDefault(x => x.RoomID == id);
            if (room == null) return NotFound();

            var seats = _fs.GetData<Seat>(_seatPath);
            seats.RemoveAll(s => s.RoomID == id); // xóa ghế cũ

            int seatId = seats.Count > 0 ? seats.Max(s => s.SeatID) : 0;
            for (int r = 0; r < req.Rows; r++)
            {
                string row = ((char)('A' + r)).ToString();
                for (int n = 1; n <= req.SeatsPerRow; n++)
                {
                    seatId++;
                    seats.Add(new Seat
                    {
                        SeatID = seatId,
                        RoomID = id,
                        SeatRow = row,
                        SeatNumber = n,
                        SeatType = r >= req.Rows - req.VipRows ? "VIP" : "Standard"
                    });
                }
            }
            _fs.SaveData(_seatPath, seats);
            room.Capacity = req.Rows * req.SeatsPerRow;
            _fs.SaveData(_path, rooms);
            return Ok(new { message = $"Đã tạo {req.Rows * req.SeatsPerRow} ghế.", capacity = room.Capacity });
        }
    }

    public class GenerateSeatsRequest
    {
        public int Rows { get; set; } = 8;
        public int SeatsPerRow { get; set; } = 12;
        public int VipRows { get; set; } = 2;
    }
}
