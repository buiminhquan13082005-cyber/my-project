import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Loader2, Ticket, Eye, XCircle, Users, Armchair,
  Search, RefreshCw, Calendar, ChevronRight, TrendingUp, Ban,
} from 'lucide-react';
import api from '@/lib/api';
import { formatDateTime } from '@/lib/helpers';
import { toast } from 'sonner';

/* ───────── Interfaces ───────── */
interface Showtime {
  showtimeID: number;
  movieTitle: string;
  roomName: string;
  startTime: string;
  endTime: string;
  roomID: number;
}

interface SeatInfo {
  seatID: number;
  roomID: number;
  seatRow: string;
  seatNumber: number;
  seatType: string;
  isBooked: boolean;
}

interface SeatMapResponse {
  showtime: Showtime;
  seats: SeatInfo[];
  totalSeats: number;
  bookedCount: number;
  availableCount: number;
}

interface Booking {
  bookingID: number;
  showtimeID: number;
  seatID: number;
  customerName: string;
  customerPhone: string;
  status: string;
  bookingTime: string;
  movieTitle: string;
  roomName: string;
  seatRow: string;
  seatNumber: number;
  seatType: string;
  startTime: string;
}

interface ShowtimeBookingSummary {
  showtime: Showtime;
  totalSeats: number;
  bookedCount: number;
  availableCount: number;
  occupancyPercent: number;
}

