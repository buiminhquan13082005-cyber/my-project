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
    /// Controller quản lý thiết bị rạp - CRUD thiết bị, tồn kho, lịch bảo trì và cảnh báo.
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class EquipmentController : ControllerBase
    {
        private readonly CinemaDbContext _context;

        public EquipmentController(CinemaDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// GET: api/equipment - Lấy danh sách tất cả thiết bị.
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var equipments = await _context.Equipments.ToListAsync();
            return Ok(equipments);
        }

        /// <summary>
        /// GET: api/equipment/{id} - Lấy chi tiết thiết bị theo ID.
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var equipment = await _context.Equipments.FindAsync(id);
            if (equipment == null) return NotFound(new { message = "Không tìm thấy thiết bị." });
            return Ok(equipment);
        }

        /// <summary>
        /// POST: api/equipment - Thêm thiết bị mới.
        /// Tự động tạo bản ghi tồn kho mặc định cho thiết bị.
        /// </summary>
        [HttpPost]
        [Authorize(Roles = "Manager")]
        public async Task<IActionResult> Create([FromBody] EquipmentEntity equipment)
        {
            _context.Equipments.Add(equipment);
            await _context.SaveChangesAsync();

            // Tạo tồn kho mặc định
            var storage = new EquipmentStorageEntity
            {
                EquipmentID = equipment.EquipmentID,
                CurrentQuantity = 0,
                MinRequiredQuantity = 1,
                ConditionStatus = "Good",
                WarehouseLocation = "Kho chính"
            };
            _context.EquipmentStorages.Add(storage);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = equipment.EquipmentID }, equipment);
        }

        /// <summary>
        /// PUT: api/equipment/{id} - Cập nhật thông tin thiết bị theo ID.
        /// </summary>
        [HttpPut("{id}")]
        [Authorize(Roles = "Manager")]
        public async Task<IActionResult> Update(int id, [FromBody] EquipmentEntity equipment)
        {
            if (id != equipment.EquipmentID) return BadRequest();

            _context.Entry(equipment).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!EquipmentExists(id))
                    return NotFound(new { message = "Không tìm thấy thiết bị." });
                else
                    throw;
            }

            return Ok(equipment);
        }

        /// <summary>
        /// DELETE: api/equipment/{id} - Xóa thiết bị theo ID.
        /// </summary>
        [HttpDelete("{id}")]
        [Authorize(Roles = "Manager")]
        public async Task<IActionResult> Delete(int id)
        {
            var equipment = await _context.Equipments.FindAsync(id);
            if (equipment == null) return NotFound(new { message = "Không tìm thấy thiết bị." });

            _context.Equipments.Remove(equipment);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã xóa thiết bị." });
        }

        /// <summary>
        /// GET: api/equipment/storage - Xem tồn kho thiết bị.
        /// Kết hợp dữ liệu tồn kho với thông tin thiết bị, đánh dấu cảnh báo tồn kho thấp.
        /// </summary>
        [HttpGet("storage")]
        public async Task<IActionResult> GetStorage()
        {
            var storages = await _context.EquipmentStorages
                .Include(s => s.Equipment)
                .ToListAsync();

            var result = storages.Select(s => new
            {
                s.StorageID,
                s.EquipmentID,
                EquipmentName = s.Equipment?.EquipmentName ?? "N/A",
                Category = s.Equipment?.Category ?? "N/A",
                s.CurrentQuantity,
                s.MinRequiredQuantity,
                s.ConditionStatus,
                s.WarehouseLocation,
                IsLowStock = s.CurrentQuantity <= Math.Ceiling(s.MinRequiredQuantity * 0.1m)
            });

            return Ok(result);
        }

        /// <summary>
        /// GET: api/equipment/alerts - Lấy cảnh báo thiết bị.
        /// Kiểm tra: tồn kho thấp, bảo trì đến hạn, hết bảo hành, hết hạn sử dụng.
        /// </summary>
        [HttpGet("alerts")]
        public async Task<IActionResult> GetAlerts()
        {
            var storages = await _context.EquipmentStorages.Include(s => s.Equipment).ToListAsync();
            var schedules = await _context.EquipmentSchedules.Include(s => s.Equipment).ToListAsync();

            var alerts = new List<object>();

            // Cảnh báo tồn kho thấp (< 10% mức yêu cầu)
            foreach (var s in storages)
            {
                if (s.CurrentQuantity <= Math.Ceiling(s.MinRequiredQuantity * 0.1))
                {
                    alerts.Add(new
                    {
                        Type = "LowStock",
                        Message = $"Thiết bị '{s.Equipment?.EquipmentName}' tồn kho thấp: {s.CurrentQuantity}/{s.MinRequiredQuantity}",
                        EquipmentID = s.EquipmentID,
                        Severity = "Warning"
                    });
                }
            }

            // Cảnh báo thiết bị cần bảo trì
            foreach (var sch in schedules)
            {
                if (sch.NextMaintenanceDate <= DateTime.Now.AddDays(7))
                {
                    alerts.Add(new
                    {
                        Type = "MaintenanceDue",
                        Message = $"Thiết bị '{sch.Equipment?.EquipmentName ?? sch.EquipmentName}' sắp đến hạn bảo trì: {sch.NextMaintenanceDate:dd/MM/yyyy}",
                        EquipmentID = sch.EquipmentID,
                        Severity = sch.NextMaintenanceDate <= DateTime.Now ? "Critical" : "Warning"
                    });
                }

                // Cảnh báo hết hạn bảo hành
                if (sch.WarrantyExpiry.HasValue && sch.WarrantyExpiry.Value <= DateTime.Now.AddDays(30))
                {
                    alerts.Add(new
                    {
                        Type = "WarrantyExpiring",
                        Message = $"Thiết bị '{sch.Equipment?.EquipmentName ?? sch.EquipmentName}' sắp hết hạn bảo hành: {sch.WarrantyExpiry.Value:dd/MM/yyyy}",
                        EquipmentID = sch.EquipmentID,
                        Severity = sch.WarrantyExpiry.Value <= DateTime.Now ? "Critical" : "Info"
                    });
                }

                // Cảnh báo hết hạn sử dụng
                if (sch.ShelfLifeExpiry.HasValue && sch.ShelfLifeExpiry.Value <= DateTime.Now.AddDays(30))
                {
                    alerts.Add(new
                    {
                        Type = "ShelfLifeExpiring",
                        Message = $"Thiết bị '{sch.Equipment?.EquipmentName ?? sch.EquipmentName}' sắp hết hạn sử dụng: {sch.ShelfLifeExpiry.Value:dd/MM/yyyy}",
                        EquipmentID = sch.EquipmentID,
                        Severity = "Critical"
                    });
                }
            }

            return Ok(alerts);
        }

        /// <summary>
        /// GET: api/equipment/schedules - Lấy danh sách lịch bảo trì định kỳ của thiết bị.
        /// </summary>
        [HttpGet("schedules")]
        public async Task<IActionResult> GetSchedules()
        {
            var schedules = await _context.EquipmentSchedules.Include(s => s.Equipment).ToListAsync();
            return Ok(schedules);
        }

        /// <summary>
        /// PUT: api/equipment/storage/{equipmentId} - Cập nhật thông tin tồn kho của thiết bị.
        /// </summary>
        [HttpPut("storage/{equipmentId}")]
        [Authorize(Roles = "Manager")]
        public async Task<IActionResult> UpdateStorage(int equipmentId, [FromBody] EquipmentStorageEntity storage)
        {
            var existingStorage = await _context.EquipmentStorages
                .FirstOrDefaultAsync(s => s.EquipmentID == equipmentId);

            if (existingStorage == null) return NotFound(new { message = "Không tìm thấy thiết bị trong kho." });

            existingStorage.CurrentQuantity = storage.CurrentQuantity;
            existingStorage.ConditionStatus = storage.ConditionStatus;
            existingStorage.MinRequiredQuantity = storage.MinRequiredQuantity;
            existingStorage.WarehouseLocation = storage.WarehouseLocation;

            await _context.SaveChangesAsync();
            return Ok(existingStorage);
        }

        private bool EquipmentExists(int id)
        {
            return _context.Equipments.Any(e => e.EquipmentID == id);
        }
    }
}
