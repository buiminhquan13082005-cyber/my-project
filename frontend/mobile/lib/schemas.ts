/**
 * Zod validation schemas cho mobile app CineStaff.
 * Sử dụng kết hợp với react-hook-form để validate form trước khi submit.
 */
import { z } from 'zod';

// === LOGIN ===
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Vui lòng nhập email')
    .email('Email không hợp lệ'),
  password: z
    .string()
    .min(1, 'Vui lòng nhập mật khẩu')
    .min(4, 'Mật khẩu phải có ít nhất 4 ký tự'),
});
export type LoginFormData = z.infer<typeof loginSchema>;

// === INCIDENT REPORT ===
export const incidentSchema = z.object({
  roomID: z
    .number({
      error: 'Vui lòng chọn phòng',
    })
    .min(1, 'Vui lòng chọn phòng'),
  description: z
    .string()
    .min(1, 'Vui lòng mô tả sự cố')
    .min(10, 'Mô tả phải có ít nhất 10 ký tự'),
});
export type IncidentFormData = z.infer<typeof incidentSchema>;

// === MAINTENANCE LOG ===
export const maintenanceLogSchema = z.object({
  actionTaken: z
    .string()
    .min(1, 'Vui lòng chọn hành động'),
  notes: z
    .string()
    .min(1, 'Vui lòng nhập ghi chú')
    .min(5, 'Ghi chú phải có ít nhất 5 ký tự'),
  employeeID: z.number().default(1),
  employeeName: z.string().default('Nhân viên'),
});
export type MaintenanceLogFormData = z.infer<typeof maintenanceLogSchema>;

// === CHANGE PASSWORD ===
export const changePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(1, 'Vui lòng nhập mật khẩu hiện tại'),
  newPassword: z
    .string()
    .min(1, 'Vui lòng nhập mật khẩu mới')
    .min(6, 'Mật khẩu mới phải ít nhất 6 ký tự'),
  confirmPassword: z
    .string()
    .min(1, 'Vui lòng xác nhận mật khẩu'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword'],
}).refine((data) => data.newPassword !== data.currentPassword, {
  message: 'Mật khẩu mới không được trùng mật khẩu hiện tại',
  path: ['newPassword'],
});
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
