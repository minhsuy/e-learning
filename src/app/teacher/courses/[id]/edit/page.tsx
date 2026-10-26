'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, AlertCircle, ShieldAlert } from 'lucide-react';
import { CourseForm } from '@/components/teacher/courses/course-form';
import { courseService } from '@/services/course.service';
import { CreateTeacherCourseDto, TeacherCourseItem } from '@/types/course';
import { CourseStatusBadge } from '@/components/teacher/courses/course-status-badge';
import { toast } from '@/lib/toast';
import { AppApiError } from '@/types/api';

export default function EditCoursePage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params?.id as string;

  const [course, setCourse] = useState<TeacherCourseItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [errorCode, setErrorCode] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadCourse() {
      if (!courseId) return;

      setIsLoading(true);
      setIsError(false);
      setErrorMessage('');

      try {
        const data = await courseService.getTeacherCourseById(courseId);
        if (!isMounted) return;

        if (!data) {
          setIsError(true);
          setErrorCode(404);
          setErrorMessage('Không tìm thấy thông tin khóa học hoặc khóa học không thuộc quyền quản lý của bạn.');
        } else {
          setCourse(data);
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        setIsError(true);
        if (err instanceof AppApiError) {
          setErrorCode(err.statusCode);
          setErrorMessage(err.message);
        } else {
          setErrorMessage('Không thể tải thông tin khóa học.');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadCourse();

    return () => {
      isMounted = false;
    };
  }, [courseId]);

  const handleUpdateCourse = async (data: CreateTeacherCourseDto) => {
    if (!courseId) return;

    setIsSubmitting(true);

    try {
      await courseService.updateTeacherCourse(courseId, data);
      toast.success('Cập nhật thông tin khóa học thành công!');
      router.push('/teacher/courses');
    } catch (err: unknown) {
      console.error('Error updating course:', err);
      if (err instanceof AppApiError) {
        toast.error(err.message);
      } else {
        toast.error('Không thể cập nhật khóa học. Vui lòng kiểm tra lại thông tin.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        <div className="h-10 w-96 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            <div className="h-64 bg-slate-100 dark:bg-[#1d1926] rounded-2xl animate-pulse" />
            <div className="h-48 bg-slate-100 dark:bg-[#1d1926] rounded-2xl animate-pulse" />
          </div>
          <div className="lg:col-span-4">
            <div className="h-96 bg-slate-100 dark:bg-[#1d1926] rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !course) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-xl mx-auto text-center space-y-4 pt-16">
        <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 mx-auto flex items-center justify-center">
          {errorCode === 403 ? <ShieldAlert className="w-7 h-7" /> : <AlertCircle className="w-7 h-7" />}
        </div>

        <h1 className="text-xl sm:text-2xl font-bold text-[#1c192c] dark:text-[#f4eeff]">
          {errorCode === 403 ? 'Không có quyền truy cập' : 'Không tìm thấy khóa học'}
        </h1>

        <p className="text-xs sm:text-sm text-[#635a72] dark:text-[#a9a0b2] leading-relaxed">
          {errorMessage || 'Khóa học không tồn tại hoặc đã bị gỡ bỏ.'}
        </p>

        <div className="pt-4 flex items-center justify-center gap-3">
          <Link
            href="/teacher/courses"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#7240b8] hover:bg-[#5e3299] text-white text-xs sm:text-sm font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Về Danh sách khóa học</span>
          </Link>
        </div>
      </div>
    );
  }

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
              Chỉnh sửa khóa học
            </h1>
            <p className="text-xs sm:text-sm text-[#635a72] dark:text-[#a9a0b2] mt-1">
              Cập nhật nội dung tiêu đề, mô tả, hình ảnh và thiết lập học phí cho khóa học của bạn.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[#635a72] dark:text-[#a9a0b2]">Trạng thái:</span>
            <CourseStatusBadge status={course.status} />
          </div>
        </div>
      </div>

      {/* Course Form with Prefilled Data */}
      <CourseForm
        initialData={{
          title: course.title,
          slug: course.slug,
          description: course.description || '',
          category: course.category?.id || course.category?._id,
          level: (course.level?.toLowerCase() as 'beginner' | 'intermediate' | 'advanced') || 'beginner',
          type: (course.type?.toLowerCase() as 'paid' | 'free') || (course.price > 0 ? 'paid' : 'free'),
          price: course.price,
          old_price: course.oldPrice ?? course.old_price,
          image: course.image || '',
          intro_url: course.intro_url || course.introUrl || '',
          info: course.info,
        }}
        isEdit={true}
        onSubmit={handleUpdateCourse}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
