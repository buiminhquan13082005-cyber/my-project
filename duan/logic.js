// Chuyển đổi giữa các tab
function show(id) {
    document.querySelectorAll('section').forEach(s => s.style.display = 'none');
    document.getElementById('sec-' + id).style.display = 'block';
    
    // Nếu mở tab phân việc, cập nhật danh sách nhân viên ngay
    if(id === 'phanviec') refreshEmployeeList();
}

// Thêm nhân viên mới
function addStaff() {
    const name = document.getElementById('newName').value;
    const role = document.getElementById('newRole').value;
    if(!name) return alert("Nhập tên!");

    const row = `<tr><td>${name}</td><td>${role}</td><td><button class="btn btn-sm btn-danger" onclick="this.parentElement.parentElement.remove()">Xóa</button></td></tr>`;
    document.getElementById('staffTable').innerHTML += row;
    bootstrap.Modal.getInstance(document.getElementById('addModal')).hide();
    document.getElementById('newName').value = "";
}

// Cập nhật danh sách nhân viên vào ô chọn phân việc
function refreshEmployeeList() {
    const sel = document.getElementById('selEmp');
    sel.innerHTML = "";
    const rows = document.querySelectorAll('#staffTable tr');
    rows.forEach(r => {
        const name = r.cells[0].innerText;
        const role = r.cells[1].innerText;
        sel.innerHTML += `<option value="${name}" data-role="${role}">${name} (${role})</option>`;
    });
}

// Giao việc đa năng
function assignTask() {
    const name = document.getElementById('selEmp').value;
    const loc = document.getElementById('selLoc').value;
    const note = document.getElementById('taskNote').value;
    if(!note) return alert("Nhập công việc!");

    const log = document.getElementById('taskLog');
    const time = new Date().toLocaleTimeString();
    log.innerHTML = `<tr>
        <td><b>${time}</b></td>
        <td><span class="badge bg-info text-dark">${name}</span></td>
        <td><i class="bi bi-geo-alt"></i> ${loc}</td>
        <td>${note}</td>
        <td><span class="text-warning">● Đang thực hiện</span></td>
    </tr>` + log.innerHTML;

    document.getElementById('taskNote').value = "";
}