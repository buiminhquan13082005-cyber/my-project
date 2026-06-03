import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Eye, UserPlus, ClipboardList, Check, Loader2, Trash2 } from 'lucide-react';
import { StyledFilterSelect, StyledSelect } from '@/components/ui/styled-select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import api from '@/lib/api';
import { formatDate } from '@/lib/helpers';
import { maintenanceSchema, assignSchema, type MaintenanceFormData, type AssignFormData } from '@/lib/schemas';
import { toast } from 'sonner';

interface Maintenance { requestID: number; equipmentName: string; requestType: string; priority: string; status: string; assignedToName?: string; description: string; createdAt: string; incidentID?: number; }
interface Equipment { equipmentID: number; equipmentName: string; }
interface Employee { id: number; fullName: string; }
interface MaintenanceLog { employeeName: string; actionTaken: string; notes: string; timestamp: string; }

const statusStyles: Record<string, string> = {
  Pending: 'bg-amber-500/12 text-amber-400 border-amber-500/20',
  Assigned: 'bg-blue-400/12 text-blue-400 border-blue-400/20',
  InProgress: 'bg-purple-400/12 text-purple-300 border-purple-400/20',
  NeedReplacement: 'bg-red-500/12 text-red-400 border-red-500/20',
  Completed: 'bg-teal-500/12 text-teal-400 border-teal-500/20',
};

const statusLabels: Record<string, string> = {
  Pending: 'Chờ xử lý',
  Assigned: 'Đã phân việc',
  InProgress: 'Đang xử lý',
  NeedReplacement: 'Cần thay thế',
  Completed: 'Hoàn tất',
};

const priorityLabels: Record<string, string> = {
  Critical: 'Khẩn cấp',
  High: 'Cao',
  Normal: 'Bình thường',
  Low: 'Thấp',
};

