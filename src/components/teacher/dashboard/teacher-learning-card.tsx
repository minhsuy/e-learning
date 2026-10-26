'use client';

import React from 'react';
import { Award, CheckCircle, TrendingUp } from 'lucide-react';
import { TeacherLearningStatsData } from '@/types/teacher-statistics';

interface TeacherLearningCardProps {
  data?: TeacherLearningStatsData | null;
  isLoading?: boolean;
}

export function TeacherLearningCard({ data, isLoading }: TeacherLearningCardProps) {
  if (isLoading) {
    return (
      <div className="rounded-2xl bg-white dark:bg-[#1d1926] border border-[#ECEAF3] dark:border-[#352e43] p-5 sm:p-6 space-y-4 animate-pulse shadow-xs">
        <div className="h-5 w-40 bg-[#f1ebff] dark:bg-[#2b2438] rounded" />
        <div className="h-4 w-28 bg-[#f1ebff] dark:bg-[#2b2438] rounded" />
        <div className="space-y-3 pt-2">
          <div className="h-10 bg-[#f1ebff] dark:bg-[#2b2438] rounded-xl" />
          <div className="h-10 bg-[#f1ebff] dark:bg-[#2b2438] rounded-xl" />
        </div>
      </div>
    );
  }

  const averageProgress = data?.averageProgress !== undefined ? data.averageProgress : 0;
  const completionRate = data?.completionRate !== undefined ? data.completionRate : 0;
  const certificatesIssued = data?.certificatesIssued !== undefined ? data.certificatesIssued : 0;

  return (
    <div className="rounded-2xl bg-white dark:bg-[#1d1926] border border-[#ECEAF3] dark:border-[#352e43] p-5 sm:p-6 space-y-5 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-[#f1ebff] dark:border-[#2b2438]">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[#1c192c] dark:text-[#f4eeff]">
            Tiến độ &amp; Hiệu quả Đào tạo
          </h2>
          <p className="text-xs text-[#635a72] dark:text-[#a9a0b2] mt-0.5">
            Mức độ gắn kết và tỷ lệ tốt nghiệp của học viên
          </p>
        </div>
        <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
          <TrendingUp className="w-4 h-4" />
        </div>
      </div>

      <div className="space-y-4">
        {/* Progress Bar Item: Tiến độ trung bình */}
        <div className="p-3.5 rounded-xl bg-[#f7f1ff]/60 dark:bg-[#221d2d]/60 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[#1c192c] dark:text-[#f4eeff]">
              Tiến độ học tập trung bình
            </span>
            <span className="font-extrabold text-[#7240b8] dark:text-[#a87ffb]">
              {averageProgress}%
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-[#e6dffa] dark:bg-[#352e43] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#7240b8] dark:bg-[#a87ffb] transition-all duration-500"
              style={{ width: `${Math.min(averageProgress, 100)}%` }}
            />
          </div>
        </div>

        {/* 2 Mini Stat Columns */}
        <div className="grid grid-cols-2 gap-3">
          {/* Tỷ lệ hoàn thành */}
          <div className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Tỷ lệ hoàn thành</span>
            </div>
            <div className="text-xl font-extrabold text-emerald-900 dark:text-emerald-200">
              {completionRate}%
            </div>
            <p className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80">
              {data?.completedStudents || 0} học viên tốt nghiệp
            </p>
          </div>

          {/* Chứng chỉ đã cấp */}
          <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 space-y-1">
            <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 text-xs font-semibold">
              <Award className="w-3.5 h-3.5" />
              <span>Chứng chỉ đã cấp</span>
            </div>
            <div className="text-xl font-extrabold text-amber-900 dark:text-amber-200">
              {certificatesIssued}
            </div>
            <p className="text-[10px] text-amber-700/80 dark:text-amber-400/80">
              {data?.certificateRate || 0}% đạt tiêu chuẩn
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
