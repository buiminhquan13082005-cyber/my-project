import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Loader2, LayoutGrid } from 'lucide-react';
import { StyledSelect } from '@/components/ui/styled-select';
import api from '@/lib/api';
import { roomStatusLabels } from '@/lib/helpers';
import { roomSchema, type RoomFormData } from '@/lib/schemas';
import { toast } from 'sonner';

interface Room { roomID: number; roomName: string; capacity: number; roomStatus: string; }
interface Seat { seatID: number; seatRow: string; seatNumber: number; seatType: string; }

const statusStyles: Record<string, string> = {
  Active: 'bg-teal-500/12 text-teal-400 border-teal-500/20',
  Maintenance: 'bg-amber-500/12 text-amber-400 border-amber-500/20',
  Inactive: 'bg-gray-500/12 text-gray-400 border-gray-500/20',
};

/** Trang quản lý Phòng chiếu - CRUD phòng, xem/tạo sơ đồ ghế tự động */
export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [seatDialog, setSeatDialog] = useState<{ open: boolean; roomId: number; roomName: string; seats: Seat[] }>({ open: false, roomId: 0, roomName: '', seats: [] });
  const [genRows, setGenRows] = useState(8);
  const [genCols, setGenCols] = useState(12);
  const [genVip, setGenVip] = useState(2);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<RoomFormData>({
    resolver: zodResolver(roomSchema),
  });

  const watchStatus = watch('roomStatus');

  /** Tải danh sách phòng chiếu từ API */
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/room');
      const sorted = (r.data || []).sort((a: Room, b: Room) => a.roomID - b.roomID);
      setRooms(sorted);
    }
    catch { toast.error('Lỗi tải phòng'); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  /** Mở dialog thêm phòng mới */
  const openAdd = () => { setEditId(null); reset({ roomName: '', capacity: 100, roomStatus: 'Active' }); setDialogOpen(true); };
  /** Mở dialog sửa thông tin phòng */
  const openEdit = (r: Room) => { setEditId(r.roomID); reset({ roomName: r.roomName, capacity: r.capacity, roomStatus: r.roomStatus }); setDialogOpen(true); };

  /** Gửi form thêm/sửa phòng - gọi API POST hoặc PUT */
  const onSubmit = async (data: RoomFormData) => {
    try {
      if (editId) { await api.put(`/room/${editId}`, data); toast.success('Cập nhật phòng thành công'); }
      else { await api.post('/room', data); toast.success('Đã thêm phòng'); }
      setDialogOpen(false); load();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Thao tác thất bại'); }
  };

  /** Xóa phòng chiếu - xác nhận trước khi gọi API DELETE */
  const handleDelete = async (id: number) => {
    if (!confirm('Xóa phòng?')) return;
    try { await api.delete(`/room/${id}`); toast.success('Đã xóa'); load(); }
    catch (err: any) { toast.error(err.response?.data?.message || 'Xóa thất bại'); }
  };

  /** Xem sơ đồ ghế của phòng - tải danh sách ghế từ API */
  const viewSeats = async (room: Room) => {
    try {
      const r = await api.get(`/room/${room.roomID}/seats`);
      setSeatDialog({ open: true, roomId: room.roomID, roomName: room.roomName, seats: r.data || [] });
    } catch { toast.error('Lỗi tải ghế'); }
  };

  /** Tạo sơ đồ ghế tự động cho phòng (xóa ghế cũ, tạo lại theo số hàng/cột/VIP) */
  const generateSeats = async () => {
    try {
      const r = await api.post(`/room/${seatDialog.roomId}/seats/generate`, { rows: genRows, seatsPerRow: genCols, vipRows: genVip });
      toast.success(r.data.message);
      const s = await api.get(`/room/${seatDialog.roomId}/seats`);
      setSeatDialog((prev) => ({ ...prev, seats: s.data || [] }));
      load();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Tạo ghế thất bại'); }
  };

  /** Nhóm ghế theo hàng để render sơ đồ (A: [...], B: [...]) */
  const groupedSeats = seatDialog.seats.reduce((acc, s) => {
    if (!acc[s.seatRow]) acc[s.seatRow] = [];
    acc[s.seatRow].push(s);
    return acc;
  }, {} as Record<string, Seat[]>);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Phòng chiếu</h1>
        <Button onClick={openAdd} className="bg-gradient-to-r from-purple-600 to-purple-400 hover:shadow-lg hover:shadow-purple-600/30">
          <Plus className="w-4 h-4 mr-1" /> Thêm phòng
        </Button>
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
                  <TableHead className="text-gray-400">Tên phòng</TableHead>
                  <TableHead className="text-gray-400">Sức chứa</TableHead>
                  <TableHead className="text-gray-400">Trạng thái</TableHead>
                  <TableHead className="text-gray-400">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rooms.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-gray-500 py-12">Chưa có phòng</TableCell></TableRow>
                ) : rooms.map((r) => (
                  <TableRow key={r.roomID} className="border-[#2a2e3d]/50 hover:bg-[#22263a] transition-colors">
                    <TableCell>{r.roomID}</TableCell>
                    <TableCell className="font-semibold">{r.roomName}</TableCell>
                    <TableCell>{r.capacity}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusStyles[r.roomStatus] || ''}>
                        {roomStatusLabels[r.roomStatus] || r.roomStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm" className="h-7 border-[#2a2e3d] text-xs" onClick={() => viewSeats(r)}>
                          <LayoutGrid className="w-3 h-3 mr-1" /> Ghế
                        </Button>
                        <Button variant="outline" size="icon" className="h-7 w-7 border-[#2a2e3d]" onClick={() => openEdit(r)}>
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button variant="outline" size="icon" className="h-7 w-7 border-[#2a2e3d] text-red-400 hover:text-red-300" onClick={() => handleDelete(r.roomID)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#1a1d27] border-[#2a2e3d] text-white sm:max-w-md">
          <DialogHeader><DialogTitle>{editId ? 'Sửa phòng' : 'Thêm phòng'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-gray-400">Tên phòng</Label>
              <Input className="bg-[#0f1117] border-[#2a2e3d]" {...register('roomName')} />
              {errors.roomName && <p className="text-xs text-red-400">{errors.roomName.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-gray-400">Sức chứa</Label>
              <Input type="number" className="bg-[#0f1117] border-[#2a2e3d]" {...register('capacity', { valueAsNumber: true })} />
              {errors.capacity && <p className="text-xs text-red-400">{errors.capacity.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-gray-400">Trạng thái</Label>
              <StyledSelect
                value={watchStatus || 'Active'}
                onValueChange={(v) => setValue('roomStatus', v)}
                options={[
                  { value: 'Active', label: 'Hoạt động' },
                  { value: 'Maintenance', label: 'Bảo trì' },
                  { value: 'Inactive', label: 'Ngừng' },
                ]}
                placeholder="Chọn trạng thái"
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-purple-600 to-purple-400">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                {editId ? 'Cập nhật' : 'Lưu'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Seat Map Dialog */}
      <Dialog open={seatDialog.open} onOpenChange={(v) => setSeatDialog((p) => ({ ...p, open: v }))}>
        <DialogContent className="bg-[#1a1d27] border-[#2a2e3d] text-white sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Sơ đồ ghế - {seatDialog.roomName}</DialogTitle></DialogHeader>
          <div className="flex flex-col items-center gap-1 py-4">
            {/* Screen */}
            <div className="w-[80%] h-1 bg-gradient-to-r from-transparent via-purple-400 to-transparent rounded mb-1" />
            <p className="text-xs text-gray-500 mb-3">MÀN HÌNH</p>
            {/* Seats */}
            {Object.keys(groupedSeats).sort().map((row) => (
              <div key={row} className="flex items-center gap-1">
                <span className="w-6 text-center font-semibold text-xs text-gray-500">{row}</span>
                {groupedSeats[row].sort((a, b) => a.seatNumber - b.seatNumber).map((s) => (
                  <div key={s.seatID} title={`${s.seatRow}${s.seatNumber} (${s.seatType})`}
                    className={`w-7 h-7 rounded-md flex items-center justify-center text-[0.6rem] cursor-default transition-all ${
                      s.seatType === 'VIP'
                        ? 'bg-amber-400/15 border border-amber-400/30 text-amber-400'
                        : s.seatType === 'Couple'
                        ? 'bg-purple-400/15 border border-purple-400/30 text-purple-300'
                        : 'bg-teal-500/15 border border-teal-500/30 text-teal-400'
                    }`}>
                    {s.seatNumber}
                  </div>
                ))}
              </div>
            ))}
            {seatDialog.seats.length > 0 && (
              <div className="flex gap-4 justify-center mt-4 text-xs">
                <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-teal-500/15 border border-teal-500/30" /> Standard</span>
                <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-amber-400/15 border border-amber-400/30" /> VIP</span>
              </div>
            )}
            {seatDialog.seats.length === 0 && <p className="text-center text-gray-500 py-4">Chưa có ghế. Tạo ghế tự động bên dưới.</p>}
          </div>
          {/* Generate seats */}
          <div className="border-t border-[#2a2e3d] pt-4">
            <h4 className="text-sm font-semibold mb-3">Tạo ghế tự động</h4>
            <div className="flex gap-2 flex-wrap items-end">
              <div className="space-y-1">
                <Label className="text-gray-400 text-xs">Số hàng</Label>
                <Input type="number" value={genRows} onChange={(e) => setGenRows(+e.target.value)} className="w-24 bg-[#0f1117] border-[#2a2e3d]" />
              </div>
              <div className="space-y-1">
                <Label className="text-gray-400 text-xs">Ghế/hàng</Label>
                <Input type="number" value={genCols} onChange={(e) => setGenCols(+e.target.value)} className="w-24 bg-[#0f1117] border-[#2a2e3d]" />
              </div>
              <div className="space-y-1">
                <Label className="text-gray-400 text-xs">Hàng VIP</Label>
                <Input type="number" value={genVip} onChange={(e) => setGenVip(+e.target.value)} className="w-24 bg-[#0f1117] border-[#2a2e3d]" />
              </div>
              <Button onClick={generateSeats} size="sm" className="bg-gradient-to-r from-purple-600 to-purple-400">Tạo ghế</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
