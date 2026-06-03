/** 
 * Khai báo các schema validation (bằng Zod) dùng chung cho các form trong web.
 * Xác định kiểu dữ liệu và các quy tắc kiểm tra (required, min, max, email...).
 */
import { z } from 'zod';

// ===== Equipment =====
export const equipmentSchema = z.object({
  equipmentName: z.string().min(1, 'Tên thiết bị không được để trống'),
  category: z.string().min(1, 'Vui lòng chọn phân loại'),
  technicalSpecs: z.string().min(5, 'Thông số tối thiểu 5 ký tự').max(500, 'Thông số tối đa 500 ký tự'),
  manufacturer: z.string().min(2, 'Nhà SX tối thiểu 2 ký tự').max(100, 'Nhà SX tối đa 100 ký tự'),
  unit: z.string().min(1, 'Đơn vị không được để trống').max(20, 'Đơn vị tối đa 20 ký tự'),
});
export type EquipmentFormData = z.infer<typeof equipmentSchema>;

// ===== Maintenance =====
export const maintenanceSchema = z.object({
  equipmentID: z.number({ error: 'Vui lòng chọn thiết bị' }),
  equipmentName: z.string(),
  requestType: z.string().min(1, 'Vui lòng chọn loại'),
  priority: z.string().min(1, 'Vui lòng chọn ưu tiên'),
  description: z.string().min(1, 'Mô tả không được để trống'),
  reportedByName: z.string().min(1, 'Tên người báo cáo không được để trống'),
});
export type MaintenanceFormData = z.infer<typeof maintenanceSchema>;

export const assignSchema = z.object({
  employeeID: z.number({ error: 'Mã NV không được để trống' }).min(1, 'Mã NV phải > 0'),
  employeeName: z.string().min(1, 'Tên NV không được để trống'),
});
export type AssignFormData = z.infer<typeof assignSchema>;

export const maintenanceLogSchema = z.object({
  employeeID: z.number({ error: 'Mã NV không được để trống' }).min(1, 'Mã NV phải > 0'),
  employeeName: z.string().min(1, 'Tên NV không được để trống'),
  actionTaken: z.string().min(1, 'Vui lòng chọn hành động'),
  notes: z.string().optional(),
});
export type MaintenanceLogFormData = z.infer<typeof maintenanceLogSchema>;

// ===== Movie =====
export const movieSchema = z.object({
  title: z.string().min(1, 'Tên phim không được để trống'),
  genre: z.string().min(1, 'Thể loại không được để trống'),
  duration: z.number({ error: 'Thời lượng không được để trống' }).min(1, 'Thời lượng phải > 0'),
  status: z.string().min(1, 'Vui lòng chọn trạng thái'),
  releaseDate: z.string().min(1, 'Ngày bắt đầu không được để trống'),
  endDate: z.string().min(1, 'Ngày kết thúc không được để trống'),
  description: z.string().optional(),
});
export type MovieFormData = z.infer<typeof movieSchema>;

// ===== Room =====
export const roomSchema = z.object({
  roomName: z.string().min(1, 'Tên phòng không được để trống'),
  capacity: z.number({ error: 'Sức chứa không được để trống' }).min(1, 'Sức chứa phải > 0'),
  roomStatus: z.string().min(1, 'Vui lòng chọn trạng thái'),
});
export type RoomFormData = z.infer<typeof roomSchema>;

// ===== Showtime =====
export const showtimeSchema = z.object({
  movieID: z.number({ error: 'Vui lòng chọn phim' }),
  movieTitle: z.string(),
  roomID: z.number({ error: 'Vui lòng chọn phòng' }),
  roomName: z.string(),
  startTime: z.string().min(1, 'Giờ bắt đầu không được để trống'),
  endTime: z.string().min(1, 'Giờ kết thúc không được để trống'),
});
export type ShowtimeFormData = z.infer<typeof showtimeSchema>;

// ===== Incident =====
export const incidentSchema = z.object({
  roomID: z.number({ error: 'Vui lòng chọn phòng' }),
  roomName: z.string(),
  employeeName: z.string().min(1, 'Tên nhân viên không được để trống'),
  description: z.string().min(1, 'Mô tả không được để trống'),
  employeeID: z.number(),
});
export type IncidentFormData = z.infer<typeof incidentSchema>;

// ===== Warehouse Import =====
export const warehouseImportSchema = z.object({
  equipmentID: z.number({ error: 'Vui lòng chọn thiết bị' }),
  equipmentName: z.string(),
  quantity: z.number({ error: 'Số lượng không được để trống' }).min(1, 'Số lượng phải > 0'),
  unitPrice: z.number({ error: 'Đơn giá không được để trống' }).min(0, 'Đơn giá phải >= 0'),
  reason: z.string().optional(),
  employeeID: z.number(),
  employeeName: z.string(),
});
export type WarehouseImportFormData = z.infer<typeof warehouseImportSchema>;

// ===== Warehouse Export =====
export const warehouseExportSchema = z.object({
  equipmentID: z.number({ error: 'Vui lòng chọn thiết bị' }),
  equipmentName: z.string(),
  quantity: z.number({ error: 'Số lượng không được để trống' }).min(1, 'Số lượng phải > 0'),
  unitPrice: z.number({ error: 'Đơn giá không được để trống' }).min(0, 'Đơn giá phải >= 0'),
  reason: z.string().min(1, 'Lý do xuất không được để trống'),
  employeeID: z.number(),
  employeeName: z.string(),
});
export type WarehouseExportFormData = z.infer<typeof warehouseExportSchema>;

// ===== Inventory Check =====
export const inventoryCheckSchema = z.object({
  equipmentID: z.number({ error: 'Vui lòng chọn thiết bị' }),
  equipmentName: z.string(),
  systemQuantity: z.number({ error: 'SL hệ thống không được để trống' }),
  actualQuantity: z.number({ error: 'SL thực tế không được để trống' }),
  checkedByEmployeeID: z.number(),
  checkedByName: z.string().min(1, 'Người kiểm không được để trống'),
  notes: z.string().optional(),
});
export type InventoryCheckFormData = z.infer<typeof inventoryCheckSchema>;

// ===== Login =====
export const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(1, 'Mật khẩu không được để trống'),
});
export type LoginFormData = z.infer<typeof loginSchema>;

// ===== Change Password =====
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Mật khẩu hiện tại không được để trống'),
  newPassword: z.string().min(6, 'Mật khẩu mới phải tối thiểu 6 ký tự'),
  confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu mới'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Xác nhận mật khẩu không khớp',
  path: ['confirmPassword'],
}).refine((data) => data.newPassword !== data.currentPassword, {
  message: 'Mật khẩu mới không được trùng mật khẩu cũ',
  path: ['newPassword'],
});
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
