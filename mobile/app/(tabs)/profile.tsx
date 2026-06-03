import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, RefreshControl, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../../contexts/AuthContext';
import { api, getUserName } from '../../services/api';
import { changePasswordSchema, type ChangePasswordFormData } from '../../lib/schemas';
import { FormInput, GradientButton } from '../../components/FormComponents';

type SubPage = 'main' | 'personal' | 'history' | 'notifications' | 'settings';
type AlertItem = { message: string; type: string; severity: string };
type Task = { requestID: number; equipmentName: string; description: string; status: string; requestType: string; createdAt: string; completedAt?: string };

/**
 * Màn hình Cá nhân - Hiển thị thông tin và cài đặt của nhân viên.
 * Bao gồm 4 trang con: Thông tin cá nhân, Lịch sử công việc, Thông báo, Cài đặt.
 * Sử dụng state-based navigation (không dùng router) để chuyển giữa các trang.
 */
export default function ProfileScreen() {
  const { userName, logout } = useAuth();
  const [page, setPage] = useState<SubPage>('main');
  const [stats, setStats] = useState({ maintenance: 0, incidents: 0 });
  // Personal info
  const [profile, setProfile] = useState<{ id: number; email: string; fullName: string } | null>(null);
  // Work history
  const [history, setHistory] = useState<Task[]>([]);
  // Notifications
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const { control, handleSubmit, formState: { isSubmitting }, reset } = useForm<any>({
    // @ts-ignore
    resolver: zodResolver(changePasswordSchema) as any,
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' }
  });

  /** Tải thống kê: số bảo trì hoàn thành, số sự cố */
  const loadStats = useCallback(async () => {
    const [mt, inc] = await Promise.all([
      api<any[]>('/maintenance'), api<any[]>('/incident'),
    ]);
    setStats({
      maintenance: mt?.filter((m: any) => m.status === 'Completed').length || 0,
      incidents: inc?.length || 0,
    });
  }, []);

  useFocusEffect(useCallback(() => { loadStats(); }, [loadStats]));

  /** Mở trang Thông tin cá nhân - gọi API GET /auth/me */
  const openPersonal = async () => {
    const p = await api<{ id: number; email: string; fullName: string }>('/auth/me');
    if (p) setProfile(p);
    setPage('personal');
  };

  /** Mở trang Lịch sử công việc - lấy danh sách task đã hoàn thành */
  const openHistory = async () => {
    const d = await api<Task[]>('/maintenance');
    if (d) setHistory(d.filter(t => t.status === 'Completed'));
    setPage('history');
  };

  /** Mở trang Thông báo - lấy danh sách cảnh báo thiết bị */
  const openNotifications = async () => {
    const a = await api<AlertItem[]>('/equipment/alerts');
    if (a) setAlerts(a);
    setPage('notifications');
  };

  /** Mở trang Cài đặt - reset form đổi mật khẩu */
  const openSettings = () => {
    reset({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setPage('settings');
  };

  /** Hiển thị thông báo - dùng window.alert trên web, Alert.alert trên mobile */
  const showAlert = (title: string, msg: string) => {
    if (Platform.OS === 'web') { window.alert(msg); }
    else { Alert.alert(title, msg); }
  };

  /** Gửi form đổi mật khẩu - gọi API PUT /auth/change-password */
  const handleChangePassword = async (data: any) => {
    const r = await api<any>('/auth/change-password', 'PUT', { currentPassword: data.currentPassword, newPassword: data.newPassword });
    if (r?.status === 'success') {
      showAlert('Thành công', 'Đổi mật khẩu thành công!');
      reset({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } else {
      showAlert('Lỗi', r?.message || 'Đổi mật khẩu thất bại');
    }
  };

  /** Xử lý đăng xuất - hiển confirm rồi gọi logout từ AuthContext */
  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Bạn có chắc muốn đăng xuất?')) { logout(); }
    } else {
      Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất?', [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Đăng xuất', style: 'destructive', onPress: logout },
      ]);
    }
  };

  const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('vi-VN') : '-';

  /** Component nút quay lại trang chính */
  const BackHeader = ({ title }: { title: string }) => (
    <TouchableOpacity style={s.backRow} onPress={() => setPage('main')}>
      <Ionicons name="arrow-back" size={22} color="#a29bfe" />
      <Text style={s.backText}>{title}</Text>
    </TouchableOpacity>
  );

  // === SUB-PAGE: Personal Info ===
  if (page === 'personal') {
    return (
      <ScrollView style={s.container}>
        <BackHeader title="Thông tin cá nhân" />
        <View style={s.card}>
          <LinearGradient colors={['#6c5ce7', '#00cec9']} style={s.avatarLg}>
            <Ionicons name="person" size={44} color="#fff" />
          </LinearGradient>
          {profile && (
            <View style={s.infoList}>
              <View style={s.infoItem}>
                <View style={[s.infoIcon, { backgroundColor: 'rgba(108,92,231,0.12)' }]}>
                  <Ionicons name="person-outline" size={18} color="#a29bfe" />
                </View>
                <View style={s.infoContent}>
                  <Text style={s.infoLabel}>Họ tên</Text>
                  <Text style={s.infoValue}>{profile.fullName}</Text>
                </View>
              </View>
              <View style={s.infoItem}>
                <View style={[s.infoIcon, { backgroundColor: 'rgba(0,206,201,0.12)' }]}>
                  <Ionicons name="mail-outline" size={18} color="#00cec9" />
                </View>
                <View style={s.infoContent}>
                  <Text style={s.infoLabel}>Email</Text>
                  <Text style={s.infoValue}>{profile.email}</Text>
                </View>
              </View>
              <View style={s.infoItem}>
                <View style={[s.infoIcon, { backgroundColor: 'rgba(253,203,110,0.12)' }]}>
                  <Ionicons name="id-card-outline" size={18} color="#fdcb6e" />
                </View>
                <View style={s.infoContent}>
                  <Text style={s.infoLabel}>Mã nhân viên</Text>
                  <Text style={s.infoValue}>#{profile.id}</Text>
                </View>
              </View>
              <View style={s.infoItem}>
                <View style={[s.infoIcon, { backgroundColor: 'rgba(116,185,255,0.12)' }]}>
                  <Ionicons name="briefcase-outline" size={18} color="#74b9ff" />
                </View>
                <View style={s.infoContent}>
                  <Text style={s.infoLabel}>Chức vụ</Text>
                  <Text style={s.infoValue}>Nhân viên rạp chiếu phim</Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    );
  }

  // === SUB-PAGE: Work History ===
  if (page === 'history') {
    return (
      <ScrollView style={s.container}>
        <BackHeader title="Lịch sử công việc" />
        {history.length === 0 ? (
          <View style={s.empty}>
            <Ionicons name="document-text-outline" size={48} color="#8b8fa3" />
            <Text style={s.emptyText}>Chưa có công việc hoàn thành</Text>
          </View>
        ) : (
          history.map(t => (
            <View key={t.requestID} style={s.histItem}>
              <View style={[s.histIcon, { backgroundColor: t.requestType === 'Emergency' ? 'rgba(255,107,107,0.12)' : 'rgba(0,206,201,0.12)' }]}>
                <Ionicons name={t.requestType === 'Emergency' ? 'flash' : 'construct'} size={20} color={t.requestType === 'Emergency' ? '#ff6b6b' : '#00cec9'} />
              </View>
              <View style={s.histInfo}>
                <Text style={s.histTitle}>{t.equipmentName}</Text>
                <Text style={s.histDesc} numberOfLines={2}>{t.description}</Text>
                <View style={s.histMeta}>
                  <View style={s.histBadge}>
                    <Ionicons name="checkmark-circle" size={12} color="#00cec9" />
                    <Text style={s.histBadgeText}>Hoàn thành</Text>
                  </View>
                  <Text style={s.histDate}>{fmtDate(t.createdAt)}</Text>
                </View>
              </View>
            </View>
          ))
        )}
        <View style={{ height: 24 }} />
      </ScrollView>
    );
  }

  // === SUB-PAGE: Notifications ===
  if (page === 'notifications') {
    return (
      <ScrollView style={s.container}>
        <BackHeader title="Thông báo" />
        {alerts.length === 0 ? (
          <View style={s.empty}>
            <Ionicons name="notifications-off-outline" size={48} color="#8b8fa3" />
            <Text style={s.emptyText}>Không có thông báo mới</Text>
          </View>
        ) : (
          alerts.map((a, i) => {
            const isCritical = a.severity === 'Critical';
            return (
              <View key={i} style={[s.notiItem, isCritical && s.notiCritical]}>
                <View style={[s.notiIcon, { backgroundColor: isCritical ? 'rgba(255,107,107,0.12)' : a.type === 'LowStock' ? 'rgba(253,203,110,0.12)' : 'rgba(116,185,255,0.12)' }]}>
                  <Ionicons
                    name={a.type === 'LowStock' ? 'cube-outline' : a.type === 'MaintenanceDue' ? 'build-outline' : 'time-outline'}
                    size={20} color={isCritical ? '#ff6b6b' : a.type === 'LowStock' ? '#fdcb6e' : '#74b9ff'} />
                </View>
                <View style={s.notiContent}>
                  <Text style={s.notiMsg}>{a.message}</Text>
                  <View style={s.notiMetaRow}>
                    <View style={[s.notiSeverity, { backgroundColor: isCritical ? 'rgba(255,107,107,0.15)' : 'rgba(253,203,110,0.15)' }]}>
                      <Text style={[s.notiSeverityText, { color: isCritical ? '#ff6b6b' : '#fdcb6e' }]}>
                        {isCritical ? 'Khẩn cấp' : a.severity === 'Warning' ? 'Cảnh báo' : 'Thông tin'}
                      </Text>
                    </View>
                    <Text style={s.notiType}>{a.type === 'LowStock' ? 'Tồn kho thấp' : a.type === 'MaintenanceDue' ? 'Cần bảo trì' : a.type}</Text>
                  </View>
                </View>
              </View>
            );
          })
        )}
        <View style={{ height: 24 }} />
      </ScrollView>
    );
  }

  // === SUB-PAGE: Settings ===
  if (page === 'settings') {
    return (
      <ScrollView style={s.container}>
        <BackHeader title="Cài đặt" />
        {/* Change password */}
        <View style={s.card}>
          <View style={s.settingHeader}>
            <Ionicons name="lock-closed-outline" size={20} color="#a29bfe" />
            <Text style={s.settingTitle}>Đổi mật khẩu</Text>
          </View>
          
          <FormInput
            control={control}
            name="currentPassword"
            label="Mật khẩu hiện tại"
            placeholder="Nhập mật khẩu hiện tại"
            secureTextEntry
          />
          
          <FormInput
            control={control}
            name="newPassword"
            label="Mật khẩu mới"
            placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
            secureTextEntry
          />
          
          <FormInput
            control={control}
            name="confirmPassword"
            label="Xác nhận mật khẩu mới"
            placeholder="Nhập lại mật khẩu mới"
            secureTextEntry
          />
          
          <GradientButton
            onPress={handleSubmit(handleChangePassword)}
            label="Đổi mật khẩu"
            loading={isSubmitting}
            icon="shield-checkmark-outline"
          />
        </View>

        {/* App info */}
        <View style={s.card}>
          <View style={s.settingHeader}>
            <Ionicons name="information-circle-outline" size={20} color="#00cec9" />
            <Text style={s.settingTitle}>Thông tin ứng dụng</Text>
          </View>
          <View style={s.aboutRow}><Text style={s.aboutLabel}>Ứng dụng</Text><Text style={s.aboutVal}>CineStaff</Text></View>
          <View style={s.aboutRow}><Text style={s.aboutLabel}>Phiên bản</Text><Text style={s.aboutVal}>1.0.0</Text></View>
          <View style={s.aboutRow}><Text style={s.aboutLabel}>Nền tảng</Text><Text style={s.aboutVal}>React Native / Expo</Text></View>
        </View>
        <View style={{ height: 24 }} />
      </ScrollView>
    );
  }

  // === MAIN PROFILE PAGE ===
  return (
    <ScrollView style={s.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await loadStats(); setRefreshing(false); }} tintColor="#a29bfe" />}>
      <View style={s.profileCard}>
        <LinearGradient colors={['#6c5ce7', '#00cec9']} style={s.avatar}>
          <Ionicons name="person" size={36} color="#fff" />
        </LinearGradient>
        <Text style={s.name}>{userName || 'Nhân viên'}</Text>
        <Text style={s.role}>Nhân viên rạp chiếu phim</Text>
      </View>

      <View style={s.statsRow}>
        <View style={s.statItem}>
          <Text style={[s.statVal, { color: '#00cec9' }]}>{stats.maintenance}</Text>
          <Text style={s.statLabel}>Đã bảo trì</Text>
        </View>
        <View style={[s.statItem, { borderLeftWidth: 1, borderColor: '#2a2e3d' }]}>
          <Text style={[s.statVal, { color: '#ff6b6b' }]}>{stats.incidents}</Text>
          <Text style={s.statLabel}>Sự cố</Text>
        </View>
      </View>

      <View style={s.menuCard}>
        <TouchableOpacity style={s.menuItem} onPress={openPersonal}>
          <View style={[s.menuIcon, { backgroundColor: 'rgba(108,92,231,0.12)' }]}>
            <Ionicons name="person-outline" size={20} color="#a29bfe" />
          </View>
          <Text style={s.menuText}>Thông tin cá nhân</Text>
          <Ionicons name="chevron-forward" size={18} color="#8b8fa3" />
        </TouchableOpacity>

        <TouchableOpacity style={s.menuItem} onPress={openHistory}>
          <View style={[s.menuIcon, { backgroundColor: 'rgba(0,206,201,0.12)' }]}>
            <Ionicons name="time-outline" size={20} color="#00cec9" />
          </View>
          <Text style={s.menuText}>Lịch sử công việc</Text>
          <Ionicons name="chevron-forward" size={18} color="#8b8fa3" />
        </TouchableOpacity>

        <TouchableOpacity style={s.menuItem} onPress={openNotifications}>
          <View style={[s.menuIcon, { backgroundColor: 'rgba(116,185,255,0.12)' }]}>
            <Ionicons name="notifications-outline" size={20} color="#74b9ff" />
          </View>
          <Text style={s.menuText}>Thông báo</Text>
          <Ionicons name="chevron-forward" size={18} color="#8b8fa3" />
        </TouchableOpacity>

        <TouchableOpacity style={s.menuItem} onPress={openSettings}>
          <View style={[s.menuIcon, { backgroundColor: 'rgba(253,203,110,0.12)' }]}>
            <Ionicons name="settings-outline" size={20} color="#fdcb6e" />
          </View>
          <Text style={s.menuText}>Cài đặt</Text>
          <Ionicons name="chevron-forward" size={18} color="#8b8fa3" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#ff6b6b" />
        <Text style={s.logoutText}>Đăng xuất</Text>
      </TouchableOpacity>

      <Text style={s.version}>CineStaff v1.0.0</Text>
      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1117', padding: 16 },
  // Main profile
  profileCard: { alignItems: 'center', paddingVertical: 28, backgroundColor: '#1a1d27', borderRadius: 20, borderWidth: 1, borderColor: '#2a2e3d', marginBottom: 16 },
  avatar: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 14, shadowColor: '#6c5ce7', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  name: { fontSize: 22, fontWeight: '800', color: '#e4e6f0' },
  role: { fontSize: 14, color: '#8b8fa3', marginTop: 4 },
  statsRow: { flexDirection: 'row', backgroundColor: '#1a1d27', borderRadius: 16, borderWidth: 1, borderColor: '#2a2e3d', marginBottom: 16 },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: 18 },
  statBorder: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#2a2e3d' },
  statVal: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 11, color: '#8b8fa3', marginTop: 4 },
  menuCard: { backgroundColor: '#1a1d27', borderRadius: 16, borderWidth: 1, borderColor: '#2a2e3d', overflow: 'hidden', marginBottom: 16 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderBottomWidth: 1, borderBottomColor: '#2a2e3d' },
  menuIcon: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  menuText: { flex: 1, fontSize: 15, color: '#e4e6f0', fontWeight: '500' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, backgroundColor: 'rgba(255,107,107,0.08)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,107,107,0.2)' },
  logoutText: { color: '#ff6b6b', fontSize: 16, fontWeight: '700' },
  version: { textAlign: 'center', color: '#8b8fa3', fontSize: 12, marginTop: 20 },
  // Back header
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  backText: { fontSize: 18, fontWeight: '700', color: '#a29bfe' },
  // Card
  card: { backgroundColor: '#1a1d27', borderRadius: 16, borderWidth: 1, borderColor: '#2a2e3d', padding: 20, marginBottom: 16 },
  // Personal info
  avatarLg: { width: 90, height: 90, borderRadius: 45, justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 24 },
  infoList: { gap: 2 },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#2a2e3d' },
  infoIcon: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 12, color: '#8b8fa3', marginBottom: 2 },
  infoValue: { fontSize: 16, color: '#e4e6f0', fontWeight: '600' },
  // History
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyText: { color: '#8b8fa3', marginTop: 12, fontSize: 15 },
  histItem: { flexDirection: 'row', gap: 12, backgroundColor: '#1a1d27', borderRadius: 14, borderWidth: 1, borderColor: '#2a2e3d', padding: 14, marginBottom: 8 },
  histIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  histInfo: { flex: 1 },
  histTitle: { fontSize: 15, fontWeight: '700', color: '#e4e6f0', marginBottom: 3 },
  histDesc: { fontSize: 13, color: '#8b8fa3', lineHeight: 18, marginBottom: 8 },
  histMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  histBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,206,201,0.12)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  histBadgeText: { fontSize: 11, color: '#00cec9', fontWeight: '600' },
  histDate: { fontSize: 11, color: '#8b8fa3' },
  // Notifications
  notiItem: { flexDirection: 'row', gap: 12, backgroundColor: '#1a1d27', borderRadius: 14, borderWidth: 1, borderColor: '#2a2e3d', padding: 14, marginBottom: 8 },
  notiCritical: { borderColor: 'rgba(255,107,107,0.3)' },
  notiIcon: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  notiContent: { flex: 1 },
  notiMsg: { fontSize: 14, color: '#e4e6f0', lineHeight: 20, marginBottom: 8 },
  notiMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  notiSeverity: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  notiSeverityText: { fontSize: 11, fontWeight: '600' },
  notiType: { fontSize: 11, color: '#8b8fa3' },
  // Settings
  settingHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  settingTitle: { fontSize: 18, fontWeight: '700', color: '#e4e6f0' },
  aboutRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#2a2e3d' },
  aboutLabel: { fontSize: 14, color: '#8b8fa3' },
  aboutVal: { fontSize: 14, color: '#e4e6f0', fontWeight: '600' },
});
