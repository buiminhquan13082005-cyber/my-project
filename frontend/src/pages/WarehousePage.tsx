import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Boxes, ArrowDown, ArrowUp, History, Plus, Loader2, Trash2 } from 'lucide-react';
import { StyledSelect } from '@/components/ui/styled-select';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { formatDate, formatMoney, categoryLabels } from '@/lib/helpers';
import { warehouseImportSchema, warehouseExportSchema, type WarehouseImportFormData, type WarehouseExportFormData } from '@/lib/schemas';
import { toast } from 'sonner';

interface Storage { equipmentName: string; category: string; currentQuantity: number; minRequiredQuantity: number; conditionStatus: string; warehouseLocation: string; isLowStock: boolean; }
interface Transaction { transactionID: number; equipmentName: string; transactionType: string; quantity: number; unitPrice: number; supplier: string; reason: string; transactionDate: string; }
interface Equipment { equipmentID: number; equipmentName: string; }

const txTypeStyles: Record<string, { label: string; cls: string }> = {
  Import: { label: 'Nhập', cls: 'bg-teal-500/12 text-teal-400 border-teal-500/20' },
  Export: { label: 'Xuất', cls: 'bg-blue-400/12 text-blue-400 border-blue-400/20' },
  Damaged: { label: 'Hỏng', cls: 'bg-red-500/12 text-red-400 border-red-500/20' },
  Disposed: { label: 'Thanh lý', cls: 'bg-amber-500/12 text-amber-400 border-amber-500/20' },
};

