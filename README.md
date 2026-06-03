# Thông tin phân chia code - Đạt

## Vai trò & Nhiệm vụ
- **Vai trò:** Frontend 3 & QA (Màn hình bảo trì thiết bị, responsive, QA/Test cases)

## Danh sách File đã sao chép (Bảo toàn relative path)

### Thư mục: `frontend\src\pages`
- `frontend\src\pages\IncidentsPage.tsx`: Trang quản lý sự cố và kế hoạch bảo trì thiết bị
- `frontend\src\pages\MaintenancePage.tsx`: Trang quản lý sự cố và kế hoạch bảo trì thiết bị

## Ghi chú các File dùng chung & Phụ thuộc
- Các trang màn hình của bạn (`MaintenancePage.tsx`, `IncidentsPage.tsx`) có phụ thuộc vào các thành phần dùng chung do **Quân** quản lý chính:
  - Cấu hình API client tại: `frontend/src/lib/api.ts`
  - Các UI components cơ bản trong: `frontend/src/components/ui/`
- Hãy phối hợp với Quân nếu bạn cần thay đổi hoặc bổ sung gì vào cấu hình API chung hoặc các component dùng chung.

## Gợi ý GitHub Commit Message
`feat(frontend): implement maintenance UI and QA test cases`
