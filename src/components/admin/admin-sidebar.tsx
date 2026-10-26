'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  X,
  LayoutDashboard,
  Users,
  BookOpen,
  FolderTree,
  Ticket,
  Receipt,
  MessageSquare,
  GraduationCap,
  ExternalLink,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { toast } from '@/lib/toast';

interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  materialIcon: string;
  badge?: string;
}

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user } = useAuth();

  const navItems: NavItem[] = [
    {
      label: 'Tổng quan',
      path: '/admin/dashboard',
      icon: LayoutDashboard,
      materialIcon: 'dashboard',
    },
    {
      label: 'Người dùng',
      path: '/admin/users',
      icon: Users,
      materialIcon: 'group',
    },
    {
      label: 'Khóa học',
      path: '/admin/courses',
      icon: BookOpen,
      materialIcon: 'school',
    },
    {
      label: 'Danh mục',
      path: '/admin/categories',
      icon: FolderTree,
      materialIcon: 'category',
    },
    {
      label: 'Mã giảm giá',
      path: '/admin/coupons',
      icon: Ticket,
      materialIcon: 'local_offer',
    },
    {
      label: 'Đơn hàng',
      path: '/admin/orders',
      icon: Receipt,
      materialIcon: 'shopping_cart',
    },
    {
      label: 'Kiểm duyệt bình luận',
      path: '/admin/comments',
      icon: MessageSquare,
      materialIcon: 'forum',
    },
  ];

  const isActive = (itemPath: string) => {
    if (itemPath === '/admin/dashboard') {
      return pathname === '/admin/dashboard' || pathname === '/admin';
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
        aria-label="Thanh điều hướng Quản trị viên"
        className={`fixed left-0 top-0 h-full w-64 md:w-72 bg-white dark:bg-[#17141f] shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-50 flex flex-col justify-between select-none transition-transform duration-300 ease-in-out border-r border-[#f1ebff] dark:border-[#2b2438] ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col flex-1 min-h-0">
          {/* Logo Brand Header */}
          <div className="h-16 px-6 flex items-center justify-between border-b border-[#f7f1ff] dark:border-[#2b2438]">
            <Link
              href="/admin/dashboard"
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

          {/* Quick Action: View Learner Portal */}
          <div className="px-3 pt-3 pb-1">
            <Link
              href="/"
              onClick={() => onClose?.()}
              className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#f7f1ff] dark:bg-[#221d2d] hover:bg-[#ebdffa] dark:hover:bg-[#2b2438] text-[#7240b8] dark:text-[#a87ffb] text-xs font-medium border border-[#7240b8]/15 transition-colors"
            >
              <span>Xem trang học viên</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="px-3 py-2 flex-1 overflow-y-auto custom-scrollbar">
            <div className="px-3 pb-1.5 pt-2 text-[11px] font-bold text-[#7c7483] dark:text-[#968e9e] uppercase tracking-wider">
              Quản trị hệ thống
            </div>
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => {
                const active = isActive(item.path);
                const IconComponent = item.icon;
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={() => onClose?.()}
                    className={`flex items-center justify-between px-3.5 py-2.5 transition-all text-[13px] font-semibold ${
                      active
                        ? 'bg-[#f7f1ff] dark:bg-[#2b2438] text-[#7240b8] dark:text-[#a87ffb] border-l-4 border-[#7240b8] dark:border-[#a87ffb] rounded-r-lg font-bold shadow-2xs'
                        : 'rounded-lg text-[#4b4452] dark:text-[#cdc3d4] hover:bg-[#f7f1ff] dark:hover:bg-[#221d2d] hover:text-[#1c192c] dark:hover:text-[#f4eeff]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <IconComponent className={`w-4 h-4 shrink-0 ${active ? 'text-[#7240b8] dark:text-[#a87ffb]' : 'text-[#635a72] dark:text-[#a9a0b2]'}`} />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Bottom Utility Navigation */}
        <div className="p-3 border-t border-[#f7f1ff] dark:border-[#2b2438] space-y-1">
          {/* User brief info */}
          {user && (
            <div className="px-3 py-2 rounded-lg bg-[#fdf8ff] dark:bg-[#1f1b29] border border-[#f1ebff] dark:border-[#2b2438] mb-1">
              <p className="text-xs font-bold text-[#1c192c] dark:text-[#f4eeff] truncate">
                {user.username || 'Quản trị viên'}
              </p>
              <p className="text-[11px] text-[#635a72] dark:text-[#a9a0b2] truncate">
                {user.email}
              </p>
            </div>
          )}


          {/* Logout */}
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[#ba1a1a] dark:text-[#ffb4ab] hover:bg-[#ffdad6]/30 dark:hover:bg-[#ffdad6]/10 transition-all text-xs font-semibold cursor-pointer text-left"
          >
            <LogOut className="w-4 h-4" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>
    </>
  );
}