/* ───────── Component ───────── */
/** Trang quản lý Đặt vé - xem tỉ lệ lấp đầy, sơ đồ ghế, danh sách vé, hủy vé */
export default function BookingsPage() {
  const [loading, setLoading] = useState(true);
  const [summaries, setSummaries] = useState<ShowtimeBookingSummary[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Seat map dialog
  const [seatDialogOpen, setSeatDialogOpen] = useState(false);
  const [seatMapData, setSeatMapData] = useState<SeatMapResponse | null>(null);
  const [seatLoading, setSeatLoading] = useState(false);

  // Bookings list dialog
  const [bookingsDialogOpen, setBookingsDialogOpen] = useState(false);
  const [bookingsList, setBookingsList] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [selectedShowtime, setSelectedShowtime] = useState<Showtime | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  /* ── Tải tổng hợp đặt vé cho mỗi suất chiếu (số ghế đã đặt, còn trống, tỉ lệ %) ── */
  const loadSummaries = useCallback(async () => {
    setLoading(true);
    try {
      // Get all showtimes (upcoming + ongoing)
      const stRes = await api.get('/booking/showtimes');
      const showtimes: Showtime[] = stRes.data || [];

      // For each showtime, get seat info
      const results: ShowtimeBookingSummary[] = await Promise.all(
        showtimes.map(async (st) => {
          try {
            const r = await api.get(`/booking/showtime/${st.showtimeID}/seats`);
            const d = r.data;
            return {
              showtime: st,
              totalSeats: d.totalSeats,
              bookedCount: d.bookedCount,
              availableCount: d.availableCount,
              occupancyPercent: d.totalSeats > 0 ? Math.round((d.bookedCount / d.totalSeats) * 100) : 0,
            };
          } catch {
            return {
              showtime: st,
              totalSeats: 0,
              bookedCount: 0,
              availableCount: 0,
              occupancyPercent: 0,
            };
          }
        })
      );

      const sortedResults = results.sort((a, b) => a.showtime.showtimeID - b.showtime.showtimeID);
      setSummaries(sortedResults);
    } catch {
      toast.error('Không thể tải dữ liệu đặt vé');
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadSummaries(); }, [loadSummaries]);

  /* ── Mở dialog sơ đồ ghế cho 1 suất chiếu (hiển thị ghế đã đặt/trống/VIP) ── */
  const openSeatMap = async (showtimeId: number) => {
    setSeatLoading(true);
    setSeatDialogOpen(true);
    try {
      const r = await api.get(`/booking/showtime/${showtimeId}/seats`);
      setSeatMapData(r.data);
    } catch {
      toast.error('Không thể tải sơ đồ ghế');
      setSeatDialogOpen(false);
    }
    setSeatLoading(false);
  };

  /* ── Mở dialog danh sách vé của 1 suất chiếu (thông tin khách hàng, ghế, trạng thái) ── */
  const openBookingsList = async (st: Showtime) => {
    setSelectedShowtime(st);
    setBookingsLoading(true);
    setBookingsDialogOpen(true);
    try {
      const r = await api.get(`/booking?showtimeId=${st.showtimeID}`);
      const sorted = (r.data || []).sort((a: Booking, b: Booking) => a.bookingID - b.bookingID);
      setBookingsList(sorted);
    } catch {
      toast.error('Không thể tải danh sách vé');
      setBookingsDialogOpen(false);
    }
    setBookingsLoading(false);
  };

  /* ── Hủy vé - xác nhận rồi gọi API DELETE, tự động refresh danh sách ── */
  const handleCancel = async (bookingId: number) => {
    if (!confirm('Bạn có chắc muốn hủy vé này?')) return;
    setCancellingId(bookingId);
    try {
      await api.delete(`/booking/${bookingId}`);
      toast.success('Đã hủy vé thành công');
      // Refresh bookings list
      if (selectedShowtime) {
        const r = await api.get(`/booking?showtimeId=${selectedShowtime.showtimeID}`);
        const sorted = (r.data || []).sort((a: Booking, b: Booking) => a.bookingID - b.bookingID);
        setBookingsList(sorted);
      }
      // Refresh summaries
      loadSummaries();
    } catch {
      toast.error('Hủy vé thất bại');
    }
    setCancellingId(null);
  };

  /* ── Computed ── */
  const totalBookings = summaries.reduce((sum, s) => sum + s.bookedCount, 0);
  const totalSeats = summaries.reduce((sum, s) => sum + s.totalSeats, 0);
  const totalAvailable = summaries.reduce((sum, s) => sum + s.availableCount, 0);
  const avgOccupancy = summaries.length > 0
    ? Math.round(summaries.reduce((sum, s) => sum + s.occupancyPercent, 0) / summaries.length)
    : 0;

  const filtered = summaries.filter(
    (s) =>
      s.showtime.movieTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.showtime.roomName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  /* ── Nhóm ghế theo hàng (A, B, C...) để render sơ đồ ghế ── */
  const groupSeatsByRow = (seats: SeatInfo[]) => {
    const rows: Record<string, SeatInfo[]> = {};
    seats.forEach((seat) => {
      if (!rows[seat.seatRow]) rows[seat.seatRow] = [];
      rows[seat.seatRow].push(seat);
    });
    // Sort each row by seat number
    Object.keys(rows).forEach((row) => {
      rows[row].sort((a, b) => a.seatNumber - b.seatNumber);
    });
    return rows;
  };

  /* ── Stat cards ── */
  const statCards = [
    {
      label: 'Tổng vé đã đặt',
      value: totalBookings,
      icon: Ticket,
      gradient: 'from-purple-600/15 to-purple-600/5',
      iconBg: 'bg-purple-500/15 text-purple-400',
    },
    {
      label: 'Tổng ghế trống',
      value: totalAvailable,
      icon: Armchair,
      gradient: 'from-teal-500/15 to-teal-500/5',
      iconBg: 'bg-teal-500/15 text-teal-400',
    },
    {
      label: 'Suất chiếu',
      value: summaries.length,
      icon: Calendar,
      gradient: 'from-blue-500/15 to-blue-500/5',
      iconBg: 'bg-blue-500/15 text-blue-400',
    },
    {
      label: 'Tỉ lệ lấp đầy TB',
      value: `${avgOccupancy}%`,
      icon: TrendingUp,
      gradient: 'from-amber-500/15 to-amber-500/5',
      iconBg: 'bg-amber-500/15 text-amber-400',
    },
  ];

  /* ── Trả về màu sắc tương ứng với tỉ lệ lấp đầy (đỏ=cao, vàng=TB, xanh=thấp) ── */
  const getOccupancyColor = (percent: number) => {
    if (percent >= 80) return 'text-red-400';
    if (percent >= 50) return 'text-amber-400';
    if (percent >= 20) return 'text-teal-400';
    return 'text-gray-400';
  };

  /** Trả về gradient color cho thanh tiến trình theo tỉ lệ lấp đầy */
  const getBarColor = (percent: number) => {
    if (percent >= 80) return 'bg-gradient-to-r from-red-500 to-rose-400';
    if (percent >= 50) return 'bg-gradient-to-r from-amber-500 to-yellow-400';
    if (percent >= 20) return 'bg-gradient-to-r from-teal-500 to-emerald-400';
    return 'bg-gradient-to-r from-gray-500 to-gray-400';
  };

  /* ── RENDER ── */
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Quản lý đặt vé</h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              placeholder="Tìm phim, phòng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-60 bg-[#1a1d27] border-[#2a2e3d] text-white placeholder:text-gray-500"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 border-[#2a2e3d] text-gray-400 hover:text-white"
            onClick={loadSummaries}
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((s) => (
          <Card
            key={s.label}
            className={`bg-gradient-to-br ${s.gradient} border-[#2a2e3d] hover:-translate-y-1 transition-all duration-300 cursor-default`}
          >
            <CardContent className="flex items-center gap-5 p-6">
              <div className={`w-13 h-13 rounded-xl flex items-center justify-center text-xl ${s.iconBg}`}>
                <s.icon className="w-6 h-6" />
              </div>
              <div>
                <span className="text-3xl font-extrabold block">{s.value}</span>
                <span className="text-sm text-gray-400">{s.label}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Showtimes Booking Table */}
      <Card className="bg-[#1a1d27] border-[#2a2e3d]">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="w-4 h-4 text-purple-400" />
            Tình trạng đặt vé theo suất chiếu
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-[#2a2e3d] hover:bg-transparent">
                <TableHead className="text-gray-400">Suất</TableHead>
                <TableHead className="text-gray-400">Phim</TableHead>
                <TableHead className="text-gray-400">Phòng</TableHead>
                <TableHead className="text-gray-400">Giờ chiếu</TableHead>
                <TableHead className="text-gray-400">Đã đặt / Tổng</TableHead>
                <TableHead className="text-gray-400 w-[200px]">Tỉ lệ lấp đầy</TableHead>
                <TableHead className="text-gray-400 text-center">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500 py-12">
                    Không có suất chiếu nào
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((s) => (
                  <TableRow
                    key={s.showtime.showtimeID}
                    className="border-[#2a2e3d]/50 hover:bg-[#22263a] transition-colors"
                  >
                    <TableCell className="font-mono text-purple-300">#{s.showtime.showtimeID}</TableCell>
                    <TableCell className="font-semibold">{s.showtime.movieTitle}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-blue-500/10 text-blue-300 border-blue-500/20">
                        {s.showtime.roomName}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{formatDateTime(s.showtime.startTime)}</TableCell>
                    <TableCell>
                      <span className={`font-bold ${getOccupancyColor(s.occupancyPercent)}`}>
                        {s.bookedCount}
                      </span>
                      <span className="text-gray-500"> / {s.totalSeats}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-[#2a2e3d] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${getBarColor(s.occupancyPercent)}`}
                            style={{ width: `${s.occupancyPercent}%` }}
                          />
                        </div>
                        <span className={`text-xs font-bold min-w-[36px] text-right ${getOccupancyColor(s.occupancyPercent)}`}>
                          {s.occupancyPercent}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs border-[#2a2e3d] text-purple-300 hover:text-purple-200 hover:bg-purple-500/10 hover:border-purple-500/30 gap-1"
                          onClick={() => openSeatMap(s.showtime.showtimeID)}
                        >
                          <Armchair className="w-3 h-3" /> Sơ đồ
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs border-[#2a2e3d] text-teal-300 hover:text-teal-200 hover:bg-teal-500/10 hover:border-teal-500/30 gap-1"
                          onClick={() => openBookingsList(s.showtime)}
                        >
                          <Users className="w-3 h-3" /> Danh sách
                          <ChevronRight className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ─── Seat Map Dialog ─── */}
      <Dialog open={seatDialogOpen} onOpenChange={setSeatDialogOpen}>
        <DialogContent className="bg-[#1a1d27] border-[#2a2e3d] text-white sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Armchair className="w-5 h-5 text-purple-400" />
              Sơ đồ ghế
              {seatMapData && (
                <Badge variant="outline" className="ml-2 bg-purple-500/10 text-purple-300 border-purple-500/20">
                  {seatMapData.showtime.movieTitle}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {seatLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
            </div>
          ) : seatMapData ? (
            <div className="space-y-5">
              {/* Showtime info */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-[#22263a] p-3 text-center">
                  <span className="text-2xl font-bold text-purple-300">{seatMapData.bookedCount}</span>
                  <p className="text-xs text-gray-400 mt-1">Đã đặt</p>
                </div>
                <div className="rounded-lg bg-[#22263a] p-3 text-center">
                  <span className="text-2xl font-bold text-teal-300">{seatMapData.availableCount}</span>
                  <p className="text-xs text-gray-400 mt-1">Còn trống</p>
                </div>
                <div className="rounded-lg bg-[#22263a] p-3 text-center">
                  <span className="text-2xl font-bold text-white">{seatMapData.totalSeats}</span>
                  <p className="text-xs text-gray-400 mt-1">Tổng ghế</p>
                </div>
              </div>

              {/* Screen indicator */}
              <div className="flex justify-center">
                <div className="w-3/4 h-2 rounded-full bg-gradient-to-r from-purple-600/30 via-purple-400/60 to-purple-600/30 relative">
                  <p className="text-[0.6rem] text-gray-500 text-center mt-3 uppercase tracking-widest">Màn hình</p>
                </div>
              </div>

              {/* Seat grid */}
              <div className="space-y-1.5 mt-4">
                {Object.entries(groupSeatsByRow(seatMapData.seats))
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([row, seats]) => (
                    <div key={row} className="flex items-center gap-2">
                      <span className="w-6 text-center text-xs font-bold text-gray-400">{row}</span>
                      <div className="flex gap-1.5 flex-1 justify-center">
                        {seats.map((seat) => (
                          <div
                            key={seat.seatID}
                            title={`${seat.seatRow}${seat.seatNumber} - ${seat.seatType}${seat.isBooked ? ' (Đã đặt)' : ' (Trống)'}`}
                            className={`
                              w-8 h-8 rounded-md flex items-center justify-center text-[0.6rem] font-bold
                              transition-all duration-200 cursor-default
                              ${seat.isBooked
                                ? 'bg-gradient-to-br from-red-500/80 to-rose-600/80 text-white shadow-md shadow-red-500/20'
                                : seat.seatType === 'VIP'
                                  ? 'bg-gradient-to-br from-amber-500/20 to-yellow-500/20 text-amber-300 border border-amber-500/30 hover:from-amber-500/30 hover:to-yellow-500/30'
                                  : 'bg-[#2a2e3d] text-gray-400 border border-[#3a3f52] hover:bg-[#333850]'
                              }
                            `}
                          >
                            {seat.seatNumber}
                          </div>
                        ))}
                      </div>
                      <span className="w-6 text-center text-xs font-bold text-gray-400">{row}</span>
                    </div>
                  ))}
              </div>

              {/* Legend */}
              <div className="flex items-center justify-center gap-6 pt-3 border-t border-[#2a2e3d]">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-[#2a2e3d] border border-[#3a3f52]" />
                  <span className="text-xs text-gray-400">Trống</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-gradient-to-br from-red-500/80 to-rose-600/80" />
                  <span className="text-xs text-gray-400">Đã đặt</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border border-amber-500/30" />
                  <span className="text-xs text-gray-400">VIP</span>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* ─── Bookings List Dialog ─── */}
      <Dialog open={bookingsDialogOpen} onOpenChange={setBookingsDialogOpen}>
        <DialogContent className="bg-[#1a1d27] border-[#2a2e3d] text-white sm:max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ticket className="w-5 h-5 text-teal-400" />
              Danh sách vé
              {selectedShowtime && (
                <Badge variant="outline" className="ml-2 bg-teal-500/10 text-teal-300 border-teal-500/20">
                  {selectedShowtime.movieTitle} — {formatDateTime(selectedShowtime.startTime)}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {bookingsLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-teal-400" />
            </div>
          ) : bookingsList.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Ticket className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Chưa có vé nào cho suất chiếu này</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary row */}
              <div className="flex items-center gap-4 text-sm">
                <Badge className="bg-teal-500/10 text-teal-300 border-teal-500/20">
                  {bookingsList.filter(b => b.status === 'Confirmed').length} Xác nhận
                </Badge>
                <Badge className="bg-red-500/10 text-red-300 border-red-500/20">
                  {bookingsList.filter(b => b.status === 'Cancelled').length} Đã hủy
                </Badge>
              </div>

              {/* Bookings table */}
              <Table>
                <TableHeader>
                  <TableRow className="border-[#2a2e3d] hover:bg-transparent">
                    <TableHead className="text-gray-400">Mã vé</TableHead>
                    <TableHead className="text-gray-400">Ghế</TableHead>
                    <TableHead className="text-gray-400">Loại</TableHead>
                    <TableHead className="text-gray-400">Khách hàng</TableHead>
                    <TableHead className="text-gray-400">SĐT</TableHead>
                    <TableHead className="text-gray-400">Trạng thái</TableHead>
                    <TableHead className="text-gray-400">Giờ đặt</TableHead>
                    <TableHead className="text-gray-400 text-center">Hủy vé</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookingsList.map((b) => (
                    <TableRow
                      key={b.bookingID}
                      className={`border-[#2a2e3d]/50 transition-colors ${
                        b.status === 'Cancelled' ? 'opacity-50' : 'hover:bg-[#22263a]'
                      }`}
                    >
                      <TableCell className="font-mono text-purple-300">#{b.bookingID}</TableCell>
                      <TableCell>
                        <span className="font-bold text-white">{b.seatRow}{b.seatNumber}</span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            b.seatType === 'VIP'
                              ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                              : 'bg-gray-500/10 text-gray-300 border-gray-500/20'
                          }
                        >
                          {b.seatType}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{b.customerName}</TableCell>
                      <TableCell className="text-sm text-gray-300">{b.customerPhone}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            b.status === 'Confirmed'
                              ? 'bg-teal-500/12 text-teal-400 border-teal-500/20'
                              : 'bg-red-500/12 text-red-400 border-red-500/20'
                          }
                        >
                          {b.status === 'Confirmed' ? 'Đã xác nhận' : 'Đã hủy'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-gray-400">{formatDateTime(b.bookingTime)}</TableCell>
                      <TableCell className="text-center">
                        {b.status === 'Confirmed' ? (
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 border-[#2a2e3d] text-red-400 hover:text-red-300 hover:bg-red-500/10 hover:border-red-500/30"
                            onClick={() => handleCancel(b.bookingID)}
                            disabled={cancellingId === b.bookingID}
                          >
                            {cancellingId === b.bookingID ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5" />
                            )}
                          </Button>
                        ) : (
                          <Ban className="w-3.5 h-3.5 text-gray-600 mx-auto" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
