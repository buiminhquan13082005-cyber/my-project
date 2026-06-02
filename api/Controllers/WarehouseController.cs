using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using danentang.Models;
using danentang.Services;

namespace danentang.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class WarehouseController : ControllerBase
    {
        private readonly JsonFileService _fileService;
        private readonly string _transactionPath = "data/stock_transactions.json";
        private readonly string _storagePath = "data/equipment_storage.json";
        private readonly string _equipmentPath = "data/equipments.json";
        private readonly string _checkPath = "data/inventory_checks.json";

        public WarehouseController(JsonFileService fileService)
        {
            _fileService = fileService;
        }

        // POST: api/warehouse/import - Nhập kho
        [HttpPost("import")]
        public IActionResult ImportStock([FromBody] StockTransaction transaction)
        {
            var transactions = _fileService.GetData<StockTransaction>(_transactionPath);
            transaction.TransactionID = transactions.Count > 0 ? transactions.Max(t => t.TransactionID) + 1 : 1;
            transaction.TransactionType = "Import";
            transaction.TransactionDate = DateTime.Now;
            transactions.Add(transaction);
            _fileService.SaveData(_transactionPath, transactions);

            // Cập nhật tồn kho
            var storages = _fileService.GetData<EquipmentStorage>(_storagePath);
            var storage = storages.FirstOrDefault(s => s.EquipmentID == transaction.EquipmentID);
            if (storage != null)
            {
                storage.CurrentQuantity += transaction.Quantity;
                _fileService.SaveData(_storagePath, storages);
            }

            return Ok(new { message = $"Đã nhập kho {transaction.Quantity} {transaction.EquipmentName}", transaction });
        }

        // POST: api/warehouse/export - Xuất kho
        [HttpPost("export")]
        public IActionResult ExportStock([FromBody] StockTransaction transaction)
        {
            var storages = _fileService.GetData<EquipmentStorage>(_storagePath);
            var storage = storages.FirstOrDefault(s => s.EquipmentID == transaction.EquipmentID);
            if (storage == null) return NotFound(new { message = "Thiết bị không có trong kho." });
            if (storage.CurrentQuantity < transaction.Quantity)
                return BadRequest(new { message = $"Không đủ số lượng. Tồn kho: {storage.CurrentQuantity}" });

            var transactions = _fileService.GetData<StockTransaction>(_transactionPath);
            transaction.TransactionID = transactions.Count > 0 ? transactions.Max(t => t.TransactionID) + 1 : 1;
            transaction.TransactionType = "Export";
            transaction.TransactionDate = DateTime.Now;
            transactions.Add(transaction);
            _fileService.SaveData(_transactionPath, transactions);

            storage.CurrentQuantity -= transaction.Quantity;
            _fileService.SaveData(_storagePath, storages);

            return Ok(new { message = $"Đã xuất kho {transaction.Quantity} {transaction.EquipmentName}", transaction });
        }

        // POST: api/warehouse/damaged - Nhập thiết bị hỏng vào kho
        [HttpPost("damaged")]
        public IActionResult ReceiveDamaged([FromBody] StockTransaction transaction)
        {
            var transactions = _fileService.GetData<StockTransaction>(_transactionPath);
            transaction.TransactionID = transactions.Count > 0 ? transactions.Max(t => t.TransactionID) + 1 : 1;
            transaction.TransactionType = "Damaged";
            transaction.TransactionDate = DateTime.Now;
            transactions.Add(transaction);
            _fileService.SaveData(_transactionPath, transactions);
            return Ok(new { message = "Đã ghi nhận thiết bị hỏng.", transaction });
        }

        // POST: api/warehouse/dispose - Thanh lý thiết bị
        [HttpPost("dispose")]
        public IActionResult DisposeEquipment([FromBody] StockTransaction transaction)
        {
            var storages = _fileService.GetData<EquipmentStorage>(_storagePath);
            var storage = storages.FirstOrDefault(s => s.EquipmentID == transaction.EquipmentID);

            var transactions = _fileService.GetData<StockTransaction>(_transactionPath);
            transaction.TransactionID = transactions.Count > 0 ? transactions.Max(t => t.TransactionID) + 1 : 1;
            transaction.TransactionType = "Disposed";
            transaction.TransactionDate = DateTime.Now;
            transactions.Add(transaction);
            _fileService.SaveData(_transactionPath, transactions);

            if (storage != null)
            {
                storage.CurrentQuantity = Math.Max(0, storage.CurrentQuantity - transaction.Quantity);
                _fileService.SaveData(_storagePath, storages);
            }

            return Ok(new { message = "Đã thanh lý thiết bị.", transaction });
        }

        // GET: api/warehouse/transactions - Lịch sử giao dịch
        [HttpGet("transactions")]
        public IActionResult GetTransactions([FromQuery] string? type = null, [FromQuery] string? date = null)
        {
            var transactions = _fileService.GetData<StockTransaction>(_transactionPath);
            if (!string.IsNullOrEmpty(type))
                transactions = transactions.Where(t => t.TransactionType.Equals(type, StringComparison.OrdinalIgnoreCase)).ToList();
            if (!string.IsNullOrEmpty(date) && DateTime.TryParse(date, out var d))
                transactions = transactions.Where(t => t.TransactionDate.Date == d.Date).ToList();
            return Ok(transactions.OrderByDescending(t => t.TransactionDate));
        }

        // GET: api/warehouse/report - Báo cáo cuối ngày
        [HttpGet("report")]
        public IActionResult DailyReport([FromQuery] string? date = null)
        {
            var reportDate = string.IsNullOrEmpty(date) ? DateTime.Today : DateTime.Parse(date);
            var transactions = _fileService.GetData<StockTransaction>(_transactionPath);
            var today = transactions.Where(t => t.TransactionDate.Date == reportDate.Date).ToList();

            return Ok(new
            {
                date = reportDate.ToString("dd/MM/yyyy"),
                totalImports = today.Count(t => t.TransactionType == "Import"),
                totalExports = today.Count(t => t.TransactionType == "Export"),
                totalDamaged = today.Count(t => t.TransactionType == "Damaged"),
                totalDisposed = today.Count(t => t.TransactionType == "Disposed"),
                transactions = today
            });
        }

        // POST: api/warehouse/inventory-check - Kiểm kê kho
        [HttpPost("inventory-check")]
        public IActionResult PerformCheck([FromBody] InventoryCheck check)
        {
            var checks = _fileService.GetData<InventoryCheck>(_checkPath);
            check.CheckID = checks.Count > 0 ? checks.Max(c => c.CheckID) + 1 : 1;
            check.Discrepancy = check.ActualQuantity - check.SystemQuantity;
            check.CheckDate = DateTime.Now;
            checks.Add(check);
            _fileService.SaveData(_checkPath, checks);

            // Cập nhật tồn kho nếu có chênh lệch
            if (check.Discrepancy != 0)
            {
                var storages = _fileService.GetData<EquipmentStorage>(_storagePath);
                var storage = storages.FirstOrDefault(s => s.EquipmentID == check.EquipmentID);
                if (storage != null)
                {
                    storage.CurrentQuantity = check.ActualQuantity;
                    _fileService.SaveData(_storagePath, storages);
                }
            }

            return Ok(check);
        }

        // GET: api/warehouse/inventory-checks - Lịch sử kiểm kê
        [HttpGet("inventory-checks")]
        public IActionResult GetChecks()
        {
            var checks = _fileService.GetData<InventoryCheck>(_checkPath);
            return Ok(checks.OrderByDescending(c => c.CheckDate));
        }
    }
}
