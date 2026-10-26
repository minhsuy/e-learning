'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Edit,
  Plus,
  BookOpen,
  Layers,
  FileVideo,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Users,
  BarChart3,
} from 'lucide-react';
import { TeacherCourseItem } from '@/types/course';
import { CourseStatusBadge } from '@/components/teacher/courses/course-status-badge';

interface CurriculumHeaderProps {
  course: TeacherCourseItem | null;
  courseId: string;
  totalChapters: number;
  totalLessons: number;
  totalDurationSeconds: number;
  totalDemoLessons: number;
  onAddChapter: () => void;
  allExpanded: boolean;
  onToggleExpandAll: () => void;
}

export function CurriculumHeader({
  course,
  courseId,
  totalChapters,
  totalLessons,
  totalDurationSeconds,
  totalDemoLessons,
  onAddChapter,
  allExpanded,
  onToggleExpandAll,
}: CurriculumHeaderProps) {
  const totalMins = Math.floor(totalDurationSeconds / 60);
  const hours = Math.floor(totalMins / 60);
  const remainingMins = totalMins % 60;
  const durationText = hours > 0 ? `${hours}h ${remainingMins}p` : `${totalMins} phút`;

  return (
    <div className="space-y-6">
      {/* Top Navigation & Back Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/teacher/courses"
            className="p-2 rounded-xl border border-[#eceaf3] dark:border-[#352e43] bg-white dark:bg-[#1d1926] text-slate-500 hover:text-[#7240b8] dark:hover:text-[#a87ffb] hover:bg-[#f7f1ff] dark:hover:bg-[#282234] transition-colors"
            title="Quay lại danh sách khóa học"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-[#1c192c] dark:text-[#f4eeff]">
                Soạn giáo trình khóa học
              </h1>
              {course && <CourseStatusBadge status={course.status} />}
            </div>
            <p className="text-xs sm:text-sm text-[#635a72] dark:text-[#a9a0b2] mt-0.5">
              Xây dựng cấu trúc chương mục, quản lý bài giảng video và thiết lập bài học xem thử.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href={`/teacher/courses/${courseId}/students`}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#eceaf3] dark:border-[#352e43] bg-white dark:bg-[#1d1926] hover:bg-[#f7f1ff] dark:hover:bg-[#282234] text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors shadow-xs"
            title="Xem danh sách học viên đăng ký khóa học này"
          >
            <Users className="w-3.5 h-3.5 text-[#7240b8] dark:text-[#a87ffb]" />
            <span>Học viên ({course?.sold ?? 0})</span>
          </Link>

          <Link
            href={`/teacher/courses/${courseId}/performance`}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#eceaf3] dark:border-[#352e43] bg-white dark:bg-[#1d1926] hover:bg-[#f7f1ff] dark:hover:bg-[#282234] text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors shadow-xs"
            title="Xem báo cáo hiệu suất và phân tích khóa học"
          >
            <BarChart3 className="w-3.5 h-3.5 text-[#7240b8] dark:text-[#a87ffb]" />
            <span>Hiệu suất</span>
          </Link>

          <Link
            href={`/teacher/courses/${courseId}/edit`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#eceaf3] dark:border-[#352e43] bg-white dark:bg-[#1d1926] hover:bg-[#f7f1ff] dark:hover:bg-[#282234] text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors shadow-xs"
          >
            <Edit className="w-3.5 h-3.5 text-[#7240b8] dark:text-[#a87ffb]" />
            <span>Sửa thông tin khóa</span>
          </Link>


          <button
            type="button"
            onClick={onAddChapter}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#7240b8] hover:bg-[#5e3299] text-white text-xs sm:text-sm font-semibold shadow-sm shadow-[#7240b8]/20 transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm chương mới</span>
          </button>
        </div>
      </div>

      {/* Course Info Banner Card */}
      {course && (
        <div className="p-4 sm:p-5 rounded-2xl border border-[#eceaf3] dark:border-[#352e43] bg-white dark:bg-[#1d1926] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="relative w-20 h-14 sm:w-24 sm:h-16 rounded-xl overflow-hidden bg-[#f7f1ff] dark:bg-[#282234] border border-[#eceaf3] dark:border-[#3d364b] shrink-0">
              {course.image ? (
                <img
                  src={course.image}
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#7240b8] dark:text-[#a87ffb]">
                  <BookOpen className="w-6 h-6" />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
                Mã: {course.id || course._id}
              </span>
              <h2 className="text-base sm:text-lg font-bold text-[#1c192c] dark:text-[#f4eeff] truncate">
                {course.title}
              </h2>
              <p className="text-xs text-slate-400 font-mono truncate mt-0.5">
                {course.slug}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            <button
              type="button"
              onClick={onToggleExpandAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#eceaf3] dark:border-[#352e43] bg-[#f7f1ff] dark:bg-[#282234] hover:bg-[#ede5fa] dark:hover:bg-[#352c48] text-xs font-semibold text-[#7240b8] dark:text-[#a87ffb] transition-colors"
            >
              {allExpanded ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  <span>Thu gọn tất cả</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5" />
                  <span>Mở rộng tất cả</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* 4 Overview Metric Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Tổng số chương */}
        <div className="bg-white dark:bg-[#1d1926] border border-[#eceaf3] dark:border-[#352e43] rounded-2xl p-4 shadow-xs flex items-center gap-3.5 hover:shadow-sm transition-shadow">
          <div className="w-11 h-11 rounded-xl bg-[#f7f1ff] dark:bg-[#282234] text-[#7240b8] dark:text-[#a87ffb] flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-[#635a72] dark:text-[#a9a0b2]">Tổng số chương</p>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl sm:text-2xl font-bold text-[#1c192c] dark:text-[#f4eeff]">
                {totalChapters}
              </span>
              <span className="text-xs text-[#635a72] dark:text-[#a9a0b2]">chương</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Tổng số bài học */}
        <div className="bg-white dark:bg-[#1d1926] border border-[#eceaf3] dark:border-[#352e43] rounded-2xl p-4 shadow-xs flex items-center gap-3.5 hover:shadow-sm transition-shadow">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 flex items-center justify-center shrink-0">
            <FileVideo className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-[#635a72] dark:text-[#a9a0b2]">Tổng số bài học</p>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl sm:text-2xl font-bold text-blue-700 dark:text-blue-400">
                {totalLessons}
              </span>
              <span className="text-xs text-blue-600 dark:text-blue-400">bài</span>
            </div>
          </div>
        </div>

        {/* Metric 3: Thời lượng */}
        <div className="bg-white dark:bg-[#1d1926] border border-[#eceaf3] dark:border-[#352e43] rounded-2xl p-4 shadow-xs flex items-center gap-3.5 hover:shadow-sm transition-shadow">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-[#635a72] dark:text-[#a9a0b2]">Tổng thời lượng</p>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg sm:text-xl font-bold text-amber-700 dark:text-amber-400 truncate">
                {durationText}
              </span>
            </div>
          </div>
        </div>

        {/* Metric 4: Bài học thử */}
        <div className="bg-white dark:bg-[#1d1926] border border-[#eceaf3] dark:border-[#352e43] rounded-2xl p-4 shadow-xs flex items-center gap-3.5 hover:shadow-sm transition-shadow">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-[#635a72] dark:text-[#a9a0b2]">Bài học xem thử</p>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl sm:text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                {totalDemoLessons}
              </span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400">bài demo</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
