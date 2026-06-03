import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, Mail, Hash, ShieldAlert, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface UserProfile {
  id: number;
  fullName: string;
  email: string;
  role: string;
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/auth/me');
        if (res.data) {
          setProfile(res.data);
        } else {
          toast.error('Không thể tải thông tin cá nhân.');
        }
      } catch (err: any) {
        console.error('Failed to fetch profile:', err);
        // Nếu 401 thì axios interceptor đã tự xử lý redirect, ta xử lý lỗi kết nối khác ở đây
        toast.error('Lỗi khi tải thông tin cá nhân.');
        if (err.response?.status === 401) {
          logout();
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate, logout]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500 mb-4" />
        <p>Đang tải thông tin cá nhân...</p>
      </div>
    );
  }

  // Fallback values
  const name = profile?.fullName || 'Chưa cập nhật';
  const email = profile?.email || 'Chưa cập nhật';
  const idValue = profile?.id ? `NV-${String(profile.id).padStart(4, '0')}` : 'Chưa cập nhật';
  const roleLabel = profile?.role === 'Manager' ? 'Quản lý (Manager)' : (profile?.role === 'Staff' ? 'Nhân viên (Staff)' : profile?.role || 'Chưa cập nhật');

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 border-[#2a2e3d] text-gray-400 hover:text-white bg-[#141720]"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-2xl font-bold text-white">Thông tin cá nhân</h1>
      </div>

      {/* Profile Card */}
      <Card className="bg-[#1a1d27] border-[#2a2e3d] shadow-xl relative overflow-hidden">
        <CardContent className="pt-8 pb-10 px-6 flex flex-col items-center">
          
          {/* Avatar Area */}
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-purple-600 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-purple-600/10 mb-6 border border-white/10">
            <User className="w-10 h-10" />
          </div>

          <h2 className="text-xl font-bold text-white mb-1">{name}</h2>
          <p className="text-xs text-purple-400 font-semibold uppercase tracking-wider mb-8 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
            {profile?.role || 'Chức vụ'}
          </p>

          {/* Info Rows */}
          <div className="w-full space-y-4">
            
            {/* Row 1: Họ tên */}
            <div className="flex items-center gap-4 py-3 border-b border-[#2a2e3d]/50">
              <div className="w-10 h-10 rounded-lg bg-[#0f1117] flex items-center justify-center text-purple-400 border border-[#2a2e3d]/30">
                <User className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 font-medium">Họ và tên</p>
                <p className="text-sm font-semibold text-white truncate mt-0.5">{name}</p>
              </div>
            </div>

            {/* Row 2: Email */}
            <div className="flex items-center gap-4 py-3 border-b border-[#2a2e3d]/50">
              <div className="w-10 h-10 rounded-lg bg-[#0f1117] flex items-center justify-center text-teal-400 border border-[#2a2e3d]/30">
                <Mail className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 font-medium">Email liên hệ</p>
                <p className="text-sm font-semibold text-white truncate mt-0.5">{email}</p>
              </div>
            </div>

            {/* Row 3: Mã nhân viên / ID */}
            <div className="flex items-center gap-4 py-3 border-b border-[#2a2e3d]/50">
              <div className="w-10 h-10 rounded-lg bg-[#0f1117] flex items-center justify-center text-amber-400 border border-[#2a2e3d]/30">
                <Hash className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 font-medium">Mã nhân viên / ID tài khoản</p>
                <p className="text-sm font-semibold text-white truncate mt-0.5">{idValue}</p>
              </div>
            </div>

            {/* Row 4: Vai trò / Chức vụ */}
            <div className="flex items-center gap-4 py-3">
              <div className="w-10 h-10 rounded-lg bg-[#0f1117] flex items-center justify-center text-red-400 border border-[#2a2e3d]/30">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 font-medium">Chức vụ / Quyền hạn</p>
                <p className="text-sm font-semibold text-white truncate mt-0.5">{roleLabel}</p>
              </div>
            </div>

          </div>

        </CardContent>
      </Card>
    </div>
  );
}
