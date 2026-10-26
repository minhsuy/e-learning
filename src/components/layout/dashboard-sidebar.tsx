'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { GraduationCap, X } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { conversationService } from '@/services/conversation.service';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function DashboardSidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuth();
  const [conversationCount, setConversationCount] = useState<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    let isMounted = true;

    const loadConversationsCount = async () => {
      try {
        const res = await conversationService.getConversations();
        if (isMounted && res.success && Array.isArray(res.data)) {
          setConversationCount(res.data.length);
        }
      } catch {
        // Silently catch to prevent blocking navigation
      }
    };

    void loadConversationsCount();

    const handleUpdate = () => {
      void loadConversationsCount();
    };

    window.addEventListener('tmdemy:conversations-updated', handleUpdate);
    window.addEventListener('tmdemy:token-change', handleUpdate);
    window.addEventListener('focus', handleUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener('tmdemy:conversations-updated', handleUpdate);
      window.removeEventListener('tmdemy:token-change', handleUpdate);
      window.removeEventListener('focus', handleUpdate);
    };
  }, [isAuthenticated, pathname]);

  const navItems = [
    { label: 'Tổng quan', path: '/', icon: 'dashboard' },
    { label: 'Khóa học', path: '/courses', icon: 'explore' },
    { label: 'Khóa học của tôi', path: '/my-courses', icon: 'school' },
    { label: 'Lộ trình', path: '/roadmap', icon: 'conversion_path' },
    { label: 'Chứng chỉ', path: '/certificates', icon: 'verified' },
    { label: 'Bảng xếp hạng', path: '/leaderboard', icon: 'leaderboard' },
    {
      label: 'Tin nhắn',
      path: '/messages',
      icon: 'chat',
      badge:
        isAuthenticated && conversationCount !== null && conversationCount > 0
          ? conversationCount > 99
            ? '99+'
            : String(conversationCount)
          : undefined,
    },
    { label: 'Hồ sơ cá nhân', path: '/profile', icon: 'person' },
  ];

  const bottomNavItems = [
    { label: 'Cài đặt', path: '/settings', icon: 'settings' },
    { label: 'Hỗ trợ', path: '#', icon: 'help' },
  ];

  const isActive = (itemPath: string) => {
    if (itemPath === '/') {
      return pathname === '/';
    }
    if (itemPath === '/courses') {
      return pathname.startsWith('/courses');
    }
    if (itemPath === '/my-courses') {
      return pathname.startsWith('/my-courses');
    }
    if (itemPath === '/roadmap') {
      return pathname.startsWith('/roadmap');
    }
    if (itemPath === '/certificates') {
      return pathname.startsWith('/certificates');
    }
    if (itemPath === '/leaderboard') {
      return pathname.startsWith('/leaderboard');
    }
    if (itemPath === '/messages') {
      return pathname.startsWith('/messages');
    }
    if (itemPath === '/profile') {
      return pathname.startsWith('/profile');
    }
    if (itemPath === '/settings') {
      return pathname.startsWith('/settings');
    }
    if (itemPath === '/notifications') {
      return pathname.startsWith('/notifications');
    }
    if (itemPath.startsWith('/learn')) {
      return pathname.startsWith('/learn');
    }
    return false;
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed left-0 top-0 h-full w-72 bg-white dark:bg-[#17141f] shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-50 flex flex-col justify-between select-none transition-transform duration-300 ease-in-out border-r border-[#f1ebff] dark:border-[#2b2438] ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col">
          {/* Logo Brand Header */}
          <div className="h-16 px-6 flex items-center justify-between border-b border-[#f7f1ff] dark:border-[#2b2438]">
            <Link href="/" className="flex items-center gap-2.5">
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

          {/* Navigation Links */}
          <div className="px-4 py-3">
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => {
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.label}
                    href={item.path}
                    onClick={() => onClose?.()}
                    className={`flex items-center justify-between px-4 py-2.5 transition-all text-[13px] font-semibold ${
                      active
                        ? 'bg-[#f7f1ff] dark:bg-[#2b2438] text-[#7240b8] dark:text-[#a87ffb] border-l-4 border-[#7240b8] dark:border-[#a87ffb] rounded-r-lg font-bold shadow-2xs'
                        : 'rounded-lg text-[#4b4452] dark:text-[#cdc3d4] hover:bg-[#f7f1ff] dark:hover:bg-[#221d2d] hover:text-[#1c192c] dark:hover:text-[#f4eeff]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="px-2 py-0.5 rounded-full bg-[#e7dbf7] dark:bg-[#352e43] text-[#675f76] dark:text-[#cdc3d4] text-[11px] font-semibold">
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
        <div className="p-4 mb-2 border-t border-[#f7f1ff] dark:border-[#2b2438]">
          <nav className="flex flex-col gap-1">
            {/* Switch to Admin Mode for Admins */}
            {isAuthenticated && user?.role === 'admin' && (
              <Link
                href="/admin/dashboard"
                onClick={() => onClose?.()}
                className="flex items-center justify-between px-4 py-2 rounded-lg text-[#7240b8] dark:text-[#a87ffb] bg-[#f7f1ff] dark:bg-[#2b2438] hover:bg-[#ebdffa] dark:hover:bg-[#352c48] transition-all text-[13px] font-semibold mb-1 group"
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[20px] text-[#7240b8] dark:text-[#a87ffb]">
                    admin_panel_settings
                  </span>
                  <span>Cổng Quản Trị</span>
                </div>
                <span className="bg-[#7240b8] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                  Admin
                </span>
              </Link>
            )}

            {/* Switch to Teacher Mode for Teachers */}
            {isAuthenticated && user?.role === 'teacher' && (
              <Link
                href="/teacher/dashboard"
                onClick={() => onClose?.()}
                className="flex items-center justify-between px-4 py-2 rounded-lg text-[#7240b8] dark:text-[#a87ffb] bg-[#f7f1ff] dark:bg-[#2b2438] hover:bg-[#ebdffa] dark:hover:bg-[#352c48] transition-all text-[13px] font-semibold mb-1 group"
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[20px] text-[#7240b8] dark:text-[#a87ffb]">
                    school
                  </span>
                  <span>Kênh Giảng viên</span>
                </div>
                <span className="bg-[#7240b8] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                  Chuyển
                </span>
              </Link>
            )}

            {bottomNavItems.map((item) => (
              <Link
                key={item.label}
                href={item.path}
                className="flex items-center gap-2.5 px-4 py-2 rounded-lg text-[#4b4452] dark:text-[#cdc3d4] hover:bg-[#f7f1ff] dark:hover:bg-[#221d2d] hover:text-[#1c192c] dark:hover:text-[#f4eeff] transition-all text-[13px] font-semibold"
              >
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
}
