'use client';

import React from 'react';
import {
  Users,
  TrendingUp,
  DollarSign,
  Star,
  CheckCircle2,
  FileCheck,
} from 'lucide-react';
import { TeacherCoursePerformanceOverview } from '@/types/teacher-statistics';

interface PerformanceKpiCardsProps {
  overview?: TeacherCoursePerformanceOverview | null;
  isLoading?: boolean;
}

function formatVND(amount?: number): string {
  if (amount === undefined || amount === null) return '0 đ';
  return `${Math.round(amount).toLocaleString('vi-VN')} đ`;
}

export function PerformanceKpiCards({ overview, isLoading = false }: PerformanceKpiCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="rounded-2xl bg-white dark:bg-[#1d1926] border border-[#eceaf3] dark:border-[#352e43] p-4 space-y-3 animate-pulse shadow-xs"
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800" />
              <div className="w-10 h-3 bg-slate-100 dark:bg-slate-800 rounded" />
            </div>
            <div className="h-6 w-20 bg-slate-100 dark:bg-slate-800 rounded" />
            <div className="h-3 w-28 bg-slate-50 dark:bg-slate-850 rounded" />
          </div>
        ))}
      </div>
    );
  }

  const students = overview?.students;
  const revenue = overview?.revenue;
  const engagement = overview?.engagement;

  const totalStudents = students?.totalStudents || 0;
  const activeStudents = students?.activeStudents || 0;
  const completedStudents = students?.completedStudents || 0;
  const averageProgress = students?.averageProgress || 0;
  const completionRate = students?.completionRate || 0;

  const totalRevenue = revenue?.totalRevenue || 0;
  const completedOrders = revenue?.completedOrders || 0;

  const averageRating = engagement?.averageRating || 0;
  const totalReviews = engagement?.totalReviews || 0;
  const certificatesIssued = engagement?.certificatesIssued || 0;
  const certificateRate = engagement?.certificateRate || 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
      {/* KPI 1: Tổng học viên */}
      <div className="rounded-2xl bg-white dark:bg-[#1d1926] border border-[#eceaf3] dark:border-[#352e43] p-4 shadow-xs hover:shadow-sm transition-all space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-[#635a72] dark:text-[#a9a0b2]">Tổng học viên</span>
          <div className="w-8 h-8 rounded-xl bg-[#f7f1ff] dark:bg-[#282234] text-[#7240b8] dark:text-[#a87ffb] flex items-center justify-center shrink-0">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-bold text-[#1c192c] dark:text-[#f4eeff]">
          {totalStudents.toLocaleString('vi-VN')}
        </div>
        <div className="text-[11px] text-[#635a72] dark:text-[#a9a0b2] truncate">
          <span className="font-semibold text-[#7240b8] dark:text-[#a87ffb]">{activeStudents}</span> đang học •{' '}
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">{completedStudents}</span> xong
        </div>
      </div>

      {/* KPI 2: Tiến độ trung bình */}
      <div className="rounded-2xl bg-white dark:bg-[#1d1926] border border-[#eceaf3] dark:border-[#352e43] p-4 shadow-xs hover:shadow-sm transition-all space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-[#635a72] dark:text-[#a9a0b2]">Tiến độ TB</span>
          <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-bold text-[#7240b8] dark:text-[#a87ffb]">
          {averageProgress}%
        </div>
        <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mt-1">
          <div
            className="h-full rounded-full bg-[#7240b8] dark:bg-[#a87ffb] transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(0, averageProgress))}%` }}
          />
        </div>
      </div>

      {/* KPI 3: Tỷ lệ hoàn thành */}
      <div className="rounded-2xl bg-white dark:bg-[#1d1926] border border-[#eceaf3] dark:border-[#352e43] p-4 shadow-xs hover:shadow-sm transition-all space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-[#635a72] dark:text-[#a9a0b2]">Tỷ lệ hoàn thành</span>
          <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">
          {completionRate}%
        </div>
        <div className="text-[11px] text-[#635a72] dark:text-[#a9a0b2] truncate">
          {completedStudents} / {totalStudents} học viên
        </div>
      </div>

      {/* KPI 4: Doanh thu khóa học */}
      <div className="rounded-2xl bg-white dark:bg-[#1d1926] border border-[#eceaf3] dark:border-[#352e43] p-4 shadow-xs hover:shadow-sm transition-all space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-[#635a72] dark:text-[#a9a0b2]">Doanh thu</span>
          <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="text-base sm:text-lg font-bold text-[#1c192c] dark:text-[#f4eeff] truncate">
          {formatVND(totalRevenue)}
        </div>
        <div className="text-[11px] text-[#635a72] dark:text-[#a9a0b2] truncate">
          Từ {completedOrders} đơn hàng
        </div>
      </div>

      {/* KPI 5: Đánh giá trung bình */}
      <div className="rounded-2xl bg-white dark:bg-[#1d1926] border border-[#eceaf3] dark:border-[#352e43] p-4 shadow-xs hover:shadow-sm transition-all space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-[#635a72] dark:text-[#a9a0b2]">Đánh giá TB</span>
          <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center shrink-0">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
          </div>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400">
            {averageRating > 0 ? averageRating.toFixed(1) : 'Chưa có'}
          </span>
          {averageRating > 0 && <span className="text-xs text-slate-400">/ 5.0</span>}
        </div>
        <div className="text-[11px] text-[#635a72] dark:text-[#a9a0b2] truncate">
          {totalReviews} lượt đánh giá
        </div>
      </div>

      {/* KPI 6: Chứng chỉ đã cấp */}
      <div className="rounded-2xl bg-white dark:bg-[#1d1926] border border-[#eceaf3] dark:border-[#352e43] p-4 shadow-xs hover:shadow-sm transition-all space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-[#635a72] dark:text-[#a9a0b2]">Chứng chỉ cấp</span>
          <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <FileCheck className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
          {certificatesIssued}
        </div>
        <div className="text-[11px] text-[#635a72] dark:text-[#a9a0b2] truncate">
          {certificateRate}% tỷ lệ nhận
        </div>
      </div>
    </div>
  );
}
