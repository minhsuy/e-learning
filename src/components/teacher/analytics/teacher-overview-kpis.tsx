'use client';

import React from 'react';
import {
  Banknote,
  Users,
  BookOpen,
  Star,
  CreditCard,
  Gift,
  Info,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { TeacherOverviewData } from '@/types/teacher-statistics';
import { formatTeacherVND } from '@/lib/teacher-analytics';
import { cn } from '@/lib/utils';

interface TeacherOverviewKpisProps {
  data: TeacherOverviewData | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

function fmt(n: number | null | undefined): string {
  if (n === null || n === undefined || isNaN(n)) return '—';
  return new Intl.NumberFormat('vi-VN').format(n);
}

export function TeacherOverviewKpis({
  data,
  loading,
  error,
  onRetry,
}: TeacherOverviewKpisProps) {
  if (error) {
    return (
      <div className="p-5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 text-xs sm:text-sm text-rose-800 dark:text-rose-300">
          <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#7240b8] hover:bg-[#5e3299] text-white text-xs font-semibold shrink-0 cursor-pointer self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Thử lại</span>
        </button>
      </div>
    );
  }

  const revenue = data?.revenue;
  const students = data?.students;
  const courses = data?.courses;
  const rating = data?.rating;

  const hasReviews = Boolean(rating && rating.totalReviews > 0 && rating.averageRating > 0);

  const cards = [
    {
      id: 'revenue',
      label: 'Doanh thu khóa học',
      value: revenue ? formatTeacherVND(revenue.totalRevenue) : '—',
      subtext: revenue
        ? `${fmt(revenue.completedOrders)} đơn hoàn tất • TB ${formatTeacherVND(revenue.averageOrderValue)}/đơn`
        : 'Tổng doanh số các khóa học của bạn',
      badge: 'Toàn thời gian',
      badgeClass: 'bg-[#f7f1ff] dark:bg-[#2b2438] text-[#7240b8] dark:text-[#a87ffb]',
      icon: Banknote,
      iconClass: 'bg-[#f7f1ff] dark:bg-[#2b2438] text-[#7240b8] dark:text-[#a87ffb]',
      highlight: true,
    },
    {
      id: 'students',
      label: 'Tổng học viên',
      value: students ? fmt(students.totalStudents) : '—',
      subtext: students
        ? `${fmt(students.activeStudents)} đang học • ${fmt(students.completedStudents)} hoàn thành`
        : 'Học viên duy nhất đã ghi danh',
      badge: 'Học viên',
      badgeClass: 'bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300',
      icon: Users,
      iconClass: 'bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400',
    },
    {
      id: 'courses',
      label: 'Khóa học của tôi',
      value: courses ? fmt(courses.total) : '—',
      subtext: courses
        ? `${fmt(courses.approved)} đã duyệt • ${fmt(courses.pending)} chờ duyệt • ${fmt(courses.rejected)} từ chối`
        : 'Khóa học đang hoạt động',
      badge: 'Danh mục',
      badgeClass: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300',
      icon: BookOpen,
      iconClass: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400',
    },
    {
      id: 'rating',
      label: 'Đánh giá trung bình',
      value: data ? (hasReviews ? `${rating!.averageRating.toFixed(2)} / 5` : 'Chưa có') : '—',
      subtext: rating
        ? `Dựa trên ${fmt(rating.totalReviews)} lượt đánh giá hợp lệ`
        : 'Chất lượng khóa học',
      badge: 'Rating',
      badgeClass: 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300',
      icon: Star,
      iconClass: 'bg-amber-50 dark:bg-amber-950/40 text-amber-500',
    },
    {
      id: 'paidOrders',
      label: 'Đơn trả phí',
      value: revenue ? fmt(revenue.paidOrders ?? null) : '—',
      subtext: 'Đơn hoàn tất có tổng tiền > 0 ₫',
      badge: 'Có phí',
      badgeClass: 'bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300',
      icon: CreditCard,
      iconClass: 'bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400',
    },
    {
      id: 'freeOrders',
      label: 'Đơn miễn phí',
      value: revenue ? fmt(revenue.freeOrders ?? null) : '—',
      subtext: 'Đóng góp 0 ₫ vào doanh thu tiền tệ',
      badge: '0 ₫',
      badgeClass: 'bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300',
      icon: Gift,
      iconClass: 'bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400',
    },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              className={cn(
                'p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#1d1926] border shadow-xs transition-all',
                card.highlight
                  ? 'border-[#7240b8]/35 dark:border-[#a87ffb]/40 ring-1 ring-[#7240b8]/10'
                  : 'border-[#f1ebff] dark:border-[#2b2438]'
              )}
            >
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', card.iconClass)}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full', card.badgeClass)}>
                  {card.badge}
                </span>
              </div>

              <p className="text-xs font-medium text-[#635a72] dark:text-[#a9a0b2]">{card.label}</p>
              {loading ? (
                <div className="h-7 w-28 bg-[#f1ebff] dark:bg-[#2b2438] animate-pulse rounded-md mt-1.5" />
              ) : (
                <p className="text-xl sm:text-2xl font-bold text-[#1c192c] dark:text-[#f4eeff] tracking-tight mt-1">
                  {card.value}
                </p>
              )}
              <p className="text-[11px] text-[#8e849e] dark:text-[#8d8299] mt-1.5 leading-snug">
                {card.subtext}
              </p>
            </div>
          );
        })}
      </div>

      {/* Non-Commission / Sales Attribution Disclaimer */}
      <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-[#f7f1ff]/70 dark:bg-[#1d1926] border border-[#e6dffa] dark:border-[#2b2438] text-xs text-[#635a72] dark:text-[#a9a0b2]">
        <Info className="w-4 h-4 text-[#7240b8] dark:text-[#a87ffb] shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-[#1c192c] dark:text-[#f4eeff]">Lưu ý về doanh thu giảng viên:</strong>{' '}
          Chỉ tiêu <strong>Doanh thu khóa học</strong> phản ánh tổng doanh số đơn hàng hoàn tất (<code className="font-mono text-[11px]">SUM(Order.total)</code>) từ các khóa học do bạn giảng dạy (sales attribution) —{' '}
          <strong>không phải hoa hồng, thu nhập ròng, số dư ví hay số tiền có thể rút</strong>. Doanh số lịch sử của các khóa học đã lưu trữ vẫn được bảo toàn.
        </p>
      </div>
    </div>
  );
}
