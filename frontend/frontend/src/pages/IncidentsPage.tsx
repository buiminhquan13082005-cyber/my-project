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
import { Plus, Play, Check, Loader2, Wrench } from 'lucide-react';
import { StyledFilterSelect, StyledSelect } from '@/components/ui/styled-select';
import api from '@/lib/api';
import { formatDate } from '@/lib/helpers';
import { incidentSchema, maintenanceSchema, type IncidentFormData, type MaintenanceFormData } from '@/lib/schemas';
import { toast } from 'sonner';

interface Incident {
  incidentID: number; roomName: string; employeeName: string;
  description: string; status: string; reportedAt: string;
  roomID?: number; employeeID?: number;
}
interface Room { roomID: number; roomName: string; }
interface Equipment { equipmentID: number; equipmentName: string; }

const statusStyles: Record<string, string> = {
  Open: 'bg-amber-500/12 text-amber-400 border-amber-500/20',
  InProgress: 'bg-purple-400/12 text-purple-300 border-purple-400/20',
  Resolved: 'bg-teal-500/12 text-teal-400 border-teal-500/20',
};
const statusLabels: Record<string, string> = { Open: 'Mở', InProgress: 'Đang xử lý', Resolved: 'Đã giải quyết' };

/** Trang quản lý Sự cố - báo cáo sự cố mới, tiếp nhận và tạo yêu cầu bảo trì */
export default function IncidentsPage() {
  const [list, setList] = useState<Incident[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);

  // Dialog tạo yêu cầu bảo trì từ sự cố
  const [maintenanceDialogOpen, setMaintenanceDialogOpen] = useState(false);
  const [acceptingIncident, setAcceptingIncident] = useState<Incident | null>(null);
  const [equipments, setEquipments] = useState<Equipment[]>([]);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<IncidentFormData>({
    resolver: zodResolver(incidentSchema),
    defaultValues: { employeeID: 1 },
  });

  const maintenanceForm = useForm<MaintenanceFormData>({
    resolver: zodResolver(maintenanceSchema),
  });

  /** Tải danh sách sự cố từ API, hỗ trợ lọc theo trạng thái */
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/incident' + (filter ? `?status=${filter}` : ''));
      const sorted = (r.data || []).sort((a: Incident, b: Incident) => a.incidentID - b.incidentID);
      setList(sorted);
    } catch { toast.error('Lỗi tải sự cố'); }
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  /** Mở dialog báo cáo sự cố mới - tải danh sách phòng chiếu */
  const openAdd = async () => {
    try {
      const r = await api.get('/room');
      setRooms(r.data || []);
      reset({ roomID: undefined, roomName: '', employeeName: '', description: '', employeeID: 1 });
      setDialogOpen(true);
    } catch { toast.error('Lỗi tải phòng'); }
  };

  /** Gửi form báo cáo sự cố - gọi API POST /incident */
  const onSubmit = async (data: IncidentFormData) => {
    try {
      await api.post('/incident', data);
      toast.success('Đã báo cáo sự cố');
      setDialogOpen(false);
      load();
    } catch { toast.error('Thao tác thất bại'); }
  };

  /** Tiếp nhận sự cố: cập nhật trạng thái → mở dialog tạo yêu cầu bảo trì */
  const acceptIncident = async (incident: Incident) => {
    try {
      // Tải danh sách thiết bị cho form bảo trì
      if (equipments.length === 0) {
        const eqRes = await api.get('/equipment');
        setEquipments(eqRes.data || []);
      }

      // Mở dialog tạo yêu cầu bảo trì với thông tin pre-filled từ sự cố
      setAcceptingIncident(incident);
      maintenanceForm.reset({
        equipmentID: undefined,
        equipmentName: '',
        requestType: 'Emergency',
        priority: 'High',
        description: `[Sự cố #${incident.incidentID}] ${incident.description}`,
        reportedByName: incident.employeeName,
      });
      setMaintenanceDialogOpen(true);
    } catch { toast.error('Thao tác thất bại'); }
  };

  /** Giải quyết sự cố: InProgress → Resolved */
  const resolveIncident = async (id: number) => {
    try {
      await api.put(`/incident/${id}/status`, { status: 'Resolved' });
      toast.success('Đã cập nhật');
      load();
    } catch { toast.error('Thao tác thất bại'); }
  };

  /** Gửi form tạo yêu cầu bảo trì - gọi API POST /maintenance */
  const onCreateMaintenance = async (data: MaintenanceFormData) => {
    try {
      const payload = {
        ...data,
        incidentID: acceptingIncident?.incidentID,
      };
      await api.post('/maintenance', payload);

      // Cập nhật trạng thái sự cố sang InProgress sau khi tạo yêu cầu bảo trì thành công
      if (acceptingIncident) {
        await api.put(`/incident/${acceptingIncident.incidentID}/status`, { status: 'InProgress' });
      }

      toast.success('Đã tiếp nhận sự cố & tạo yêu cầu bảo trì');
      setMaintenanceDialogOpen(false);
      setAcceptingIncident(null);
      load();
    } catch { toast.error('Tạo yêu cầu bảo trì thất bại'); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Sự cố</h1>
        <div className="flex items-center gap-3">
          <StyledFilterSelect
            value={filter}
            onValueChange={setFilter}
            options={[
              { value: 'Open', label: 'Mở' },
              { value: 'InProgress', label: 'Đang xử lý' },
              { value: 'Resolved', label: 'Đã giải quyết' },
            ]}
            placeholder="Trạng thái"
            allLabel="Tất cả"
          />
          <Button onClick={openAdd} className="bg-gradient-to-r from-purple-600 to-purple-400 hover:shadow-lg hover:shadow-purple-600/30">
            <Plus className="w-4 h-4 mr-1" /> Báo cáo sự cố
          </Button>
        </div>
      </div>

      <Card className="bg-[#1a1d27] border-[#2a2e3d]">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-purple-400" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-[#2a2e3d] hover:bg-transparent">
                  <TableHead className="text-gray-400">ID</TableHead>
                  <TableHead className="text-gray-400">Phòng</TableHead>
                  <TableHead className="text-gray-400">Nhân viên</TableHead>
                  <TableHead className="text-gray-400">Mô tả</TableHead>
                  <TableHead className="text-gray-400">Trạng thái</TableHead>
                  <TableHead className="text-gray-400">Ngày</TableHead>
                  <TableHead className="text-gray-400">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center text-gray-500 py-12">Chưa có sự cố</TableCell></TableRow>
                ) : list.map((i) => (
                  <TableRow key={i.incidentID} className="border-[#2a2e3d]/50 hover:bg-[#22263a] transition-colors">
                    <TableCell>{i.incidentID}</TableCell>
                    <TableCell>{i.roomName}</TableCell>
                    <TableCell>{i.employeeName}</TableCell>
                    <TableCell className="max-w-[200px] text-sm truncate">{i.description}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusStyles[i.status] || ''}>
                        {statusLabels[i.status] || i.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(i.reportedAt)}</TableCell>
                    <TableCell>
                      {i.status === 'Open' ? (
                        <Button variant="outline" size="icon" className="h-7 w-7 border-[#2a2e3d] text-teal-400"
                          title="Tiếp nhận & Tạo yêu cầu bảo trì"
                          onClick={() => acceptIncident(i)}>
                          <Play className="w-3 h-3" />
                        </Button>
                      ) : i.status === 'InProgress' ? (
                        <span className="text-xs text-amber-400">⏳ Chờ bảo trì</span>
                      ) : (
                        <span className="text-teal-400">✓</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog báo cáo sự cố mới */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#1a1d27] border-[#2a2e3d] text-white sm:max-w-md">
          <DialogHeader><DialogTitle>Báo cáo sự cố</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-gray-400">Phòng</Label>
              <StyledSelect
                value={watch('roomID') ? String(watch('roomID')) : ''}
                onValueChange={(v) => {
                  const rm = rooms.find((r) => r.roomID === +v);
                  setValue('roomID', +v);
                  setValue('roomName', rm?.roomName || '');
                }}
                options={rooms.map((r) => ({ value: String(r.roomID), label: r.roomName }))}
                placeholder="Chọn phòng"
              />
              {errors.roomID && <p className="text-xs text-red-400">{errors.roomID.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-gray-400">Tên nhân viên</Label>
              <Input className="bg-[#0f1117] border-[#2a2e3d]" {...register('employeeName')} />
              {errors.employeeName && <p className="text-xs text-red-400">{errors.employeeName.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-gray-400">Mô tả sự cố</Label>
              <Textarea className="bg-[#0f1117] border-[#2a2e3d]" rows={3} {...register('description')} />
              {errors.description && <p className="text-xs text-red-400">{errors.description.message}</p>}
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-purple-600 to-purple-400">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null} Gửi
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog tạo yêu cầu bảo trì từ sự cố */}
      <Dialog open={maintenanceDialogOpen} onOpenChange={(open) => { setMaintenanceDialogOpen(open); if (!open) setAcceptingIncident(null); }}>
        <DialogContent className="bg-[#1a1d27] border-[#2a2e3d] text-white sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="w-5 h-5 text-amber-400" />
              Tạo yêu cầu bảo trì
            </DialogTitle>
            {acceptingIncident && (
              <p className="text-sm text-gray-400 mt-1">
                Từ sự cố <Badge variant="outline" className="bg-red-500/12 text-red-400 border-red-500/20 text-[10px] ml-1">#{acceptingIncident.incidentID}</Badge>
                <span className="ml-2">— {acceptingIncident.roomName}</span>
              </p>
            )}
          </DialogHeader>
          <form onSubmit={maintenanceForm.handleSubmit(onCreateMaintenance)} className="grid grid-cols-2 gap-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-gray-400">Thiết bị</Label>
              <StyledSelect
                value={maintenanceForm.watch('equipmentID') ? String(maintenanceForm.watch('equipmentID')) : ''}
                onValueChange={(v) => {
                  const eq = equipments.find((x) => x.equipmentID === parseInt(v));
                  maintenanceForm.setValue('equipmentID', parseInt(v));
                  maintenanceForm.setValue('equipmentName', eq?.equipmentName || '');
                }}
                options={equipments.map((e) => ({ value: String(e.equipmentID), label: e.equipmentName }))}
                placeholder="Chọn thiết bị"
              />
              {maintenanceForm.formState.errors.equipmentID && <p className="text-xs text-red-400">{maintenanceForm.formState.errors.equipmentID.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-gray-400">Loại</Label>
              <StyledSelect
                value={maintenanceForm.watch('requestType') || 'Emergency'}
                onValueChange={(v) => maintenanceForm.setValue('requestType', v)}
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
                value={maintenanceForm.watch('priority') || 'High'}
                onValueChange={(v) => maintenanceForm.setValue('priority', v)}
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
              <Input className="bg-[#0f1117] border-[#2a2e3d] text-gray-300" readOnly {...maintenanceForm.register('reportedByName')} />
              {maintenanceForm.formState.errors.reportedByName && <p className="text-xs text-red-400">{maintenanceForm.formState.errors.reportedByName.message}</p>}
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-gray-400">Mô tả</Label>
              <Textarea className="bg-[#0f1117] border-[#2a2e3d]" rows={2} {...maintenanceForm.register('description')} />
              {maintenanceForm.formState.errors.description && <p className="text-xs text-red-400">{maintenanceForm.formState.errors.description.message}</p>}
            </div>
            <div className="col-span-2 flex justify-end gap-2">
              <Button type="button" variant="outline" className="border-[#2a2e3d] text-gray-400" onClick={() => { setMaintenanceDialogOpen(false); setAcceptingIncident(null); }}>
                Bỏ qua
              </Button>
              <Button type="submit" disabled={maintenanceForm.formState.isSubmitting} className="bg-gradient-to-r from-purple-600 to-purple-400">
                {maintenanceForm.formState.isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Wrench className="w-4 h-4 mr-1" />} Tạo yêu cầu bảo trì
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
