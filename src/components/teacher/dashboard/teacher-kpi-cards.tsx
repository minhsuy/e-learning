'use client';

import React from 'react';
import { TeacherOverviewData } from '@/types/teacher-statistics';

interface TeacherKpiCardsProps {
  overview?: TeacherOverviewData | null;
  isLoading?: boolean;
}

function formatVND(amount?: number): string {
  if (amount === undefined || amount === null) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function TeacherKpiCards({ overview, isLoading }: TeacherKpiCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-xl p-5 bg-white dark:bg-[#1d1926] border border-[#f1ebff] dark:border-[#352e43] shadow-xs animate-pulse space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 bg-[#f1ebff] dark:bg-[#2b2438] rounded" />
              <div className="w-10 h-10 rounded-lg bg-[#f1ebff] dark:bg-[#2b2438]" />
            </div>
            <div className="h-7 w-36 bg-[#f1ebff] dark:bg-[#2b2438] rounded mt-2" />
            <div className="h-3 w-28 bg-[#f1ebff] dark:bg-[#2b2438] rounded" />
          </div>
        ))}
      </div>
    );
  }

  const revenue = overview?.revenue;
  const students = overview?.students;
  const courses = overview?.courses;
  const rating = overview?.rating;

  return (
    <section aria-label="Chỉ số hoạt động tổng quan" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {/* KPI 1: Tổng doanh thu */}
      <div className="rounded-xl p-5 bg-white dark:bg-[#1d1926] border border-[#ECEAF3] dark:border-[#352e43] shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-[#635a72] dark:text-[#cdc3d4]">
            Tổng doanh thu
          </span>
          <div className="w-10 h-10 rounded-lg bg-[#f7f1ff] dark:bg-[#2b2438] flex items-center justify-center text-[#7240b8] dark:text-[#a87ffb]">
            <span className="material-symbols-outlined text-xl">account_balance_wallet</span>
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="text-2xl font-extrabold text-[#1c192c] dark:text-[#f4eeff] tracking-tight">
            {formatVND(revenue?.totalRevenue)}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[#635a72] dark:text-[#a9a0b2]">
            <span className="inline-flex items-center text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full text-[11px] border border-emerald-200/60 dark:border-emerald-800/40">
              <span className="material-symbols-outlined text-xs mr-0.5">check_circle</span>
              {revenue?.completedOrders || 0} đơn hàng
            </span>
            <span>đã hoàn tất</span>
          </div>
        </div>
      </div>

      {/* KPI 2: Tổng học viên */}
      <div className="rounded-xl p-5 bg-white dark:bg-[#1d1926] border border-[#ECEAF3] dark:border-[#352e43] shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-[#635a72] dark:text-[#cdc3d4]">
            Tổng học viên
          </span>
          <div className="w-10 h-10 rounded-lg bg-[#f7f1ff] dark:bg-[#2b2438] flex items-center justify-center text-[#7240b8] dark:text-[#a87ffb]">
            <span className="material-symbols-outlined text-xl">group</span>
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="text-2xl font-extrabold text-[#1c192c] dark:text-[#f4eeff] tracking-tight">
            {(students?.totalStudents || 0).toLocaleString('vi-VN')} học viên
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[#635a72] dark:text-[#a9a0b2]">
            <span className="inline-flex items-center text-[#7240b8] dark:text-[#a87ffb] font-semibold bg-[#f7f1ff] dark:bg-[#2b2438] px-2 py-0.5 rounded-full text-[11px]">
              <span className="material-symbols-outlined text-xs mr-0.5">school</span>
              {students?.activeStudents || 0} đang học
            </span>
            <span>• {students?.completedStudents || 0} hoàn thành</span>
          </div>
        </div>
      </div>

      {/* KPI 3: Khóa học hoạt động */}
      <div className="rounded-xl p-5 bg-white dark:bg-[#1d1926] border border-[#ECEAF3] dark:border-[#352e43] shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-[#635a72] dark:text-[#cdc3d4]">
            Khóa học của tôi
          </span>
          <div className="w-10 h-10 rounded-lg bg-[#f7f1ff] dark:bg-[#2b2438] flex items-center justify-center text-[#7240b8] dark:text-[#a87ffb]">
            <span className="material-symbols-outlined text-xl">menu_book</span>
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="text-2xl font-extrabold text-[#1c192c] dark:text-[#f4eeff] tracking-tight">
            {courses?.total || 0} khóa học
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
              {courses?.approved || 0} Đã duyệt
            </span>
            {courses?.pending !== undefined && courses.pending > 0 && (
              <span className="text-amber-700 dark:text-amber-300 font-semibold flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                {courses.pending} Chờ duyệt
              </span>
            )}
          </div>
        </div>
      </div>

      {/* KPI 4: Đánh giá trung bình */}
      <div className="rounded-xl p-5 bg-white dark:bg-[#1d1926] border border-[#ECEAF3] dark:border-[#352e43] shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-[#635a72] dark:text-[#cdc3d4]">
            Đánh giá trung bình
          </span>
          <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-500">
            <span className="material-symbols-outlined text-xl">star</span>
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-[#1c192c] dark:text-[#f4eeff] tracking-tight">
              {rating?.averageRating ? rating.averageRating.toFixed(2) : '5.0'}
            </span>
            <div className="flex text-amber-400 text-xs">
              {[1, 2, 3, 4, 5].map((star) => (
                <span key={star} className="material-symbols-outlined text-sm text-amber-400">
                  star
                </span>
              ))}
            </div>
          </div>
          <div className="text-xs text-[#635a72] dark:text-[#a9a0b2]">
            Dựa trên <strong className="text-[#1c192c] dark:text-[#f4eeff] font-semibold">{rating?.totalReviews || 0}</strong> lượt đánh giá
          </div>
        </div>
      </div>
    </section>
  );
}
