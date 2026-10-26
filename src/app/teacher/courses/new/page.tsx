'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { CourseForm } from '@/components/teacher/courses/course-form';
import { courseService } from '@/services/course.service';
import { CreateTeacherCourseDto } from '@/types/course';
import { toast } from '@/lib/toast';
import { AppApiError } from '@/types/api';

export default function CreateCoursePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const handleCreateCourse = async (data: CreateTeacherCourseDto) => {
    setIsSubmitting(true);
    setServerError(null);

    try {
      await courseService.createTeacherCourse(data);
      toast.success('Tạo khóa học thành công! Khóa học đang ở trạng thái Chờ duyệt (Pending).');
      router.push('/teacher/courses');
    } catch (err: unknown) {
      console.error('Error creating teacher course:', err);
      if (err instanceof AppApiError) {
        setServerError(err.message);
        toast.error(err.message);
      } else {
        const fallback = 'Không thể tạo khóa học. Vui lòng kiểm tra lại thông tin và thử lại.';
        setServerError(fallback);
        toast.error(fallback);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Navigation & Breadcrumbs */}
      <div className="flex flex-col gap-3">
        <Link
          href="/teacher/courses"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7240b8] dark:text-[#a87ffb] hover:underline w-fit group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Quay lại danh sách khóa học</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#1c192c] dark:text-[#f4eeff]">
              Tạo khóa học mới
            </h1>
            <p className="text-xs sm:text-sm text-[#635a72] dark:text-[#a9a0b2] mt-1">
              Điền thông tin chi tiết và tải tài liệu giới thiệu để gửi phê duyệt lên ban quản trị TMdemy.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              <span>Khởi tạo: <strong>Bản nháp (Pending duyệt)</strong></span>
            </span>
          </div>
        </div>
      </div>

      {serverError && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs sm:text-sm text-rose-800 dark:text-rose-200 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
          <p>{serverError}</p>
        </div>
      )}

      {/* Course Form */}
      <CourseForm
        isEdit={false}
        onSubmit={handleCreateCourse}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
