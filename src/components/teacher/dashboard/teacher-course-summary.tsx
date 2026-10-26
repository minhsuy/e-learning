'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, Star, Plus } from 'lucide-react';
import { TeacherCourseStatItem } from '@/types/teacher-statistics';

interface TeacherCourseSummaryProps {
  courses?: TeacherCourseStatItem[];
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

function CourseImage({ src, alt }: { src?: string; alt: string }) {
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div className="w-full h-full bg-[#f7f1ff] dark:bg-[#2b2438] flex items-center justify-center text-[#7240b8] dark:text-[#a87ffb]">
        <BookOpen className="w-6 h-6" />
      </div>
    );
  }

  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={src}
      alt={alt}
      onError={() => setError(true)}
      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
    />
  );
}

export function TeacherCourseSummary({ courses = [], isLoading }: TeacherCourseSummaryProps) {
  return (
    <div className="rounded-2xl bg-white dark:bg-[#1d1926] border border-[#ECEAF3] dark:border-[#352e43] p-5 sm:p-6 space-y-5 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-[#f1ebff] dark:border-[#2b2438]">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[#1c192c] dark:text-[#f4eeff]">
            Khóa học hiệu suất cao nhất
          </h2>
          <p className="text-xs text-[#635a72] dark:text-[#a9a0b2] mt-0.5">
            Top các học phần có số lượng ghi danh và doanh thu tốt nhất
          </p>
        </div>
        <Link
          href="/teacher/courses"
          className="text-xs font-semibold text-[#7240b8] dark:text-[#a87ffb] hover:underline flex items-center gap-1"
        >
          <span>Xem tất cả</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {isLoading ? (
        <div className="divide-y divide-[#f1ebff] dark:divide-[#2b2438]">
          {[1, 2, 3].map((i) => (
            <div key={i} className="py-4 flex items-center gap-4 animate-pulse">
              <div className="w-20 h-14 rounded-lg bg-[#f1ebff] dark:bg-[#2b2438] shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-48 bg-[#f1ebff] dark:bg-[#2b2438] rounded" />
                <div className="h-3 w-32 bg-[#f1ebff] dark:bg-[#2b2438] rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="py-8 text-center text-[#635a72] dark:text-[#a9a0b2] space-y-3">
          <div className="w-12 h-12 rounded-xl bg-[#f7f1ff] dark:bg-[#2b2438] text-[#7240b8] dark:text-[#a87ffb] mx-auto flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-[#1c192c] dark:text-[#f4eeff]">
            Chưa có khóa học nào
          </p>
          <p className="text-xs text-[#7c7483] dark:text-[#968e9e] max-w-sm mx-auto">
            Bắt đầu tạo khóa học đầu tiên của bạn để chia sẻ kiến thức đến hàng nghìn học viên tại TMdemy.
          </p>
          <Link
            href="/teacher/courses/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#7240b8] hover:bg-[#5e3299] text-white text-xs font-semibold transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tạo khóa học mới</span>
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-[#ECEAF3] dark:divide-[#2b2438]">
          {courses.map((course) => {
            const courseId = course.id || course._id;
            const isApproved = course.status?.toLowerCase() === 'approved';
            const isPending = course.status?.toLowerCase() === 'pending';

            return (
              <div
                key={courseId}
                className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
              >
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  {/* Thumbnail */}
                  <div className="w-20 h-14 rounded-lg overflow-hidden shrink-0 bg-[#f7f1ff] dark:bg-[#2b2438] relative border border-[#ECEAF3] dark:border-[#352e43]">
                    <CourseImage src={course.image} alt={course.title} />
                  </div>

                  {/* Course Details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-block px-2 py-0.5 text-[10px] font-semibold rounded-full border ${
                          isApproved
                            ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
                            : isPending
                            ? 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800'
                            : 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800'
                        }`}
                      >
                        {isApproved ? 'Đã duyệt' : isPending ? 'Chờ duyệt' : 'Bản nháp'}
                      </span>

                      {course.averageRating > 0 && (
                        <span className="text-amber-500 text-xs font-semibold flex items-center">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500 mr-0.5" />
                          {course.averageRating.toFixed(1)}
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-semibold text-[#1c192c] dark:text-[#f4eeff] group-hover:text-[#7240b8] dark:group-hover:text-[#a87ffb] transition-colors line-clamp-1 mt-1">
                      {course.title}
                    </h3>

                    <div className="flex items-center gap-2 text-xs text-[#635a72] dark:text-[#a9a0b2] mt-0.5">
                      <span>{course.totalStudents || 0} học viên</span>
                      <span>•</span>
                      <span className="font-semibold text-[#1c192c] dark:text-[#f4eeff]">
                        {formatVND(course.totalRevenue)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Manage Action */}
                <div className="self-end sm:self-center shrink-0">
                  <Link
                    href={`/teacher/courses`}
                    className="px-3 py-1.5 rounded-lg border border-[#f1ebff] dark:border-[#352e43] hover:bg-[#f7f1ff] dark:hover:bg-[#2b2438] text-[#7240b8] dark:text-[#a87ffb] text-xs font-semibold transition-colors"
                  >
                    Quản lý
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
