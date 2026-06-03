// ===== Config =====
// Địa chỉ API backend cho module đặt vé
const API_BASE = 'http://localhost:5050/api/booking';

// ===== State (Biến trạng thái toàn cục) =====
let currentStep = 1;           // Bước hiện tại trong quy trình đặt vé (1-3)
let selectedShowtime = null;   // Xuất chiếu đã chọn
let selectedSeats = [];        // Mảng các ghế đã chọn (seat objects)
let allSeatData = null;        // Dữ liệu sơ đồ ghế từ API

// ===== Init =====
document.addEventListener('DOMContentLoaded', () => {
    loadShowtimes();
});

// ===== Navigation =====
/**
 * Chuyển đổi giữa section "Đặt vé" và "Tra cứu vé".
 * @param {string} section - Tên section ('booking' hoặc 'lookup')
 */
function showSection(section) {
    document.getElementById('section-booking').style.display = section === 'booking' ? 'block' : 'none';
    document.getElementById('section-lookup').style.display = section === 'lookup' ? 'block' : 'none';

    document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('nav-active'));
    event.target.classList.add('nav-active');

    if (section === 'booking') {
        resetBooking();
    }
}

// ===== Step Management =====
/**
 * Chuyển bước trong quy trình đặt vé (3 bước).
 * Bước 1: Chọn xuất chiếu | Bước 2: Chọn ghế | Bước 3: Xác nhận
 * @param {number} step - Số bước (1, 2, hoặc 3)
 */
