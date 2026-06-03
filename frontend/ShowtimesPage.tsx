import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Trash2, Loader2, Search } from 'lucide-react';
import { StyledSelect } from '@/components/ui/styled-select';
import { DatePicker, DateTimePicker } from '@/components/ui/date-picker';
import api from '@/lib/api';
import { formatDateTime } from '@/lib/helpers';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Showtime { showtimeID: number; movieTitle: string; roomName: string; startTime: string; endTime: string; }
interface Movie { movieID: number; title: string; duration: number; }
interface Room { roomID: number; roomName: string; roomStatus: string; }

/** Trang quản lý Suất chiếu - tạo/xóa suất chiếu, lọc theo ngày, tự tính giờ kết thúc */
export default function ShowtimesPage() {
  const [list, setList] = useState<Showtime[]>([]);
  const [dateFilter, setDateFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [form, setForm] = useState({ movieID: 0, movieTitle: '', roomID: 0, roomName: '', startTime: '', endTime: '' });

  /** Tải danh sách suất chiếu từ API, lọc theo ngày đã chọn */
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/showtime' + (dateFilter ? `?date=${dateFilter}` : ''));
      const sorted = (r.data || []).sort((a: Showtime, b: Showtime) => a.showtimeID - b.showtimeID);
      setList(sorted);
    } catch { toast.error('Lỗi tải suất chiếu'); }
    setLoading(false);
  }, [dateFilter]);

  useEffect(() => { load(); }, [load]);

  /** Mở dialog thêm suất chiếu - tải danh sách phim và phòng hoạt động */
  const openAdd = async () => {
    try {
      const [m, r] = await Promise.all([api.get('/movie'), api.get('/room')]);
      setMovies(m.data || []);
      setRooms((r.data || []).filter((x: Room) => x.roomStatus === 'Active'));
      setForm({ movieID: 0, movieTitle: '', roomID: 0, roomName: '', startTime: '', endTime: '' });
      setDialogOpen(true);
    } catch { toast.error('Lỗi tải dữ liệu'); }
  };

  /** Xử lý khi chọn phim - tự tính giờ kết thúc dựa trên thời lượng phim + 15 phút dọn dẹp */
  const onMovieChange = (val: string) => {
    const id = parseInt(val);
    const m = movies.find((x) => x.movieID === id);
    setForm((p) => {
      const updated = { ...p, movieID: id, movieTitle: m?.title || '' };
      // Recalculate endTime if startTime exists
      if (p.startTime && m) {
        const start = new Date(p.startTime);
        start.setMinutes(start.getMinutes() + m.duration + 15);
        updated.endTime = format(start, "yyyy-MM-dd'T'HH:mm");
      }
      return updated;
    });
  };

  /** Xử lý khi chọn phòng chiếu */
  const onRoomChange = (val: string) => {
    const id = parseInt(val);
    const r = rooms.find((x) => x.roomID === id);
    setForm((p) => ({ ...p, roomID: id, roomName: r?.roomName || '' }));
  };

  /** Xử lý khi thay đổi giờ bắt đầu - tự tính lại giờ kết thúc */
  const onStartChange = (val: string) => {
    const m = movies.find((x) => x.movieID === form.movieID);
    const dur = m?.duration || 120;
    const start = new Date(val);
    start.setMinutes(start.getMinutes() + dur + 15);
    const endStr = format(start, "yyyy-MM-dd'T'HH:mm");
    setForm((p) => ({ ...p, startTime: val, endTime: endStr }));
  };

  /** Gửi form tạo suất chiếu mới - validate đầy đủ trước khi gọi API POST */
  const onSubmit = async () => {
    if (!form.movieID || !form.roomID || !form.startTime) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }
    try {
      await api.post('/showtime', form);
      toast.success('Đã thêm suất chiếu');
      setDialogOpen(false);
      
      // Đổi ngày lọc sang ngày vừa tạo để hiển thị ngay lập tức
      const newDate = form.startTime.split('T')[0];
      if (dateFilter !== newDate) {
        setDateFilter(newDate); // useEffect sẽ tự gọi load()
      } else {
        load();
      }
    } catch (err: any) { 
      toast.error(err.response?.data?.message || 'Tạo suất chiếu thất bại'); 
    }
  };

  /** Xóa suất chiếu - xác nhận trước khi gọi API DELETE */
  const handleDelete = async (id: number) => {
    if (!confirm('Xóa suất chiếu?')) return;
    try { await api.delete(`/showtime/${id}`); toast.success('Đã xóa'); load(); }
    catch (err: any) { toast.error(err.response?.data?.message || 'Xóa thất bại'); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Suất chiếu</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <DatePicker
              value={dateFilter}
              onChange={setDateFilter}
              placeholder="Tất cả ngày"
              className="w-48"
            />
            {dateFilter && (
              <Button variant="ghost" size="sm" onClick={() => setDateFilter('')} className="text-gray-400 hover:text-white px-2 h-9">
                Xóa lọc
              </Button>
            )}
          </div>
          <Button variant="outline" size="icon" className="h-9 w-9 border-[#2a2e3d]" onClick={load}>
            <Search className="w-4 h-4" />
          </Button>
          <Button onClick={openAdd} className="bg-gradient-to-r from-purple-600 to-purple-400 hover:shadow-lg hover:shadow-purple-600/30">
            <Plus className="w-4 h-4 mr-1" /> Thêm suất chiếu
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
                  <TableHead className="text-gray-400">Phim</TableHead>
                  <TableHead className="text-gray-400">Phòng</TableHead>
                  <TableHead className="text-gray-400">Bắt đầu</TableHead>
                  <TableHead className="text-gray-400">Kết thúc</TableHead>
                  <TableHead className="text-gray-400">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-gray-500 py-12">Chưa có suất chiếu</TableCell></TableRow>
                ) : list.map((s) => (
                  <TableRow key={s.showtimeID} className="border-[#2a2e3d]/50 hover:bg-[#22263a] transition-colors">
                    <TableCell>{s.showtimeID}</TableCell>
                    <TableCell className="font-semibold">{s.movieTitle}</TableCell>
                    <TableCell>{s.roomName}</TableCell>
                    <TableCell>{formatDateTime(s.startTime)}</TableCell>
                    <TableCell>{formatDateTime(s.endTime)}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="icon" className="h-7 w-7 border-[#2a2e3d] text-red-400 hover:text-red-300" onClick={() => handleDelete(s.showtimeID)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#1a1d27] border-[#2a2e3d] text-white sm:max-w-lg">
          <DialogHeader><DialogTitle>Thêm suất chiếu</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-gray-400">Phim</Label>
              <StyledSelect
                value={form.movieID ? String(form.movieID) : ''}
                onValueChange={onMovieChange}
                options={movies.map((m) => ({ value: String(m.movieID), label: m.title }))}
                placeholder="Chọn phim"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-gray-400">Phòng</Label>
              <StyledSelect
                value={form.roomID ? String(form.roomID) : ''}
                onValueChange={onRoomChange}
                options={rooms.map((r) => ({ value: String(r.roomID), label: r.roomName }))}
                placeholder="Chọn phòng"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-gray-400">Giờ bắt đầu</Label>
              <DateTimePicker
                value={form.startTime}
                onChange={onStartChange}
                placeholder="Chọn giờ bắt đầu"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-gray-400">Giờ kết thúc (tự tính)</Label>
              <DateTimePicker
                value={form.endTime}
                onChange={() => {}}
                placeholder="Tự tính từ phim"
              />
            </div>
            <div className="col-span-2 flex justify-end pt-2">
              <Button onClick={onSubmit} className="bg-gradient-to-r from-purple-600 to-purple-400">Tạo</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
