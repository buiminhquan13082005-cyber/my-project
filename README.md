[README.md](https://github.com/user-attachments/files/28536616/README.md)
# Phân chia Vai trò & Nhiệm vụ Thành viên (CineManager)

Dưới đây là bảng xác định vai trò, nhiệm vụ và các phân hệ đảm nhận của từng thành viên trong dự án phát triển Hệ thống Quản lý Rạp chiếu phim CineManager:

| Thành viên | Vai trò | Mô tả Công việc & Nhiệm vụ chính |
| :--- | :--- | :--- |
| **Bùi Minh Quân**<br>*(Trưởng nhóm)* | **FE Core & Quản lý** | Setup môi trường frontend, xây dựng layout chính cho web quản trị, hệ thống định tuyến (routing), cấu hình API Client (`api.ts`), quản lý trạng thái xác thực (`AuthContext`), trang đăng nhập (`LoginPage`) và các components UI dùng chung (`components/ui/*`). Chịu trách nhiệm viết bộ kịch bản QA kiểm thử thủ công (`TEST_CASES.md`). |
| **Tiến** | **Backend 1: Logic & Auth + Booking** | Xây dựng CSDL và các API liên quan đến Xác thực (Auth), quản lý nhân sự, điểm danh, quản lý rạp, phòng chiếu, ghế, suất chiếu và module đặt vé (Booking) + hóa đơn backend. Quản lý DbContext chính. |
| **Nam** | **Backend 2: Data & Ops** | Xây dựng CSDL và các API liên quan đến quản lý phim, quản lý kho vật tư, quản lý thiết bị, sự cố thiết bị và quy trình bảo trì. Xây dựng các script đồng bộ dữ liệu JSON và migration. |
| **Huy** | **Frontend 2: Core Cinema & Dashboard** | Phát triển các trang giao diện Web Quản trị: Phim, Phòng chiếu, Lịch chiếu, Đặt vé và Bảng điều khiển (Dashboard). Phát triển ứng dụng Web đặt vé độc lập (`booking/`) và các màn hình chính (Trang chủ, Lịch chiếu, Báo cáo) trên Mobile App. |
| **Đạt** | **Frontend 3: Ops, Maintenance & QA** | Phát triển các trang giao diện Web Quản trị: Kho, Thiết bị, Sự cố, Bảo trì và Báo cáo. Thiết lập môi trường chạy Mobile, phát triển các màn hình di động (Đăng nhập, Hồ sơ cá nhân, Nhiệm vụ bảo trì). |
