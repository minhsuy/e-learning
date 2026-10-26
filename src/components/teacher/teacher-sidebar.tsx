'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { X, Plus, GraduationCap } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { toast } from '@/lib/toast';

interface TeacherSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function TeacherSidebar({ isOpen, onClose }: TeacherSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  const navItems = [
    { label: 'Tổng quan', path: '/teacher/dashboard', icon: 'dashboard' },
    { label: 'Khóa học của tôi', path: '/teacher/courses', icon: 'school' },
    { label: 'Đơn hàng', path: '/teacher/orders', icon: 'shopping_bag' },
    { label: 'Mã giảm giá', path: '/teacher/coupons', icon: 'local_offer' },
    { label: 'Bình luận', path: '/teacher/comments', icon: 'forum' },
  ];

  const isActive = (itemPath: string) => {
    if (itemPath === '/teacher/dashboard') {
      return pathname === '/teacher/dashboard' || pathname === '/teacher';
    }
    return pathname.startsWith(itemPath);
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Đã đăng xuất thành công!');
      router.push('/');
    } catch {
      toast.error('Có lỗi xảy ra khi đăng xuất.');
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed left-0 top-0 h-full w-64 md:w-72 bg-white dark:bg-[#17141f] shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-50 flex flex-col justify-between select-none transition-transform duration-300 ease-in-out border-r border-[#f1ebff] dark:border-[#2b2438] ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col flex-1 min-h-0">
          {/* Logo Brand Header */}
          <div className="h-16 px-6 flex items-center justify-between border-b border-[#f7f1ff] dark:border-[#2b2438]">
            <Link
              href="/teacher/dashboard"
              onClick={() => onClose?.()}
              className="flex items-center gap-2.5"
            >
              <div className="w-8 h-8 rounded-lg bg-[#7240b8] dark:bg-[#a87ffb] text-white dark:text-[#1c192c] flex items-center justify-center shadow-xs">
                <GraduationCap className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold text-[#7240b8] dark:text-[#a87ffb] tracking-tight">
                TMdemy
              </span>
            </Link>

            {/* Mobile close button */}
            <button
              onClick={onClose}
              aria-label="Đóng thanh điều hướng"
              className="lg:hidden p-1.5 rounded-lg text-[#635a72] dark:text-[#cdc3d4] hover:bg-[#f7f1ff] dark:hover:bg-[#221d2d] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Action: Create Course CTA */}
          <div className="px-4 pt-4 pb-2">
            <Link
              href="/teacher/courses/new"
              onClick={() => onClose?.()}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#7240b8] hover:bg-[#5e3299] text-white text-xs md:text-sm font-semibold shadow-xs active:scale-[0.98] transition-all duration-150"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo khóa học mới</span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="px-3 py-2 flex-1 overflow-y-auto">
            <div className="px-3 pb-1.5 text-[11px] font-bold text-[#7c7483] dark:text-[#968e9e] uppercase tracking-wider">
              Quản trị giảng dạy
            </div>
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => {
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.label}
                    href={item.path}
                    onClick={() => onClose?.()}
                    className={`flex items-center justify-between px-3.5 py-2.5 transition-all text-[13px] font-semibold ${
                      active
                        ? 'bg-[#f7f1ff] dark:bg-[#2b2438] text-[#7240b8] dark:text-[#a87ffb] border-l-4 border-[#7240b8] dark:border-[#a87ffb] rounded-r-lg font-bold shadow-2xs'
                        : 'rounded-lg text-[#4b4452] dark:text-[#cdc3d4] hover:bg-[#f7f1ff] dark:hover:bg-[#221d2d] hover:text-[#1c192c] dark:hover:text-[#f4eeff]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                      <span>{item.label}</span>
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Bottom Utility Navigation */}
        <div className="p-4 border-t border-[#f7f1ff] dark:border-[#2b2438] space-y-1">


          {/* Logout */}
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-lg text-[#ba1a1a] dark:text-[#ffb4ab] hover:bg-[#ffdad6]/30 dark:hover:bg-[#ffdad6]/10 transition-all text-[13px] font-semibold cursor-pointer text-left"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>
    </>
  );
}
