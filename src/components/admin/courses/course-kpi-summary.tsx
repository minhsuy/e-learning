'use client';

import React from 'react';
import { BookOpen, Clock, CheckCircle2, XCircle, ArrowUpRight } from 'lucide-react';
import { AdminCourseKpis } from '@/types/admin-course';
import { cn } from '@/lib/utils';

interface CourseKpiSummaryProps {
  kpis: AdminCourseKpis;
  loading: boolean;
  selectedStatus?: string;
  onSelectStatus?: (status: string) => void;
}

export function CourseKpiSummary({
  kpis,
  loading,
  selectedStatus,
  onSelectStatus,
}: CourseKpiSummaryProps) {
  const cards = [
    {
      id: 'all',
      label: 'Tổng số khóa học',
      value: kpis.totalCourses,
      icon: BookOpen,
      iconBg: 'bg-[#f7f1ff] dark:bg-[#2b2438]',
      iconColor: 'text-[#7240b8] dark:text-[#a87ffb]',
      borderColor: 'hover:border-[#7240b8]/40 dark:hover:border-[#a87ffb]/40',
      activeBorder: 'border-[#7240b8] dark:border-[#a87ffb] ring-2 ring-[#7240b8]/20',
      badge: 'Toàn hệ thống',
      badgeColor: 'bg-[#f7f1ff] dark:bg-[#2b2438] text-[#7240b8] dark:text-[#a87ffb]',
    },
    {
      id: 'pending',
      label: 'Chờ phê duyệt',
      value: kpis.pendingCourses,
      icon: Clock,
      iconBg: 'bg-amber-50 dark:bg-amber-950/40',
      iconColor: 'text-amber-600 dark:text-amber-400',
      borderColor: 'hover:border-amber-300 dark:hover:border-amber-700/50',
      activeBorder: 'border-amber-500 ring-2 ring-amber-500/20',
      badge: 'Cần thẩm định',
      badgeColor: 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300',
    },
    {
      id: 'approved',
      label: 'Đã phê duyệt',
      value: kpis.approvedCourses,
      icon: CheckCircle2,
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/40',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      borderColor: 'hover:border-emerald-300 dark:hover:border-emerald-700/50',
      activeBorder: 'border-emerald-500 ring-2 ring-emerald-500/20',
      badge: 'Đang mở bán',
      badgeColor: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300',
    },
    {
      id: 'rejected',
      label: 'Bị từ chối',
      value: kpis.rejectedCourses,
      icon: XCircle,
      iconBg: 'bg-rose-50 dark:bg-rose-950/40',
      iconColor: 'text-rose-600 dark:text-rose-400',
      borderColor: 'hover:border-rose-300 dark:hover:border-rose-700/50',
      activeBorder: 'border-rose-500 ring-2 ring-rose-500/20',
      badge: 'Cần sửa đổi',
      badgeColor: 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const isActive = selectedStatus === card.id;

        return (
          <button
            key={card.id}
            type="button"
            onClick={() => onSelectStatus?.(card.id)}
            className={cn(
              'p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#1d1926] border border-[#f1ebff] dark:border-[#2b2438] text-left transition-all duration-200 group relative overflow-hidden shadow-xs',
              card.borderColor,
              isActive && card.activeBorder
            )}
          >
            <div className="flex items-center justify-between gap-2 mb-3">
              <div
                className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110 shrink-0',
                  card.iconBg,
                  card.iconColor
                )}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span
                className={cn(
                  'px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide shrink-0',
                  card.badgeColor
                )}
              >
                {card.badge}
              </span>
            </div>

            <p className="text-xs font-medium text-[#635a72] dark:text-[#a9a0b2] line-clamp-1">
              {card.label}
            </p>

            <div className="flex items-baseline justify-between mt-1">
              <div className="text-2xl sm:text-3xl font-extrabold text-[#1c192c] dark:text-[#f4eeff] tracking-tight">
                {loading ? (
                  <div className="h-8 w-16 bg-[#f1ebff] dark:bg-[#2b2438] rounded-md animate-pulse my-0.5" />
                ) : card.value !== null ? (
                  card.value.toLocaleString('vi-VN')
                ) : (
                  '—'
                )}
              </div>
              <ArrowUpRight
                className={cn(
                  'w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity',
                  isActive && 'opacity-100 text-[#7240b8] dark:text-[#a87ffb]'
                )}
              />
            </div>
          </button>
        );
      })}
    </div>
  );
}
