'use client';

import React from 'react';
import Link from 'next/link';
import { TrendingUp, ArrowLeft, Clock } from 'lucide-react';

export default function TeacherAnalyticsPlaceholder() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="rounded-2xl border border-[#f1ebff] dark:border-[#352e43] bg-white dark:bg-[#1d1926] p-8 text-center space-y-4 shadow-xs">
        <div className="w-16 h-16 rounded-2xl bg-[#f7f1ff] dark:bg-[#2b2438] text-[#7240b8] dark:text-[#a87ffb] mx-auto flex items-center justify-center">
          <TrendingUp className="w-8 h-8" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 text-xs font-semibold border border-purple-200 dark:border-purple-800">
          <Clock className="w-3.5 h-3.5" />
          <span>Kế hoạch triển khai: Phase F8.4</span>
        </div>

        <h1 className="text-xl sm:text-2xl font-bold text-[#1c192c] dark:text-[#f4eeff]">
          Báo Cáo & Phân Tích Giảng Viên
        </h1>

        <p className="text-sm text-[#635a72] dark:text-[#a9a0b2] max-w-lg mx-auto leading-relaxed">
          Biểu đồ trực quan hóa doanh thu, tỷ lệ ghi danh, thống kê tiến độ học tập và hiệu suất từng khóa học sẽ được xây dựng và kết nối dữ liệu trong giai đoạn <strong>F8.4</strong>.
        </p>

        <div className="pt-4 flex items-center justify-center gap-3">
          <Link
            href="/teacher/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#f7f1ff] dark:bg-[#2b2438] hover:bg-[#ede5fa] dark:hover:bg-[#352c48] text-[#7240b8] dark:text-[#a87ffb] text-xs sm:text-sm font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Về Bảng điều khiển Giảng viên</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
