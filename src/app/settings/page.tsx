'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { mockUserSettingsData, UserSettingsData } from '@/data/mock-settings';
import { useTheme } from '@/contexts/theme-context';
import { useAuth } from '@/hooks/use-auth';
import { toast } from '@/lib/toast';
import { useSoundSetting } from '@/lib/sound';

type SettingsTab = 'tai-khoan' | 'thong-bao' | 'bao-mat' | 'quyen-rieng-tu' | 'giao-dien';

export default function SettingsPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [localData, setLocalData] = useState<UserSettingsData>(mockUserSettingsData);
  const [activeTab, setActiveTab] = useState<SettingsTab>('tai-khoan');
  const { soundEnabled, setSound } = useSoundSetting();

  // Derive active settings data from authenticated user or local data state
  const data: UserSettingsData = useMemo(() => {
    if (!user) return localData;
    return {
      ...localData,
      account: {
        ...localData.account,
        id: user.id || localData.account.id,
        name: user.username || localData.account.name,
        email: user.email || localData.account.email,
        phone: user.phone || localData.account.phone,
        avatarUrl: user.avatar || localData.account.avatarUrl,
      },
    };
  }, [user, localData]);

  // Interactive UI form states
  const [phone, setPhone] = useState(data.account.phone);
  const [language, setLanguage] = useState(data.account.language);
  const [timezone, setTimezone] = useState(data.account.timezone);

  // Password fields
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  // Experience toggles
  const [studyReminder, setStudyReminder] = useState(data.preferences.studyReminder);
  const [instructorMessages, setInstructorMessages] = useState(data.preferences.instructorMessages);
  const [leaderboardAlerts, setLeaderboardAlerts] = useState(data.preferences.leaderboardAlerts);
  const [publicProfile, setPublicProfile] = useState(data.preferences.publicProfile);
  const [showOnLeaderboard, setShowOnLeaderboard] = useState(data.preferences.showOnLeaderboard);

  // Devices list
  const [devices, setDevices] = useState(data.security.connectedDevices);

  // Modals
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const showToast = (msg: string) => {
    toast.success(msg);
  };

  // Password strength checks
  const isLengthValid = newPwd.length >= 8;
  const isCaseValid = /[0-9]/.test(newPwd) && /[A-Z]/.test(newPwd);
  const isSpecialValid = /[@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPwd);

  const handleRevokeDevice = (id: string) => {
    setDevices((prev) => prev.filter((d) => d.id !== id));
    toast.success('Đã thu hồi phiên làm việc của thiết bị thành công!');
  };

  const handleLogoutAllOtherDevices = () => {
    setDevices((prev) => prev.filter((d) => d.isCurrent));
    toast.success('Đã đăng xuất khỏi tất cả các thiết bị khác.');
  };

  const handleSaveAccount = () => {
    setLocalData((prev) => ({
      ...prev,
      account: {
        ...prev.account,
        phone,
        language,
        timezone,
      },
    }));
    toast.success('Thông tin tài khoản đã được cập nhật thành công.');
  };

  const handleUpdatePassword = () => {
    if (!newPwd) {
      toast.error('Vui lòng nhập mật khẩu mới.');
      return;
    }
    if (newPwd !== confirmPwd) {
      toast.error('Xác nhận mật khẩu mới chưa khớp!');
      return;
    }
    setNewPwd('');
    setConfirmPwd('');
    toast.success('Mật khẩu của bạn đã được cập nhật an toàn!');
  };

  const handleConfirmLogout = async () => {
    setIsLogoutModalOpen(false);
    try {
      await logout();
      toast.success('Đã đăng xuất an toàn... Hẹn gặp lại bạn!');
      router.push('/login');
    } catch {
      toast.error('Có lỗi xảy ra khi đăng xuất.');
    }
  };

  return (
    <AppShell>

      {/* Main Settings Container */}
      <div className="w-full max-w-[1280px] mx-auto px-4 md:px-8 py-6 flex flex-col gap-6">
        {/* Page Header & Visual Accents */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#eddcff]/40 via-[#f7f1ff] to-white dark:from-[#2a2238] dark:via-[#1e1929] dark:to-[#16131e] p-6 shadow-2xs border border-[#f1ebff] dark:border-[#2f2742]">
          <div className="absolute -right-12 -top-12 w-64 h-64 rounded-full bg-[#7240b8]/10 blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-[11px] text-[#7240b8] dark:text-[#a87ffb] uppercase tracking-wider font-bold">
                <span className="material-symbols-outlined text-[16px]">manage_accounts</span>
                <span>Trung tâm cấu hình &amp; quản trị</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#1c192c] dark:text-[#f4eeff] tracking-tight">
                Cài đặt
              </h1>
              <p className="text-xs md:text-sm text-[#635a72] dark:text-[#b4a9c7] max-w-2xl">
                Quản lý thông tin tài khoản, cấu hình bảo mật, thông báo và quyền riêng tư
              </p>
            </div>

            {/* Account Quick Meta Pill */}
            <div className="flex items-center gap-3 bg-white dark:bg-[#1d1926] px-4 py-2.5 rounded-xl shadow-2xs border border-[#f1ebff] dark:border-[#2f2742] self-start md:self-auto">
              <div className="w-10 h-10 rounded-full bg-[#eddcff] dark:bg-[#282136] flex items-center justify-center text-[#7240b8] dark:text-[#a87ffb] font-bold text-sm">
                MT
              </div>
              <div className="flex flex-col">
                <span className="text-[13px] font-semibold text-[#1c192c] dark:text-[#f4eeff]">
                  {data.account.name}
                </span>
                <span className="text-[11px] text-[#006947] dark:text-[#4edea3] flex items-center gap-1 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-[#006947] dark:bg-[#4edea3] inline-block" />
                  ID: {data.account.id}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Horizontal Tabs */}
        <div className="w-full overflow-x-auto no-scrollbar bg-white dark:bg-[#1d1926] rounded-xl p-1.5 shadow-2xs border border-[#f1ebff] dark:border-[#2f2742] flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab('tai-khoan')}
            className={`px-4 py-2 rounded-lg text-[13px] font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'tai-khoan'
                ? 'bg-[#7240b8] text-white shadow-xs'
                : 'text-[#4b4452] dark:text-[#b4a9c7] hover:text-[#1c192c] dark:hover:text-[#f4eeff] hover:bg-[#f7f1ff] dark:hover:bg-[#282136]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">person</span>
            <span>Tài khoản</span>
          </button>
          <button
            onClick={() => setActiveTab('thong-bao')}
            className={`px-4 py-2 rounded-lg text-[13px] font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'thong-bao'
                ? 'bg-[#7240b8] text-white shadow-xs'
                : 'text-[#4b4452] dark:text-[#b4a9c7] hover:text-[#1c192c] dark:hover:text-[#f4eeff] hover:bg-[#f7f1ff] dark:hover:bg-[#282136]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">notifications_active</span>
            <span>Thông báo</span>
          </button>
          <button
            onClick={() => setActiveTab('bao-mat')}
            className={`px-4 py-2 rounded-lg text-[13px] font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'bao-mat'
                ? 'bg-[#7240b8] text-white shadow-xs'
                : 'text-[#4b4452] dark:text-[#b4a9c7] hover:text-[#1c192c] dark:hover:text-[#f4eeff] hover:bg-[#f7f1ff] dark:hover:bg-[#282136]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">security</span>
            <span>Bảo mật &amp; Mật khẩu</span>
          </button>
          <button
            onClick={() => setActiveTab('quyen-rieng-tu')}
            className={`px-4 py-2 rounded-lg text-[13px] font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'quyen-rieng-tu'
                ? 'bg-[#7240b8] text-white shadow-xs'
                : 'text-[#4b4452] dark:text-[#b4a9c7] hover:text-[#1c192c] dark:hover:text-[#f4eeff] hover:bg-[#f7f1ff] dark:hover:bg-[#282136]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">visibility</span>
            <span>Quyền riêng tư</span>
          </button>
          <button
            onClick={() => setActiveTab('giao-dien')}
            className={`px-4 py-2 rounded-lg text-[13px] font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'giao-dien'
                ? 'bg-[#7240b8] text-white shadow-xs'
                : 'text-[#4b4452] dark:text-[#b4a9c7] hover:text-[#1c192c] dark:hover:text-[#f4eeff] hover:bg-[#f7f1ff] dark:hover:bg-[#282136]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">palette</span>
            <span>Giao diện</span>
          </button>
        </div>

        {/* Main Content Area: Bento Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (Span 8) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* Section: GIAO DIỆN (Dedicated Appearance Tab) */}
            {activeTab === 'giao-dien' && (
              <section className="bg-white dark:bg-[#1d1926] rounded-2xl p-6 shadow-2xs border border-[#f1ebff] dark:border-[#2f2742] flex flex-col gap-6">
                <div className="flex items-center justify-between pb-3 border-b border-[#f7f1ff] dark:border-[#282136]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#eddcff]/60 dark:bg-[#282136] text-[#7240b8] dark:text-[#a87ffb] flex items-center justify-center">
                      <span className="material-symbols-outlined text-[20px]">palette</span>
                    </div>
                    <div className="flex flex-col">
                      <h2 className="text-lg font-bold text-[#1c192c] dark:text-[#f4eeff]">Giao diện &amp; Chủ đề</h2>
                      <p className="text-xs text-[#635a72] dark:text-[#b4a9c7]">
                        Tùy biến hiển thị sáng/tối phù hợp với môi trường học tập của bạn
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-[#eddcff] dark:bg-[#282136] text-[11px] font-bold text-[#7240b8] dark:text-[#a87ffb] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#7240b8] dark:bg-[#a87ffb] inline-block" />
                    Đang dùng: {resolvedTheme === 'dark' ? 'Chế độ Tối' : 'Chế độ Sáng'}
                  </span>
                </div>

                {/* Radio cards for Light, Dark, System */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Light Option */}
                  <button
                    type="button"
                    onClick={() => {
                      setTheme('light');
                      showToast('Đã chuyển giao diện sang Chế độ Sáng.');
                    }}
                    className={`group relative text-left p-4 rounded-xl border-2 transition-all flex flex-col gap-3 cursor-pointer ${
                      theme === 'light'
                        ? 'border-[#7240b8] bg-[#f7f1ff] dark:bg-[#282136]/50 shadow-sm'
                        : 'border-[#f1ebff] dark:border-[#2f2742] bg-white dark:bg-[#16131e] hover:border-[#eddcff] dark:hover:border-[#3d3353]'
                    }`}
                  >
                    <div className="w-full h-24 rounded-lg bg-gradient-to-br from-white to-[#f7f1ff] border border-[#f1ebff] p-3 flex flex-col justify-between shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="w-3 h-3 rounded-full bg-[#7240b8]" />
                        <div className="w-12 h-2 rounded bg-[#ebe5ff]" />
                      </div>
                      <div className="space-y-1.5">
                        <div className="w-3/4 h-2 rounded bg-[#d6ccf2]" />
                        <div className="w-1/2 h-1.5 rounded bg-[#ebe5ff]" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[20px] text-[#7240b8] dark:text-[#a87ffb]">
                          light_mode
                        </span>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-[#1c192c] dark:text-[#f4eeff]">Chế độ Sáng</span>
                          <span className="text-[11px] text-[#635a72] dark:text-[#b4a9c7]">Nền trắng dịu mắt</span>
                        </div>
                      </div>
                      {theme === 'light' && (
                        <span className="material-symbols-outlined text-[#7240b8] dark:text-[#a87ffb] text-[20px]">
                          check_circle
                        </span>
                      )}
                    </div>
                  </button>

                  {/* Dark Option */}
                  <button
                    type="button"
                    onClick={() => {
                      setTheme('dark');
                      showToast('Đã chuyển giao diện sang Chế độ Tối.');
                    }}
                    className={`group relative text-left p-4 rounded-xl border-2 transition-all flex flex-col gap-3 cursor-pointer ${
                      theme === 'dark'
                        ? 'border-[#7240b8] dark:border-[#a87ffb] bg-[#f7f1ff] dark:bg-[#282136]/50 shadow-sm'
                        : 'border-[#f1ebff] dark:border-[#2f2742] bg-white dark:bg-[#16131e] hover:border-[#eddcff] dark:hover:border-[#3d3353]'
                    }`}
                  >
                    <div className="w-full h-24 rounded-lg bg-gradient-to-br from-[#16131e] to-[#1d1926] border border-[#2f2742] p-3 flex flex-col justify-between shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="w-3 h-3 rounded-full bg-[#a87ffb]" />
                        <div className="w-12 h-2 rounded bg-[#282136]" />
                      </div>
                      <div className="space-y-1.5">
                        <div className="w-3/4 h-2 rounded bg-[#3d3353]" />
                        <div className="w-1/2 h-1.5 rounded bg-[#282136]" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[20px] text-[#7240b8] dark:text-[#a87ffb]">
                          dark_mode
                        </span>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-[#1c192c] dark:text-[#f4eeff]">Chế độ Tối</span>
                          <span className="text-[11px] text-[#635a72] dark:text-[#b4a9c7]">Tương phản cao</span>
                        </div>
                      </div>
                      {theme === 'dark' && (
                        <span className="material-symbols-outlined text-[#7240b8] dark:text-[#a87ffb] text-[20px]">
                          check_circle
                        </span>
                      )}
                    </div>
                  </button>

                  {/* System Option */}
                  <button
                    type="button"
                    onClick={() => {
                      setTheme('system');
                      showToast('Đã chọn theme theo thiết bị hệ thống.');
                    }}
                    className={`group relative text-left p-4 rounded-xl border-2 transition-all flex flex-col gap-3 cursor-pointer ${
                      theme === 'system'
                        ? 'border-[#7240b8] dark:border-[#a87ffb] bg-[#f7f1ff] dark:bg-[#282136]/50 shadow-sm'
                        : 'border-[#f1ebff] dark:border-[#2f2742] bg-white dark:bg-[#16131e] hover:border-[#eddcff] dark:hover:border-[#3d3353]'
                    }`}
                  >
                    <div className="w-full h-24 rounded-lg bg-gradient-to-r from-white via-[#e8e4f5] to-[#1d1926] border border-[#f1ebff] dark:border-[#2f2742] p-3 flex flex-col justify-between shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="w-3 h-3 rounded-full bg-[#7240b8]" />
                        <div className="w-12 h-2 rounded bg-[#7240b8]/30" />
                      </div>
                      <div className="space-y-1.5">
                        <div className="w-3/4 h-2 rounded bg-gray-400/50" />
                        <div className="w-1/2 h-1.5 rounded bg-gray-400/30" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[20px] text-[#7240b8] dark:text-[#a87ffb]">
                          desktop_windows
                        </span>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-[#1c192c] dark:text-[#f4eeff]">Theo Hệ thống</span>
                          <span className="text-[11px] text-[#635a72] dark:text-[#b4a9c7]">Đồng bộ với HĐH</span>
                        </div>
                      </div>
                      {theme === 'system' && (
                        <span className="material-symbols-outlined text-[#7240b8] dark:text-[#a87ffb] text-[20px]">
                          check_circle
                        </span>
                      )}
                    </div>
                  </button>
                </div>

                {/* Information Callout */}
                <div className="bg-[#f7f1ff] dark:bg-[#16131e] p-4 rounded-xl border border-[#ebe5ff] dark:border-[#2f2742] flex items-start gap-3">
                  <span className="material-symbols-outlined text-[#7240b8] dark:text-[#a87ffb] text-[22px] shrink-0 mt-0.5">
                    info
                  </span>
                  <div className="text-xs text-[#635a72] dark:text-[#b4a9c7] leading-relaxed">
                    Lựa chọn theme sẽ được ghi nhớ trên thiết bị của bạn. Khi chọn <strong>Theo Hệ thống</strong>, TMdemy sẽ tự động chuyển đổi sang giao diện Tối khi hệ điều hành hoặc trình duyệt của bạn bật Dark Mode.
                  </div>
                </div>
              </section>
            )}

            {/* Section 1: TÀI KHOẢN */}
            {activeTab === 'tai-khoan' && (
              <section className="bg-white dark:bg-[#1d1926] rounded-2xl p-6 shadow-2xs border border-[#f1ebff] dark:border-[#2f2742] flex flex-col gap-5">
                <div className="flex items-center justify-between pb-1 border-b border-[#f7f1ff] dark:border-[#282136]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#eddcff]/60 dark:bg-[#282136] text-[#7240b8] dark:text-[#a87ffb] flex items-center justify-center">
                      <span className="material-symbols-outlined text-[20px]">badge</span>
                    </div>
                    <div className="flex flex-col">
                      <h2 className="text-lg font-bold text-[#1c192c] dark:text-[#f4eeff]">Thông tin tài khoản</h2>
                      <p className="text-xs text-[#635a72] dark:text-[#b4a9c7]">
                        Chi tiết tài khoản định danh phục vụ cấp chứng chỉ số và thông báo
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-[#e7dbf7] dark:bg-[#282136] text-[11px] font-bold text-[#675f76] dark:text-[#b4a9c7]">
                    {data.account.roleBadge}
                  </span>
                </div>

                {/* Avatar & Meta Banner */}
                <div className="flex items-center gap-4 bg-[#f7f1ff] dark:bg-[#16131e] p-4 rounded-xl border border-[#f1ebff] dark:border-[#2f2742]">
                  <div className="relative shrink-0">
                    <img
                      className="w-16 h-16 rounded-full object-cover shadow-2xs"
                      alt={data.account.name}
                      src={data.account.avatarUrl}
                    />
                    <button
                      onClick={() => showToast('Thay đổi ảnh đại diện trong mục Hồ sơ cá nhân.')}
                      className="absolute -bottom-1 -right-1 w-7 h-7 bg-[#7240b8] text-white rounded-full flex items-center justify-center shadow-md hover:bg-[#8b5ad3] transition-all cursor-pointer"
                      title="Đổi ảnh đại diện"
                    >
                      <span className="material-symbols-outlined text-[15px]">photo_camera</span>
                    </button>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-bold text-[#1c192c] dark:text-[#f4eeff]">{data.account.name}</span>
                    <span className="text-xs text-[#635a72] dark:text-[#b4a9c7] truncate">
                      {data.account.studentTitle}
                    </span>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <span className="text-[11px] text-[#006947] dark:text-[#4edea3] font-semibold bg-white dark:bg-[#1d1926] px-2 py-0.5 rounded shadow-2xs border border-[#f1ebff] dark:border-[#2f2742]">
                        {data.account.rankMonth}
                      </span>
                      <span className="text-[11px] text-[#7240b8] dark:text-[#a87ffb] font-semibold bg-[#eddcff]/50 dark:bg-[#282136] px-2 py-0.5 rounded">
                        {data.account.completedCerts}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Fields Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  {/* Email (Verified) */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-semibold text-[#1c192c] dark:text-[#f4eeff] flex items-center justify-between">
                      <span>Email đăng nhập</span>
                      <span className="flex items-center gap-1 text-[11px] text-[#006947] dark:text-[#4edea3] font-bold">
                        <span className="material-symbols-outlined text-[14px]">verified</span>
                        Đã xác thực
                      </span>
                    </label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined absolute left-3 text-[#7c7483] dark:text-[#b4a9c7] text-[18px]">
                        mail
                      </span>
                      <input
                        type="email"
                        readOnly
                        value={data.account.email}
                        className="w-full h-11 pl-10 pr-4 bg-[#f7f1ff] dark:bg-[#16131e] text-[#1c192c] dark:text-[#f4eeff] text-xs md:text-sm rounded-xl focus:outline-none cursor-not-allowed border border-[#ebe5ff] dark:border-[#2f2742]"
                      />
                    </div>
                    <span className="text-[11px] text-[#635a72] dark:text-[#b4a9c7]">
                      Email trường dùng để đồng bộ bảng điểm đại học.
                    </span>
                  </div>

                  {/* Phone */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-semibold text-[#1c192c] dark:text-[#f4eeff] flex items-center justify-between">
                      <span>Số điện thoại</span>
                      <span className="text-[11px] text-[#7c7483] dark:text-[#b4a9c7] font-medium">Xác thực OTP</span>
                    </label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined absolute left-3 text-[#7c7483] dark:text-[#b4a9c7] text-[18px]">
                        phone_iphone
                      </span>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full h-11 pl-10 pr-4 bg-white dark:bg-[#16131e] text-[#1c192c] dark:text-[#f4eeff] text-xs md:text-sm rounded-xl shadow-2xs border border-[#f1ebff] dark:border-[#2f2742] focus:outline-none focus:bg-[#f7f1ff] dark:focus:bg-[#1c1827] transition-all"
                      />
                    </div>
                    <span className="text-[11px] text-[#635a72] dark:text-[#b4a9c7]">
                      Nhận SMS cảnh báo bảo mật tài khoản.
                    </span>
                  </div>

                  {/* Language */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-semibold text-[#1c192c] dark:text-[#f4eeff]">
                      Ngôn ngữ hiển thị
                    </label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined absolute left-3 text-[#7c7483] dark:text-[#b4a9c7] text-[18px]">
                        language
                      </span>
                      <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="w-full h-11 pl-10 pr-10 bg-white dark:bg-[#16131e] text-[#1c192c] dark:text-[#f4eeff] text-xs md:text-sm rounded-xl shadow-2xs border border-[#f1ebff] dark:border-[#2f2742] appearance-none focus:outline-none focus:bg-[#f7f1ff] dark:focus:bg-[#1c1827] transition-all cursor-pointer"
                      >
                        <option value="Tiếng Việt (Mặc định)">Tiếng Việt (Mặc định)</option>
                        <option value="English (US)">English (US)</option>
                        <option value="日本語 (Japanese)">日本語 (Japanese)</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-3 text-[#7c7483] dark:text-[#b4a9c7] pointer-events-none text-[18px]">
                        expand_more
                      </span>
                    </div>
                  </div>

                  {/* Timezone */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-semibold text-[#1c192c] dark:text-[#f4eeff]">
                      Múi giờ hệ thống
                    </label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined absolute left-3 text-[#7c7483] dark:text-[#b4a9c7] text-[18px]">
                        schedule
                      </span>
                      <select
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        className="w-full h-11 pl-10 pr-10 bg-white dark:bg-[#16131e] text-[#1c192c] dark:text-[#f4eeff] text-xs md:text-sm rounded-xl shadow-2xs border border-[#f1ebff] dark:border-[#2f2742] appearance-none focus:outline-none focus:bg-[#f7f1ff] dark:focus:bg-[#1c1827] transition-all cursor-pointer"
                      >
                        <option value="GMT+7 (Giờ Hà Nội, Bangkok, Jakarta)">
                          GMT+7 (Giờ Hà Nội, Bangkok, Jakarta)
                        </option>
                        <option value="GMT+8 (Singapore, Beijing)">GMT+8 (Singapore, Beijing)</option>
                        <option value="GMT+9 (Tokyo, Seoul)">GMT+9 (Tokyo, Seoul)</option>
                        <option value="GMT+0 (UTC London)">GMT+0 (UTC London)</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-3 text-[#7c7483] dark:text-[#b4a9c7] pointer-events-none text-[18px]">
                        expand_more
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Footer */}
                <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#f7f1ff] dark:border-[#282136]">
                  <button
                    type="button"
                    onClick={() => {
                      setPhone(data.account.phone);
                      setLanguage(data.account.language);
                      setTimezone(data.account.timezone);
                      showToast('Đã đặt lại cấu hình tài khoản.');
                    }}
                    className="px-4 py-2.5 rounded-xl text-[13px] font-semibold text-[#635a72] dark:text-[#b4a9c7] hover:bg-[#f7f1ff] dark:hover:bg-[#282136] transition-all"
                  >
                    Đặt lại
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveAccount}
                    className="px-5 py-2.5 rounded-xl bg-[#7240b8] hover:bg-[#8b5ad3] text-white text-[13px] font-semibold shadow-md shadow-[#7240b8]/20 active:scale-95 transition-all flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[18px]">save</span>
                    Lưu thay đổi
                  </button>
                </div>
              </section>
            )}

            {/* Section 2: BẢO MẬT & ĐỔI MẬT KHẨU */}
            {(activeTab === 'bao-mat' || activeTab === 'tai-khoan') && (
              <section className="bg-white dark:bg-[#1d1926] rounded-2xl p-6 shadow-2xs border border-[#f1ebff] dark:border-[#2f2742] flex flex-col gap-5">
                <div className="flex items-center justify-between pb-1 border-b border-[#f7f1ff] dark:border-[#282136]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#eddcff]/60 dark:bg-[#282136] text-[#7240b8] dark:text-[#a87ffb] flex items-center justify-center">
                      <span className="material-symbols-outlined text-[20px]">lock_reset</span>
                    </div>
                    <div className="flex flex-col">
                      <h2 className="text-lg font-bold text-[#1c192c] dark:text-[#f4eeff]">
                        Đổi mật khẩu &amp; Cấu hình bảo mật
                      </h2>
                      <p className="text-xs text-[#635a72] dark:text-[#b4a9c7]">
                        Khuyến nghị cập nhật mật khẩu định kỳ 90 ngày một lần
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-[#006947] dark:text-[#4edea3] bg-[#6ffbbe]/20 dark:bg-[#005135]/40 px-3 py-1 rounded-full">
                    {data.security.securityLevel}
                  </span>
                </div>

                {/* Password Inputs */}
                <div className="flex flex-col gap-4 pt-1">
                  {/* Current Password */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-semibold text-[#1c192c] dark:text-[#f4eeff]">
                      Mật khẩu hiện tại
                    </label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined absolute left-3 text-[#7c7483] dark:text-[#b4a9c7] text-[18px]">
                        vpn_key
                      </span>
                      <input
                        type={showCurrentPwd ? 'text' : 'password'}
                        value={currentPwd}
                        onChange={(e) => setCurrentPwd(e.target.value)}
                        className="w-full h-11 pl-10 pr-12 bg-[#f7f1ff] dark:bg-[#16131e] text-[#1c192c] dark:text-[#f4eeff] text-xs md:text-sm rounded-xl focus:outline-none focus:bg-white dark:focus:bg-[#1c1827] border border-[#f1ebff] dark:border-[#2f2742] transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPwd(!showCurrentPwd)}
                        className="absolute right-3 text-[#7c7483] dark:text-[#b4a9c7] hover:text-[#1c192c] dark:hover:text-[#f4eeff] p-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {showCurrentPwd ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* New & Confirm Password Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[13px] font-semibold text-[#1c192c] dark:text-[#f4eeff]">Mật khẩu mới</label>
                      <div className="relative flex items-center">
                        <span className="material-symbols-outlined absolute left-3 text-[#7c7483] dark:text-[#b4a9c7] text-[18px]">
                          lock
                        </span>
                        <input
                          type={showNewPwd ? 'text' : 'password'}
                          value={newPwd}
                          onChange={(e) => setNewPwd(e.target.value)}
                          placeholder="Nhập mật khẩu mới"
                          className="w-full h-11 pl-10 pr-12 bg-[#f7f1ff] dark:bg-[#16131e] text-[#1c192c] dark:text-[#f4eeff] text-xs md:text-sm rounded-xl focus:outline-none focus:bg-white dark:focus:bg-[#1c1827] border border-[#f1ebff] dark:border-[#2f2742] transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPwd(!showNewPwd)}
                          className="absolute right-3 text-[#7c7483] dark:text-[#b4a9c7] hover:text-[#1c192c] dark:hover:text-[#f4eeff] p-1 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {showNewPwd ? 'visibility_off' : 'visibility'}
                          </span>
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[13px] font-semibold text-[#1c192c] dark:text-[#f4eeff]">
                        Xác nhận mật khẩu mới
                      </label>
                      <div className="relative flex items-center">
                        <span className="material-symbols-outlined absolute left-3 text-[#7c7483] dark:text-[#b4a9c7] text-[18px]">
                          lock_clock
                        </span>
                        <input
                          type={showConfirmPwd ? 'text' : 'password'}
                          value={confirmPwd}
                          onChange={(e) => setConfirmPwd(e.target.value)}
                          placeholder="Nhập lại mật khẩu mới"
                          className="w-full h-11 pl-10 pr-12 bg-[#f7f1ff] dark:bg-[#16131e] text-[#1c192c] dark:text-[#f4eeff] text-xs md:text-sm rounded-xl focus:outline-none focus:bg-white dark:focus:bg-[#1c1827] border border-[#f1ebff] dark:border-[#2f2742] transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                          className="absolute right-3 text-[#7c7483] dark:text-[#b4a9c7] hover:text-[#1c192c] dark:hover:text-[#f4eeff] p-1 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {showConfirmPwd ? 'visibility_off' : 'visibility'}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Password Strength Checklist Card */}
                  <div className="bg-[#f7f1ff] dark:bg-[#16131e] p-4 rounded-xl flex flex-col gap-1.5 border border-[#ebe5ff] dark:border-[#2f2742]">
                    <span className="text-[11px] font-bold text-[#1c192c] dark:text-[#f4eeff]">
                      Quy chuẩn mật khẩu an toàn:
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1">
                      <div
                        className={`flex items-center gap-1.5 text-[11px] font-semibold ${
                          isLengthValid ? 'text-[#006947] dark:text-[#4edea3]' : 'text-[#635a72] dark:text-[#b4a9c7]'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {isLengthValid ? 'check_circle' : 'radio_button_unchecked'}
                        </span>
                        <span>Tối thiểu 8 ký tự</span>
                      </div>
                      <div
                        className={`flex items-center gap-1.5 text-[11px] font-semibold ${
                          isCaseValid ? 'text-[#006947] dark:text-[#4edea3]' : 'text-[#635a72] dark:text-[#b4a9c7]'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {isCaseValid ? 'check_circle' : 'radio_button_unchecked'}
                        </span>
                        <span>Chứa chữ số và chữ hoa</span>
                      </div>
                      <div
                        className={`flex items-center gap-1.5 text-[11px] font-semibold ${
                          isSpecialValid ? 'text-[#006947] dark:text-[#4edea3]' : 'text-[#635a72] dark:text-[#b4a9c7]'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {isSpecialValid ? 'check_circle' : 'radio_button_unchecked'}
                        </span>
                        <span>Ký tự đặc biệt (@, #, $)</span>
                      </div>
                    </div>
                  </div>

                  {/* Update Password Action */}
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={handleUpdatePassword}
                      className="px-5 py-2.5 bg-[#7240b8] hover:bg-[#8b5ad3] text-white text-[13px] font-semibold rounded-xl shadow-md shadow-[#7240b8]/20 transition-all flex items-center gap-1.5 active:scale-95"
                    >
                      <span className="material-symbols-outlined text-[18px]">encrypted</span>
                      Cập nhật mật khẩu
                    </button>
                  </div>
                </div>

                {/* Section 2.2: Phiên đăng nhập & Thiết bị */}
                <div className="flex flex-col gap-3 pt-4 mt-2 bg-[#f7f1ff]/60 dark:bg-[#16131e] p-4 rounded-xl border border-[#ebe5ff] dark:border-[#2f2742]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#7240b8] dark:text-[#a87ffb] text-[20px]">
                        devices
                      </span>
                      <span className="text-sm font-bold text-[#1c192c] dark:text-[#f4eeff]">
                        Phiên đăng nhập &amp; Thiết bị đã liên kết
                      </span>
                    </div>
                    <span className="text-[11px] text-[#635a72] dark:text-[#b4a9c7] font-semibold">
                      {devices.length} thiết bị đang tin cậy
                    </span>
                  </div>

                  {/* Devices List */}
                  {devices.map((device) => (
                    <div
                      key={device.id}
                      className="flex items-center justify-between p-3 bg-white dark:bg-[#1d1926] rounded-xl shadow-2xs border border-[#f1ebff] dark:border-[#2f2742]"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            device.isCurrent
                              ? 'bg-[#eddcff]/50 dark:bg-[#282136] text-[#7240b8] dark:text-[#a87ffb]'
                              : 'bg-[#f7f1ff] dark:bg-[#282136] text-[#635a72] dark:text-[#b4a9c7]'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[22px]">
                            {device.deviceType === 'laptop' ? 'laptop_mac' : 'smartphone'}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="text-[13px] font-semibold text-[#1c192c] dark:text-[#f4eeff]">
                              {device.name}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                                device.isCurrent
                                  ? 'bg-[#6ffbbe] dark:bg-[#005135] text-[#002113] dark:text-[#6ffbbe]'
                                  : 'bg-[#ebe5ff] dark:bg-[#282136] text-[#4b4452] dark:text-[#b4a9c7]'
                              }`}
                            >
                              {device.platform}
                            </span>
                          </div>
                          <span className="text-[12px] text-[#635a72] dark:text-[#b4a9c7]">
                            {device.location} {device.ipAddress ? `• IP: ${device.ipAddress}` : ''}
                          </span>
                        </div>
                      </div>

                      {device.isCurrent ? (
                        <span className="text-[11px] text-[#006947] dark:text-[#4edea3] font-semibold flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#006947] dark:bg-[#4edea3] animate-pulse" />
                          {device.statusText}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleRevokeDevice(device.id)}
                          className="text-[11px] text-[#ba1a1a] dark:text-[#ffb4ab] hover:bg-[#ffdad6]/40 dark:hover:bg-[#521b1b] px-3 py-1 rounded-lg font-bold transition-all"
                        >
                          Thu hồi
                        </button>
                      )}
                    </div>
                  ))}

                  {/* Global Kill Switch */}
                  <div className="pt-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <span className="text-[12px] text-[#635a72] dark:text-[#b4a9c7]">
                      Nếu nghi ngờ lộ mật khẩu, hủy tất cả phiên đăng nhập khác ngay lập tức.
                    </span>
                    <button
                      type="button"
                      onClick={handleLogoutAllOtherDevices}
                      className="px-4 py-2 text-[12px] font-semibold text-[#7240b8] dark:text-[#a87ffb] bg-[#eddcff]/40 dark:bg-[#282136] hover:bg-[#eddcff] dark:hover:bg-[#342a47] rounded-xl transition-all self-end sm:self-auto"
                    >
                      Đăng xuất khỏi tất cả thiết bị khác
                    </button>
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* Right Column (Span 4) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            {/* Section 3: THÔNG BÁO & QUYỀN RIÊNG TƯ (Modern Toggles) */}
            <section className="bg-white dark:bg-[#1d1926] rounded-2xl p-6 shadow-2xs border border-[#f1ebff] dark:border-[#2f2742] flex flex-col gap-5">
              <div className="flex items-center gap-2.5 pb-1 border-b border-[#f7f1ff] dark:border-[#282136]">
                <div className="w-9 h-9 rounded-xl bg-[#eddcff]/60 dark:bg-[#282136] text-[#7240b8] dark:text-[#a87ffb] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">tune</span>
                </div>
                <div className="flex flex-col">
                  <h2 className="text-lg font-bold text-[#1c192c] dark:text-[#f4eeff]">Cấu hình trải nghiệm</h2>
                  <p className="text-xs text-[#635a72] dark:text-[#b4a9c7]">Tùy biến hiển thị &amp; thông báo đẩy</p>
                </div>
              </div>

              {/* Toggle Items List */}
              <div className="flex flex-col gap-4">
                {/* Toggle 1 */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex flex-col">
                    <span className="text-[13px] font-semibold text-[#1c192c] dark:text-[#f4eeff]">
                      Tiến độ &amp; Nhắc học tập
                    </span>
                    <span className="text-[12px] text-[#635a72] dark:text-[#b4a9c7]">
                      Nhắc lịch học buổi tối và deadline bài tập
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={studyReminder}
                      onChange={(e) => {
                        setStudyReminder(e.target.checked);
                        showToast('Đã lưu tùy chọn thông báo học tập.');
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-[#e6dffa] dark:bg-[#332c45] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#7240b8]" />
                  </label>
                </div>

                {/* Toggle 2 */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex flex-col">
                    <span className="text-[13px] font-semibold text-[#1c192c] dark:text-[#f4eeff]">
                      Tin nhắn Giảng viên &amp; Nhóm
                    </span>
                    <span className="text-[12px] text-[#635a72] dark:text-[#b4a9c7]">
                      Phản hồi Q&amp;A và thông báo diễn đàn khóa học
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={instructorMessages}
                      onChange={(e) => {
                        setInstructorMessages(e.target.checked);
                        showToast('Đã lưu tùy chọn tin nhắn giảng viên.');
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-[#e6dffa] dark:bg-[#332c45] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#7240b8]" />
                  </label>
                </div>

                {/* Toggle 3 */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex flex-col">
                    <span className="text-[13px] font-semibold text-[#1c192c] dark:text-[#f4eeff]">
                      Thành tích &amp; BXH Tuần
                    </span>
                    <span className="text-[12px] text-[#635a72] dark:text-[#b4a9c7]">
                      Thông báo khi bạn tăng hạng hoặc nhận huy hiệu
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={leaderboardAlerts}
                      onChange={(e) => {
                        setLeaderboardAlerts(e.target.checked);
                        showToast('Đã lưu tùy chọn thông báo xếp hạng.');
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-[#e6dffa] dark:bg-[#332c45] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#7240b8]" />
                  </label>
                </div>

                {/* Toggle 3.5: Âm thanh thông báo */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex flex-col">
                    <span className="text-[13px] font-semibold text-[#1c192c] dark:text-[#f4eeff]">
                      Âm thanh thông báo
                    </span>
                    <span className="text-[12px] text-[#635a72] dark:text-[#b4a9c7]">
                      Phát tiếng chuông nhẹ khi nhận tin nhắn hoặc thông báo mới
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={soundEnabled}
                      onChange={(e) => {
                        setSound(e.target.checked);
                        toast.success(
                          e.target.checked
                            ? 'Đã bật âm thanh thông báo.'
                            : 'Đã tắt âm thanh thông báo.'
                        );
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-[#e6dffa] dark:bg-[#332c45] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#7240b8]" />
                  </label>
                </div>

                <div className="h-px bg-[#ebe5ff] dark:bg-[#282136] w-full my-0.5" />

                {/* Toggle 4: Privacy */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex flex-col">
                    <span className="text-[13px] font-semibold text-[#1c192c] dark:text-[#f4eeff]">
                      Hồ sơ công khai
                    </span>
                    <span className="text-[12px] text-[#635a72] dark:text-[#b4a9c7]">
                      Cho phép học viên khác xem các chứng chỉ đạt được
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={publicProfile}
                      onChange={(e) => {
                        setPublicProfile(e.target.checked);
                        showToast('Đã cập nhật trạng thái hiển thị hồ sơ.');
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-[#e6dffa] dark:bg-[#332c45] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#7240b8]" />
                  </label>
                </div>

                {/* Toggle 5: Leaderboard */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex flex-col">
                    <span className="text-[13px] font-semibold text-[#1c192c] dark:text-[#f4eeff]">
                      Hiển thị trên Bảng xếp hạng
                    </span>
                    <span className="text-[12px] text-[#635a72] dark:text-[#b4a9c7]">
                      Hiển thị streak ngày và điểm danh dự học tập
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={showOnLeaderboard}
                      onChange={(e) => {
                        setShowOnLeaderboard(e.target.checked);
                        showToast('Đã cập nhật hiển thị bảng xếp hạng.');
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-[#e6dffa] dark:bg-[#332c45] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#7240b8]" />
                  </label>
                </div>
              </div>
            </section>

            {/* Visual Study Metric Mini-Card */}
            <div className="bg-gradient-to-br from-[#7240b8] to-[#8b5ad3] text-white rounded-2xl p-6 shadow-md flex flex-col gap-2 relative overflow-hidden">
              <div className="absolute -right-4 -bottom-6 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none" />
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#eddcff]">
                  Bảo mật học thuật
                </span>
                <span className="material-symbols-outlined text-[#eddcff]">verified_user</span>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold leading-tight">
                  {data.security.academicSecurityPercent}% An Toàn
                </span>
                <span className="text-xs text-white/80 mt-1">
                  Tài khoản được bảo vệ bởi xác thực hai bước SSO của cơ sở giáo dục.
                </span>
              </div>
              <div className="w-full bg-white/20 h-2 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-[#6ffbbe] h-full rounded-full"
                  style={{ width: `${data.security.academicSecurityPercent}%` }}
                />
              </div>
            </div>

            {/* Section 4: ĐĂNG XUẤT & VÙNG NGUY HIỂM (Danger Zone) */}
            <section className="bg-white dark:bg-[#1d1926] rounded-2xl p-6 shadow-2xs border border-[#f1ebff] dark:border-[#2f2742] flex flex-col gap-4">
              <div className="flex items-center gap-2.5 pb-1 border-b border-[#f7f1ff] dark:border-[#282136]">
                <div className="w-9 h-9 rounded-xl bg-[#ffdad6]/40 dark:bg-[#521b1b]/50 text-[#ba1a1a] dark:text-[#ffb4ab] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">warning</span>
                </div>
                <div className="flex flex-col">
                  <h2 className="text-lg font-bold text-[#1c192c] dark:text-[#f4eeff]">Vùng bảo mật đặc biệt</h2>
                  <p className="text-xs text-[#635a72] dark:text-[#b4a9c7]">Thao tác phiên làm việc hiện tại</p>
                </div>
              </div>

              <div className="bg-[#ffdad6]/20 dark:bg-[#341111]/40 p-4 rounded-xl flex flex-col gap-2 border border-[#ffdad6]/40 dark:border-[#521b1b]">
                <div className="flex items-center gap-1.5 text-[#ba1a1a] dark:text-[#ffb4ab] text-sm font-bold">
                  <span className="material-symbols-outlined text-[20px]">logout</span>
                  <span>Đăng xuất tài khoản</span>
                </div>
                <p className="text-xs text-[#635a72] dark:text-[#b4a9c7] leading-relaxed">
                  Kết thúc phiên làm việc trên trình duyệt này. Tất cả tiến độ học tập và bài kiểm
                  tra chưa nộp sẽ được lưu tự động lên máy chủ TMdemy.
                </p>
                <button
                  type="button"
                  onClick={() => setIsLogoutModalOpen(true)}
                  className="w-full mt-2 py-2.5 px-4 bg-[#ba1a1a] text-white text-[13px] font-bold rounded-xl shadow-xs hover:bg-[#ba1a1a]/90 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                  Đăng xuất khỏi thiết bị này
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* LOGOUT CONFIRMATION MODAL */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#312e42]/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white dark:bg-[#1d1926] rounded-2xl p-6 shadow-2xl flex flex-col gap-4 border border-[#f1ebff] dark:border-[#2f2742]">
            {/* Header with Icon */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#ffdad6]/50 dark:bg-[#521b1b]/50 text-[#ba1a1a] dark:text-[#ffb4ab] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[26px]">logout</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <h3 className="text-lg font-bold text-[#1c192c] dark:text-[#f4eeff]">Đăng xuất khỏi TMdemy?</h3>
                <span className="text-xs text-[#635a72] dark:text-[#b4a9c7]">Tài khoản: {data.account.email}</span>
              </div>
            </div>

            {/* Description */}
            <p className="text-xs md:text-sm text-[#4b4452] dark:text-[#b4a9c7] leading-relaxed">
              Bạn có chắc chắn muốn đăng xuất khỏi tài khoản của{' '}
              <strong className="text-[#1c192c] dark:text-[#f4eeff] font-semibold">{data.account.name}</strong> trên thiết
              bị này không? Tiến độ học tập của bạn đã được tự động lưu.
            </p>

            {/* Safe Notice */}
            <div className="bg-[#f7f1ff] dark:bg-[#16131e] p-3 rounded-xl flex items-center gap-2 text-[#635a72] dark:text-[#b4a9c7] text-xs border border-[#ebe5ff] dark:border-[#2f2742]">
              <span className="material-symbols-outlined text-[#006947] dark:text-[#4edea3] text-[18px]">
                cloud_done
              </span>
              <span>Đã đồng bộ hóa lúc {data.security.lastSyncedTime}</span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsLogoutModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-[13px] font-semibold text-[#635a72] dark:text-[#b4a9c7] hover:bg-[#f7f1ff] dark:hover:bg-[#282136] transition-all cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmLogout}
                className="px-5 py-2.5 rounded-xl bg-[#ba1a1a] text-white text-[13px] font-bold shadow-md hover:bg-[#ba1a1a]/90 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">check</span>
                Đăng xuất
              </button>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setIsLogoutModalOpen(false)}
              className="absolute top-4 right-4 text-[#7c7483] dark:text-[#b4a9c7] hover:text-[#1c192c] dark:hover:text-[#f4eeff] p-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
