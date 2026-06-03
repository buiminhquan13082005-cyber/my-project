import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/layouts/AppLayout';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import EquipmentPage from '@/pages/EquipmentPage';
import MaintenancePage from '@/pages/MaintenancePage';
import MoviesPage from '@/pages/MoviesPage';
import RoomsPage from '@/pages/RoomsPage';
import ShowtimesPage from '@/pages/ShowtimesPage';
import BookingsPage from '@/pages/BookingsPage';
import IncidentsPage from '@/pages/IncidentsPage';
import WarehousePage from '@/pages/WarehousePage';
import ReportsPage from '@/pages/ReportsPage';
import ProfilePage from '@/pages/ProfilePage';

/** HOC: Route yêu cầu đăng nhập, nếu chưa đăng nhập chuyển về /login */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

/** HOC: Route công khai (ví dụ login), nếu đã đăng nhập thì chuyển vào trong (/) */
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
}

/** Cấu hình Routing chính của ứng dụng web Manager */
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route index element={<DashboardPage />} />
            <Route path="equipment" element={<EquipmentPage />} />
            <Route path="maintenance" element={<MaintenancePage />} />
            <Route path="movies" element={<MoviesPage />} />
            <Route path="rooms" element={<RoomsPage />} />
            <Route path="showtimes" element={<ShowtimesPage />} />
            <Route path="bookings" element={<BookingsPage />} />
            <Route path="incidents" element={<IncidentsPage />} />
            <Route path="warehouse" element={<WarehousePage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
