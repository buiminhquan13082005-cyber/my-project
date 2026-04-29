using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using danentang.Models;
using danentang.Services;

namespace danentang.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class EquipmentController : ControllerBase
    {
        private readonly JsonFileService _fileService;
        private readonly string _equipmentPath = "data/equipments.json";
        private readonly string _storagePath = "data/equipment_storage.json";
        private readonly string _schedulePath = "data/equipment_schedules.json";

        public EquipmentController(JsonFileService fileService)
        {
            _fileService = fileService;
        }

        // GET: api/equipment
        [HttpGet]
        public IActionResult GetAll()
        {
            var equipments = _fileService.GetData<Equipment>(_equipmentPath);
            return Ok(equipments);
        }

        // GET: api/equipment/5
        [HttpGet("{id}")]
        public IActionResult GetById(int id)
        {
            var equipments = _fileService.GetData<Equipment>(_equipmentPath);
            var equipment = equipments.FirstOrDefault(e => e.EquipmentID == id);
            if (equipment == null) return NotFound(new { message = "Không tìm thấy thiết bị." });
            return Ok(equipment);
        }

        // POST: api/equipment
        [HttpPost]
        public IActionResult Create([FromBody] Equipment equipment)
        {
            var equipments = _fileService.GetData<Equipment>(_equipmentPath);
            equipment.EquipmentID = equipments.Count > 0 ? equipments.Max(e => e.EquipmentID) + 1 : 1;
            equipments.Add(equipment);
            _fileService.SaveData(_equipmentPath, equipments);

            // Tạo tồn kho mặc định
            var storages = _fileService.GetData<EquipmentStorage>(_storagePath);
            storages.Add(new EquipmentStorage
            {
                StorageID = storages.Count > 0 ? storages.Max(s => s.StorageID) + 1 : 1,
                EquipmentID = equipment.EquipmentID,
                CurrentQuantity = 0,
                MinRequiredQuantity = 1,
                ConditionStatus = "Good",
                WarehouseLocation = "Kho chính"
            });
            _fileService.SaveData(_storagePath, storages);

            return CreatedAtAction(nameof(GetById), new { id = equipment.EquipmentID }, equipment);
        }

        // PUT: api/equipment/5
        [HttpPut("{id}")]
        public IActionResult Update(int id, [FromBody] Equipment equipment)
        {
            var equipments = _fileService.GetData<Equipment>(_equipmentPath);
            var index = equipments.FindIndex(e => e.EquipmentID == id);
            if (index == -1) return NotFound(new { message = "Không tìm thấy thiết bị." });

            equipment.EquipmentID = id;
            equipments[index] = equipment;
            _fileService.SaveData(_equipmentPath, equipments);
            return Ok(equipment);
        }

        // DELETE: api/equipment/5
        [HttpDelete("{id}")]
        public IActionResult Delete(int id)
        {
            var equipments = _fileService.GetData<Equipment>(_equipmentPath);
            var equipment = equipments.FirstOrDefault(e => e.EquipmentID == id);
            if (equipment == null) return NotFound(new { message = "Không tìm thấy thiết bị." });

            equipments.Remove(equipment);
            _fileService.SaveData(_equipmentPath, equipments);
            return Ok(new { message = "Đã xóa thiết bị." });
        }

        // GET: api/equipment/storage - Xem tồn kho
        [HttpGet("storage")]
        public IActionResult GetStorage()
        {
            var storages = _fileService.GetData<EquipmentStorage>(_storagePath);
            var equipments = _fileService.GetData<Equipment>(_equipmentPath);

            var result = storages.Select(s =>
            {
                var eq = equipments.FirstOrDefault(e => e.EquipmentID == s.EquipmentID);
                return new
                {
                    s.StorageID,
                    s.EquipmentID,
                    EquipmentName = eq?.EquipmentName ?? "N/A",
                    Category = eq?.Category ?? "N/A",
                    s.CurrentQuantity,
                    s.MinRequiredQuantity,
                    s.ConditionStatus,
                    s.WarehouseLocation,
                    IsLowStock = s.CurrentQuantity <= (s.MinRequiredQuantity * 0.1m) // Cảnh báo tồn kho < 10%
                };
            });

            return Ok(result);
        }

        // GET: api/equipment/alerts - Cảnh báo thiết bị
        [HttpGet("alerts")]
        public IActionResult GetAlerts()
        {
            var storages = _fileService.GetData<EquipmentStorage>(_storagePath);
            var equipments = _fileService.GetData<Equipment>(_equipmentPath);
            var schedules = _fileService.GetData<EquipmentSchedule>(_schedulePath);

            var alerts = new List<object>();

            // Cảnh báo tồn kho thấp (< 10% mức yêu cầu)
            foreach (var s in storages)
            {
                if (s.CurrentQuantity <= Math.Ceiling(s.MinRequiredQuantity * 0.1))
                {
                    var eq = equipments.FirstOrDefault(e => e.EquipmentID == s.EquipmentID);
                    alerts.Add(new
                    {
                        Type = "LowStock",
                        Message = $"Thiết bị '{eq?.EquipmentName}' tồn kho thấp: {s.CurrentQuantity}/{s.MinRequiredQuantity}",
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
                        Message = $"Thiết bị '{sch.EquipmentName}' sắp đến hạn bảo trì: {sch.NextMaintenanceDate:dd/MM/yyyy}",
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
                        Message = $"Thiết bị '{sch.EquipmentName}' sắp hết hạn bảo hành: {sch.WarrantyExpiry.Value:dd/MM/yyyy}",
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
                        Message = $"Thiết bị '{sch.EquipmentName}' sắp hết hạn sử dụng: {sch.ShelfLifeExpiry.Value:dd/MM/yyyy}",
                        EquipmentID = sch.EquipmentID,
                        Severity = "Critical"
                    });
                }
            }

            return Ok(alerts);
        }

        // GET: api/equipment/schedules - Lịch bảo trì
        [HttpGet("schedules")]
        public IActionResult GetSchedules()
        {
            var schedules = _fileService.GetData<EquipmentSchedule>(_schedulePath);
            return Ok(schedules);
        }

        // PUT: api/equipment/storage/5 - Cập nhật tồn kho
        [HttpPut("storage/{equipmentId}")]
        public IActionResult UpdateStorage(int equipmentId, [FromBody] EquipmentStorage storage)
        {
            var storages = _fileService.GetData<EquipmentStorage>(_storagePath);
            var index = storages.FindIndex(s => s.EquipmentID == equipmentId);
            if (index == -1) return NotFound(new { message = "Không tìm thấy thiết bị trong kho." });

            storage.EquipmentID = equipmentId;
            storage.StorageID = storages[index].StorageID;
            storages[index] = storage;
            _fileService.SaveData(_storagePath, storages);
            return Ok(storage);
        }
    }
}
