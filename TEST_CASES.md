# Kịch bản kiểm thử thủ công (Manual Test Cases)

Tài liệu này cung cấp các kịch bản kiểm thử thủ công chi tiết cho hệ thống, phục vụ công tác QA của dự án do thành viên **Đạt** phụ trách.

---

## 1. Đăng nhập hệ thống theo vai trò (Role-based Authentication)
- **Mô tả:** Đảm bảo hệ thống xác thực chính xác tài khoản và chuyển hướng/phân quyền đúng theo vai trò (Manager hoặc Staff).
- **Các bước thực hiện:**
  1. Truy cập trang đăng nhập (`/login`).
  2. Nhập email/password của tài khoản Manager (`admin@test.com` / `admin`). Nhấn Đăng nhập.
  3. Kiểm tra xem giao diện hiển thị đầy đủ các thanh điều hướng quản trị (Phim, Phòng, Suất chiếu, Kho, Bảo trì, Báo cáo).
  4. Đăng xuất.
  5. Nhập email/password của tài khoản Staff (`quan@test.com` / `quan`). Nhấn Đăng nhập.
  6. Kiểm tra xem các tab nhạy cảm (Quản lý phòng chiếu, doanh thu/báo cáo) có bị ẩn hoặc vô hiệu hóa đối với Staff hay không.
- **Kết quả mong đợi:** Đăng nhập thành công, token được lưu trữ đúng ở localStorage, phân quyền chính xác cho từng vai trò trên thanh điều hướng.

---

## 2. Quản lý phim (Movie CRUD)
- **Mô tả:** Kiểm thử các chức năng Xem, Thêm, Sửa, Xóa phim.
- **Các bước thực hiện:**
  1. Truy cập trang quản lý Phim (`/movies`).
  2. Nhấn nút "Thêm phim", điền đầy đủ thông tin (Tên phim, Thể loại, Thời lượng, Đạo diễn, Ngày phát hành). Nhấn Lưu.
  3. Xác nhận phim mới xuất hiện trên bảng danh sách.
  4. Nhấn nút "Sửa" phim đó, thay đổi thời lượng phim. Nhấn Cập nhật.
  5. Kiểm tra thời lượng mới đã được cập nhật chưa.
  6. Nhấn nút "Xóa" phim và xác nhận.
- **Kết quả mong đợi:** Mọi hành động CRUD phim hoạt động trơn tru, hiển thị toast message thông báo thành công.

---

## 3. Quản lý phòng chiếu & Ghế (Room & Seat Management)
- **Mô tả:** Tạo phòng chiếu mới và tạo sơ đồ ghế tự động cho phòng chiếu đó.
- **Các bước thực hiện:**
  1. Truy cập trang quản lý Phòng chiếu (`/rooms`).
  2. Nhấn "Thêm phòng", nhập tên phòng và sức chứa. Nhấn Lưu.
  3. Trên dòng phòng chiếu vừa tạo, nhấn nút "Ghế" để mở dialog sơ đồ ghế.
  4. Điền các tham số tạo ghế tự động: Số hàng (ví dụ: 8), Ghế/hàng (ví dụ: 10), Hàng VIP (ví dụ: 2). Nhấn "Tạo ghế".
  5. Kiểm tra sơ đồ ghế hiển thị trực quan đúng số lượng ghế Standard và VIP với màu sắc phân biệt.
- **Kết quả mong đợi:** Phòng được tạo thành công. Ghế được tạo tự động dưới database và render trực quan lên giao diện đúng số lượng và phân loại.

---

## 4. Quản lý suất chiếu (Showtime Management)
- **Mô tả:** Xếp lịch chiếu phim vào các phòng và kiểm tra các ràng buộc trùng giờ/phòng hỏng.
- **Các bước thực hiện:**
  1. Truy cập trang Suất chiếu (`/showtimes`).
  2. Nhấn "Thêm suất chiếu", chọn phim, chọn phòng, thiết lập thời gian bắt đầu và kết thúc. Nhấn Lưu.
  3. Kiểm tra suất chiếu hiển thị trên lịch/danh sách.
  4. Thử tạo suất chiếu khác trùng khung giờ với suất chiếu trên vào cùng một phòng. Nhấn Lưu.
  5. Xác nhận hệ thống báo lỗi: "Trùng lịch chiếu trong phòng này!" và chặn không cho tạo.
- **Kết quả mong đợi:** Cho phép tạo suất chiếu hợp lệ và chặn tạo suất chiếu trùng giờ/phòng hỏng theo đúng ràng buộc backend.

---

## 5. Quản lý kho (Warehouse & Inventory CRUD)
- **Mô tả:** Quản lý linh kiện, xuất nhập kho và cảnh báo tồn kho thấp.
- **Các bước thực hiện:**
  1. Truy cập trang quản lý Kho (`/warehouse`).
  2. Kiểm tra danh sách vật tư hiện tại. Thử thực hiện hành động Thêm thiết bị/linh kiện mới.
  3. Tạo một giao dịch nhập kho (nhập thêm bóng đèn máy chiếu, số lượng 20).
  4. Tạo giao dịch xuất kho (xuất 5 bóng đèn để bảo trì phòng 1). Xác nhận số lượng tồn kho giảm tương ứng.
  5. Kiểm tra xem thiết bị nào có số lượng dưới mức tối thiểu có hiển thị cảnh báo màu đỏ hoặc nhấp nháy cảnh báo tồn kho thấp hay không.