/** Trang quản lý Bảo trì - tạo yêu cầu, phân việc, ghi nhật ký, hoàn tất bảo trì */
export default function MaintenancePage() {
  const [list, setList] = useState<Maintenance[]>([]);
  const [filter, setFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [dialogType, setDialogType] = useState<'add' | 'view' | 'assign' | 'logs' | null>(null);
  const [selectedId, setSelectedId] = useState(0);
  const [viewData, setViewData] = useState<{ req: Maintenance | null; logs: MaintenanceLog[] }>({ req: null, logs: [] });
  const [logsData, setLogsData] = useState<{ requestID: number; equipmentName: string; logs: MaintenanceLog[] }>({ requestID: 0, equipmentName: '', logs: [] });
  const [logsLoading, setLogsLoading] = useState(false);

  const addForm = useForm<MaintenanceFormData>({ resolver: zodResolver(maintenanceSchema) });
  const assignForm = useForm<AssignFormData>({ resolver: zodResolver(assignSchema) });

  /** Tải danh sách yêu cầu bảo trì từ API */
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (priorityFilter) queryParams.append('priority', priorityFilter);
      if (typeFilter) queryParams.append('type', typeFilter);
      
      const r = await api.get('/maintenance' + (queryParams.toString() ? `?${queryParams.toString()}` : ''));
      const sorted = (r.data || []).sort((a: Maintenance, b: Maintenance) => a.requestID - b.requestID);
      setList(sorted);
    } catch { toast.error('Lỗi tải bảo trì'); }
    setLoading(false);
  }, [priorityFilter, typeFilter]);

  useEffect(() => { load(); }, [load]);

  /** Tải danh sách thiết bị (lazy load - chỉ gọi 1 lần) để dùng trong form tạo yêu cầu */
  const loadEquipments = async () => {
    if (equipments.length) return;
    const r = await api.get('/equipment');
    setEquipments(r.data || []);
  };

  /** Tải danh sách nhân viên (lazy load - chỉ gọi 1 lần) để dùng trong dropdown chọn nhân viên */
  const loadEmployees = async () => {
    if (employees.length) return;
    try {
      const r = await api.get('/auth/employees');
      setEmployees(r.data || []);
    } catch { toast.error('Lỗi tải danh sách nhân viên'); }
  };

  /** Mở dialog tạo yêu cầu bảo trì mới - load danh sách thiết bị nếu chưa có */
  const openAdd = async () => {
    await loadEquipments();
    addForm.reset({ equipmentID: undefined, equipmentName: '', requestType: 'Emergency', priority: 'Normal', description: '', reportedByName: 'Nhân viên' });
    setDialogType('add');
  };

  /** Mở dialog xem chi tiết yêu cầu bảo trì + nhật ký bảo trì */
  const openView = async (id: number) => {
    const [req, logs] = await Promise.all([api.get(`/maintenance/${id}`), api.get(`/maintenance/${id}/logs`)]);
    setViewData({ req: req.data, logs: logs.data || [] });
    setDialogType('view');
  };

  /** Mở dialog phân việc cho nhân viên kỹ thuật */
  const openAssign = async (id: number) => {
    await loadEmployees();
    setSelectedId(id);
    assignForm.reset({ employeeID: undefined, employeeName: '' });
    setDialogType('assign');
  };

  /** Mở dialog xem nhật ký bảo trì của nhân viên */
  const openLogs = async (id: number) => {
    setLogsLoading(true);
    setDialogType('logs');
    try {
      const item = list.find(m => m.requestID === id);
      const logsRes = await api.get(`/maintenance/${id}/logs`);
      setLogsData({ requestID: id, equipmentName: item?.equipmentName || '', logs: logsRes.data || [] });
    } catch { toast.error('Lỗi tải nhật ký'); }
    setLogsLoading(false);
  };

  /** Gửi form tạo yêu cầu bảo trì mới - gọi API POST /maintenance */
  const onAdd = async (data: MaintenanceFormData) => {
    try {
      await api.post('/maintenance', data);
      toast.success('Đã tạo yêu cầu');
      setDialogType(null);
      load();
    } catch { toast.error('Thao tác thất bại'); }
  };

  /** Gửi form phân việc - gọi API PUT /maintenance/{id}/assign */
  const onAssign = async (data: AssignFormData) => {
    try {
      await api.put(`/maintenance/${selectedId}/assign`, data);
      toast.success('Đã phân việc');
      setDialogType(null);
      load();
    } catch { toast.error('Thao tác thất bại'); }
  };

  /** Hàm trả label tiếng Việt cho hành động bảo trì */
  const getActionLabel = (action: string) => {
    switch (action) {
      case 'Inspected': return 'Kiểm tra';
      case 'Repaired': return 'Sửa chữa';
      case 'Replaced': return 'Thay thế';
      case 'UsedSpare': return 'Dùng dự phòng';
      default: return action;
    }
  };

  /** Đánh dấu hoàn tất bảo trì - gọi API PUT /maintenance/{id}/complete */
  const complete = async (id: number) => {
    if (!confirm('Xác nhận hoàn tất bảo trì?')) return;
    try {
      await api.put(`/maintenance/${id}/complete`);
      toast.success('Hoàn tất bảo trì!');
      load();
    } catch { toast.error('Thao tác thất bại'); }
  };

  /** Xóa lịch sử bảo trì - gọi API DELETE /maintenance/{id} */
  const deleteRequest = async (id: number) => {
    if (!confirm('Bạn có chắc muốn xóa lịch sử bảo trì này? Thao tác này cũng sẽ xóa toàn bộ nhật ký bảo trì liên quan.')) return;
    try {
      await api.delete(`/maintenance/${id}`);
      toast.success('Đã xóa lịch sử bảo trì');
      load();
    } catch { toast.error('Thao tác thất bại'); }
  };  const activeList = list.filter(m => m.status !== 'Completed' && (!filter || m.status === filter));
  const completedList = list.filter(m => m.status === 'Completed');

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Bảo trì</h1>
        <div className="flex items-center gap-3">
          <StyledFilterSelect
            value={filter}
            onValueChange={setFilter}
            options={[
              { value: 'Pending', label: 'Chờ xử lý' },
              { value: 'Assigned', label: 'Đã phân việc' },
              { value: 'InProgress', label: 'Đang xử lý' },
              { value: 'NeedReplacement', label: 'Cần thay thế' },
            ]}
            placeholder="Trạng thái"
            allLabel="Tất cả trạng thái"
          />
          <StyledFilterSelect
            value={priorityFilter}
            onValueChange={setPriorityFilter}
            options={[
              { value: 'Critical', label: 'Khẩn cấp' },
              { value: 'High', label: 'Cao' },
              { value: 'Normal', label: 'Bình thường' },
              { value: 'Low', label: 'Thấp' },
            ]}
            placeholder="Mức ưu tiên"
            allLabel="Tất cả ưu tiên"
          />
          <StyledFilterSelect
            value={typeFilter}
            onValueChange={setTypeFilter}
            options={[
              { value: 'Emergency', label: 'Hỏng bất ngờ' },
              { value: 'Scheduled', label: 'Định kỳ' },
            ]}
            placeholder="Loại yêu cầu"
            allLabel="Tất cả loại"
          />
          <Button onClick={openAdd} className="bg-gradient-to-r from-purple-600 to-purple-400">
            <Plus className="w-4 h-4 mr-1" /> Tạo yêu cầu bảo trì
          </Button>
        </div>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="bg-[#1a1d27] border border-[#2a2e3d] p-1 h-auto gap-1 mb-4">
          <TabsTrigger value="active" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white gap-1.5 text-sm">
            Yêu cầu đang xử lý ({activeList.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white gap-1.5 text-sm">
            Lịch sử hoàn tất ({completedList.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <Card className="bg-[#1a1d27] border-[#2a2e3d]">
            <CardContent className="p-0">
              {loading ? (
                <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-purple-400" /></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-[#2a2e3d] hover:bg-transparent">
                      <TableHead className="text-gray-400">ID</TableHead>
                      <TableHead className="text-gray-400">Thiết bị</TableHead>
                      <TableHead className="text-gray-400">Loại</TableHead>
                      <TableHead className="text-gray-400">Ưu tiên</TableHead>
                      <TableHead className="text-gray-400">Trạng thái</TableHead>
                      <TableHead className="text-gray-400">Phân việc</TableHead>
                      <TableHead className="text-gray-400">Ngày tạo</TableHead>
                      <TableHead className="text-gray-400">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeList.length === 0 ? (
                      <TableRow><TableCell colSpan={8} className="text-center text-gray-500 py-12">Không có yêu cầu đang xử lý</TableCell></TableRow>
                    ) : activeList.map((m) => (
                      <TableRow key={m.requestID} className="border-[#2a2e3d]/50 hover:bg-[#22263a] transition-colors">
                        <TableCell>{m.requestID}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {m.equipmentName}
                            {m.incidentID && <Badge variant="outline" className="bg-red-500/12 text-red-400 border-red-500/20 text-[10px] px-1.5">SC #{m.incidentID}</Badge>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={m.requestType === 'Emergency' ? 'bg-red-500/12 text-red-400 border-red-500/20' : 'bg-blue-400/12 text-blue-400 border-blue-400/20'}>
                            {m.requestType === 'Emergency' ? 'Hỏng bất ngờ' : 'Định kỳ'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className={`text-sm font-medium ${m.priority === 'Critical' ? 'text-red-400 font-bold' : m.priority === 'High' ? 'text-amber-400' : m.priority === 'Low' ? 'text-gray-400' : 'text-blue-400'}`}>
                            {priorityLabels[m.priority] || m.priority}
                          </span>
                        </TableCell>
                        <TableCell><Badge variant="outline" className={statusStyles[m.status] || ''}>{statusLabels[m.status] || m.status}</Badge></TableCell>
                        <TableCell>{m.assignedToName || <span className="text-gray-500">Chưa phân</span>}</TableCell>
                        <TableCell>{formatDate(m.createdAt)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="outline" size="icon" className="h-7 w-7 border-[#2a2e3d]" onClick={() => openView(m.requestID)}><Eye className="w-3 h-3" /></Button>
                            {m.status === 'Pending' && <Button variant="outline" size="icon" className="h-7 w-7 border-[#2a2e3d] text-purple-400" onClick={() => openAssign(m.requestID)}><UserPlus className="w-3 h-3" /></Button>}
                            {m.status !== 'Pending' && <Button variant="outline" size="icon" className="h-7 w-7 border-[#2a2e3d] text-amber-400" title="Xem nhật ký sửa chữa" onClick={() => openLogs(m.requestID)}><ClipboardList className="w-3 h-3" /></Button>}
                            <Button variant="outline" size="icon" className="h-7 w-7 border-[#2a2e3d] text-teal-400" onClick={() => complete(m.requestID)}><Check className="w-3 h-3" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed">
          <Card className="bg-[#1a1d27] border-[#2a2e3d]">
            <CardContent className="p-0">
              {loading ? (
                <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-purple-400" /></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-[#2a2e3d] hover:bg-transparent">
                      <TableHead className="text-gray-400">ID</TableHead>
                      <TableHead className="text-gray-400">Thiết bị</TableHead>
                      <TableHead className="text-gray-400">Loại</TableHead>
                      <TableHead className="text-gray-400">Ưu tiên</TableHead>
                      <TableHead className="text-gray-400">Trạng thái</TableHead>
                      <TableHead className="text-gray-400">Người thực hiện</TableHead>
                      <TableHead className="text-gray-400">Ngày tạo</TableHead>
                      <TableHead className="text-gray-400">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {completedList.length === 0 ? (
                      <TableRow><TableCell colSpan={8} className="text-center text-gray-500 py-12">Không có lịch sử bảo trì hoàn tất</TableCell></TableRow>
                    ) : completedList.map((m) => (
                      <TableRow key={m.requestID} className="border-[#2a2e3d]/50 hover:bg-[#22263a] transition-colors">
                        <TableCell>{m.requestID}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {m.equipmentName}
                            {m.incidentID && <Badge variant="outline" className="bg-red-500/12 text-red-400 border-red-500/20 text-[10px] px-1.5">SC #{m.incidentID}</Badge>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={m.requestType === 'Emergency' ? 'bg-red-500/12 text-red-400 border-red-500/20' : 'bg-blue-400/12 text-blue-400 border-blue-400/20'}>
                            {m.requestType === 'Emergency' ? 'Hỏng bất ngờ' : 'Định kỳ'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className={`text-sm font-medium ${m.priority === 'Critical' ? 'text-red-400 font-bold' : m.priority === 'High' ? 'text-amber-400' : m.priority === 'Low' ? 'text-gray-400' : 'text-blue-400'}`}>
                            {priorityLabels[m.priority] || m.priority}
                          </span>
                        </TableCell>
                        <TableCell><Badge variant="outline" className={statusStyles[m.status] || ''}>{statusLabels[m.status] || m.status}</Badge></TableCell>
                        <TableCell>{m.assignedToName || <span className="text-gray-500">N/A</span>}</TableCell>
                        <TableCell>{formatDate(m.createdAt)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="outline" size="icon" className="h-7 w-7 border-[#2a2e3d]" onClick={() => openView(m.requestID)}><Eye className="w-3 h-3" /></Button>
                            <Button variant="outline" size="icon" className="h-7 w-7 border-[#2a2e3d] text-amber-400" title="Xem nhật ký sửa chữa" onClick={() => openLogs(m.requestID)}><ClipboardList className="w-3 h-3" /></Button>
                            <Button variant="outline" size="icon" className="h-7 w-7 border-[#2a2e3d] text-red-400 hover:text-red-300 hover:bg-red-500/10 hover:border-red-500/30" title="Xóa lịch sử bảo trì" onClick={() => deleteRequest(m.requestID)}><Trash2 className="w-3.5 h-3.5" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Dialog */}
      <Dialog open={dialogType === 'add'} onOpenChange={() => setDialogType(null)}>
        <DialogContent className="bg-[#1a1d27] border-[#2a2e3d] text-white sm:max-w-lg">
          <DialogHeader><DialogTitle>Tạo yêu cầu bảo trì</DialogTitle></DialogHeader>
          <form onSubmit={addForm.handleSubmit(onAdd)} className="grid grid-cols-2 gap-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-gray-400">Thiết bị</Label>
              <StyledSelect
                value={addForm.watch('equipmentID') ? String(addForm.watch('equipmentID')) : ''}
                onValueChange={(v) => {
                  const eq = equipments.find((x) => x.equipmentID === parseInt(v));
                  addForm.setValue('equipmentID', parseInt(v));
                  addForm.setValue('equipmentName', eq?.equipmentName || '');
                }}
                options={equipments.map((e) => ({ value: String(e.equipmentID), label: e.equipmentName }))}
                placeholder="Chọn thiết bị"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-gray-400">Loại</Label>
              <StyledSelect
                value={addForm.watch('requestType') || 'Emergency'}
                onValueChange={(v) => addForm.setValue('requestType', v)}
                options={[
                  { value: 'Emergency', label: 'Hỏng bất ngờ' },
                  { value: 'Scheduled', label: 'Định kỳ' },
                ]}
                placeholder="Chọn loại"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-gray-400">Ưu tiên</Label>
              <StyledSelect
                value={addForm.watch('priority') || 'Normal'}
                onValueChange={(v) => addForm.setValue('priority', v)}
                options={[
                  { value: 'Normal', label: 'Bình thường' },
                  { value: 'High', label: 'Cao' },
                  { value: 'Critical', label: 'Khẩn cấp' },
                  { value: 'Low', label: 'Thấp' },
                ]}
                placeholder="Chọn ưu tiên"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-gray-400">Người báo cáo</Label>
              <Input className="bg-[#0f1117] border-[#2a2e3d]" {...addForm.register('reportedByName')} />
              {addForm.formState.errors.reportedByName && <p className="text-xs text-red-400">{addForm.formState.errors.reportedByName.message}</p>}
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-gray-400">Mô tả</Label>
              <Textarea className="bg-[#0f1117] border-[#2a2e3d]" rows={2} {...addForm.register('description')} />
              {addForm.formState.errors.description && <p className="text-xs text-red-400">{addForm.formState.errors.description.message}</p>}
            </div>
            <div className="col-span-2 flex justify-end">
              <Button type="submit" disabled={addForm.formState.isSubmitting} className="bg-gradient-to-r from-purple-600 to-purple-400">
                {addForm.formState.isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null} Tạo
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={dialogType === 'view'} onOpenChange={() => setDialogType(null)}>
        <DialogContent className="bg-[#1a1d27] border-[#2a2e3d] text-white sm:max-w-lg">
          <DialogHeader><DialogTitle>Chi tiết yêu cầu #{viewData.req?.requestID}</DialogTitle></DialogHeader>
          {viewData.req && (
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <p><strong className="text-gray-400">Thiết bị:</strong> {viewData.req.equipmentName}</p>
                <p><strong className="text-gray-400">Loại:</strong> {viewData.req.requestType === 'Emergency' ? 'Hỏng bất ngờ' : 'Định kỳ'}</p>
                <p><strong className="text-gray-400">Trạng thái:</strong> <Badge variant="outline" className={statusStyles[viewData.req.status] || ''}>{statusLabels[viewData.req.status] || viewData.req.status}</Badge></p>
                <p><strong className="text-gray-400">Phân việc:</strong> {viewData.req.assignedToName || 'Chưa'}</p>
              </div>
              <p className="text-sm"><strong className="text-gray-400">Mô tả:</strong> {viewData.req.description}</p>
              {viewData.logs.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Nhật ký bảo trì</h4>
                  {viewData.logs.map((l, i) => (
                    <div key={i} className="border-l-2 border-purple-500 pl-3 py-2 mb-2">
                      <p className="text-sm font-semibold">{l.employeeName} - {l.actionTaken}</p>
                      <p className="text-xs text-gray-500">{l.notes} | {formatDate(l.timestamp)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Assign Dialog */}
      <Dialog open={dialogType === 'assign'} onOpenChange={() => setDialogType(null)}>
        <DialogContent className="bg-[#1a1d27] border-[#2a2e3d] text-white sm:max-w-md">
          <DialogHeader><DialogTitle>Phân việc #{selectedId}</DialogTitle></DialogHeader>
          <form onSubmit={assignForm.handleSubmit(onAssign)} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-gray-400">Chọn nhân viên kỹ thuật</Label>
              <StyledSelect
                value={assignForm.watch('employeeID') ? String(assignForm.watch('employeeID')) : ''}
                onValueChange={(v) => {
                  const emp = employees.find((e) => e.id === parseInt(v));
                  assignForm.setValue('employeeID', parseInt(v), { shouldValidate: true });
                  assignForm.setValue('employeeName', emp?.fullName || '', { shouldValidate: true });
                }}
                options={employees.map((e) => ({ value: String(e.id), label: e.fullName }))}
                placeholder="Chọn nhân viên"
              />
              {assignForm.formState.errors.employeeName && <p className="text-xs text-red-400">{assignForm.formState.errors.employeeName.message}</p>}
              {assignForm.formState.errors.employeeID && <p className="text-xs text-red-400">{assignForm.formState.errors.employeeID.message}</p>}
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={assignForm.formState.isSubmitting} className="bg-gradient-to-r from-purple-600 to-purple-400">Phân việc</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Logs Viewer Dialog */}
      <Dialog open={dialogType === 'logs'} onOpenChange={() => setDialogType(null)}>
        <DialogContent className="bg-[#1a1d27] border-[#2a2e3d] text-white sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-amber-400" />
              Nhật ký sửa chữa #{logsData.requestID}
            </DialogTitle>
            {logsData.equipmentName && (
              <p className="text-sm text-gray-400 mt-1">Thiết bị: {logsData.equipmentName}</p>
            )}
          </DialogHeader>
          <div className="mt-2 space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {logsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
              </div>
            ) : logsData.logs.length === 0 ? (
              <div className="text-center py-12">
                <ClipboardList className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Chưa có nhật ký sửa chữa nào</p>
                <p className="text-gray-600 text-xs mt-1">Nhân viên chưa ghi nhật ký cho yêu cầu này</p>
              </div>
            ) : (
              logsData.logs.map((log, i) => {
                const actionColor = log.actionTaken === 'Repaired' ? 'text-teal-400 bg-teal-500/12 border-teal-500/20'
                  : log.actionTaken === 'Replaced' ? 'text-amber-400 bg-amber-500/12 border-amber-500/20'
                  : log.actionTaken === 'UsedSpare' ? 'text-blue-400 bg-blue-400/12 border-blue-400/20'
                  : 'text-purple-400 bg-purple-500/12 border-purple-500/20';
                return (
                  <div key={i} className="border-l-2 border-purple-500/40 pl-4 py-3 rounded-r-lg bg-[#0f1117]/50 hover:bg-[#0f1117] transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">{log.employeeName}</span>
                        <Badge variant="outline" className={`text-[10px] px-2 py-0.5 ${actionColor}`}>
                          {getActionLabel(log.actionTaken)}
                        </Badge>
                      </div>
                      <span className="text-[11px] text-gray-500">{formatDate(log.timestamp)}</span>
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed">{log.notes}</p>
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
