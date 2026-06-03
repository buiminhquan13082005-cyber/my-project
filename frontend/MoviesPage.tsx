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
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { StyledFilterSelect, StyledSelect } from '@/components/ui/styled-select';
import { DatePicker } from '@/components/ui/date-picker';
import api from '@/lib/api';
import { formatDate, movieStatusLabels } from '@/lib/helpers';
import { movieSchema, type MovieFormData } from '@/lib/schemas';
import { toast } from 'sonner';

interface Movie {
  movieID: number; title: string; genre: string; duration: number;
  status: string; releaseDate: string; endDate: string; description: string;
}

const statusStyles: Record<string, string> = {
  NowShowing: 'bg-teal-500/12 text-teal-400 border-teal-500/20',
  ComingSoon: 'bg-blue-400/12 text-blue-400 border-blue-400/20',
  Ended: 'bg-gray-500/12 text-gray-400 border-gray-500/20',
};

const movieStatusOptions = [
  { value: 'NowShowing', label: 'Đang chiếu' },
  { value: 'ComingSoon', label: 'Sắp chiếu' },
  { value: 'Ended', label: 'Đã kết thúc' },
];

/** Trang quản lý Phim - thêm/sửa/xóa phim, lọc theo trạng thái (Đang chiếu, Sắp chiếu, Đã kết thúc) */
export default function MoviesPage() {
  const [list, setList] = useState<Movie[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<MovieFormData>({
    resolver: zodResolver(movieSchema),
  });

  const watchStatus = watch('status');
  const watchReleaseDate = watch('releaseDate');
  const watchEndDate = watch('endDate');

  /** Tải danh sách phim từ API, hỗ trợ lọc theo trạng thái */
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/movie' + (filter ? `?status=${filter}` : ''));
      const sorted = (r.data || []).sort((a: Movie, b: Movie) => a.movieID - b.movieID);
      setList(sorted);
    } catch { toast.error('Lỗi tải phim'); }
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  /** Mở dialog thêm phim mới - reset form về giá trị mặc định */
  const openAdd = () => {
    setEditId(null);
    reset({ title: '', genre: '', duration: 120, status: 'NowShowing', releaseDate: '', endDate: '', description: '' });
    setDialogOpen(true);
  };

  /** Mở dialog sửa phim - điền sẵn dữ liệu phim hiện tại vào form */
  const openEdit = (m: Movie) => {
    setEditId(m.movieID);
    reset({
      title: m.title, genre: m.genre, duration: m.duration, status: m.status,
      releaseDate: (m.releaseDate || '').split('T')[0],
      endDate: (m.endDate || '').split('T')[0],
      description: m.description,
    });
    setDialogOpen(true);
  };

  /** Gửi form thêm/sửa phim - gọi API POST hoặc PUT tùy editId */
  const onSubmit = async (data: MovieFormData) => {
    try {
      if (editId) {
        await api.put(`/movie/${editId}`, data);
        toast.success('Đã cập nhật phim');
      } else {
        await api.post('/movie', data);
        toast.success('Đã thêm phim');
      }
      setDialogOpen(false);
      load();
    } catch (err: any) { 
      toast.error(err.response?.data?.message || 'Thao tác thất bại'); 
    }
  };

  /** Xóa phim - xác nhận trước khi gọi API DELETE */
  const handleDelete = async (id: number) => {
    if (!confirm('Xóa phim này?')) return;
    try { await api.delete(`/movie/${id}`); toast.success('Đã xóa'); load(); }
    catch { toast.error('Xóa thất bại'); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Phim</h1>
        <div className="flex items-center gap-3">
          <StyledFilterSelect
            value={filter}
            onValueChange={setFilter}
            options={movieStatusOptions}
            placeholder="Trạng thái phim"
            allLabel="Tất cả trạng thái"
          />
          <Button onClick={openAdd} className="bg-gradient-to-r from-purple-600 to-purple-400 hover:shadow-lg hover:shadow-purple-600/30">
            <Plus className="w-4 h-4 mr-1" /> Thêm phim
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
                  <TableHead className="text-gray-400">Tên phim</TableHead>
                  <TableHead className="text-gray-400">Thể loại</TableHead>
                  <TableHead className="text-gray-400">Thời lượng</TableHead>
                  <TableHead className="text-gray-400">Ngày chiếu</TableHead>
                  <TableHead className="text-gray-400">Trạng thái</TableHead>
                  <TableHead className="text-gray-400">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center text-gray-500 py-12">Chưa có phim</TableCell></TableRow>
                ) : list.map((m) => (
                  <TableRow key={m.movieID} className="border-[#2a2e3d]/50 hover:bg-[#22263a] transition-colors">
                    <TableCell>{m.movieID}</TableCell>
                    <TableCell className="font-semibold">{m.title}</TableCell>
                    <TableCell>{m.genre}</TableCell>
                    <TableCell>{m.duration} phút</TableCell>
                    <TableCell className="text-sm">{formatDate(m.releaseDate)} - {formatDate(m.endDate)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusStyles[m.status] || ''}>
                        {movieStatusLabels[m.status] || m.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="outline" size="icon" className="h-7 w-7 border-[#2a2e3d]" onClick={() => openEdit(m)}>
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button variant="outline" size="icon" className="h-7 w-7 border-[#2a2e3d] text-red-400 hover:text-red-300" onClick={() => handleDelete(m.movieID)}>
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#1a1d27] border-[#2a2e3d] text-white sm:max-w-lg">
          <DialogHeader><DialogTitle>{editId ? 'Sửa phim' : 'Thêm phim'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-gray-400">Tên phim</Label>
              <Input className="bg-[#0f1117] border-[#2a2e3d]" {...register('title')} />
              {errors.title && <p className="text-xs text-red-400">{errors.title.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-gray-400">Thể loại</Label>
              <Input className="bg-[#0f1117] border-[#2a2e3d]" placeholder="Hành động, Phiêu lưu" {...register('genre')} />
              {errors.genre && <p className="text-xs text-red-400">{errors.genre.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-gray-400">Thời lượng (phút)</Label>
              <Input type="number" className="bg-[#0f1117] border-[#2a2e3d]" {...register('duration', { valueAsNumber: true })} />
              {errors.duration && <p className="text-xs text-red-400">{errors.duration.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-gray-400">Trạng thái</Label>
              <StyledSelect
                value={watchStatus || 'NowShowing'}
                onValueChange={(v) => setValue('status', v)}
                options={movieStatusOptions}
                placeholder="Chọn trạng thái"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-gray-400">Ngày bắt đầu</Label>
              <DatePicker
                value={watchReleaseDate}
                onChange={(v) => setValue('releaseDate', v)}
                placeholder="Chọn ngày bắt đầu"
              />
              {errors.releaseDate && <p className="text-xs text-red-400">{errors.releaseDate.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-gray-400">Ngày kết thúc</Label>
              <DatePicker
                value={watchEndDate}
                onChange={(v) => setValue('endDate', v)}
                placeholder="Chọn ngày kết thúc"
              />
              {errors.endDate && <p className="text-xs text-red-400">{errors.endDate.message}</p>}
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-gray-400">Mô tả</Label>
              <Textarea className="bg-[#0f1117] border-[#2a2e3d]" rows={2} {...register('description')} />
            </div>
            <div className="col-span-2 flex justify-end pt-2">
              <Button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-purple-600 to-purple-400">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                {editId ? 'Cập nhật' : 'Lưu'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
