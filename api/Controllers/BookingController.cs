using Microsoft.AspNetCore.Mvc;
using danentang.Models;
using danentang.Services.Cinema;

namespace danentang.Controllers
{
    /// <summary>
    /// Controller quản lý đặt vé - Đặt ghế, hủy vé, xem ghế trống theo xuất chiếu.
    /// Không yêu cầu xác thực để khách hàng có thể đặt vé từ web test.
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    public class BookingController : ControllerBase
    {
        private readonly IBookingRepository _bookingRepo;
        private readonly IShowtimeRepository _showtimeRepo;
        private readonly IRoomRepository _roomRepo;

        public BookingController(
            IBookingRepository bookingRepo,
            IShowtimeRepository showtimeRepo,
            IRoomRepository roomRepo)
        {
            _bookingRepo = bookingRepo;
            _showtimeRepo = showtimeRepo;
            _roomRepo = roomRepo;
        }

        /// <summary>
        /// GET: api/booking/showtimes - Lấy danh sách xuất chiếu đang/sắp chiếu (public).
        /// </summary>
        [HttpGet("showtimes")]
        public async Task<IActionResult> GetAvailableShowtimes()
        {
            var showtimes = await _showtimeRepo.GetAllAsync();
            var available = showtimes
                .Where(s => s.EndTime >= DateTime.Now)
                .OrderBy(s => s.StartTime)
                .ToList();
            return Ok(available);
        }

        /// <summary>
        /// GET: api/booking/showtime/{showtimeId}/seats - Lấy sơ đồ ghế và trạng thái (trống/đã đặt) cho 1 xuất chiếu.
        /// </summary>
        [HttpGet("showtime/{showtimeId}/seats")]
        public async Task<IActionResult> GetSeatsForShowtime(int showtimeId)
        {
            var showtime = await _showtimeRepo.GetByIdAsync(showtimeId);
            if (showtime == null) return NotFound(new { message = "Không tìm thấy xuất chiếu." });

            var seats = await _roomRepo.GetSeatsByRoomIdAsync(showtime.RoomID);

            var bookings = await _bookingRepo.GetAllAsync(showtimeId, "Confirmed");
            var bookedSeatIds = bookings.Select(b => b.SeatID).ToHashSet();

            // Tạo danh sách ghế với trạng thái
            var seatMap = seats.Select(s => new
            {
                s.SeatID,
                s.RoomID,
                s.SeatRow,
                s.SeatNumber,
                s.SeatType,
                IsBooked = bookedSeatIds.Contains(s.SeatID)
            }).ToList();

            return Ok(new
            {
                Showtime = showtime,
                Seats = seatMap,
                TotalSeats = seats.Count,
                BookedCount = bookedSeatIds.Count,
                AvailableCount = seats.Count - bookedSeatIds.Count
            });
        }

        /// <summary>
        /// POST: api/booking - Đặt vé (1 hoặc nhiều ghế cùng lúc).
        /// Body: { ShowtimeID, SeatIDs: [1,2,3], CustomerName, CustomerPhone }
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> CreateBooking([FromBody] BookingRequest req)
        {
            if (req.SeatIDs == null || req.SeatIDs.Count == 0)
                return BadRequest(new { message = "Vui lòng chọn ít nhất 1 ghế." });

            if (string.IsNullOrWhiteSpace(req.CustomerName))
                return BadRequest(new { message = "Vui lòng nhập tên khách hàng." });

            if (string.IsNullOrWhiteSpace(req.CustomerPhone))
                return BadRequest(new { message = "Vui lòng nhập số điện thoại." });

            var result = await _bookingRepo.CreateBookingAsync(
                req.ShowtimeID, 
                req.SeatIDs, 
                req.CustomerName, 
                req.CustomerPhone);

            if (!result.Success)
            {
                if (result.Message.Contains("trống") || result.Message.Contains("Không tìm thấy") || result.Message.Contains("không hợp lệ"))
                    return BadRequest(new { message = result.Message });
                else
                    return Conflict(new { message = result.Message });
            }

            return Ok(new
            {
                message = result.Message,
                bookings = result.Bookings
            });
        }

        /// <summary>
        /// DELETE: api/booking/{id} - Hủy vé theo BookingID.
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> CancelBooking(int id)
        {
            var result = await _bookingRepo.CancelBookingAsync(id);
            if (!result.Success) return NotFound(new { message = result.Message });

            return Ok(new { message = result.Message, booking = result.Data });
        }

        /// <summary>
        /// GET: api/booking - Lấy danh sách tất cả booking.
        /// Hỗ trợ lọc theo showtimeId và status.
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int? showtimeId = null, [FromQuery] string? status = null)
        {
            var bookings = await _bookingRepo.GetAllAsync(showtimeId, status);
            return Ok(bookings);
        }

        /// <summary>
        /// GET: api/booking/{id} - Lấy chi tiết 1 booking.
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var booking = await _bookingRepo.GetByIdAsync(id);
            if (booking == null) return NotFound(new { message = "Không tìm thấy vé." });
            return Ok(booking);
        }

        /// <summary>
        /// GET: api/booking/lookup?phone=xxx - Tra cứu vé theo số điện thoại.
        /// </summary>
        [HttpGet("lookup")]
        public async Task<IActionResult> LookupByPhone([FromQuery] string phone)
        {
            if (string.IsNullOrWhiteSpace(phone))
                return BadRequest(new { message = "Vui lòng nhập số điện thoại." });

            var bookings = await _bookingRepo.LookupByPhoneAsync(phone);
            return Ok(bookings);
        }
    }

    /// <summary>
    /// Request model để đặt vé.
    /// </summary>
    public class BookingRequest
    {
        public int ShowtimeID { get; set; }
        public List<int> SeatIDs { get; set; } = new();
        public string CustomerName { get; set; } = string.Empty;
        public string CustomerPhone { get; set; } = string.Empty;
    }
}
