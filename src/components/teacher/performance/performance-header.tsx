'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  BookOpen,
  Users,
  Eye,
  DollarSign,
  RefreshCw,
  ChevronDown,
  Layers,
  Sparkles,
} from 'lucide-react';
import { TeacherCoursePerformanceCourse } from '@/types/teacher-statistics';
import { TeacherCourseItem } from '@/types/course';
import { CourseStatusBadge } from '@/components/teacher/courses/course-status-badge';

interface PerformanceHeaderProps {
  course: TeacherCoursePerformanceCourse | null;
  courseId: string;
  coursesList?: TeacherCourseItem[];
  totalStudents: number;
  totalRevenue: number;
  isLoading?: boolean;
  onRefresh: () => void;
}

export function PerformanceHeader({
  course,
  courseId,
  coursesList = [],
  totalStudents,
  totalRevenue,
  isLoading = false,
  onRefresh,
}: PerformanceHeaderProps) {
  const router = useRouter();
  const [isCourseDropdownOpen, setIsCourseDropdownOpen] = useState(false);

  const price = typeof course?.price === 'number' ? course.price : 0;
  const views = typeof course?.view === 'number' ? course.view : 0;
  const levelLabels: Record<string, string> = {
    beginner: 'Mới bắt đầu',
    intermediate: 'Trung cấp',
    advanced: 'Nâng cao',
  };
  const normalizedLevel = (course?.level || '').toLowerCase();
  const levelText = levelLabels[normalizedLevel] || 'Cơ bản';

  return (
    <div className="space-y-4">
      {/* Top Nav & Breadcrumb-style Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/teacher/courses"
            className="p-2 rounded-xl border border-[#eceaf3] dark:border-[#352e43] bg-white dark:bg-[#1d1926] text-slate-500 hover:text-[#7240b8] dark:hover:text-[#a87ffb] hover:bg-[#f7f1ff] dark:hover:bg-[#282234] transition-colors"
            title="Quay lại danh sách khóa học"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-[#1c192c] dark:text-[#f4eeff]">
                Hiệu suất &amp; Phân tích Khóa học
              </h1>
              {course && <CourseStatusBadge status={course.status} />}
            </div>
            <p className="text-xs text-[#635a72] dark:text-[#a9a0b2] mt-0.5">
              Báo cáo chuyên sâu về doanh thu, tiến độ học tập, phễu hoàn thành bài học và kết quả kiểm tra quiz.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {/* Quick Nav: Học viên */}
          <Link
            href={`/teacher/courses/${encodeURIComponent(courseId)}/students`}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#eceaf3] dark:border-[#352e43] bg-white dark:bg-[#1d1926] hover:bg-[#f7f1ff] dark:hover:bg-[#282234] text-xs font-semibold text-[#1c192c] dark:text-[#f4eeff] transition-colors"
          >
            <Users className="w-3.5 h-3.5 text-[#7240b8] dark:text-[#a87ffb]" />
            <span>Học viên ({totalStudents})</span>
          </Link>

          {/* Quick Nav: Soạn giáo trình */}
          <Link
            href={`/teacher/courses/${encodeURIComponent(courseId)}/curriculum`}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#eceaf3] dark:border-[#352e43] bg-white dark:bg-[#1d1926] hover:bg-[#f7f1ff] dark:hover:bg-[#282234] text-xs font-semibold text-[#1c192c] dark:text-[#f4eeff] transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-[#7240b8] dark:text-[#a87ffb]" />
            <span>Giáo trình</span>
          </Link>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2 rounded-xl border border-[#eceaf3] dark:border-[#352e43] bg-white dark:bg-[#1d1926] hover:bg-[#f7f1ff] dark:hover:bg-[#282234] text-slate-500 hover:text-[#7240b8] dark:hover:text-[#a87ffb] disabled:opacity-50 transition-colors"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Course Banner Card with Switcher */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#1d1926] border border-[#eceaf3] dark:border-[#352e43] shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Course Info Block */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="relative w-16 h-11 sm:w-20 sm:h-13 rounded-xl overflow-hidden bg-[#f7f1ff] dark:bg-[#252030] border border-[#eceaf3] dark:border-[#352e43] shrink-0">
            {course?.image ? (
              <img
                src={course.image}
                alt={course.title || 'Course thumbnail'}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#7240b8] dark:text-[#a87ffb]">
                <BookOpen className="w-6 h-6" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm sm:text-base text-[#1c192c] dark:text-[#f4eeff] truncate block max-w-xl">
                {course?.title || 'Đang tải thông tin khóa học...'}
              </span>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 text-xs text-[#635a72] dark:text-[#a9a0b2] mt-1 flex-wrap">
              {course?.category?.name && (
                <span className="px-2 py-0.5 rounded-md bg-[#f7f1ff] dark:bg-[#282234] text-[#7240b8] dark:text-[#a87ffb] font-medium text-[11px]">
                  {course.category.name}
                </span>
              )}

              <span className="text-[11px] font-medium">{levelText}</span>
              <span className="text-slate-300 dark:text-slate-700">•</span>

              <span className="flex items-center gap-1 text-[11px]">
                <Eye className="w-3.5 h-3.5 text-slate-400" />
                <span>{views.toLocaleString('vi-VN')} lượt xem</span>
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>

              <span className="text-[11px] font-bold text-[#7240b8] dark:text-[#a87ffb]">
                {price === 0 ? 'Miễn phí' : `${price.toLocaleString('vi-VN')} đ`}
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>

              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                <DollarSign className="w-3.5 h-3.5" />
                <span>Doanh thu: {totalRevenue.toLocaleString('vi-VN')} đ</span>
              </span>
            </div>
          </div>
        </div>

        {/* Course Switcher Dropdown */}
        {coursesList.length > 1 && (
          <div className="relative shrink-0 self-end md:self-center">
            <button
              type="button"
              onClick={() => setIsCourseDropdownOpen((prev) => !prev)}
              className="inline-flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-[#eceaf3] dark:border-[#352e43] bg-[#fdf8ff] dark:bg-[#252030] text-xs font-semibold text-[#1c192c] dark:text-[#f4eeff] hover:border-[#7240b8]/40 transition-colors w-full sm:w-auto"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#7240b8] dark:text-[#a87ffb]" />
              <span className="truncate max-w-[160px]">Đổi khóa học khác</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isCourseDropdownOpen && (
              <div
                className="absolute right-0 top-full mt-1.5 w-72 rounded-xl bg-white dark:bg-[#1d1926] border border-[#eceaf3] dark:border-[#352e43] shadow-xl py-1.5 z-30 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-150"
                onClick={() => setIsCourseDropdownOpen(false)}
              >
                <div className="px-3 py-1 text-[10px] uppercase font-bold text-[#635a72] dark:text-[#a9a0b2] border-b border-[#eceaf3] dark:border-[#352e43]">
                  Khóa học của bạn ({coursesList.length})
                </div>
                {coursesList.map((c) => {
                  const targetId = c.id || c._id;
                  const isCurrent = targetId === courseId;
                  return (
                    <button
                      key={targetId}
                      type="button"
                      onClick={() => {
                        setIsCourseDropdownOpen(false);
                        if (targetId && !isCurrent) {
                          router.push(`/teacher/courses/${encodeURIComponent(targetId)}/performance`);
                        }
                      }}
                      className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center justify-between gap-2 ${
                        isCurrent
                          ? 'bg-[#f7f1ff] dark:bg-[#282234] text-[#7240b8] dark:text-[#a87ffb] font-bold'
                          : 'text-[#1c192c] dark:text-[#f4eeff] hover:bg-slate-50 dark:hover:bg-[#252030]'
                      }`}
                    >
                      <span className="truncate">{c.title}</span>
                      <span className="text-[10px] text-slate-400 shrink-0 font-normal">
                        {c.sold || 0} HV
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
