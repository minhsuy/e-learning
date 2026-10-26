'use client';

import React from 'react';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardHeaderProps {
  lastUpdated: Date | null;
  refreshing: boolean;
  onRefresh: () => void;
}

export function DashboardHeader({
  lastUpdated,
  refreshing,
  onRefresh,
}: DashboardHeaderProps) {
  const formatTime = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#f1ebff] dark:border-[#2b2438]">
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <h1 className="text-2xl md:text-3xl font-bold text-[#1c192c] dark:text-[#f4eeff] tracking-tight">
            Bảng điều khiển Trung tâm
          </h1>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#f7f1ff] dark:bg-[#2b2438] text-[#7240b8] dark:text-[#a87ffb] border border-[#7240b8]/20">
            Admin Portal
          </span>
        </div>
        <p className="text-xs sm:text-sm text-[#635a72] dark:text-[#a9a0b2]">
          Giám sát toàn diện người dùng, khóa học chờ duyệt và trạng thái đơn hàng trên nền tảng TMdemy.
        </p>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {/* Status Pill */}
        <div className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Hệ thống: Sẵn sàng</span>
        </div>

        {/* Last updated & Refresh button */}
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="hidden lg:inline text-xs text-[#635a72] dark:text-[#a9a0b2]">
              Cập nhật lúc {formatTime(lastUpdated)}
            </span>
          )}

          <button
            onClick={onRefresh}
            disabled={refreshing}
            className={cn(
              'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-[#1d1926] border border-[#f1ebff] dark:border-[#2b2438] text-[#1c192c] dark:text-[#f4eeff] hover:bg-[#fdf8ff] dark:hover:bg-[#252031] hover:border-[#7240b8]/30 transition-all shadow-xs disabled:opacity-50',
              refreshing && 'cursor-not-allowed'
            )}
            title="Làm mới toàn bộ dữ liệu bảng điều khiển"
          >
            <RefreshCw
              className={cn(
                'w-3.5 h-3.5 text-[#7240b8] dark:text-[#a87ffb]',
                refreshing && 'animate-spin'
              )}
            />
            <span>{refreshing ? 'Đang làm mới...' : 'Làm mới'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