/** Trang quản lý Kho thiết bị - nhập/xuất kho, xem tồn kho, lịch sử giao dịch, kiểm kê */
export default function WarehousePage() {
  const { role } = useAuth();
  const [storages, setStorages] = useState<Storage[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');

  const filteredTransactions = transactions.filter(t => {
    if (filterType === 'all') return true;
    return t.transactionType === filterType;
  });

  const importForm = useForm<WarehouseImportFormData>({ resolver: zodResolver(warehouseImportSchema), defaultValues: { employeeID: 1, employeeName: 'Admin' } });
  const exportForm = useForm<WarehouseExportFormData>({ resolver: zodResolver(warehouseExportSchema), defaultValues: { employeeID: 1, employeeName: 'Admin' } });

  /** Tải tất cả dữ liệu kho: tồn kho, giao dịch, danh sách thiết bị */
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [st, tx, eq] = await Promise.all([
        api.get('/equipment/storage'), api.get('/warehouse/transactions'),
        api.get('/equipment'),
      ]);
      setStorages(st.data || []);
      
      const sortedTx = (tx.data || []).sort((a: Transaction, b: Transaction) => a.transactionID - b.transactionID);
      setTransactions(sortedTx);
      
      setEquipments(eq.data || []);
    } catch { toast.error('Lỗi tải dữ liệu kho'); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  /** Nhập thiết bị vào kho - gọi API POST /warehouse/import */
  const onImport = async (data: WarehouseImportFormData) => {
    try {
      await api.post('/warehouse/import', data);
      toast.success('Nhập kho thành công');
      importForm.reset({ equipmentID: undefined, equipmentName: '', quantity: undefined, unitPrice: undefined, reason: '', employeeID: 1, employeeName: 'Admin' });
      load();
    } catch { toast.error('Nhập kho thất bại'); }
  };

  /** Xuất thiết bị khỏi kho - gọi API POST /warehouse/export */
  const onExport = async (data: WarehouseExportFormData) => {
    try {
      await api.post('/warehouse/export', data);
      toast.success('Xuất kho thành công');
      exportForm.reset({ equipmentID: undefined, equipmentName: '', quantity: undefined, unitPrice: undefined, reason: '', employeeID: 1, employeeName: 'Admin' });
      load();
    } catch { toast.error('Xuất kho thất bại'); }
  };

  /** Xóa giao dịch kho - gọi API DELETE /warehouse/transaction/{id} */
  const deleteTransaction = async (id: number) => {
    if (!confirm('Bạn có chắc muốn xóa lịch sử giao dịch này?')) return;
    try {
      await api.delete(`/warehouse/transaction/${id}`);
      toast.success('Đã xóa giao dịch thành công');
      load();
    } catch { toast.error('Thao tác thất bại'); }
  };

  /** Component dropdown chọn thiết bị dùng chung cho các form nhập/xuất/kiểm kê */
  const EqSelect = ({ onChange, selectedId }: { onChange: (id: number, name: string) => void; selectedId?: number }) => (
    <StyledSelect
      value={selectedId ? String(selectedId) : ''}
      onValueChange={(v) => {
        const eq = equipments.find((x) => x.equipmentID === +v);
        onChange(+v, eq?.equipmentName || '');
      }}
      options={equipments.map((e) => ({ value: String(e.equipmentID), label: e.equipmentName }))}
      placeholder="Chọn thiết bị"
    />
  );

  if (loading && equipments.length === 0) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-purple-400" /></div>;

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Kho thiết bị</h1>

      <Tabs defaultValue="storage" className="w-full">
        <TabsList className="bg-[#1a1d27] border-[#2a2e3d] p-1 h-auto gap-1">
          <TabsTrigger value="storage" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white gap-1.5 text-sm">
            <Boxes className="w-4 h-4" /> Tồn kho
          </TabsTrigger>
          {role === 'Manager' && (
            <>
              <TabsTrigger value="import" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white gap-1.5 text-sm">
                <ArrowDown className="w-4 h-4" /> Nhập kho
              </TabsTrigger>
              <TabsTrigger value="export" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white gap-1.5 text-sm">
                <ArrowUp className="w-4 h-4" /> Xuất kho
              </TabsTrigger>
            </>
          )}
          <TabsTrigger value="transactions" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white gap-1.5 text-sm">
            <History className="w-4 h-4" /> Lịch sử
          </TabsTrigger>
        </TabsList>

        {/* Storage Tab */}
        <TabsContent value="storage">
          <Card className="bg-[#1a1d27] border-[#2a2e3d]">
            <CardContent className="p-0">
              {loading ? (
                <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-purple-400" /></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-[#2a2e3d] hover:bg-transparent">
                      <TableHead className="text-gray-400">Thiết bị</TableHead>
                      <TableHead className="text-gray-400">Phân loại</TableHead>
                      <TableHead className="text-gray-400">Tồn kho</TableHead>
                      <TableHead className="text-gray-400">Tối thiểu</TableHead>
                      <TableHead className="text-gray-400">Tình trạng</TableHead>
                      <TableHead className="text-gray-400">Vị trí</TableHead>
                      <TableHead className="text-gray-400">Trạng thái</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {storages.map((s, i) => (
                      <TableRow key={i} className="border-[#2a2e3d]/50 hover:bg-[#22263a]">
                        <TableCell>{s.equipmentName}</TableCell>
                        <TableCell>{categoryLabels[s.category] || s.category}</TableCell>
                        <TableCell className={s.isLowStock ? 'text-red-400 font-bold' : ''}>{s.currentQuantity}</TableCell>
                        <TableCell>{s.minRequiredQuantity}</TableCell>
                        <TableCell>{s.conditionStatus}</TableCell>
                        <TableCell>{s.warehouseLocation}</TableCell>
                        <TableCell>
                          {s.isLowStock ? (
                            <Badge variant="outline" className="bg-red-500/12 text-red-400 border-red-500/20">⚠ Thấp</Badge>
                          ) : (
                            <Badge variant="outline" className="bg-teal-500/12 text-teal-400 border-teal-500/20">Bình thường</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Import Tab */}
        <TabsContent value="import">
          <Card className="bg-[#1a1d27] border-[#2a2e3d]">
            <CardHeader><CardTitle>Nhập kho thiết bị</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={importForm.handleSubmit(onImport)} className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2">
                  <Label className="text-gray-400">Thiết bị</Label>
                  <EqSelect selectedId={importForm.watch('equipmentID')} onChange={(id, name) => { importForm.setValue('equipmentID', id); importForm.setValue('equipmentName', name); }} />
                  {importForm.formState.errors.equipmentID && <p className="text-xs text-red-400">{importForm.formState.errors.equipmentID.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-gray-400">Số lượng</Label>
                  <Input type="number" className="bg-[#0f1117] border-[#2a2e3d]" {...importForm.register('quantity', { valueAsNumber: true })} />
                  {importForm.formState.errors.quantity && <p className="text-xs text-red-400">{importForm.formState.errors.quantity.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-gray-400">Đơn giá (VNĐ)</Label>
                  <Input type="number" className="bg-[#0f1117] border-[#2a2e3d]" {...importForm.register('unitPrice', { valueAsNumber: true })} />
                  {importForm.formState.errors.unitPrice && <p className="text-xs text-red-400">{importForm.formState.errors.unitPrice.message}</p>}
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-gray-400">Lý do</Label>
                  <Textarea className="bg-[#0f1117] border-[#2a2e3d]" rows={2} {...importForm.register('reason')} />
                </div>
                <div className="col-span-2 flex justify-end">
                  <Button type="submit" disabled={importForm.formState.isSubmitting} className="bg-gradient-to-r from-purple-600 to-purple-400">
                    {importForm.formState.isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null} Nhập kho
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Export Tab */}
        <TabsContent value="export">
          <Card className="bg-[#1a1d27] border-[#2a2e3d]">
            <CardHeader><CardTitle>Xuất kho thiết bị</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={exportForm.handleSubmit(onExport)} className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2">
                  <Label className="text-gray-400">Thiết bị</Label>
                  <EqSelect selectedId={exportForm.watch('equipmentID')} onChange={(id, name) => { exportForm.setValue('equipmentID', id); exportForm.setValue('equipmentName', name); }} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-gray-400">Số lượng</Label>
                  <Input type="number" className="bg-[#0f1117] border-[#2a2e3d]" {...exportForm.register('quantity', { valueAsNumber: true })} />
                  {exportForm.formState.errors.quantity && <p className="text-xs text-red-400">{exportForm.formState.errors.quantity.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-gray-400">Đơn giá (VNĐ)</Label>
                  <Input type="number" className="bg-[#0f1117] border-[#2a2e3d]" {...exportForm.register('unitPrice', { valueAsNumber: true })} />
                  {exportForm.formState.errors.unitPrice && <p className="text-xs text-red-400">{exportForm.formState.errors.unitPrice.message}</p>}
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-gray-400">Lý do xuất</Label>
                  <Textarea className="bg-[#0f1117] border-[#2a2e3d]" rows={2} {...exportForm.register('reason')} />
                  {exportForm.formState.errors.reason && <p className="text-xs text-red-400">{exportForm.formState.errors.reason.message}</p>}
                </div>
                <div className="col-span-2 flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={exportForm.formState.isSubmitting} 
                    className="bg-gradient-to-r from-amber-500 to-amber-400 text-black cursor-pointer font-medium"
                  >
                    {exportForm.formState.isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null} Xuất kho
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions">
          <Card className="bg-[#1a1d27] border-[#2a2e3d]">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle>Lịch sử giao dịch</CardTitle>
              <div className="w-48">
                <StyledSelect
                  value={filterType}
                  onValueChange={setFilterType}
                  options={[
                    { value: 'all', label: 'Tất cả loại' },
                    { value: 'Import', label: 'Nhập kho' },
                    { value: 'Export', label: 'Xuất kho' },
                  ]}
                  placeholder="Lọc theo loại"
                />
              </div>
            </CardHeader>
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
                      <TableHead className="text-gray-400">Số lượng</TableHead>
                      <TableHead className="text-gray-400">Lý do</TableHead>
                      <TableHead className="text-gray-400">Ngày</TableHead>
                      {role === 'Manager' && <TableHead className="text-gray-400">Thao tác</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.length === 0 ? (
                      <TableRow><TableCell colSpan={role === 'Manager' ? 7 : 6} className="text-center text-gray-500 py-12">Chưa có giao dịch</TableCell></TableRow>
                    ) : filteredTransactions.map((t) => (
                      <TableRow key={t.transactionID} className="border-[#2a2e3d]/50 hover:bg-[#22263a]">
                        <TableCell>{t.transactionID}</TableCell>
                        <TableCell>{t.equipmentName}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={txTypeStyles[t.transactionType]?.cls || ''}>
                            {txTypeStyles[t.transactionType]?.label || t.transactionType}
                          </Badge>
                        </TableCell>
                        <TableCell>{t.quantity}</TableCell>
                        <TableCell className="max-w-[150px] text-sm truncate">{t.reason}</TableCell>
                        <TableCell>{formatDate(t.transactionDate)}</TableCell>
                        {role === 'Manager' && (
                          <TableCell>
                            <Button variant="outline" size="icon" className="h-7 w-7 border-[#2a2e3d] text-red-400 hover:text-red-300 hover:bg-red-500/10 hover:border-red-500/30" title="Xóa giao dịch" onClick={() => deleteTransaction(t.transactionID)}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}
