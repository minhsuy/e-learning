'use client';

import React from 'react';
import { CourseCard } from '@/components/course/course-card';
import { CourseCardSkeleton } from '@/components/course/course-card-skeleton';
import { useSimilarCourses } from '@/hooks/use-recommendations';

interface SimilarCoursesSectionProps {
  courseId: string;
  currentCourseSlug?: string;
  limit?: number;
  className?: string;
}

export function SimilarCoursesSection({
  courseId,
  limit = 6,
  className = '',
}: SimilarCoursesSectionProps) {
  const { courses, isLoading, error, refetch } = useSimilarCourses(courseId, {
    limit,
    enable_diversity: true,
  });

  // If there's an error and no courses, do not break the page. Provide optional retry or subtle notice.
  if (error && !isLoading && courses.length === 0) {
    return (
      <section
        aria-label="Khóa học tương tự"
        className={`w-full bg-white dark:bg-[#1d1926] rounded-2xl p-6 md:p-8 border border-[#f1ebff] dark:border-[#2f2742] shadow-xs ${className}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#f7f1ff] dark:bg-[#282136] flex items-center justify-center text-[#7240b8] dark:text-[#a87ffb]">
              <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-[#1c192c] dark:text-[#f4eeff]">
                Khóa học tương tự
              </h2>
              <p className="text-xs text-[#635a72] dark:text-[#b4a9c7]">
                Các khóa học có nội dung và lộ trình học tập tương đồng
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#7240b8] dark:text-[#a87ffb] hover:bg-[#f7f1ff] dark:hover:bg-[#282136] transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">refresh</span>
            Thử lại
          </button>
        </div>
      </section>
    );
  }

  // If not loading and no courses found, gracefully return null or a clean empty block
  if (!isLoading && courses.length === 0) {
    return null;
  }

  return (
    <section
      aria-label="Khóa học tương tự"
      className={`w-full flex flex-col gap-5 ${className}`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-[#ede5fb] dark:bg-[#2e2345] flex items-center justify-center text-[#7240b8] dark:text-[#a87ffb] shadow-2xs">
            <span className="material-symbols-outlined text-[22px]">auto_awesome</span>
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-[#1c192c] dark:text-[#f4eeff] tracking-tight">
              Khóa học tương tự
            </h2>
            <p className="text-xs md:text-sm text-[#635a72] dark:text-[#b4a9c7] mt-0.5">
              Được AI tổng hợp từ nội dung giảng dạy, lộ trình và độ khó tương đồng
            </p>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          <CourseCardSkeleton count={limit} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {courses.slice(0, limit).map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </section>
  );
}

