using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using danentang.Models;
using danentang.Data;
using danentang.Data.Entities;

namespace danentang.Controllers
{
    /// <summary>
    /// Controller quản lý kho thiết bị - nhập/xuất kho, thanh lý, kiểm kê và báo cáo.
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class WarehouseController : ControllerBase
    {
        private readonly CinemaDbContext _context;

        public WarehouseController(CinemaDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// POST: api/warehouse/import - Nhập thiết bị vào kho.
        /// Tự động cập nhật số lượng tồn kho.
        /// </summary>
        [HttpPost("import")]
        [Authorize(Roles = "Manager")]
        public async Task<IActionResult> ImportStock([FromBody] StockTransactionEntity transaction)
        {
            if (transaction.Quantity <= 0)
                return BadRequest(new { message = "Số lượng nhập kho phải lớn hơn 0." });
            if (transaction.UnitPrice < 0)
                return BadRequest(new { message = "Đơn giá không được nhỏ hơn 0." });

            transaction.TransactionType = "Import";
            transaction.TransactionDate = DateTime.Now;
            _context.StockTransactions.Add(transaction);

            // Cập nhật tồn kho
            var storage = await _context.EquipmentStorages.FirstOrDefaultAsync(s => s.EquipmentID == transaction.EquipmentID);
            if (storage != null)
            {
                storage.CurrentQuantity += transaction.Quantity;
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = $"Đã nhập kho {transaction.Quantity} {transaction.EquipmentName}", transaction });
        }

        /// <summary>
        /// POST: api/warehouse/export - Xuất thiết bị khỏi kho.
        /// Kiểm tra số lượng tồn kho đủ trước khi xuất.
        /// </summary>
        [HttpPost("export")]
        [Authorize(Roles = "Manager")]
        public async Task<IActionResult> ExportStock([FromBody] StockTransactionEntity transaction)
        {
            if (transaction.Quantity <= 0)
                return BadRequest(new { message = "Số lượng xuất kho phải lớn hơn 0." });
            if (transaction.UnitPrice < 0)
                return BadRequest(new { message = "Đơn giá không được nhỏ hơn 0." });

            var storage = await _context.EquipmentStorages.FirstOrDefaultAsync(s => s.EquipmentID == transaction.EquipmentID);
            if (storage == null) return NotFound(new { message = "Thiết bị không có trong kho." });
            if (storage.CurrentQuantity < transaction.Quantity)
                return BadRequest(new { message = $"Không đủ số lượng. Tồn kho: {storage.CurrentQuantity}" });

            transaction.TransactionType = "Export";
            transaction.TransactionDate = DateTime.Now;
            _context.StockTransactions.Add(transaction);

            storage.CurrentQuantity -= transaction.Quantity;

            await _context.SaveChangesAsync();

            return Ok(new { message = $"Đã xuất kho {transaction.Quantity} {transaction.EquipmentName}", transaction });
        }

        /// <summary>
        /// POST: api/warehouse/damaged - Ghi nhận thiết bị hỏng vào kho.
        /// </summary>
        [HttpPost("damaged")]
        [Authorize(Roles = "Manager")]
        public async Task<IActionResult> ReceiveDamaged([FromBody] StockTransactionEntity transaction)
        {
            if (transaction.Quantity <= 0)
                return BadRequest(new { message = "Số lượng báo hỏng phải lớn hơn 0." });
            if (transaction.UnitPrice < 0)
                return BadRequest(new { message = "Đơn giá không được nhỏ hơn 0." });

            transaction.TransactionType = "Damaged";
            transaction.TransactionDate = DateTime.Now;
            _context.StockTransactions.Add(transaction);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã ghi nhận thiết bị hỏng.", transaction });
        }

        /// <summary>
        /// POST: api/warehouse/dispose - Thanh lý thiết bị.
        /// Giảm số lượng tồn kho tương ứng.
        /// </summary>
        [HttpPost("dispose")]
        [Authorize(Roles = "Manager")]
        public async Task<IActionResult> DisposeEquipment([FromBody] StockTransactionEntity transaction)
        {
            if (transaction.Quantity <= 0)
                return BadRequest(new { message = "Số lượng thanh lý phải lớn hơn 0." });
            if (transaction.UnitPrice < 0)
                return BadRequest(new { message = "Đơn giá không được nhỏ hơn 0." });

            transaction.TransactionType = "Disposed";
            transaction.TransactionDate = DateTime.Now;
            _context.StockTransactions.Add(transaction);

            var storage = await _context.EquipmentStorages.FirstOrDefaultAsync(s => s.EquipmentID == transaction.EquipmentID);
            if (storage != null)
            {
                storage.CurrentQuantity = Math.Max(0, storage.CurrentQuantity - transaction.Quantity);
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã thanh lý thiết bị.", transaction });
        }

        /// <summary>
        /// GET: api/warehouse/transactions - Lịch sử giao dịch kho.
        /// Hỗ trợ lọc theo loại giao dịch (type) và ngày (date).
        /// </summary>
        [HttpGet("transactions")]
        public async Task<IActionResult> GetTransactions([FromQuery] string? type = null, [FromQuery] string? date = null)
        {
            var query = _context.StockTransactions.AsQueryable();

            if (!string.IsNullOrEmpty(type))
                query = query.Where(t => t.TransactionType == type);
            if (!string.IsNullOrEmpty(date) && DateTime.TryParse(date, out var d))
                query = query.Where(t => t.TransactionDate.Date == d.Date);

            var transactions = await query.OrderByDescending(t => t.TransactionDate).ToListAsync();
            return Ok(transactions);
        }

        /// <summary>
        /// GET: api/warehouse/report - Báo cáo cuối ngày.
        /// Thống kê số lượng nhập/xuất/hỏng/thanh lý trong ngày.
        /// </summary>
        [HttpGet("report")]
        public async Task<IActionResult> DailyReport([FromQuery] string? date = null)
        {
            DateTime reportDate;
            if (string.IsNullOrEmpty(date))
            {
                reportDate = DateTime.Today;
            }
            else
            {
                if (!DateTime.TryParseExact(date, "yyyy-MM-dd", System.Globalization.CultureInfo.InvariantCulture, System.Globalization.DateTimeStyles.None, out reportDate))
                {
                    return BadRequest(new { message = "Định dạng ngày không hợp lệ. Vui lòng sử dụng định dạng yyyy-MM-dd." });
                }
            }
            var todayTransactions = await _context.StockTransactions
                .Where(t => t.TransactionDate.Date == reportDate.Date)
                .ToListAsync();

            var todayMaintenances = await _context.MaintenanceRequests
                .Where(r => r.Status == "Completed" && r.CompletedAt.HasValue && r.CompletedAt.Value.Date == reportDate.Date)
                .ToListAsync();

            return Ok(new
            {
                date = reportDate.ToString("dd/MM/yyyy"),
                totalImports = todayTransactions.Count(t => t.TransactionType == "Import"),
                totalExports = todayTransactions.Count(t => t.TransactionType == "Export"),
                totalDamaged = todayTransactions.Count(t => t.TransactionType == "Damaged"),
                totalDisposed = todayTransactions.Count(t => t.TransactionType == "Disposed"),
                transactions = todayTransactions,
                totalMaintenances = todayMaintenances.Count,
                maintenances = todayMaintenances
            });
        }

        /// <summary>
        /// POST: api/warehouse/inventory-check - Kiểm kê kho.
        /// Tính chênh lệch giữa thực tế và hệ thống, cập nhật tồn kho nếu có sai lệch.
        /// </summary>
        [HttpPost("inventory-check")]
        [Authorize(Roles = "Manager")]
        public async Task<IActionResult> PerformCheck([FromBody] InventoryCheckEntity check)
        {
            if (check.SystemQuantity < 0 || check.ActualQuantity < 0)
            {
                return BadRequest(new { message = "Số lượng hệ thống và thực tế không được nhỏ hơn 0." });
            }

            check.Discrepancy = check.ActualQuantity - check.SystemQuantity;
            check.CheckDate = DateTime.Now;
            _context.InventoryChecks.Add(check);

            // Cập nhật tồn kho nếu có chênh lệch
            if (check.Discrepancy != 0)
            {
                var storage = await _context.EquipmentStorages.FirstOrDefaultAsync(s => s.EquipmentID == check.EquipmentID);
                if (storage != null)
                {
                    storage.CurrentQuantity = check.ActualQuantity;
                }
            }

            await _context.SaveChangesAsync();
            return Ok(check);
        }

        /// <summary>
        /// GET: api/warehouse/inventory-checks - Lịch sử kiểm kê kho.
        /// </summary>
        [HttpGet("inventory-checks")]
        public async Task<IActionResult> GetChecks()
        {
            var checks = await _context.InventoryChecks.OrderByDescending(c => c.CheckDate).ToListAsync();
            return Ok(checks);
        }

        /// <summary>
        /// DELETE: api/warehouse/transaction/{id} - Xóa một giao dịch kho.
        /// </summary>
        [HttpDelete("transaction/{id}")]
        [Authorize(Roles = "Manager")]
        public async Task<IActionResult> DeleteTransaction(int id)
        {
            var tx = await _context.StockTransactions.FindAsync(id);
            if (tx == null) return NotFound(new { message = "Không tìm thấy giao dịch." });

            _context.StockTransactions.Remove(tx);
            await _context.SaveChangesAsync();
            return Ok(new { status = "success", message = "Đã xóa giao dịch thành công." });
        }
    }
}
