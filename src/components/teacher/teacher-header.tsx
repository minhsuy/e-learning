'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, LogOut, User as UserIcon, Settings as SettingsIcon, GraduationCap, ShieldCheck } from 'lucide-react';
import { TeacherBreadcrumb } from './teacher-breadcrumb';
import { ThemeToggle } from '@/components/common/theme-toggle';
import { NotificationPopover } from '@/components/notification/notification-popover';
import { useAuth } from '@/hooks/use-auth';
import { toast } from '@/lib/toast';

interface TeacherHeaderProps {
  onToggleSidebar?: () => void;
}

function getInitials(name?: string): string {
  if (!name) return 'GV';
  const clean = name.trim();
  const parts = clean.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
}

function formatRole(role?: string): string {
  if (!role) return 'Giảng viên';
  const r = role.toLowerCase();
  if (r === 'admin') return 'Quản trị viên';
  return 'Giảng viên';
}

export function TeacherHeader({ onToggleSidebar }: TeacherHeaderProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click, touchstart, and Escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDropdownOpen]);

  const handleLogout = async () => {
    setIsDropdownOpen(false);
    try {
      await logout();
      toast.success('Đã đăng xuất thành công!');
      router.push('/');
    } catch {
      toast.error('Có lỗi xảy ra khi đăng xuất.');
    }
  };

  const closeDropdown = () => {
    setIsDropdownOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 lg:left-72 right-0 h-16 bg-white/95 dark:bg-[#17141f]/95 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 px-4 md:px-6 flex items-center justify-between gap-4 border-b border-[#f1ebff] dark:border-[#2b2438] transition-colors duration-150">
      {/* Left: Mobile Menu & Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onToggleSidebar}
          aria-label="Mở menu quản trị"
          className="lg:hidden p-2 rounded-lg text-[#635a72] dark:text-[#cdc3d4] hover:bg-[#f7f1ff] dark:hover:bg-[#221d2d] transition-colors cursor-pointer shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <TeacherBreadcrumb />
        </div>
      </div>

      {/* Right: Actions, Theme, Notifications & Teacher Profile */}
      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        {/* Switch to Student Mode Quick Button (Desktop) */}
        <Link
          href="/"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#7240b8] dark:text-[#a87ffb] bg-[#f7f1ff] dark:bg-[#2b2438] hover:bg-[#ebdffa] dark:hover:bg-[#352c48] transition-colors border border-[#7240b8]/15"
          title="Chuyển sang giao diện Học viên"
        >
          <GraduationCap className="w-4 h-4" />
          <span>Chế độ Học viên</span>
        </Link>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Notification Popover */}
        <NotificationPopover />

        <div className="h-6 w-px bg-[#f1ebff] dark:bg-[#2b2438] hidden sm:block" />

        {/* Teacher Profile Pill / Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            id="teacher-profile-button"
            aria-expanded={isDropdownOpen}
            aria-haspopup="true"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2.5 p-1 rounded-full sm:rounded-xl hover:bg-[#f7f1ff] dark:hover:bg-[#221d2d] transition-colors cursor-pointer group"
          >
            {user?.avatar && !avatarError ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                alt={user.username || 'Giảng viên'}
                src={user.avatar}
                onError={() => setAvatarError(true)}
                className="w-9 h-9 rounded-full object-cover ring-2 ring-[#7240b8]/30 shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-[#7240b8] dark:bg-[#a87ffb] text-white dark:text-[#1c192c] flex items-center justify-center text-xs font-bold ring-2 ring-[#7240b8]/30 shrink-0">
                {getInitials(user?.username)}
              </div>
            )}

            <div className="hidden md:flex flex-col text-left pr-2">
              <span className="text-xs font-bold text-[#1c192c] dark:text-[#f4eeff] truncate max-w-[140px] leading-tight">
                {user?.username || 'Giảng viên'}
              </span>
              <span className="text-[10px] font-semibold text-[#7240b8] dark:text-[#a87ffb]">
                {formatRole(user?.role)}
              </span>
            </div>
          </button>

          {/* Profile Dropdown */}
          {isDropdownOpen && (
            <div
              role="menu"
              aria-orientation="vertical"
              aria-labelledby="teacher-profile-button"
              className="absolute right-0 top-full mt-2 w-64 rounded-xl bg-white dark:bg-[#1d1926] shadow-[0_12px_28px_rgba(0,0,0,0.12),0_4px_10px_rgba(0,0,0,0.06)] dark:shadow-2xl border border-[#f1ebff] dark:border-[#352e43] py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
            >
              {/* Header Info */}
              <div className="px-4 py-2.5 border-b border-[#f7f1ff] dark:border-[#2b2438] flex items-center gap-3">
                {user?.avatar && !avatarError ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    alt={user.username || 'Giảng viên'}
                    src={user.avatar}
                    onError={() => setAvatarError(true)}
                    className="w-10 h-10 rounded-full object-cover ring-1 ring-[#e6dffa] dark:ring-[#352e43] shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#7240b8] text-white flex items-center justify-center text-sm font-bold shrink-0">
                    {getInitials(user?.username)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-[#1c192c] dark:text-[#f4eeff] truncate">
                    {user?.username || 'Giảng viên TMdemy'}
                  </p>
                  <p className="text-xs text-[#635a72] dark:text-[#a9a0b2] truncate">
                    {user?.email}
                  </p>
                  <span className="inline-block mt-0.5 text-[10px] font-semibold text-[#7240b8] dark:text-[#a87ffb] bg-[#f7f1ff] dark:bg-[#2b2438] px-1.5 py-0.2 rounded">
                    {formatRole(user?.role)}
                  </span>
                </div>
              </div>

              {/* Navigation Items */}
              <div className="py-1.5">
                {/* Switch to Admin Mode for Admins */}
                {user?.role === 'admin' && (
                  <Link
                    href="/admin/dashboard"
                    onClick={closeDropdown}
                    role="menuitem"
                    className="flex items-center justify-between px-4 py-2.5 text-[13px] font-semibold text-[#7240b8] dark:text-[#a87ffb] bg-[#f7f1ff]/70 dark:bg-[#2b2438]/50 hover:bg-[#ebdffa] dark:hover:bg-[#352c48] transition-colors mb-1"
                  >
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck className="w-4 h-4 text-[#7240b8] dark:text-[#a87ffb]" />
                      <span>Cổng Quản Trị</span>
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary text-white">
                      Admin
                    </span>
                  </Link>
                )}

                {/* Switch to Student Mode */}
                <Link
                  href="/"
                  onClick={closeDropdown}
                  role="menuitem"
                  className="flex items-center justify-between px-4 py-2.5 text-[13px] font-semibold text-[#7240b8] dark:text-[#a87ffb] bg-[#f7f1ff]/70 dark:bg-[#2b2438]/50 hover:bg-[#ebdffa] dark:hover:bg-[#352c48] transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <GraduationCap className="w-4 h-4 text-[#7240b8] dark:text-[#a87ffb]" />
                    <span>Chế độ Học viên</span>
                  </div>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary text-white">
                    Chuyển
                  </span>
                </Link>

                <Link
                  href="/profile"
                  onClick={closeDropdown}
                  role="menuitem"
                  className="flex items-center gap-2.5 px-4 py-2 text-[13px] font-medium text-[#1c192c] dark:text-[#f4eeff] hover:bg-[#f7f1ff] dark:hover:bg-[#221d2d] hover:text-[#7240b8] dark:hover:text-[#a87ffb] transition-colors"
                >
                  <UserIcon className="w-4 h-4 text-[#7240b8] dark:text-[#a87ffb]" />
                  <span>Hồ sơ cá nhân</span>
                </Link>

                <Link
                  href="/settings"
                  onClick={closeDropdown}
                  role="menuitem"
                  className="flex items-center gap-2.5 px-4 py-2 text-[13px] font-medium text-[#1c192c] dark:text-[#f4eeff] hover:bg-[#f7f1ff] dark:hover:bg-[#221d2d] hover:text-[#7240b8] dark:hover:text-[#a87ffb] transition-colors"
                >
                  <SettingsIcon className="w-4 h-4 text-[#7240b8] dark:text-[#a87ffb]" />
                  <span>Cài đặt</span>
                </Link>
              </div>

              {/* Logout Action */}
              <div className="border-t border-[#f7f1ff] dark:border-[#2b2438] pt-1">
                <button
                  type="button"
                  onClick={handleLogout}
                  role="menuitem"
                  className="w-full text-left flex items-center gap-2.5 px-4 py-2 text-[13px] font-semibold text-[#ba1a1a] dark:text-[#ffb4ab] hover:bg-[#ffdad6]/30 dark:hover:bg-[#ffdad6]/10 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
