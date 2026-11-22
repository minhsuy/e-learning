'use client';

import React from 'react';
import { GraduationCap, CheckCircle2, Award, Users, AlertCircle, RotateCcw } from 'lucide-react';
import { TeacherLearningStatsData } from '@/types/teacher-statistics';

interface TeacherLearningAnalyticsProps {
  data: TeacherLearningStatsData | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

function fmt(n: number | undefined): string {
  return new Intl.NumberFormat('vi-VN').format(n ?? 0);
}

export function TeacherLearningAnalytics({
  data,
  loading,
  error,
  onRetry,
}: TeacherLearningAnalyticsProps) {
  const totalStudents = data?.totalStudents ?? 0;
  const averageProgress = data?.averageProgress ?? 0;
  const completedStudents = data?.completedStudents ?? 0;
  const completionRate = data?.completionRate ?? 0;
  const certificatesIssued = data?.certificatesIssued ?? 0;
  const certificateRate = data?.certificateRate ?? 0;

  return (
    <div className="bg-white dark:bg-[#1d1926] rounded-2xl border border-[#f1ebff] dark:border-[#2b2438] p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-5">
      <div className="flex items-center gap-2.5 pb-3 border-b border-[#f1ebff] dark:border-[#2b2438]">
        <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
          <GraduationCap className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-base font-bold text-[#1c192c] dark:text-[#f4eeff]">
            Phân tích Tiến độ &amp; Hiệu quả Học tập
          </h2>
          <p className="text-xs text-[#635a72] dark:text-[#a9a0b2]">
            Dữ liệu trực tiếp từ <code className="font-mono text-[11px]">GET /api/teacher/statistics/learning</code>
          </p>
        </div>
      </div>

      {error ? (
        <div className="p-5 rounded-xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-center space-y-2.5">
          <AlertCircle className="w-6 h-6 text-rose-600 dark:text-rose-400 mx-auto" />
          <p className="text-xs font-medium text-rose-800 dark:text-rose-300">{error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#7240b8] hover:bg-[#5e3299] text-white text-xs font-semibold cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Thử lại</span>
          </button>
        </div>
      ) : loading ? (
        <div className="space-y-4 animate-pulse py-2">
          <div className="h-16 rounded-xl bg-[#f7f1ff] dark:bg-[#221d2d]" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-24 rounded-xl bg-[#f7f1ff] dark:bg-[#221d2d]" />
            <div className="h-24 rounded-xl bg-[#f7f1ff] dark:bg-[#221d2d]" />
          </div>
        </div>
      ) : totalStudents === 0 ? (
        <div className="py-10 text-center rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-dashed border-[#e6dffa] dark:border-[#2b2438] space-y-1.5">
          <GraduationCap className="w-7 h-7 text-[#cdc3d4] dark:text-[#4b4359] mx-auto" />
          <p className="text-xs sm:text-sm font-semibold text-[#1c192c] dark:text-[#f4eeff]">
            Chưa có dữ liệu tiến độ học tập
          </p>
          <p className="text-xs text-[#635a72] dark:text-[#a9a0b2]">
            Các chỉ số tiến độ, tỷ lệ hoàn thành và chứng chỉ sẽ hiển thị khi có học viên ghi danh.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Average Progress Gauge Bar */}
          <div className="p-4 rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#1c192c] dark:text-[#f4eeff]">
                Tiến độ học tập trung bình
              </span>
              <span className="text-base font-extrabold text-[#7240b8] dark:text-[#a87ffb]">
                {averageProgress.toFixed(1)}%
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-[#e6dffa] dark:bg-[#2b2438] overflow-hidden">
              <div
                className="h-full rounded-full bg-[#7240b8] dark:bg-[#a87ffb] transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, averageProgress))}%` }}
              />
            </div>
            <p className="text-[11px] text-[#635a72] dark:text-[#a9a0b2] inline-flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#7240b8] dark:text-[#a87ffb]" />
              <span>Tính trên tổng cộng {fmt(totalStudents)} lượt học viên ghi danh</span>
            </p>
          </div>

          {/* Completion Rate & Certificate Rate Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/25 border border-emerald-200 dark:border-emerald-900/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Tỷ lệ hoàn thành</span>
                </span>
                <span className="text-lg font-extrabold text-emerald-700 dark:text-emerald-300">
                  {completionRate.toFixed(1)}%
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-emerald-200/70 dark:bg-emerald-900/50 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-600"
                  style={{ width: `${Math.min(100, Math.max(0, completionRate))}%` }}
                />
              </div>
              <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80">
                {fmt(completedStudents)} / {fmt(totalStudents)} học viên đã hoàn thành
              </p>
            </div>

            <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/25 border border-amber-200 dark:border-amber-900/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-800 dark:text-amber-300 inline-flex items-center gap-1.5">
                  <Award className="w-4 h-4" />
                  <span>Tỷ lệ cấp chứng chỉ</span>
                </span>
                <span className="text-lg font-extrabold text-amber-700 dark:text-amber-300">
                  {certificateRate.toFixed(1)}%
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-amber-200/70 dark:bg-amber-900/50 overflow-hidden">
                <div
                  className="h-full rounded-full bg-amber-500"
                  style={{ width: `${Math.min(100, Math.max(0, certificateRate))}%` }}
                />
              </div>
              <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80">
                {fmt(certificatesIssued)} chứng chỉ đã được cấp
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
