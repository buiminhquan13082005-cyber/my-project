const API = 'https://localhost:7001/api';
let token = localStorage.getItem('token') || '';
const headers = () => ({'Content-Type':'application/json','Authorization':'Bearer '+token});

// Utilities
function toast(msg,type='success'){const c=document.getElementById('toastContainer');const t=document.createElement('div');t.className='toast toast-'+type;t.innerHTML='<i class="fas fa-'+(type==='success'?'check-circle':type==='error'?'times-circle':'info-circle')+'"></i>'+msg;c.appendChild(t);setTimeout(()=>t.remove(),3500)}
function formatDate(d){if(!d)return'-';return new Date(d).toLocaleDateString('vi-VN')}
function formatDateTime(d){if(!d)return'-';return new Date(d).toLocaleString('vi-VN',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})}
function movieStatusBadge(s){const m={'NowShowing':['movie-status-nowshowing','Đang chiếu'],'ComingSoon':['movie-status-comingsoon','Sắp chiếu'],'Ended':['movie-status-ended','Đã kết thúc']};const v=m[s]||['','?'];return '<span class="status-badge '+v[0]+'">'+v[1]+'</span>'}
function roomStatusBadge(s){const m={'Active':['room-status-active','Hoạt động'],'Maintenance':['room-status-maintenance','Bảo trì'],'Inactive':['room-status-inactive','Ngừng']};const v=m[s]||['','?'];return '<span class="status-badge '+v[0]+'">'+v[1]+'</span>'}
function formatMoney(n){return new Intl.NumberFormat('vi-VN').format(n)+'đ'}
function statusBadge(s){const m={'Pending':'pending','Assigned':'assigned','InProgress':'inprogress','NeedReplacement':'needreplacement','Completed':'completed'};return '<span class="status-badge status-'+(m[s]||'pending')+'">'+s+'</span>'}
function categoryLabel(c){const m={'MayChieu':'Máy chiếu','Loa':'Loa','GheNgoi':'Ghế ngồi','LinhKienDienTu':'Linh kiện ĐT','MayBong':'Máy bỏng','MayLamNuoc':'Máy nước'};return m[c]||c}
async function api(path,method='GET',body=null){try{const opts={method,headers:headers()};if(body)opts.body=JSON.stringify(body);const r=await fetch(API+path,opts);if(r.status===401){showLogin();return null}return await r.json()}catch(e){toast('Lỗi kết nối: '+e.message,'error');return null}}

