'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useNotifications } from '@/hooks/use-notifications';
import { NotificationItem } from './notification-item';

export function NotificationPopover() {
  const [isOpen, setIsOpen] = useState(false);
  const [filterTab, setFilterTab] = useState<'ALL' | 'UNREAD'>('ALL');
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    refresh,
  } = useNotifications();

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const displayedNotifications =
    filterTab === 'UNREAD'
      ? notifications.filter((n) => !n.isRead && !n.read)
      : notifications;

  return (
    <div className="relative" ref={containerRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={`Thông báo ${unreadCount > 0 ? `(${unreadCount} chưa đọc)` : ''}`}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className="relative p-2 rounded-lg text-[#4b4452] dark:text-[#cdc3d4] hover:bg-[#f7f1ff] dark:hover:bg-[#221d2d] hover:text-[#1c192c] dark:hover:text-[#f4eeff] transition-colors cursor-pointer select-none"
      >
        <span className="material-symbols-outlined text-[22px]">notifications</span>

        {/* Dynamic Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-bold text-white bg-[#7240b8] dark:bg-[#a87ffb] dark:text-[#17141f] rounded-full ring-2 ring-white dark:ring-[#17141f] shadow-xs">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown Panel */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Hộp thông báo"
          className="absolute right-0 mt-2 w-[340px] sm:w-[380px] bg-white dark:bg-[#1a1622] rounded-2xl shadow-xl border border-[#ece4f8] dark:border-[#2f273d] overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150 origin-top-right"
        >
          {/* Header */}
          <div className="p-3.5 border-b border-[#f3edfd] dark:border-[#2b2438] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-[#1c192c] dark:text-[#f4eeff]">
                Thông báo
              </h3>
              {unreadCount > 0 ? (
                <span className="px-2 py-0.5 rounded-full bg-[#ede4f9] dark:bg-[#352b47] text-[#7240b8] dark:text-[#a87ffb] text-[11px] font-bold">
                  {unreadCount} mới
                </span>
              ) : (
                <span className="text-[11px] text-[#8c8296] dark:text-[#a094aa]">
                  Đã đọc hết
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => void refresh()}
                disabled={isLoading}
                title="Làm mới"
                aria-label="Làm mới thông báo"
                className="p-1 rounded-md text-[#8c8296] hover:text-[#7240b8] dark:hover:text-[#a87ffb] hover:bg-[#ede4f9] dark:hover:bg-[#2b2438] transition-colors cursor-pointer disabled:opacity-50"
              >
                <span
                  className={`material-symbols-outlined text-[18px] ${
                    isLoading ? 'animate-spin' : ''
                  }`}
                >
                  refresh
                </span>
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex border-b border-[#f3edfd] dark:border-[#2b2438] bg-[#fbf9ff] dark:bg-[#1f1a29]/60 px-3 py-1.5 gap-2">
            <button
              type="button"
              onClick={() => setFilterTab('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterTab === 'ALL'
                  ? 'bg-white dark:bg-[#2b2438] text-[#7240b8] dark:text-[#a87ffb] shadow-2xs'
                  : 'text-[#635a72] dark:text-[#cdc3d4] hover:text-[#1c192c] dark:hover:text-[#f4eeff]'
              }`}
            >
              Tất cả ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('UNREAD')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterTab === 'UNREAD'
                  ? 'bg-white dark:bg-[#2b2438] text-[#7240b8] dark:text-[#a87ffb] shadow-2xs'
                  : 'text-[#635a72] dark:text-[#cdc3d4] hover:text-[#1c192c] dark:hover:text-[#f4eeff]'
              }`}
            >
              Chưa đọc ({unreadCount})
            </button>
          </div>

          {/* Notification List Container */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-[#f7f1ff] dark:divide-[#2b2438]">
            {/* Loading State */}
            {isLoading && notifications.length === 0 && (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-start gap-3 animate-pulse">
                    <div className="w-8 h-8 rounded-full bg-[#f1ebff] dark:bg-[#2b2438] shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-[#f1ebff] dark:bg-[#2b2438] rounded-xs w-2/3" />
                      <div className="h-2.5 bg-[#f1ebff] dark:bg-[#2b2438] rounded-xs w-full" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Error State */}
            {!isLoading && error && (
              <div className="p-6 text-center">
                <span className="material-symbols-outlined text-[36px] text-amber-500 mb-1">
                  error_outline
                </span>
                <p className="text-xs text-[#8c8296] dark:text-[#a094aa] mb-3">
                  {error}
                </p>
                <button
                  type="button"
                  onClick={() => void refresh()}
                  className="px-3 py-1.5 rounded-lg bg-[#7240b8] text-white dark:bg-[#a87ffb] dark:text-[#17141f] text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer"
                >
                  Thử lại
                </button>
              </div>
            )}

            {/* Empty State */}
            {!isLoading && !error && displayedNotifications.length === 0 && (
              <div className="py-10 px-4 text-center">
                <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-[#f5eeff] dark:bg-[#2b2438] flex items-center justify-center text-[#7240b8] dark:text-[#a87ffb]">
                  <span className="material-symbols-outlined text-[24px]">
                    notifications_off
                  </span>
                </div>
                <p className="text-xs font-medium text-[#1c192c] dark:text-[#f4eeff]">
                  {filterTab === 'UNREAD'
                    ? 'Bạn đã đọc hết thông báo'
                    : 'Chưa có thông báo nào'}
                </p>
                <p className="text-[11px] text-[#8c8296] dark:text-[#a094aa] mt-0.5">
                  {filterTab === 'UNREAD'
                    ? 'Tất cả thông báo mới sẽ xuất hiện tại đây.'
                    : 'Các hoạt động liên quan đến khóa học và tài khoản sẽ hiển thị ở đây.'}
                </p>
              </div>
            )}

            {/* Notifications List */}
            {displayedNotifications.map((notif) => (
              <NotificationItem
                key={notif.id || notif._id}
                notification={notif}
                compact={true}
                onItemClick={() => setIsOpen(false)}
              />
            ))}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-[#fbf9ff] dark:bg-[#1f1a29]/60 border-t border-[#f3edfd] dark:border-[#2b2438] text-center">
            <Link
              href="/notifications"
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#7240b8] dark:text-[#a87ffb] hover:underline"
            >
              <span>Xem tất cả thông báo</span>
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
