import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { changePasswordSchema, type ChangePasswordFormData } from '@/lib/schemas';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Eye, EyeOff, Lock, Loader2 } from 'lucide-react';

interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ChangePasswordDialog({ open, onOpenChange }: ChangePasswordDialogProps) {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: ChangePasswordFormData) => {
    try {
      // Gọi API đổi mật khẩu: PUT /auth/change-password (baseURL đã có /api)
      const res = await api.put('/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });

      if (res.data && res.data.status === 'success') {
        toast.success(res.data.message || 'Đổi mật khẩu thành công!');
        reset();
        onOpenChange(false);
      } else {
        toast.error(res.data?.message || 'Có lỗi xảy ra khi đổi mật khẩu.');
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.response?.data?.error || 'Đổi mật khẩu thất bại!';
      toast.error(errMsg);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      reset();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-[#1a1d27] border-[#2a2e3d] text-[#e4e6f0] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-white">
            <Lock className="w-5 h-5 text-teal-400" />
            Đổi mật khẩu
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          {/* Mật khẩu hiện tại */}
          <div className="space-y-1.5">
            <Label className="text-gray-400">Mật khẩu hiện tại</Label>
            <div className="relative">
              <Input
                type={showCurrent ? 'text' : 'password'}
                className="bg-[#0f1117] border-[#2a2e3d] text-white pr-10 focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20"
                placeholder="Nhập mật khẩu hiện tại..."
                {...register('currentPassword')}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                onClick={() => setShowCurrent(!showCurrent)}
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.currentPassword && (
              <p className="text-xs text-red-400">{errors.currentPassword.message}</p>
            )}
          </div>

          {/* Mật khẩu mới */}
          <div className="space-y-1.5">
            <Label className="text-gray-400">Mật khẩu mới</Label>
            <div className="relative">
              <Input
                type={showNew ? 'text' : 'password'}
                className="bg-[#0f1117] border-[#2a2e3d] text-white pr-10 focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20"
                placeholder="Nhập mật khẩu mới..."
                {...register('newPassword')}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                onClick={() => setShowNew(!showNew)}
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.newPassword && (
              <p className="text-xs text-red-400">{errors.newPassword.message}</p>
            )}
          </div>

          {/* Xác nhận mật khẩu mới */}
          <div className="space-y-1.5">
            <Label className="text-gray-400">Xác nhận mật khẩu mới</Label>
            <div className="relative">
              <Input
                type={showConfirm ? 'text' : 'password'}
                className="bg-[#0f1117] border-[#2a2e3d] text-white pr-10 focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20"
                placeholder="Xác nhận mật khẩu mới..."
                {...register('confirmPassword')}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                onClick={() => setShowConfirm(!showConfirm)}
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-red-400">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="border-[#2a2e3d] text-gray-400 hover:bg-[#22263a] hover:text-white"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-teal-600 to-teal-400 hover:shadow-lg hover:shadow-teal-600/20 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                  Đang xử lý...
                </>
              ) : (
                'Cập nhật mật khẩu'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