// Auth
function showLogin(){document.getElementById('loginScreen').style.display='flex';document.getElementById('mainApp').style.display='none'}
function showApp(){document.getElementById('loginScreen').style.display='none';document.getElementById('mainApp').style.display='flex';loadDashboard()}
document.getElementById('loginForm').addEventListener('submit',async e=>{e.preventDefault();const email=document.getElementById('loginEmail').value;const pass=document.getElementById('loginPassword').value;try{const r=await fetch(API+'/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password:pass})});const d=await r.json();if(d.status==='success'){token=d.data.token;localStorage.setItem('token',token);showApp()}else{document.getElementById('loginError').style.display='block';document.getElementById('loginError').textContent=d.message||'Đăng nhập thất bại'}}catch(e){document.getElementById('loginError').style.display='block';document.getElementById('loginError').textContent='Lỗi kết nối server'}});
document.getElementById('btnLogout').addEventListener('click',()=>{token='';localStorage.removeItem('token');showLogin()});

// Navigation
let equipments=[], storages=[], movies=[], rooms=[];
document.querySelectorAll('.nav-item').forEach(n=>n.addEventListener('click',e=>{e.preventDefault();document.querySelectorAll('.nav-item').forEach(x=>x.classList.remove('active'));n.classList.add('active');const p=n.dataset.page;document.querySelectorAll('.page').forEach(x=>x.classList.remove('active'));document.getElementById('page'+p.charAt(0).toUpperCase()+p.slice(1)).classList.add('active');document.getElementById('pageTitle').textContent=n.querySelector('span').textContent;if(p==='dashboard')loadDashboard();if(p==='equipment')loadEquipments();if(p==='maintenance')loadMaintenance();if(p==='warehouse')loadStorage();if(p==='reports')initReports();if(p==='movies')loadMovies();if(p==='rooms')loadRooms();if(p==='showtimes')loadShowtimes();if(p==='incidents')loadIncidents()}));

// Sidebar toggle
document.getElementById('sidebarToggle').addEventListener('click',()=>document.getElementById('sidebar').classList.toggle('collapsed'));

// Dashboard
async function loadDashboard(){
  const [eq,maint,st,alerts]=await Promise.all([api('/equipment'),api('/maintenance'),api('/equipment/storage'),api('/equipment/alerts')]);
  if(eq)document.querySelector('#statEquipments .stat-value').textContent=eq.length;
  if(maint){document.querySelector('#statPendingMaintenance .stat-value').textContent=maint.filter(m=>m.status!=='Completed').length;document.querySelector('#statCompleted .stat-value').textContent=maint.filter(m=>m.status==='Completed').length;
    let html='';maint.slice(0,5).forEach(m=>{html+='<div class="maintenance-item"><div>'+statusBadge(m.status)+'</div><div style="flex:1"><div style="font-weight:600;font-size:.85rem">'+m.equipmentName+'</div><div style="font-size:.75rem;color:var(--text-muted)">'+m.description+'</div></div><div style="font-size:.75rem;color:var(--text-muted)">'+formatDate(m.createdAt)+'</div></div>'});
    document.getElementById('recentMaintenance').innerHTML=html||'<div class="empty-state"><p>Chưa có yêu cầu</p></div>'}
  if(st){const low=st.filter(s=>s.isLowStock);document.querySelector('#statLowStock .stat-value').textContent=low.length}
  if(alerts){document.getElementById('alertBadge').textContent=alerts.length;document.getElementById('alertBadge').style.display=alerts.length?'flex':'none';
    let html='';alerts.forEach(a=>{const cls=a.severity==='Critical'?'alert-critical':a.severity==='Warning'?'alert-warning':'alert-info';html+='<div class="alert-item '+cls+'"><div class="alert-icon"><i class="fas fa-'+(a.type==='LowStock'?'box-open':a.type==='MaintenanceDue'?'tools':'clock')+'"></i></div><div><div class="alert-message">'+a.message+'</div><div class="alert-type">'+a.type+'</div></div></div>'});
    document.getElementById('alertsList').innerHTML=html||'<div class="empty-state"><p>Không có cảnh báo</p></div>'}
}
document.getElementById('btnScanMaintenance').addEventListener('click',async()=>{const r=await api('/maintenance/scan','POST');if(r){toast(r.newRequests>0?'Tạo '+r.newRequests+' yêu cầu mới':'Không có thiết bị nào cần bảo trì','info');loadDashboard()}});

// Equipment
async function loadEquipments(){
  equipments=await api('/equipment')||[];
  renderEquipments(equipments);
}
function renderEquipments(list){
  let html='';list.forEach(e=>{html+='<tr><td>'+e.equipmentID+'</td><td><strong>'+e.equipmentName+'</strong></td><td>'+categoryLabel(e.category)+'</td><td style="font-size:.8rem;max-width:200px">'+e.technicalSpecs+'</td><td>'+e.manufacturer+'</td><td>'+e.unit+'</td><td><button class="btn btn-xs btn-outline" onclick="editEquipment('+e.equipmentID+')"><i class="fas fa-edit"></i></button> <button class="btn btn-xs btn-danger" onclick="deleteEquipment('+e.equipmentID+')"><i class="fas fa-trash"></i></button></td></tr>'});
  document.getElementById('equipmentTableBody').innerHTML=html||'<tr><td colspan="7" class="empty-state">Chưa có thiết bị</td></tr>';
}
document.getElementById('equipmentSearch').addEventListener('input',e=>{const q=e.target.value.toLowerCase();renderEquipments(equipments.filter(x=>x.equipmentName.toLowerCase().includes(q)||x.category.toLowerCase().includes(q)))});

function showModal(title,html){document.getElementById('modalTitle').textContent=title;document.getElementById('modalBody').innerHTML=html;document.getElementById('modalOverlay').style.display='flex'}
function hideModal(){document.getElementById('modalOverlay').style.display='none'}
document.getElementById('modalClose').addEventListener('click',hideModal);
document.getElementById('modalOverlay').addEventListener('click',e=>{if(e.target===e.currentTarget)hideModal()});

document.getElementById('btnAddEquipment').addEventListener('click',()=>{
  showModal('Thêm thiết bị','<form id="eqForm" class="form-grid"><div class="form-group"><label>Tên thiết bị</label><input class="form-input" id="eqName" required></div><div class="form-group"><label>Phân loại</label><select class="form-select" id="eqCat"><option value="MayChieu">Máy chiếu</option><option value="Loa">Loa</option><option value="GheNgoi">Ghế ngồi</option><option value="LinhKienDienTu">Linh kiện ĐT</option><option value="MayBong">Máy bỏng</option><option value="MayLamNuoc">Máy nước</option></select></div><div class="form-group"><label>Thông số</label><input class="form-input" id="eqSpecs"></div><div class="form-group"><label>Nhà SX</label><input class="form-input" id="eqMfr"></div><div class="form-group"><label>Đơn vị</label><input class="form-input" id="eqUnit" value="Cái"></div><div class="form-actions full-width"><button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Lưu</button></div></form>');
  document.getElementById('eqForm').addEventListener('submit',async e=>{e.preventDefault();const r=await api('/equipment','POST',{equipmentName:document.getElementById('eqName').value,category:document.getElementById('eqCat').value,technicalSpecs:document.getElementById('eqSpecs').value,manufacturer:document.getElementById('eqMfr').value,unit:document.getElementById('eqUnit').value});if(r){toast('Đã thêm thiết bị');hideModal();loadEquipments()}})
});
window.editEquipment=async function(id){
  const eq=equipments.find(e=>e.equipmentID===id);if(!eq)return;
  showModal('Sửa thiết bị','<form id="eqForm" class="form-grid"><div class="form-group"><label>Tên</label><input class="form-input" id="eqName" value="'+eq.equipmentName+'" required></div><div class="form-group"><label>Phân loại</label><select class="form-select" id="eqCat"><option value="MayChieu"'+(eq.category==='MayChieu'?' selected':'')+'>Máy chiếu</option><option value="Loa"'+(eq.category==='Loa'?' selected':'')+'>Loa</option><option value="GheNgoi"'+(eq.category==='GheNgoi'?' selected':'')+'>Ghế</option><option value="LinhKienDienTu"'+(eq.category==='LinhKienDienTu'?' selected':'')+'>Linh kiện</option><option value="MayBong"'+(eq.category==='MayBong'?' selected':'')+'>Máy bỏng</option><option value="MayLamNuoc"'+(eq.category==='MayLamNuoc'?' selected':'')+'>Máy nước</option></select></div><div class="form-group"><label>Thông số</label><input class="form-input" id="eqSpecs" value="'+eq.technicalSpecs+'"></div><div class="form-group"><label>Nhà SX</label><input class="form-input" id="eqMfr" value="'+eq.manufacturer+'"></div><div class="form-group"><label>Đơn vị</label><input class="form-input" id="eqUnit" value="'+eq.unit+'"></div><div class="form-actions full-width"><button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Cập nhật</button></div></form>');
  document.getElementById('eqForm').addEventListener('submit',async e=>{e.preventDefault();const r=await api('/equipment/'+id,'PUT',{equipmentName:document.getElementById('eqName').value,category:document.getElementById('eqCat').value,technicalSpecs:document.getElementById('eqSpecs').value,manufacturer:document.getElementById('eqMfr').value,unit:document.getElementById('eqUnit').value});if(r){toast('Đã cập nhật');hideModal();loadEquipments()}})
};
window.deleteEquipment=async function(id){if(!confirm('Xóa thiết bị này?'))return;const r=await api('/equipment/'+id,'DELETE');if(r){toast('Đã xóa');loadEquipments()}};

// Maintenance
async function loadMaintenance(){
  const filter=document.getElementById('maintenanceFilter').value;
  const data=await api('/maintenance'+(filter?'?status='+filter:''))||[];
  let html='';data.forEach(m=>{
    let actions='<button class="btn btn-xs btn-outline" onclick="viewMaintenance('+m.requestID+')"><i class="fas fa-eye"></i></button> ';
    if(m.status==='Pending')actions+='<button class="btn btn-xs btn-primary" onclick="assignMaintenance('+m.requestID+')"><i class="fas fa-user-plus"></i></button> ';
    if(m.status==='Assigned'||m.status==='InProgress')actions+='<button class="btn btn-xs btn-warning" onclick="logMaintenance('+m.requestID+')"><i class="fas fa-clipboard"></i></button> ';
    if(m.status!=='Completed')actions+='<button class="btn btn-xs btn-success" onclick="completeMaintenance('+m.requestID+')"><i class="fas fa-check"></i></button>';
    html+='<tr><td>'+m.requestID+'</td><td>'+m.equipmentName+'</td><td><span class="status-badge '+(m.requestType==='Emergency'?'status-needreplacement':'status-assigned')+'">'+(m.requestType==='Emergency'?'Khẩn cấp':'Định kỳ')+'</span></td><td><span class="priority-'+m.priority.toLowerCase()+'">'+m.priority+'</span></td><td>'+statusBadge(m.status)+'</td><td>'+(m.assignedToName||'<span style="color:var(--text-muted)">Chưa phân</span>')+'</td><td>'+formatDate(m.createdAt)+'</td><td>'+actions+'</td></tr>'});
  document.getElementById('maintenanceTableBody').innerHTML=html||'<tr><td colspan="8" class="empty-state">Không có yêu cầu</td></tr>';
}
document.getElementById('maintenanceFilter').addEventListener('change',loadMaintenance);

document.getElementById('btnAddMaintenance').addEventListener('click',async()=>{
  if(!equipments.length)equipments=await api('/equipment')||[];
  let opts='';equipments.forEach(e=>{opts+='<option value="'+e.equipmentID+'" data-name="'+e.equipmentName+'">'+e.equipmentName+'</option>'});
  showModal('Tạo yêu cầu bảo trì','<form id="mForm" class="form-grid"><div class="form-group"><label>Thiết bị</label><select class="form-select" id="mEq" required>'+opts+'</select></div><div class="form-group"><label>Loại</label><select class="form-select" id="mType"><option value="Emergency">Hỏng bất ngờ</option><option value="Scheduled">Định kỳ</option></select></div><div class="form-group"><label>Ưu tiên</label><select class="form-select" id="mPri"><option value="Normal">Bình thường</option><option value="High">Cao</option><option value="Critical">Khẩn cấp</option><option value="Low">Thấp</option></select></div><div class="form-group"><label>Người báo cáo</label><input class="form-input" id="mReporter" value="Nhân viên"></div><div class="form-group full-width"><label>Mô tả</label><textarea class="form-input" id="mDesc" rows="2" required></textarea></div><div class="form-actions full-width"><button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Tạo</button></div></form>');
  document.getElementById('mForm').addEventListener('submit',async e=>{e.preventDefault();const sel=document.getElementById('mEq');const r=await api('/maintenance','POST',{equipmentID:parseInt(sel.value),equipmentName:sel.options[sel.selectedIndex].dataset.name,requestType:document.getElementById('mType').value,priority:document.getElementById('mPri').value,description:document.getElementById('mDesc').value,reportedByName:document.getElementById('mReporter').value});if(r){toast('Đã tạo yêu cầu');hideModal();loadMaintenance()}})
});

window.viewMaintenance=async function(id){
  const [req,logs]=await Promise.all([api('/maintenance/'+id),api('/maintenance/'+id+'/logs')]);if(!req)return;
  let html='<div style="margin-bottom:16px"><strong>Thiết bị:</strong> '+req.equipmentName+'<br><strong>Loại:</strong> '+req.requestType+'<br><strong>Trạng thái:</strong> '+statusBadge(req.status)+'<br><strong>Mô tả:</strong> '+req.description+'<br><strong>Phân việc:</strong> '+(req.assignedToName||'Chưa')+'</div>';
  if(logs&&logs.length){html+='<h4 style="margin-bottom:8px">Nhật ký bảo trì</h4>';logs.forEach(l=>{html+='<div style="padding:8px;border-left:2px solid var(--primary);margin-bottom:8px;padding-left:12px"><strong>'+l.employeeName+'</strong> - '+l.actionTaken+'<br><span style="font-size:.8rem;color:var(--text-muted)">'+l.notes+' | '+formatDate(l.timestamp)+'</span></div>'})}
  showModal('Chi tiết yêu cầu #'+id,html)
};
window.assignMaintenance=function(id){
  showModal('Phân việc #'+id,'<form id="aForm"><div class="form-group"><label>Nhân viên kỹ thuật</label><input class="form-input" id="aName" required placeholder="Tên nhân viên"></div><div class="form-group"><label>Mã nhân viên</label><input type="number" class="form-input" id="aId" required></div><div class="form-actions"><button type="submit" class="btn btn-primary">Phân việc</button></div></form>');
  document.getElementById('aForm').addEventListener('submit',async e=>{e.preventDefault();const r=await api('/maintenance/'+id+'/assign','PUT',{employeeID:parseInt(document.getElementById('aId').value),employeeName:document.getElementById('aName').value});if(r){toast('Đã phân việc');hideModal();loadMaintenance()}})
};
window.logMaintenance=function(id){
  showModal('Ghi nhật ký #'+id,'<form id="lForm"><div class="form-group"><label>Hành động</label><select class="form-select" id="lAction"><option value="Inspected">Kiểm tra</option><option value="Repaired">Sửa chữa</option><option value="Replaced">Thay thế</option><option value="UsedSpare">Dùng dự phòng</option></select></div><div class="form-group"><label>Tên NV</label><input class="form-input" id="lName" required></div><div class="form-group"><label>Mã NV</label><input type="number" class="form-input" id="lEmpId" required></div><div class="form-group"><label>Ghi chú</label><textarea class="form-input" id="lNotes" rows="2"></textarea></div><div class="form-actions"><button type="submit" class="btn btn-primary">Lưu</button></div></form>');
  document.getElementById('lForm').addEventListener('submit',async e=>{e.preventDefault();const r=await api('/maintenance/'+id+'/log','POST',{employeeID:parseInt(document.getElementById('lEmpId').value),employeeName:document.getElementById('lName').value,actionTaken:document.getElementById('lAction').value,notes:document.getElementById('lNotes').value});if(r){toast('Đã ghi nhật ký');hideModal();loadMaintenance()}})
};
window.completeMaintenance=async function(id){if(!confirm('Xác nhận hoàn tất bảo trì?'))return;const r=await api('/maintenance/'+id+'/complete','PUT');if(r){toast('Hoàn tất bảo trì!');loadMaintenance()}};

// Warehouse
async function loadStorage(){
  storages=await api('/equipment/storage')||[];
  let html='';storages.forEach(s=>{
    const cls=s.isLowStock?'color:var(--danger);font-weight:700':'';
    html+='<tr><td>'+s.equipmentName+'</td><td>'+categoryLabel(s.category)+'</td><td style="'+cls+'">'+s.currentQuantity+'</td><td>'+s.minRequiredQuantity+'</td><td>'+s.conditionStatus+'</td><td>'+s.warehouseLocation+'</td><td>'+(s.isLowStock?'<span class="status-badge status-needreplacement"><i class="fas fa-exclamation-triangle"></i> Thấp</span>':'<span class="status-badge status-completed">Bình thường</span>')+'</td></tr>'});
  document.getElementById('storageTableBody').innerHTML=html;
  if(!equipments.length)equipments=await api('/equipment')||[];
  let opts='';equipments.forEach(e=>{opts+='<option value="'+e.equipmentID+'" data-name="'+e.equipmentName+'">'+e.equipmentName+'</option>'});
  document.getElementById('importEquipmentId').innerHTML=opts;
  document.getElementById('exportEquipmentId').innerHTML=opts;
  loadTransactions();loadChecks();
}
// Tabs
document.querySelectorAll('.tab-btn').forEach(t=>t.addEventListener('click',()=>{document.querySelectorAll('.tab-btn').forEach(x=>x.classList.remove('active'));t.classList.add('active');document.querySelectorAll('.tab-content').forEach(x=>x.classList.remove('active'));document.getElementById('tabContent'+t.dataset.tab.charAt(0).toUpperCase()+t.dataset.tab.slice(1)).classList.add('active')}));

document.getElementById('importForm').addEventListener('submit',async e=>{e.preventDefault();const sel=document.getElementById('importEquipmentId');const r=await api('/warehouse/import','POST',{equipmentID:parseInt(sel.value),equipmentName:sel.options[sel.selectedIndex].dataset.name,quantity:parseInt(document.getElementById('importQuantity').value),unitPrice:parseFloat(document.getElementById('importPrice').value),supplier:document.getElementById('importSupplier').value,reason:document.getElementById('importReason').value,employeeID:1,employeeName:'Admin'});if(r){toast('Nhập kho thành công');e.target.reset();loadStorage()}});
document.getElementById('exportForm').addEventListener('submit',async e=>{e.preventDefault();const sel=document.getElementById('exportEquipmentId');const r=await api('/warehouse/export','POST',{equipmentID:parseInt(sel.value),equipmentName:sel.options[sel.selectedIndex].dataset.name,quantity:parseInt(document.getElementById('exportQuantity').value),reason:document.getElementById('exportReason').value,employeeID:1,employeeName:'Admin'});if(r){toast('Xuất kho thành công');e.target.reset();loadStorage()}else{toast('Xuất kho thất bại','error')}});

async function loadTransactions(){const data=await api('/warehouse/transactions')||[];let html='';data.forEach(t=>{const typeMap={'Import':'<span class="status-badge status-completed">Nhập</span>','Export':'<span class="status-badge status-assigned">Xuất</span>','Damaged':'<span class="status-badge status-needreplacement">Hỏng</span>','Disposed':'<span class="status-badge status-pending">Thanh lý</span>'};html+='<tr><td>'+t.transactionID+'</td><td>'+t.equipmentName+'</td><td>'+(typeMap[t.transactionType]||t.transactionType)+'</td><td>'+t.quantity+'</td><td>'+formatMoney(t.unitPrice)+'</td><td>'+(t.supplier||'-')+'</td><td style="max-width:150px;font-size:.8rem">'+t.reason+'</td><td>'+formatDate(t.transactionDate)+'</td></tr>'});document.getElementById('transactionTableBody').innerHTML=html||'<tr><td colspan="8" class="empty-state">Chưa có giao dịch</td></tr>'}
async function loadChecks(){const data=await api('/warehouse/inventory-checks')||[];let html='';data.forEach(c=>{html+='<tr><td>'+c.checkID+'</td><td>'+c.equipmentName+'</td><td>'+c.systemQuantity+'</td><td>'+c.actualQuantity+'</td><td style="color:'+(c.discrepancy<0?'var(--danger)':c.discrepancy>0?'var(--success)':'var(--text)')+'">'+c.discrepancy+'</td><td style="font-size:.8rem">'+c.notes+'</td><td>'+c.checkedByName+'</td><td>'+formatDate(c.checkDate)+'</td></tr>'});document.getElementById('checksTableBody').innerHTML=html||'<tr><td colspan="8" class="empty-state">Chưa có kiểm kê</td></tr>'}

document.getElementById('btnNewCheck').addEventListener('click',async()=>{
  if(!equipments.length)equipments=await api('/equipment')||[];
  let opts='';equipments.forEach(e=>{opts+='<option value="'+e.equipmentID+'" data-name="'+e.equipmentName+'">'+e.equipmentName+'</option>'});
  showModal('Kiểm kê kho','<form id="ckForm"><div class="form-group"><label>Thiết bị</label><select class="form-select" id="ckEq">'+opts+'</select></div><div class="form-group"><label>SL hệ thống</label><input type="number" class="form-input" id="ckSys" required></div><div class="form-group"><label>SL thực tế</label><input type="number" class="form-input" id="ckActual" required></div><div class="form-group"><label>Người kiểm</label><input class="form-input" id="ckBy" required></div><div class="form-group"><label>Ghi chú</label><textarea class="form-input" id="ckNotes" rows="2"></textarea></div><div class="form-actions"><button type="submit" class="btn btn-primary">Lưu</button></div></form>');
  document.getElementById('ckForm').addEventListener('submit',async e=>{e.preventDefault();const sel=document.getElementById('ckEq');const r=await api('/warehouse/inventory-check','POST',{equipmentID:parseInt(sel.value),equipmentName:sel.options[sel.selectedIndex].dataset.name,systemQuantity:parseInt(document.getElementById('ckSys').value),actualQuantity:parseInt(document.getElementById('ckActual').value),checkedByEmployeeID:1,checkedByName:document.getElementById('ckBy').value,notes:document.getElementById('ckNotes').value});if(r){toast('Đã lưu kiểm kê');hideModal();loadChecks();loadStorage()}})
});

// Reports
function initReports(){document.getElementById('reportDate').value=new Date().toISOString().split('T')[0]}
document.getElementById('btnLoadReport').addEventListener('click',async()=>{
  const date=document.getElementById('reportDate').value;const r=await api('/warehouse/report?date='+date);if(!r)return;
  let html='<div class="report-stats"><div class="report-stat"><span class="value text-success">'+r.totalImports+'</span><span class="label">Nhập kho</span></div><div class="report-stat"><span class="value text-warning">'+r.totalExports+'</span><span class="label">Xuất kho</span></div><div class="report-stat"><span class="value text-danger">'+r.totalDamaged+'</span><span class="label">Hỏng</span></div><div class="report-stat"><span class="value text-primary">'+r.totalDisposed+'</span><span class="label">Thanh lý</span></div></div>';
  if(r.transactions&&r.transactions.length){html+='<table class="data-table"><thead><tr><th>Thiết bị</th><th>Loại</th><th>SL</th><th>Lý do</th></tr></thead><tbody>';r.transactions.forEach(t=>{html+='<tr><td>'+t.equipmentName+'</td><td>'+t.transactionType+'</td><td>'+t.quantity+'</td><td>'+t.reason+'</td></tr>'});html+='</tbody></table>'}else{html+='<div class="empty-state"><p>Không có giao dịch trong ngày '+r.date+'</p></div>'}
  document.getElementById('reportContent').innerHTML=html
});

// ===== MOVIES =====
async function loadMovies(){
  const f=document.getElementById('movieFilter').value;
  movies=await api('/movie'+(f?'?status='+f:''))||[];
  let h='';movies.forEach(m=>{h+='<tr><td>'+m.movieID+'</td><td><strong>'+m.title+'</strong></td><td>'+m.genre+'</td><td>'+m.duration+' phút</td><td>'+formatDate(m.releaseDate)+' - '+formatDate(m.endDate)+'</td><td>'+movieStatusBadge(m.status)+'</td><td><button class="btn btn-xs btn-outline" onclick="editMovie('+m.movieID+')"><i class="fas fa-edit"></i></button> <button class="btn btn-xs btn-danger" onclick="deleteMovie('+m.movieID+')"><i class="fas fa-trash"></i></button></td></tr>'});
  document.getElementById('movieTableBody').innerHTML=h||'<tr><td colspan="7" class="empty-state">Chưa có phim</td></tr>';
}
document.getElementById('movieFilter').addEventListener('change',loadMovies);
document.getElementById('btnAddMovie').addEventListener('click',()=>{
  showModal('Thêm phim','<form id="mvForm" class="form-grid"><div class="form-group"><label>Tên phim</label><input class="form-input" id="mvTitle" required></div><div class="form-group"><label>Thể loại</label><input class="form-input" id="mvGenre" placeholder="Hành động, Phiêu lưu"></div><div class="form-group"><label>Thời lượng (phút)</label><input type="number" class="form-input" id="mvDur" min="1" required></div><div class="form-group"><label>Trạng thái</label><select class="form-select" id="mvStatus"><option value="NowShowing">Đang chiếu</option><option value="ComingSoon">Sắp chiếu</option><option value="Ended">Đã kết thúc</option></select></div><div class="form-group"><label>Ngày bắt đầu</label><input type="date" class="form-input" id="mvStart" required></div><div class="form-group"><label>Ngày kết thúc</label><input type="date" class="form-input" id="mvEnd" required></div><div class="form-group full-width"><label>Mô tả</label><textarea class="form-input" id="mvDesc" rows="2"></textarea></div><div class="form-actions full-width"><button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Lưu</button></div></form>');
  document.getElementById('mvForm').addEventListener('submit',async e=>{e.preventDefault();const r=await api('/movie','POST',{title:document.getElementById('mvTitle').value,genre:document.getElementById('mvGenre').value,duration:parseInt(document.getElementById('mvDur').value),status:document.getElementById('mvStatus').value,releaseDate:document.getElementById('mvStart').value,endDate:document.getElementById('mvEnd').value,description:document.getElementById('mvDesc').value});if(r){toast('Đã thêm phim');hideModal();loadMovies()}})
});
window.editMovie=async function(id){
  const m=movies.find(x=>x.movieID===id);if(!m)return;
  showModal('Sửa phim','<form id="mvForm" class="form-grid"><div class="form-group"><label>Tên</label><input class="form-input" id="mvTitle" value="'+m.title+'" required></div><div class="form-group"><label>Thể loại</label><input class="form-input" id="mvGenre" value="'+m.genre+'"></div><div class="form-group"><label>Thời lượng</label><input type="number" class="form-input" id="mvDur" value="'+m.duration+'"></div><div class="form-group"><label>Trạng thái</label><select class="form-select" id="mvStatus"><option value="NowShowing"'+(m.status==='NowShowing'?' selected':'')+'>Đang chiếu</option><option value="ComingSoon"'+(m.status==='ComingSoon'?' selected':'')+'>Sắp chiếu</option><option value="Ended"'+(m.status==='Ended'?' selected':'')+'>Đã kết thúc</option></select></div><div class="form-group"><label>Bắt đầu</label><input type="date" class="form-input" id="mvStart" value="'+(m.releaseDate||'').split('T')[0]+'"></div><div class="form-group"><label>Kết thúc</label><input type="date" class="form-input" id="mvEnd" value="'+(m.endDate||'').split('T')[0]+'"></div><div class="form-group full-width"><label>Mô tả</label><textarea class="form-input" id="mvDesc" rows="2">'+m.description+'</textarea></div><div class="form-actions full-width"><button type="submit" class="btn btn-primary">Cập nhật</button></div></form>');
  document.getElementById('mvForm').addEventListener('submit',async e=>{e.preventDefault();const r=await api('/movie/'+id,'PUT',{title:document.getElementById('mvTitle').value,genre:document.getElementById('mvGenre').value,duration:parseInt(document.getElementById('mvDur').value),status:document.getElementById('mvStatus').value,releaseDate:document.getElementById('mvStart').value,endDate:document.getElementById('mvEnd').value,description:document.getElementById('mvDesc').value});if(r){toast('Đã cập nhật');hideModal();loadMovies()}})
};
window.deleteMovie=async function(id){if(!confirm('Xóa phim?'))return;const r=await api('/movie/'+id,'DELETE');if(r){toast('Đã xóa');loadMovies()}};

// ===== ROOMS =====
async function loadRooms(){
  rooms=await api('/room')||[];
  let h='';rooms.forEach(r=>{h+='<tr><td>'+r.roomID+'</td><td><strong>'+r.roomName+'</strong></td><td>'+r.capacity+'</td><td>'+roomStatusBadge(r.roomStatus)+'</td><td><button class="btn btn-xs btn-outline" onclick="viewSeats('+r.roomID+')"><i class="fas fa-th"></i> Ghế</button> <button class="btn btn-xs btn-outline" onclick="editRoom('+r.roomID+')"><i class="fas fa-edit"></i></button> <button class="btn btn-xs btn-danger" onclick="deleteRoom('+r.roomID+')"><i class="fas fa-trash"></i></button></td></tr>'});
  document.getElementById('roomTableBody').innerHTML=h||'<tr><td colspan="5" class="empty-state">Chưa có phòng</td></tr>';
}
document.getElementById('btnAddRoom').addEventListener('click',()=>{
  showModal('Thêm phòng','<form id="rmForm"><div class="form-group"><label>Tên phòng</label><input class="form-input" id="rmName" required></div><div class="form-group"><label>Sức chứa</label><input type="number" class="form-input" id="rmCap" min="1" required></div><div class="form-group"><label>Trạng thái</label><select class="form-select" id="rmStatus"><option value="Active">Hoạt động</option><option value="Maintenance">Bảo trì</option><option value="Inactive">Ngừng</option></select></div><div class="form-actions"><button type="submit" class="btn btn-primary">Lưu</button></div></form>');
  document.getElementById('rmForm').addEventListener('submit',async e=>{e.preventDefault();const r=await api('/room','POST',{roomName:document.getElementById('rmName').value,capacity:parseInt(document.getElementById('rmCap').value),roomStatus:document.getElementById('rmStatus').value});if(r){toast('Đã thêm phòng');hideModal();loadRooms()}})
});
window.editRoom=function(id){
  const rm=rooms.find(x=>x.roomID===id);if(!rm)return;
  showModal('Sửa phòng','<form id="rmForm"><div class="form-group"><label>Tên</label><input class="form-input" id="rmName" value="'+rm.roomName+'" required></div><div class="form-group"><label>Sức chứa</label><input type="number" class="form-input" id="rmCap" value="'+rm.capacity+'"></div><div class="form-group"><label>Trạng thái</label><select class="form-select" id="rmStatus"><option value="Active"'+(rm.roomStatus==='Active'?' selected':'')+'>Hoạt động</option><option value="Maintenance"'+(rm.roomStatus==='Maintenance'?' selected':'')+'>Bảo trì</option><option value="Inactive"'+(rm.roomStatus==='Inactive'?' selected':'')+'>Ngừng</option></select></div><div class="form-actions"><button type="submit" class="btn btn-primary">Cập nhật</button></div></form>');
  document.getElementById('rmForm').addEventListener('submit',async e=>{e.preventDefault();const r=await api('/room/'+id,'PUT',{roomName:document.getElementById('rmName').value,capacity:parseInt(document.getElementById('rmCap').value),roomStatus:document.getElementById('rmStatus').value});if(r){toast('Cập nhật xong');hideModal();loadRooms()}})
};
window.deleteRoom=async function(id){if(!confirm('Xóa phòng?'))return;const r=await api('/room/'+id,'DELETE');if(r){toast('Đã xóa');loadRooms()}};
window.viewSeats=async function(id){
  const seats=await api('/room/'+id+'/seats');const rm=rooms.find(x=>x.roomID===id);
  let html='<div class="seat-map"><div class="screen-indicator"></div><div style="font-size:.75rem;color:var(--text-muted);margin-bottom:12px">MÀN HÌNH</div>';
  if(seats&&seats.length){const grouped={};seats.forEach(s=>{if(!grouped[s.seatRow])grouped[s.seatRow]=[];grouped[s.seatRow].push(s)});
    Object.keys(grouped).sort().forEach(row=>{html+='<div class="seat-row"><div class="seat-row-label">'+row+'</div>';grouped[row].sort((a,b)=>a.seatNumber-b.seatNumber).forEach(s=>{html+='<div class="seat seat-'+s.seatType.toLowerCase()+'" title="'+s.seatRow+s.seatNumber+' ('+s.seatType+')">'+s.seatNumber+'</div>'});html+='</div>'});
    html+='</div><div style="display:flex;gap:16px;justify-content:center;margin-top:16px"><span class="seat seat-standard">S</span> Standard <span class="seat seat-vip">V</span> VIP</div>';
  }else{html+='</div><div class="empty-state"><p>Chưa có ghế. Tạo ghế tự động?</p></div>'}
  html+='<hr style="border-color:var(--border);margin:16px 0"><h4>Tạo ghế tự động</h4><form id="genForm" style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap"><input type="number" class="form-input" id="genRows" placeholder="Số hàng" value="8" style="width:100px"><input type="number" class="form-input" id="genCols" placeholder="Ghế/hàng" value="12" style="width:100px"><input type="number" class="form-input" id="genVip" placeholder="Hàng VIP" value="2" style="width:100px"><button type="submit" class="btn btn-primary btn-sm">Tạo ghế</button></form>';
  showModal('Sơ đồ ghế - '+(rm?rm.roomName:''),html);
  document.getElementById('genForm').addEventListener('submit',async e=>{e.preventDefault();const r=await api('/room/'+id+'/seats/generate','POST',{rows:parseInt(document.getElementById('genRows').value),seatsPerRow:parseInt(document.getElementById('genCols').value),vipRows:parseInt(document.getElementById('genVip').value)});if(r){toast(r.message);viewSeats(id);loadRooms()}})
};

// ===== SHOWTIMES =====
async function loadShowtimes(){
  const date=document.getElementById('showtimeDate').value;
  const data=await api('/showtime'+(date?'?date='+date:''))||[];
  let h='';data.forEach(s=>{h+='<tr><td>'+s.showtimeID+'</td><td><strong>'+s.movieTitle+'</strong></td><td>'+s.roomName+'</td><td>'+formatDateTime(s.startTime)+'</td><td>'+formatDateTime(s.endTime)+'</td><td><button class="btn btn-xs btn-danger" onclick="deleteShowtime('+s.showtimeID+')"><i class="fas fa-trash"></i></button></td></tr>'});
  document.getElementById('showtimeTableBody').innerHTML=h||'<tr><td colspan="6" class="empty-state">Chưa có suất chiếu</td></tr>';
  if(!document.getElementById('showtimeDate').value)document.getElementById('showtimeDate').value=new Date().toISOString().split('T')[0];
}
document.getElementById('btnFilterShowtime').addEventListener('click',loadShowtimes);
document.getElementById('btnAddShowtime').addEventListener('click',async()=>{
  if(!movies.length)movies=await api('/movie')||[];if(!rooms.length)rooms=await api('/room')||[];
  let mOpts='',rOpts='';movies.forEach(m=>{mOpts+='<option value="'+m.movieID+'" data-name="'+m.title+'" data-dur="'+m.duration+'">'+m.title+'</option>'});rooms.filter(r=>r.roomStatus==='Active').forEach(r=>{rOpts+='<option value="'+r.roomID+'" data-name="'+r.roomName+'">'+r.roomName+'</option>'});
  showModal('Thêm suất chiếu','<form id="stForm" class="form-grid"><div class="form-group"><label>Phim</label><select class="form-select" id="stMovie" required>'+mOpts+'</select></div><div class="form-group"><label>Phòng</label><select class="form-select" id="stRoom" required>'+rOpts+'</select></div><div class="form-group"><label>Giờ bắt đầu</label><input type="datetime-local" class="form-input" id="stStart" required></div><div class="form-group"><label>Giờ kết thúc (tự tính)</label><input type="datetime-local" class="form-input" id="stEnd" readonly></div><div class="form-actions full-width"><button type="submit" class="btn btn-primary">Tạo</button></div></form>');
  document.getElementById('stStart').addEventListener('change',()=>{const sel=document.getElementById('stMovie');const dur=parseInt(sel.options[sel.selectedIndex].dataset.dur)||120;const start=new Date(document.getElementById('stStart').value);start.setMinutes(start.getMinutes()+dur+15);document.getElementById('stEnd').value=start.toISOString().slice(0,16)});
  document.getElementById('stForm').addEventListener('submit',async e=>{e.preventDefault();const ms=document.getElementById('stMovie'),rs=document.getElementById('stRoom');const r=await api('/showtime','POST',{movieID:parseInt(ms.value),movieTitle:ms.options[ms.selectedIndex].dataset.name,roomID:parseInt(rs.value),roomName:rs.options[rs.selectedIndex].dataset.name,startTime:document.getElementById('stStart').value,endTime:document.getElementById('stEnd').value});if(r){toast('Đã thêm suất chiếu');hideModal();loadShowtimes()}else{toast('Trùng lịch chiếu!','error')}})
});
window.deleteShowtime=async function(id){if(!confirm('Xóa suất chiếu?'))return;const r=await api('/showtime/'+id,'DELETE');if(r){toast('Đã xóa');loadShowtimes()}};

// ===== INCIDENTS =====
async function loadIncidents(){
  const f=document.getElementById('incidentFilter').value;
  const data=await api('/incident'+(f?'?status='+f:''))||[];
  let h='';data.forEach(i=>{const sBadge=i.status==='Open'?statusBadge('Pending'):i.status==='InProgress'?statusBadge('InProgress'):statusBadge('Completed');
    h+='<tr><td>'+i.incidentID+'</td><td>'+i.roomName+'</td><td>'+i.employeeName+'</td><td style="max-width:200px;font-size:.85rem">'+i.description+'</td><td>'+sBadge+'</td><td>'+formatDate(i.reportedAt)+'</td><td>'+(i.status!=='Resolved'?'<button class="btn btn-xs btn-success" onclick="resolveIncident('+i.incidentID+',\''+i.status+'\')"><i class="fas fa-'+(i.status==='Open'?'play':'check')+'"></i></button>':'<span style="color:var(--success)">✓</span>')+'</td></tr>'});
  document.getElementById('incidentTableBody').innerHTML=h||'<tr><td colspan="7" class="empty-state">Chưa có sự cố</td></tr>';
}
document.getElementById('incidentFilter').addEventListener('change',loadIncidents);
document.getElementById('btnAddIncident').addEventListener('click',async()=>{
  if(!rooms.length)rooms=await api('/room')||[];
  let opts='';rooms.forEach(r=>{opts+='<option value="'+r.roomID+'" data-name="'+r.roomName+'">'+r.roomName+'</option>'});
  showModal('Báo cáo sự cố','<form id="incForm"><div class="form-group"><label>Phòng</label><select class="form-select" id="incRoom" required>'+opts+'</select></div><div class="form-group"><label>Tên nhân viên</label><input class="form-input" id="incEmp" required></div><div class="form-group"><label>Mô tả sự cố</label><textarea class="form-input" id="incDesc" rows="3" required></textarea></div><div class="form-actions"><button type="submit" class="btn btn-primary">Gửi</button></div></form>');
  document.getElementById('incForm').addEventListener('submit',async e=>{e.preventDefault();const sel=document.getElementById('incRoom');const r=await api('/incident','POST',{roomID:parseInt(sel.value),roomName:sel.options[sel.selectedIndex].dataset.name,employeeName:document.getElementById('incEmp').value,description:document.getElementById('incDesc').value,employeeID:1});if(r){toast('Đã báo cáo sự cố');hideModal();loadIncidents()}})
});
window.resolveIncident=async function(id,cur){const next=cur==='Open'?'InProgress':'Resolved';const r=await api('/incident/'+id+'/status','PUT',{status:next});if(r){toast('Đã cập nhật');loadIncidents()}};

// Init
if(token){showApp()}else{showLogin()}
