'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { LogOut, Mail, Lock, User, Clock, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

export function AccountLockedModal() {
  const { user, isLocked, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [loggingOut, setLoggingOut] = useState(false);

  const isActuallyLocked = isLocked || (user && user.status?.toUpperCase() === 'INACTIVE');

  // Lock body scroll when locked
  useEffect(() => {
    if (isActuallyLocked && pathname !== '/login') {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isActuallyLocked, pathname]);

  if (!isActuallyLocked || pathname === '/login') return null;

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      router.push('/login');
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="locked-title"
      aria-describedby="locked-desc"
      className="fixed inset-0 z-[999999] bg-[#0c0914]/95 backdrop-blur-xl flex items-center justify-center p-4 select-none animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg bg-white dark:bg-[#1d1926] rounded-3xl border-2 border-rose-500/30 dark:border-rose-500/40 shadow-2xl overflow-hidden p-6 sm:p-8 text-center space-y-6">
        {/* Glow ambient background effect */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-rose-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Icon with pulsing rings */}
        <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
          <div className="absolute inset-0 rounded-3xl bg-rose-500/20 animate-ping opacity-30" />
          <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-tr from-rose-600 to-rose-400 text-white flex items-center justify-center shadow-lg shadow-rose-600/30">
            <Lock className="w-10 h-10" />
          </div>
        </div>

        {/* Badges & Titles */}
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800/60 uppercase tracking-wider">
            <AlertTriangle className="w-3.5 h-3.5" />
            Tài khoản đã bị khóa (INACTIVE)
          </span>

          <h2 id="locked-title" className="text-xl sm:text-2xl font-extrabold text-[#1c192c] dark:text-[#f4eeff] tracking-tight">
            Quyền truy cập đã bị đình chỉ
          </h2>

          <p id="locked-desc" className="text-xs sm:text-sm text-[#635a72] dark:text-[#a9a0b2] max-w-md mx-auto leading-relaxed">
            Quản trị viên đã khóa tài khoản của bạn trên nền tảng TMdemy. Toàn bộ quyền truy cập khóa học, bình luận, và thao tác đã bị chặn hoàn toàn.
          </p>
        </div>

        {/* Target user info card */}
        <div className="p-4 rounded-2xl bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] text-xs space-y-2.5 text-left">
          <div className="flex items-center justify-between pb-2 border-b border-[#f1ebff] dark:border-[#2b2438]">
            <span className="text-[#635a72] dark:text-[#a9a0b2] flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              Tài khoản:
            </span>
            <span className="font-bold text-[#1c192c] dark:text-[#f4eeff]">
              {user?.username || 'Người dùng'}
            </span>
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-[#f1ebff] dark:border-[#2b2438]">
            <span className="text-[#635a72] dark:text-[#a9a0b2] flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              Email:
            </span>
            <span className="font-semibold text-[#1c192c] dark:text-[#f4eeff]">
              {user?.email || '—'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[#635a72] dark:text-[#a9a0b2] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Trạng thái hệ thống:
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white">
              BỊ KHÓA TOÀN PHẦN
            </span>
          </div>
        </div>

        {/* Notice alert */}
        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 text-[11px] text-amber-800 dark:text-amber-300 text-left leading-relaxed">
          <strong>Chính sách bảo mật:</strong> Phiên làm việc của tài khoản này đã bị thu hồi. Bạn không thể tiếp tục điều hướng hoặc sử dụng bất kỳ phân hệ nào cho đến khi tài khoản được Quản trị viên mở khóa.
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-all shadow-md shadow-rose-600/20 disabled:opacity-50"
          >
            <LogOut className="w-4 h-4" />
            <span>{loggingOut ? 'Đang đăng xuất...' : 'Đăng xuất khỏi hệ thống'}</span>
          </button>

          <a
            href={`mailto:support@tmdemy.vn?subject=Khieu%20nai%20khoa%20tai%20khoan%20${encodeURIComponent(
              user?.email || ''
            )}`}
            className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#f7f1ff] dark:bg-[#2b2438] text-[#7240b8] dark:text-[#a87ffb] hover:bg-[#ede3ff] dark:hover:bg-[#342b45] transition-colors border border-[#7240b8]/20"
          >
            <Mail className="w-4 h-4" />
            <span>Liên hệ hỗ trợ</span>
          </a>
        </div>
      </div>
    </div>
  );
}