- **Kết quả mong đợi:** CRUD kho hoạt động tốt, số lượng tồn kho thay đổi chính xác sau mỗi giao dịch nhập/xuất kho.

---

## 6. Báo cáo sự cố thiết bị (Incident Reporting)
- **Mô tả:** Nhân viên báo cáo sự cố hỏng hóc phòng chiếu, hệ thống tự động khóa phòng đó.
- **Các bước thực hiện:**
  1. Đăng nhập dưới quyền Staff/Manager. Vào trang Sự cố (`/incidents`).
  2. Nhấn "Báo sự cố", chọn phòng chiếu bị hỏng (ví dụ: Phòng 2), nhập mô tả chi tiết sự cố (hỏng điều hòa). Nhấn Gửi.
  3. Truy cập lại trang Phòng chiếu (`/rooms`) để kiểm tra trạng thái của Phòng 2.
  4. Thử xếp suất chiếu mới vào Phòng 2 tại trang Suất chiếu.
- **Kết quả mong đợi:** Sự cố được ghi nhận. Trạng thái Phòng 2 lập tức tự động chuyển thành "Bảo trì" (Maintenance). Hệ thống chặn không cho phép xếp bất kỳ suất chiếu nào vào Phòng 2.

---

## 7. Tạo và xử lý yêu cầu bảo trì (Maintenance Request Flow)
- **Mô tả:** Chuyển sự cố thành yêu cầu bảo trì, phân công kỹ thuật viên.
- **Các bước thực hiện:**
  1. Truy cập trang Bảo trì (`/maintenance`).
  2. Xác nhận một yêu cầu bảo trì mới tương ứng với sự cố phòng chiếu ở mục 6 đã được tạo tự động với trạng thái "Pending".
  3. Nhấn nút Phân công ("Assign"), chọn kỹ thuật viên thực hiện (ví dụ: Bùi Minh Quân).
  4. Xác nhận trạng thái yêu cầu chuyển thành "Assigned" hoặc "In Progress".
- **Kết quả mong đợi:** Yêu cầu bảo trì liên kết trực tiếp sự cố, cho phép phân công nhân sự xử lý.

---

## 8. Hoàn tất bảo trì & Mở khóa phòng chiếu (Complete Maintenance & Auto-unlock)
- **Mô tả:** Kỹ thuật viên ghi nhật ký thực tế sửa chữa, hoàn tất yêu cầu và mở khóa phòng chiếu tự động.
- **Các bước thực hiện:**
  1. Trên trang Bảo trì, chọn yêu cầu đang xử lý.
  2. Nhấn "Ghi nhật ký" (Log), điền hoạt động sửa chữa thực tế (đã thay block điều hòa mới).
  3. Nhấn "Hoàn thành bảo trì" (Complete).
  4. Quay lại trang Phòng chiếu (`/rooms`) kiểm tra trạng thái Phòng 2.
  5. Quay lại trang Suất chiếu (`/showtimes`) xếp thử lịch chiếu vào Phòng 2.
- **Kết quả mong đợi:** Trạng thái bảo trì đổi sang "Completed", sự cố đổi sang "Resolved". Phòng 2 tự động được mở khóa về trạng thái "Hoạt động" (Active). Cho phép xếp lịch chiếu vào Phòng 2 bình thường.

---

## 9. Phân quyền Manager / Staff
- **Mô tả:** Kiểm thử độ chặt chẽ trong phân quyền API và giao diện.
- **Các bước thực hiện:**
  1. Đăng nhập bằng Staff. Thử dùng công cụ devtools (hoặc postman) gửi request DELETE đến `/api/room/1` hoặc POST `/api/showtime`.
  2. Kiểm tra mã lỗi trả về.
- **Kết quả mong đợi:** Phải trả về mã lỗi `403 Forbidden` hoặc `401 Unauthorized` từ server. Staff không thể thực hiện các thao tác quản trị đặc quyền.

---

## 10. Responsive trên Desktop / Tablet / Mobile
- **Mô tả:** Kiểm tra độ tương thích giao diện trên các kích thước màn hình khác nhau.
- **Các bước thực hiện:**
  1. Truy cập trang ứng dụng trên trình duyệt Chrome.
  2. Nhấn F12 mở DevTools, chọn chế độ giả lập thiết bị (Toggle device toolbar).
  3. Chọn lần lượt các kích thước: Desktop (1920px), Tablet (iPad Air - 820px), Mobile (iPhone 14 - 393px).
  4. Kiểm tra xem thanh sidebar có tự động thu gọn/ẩn đi chuyển thành menu hamburger trên mobile không.
  5. Các bảng danh sách (Table) có hiển thị thanh cuộn ngang mượt mà, không bị vỡ bố cục hay tràn chữ.
- **Kết quả mong đợi:** Giao diện hiển thị đúng chuẩn responsive, font chữ co giãn hợp lý, không xảy ra hiện tượng chồng chéo phần tử hay tràn màn hình.
