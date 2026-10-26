'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, LogOut, User as UserIcon, BookOpen, Award, Settings as SettingsIcon, ShoppingBag, Bell, Trophy, GraduationCap, ShieldCheck } from 'lucide-react';
import { ThemeToggle } from '@/components/common/theme-toggle';
import { NotificationPopover } from '@/components/notification/notification-popover';
import { useAuth } from '@/hooks/use-auth';
import { useGamificationOverview } from '@/hooks/use-gamification';
import { toast } from '@/lib/toast';

interface HeaderProps {
  onToggleSidebar?: () => void;
}

function getInitials(name?: string): string {
  if (!name) return 'TM';
  const clean = name.trim();
  const parts = clean.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
}

function formatRole(role?: string): string {
  if (!role) return 'Học viên';
  const r = role.toLowerCase();
  if (r === 'admin') return 'Quản trị viên';
  if (r === 'teacher') return 'Giảng viên';
  return 'Học viên';
}

export function DashboardHeader({ onToggleSidebar }: HeaderProps) {
  const router = useRouter();
  const { user, status, isAuthenticated, logout } = useAuth();
  const { xpSummary, streak, hasStudiedToday } = useGamificationOverview();
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
      {/* Mobile Hamburger Button */}
      <button
        onClick={onToggleSidebar}
        aria-label="Mở thanh điều hướng"
        className="lg:hidden p-2 rounded-lg text-[#635a72] dark:text-[#cdc3d4] hover:bg-[#f7f1ff] dark:hover:bg-[#221d2d] transition-colors cursor-pointer"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Search Bar Input */}
      <div className="relative flex-1 max-w-lg">
        <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7c7483] dark:text-[#968e9e] text-[20px] pointer-events-none">
          search
        </span>
        <input
          type="text"
          placeholder="Tìm kiếm khóa học, giảng viên, chủ đề..."
          className="w-full h-10 pl-10 pr-20 bg-[#f7f1ff] dark:bg-[#221d2d] rounded-lg text-xs md:text-sm text-[#1c192c] dark:text-[#f4eeff] placeholder:text-[#7c7483] dark:placeholder:text-[#968e9e] focus:outline-none focus:bg-white dark:focus:bg-[#1d1926] focus:ring-1 focus:ring-[#7240b8] dark:focus:ring-[#a87ffb] shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-all border border-transparent dark:border-[#352e43]"
        />
        <div className="hidden sm:flex absolute right-2.5 top-1/2 -translate-y-1/2 items-center px-1.5 py-0.5 rounded bg-[#ebe5ff] dark:bg-[#2b2438] text-[#4b4452] dark:text-[#cdc3d4] text-[11px] font-semibold">
          Ctrl + K
        </div>
      </div>

      {/* Right User & Utility Items */}
      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        {/* Streak Badge (Only for Authenticated Users) */}
        {isAuthenticated && (
          <Link
            href="/leaderboard"
            title={
              hasStudiedToday
                ? 'Hôm nay bạn đã duy trì chuỗi học!'
                : 'Hôm nay chưa học. Vào học để giữ chuỗi ngày học liên tục!'
            }
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all border ${
              hasStudiedToday
                ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700 shadow-2xs hover:scale-105'
                : 'bg-[#e7dbf7] dark:bg-[#2b2438] text-[#675f76] dark:text-[#cdc3d4] border-transparent hover:border-[#7240b8]'
            }`}
          >
            <span
              className={`material-symbols-outlined text-[20px] ${
                hasStudiedToday
                  ? 'text-amber-500 animate-pulse'
                  : 'text-[#7240b8] dark:text-[#a87ffb]'
              }`}
            >
              local_fire_department
            </span>
            <span className="text-xs font-semibold">
              {streak?.currentStreak ?? 0} ngày Streak
            </span>
          </Link>
        )}

        {/* Global Theme Toggle */}
        <ThemeToggle />

        {/* Notification Bell (Only for Authenticated Users) */}
        {isAuthenticated && <NotificationPopover />}

        {/* Auth / User Section */}
        {status === 'loading' ? (
          /* Subtle skeleton to prevent layout flicker */
          <div className="flex items-center gap-2 px-2 py-1">
            <div className="w-8 h-8 rounded-full bg-[#f1ebff] dark:bg-[#2b2438] animate-pulse" />
            <div className="hidden md:flex flex-col gap-1">
              <div className="w-16 h-3 bg-[#f1ebff] dark:bg-[#2b2438] rounded-xs animate-pulse" />
              <div className="w-10 h-2 bg-[#f1ebff] dark:bg-[#2b2438] rounded-xs animate-pulse" />
            </div>
          </div>
        ) : isAuthenticated && user ? (
          /* Authenticated User Menu with Interactive Dropdown */
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              aria-expanded={isDropdownOpen}
              aria-haspopup="true"
              aria-label="Mở menu người dùng"
              id="user-menu-button"
              className="flex items-center gap-2 md:pl-2 p-1 rounded-xl hover:bg-[#f7f1ff] dark:hover:bg-[#221d2d] transition-all cursor-pointer select-none"
            >
              {user.avatar && !avatarError ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  alt={user.username || 'Avatar'}
                  src={user.avatar}
                  onError={() => setAvatarError(true)}
                  className="w-8 h-8 rounded-full object-cover ring-1 ring-[#e6dffa] dark:ring-[#352e43]"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#7240b8] text-white flex items-center justify-center text-xs font-bold ring-1 ring-[#e6dffa] dark:ring-[#352e43] shrink-0">
                  {getInitials(user.username)}
                </div>
              )}

              <div className="hidden md:flex flex-col text-left max-w-[120px]">
                <span className="text-xs font-semibold text-[#1c192c] dark:text-[#f4eeff] leading-tight truncate">
                  {user.username}
                </span>
                <span className="text-[11px] text-[#635a72] dark:text-[#a9a0b2] leading-tight">
                  {formatRole(user.role)}
                </span>
              </div>

              <span
                className={`hidden md:inline-block material-symbols-outlined text-[#635a72] dark:text-[#a9a0b2] text-[18px] transition-transform duration-200 ${
                  isDropdownOpen ? 'rotate-180' : ''
                }`}
              >
                expand_more
              </span>
            </button>

            {/* User Dropdown Menu */}
            {isDropdownOpen && (
              <div
                role="menu"
                aria-orientation="vertical"
                aria-labelledby="user-menu-button"
                className="absolute right-0 top-full mt-2 w-64 rounded-xl bg-white dark:bg-[#1d1926] shadow-[0_12px_28px_rgba(0,0,0,0.12),0_4px_10px_rgba(0,0,0,0.06)] dark:shadow-2xl border border-[#f1ebff] dark:border-[#352e43] py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
              >
                {/* User Identity Header */}
                <div className="px-4 py-2.5 border-b border-[#f7f1ff] dark:border-[#2b2438] flex items-center gap-3">
                  {user.avatar && !avatarError ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      alt={user.username}
                      src={user.avatar}
                      onError={() => setAvatarError(true)}
                      className="w-10 h-10 rounded-full object-cover ring-1 ring-[#e6dffa] dark:ring-[#352e43] shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#7240b8] text-white flex items-center justify-center text-sm font-bold shrink-0">
                      {getInitials(user.username)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-[#1c192c] dark:text-[#f4eeff] truncate">
                      {user.username}
                    </p>
                    <p className="text-xs text-[#635a72] dark:text-[#a9a0b2] truncate">
                      {user.email}
                    </p>
                    <span className="inline-block mt-0.5 text-[10px] font-semibold text-[#7240b8] dark:text-[#a87ffb] bg-[#f7f1ff] dark:bg-[#2b2438] px-1.5 py-0.2 rounded-xs">
                      {formatRole(user.role)}
                    </span>
                  </div>
                </div>

                {/* Gamification Quick Strip */}
                {xpSummary && (
                  <div className="px-4 py-2 border-b border-[#f7f1ff] dark:border-[#2b2438] bg-[#fdf8ff] dark:bg-[#181420] text-xs flex items-center justify-between">
                    <span className="font-bold text-[#7240b8] dark:text-[#a87ffb]">
                      ⭐ {xpSummary.xpTotal.toLocaleString()} XP
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-[#eddcff] dark:bg-[#2b2438] text-[#5b27a1] dark:text-[#d6c4ff] text-[10px] font-bold">
                      {xpSummary.rank.name}
                    </span>
                  </div>
                )}

                {/* Navigation Items */}
                <div className="py-1.5">
                  {/* Switch to Admin Mode for Admins */}
                  {user.role === 'admin' && (
                    <div className="pb-1.5 mb-1.5 border-b border-[#f7f1ff] dark:border-[#2b2438]">
                      <Link
                        href="/admin/dashboard"
                        onClick={closeDropdown}
                        role="menuitem"
                        className="flex items-center justify-between px-4 py-2 text-[13px] font-semibold text-[#7240b8] dark:text-[#a87ffb] bg-[#f7f1ff] dark:bg-[#2b2438]/60 hover:bg-[#ebdffa] dark:hover:bg-[#352c48] transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <ShieldCheck className="w-4 h-4 text-[#7240b8] dark:text-[#a87ffb]" />
                          <span>Cổng Quản Trị</span>
                        </div>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary text-white">
                          Admin
                        </span>
                      </Link>
                    </div>
                  )}

                  {/* Switch to Teacher Mode for Teachers */}
                  {user.role === 'teacher' && (
                    <div className="pb-1.5 mb-1.5 border-b border-[#f7f1ff] dark:border-[#2b2438]">
                      <Link
                        href="/teacher/dashboard"
                        onClick={closeDropdown}
                        role="menuitem"
                        className="flex items-center justify-between px-4 py-2 text-[13px] font-semibold text-[#7240b8] dark:text-[#a87ffb] bg-[#f7f1ff] dark:bg-[#2b2438]/60 hover:bg-[#ebdffa] dark:hover:bg-[#352c48] transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <GraduationCap className="w-4 h-4 text-[#7240b8] dark:text-[#a87ffb]" />
                          <span>Kênh Giảng viên</span>
                        </div>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary text-white">
                          Chuyển
                        </span>
                      </Link>
                    </div>
                  )}

                  <Link
                    href="/leaderboard"
                    onClick={closeDropdown}
                    role="menuitem"
                    className="flex items-center gap-2.5 px-4 py-2 text-[13px] font-medium text-[#1c192c] dark:text-[#f4eeff] hover:bg-[#f7f1ff] dark:hover:bg-[#221d2d] hover:text-[#7240b8] dark:hover:text-[#a87ffb] transition-colors"
                  >
                    <Trophy className="w-4 h-4 text-[#7240b8] dark:text-[#a87ffb]" />
                    <span>Bảng xếp hạng</span>
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
                    href="/my-courses"
                    onClick={closeDropdown}
                    role="menuitem"
                    className="flex items-center gap-2.5 px-4 py-2 text-[13px] font-medium text-[#1c192c] dark:text-[#f4eeff] hover:bg-[#f7f1ff] dark:hover:bg-[#221d2d] hover:text-[#7240b8] dark:hover:text-[#a87ffb] transition-colors"
                  >
                    <BookOpen className="w-4 h-4 text-[#7240b8] dark:text-[#a87ffb]" />
                    <span>Khóa học của tôi</span>
                  </Link>
                  <Link
                    href="/orders"
                    onClick={closeDropdown}
                    role="menuitem"
                    className="flex items-center gap-2.5 px-4 py-2 text-[13px] font-medium text-[#1c192c] dark:text-[#f4eeff] hover:bg-[#f7f1ff] dark:hover:bg-[#221d2d] hover:text-[#7240b8] dark:hover:text-[#a87ffb] transition-colors"
                  >
                    <ShoppingBag className="w-4 h-4 text-[#7240b8] dark:text-[#a87ffb]" />
                    <span>Đơn hàng của tôi</span>
                  </Link>
                  <Link
                    href="/certificates"
                    onClick={closeDropdown}
                    role="menuitem"
                    className="flex items-center gap-2.5 px-4 py-2 text-[13px] font-medium text-[#1c192c] dark:text-[#f4eeff] hover:bg-[#f7f1ff] dark:hover:bg-[#221d2d] hover:text-[#7240b8] dark:hover:text-[#a87ffb] transition-colors"
                  >
                    <Award className="w-4 h-4 text-[#7240b8] dark:text-[#a87ffb]" />
                    <span>Chứng chỉ</span>
                  </Link>
                  <Link
                    href="/notifications"
                    onClick={closeDropdown}
                    role="menuitem"
                    className="flex items-center gap-2.5 px-4 py-2 text-[13px] font-medium text-[#1c192c] dark:text-[#f4eeff] hover:bg-[#f7f1ff] dark:hover:bg-[#221d2d] hover:text-[#7240b8] dark:hover:text-[#a87ffb] transition-colors"
                  >
                    <Bell className="w-4 h-4 text-[#7240b8] dark:text-[#a87ffb]" />
                    <span>Thông báo</span>
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
        ) : (
          /* Guest Buttons: Login & Register */
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="px-3 py-1.5 rounded-lg text-xs md:text-[13px] font-semibold text-[#7240b8] dark:text-[#a87ffb] hover:bg-[#f7f1ff] dark:hover:bg-[#221d2d] transition-colors"
            >
              Đăng nhập
            </Link>
            <Link
              href="/register"
              className="px-3.5 py-1.5 rounded-lg text-xs md:text-[13px] font-semibold bg-[#7240b8] hover:bg-[#5f339d] text-white shadow-xs transition-colors"
            >
              Đăng ký
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