function goToStep(step) {
    currentStep = step;

    // Hide all steps
    document.querySelectorAll('.step-content').forEach(el => el.classList.remove('active'));

    // Show current step
    const stepEl = document.getElementById(`step-${step}`);
    if (stepEl) stepEl.classList.add('active');

    // Update step indicators
    for (let i = 1; i <= 3; i++) {
        const ind = document.getElementById(`step-ind-${i}`);
        ind.classList.remove('active', 'completed');
        if (i === step) ind.classList.add('active');
        else if (i < step) ind.classList.add('completed');
    }

    // Update step lines
    document.getElementById('step-line-1').classList.toggle('active', step >= 2);
    document.getElementById('step-line-2').classList.toggle('active', step >= 3);

    // If going to step 3, populate confirmation
    if (step === 3) {
        populateConfirmation();
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===== Step 1: Load Showtimes =====
/**
 * Tải danh sách xuất chiếu đang/sắp chiếu từ API.
 * Nhóm theo ngày để hiển thị. Gọi khi trang load hoặc reset booking.
 */
async function loadShowtimes() {
    const loading = document.getElementById('showtimes-loading');
    const list = document.getElementById('showtimes-list');
    const empty = document.getElementById('showtimes-empty');

    loading.style.display = 'block';
    list.innerHTML = '';
    empty.style.display = 'none';

    try {
        const res = await fetch(`${API_BASE}/showtimes`);
        if (!res.ok) throw new Error('Không thể tải lịch chiếu');

        const showtimes = await res.json();
        loading.style.display = 'none';

        if (showtimes.length === 0) {
            empty.style.display = 'block';
            return;
        }

        // Group by date
        const grouped = {};
        showtimes.forEach(st => {
            const date = new Date(st.startTime).toLocaleDateString('vi-VN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            if (!grouped[date]) grouped[date] = [];
            grouped[date].push(st);
        });

        let html = '';
        for (const [date, items] of Object.entries(grouped)) {
            html += `<div class="date-group" style="grid-column: 1 / -1; margin-top: 8px;">
                <h3 style="font-size: 15px; color: var(--text-muted); margin-bottom: 12px; text-transform: capitalize;">
                    📅 ${date}
                </h3>
            </div>`;

            items.forEach(st => {
                const startTime = new Date(st.startTime);
                const endTime = new Date(st.endTime);
                const timeStr = `${formatTime(startTime)} - ${formatTime(endTime)}`;

                html += `
                <div class="showtime-card" onclick="selectShowtime(${st.showtimeID})" id="showtime-card-${st.showtimeID}">
                    <div class="showtime-movie">${escapeHtml(st.movieTitle)}</div>
                    <div class="showtime-meta">
                        <div class="showtime-meta-row">
                            <span class="icon">🏠</span>
                            <span>${escapeHtml(st.roomName)}</span>
                        </div>
                        <div class="showtime-meta-row">
                            <span class="icon">🕐</span>
                            <span>${timeStr}</span>
                        </div>
                    </div>
                    <span class="showtime-badge badge-time">🎬 ${formatTime(startTime)}</span>
                </div>`;
            });
        }

        list.innerHTML = html;
    } catch (err) {
        loading.style.display = 'none';
        list.innerHTML = `<div class="empty-state" style="grid-column: 1 / -1;">
            <div class="empty-icon">⚠️</div>
            <p>${err.message}</p>
            <button class="btn-primary" style="margin-top: 16px;" onclick="loadShowtimes()">Thử lại</button>
        </div>`;
    }
}

// ===== Select Showtime & Load Seats =====
/**
 * Xử lý khi user chọn 1 xuất chiếu: load sơ đồ ghế và chuyển sang bước 2.
 * @param {number} showtimeId - ID của xuất chiếu được chọn
 */
async function selectShowtime(showtimeId) {
    selectedSeats = [];

    try {
        const res = await fetch(`${API_BASE}/showtime/${showtimeId}/seats`);
        if (!res.ok) throw new Error('Không thể tải sơ đồ ghế');

        allSeatData = await res.json();
        selectedShowtime = allSeatData.showtime;

        // Show step 2
        goToStep(2);

        // Showtime info bar
        const startTime = new Date(selectedShowtime.startTime);
        const endTime = new Date(selectedShowtime.endTime);

        document.getElementById('showtime-info').innerHTML = `
            <div class="info-chip"><span>🎬</span> <strong>${escapeHtml(selectedShowtime.movieTitle)}</strong></div>
            <div class="info-chip"><span>🏠</span> <strong>${escapeHtml(selectedShowtime.roomName)}</strong></div>
            <div class="info-chip"><span>🕐</span> <strong>${formatTime(startTime)} - ${formatTime(endTime)}</strong></div>
            <div class="info-chip"><span>💺</span> Trống: <strong>${allSeatData.availableCount}/${allSeatData.totalSeats}</strong></div>
        `;

        renderSeatMap(allSeatData.seats);
        updateSelectionSummary();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

// ===== Render Seat Map =====
/**
 * Render sơ đồ ghế ngồi theo hàng (A, B, C...).
 * Ghế đã đặt có class 'booked', ghế VIP có class 'vip'.
 * @param {Array} seats - Mảng đối tượng ghế từ API (có isBooked, seatType...)
 */
function renderSeatMap(seats) {
    const container = document.getElementById('seat-map');

    // Group by row
    const rows = {};
    seats.forEach(s => {
        if (!rows[s.seatRow]) rows[s.seatRow] = [];
        rows[s.seatRow].push(s);
    });

    let html = '';
    for (const [rowName, rowSeats] of Object.entries(rows)) {
        html += `<div class="seat-row">`;
        html += `<div class="seat-row-label">${rowName}</div>`;

        rowSeats.sort((a, b) => a.seatNumber - b.seatNumber);

        rowSeats.forEach(seat => {
            const isVip = seat.seatType === 'VIP';
            let classes = 'seat';

            if (seat.isBooked) {
                classes += ' booked';
            } else {
                classes += ' available';
                if (isVip) classes += ' vip';
            }

            const label = `${seat.seatRow}${seat.seatNumber}`;
            html += `<div class="${classes}" 
                          data-seat-id="${seat.seatID}" 
                          title="${label} (${seat.seatType})"
                          onclick="toggleSeat(${seat.seatID})">${seat.seatNumber}</div>`;
        });

        html += `<div class="seat-row-label">${rowName}</div>`;
        html += `</div>`;
    }

    container.innerHTML = html;
}

// ===== Toggle Seat Selection =====
/**
 * Bật/tắt chọn ghế khi click. Ghế đã đặt (booked) sẽ bị bỏ qua.
 * Cập nhật mảng selectedSeats và giao diện.
 * @param {number} seatId - ID ghế được click
 */
function toggleSeat(seatId) {
    const seatData = allSeatData.seats.find(s => s.seatID === seatId);
    if (!seatData || seatData.isBooked) return;

    const seatEl = document.querySelector(`.seat[data-seat-id="${seatId}"]`);
    const idx = selectedSeats.findIndex(s => s.seatID === seatId);

    if (idx >= 0) {
        // Deselect
        selectedSeats.splice(idx, 1);
        seatEl.classList.remove('selected');
        seatEl.classList.add('available');
    } else {
        // Select
        selectedSeats.push(seatData);
        seatEl.classList.remove('available');
        seatEl.classList.add('selected');
    }

    updateSelectionSummary();
}

// ===== Update Selection Summary =====
/**
 * Cập nhật thanh tóm tắt ghế đã chọn ở cuối màn hình.
 * Hiển thị danh sách tên ghế (vd: A1, A2, F3) và số lượng.
 */
function updateSelectionSummary() {
    const summary = document.getElementById('selection-summary');

    if (selectedSeats.length === 0) {
        summary.style.display = 'none';
        return;
    }

    summary.style.display = 'flex';

    // Sort selected seats by row then number
    const sorted = [...selectedSeats].sort((a, b) => {
        if (a.seatRow !== b.seatRow) return a.seatRow.localeCompare(b.seatRow);
        return a.seatNumber - b.seatNumber;
    });

    const seatNames = sorted.map(s => `${s.seatRow}${s.seatNumber}`).join(', ');

    document.getElementById('selected-seats-text').textContent = seatNames;
    document.getElementById('selected-count').textContent = selectedSeats.length;
}

// ===== Populate Confirmation =====
/**
 * Điền thông tin xác nhận vào bước 3 (tên phim, phòng, giờ chiếu, ghế đã chọn).
 * Được gọi tự động khi chuyển sang bước 3.
 */
function populateConfirmation() {
    if (!selectedShowtime || selectedSeats.length === 0) return;

    const startTime = new Date(selectedShowtime.startTime);

    document.getElementById('confirm-movie').textContent = selectedShowtime.movieTitle;
    document.getElementById('confirm-room').textContent = selectedShowtime.roomName;
    document.getElementById('confirm-time').textContent = `${formatDate(startTime)} • ${formatTime(startTime)}`;

    const sorted = [...selectedSeats].sort((a, b) => {
        if (a.seatRow !== b.seatRow) return a.seatRow.localeCompare(b.seatRow);
        return a.seatNumber - b.seatNumber;
    });
    const seatNames = sorted.map(s => `${s.seatRow}${s.seatNumber} (${s.seatType})`).join(', ');
    document.getElementById('confirm-seats').textContent = seatNames;
}

// ===== Confirm Booking =====
/**
 * Gửi yêu cầu đặt vé tới API. Validate tên + SĐT trước khi gửi.
 * POST body: { showtimeID, seatIDs, customerName, customerPhone }
 * Nếu thành công → hiển thị mã vé. Nếu thất bại → hiển thị lỗi.
 */
async function confirmBooking() {
    const nameInput = document.getElementById('customer-name');
    const phoneInput = document.getElementById('customer-phone');
    const nameError = document.getElementById('error-customer-name');
    const phoneError = document.getElementById('error-customer-phone');

    // Reset validation errors
    nameInput.classList.remove('is-invalid');
    phoneInput.classList.remove('is-invalid');
    nameError.textContent = '';
    nameError.style.display = 'none';
    phoneError.textContent = '';
    phoneError.style.display = 'none';

    const name = nameInput.value.trim();
    const phone = phoneInput.value.trim();
    let hasError = false;

    if (!name) {
        nameInput.classList.add('is-invalid');
        nameError.textContent = 'Vui lòng nhập họ và tên!';
        nameError.style.display = 'block';
        hasError = true;
    }

    if (!phone) {
        phoneInput.classList.add('is-invalid');
        phoneError.textContent = 'Vui lòng nhập số điện thoại!';
        phoneError.style.display = 'block';
        hasError = true;
    } else {
        const phoneRegex = /^[0-9]{10}$/;
        if (!phoneRegex.test(phone)) {
            phoneInput.classList.add('is-invalid');
            phoneError.textContent = 'Số điện thoại phải gồm 10 chữ số!';
            phoneError.style.display = 'block';
            hasError = true;
        }
    }

    if (hasError) {
        const firstInvalid = document.querySelector('.is-invalid');
        if (firstInvalid) firstInvalid.focus();
        return;
    }

    const btn = document.getElementById('btn-confirm');
    btn.disabled = true;
    btn.textContent = 'Đang xử lý...';

    try {
        const res = await fetch(API_BASE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                showtimeID: selectedShowtime.showtimeID,
                seatIDs: selectedSeats.map(s => s.seatID),
                customerName: name,
                customerPhone: phone
            })
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.message || 'Đặt vé thất bại');
        }

        // Show success
        showSuccessStep(data, name, phone);
    } catch (err) {
        showToast(err.message, 'error');
        btn.disabled = false;
        btn.textContent = '🎫 Xác Nhận Đặt Vé';
    }
}

// ===== Show Success =====
/**
 * Hiển thị màn hình thành công sau khi đặt vé.
 * Hiển thị mã vé, thông tin khách hàng, phim, phòng, ghế.
 * @param {Object} data - Response từ API (chứa bookings[])
 * @param {string} name - Tên khách hàng
 * @param {string} phone - Số điện thoại khách hàng
 */
function showSuccessStep(data, name, phone) {
    // Hide all steps, show success
    document.querySelectorAll('.step-content').forEach(el => el.classList.remove('active'));
    document.getElementById('step-success').classList.add('active');

    // Update step indicators to all completed
    for (let i = 1; i <= 3; i++) {
        document.getElementById(`step-ind-${i}`).classList.add('completed');
        document.getElementById(`step-ind-${i}`).classList.remove('active');
    }
    document.getElementById('step-line-1').classList.add('active');
    document.getElementById('step-line-2').classList.add('active');

    const startTime = new Date(selectedShowtime.startTime);
    const sorted = [...selectedSeats].sort((a, b) => {
        if (a.seatRow !== b.seatRow) return a.seatRow.localeCompare(b.seatRow);
        return a.seatNumber - b.seatNumber;
    });
    const seatNames = sorted.map(s => `${s.seatRow}${s.seatNumber}`).join(', ');

    document.getElementById('success-details').innerHTML = `
        <div class="detail-row">
            <span class="detail-label">Mã vé:</span>
            <span class="detail-value highlight">#${data.bookings.map(b => b.bookingID).join(', #')}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Khách hàng:</span>
            <span class="detail-value">${escapeHtml(name)}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Điện thoại:</span>
            <span class="detail-value">${escapeHtml(phone)}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Phim:</span>
            <span class="detail-value">${escapeHtml(selectedShowtime.movieTitle)}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Phòng:</span>
            <span class="detail-value">${escapeHtml(selectedShowtime.roomName)}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Suất chiếu:</span>
            <span class="detail-value">${formatDate(startTime)} • ${formatTime(startTime)}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Ghế:</span>
            <span class="detail-value highlight">${seatNames}</span>
        </div>
    `;

    showToast('🎉 Đặt vé thành công!', 'success');
}

// ===== Reset Booking =====
/**
 * Reset toàn bộ trạng thái đặt vé: xóa ghế đã chọn, xóa form,
 * quay về bước 1 và tải lại danh sách xuất chiếu.
 */
function resetBooking() {
    currentStep = 1;
    selectedShowtime = null;
    selectedSeats = [];
    allSeatData = null;

    const nameInput = document.getElementById('customer-name');
    const phoneInput = document.getElementById('customer-phone');
    nameInput.value = '';
    phoneInput.value = '';
    nameInput.classList.remove('is-invalid');
    phoneInput.classList.remove('is-invalid');

    document.getElementById('error-customer-name').textContent = '';
    document.getElementById('error-customer-name').style.display = 'none';
    document.getElementById('error-customer-phone').textContent = '';
    document.getElementById('error-customer-phone').style.display = 'none';

    const btn = document.getElementById('btn-confirm');
    btn.disabled = false;
    btn.textContent = '🎫 Xác Nhận Đặt Vé';

    goToStep(1);
    loadShowtimes();
}

// ===== Lookup Tickets =====
/**
 * Tra cứu vé đã đặt theo số điện thoại.
 * Gọi API GET /booking/lookup?phone=xxx và hiển thị danh sách vé.
 */
async function lookupTickets() {
    const phone = document.getElementById('lookup-phone').value.trim();
    const resultsEl = document.getElementById('lookup-results');

    if (!phone) {
        showToast('Vui lòng nhập số điện thoại!', 'error');
        return;
    }

    resultsEl.innerHTML = '<div class="loading"><div class="spinner"></div><p>Đang tra cứu...</p></div>';

    try {
        const res = await fetch(`${API_BASE}/lookup?phone=${encodeURIComponent(phone)}`);
        if (!res.ok) throw new Error('Tra cứu thất bại');

        const bookings = await res.json();

        if (bookings.length === 0) {
            resultsEl.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <div class="empty-icon">🎫</div>
                    <p>Không tìm thấy vé nào cho số điện thoại này.</p>
                </div>`;
            return;
        }

        let html = '';
        bookings.forEach(b => {
            const startTime = b.startTime ? new Date(b.startTime) : null;
            html += `
            <div class="ticket-card">
                <div class="ticket-movie">${escapeHtml(b.movieTitle || 'N/A')}</div>
                <div class="ticket-info">
                    <div>🏠 ${escapeHtml(b.roomName || 'N/A')}</div>
                    <div>🕐 ${startTime ? `${formatDate(startTime)} • ${formatTime(startTime)}` : 'N/A'}</div>
                    <div>👤 ${escapeHtml(b.customerName)}</div>
                </div>
                <span class="ticket-seat-badge">💺 ${b.seatRow}${b.seatNumber} (${b.seatType || 'Standard'})</span>
                <button class="ticket-cancel-btn" onclick="cancelTicket(${b.bookingID}, this)">❌ Hủy vé</button>
            </div>`;
        });

        resultsEl.innerHTML = html;
    } catch (err) {
        resultsEl.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <div class="empty-icon">⚠️</div>
                <p>${err.message}</p>
            </div>`;
    }
}

// ===== Cancel Ticket =====
/**
 * Hủy vé đã đặt. Gọi API DELETE /booking/{id}.
 * Xóa card vé với animation fade-out sau khi hủy thành công.
 * @param {number} bookingId - ID vé cần hủy
 * @param {HTMLElement} btnEl - Nút hủy (để disable khi đang xử lý)
 */
async function cancelTicket(bookingId, btnEl) {
    if (!confirm('Bạn có chắc muốn hủy vé này?')) return;

    btnEl.disabled = true;
    btnEl.textContent = 'Đang hủy...';

    try {
        const res = await fetch(`${API_BASE}/${bookingId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Hủy vé thất bại');

        showToast('Đã hủy vé thành công!', 'success');

        // Remove the card with animation
        const card = btnEl.closest('.ticket-card');
        card.style.transition = 'all 0.3s ease';
        card.style.opacity = '0';
        card.style.transform = 'scale(0.95)';
        setTimeout(() => card.remove(), 300);
    } catch (err) {
        showToast(err.message, 'error');
        btnEl.disabled = false;
        btnEl.textContent = '❌ Hủy vé';
    }
}

// ===== Utilities (Hàm tiện ích) =====
/** Format Date object thành chuỗi giờ "HH:mm" theo locale Việt Nam */
function formatTime(date) {
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

/** Format Date object thành chuỗi ngày "dd/MM/yyyy" theo locale Việt Nam */
function formatDate(date) {
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** Escape ký tự HTML đặc biệt để tránh XSS khi chèn vào innerHTML */
function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/** Hiển thị thông báo toast (success/error) ở cuối màn hình, tự ẩn sau 3 giây */
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

/** Lọc bỏ số và ký tự đặc biệt khỏi ô nhập Họ và tên */
function cleanNameInput(input) {
    input.value = input.value.replace(/[0-9~!@#$%^&*()_+={}|[\]\\:";'<>?,./;]/g, '');
}

// Allow Enter key on lookup input
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const lookupInput = document.getElementById('lookup-phone');
        if (document.activeElement === lookupInput) {
            lookupTickets();
        }
    }
});
