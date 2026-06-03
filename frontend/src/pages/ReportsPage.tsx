import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileText, Search, Loader2 } from 'lucide-react';
import { DatePicker } from '@/components/ui/date-picker';
import api from '@/lib/api';
import { toast } from 'sonner';
import { formatMoney } from '@/lib/helpers';

const txTypeStyles: Record<string, { label: string; cls: string }> = {
  Import: { label: 'Nhập kho', cls: 'bg-teal-500/12 text-teal-400 border-teal-500/20' },
  Export: { label: 'Xuất kho', cls: 'bg-blue-400/12 text-blue-400 border-blue-400/20' },
  Damaged: { label: 'Hỏng', cls: 'bg-red-500/12 text-red-400 border-red-500/20' },
  Disposed: { label: 'Thanh lý', cls: 'bg-amber-500/12 text-amber-400 border-amber-500/20' },
};

interface Report {
  date: string;
  totalImports: number;
  totalExports: number;
  totalDamaged: number;
  totalDisposed: number;
  transactions: Array<{ equipmentName: string; transactionType: string; quantity: number; unitPrice: number; reason: string }>;
  totalMaintenances?: number;
  maintenances?: Array<{ requestID: number; equipmentName: string; requestType: string; assignedToName?: string; description: string }>;
}

const getLocalDateString = () => {
  const d = new Date();
  const tzOffset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffset).toISOString().slice(0, 10);
};

/** Trang Báo cáo - xem báo cáo xuất/nhập/hỏng/thanh lý theo ngày */
export default function ReportsPage() {
  const [date, setDate] = useState(getLocalDateString());
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);

  /** Tải báo cáo theo ngày - gọi API GET /warehouse/report?date=... */
  const loadReport = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get(`/warehouse/report?date=${date}`);
      setReport(r.data);
    } catch { toast.error('Lỗi tải báo cáo'); }
    setLoading(false);
  }, [date]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const statCards = report ? [
    { label: 'Nhập kho', value: report.totalImports, color: 'text-teal-400' },
    { label: 'Xuất kho', value: report.totalExports, color: 'text-amber-400' },
    { label: 'Đã bảo trì', value: report.totalMaintenances || 0, color: 'text-blue-400' },
  ] : [];

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Báo cáo</h1>

      <Card className="bg-[#1a1d27] border-[#2a2e3d]">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-4 h-4" /> Báo cáo cuối ngày
          </CardTitle>
          <div className="flex items-center gap-2">
            <DatePicker
              value={date}
              onChange={setDate}
              placeholder="Chọn ngày báo cáo"
              className="w-48"
            />
            <Button size="sm" onClick={loadReport} disabled={loading}
              className="bg-gradient-to-r from-purple-600 to-purple-400">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Search className="w-4 h-4 mr-1" />}
              Xem
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!report ? (
            <div className="text-center py-16 text-gray-500">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p>Chọn ngày để xem báo cáo</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                {statCards.map((s) => (
                  <div key={s.label} className="text-center p-5 bg-[#0f1117] rounded-lg border border-[#2a2e3d]">
                    <span className={`text-3xl font-extrabold block ${s.color}`}>{s.value}</span>
                    <span className="text-xs text-gray-500 mt-1">{s.label}</span>
                  </div>
                ))}
              </div>

              {/* Transactions table */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-300">Giao dịch kho trong ngày</h3>
                {report.transactions && report.transactions.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-[#2a2e3d] hover:bg-transparent">
                        <TableHead className="text-gray-400">Thiết bị</TableHead>
                        <TableHead className="text-gray-400">Loại</TableHead>
                        <TableHead className="text-gray-400">SL</TableHead>
                        <TableHead className="text-gray-400">Đơn giá</TableHead>
                        <TableHead className="text-gray-400">Lý do</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.transactions.map((t, i) => (
                        <TableRow key={i} className="border-[#2a2e3d]/50 hover:bg-[#22263a]">
                          <TableCell>{t.equipmentName}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={txTypeStyles[t.transactionType]?.cls || ''}>
                              {txTypeStyles[t.transactionType]?.label || t.transactionType}
                            </Badge>
                          </TableCell>
                          <TableCell>{t.quantity}</TableCell>
                          <TableCell>{formatMoney(t.unitPrice)}</TableCell>
                          <TableCell>{t.reason}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-gray-500 border border-dashed border-[#2a2e3d] rounded-lg">
                    <p>Không có giao dịch trong ngày {report.date}</p>
                  </div>
                )}
              </div>

              {/* Completed Maintenance table */}
              <div className="space-y-2 pt-4">
                <h3 className="text-sm font-semibold text-gray-300">Thiết bị hoàn tất bảo trì trong ngày</h3>
                {report.maintenances && report.maintenances.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-[#2a2e3d] hover:bg-transparent">
                        <TableHead className="text-gray-400">Yêu cầu ID</TableHead>
                        <TableHead className="text-gray-400">Thiết bị</TableHead>
                        <TableHead className="text-gray-400">Loại bảo trì</TableHead>
                        <TableHead className="text-gray-400">Kỹ thuật viên</TableHead>
                        <TableHead className="text-gray-400">Mô tả</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.maintenances.map((m, i) => (
                        <TableRow key={i} className="border-[#2a2e3d]/50 hover:bg-[#22263a]">
                          <TableCell className="font-mono text-purple-300">#{m.requestID}</TableCell>
                          <TableCell className="font-medium text-white">{m.equipmentName}</TableCell>
                          <TableCell>{m.requestType === 'Emergency' ? 'Hỏng bất ngờ' : 'Định kỳ'}</TableCell>
                          <TableCell>{m.assignedToName || '-'}</TableCell>
                          <TableCell className="text-sm text-gray-400 max-w-[250px] truncate" title={m.description}>{m.description}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-gray-500 border border-dashed border-[#2a2e3d] rounded-lg">
                    <p>Không có thiết bị nào hoàn tất bảo trì trong ngày {report.date}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
