import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  Film, LayoutDashboard, Cog, Wrench, Warehouse, AlertCircle,
  FileText, Menu, LogOut, Bell, User, DoorOpen, CalendarDays, Ticket,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import ChangePasswordDialog from '@/components/ChangePasswordDialog';

const navSections = [
  {
    label: 'Rạp chiếu',
    items: [
      { to: '/movies', icon: Film, label: 'Phim' },
      { to: '/rooms', icon: DoorOpen, label: 'Phòng chiếu' },
      { to: '/showtimes', icon: CalendarDays, label: 'Suất chiếu' },
      { to: '/bookings', icon: Ticket, label: 'Đặt vé' },
    ],
  },
  {
    label: 'Vận hành',
    items: [
      { to: '/equipment', icon: Cog, label: 'Thiết bị' },
      { to: '/maintenance', icon: Wrench, label: 'Bảo trì' },
      { to: '/warehouse', icon: Warehouse, label: 'Kho' },
      { to: '/incidents', icon: AlertCircle, label: 'Sự cố' },
      { to: '/reports', icon: FileText, label: 'Báo cáo' },
    ],
  },
];

/** 
 * Component Layout chính của ứng dụng web Manager.
 * Chứa Sidebar điều hướng và thanh Header (nếu có), cùng với phần Outlet để render các page con.
 */
export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const { logout, userName, role } = useAuth();
  const navigate = useNavigate();

  /** Xử lý đăng xuất và chuyển hướng về trang login */
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <TooltipProvider>
      <div className="flex min-h-screen bg-[#0f1117] text-[#e4e6f0]">
        {/* Sidebar */}
        <aside
          className={cn(
            'fixed top-0 left-0 bottom-0 z-50 flex flex-col border-r border-[#2a2e3d] bg-[#141720] transition-all duration-300',
            collapsed ? 'w-[68px]' : 'w-[250px]'
          )}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-5 border-b border-[#2a2e3d]">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-600 to-purple-400 flex items-center justify-center text-white flex-shrink-0">
              <Film className="w-4 h-4" />
            </div>
            {!collapsed && <span className="font-bold text-lg whitespace-nowrap">CineManager</span>}
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto text-gray-400 hover:text-white h-8 w-8"
              onClick={() => setCollapsed(!collapsed)}
            >
              <Menu className="w-4 h-4" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all',
                  isActive
                    ? 'bg-gradient-to-r from-purple-600/20 to-purple-600/5 text-purple-300 border border-purple-600/20'
                    : 'text-gray-400 hover:bg-[#1a1d27] hover:text-white'
                )
              }
            >
              <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>Tổng quan</span>}
            </NavLink>

            {navSections.map((section) => {
              // Lọc các item dựa trên role
              const filteredItems = section.items.filter(item => {
                if (role !== 'Manager' && item.label === 'Báo cáo') return false;
                return true;
              });

              if (filteredItems.length === 0) return null;

              return (
                <div key={section.label}>
                  {!collapsed && (
                    <div className="text-[0.65rem] uppercase tracking-widest text-gray-500 px-4 pt-4 pb-1 font-semibold">
                      {section.label}
                    </div>
                  )}
                  {filteredItems.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all',
                          isActive
                            ? 'bg-gradient-to-r from-purple-600/20 to-purple-600/5 text-purple-300 border border-purple-600/20'
                            : 'text-gray-400 hover:bg-[#1a1d27] hover:text-white'
                        )
                      }
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {!collapsed && <span>{item.label}</span>}
                    </NavLink>
                  ))}
                </div>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="px-4 py-4 border-t border-[#2a2e3d]">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2.5 px-4 py-2.5 w-full rounded-lg bg-red-500/8 text-red-400 font-medium text-sm transition-all hover:bg-red-500/15"
            >
              <LogOut className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <span>Đăng xuất</span>}
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className={cn('flex-1 min-h-screen transition-all duration-300', collapsed ? 'ml-[68px]' : 'ml-[250px]')}>
          {/* Top Bar */}
          <header className="sticky top-0 z-40 flex items-center justify-between px-8 py-4 border-b border-[#2a2e3d] bg-[#141720]/80 backdrop-blur-md">
            <div />
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-lg bg-[#1a1d27] text-gray-400 hover:text-white">
                <Bell className="w-4 h-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2.5 hover:opacity-80 transition-opacity focus:outline-hidden cursor-pointer bg-transparent border-0 text-left p-0">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-600 to-teal-500 flex items-center justify-center text-white text-sm flex-shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium text-white select-none">{userName || 'Tài khoản'}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-[#1a1d27] border-[#2a2e3d] text-white">
                  <DropdownMenuItem
                    onClick={() => navigate('/profile')}
                    className="cursor-pointer hover:bg-[#22263a] focus:bg-[#22263a] text-gray-300 hover:text-white px-3 py-2 flex items-center gap-2"
                  >
                    <User className="w-4 h-4 text-purple-400" />
                    <span>Thông tin cá nhân</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setChangePasswordOpen(true)}
                    className="cursor-pointer hover:bg-[#22263a] focus:bg-[#22263a] text-gray-300 hover:text-white px-3 py-2 flex items-center gap-2"
                  >
                    <Cog className="w-4 h-4 text-teal-400" />
                    <span>Đổi mật khẩu</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-[#2a2e3d]" />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer hover:bg-[#22263a] focus:bg-[#22263a] text-red-400 focus:text-red-400 px-3 py-2 flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Đăng xuất</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Page Content */}
          <div className="p-7">
            <Outlet />
          </div>
        </main>

        <ChangePasswordDialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen} />
        <Toaster richColors position="top-right" />
      </div>
    </TooltipProvider>
  );
}
