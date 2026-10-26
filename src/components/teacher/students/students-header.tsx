'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  BookOpen,
  Edit,
  MenuSquare,
  Users,
  Award,
  DollarSign,
  RefreshCw,
  BarChart3,
} from 'lucide-react';
import { TeacherCourseItem } from '@/types/course';
import { CourseStatusBadge } from '@/components/teacher/courses/course-status-badge';

interface StudentsHeaderProps {
  course: TeacherCourseItem | null;
  courseId: string;
  totalStudents: number;
  averageProgress?: number;
  isLoading?: boolean;
  onRefresh: () => void;
}

export function StudentsHeader({
  course,
  courseId,
  totalStudents,
  averageProgress = 0,
  isLoading = false,
  onRefresh,
}: StudentsHeaderProps) {
  const sold = typeof course?.sold === 'number' ? course.sold : totalStudents;
  const price = typeof course?.price === 'number' ? course.price : 0;
  const revenue = sold * price;

  return (
    <div className="space-y-5">
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
                Học viên & Ghi danh
              </h1>
              {course && <CourseStatusBadge status={course.status} />}
            </div>
            <p className="text-xs sm:text-sm text-[#635a72] dark:text-[#a9a0b2] mt-0.5">
              Theo dõi danh sách học viên, tiến độ hoàn thành và quản lý quyền ghi danh của khóa học.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#eceaf3] dark:border-[#352e43] bg-white dark:bg-[#1d1926] hover:bg-[#f7f1ff] dark:hover:bg-[#282234] text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors shadow-xs disabled:opacity-50"
            title="Làm mới danh sách học viên"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#7240b8]' : ''}`} />
            <span>Làm mới</span>
          </button>

          <Link
            href={`/teacher/courses/${courseId}/curriculum`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#eceaf3] dark:border-[#352e43] bg-white dark:bg-[#1d1926] hover:bg-[#f7f1ff] dark:hover:bg-[#282234] text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors shadow-xs"
          >
            <MenuSquare className="w-3.5 h-3.5 text-[#7240b8] dark:text-[#a87ffb]" />
            <span>Soạn giáo trình</span>
          </Link>

          <Link
            href={`/teacher/courses/${courseId}/performance`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#eceaf3] dark:border-[#352e43] bg-white dark:bg-[#1d1926] hover:bg-[#f7f1ff] dark:hover:bg-[#282234] text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors shadow-xs"
          >
            <BarChart3 className="w-3.5 h-3.5 text-[#7240b8] dark:text-[#a87ffb]" />
            <span>Hiệu suất</span>
          </Link>

          <Link
            href={`/teacher/courses/${courseId}/edit`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#eceaf3] dark:border-[#352e43] bg-white dark:bg-[#1d1926] hover:bg-[#f7f1ff] dark:hover:bg-[#282234] text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors shadow-xs"
          >
            <Edit className="w-3.5 h-3.5 text-[#7240b8] dark:text-[#a87ffb]" />
            <span>Sửa khóa học</span>
          </Link>
        </div>
      </div>

      {/* Course Banner Card */}
      {course && (
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#1d1926] border border-[#eceaf3] dark:border-[#352e43] shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Left: Thumbnail & Course Meta */}
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

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#f7f1ff] dark:bg-[#282234] text-[#7240b8] dark:text-[#a87ffb]">
                    {course.category?.name || 'Khóa học'}
                  </span>
                  <span className="text-[11px] text-[#635a72] dark:text-[#a9a0b2]">
                    Cấp độ: {course.level || 'Cơ bản'}
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-[#1c192c] dark:text-[#f4eeff] truncate mt-1">
                  {course.title}
                </h2>
                <p className="text-xs text-slate-400 font-mono truncate mt-0.5">
                  ID: {courseId}
                </p>
              </div>
            </div>

            {/* Right: Quick Stat Chips */}
            <div className="flex items-center gap-3 sm:gap-4 flex-wrap border-t md:border-t-0 md:border-l border-[#eceaf3] dark:border-[#352e43] pt-3 md:pt-0 md:pl-5">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 text-xs text-[#635a72] dark:text-[#a9a0b2]">
                  <Users className="w-3.5 h-3.5 text-[#7240b8] dark:text-[#a87ffb]" />
                  <span>Tổng học viên</span>
                </div>
                <p className="text-base sm:text-lg font-bold text-[#1c192c] dark:text-[#f4eeff]">
                  {totalStudents}
                </p>
              </div>

              <div className="space-y-0.5 pl-3 border-l border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-1.5 text-xs text-[#635a72] dark:text-[#a9a0b2]">
                  <Award className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Tiến độ TB</span>
                </div>
                <p className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {averageProgress}%
                </p>
              </div>

              <div className="space-y-0.5 pl-3 border-l border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-1.5 text-xs text-[#635a72] dark:text-[#a9a0b2]">
                  <DollarSign className="w-3.5 h-3.5 text-[#7240b8] dark:text-[#a87ffb]" />
                  <span>Doanh thu khóa</span>
                </div>
                <p className="text-base sm:text-lg font-bold text-[#1c192c] dark:text-[#f4eeff]">
                  {revenue.toLocaleString('vi-VN')} đ
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
