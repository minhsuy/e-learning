'use client';

import React from 'react';
import {
  Award,
  Star,
  Activity,
  FileCheck,
} from 'lucide-react';
import {
  TeacherCoursePerformanceCurriculum,
  TeacherCoursePerformanceOverview,
} from '@/types/teacher-statistics';

interface PerformanceLearningAnalyticsProps {
  overview?: TeacherCoursePerformanceOverview | null;
  curriculum?: TeacherCoursePerformanceCurriculum | null;
  isLoading?: boolean;
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0 phút';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours} giờ ${minutes > 0 ? `${minutes} phút` : ''}`.trim();
  }
  return `${minutes} phút`;
}

export function PerformanceLearningAnalytics({
  overview,
  curriculum,
  isLoading = false,
}: PerformanceLearningAnalyticsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="rounded-2xl bg-white dark:bg-[#1d1926] border border-[#eceaf3] dark:border-[#352e43] p-5 space-y-4 animate-pulse shadow-xs"
          >
            <div className="h-5 w-40 bg-slate-100 dark:bg-slate-800 rounded" />
            <div className="h-24 bg-slate-50 dark:bg-slate-850 rounded-xl" />
            <div className="space-y-2">
              <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded" />
              <div className="h-3 w-2/3 bg-slate-100 dark:bg-slate-800 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const students = overview?.students;
  const engagement = overview?.engagement;

  const totalStudents = students?.totalStudents || 0;
  const activeStudents = students?.activeStudents || 0;
  const completedStudents = students?.completedStudents || 0;
  const canceledStudents = students?.canceledStudents || 0;
  const averageProgress = students?.averageProgress || 0;
  const completionRate = students?.completionRate || 0;

  const activePercent = totalStudents > 0 ? Math.round((activeStudents / totalStudents) * 100) : 0;
  const completedPercent = totalStudents > 0 ? Math.round((completedStudents / totalStudents) * 100) : 0;
  const canceledPercent = totalStudents > 0 ? Math.round((canceledStudents / totalStudents) * 100) : 0;

  // Rating metrics
  const averageRating = engagement?.averageRating || 0;
  const totalReviews = engagement?.totalReviews || 0;
  const ratingDistribution = engagement?.ratingDistribution || {
    '1': 0,
    '2': 0,
    '3': 0,
    '4': 0,
    '5': 0,
  };
  const certificatesIssued = engagement?.certificatesIssued || 0;
  const averageCertificateGrade = engagement?.averageCertificateGrade || 0;

  // Star distribution breakdown (5 to 1)
  const starRows = [5, 4, 3, 2, 1].map((star) => {
    const count = ratingDistribution[star.toString()] || 0;
    const percentage = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
    return { star, count, percentage };
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Card 1: Tiến độ học tập & Trạng thái học viên */}
      <div className="rounded-2xl bg-white dark:bg-[#1d1926] border border-[#eceaf3] dark:border-[#352e43] p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-[#eceaf3] dark:border-[#352e43]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-[#7240b8] dark:text-[#a87ffb]">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1c192c] dark:text-[#f4eeff]">
                  Tình hình Học tập &amp; Trạng thái
                </h3>
                <p className="text-xs text-[#635a72] dark:text-[#a9a0b2]">
                  Phân bố tiến độ và tỷ lệ hoàn tất khóa học
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-violet-50 dark:bg-violet-950/40 text-[#7240b8] dark:text-[#a87ffb] border border-violet-100 dark:border-violet-900/40">
              Tổng {totalStudents} học viên
            </span>
          </div>

          {/* Main Progress Bar & Metrics */}
          <div className="mt-4 p-4 rounded-xl bg-[#fbf9fe] dark:bg-[#252030] border border-[#eceaf3] dark:border-[#352e43]/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#635a72] dark:text-[#a9a0b2]">
                Tiến độ học tập trung bình
              </span>
              <span className="text-sm font-bold text-[#7240b8] dark:text-[#a87ffb]">
                {averageProgress}%
              </span>
            </div>
            {/* Visual progress bar */}
            <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#7240b8] to-[#9e70e9] rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, averageProgress))}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-[#635a72] dark:text-[#a9a0b2] pt-1">
              <span>Tỷ lệ hoàn thành: <strong className="text-[#1c192c] dark:text-[#f4eeff]">{completionRate}%</strong></span>
              <span>Đã hoàn thành: <strong className="text-emerald-600 dark:text-emerald-400">{completedStudents}</strong> / {totalStudents}</span>
            </div>
          </div>

          {/* Status Breakdown Segment */}
          <div className="mt-4 space-y-2">
            <p className="text-xs font-semibold text-[#1c192c] dark:text-[#f4eeff]">
              Phân bố học viên theo trạng thái:
            </p>
            {/* Segmented bar */}
            <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
              {totalStudents > 0 ? (
                <>
                  <div
                    style={{ width: `${activePercent}%` }}
                    className="bg-blue-500 hover:opacity-90 transition-all"
                    title={`Đang học: ${activeStudents} (${activePercent}%)`}
                  />
                  <div
                    style={{ width: `${completedPercent}%` }}
                    className="bg-emerald-500 hover:opacity-90 transition-all"
                    title={`Đã hoàn thành: ${completedStudents} (${completedPercent}%)`}
                  />
                  <div
                    style={{ width: `${canceledPercent}%` }}
                    className="bg-rose-400 hover:opacity-90 transition-all"
                    title={`Hủy ghi danh: ${canceledStudents} (${canceledPercent}%)`}
                  />
                </>
              ) : (
                <div className="w-full bg-slate-200 dark:bg-slate-700" />
              )}
            </div>

            {/* Legend */}
            <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[#635a72] dark:text-[#a9a0b2] block truncate">Đang học</span>
                  <strong className="text-[#1c192c] dark:text-[#f4eeff]">{activeStudents} ({activePercent}%)</strong>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[#635a72] dark:text-[#a9a0b2] block truncate">Hoàn thành</span>
                  <strong className="text-[#1c192c] dark:text-[#f4eeff]">{completedStudents} ({completedPercent}%)</strong>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[#635a72] dark:text-[#a9a0b2] block truncate">Đã hủy</span>
                  <strong className="text-[#1c192c] dark:text-[#f4eeff]">{canceledStudents} ({canceledPercent}%)</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Curriculum Specs Footer */}
        {curriculum && (
          <div className="mt-5 pt-3 border-t border-[#eceaf3] dark:border-[#352e43] grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-[#252030]">
              <span className="text-[11px] text-[#635a72] dark:text-[#a9a0b2] block">Chương học</span>
              <strong className="text-xs font-bold text-[#1c192c] dark:text-[#f4eeff]">
                {curriculum.totalChapters} chương
              </strong>
            </div>
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-[#252030]">
              <span className="text-[11px] text-[#635a72] dark:text-[#a9a0b2] block">Tổng bài học</span>
              <strong className="text-xs font-bold text-[#1c192c] dark:text-[#f4eeff]">
                {curriculum.totalLessons} bài
              </strong>
            </div>
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-[#252030]">
              <span className="text-[11px] text-[#635a72] dark:text-[#a9a0b2] block">Tổng thời lượng</span>
              <strong className="text-xs font-bold text-[#1c192c] dark:text-[#f4eeff]">
                {formatDuration(curriculum.totalDuration)}
              </strong>
            </div>
          </div>
        )}
      </div>

      {/* Card 2: Đánh giá & Phản hồi (Rating Analytics) */}
      <div className="rounded-2xl bg-white dark:bg-[#1d1926] border border-[#eceaf3] dark:border-[#352e43] p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-[#eceaf3] dark:border-[#352e43]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Star className="w-4 h-4 fill-amber-500" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1c192c] dark:text-[#f4eeff]">
                  Đánh giá &amp; Phản hồi Khóa học
                </h3>
                <p className="text-xs text-[#635a72] dark:text-[#a9a0b2]">
                  Phân bố sao từ đánh giá thực tế của học viên
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/40">
              {totalReviews} đánh giá
            </span>
          </div>

          {/* Rating Summary Banner */}
          <div className="mt-4 flex items-center gap-5 p-4 rounded-xl bg-[#fbf9fe] dark:bg-[#252030] border border-[#eceaf3] dark:border-[#352e43]/60">
            <div className="text-center shrink-0 pr-3 border-r border-[#eceaf3] dark:border-[#352e43]">
              <div className="text-3xl font-black text-[#1c192c] dark:text-[#f4eeff] tracking-tight">
                {averageRating > 0 ? averageRating.toFixed(1) : '0.0'}
              </div>
              <div className="flex items-center justify-center gap-0.5 mt-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-3.5 h-3.5 ${
                      s <= Math.round(averageRating)
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-slate-300 dark:text-slate-600'
                    }`}
                  />
                ))}
              </div>
              <span className="text-[11px] text-[#635a72] dark:text-[#a9a0b2] block mt-1">
                trên 5.0 sao
              </span>
            </div>

            {/* Star Breakdown Bars */}
            <div className="flex-1 space-y-1.5">
              {starRows.map(({ star, count, percentage }) => (
                <div key={star} className="flex items-center gap-2 text-xs">
                  <span className="w-8 flex items-center gap-0.5 font-medium text-[#1c192c] dark:text-[#f4eeff]">
                    {star} <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                  </span>
                  <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-12 text-right font-medium text-[#635a72] dark:text-[#a9a0b2] text-[11px]">
                    {count} ({percentage}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Certificate Metric Footnote */}
        <div className="mt-5 pt-3 border-t border-[#eceaf3] dark:border-[#352e43] flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-[#635a72] dark:text-[#a9a0b2]">
            <Award className="w-4 h-4 text-[#7240b8] dark:text-[#a87ffb]" />
            <span>Chứng chỉ đã cấp:</span>
            <strong className="text-[#1c192c] dark:text-[#f4eeff] font-bold">
              {certificatesIssued}
            </strong>
          </div>
          <div className="flex items-center gap-1.5 text-[#635a72] dark:text-[#a9a0b2]">
            <FileCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Điểm chứng chỉ TB:</span>
            <strong className="text-[#1c192c] dark:text-[#f4eeff] font-bold">
              {averageCertificateGrade > 0 ? averageCertificateGrade.toFixed(1) : '—'}/100
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
}
