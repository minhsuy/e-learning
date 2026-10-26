'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  AlertTriangle,
  RefreshCw,
  ArrowLeft,
  ShieldAlert,
  FileQuestion,
} from 'lucide-react';
import { teacherStatisticsService } from '@/services/teacher-statistics.service';
import { courseService } from '@/services/course.service';
import { TeacherCoursePerformanceData } from '@/types/teacher-statistics';
import { TeacherCourseItem } from '@/types/course';
import { AppApiError } from '@/types/api';

import { PerformanceHeader } from '@/components/teacher/performance/performance-header';
import { PerformanceKpiCards } from '@/components/teacher/performance/performance-kpi-cards';
import { PerformanceLearningAnalytics } from '@/components/teacher/performance/performance-learning-analytics';
import { PerformanceLessonFunnel } from '@/components/teacher/performance/performance-lesson-funnel';
import { PerformanceQuizAnalytics } from '@/components/teacher/performance/performance-quiz-analytics';

export default function TeacherCoursePerformancePage() {
  const params = useParams();
  const courseId = (params?.id as string) || '';

  // Data states
  const [performanceData, setPerformanceData] = useState<TeacherCoursePerformanceData | null>(null);
  const [coursesList, setCoursesList] = useState<TeacherCourseItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [reloadKey, setReloadKey] = useState<number>(0);

  // 1. Fetch Performance Data
  useEffect(() => {
    if (!courseId) return;

    let isMounted = true;
    const controller = new AbortController();

    const fetchPerformance = async () => {
      setIsLoading(true);
      setIsError(false);
      setErrorStatus(null);
      setErrorMessage('');

      try {
        const res = await teacherStatisticsService.getCoursePerformance(courseId, {
          signal: controller.signal,
        });

        if (!isMounted) return;

        if (res && res.data) {
          setPerformanceData(res.data);
        } else {
          setIsError(true);
          setErrorMessage('Không nhận được dữ liệu hiệu suất từ máy chủ.');
        }
      } catch (err: unknown) {
        if (!isMounted || controller.signal.aborted) return;
        setIsError(true);

        if (err instanceof AppApiError) {
          setErrorStatus(err.statusCode);
          if (err.statusCode === 403) {
            setErrorMessage('Bạn không có quyền truy cập dữ liệu hiệu suất của khóa học này.');
          } else if (err.statusCode === 404) {
            setErrorMessage('Không tìm thấy thông tin khóa học yêu cầu.');
          } else {
            setErrorMessage(err.message || 'Không thể tải báo cáo hiệu suất khóa học.');
          }
        } else if (err instanceof Error) {
          setErrorMessage(err.message);
        } else {
          setErrorMessage('Đã xảy ra lỗi không xác định khi kết nối máy chủ.');
        }
      } finally {
        if (isMounted && !controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    fetchPerformance();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [courseId, reloadKey]);

  // 2. Fetch Teacher Courses List for the Course Switcher Dropdown (background fetch, non-blocking)
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchCoursesList = async () => {
      try {
        const res = await courseService.getTeacherCourses(
          { limit: 50 },
          { signal: controller.signal }
        );
        if (isMounted && res?.data?.courses) {
          setCoursesList(res.data.courses);
        }
      } catch (err: unknown) {
        if (!controller.signal.aborted) {
          // Non-critical, ignore error for course dropdown
          console.warn('Could not load course list for switcher:', err);
        }
      }
    };

    fetchCoursesList();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  const handleRefresh = () => {
    setReloadKey((prev) => prev + 1);
  };

  // State: Error 403 Forbidden
  if (isError && errorStatus === 403) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 flex items-center justify-center mx-auto text-amber-600 dark:text-amber-400 mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-[#1c192c] dark:text-[#f4eeff]">
          Không Có Quyền Truy Cập
        </h2>
        <p className="text-sm text-[#635a72] dark:text-[#a9a0b2] mt-2 max-w-md mx-auto">
          {errorMessage || 'Bạn chỉ có thể xem báo cáo hiệu suất của các khóa học do chính bạn tạo ra.'}
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link
            href="/teacher/courses"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#7240b8] hover:bg-[#60359d] text-white text-sm font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Về danh sách khóa học</span>
          </Link>
        </div>
      </div>
    );
  }

  // State: Error 404 Not Found
  if (isError && errorStatus === 404) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 flex items-center justify-center mx-auto text-rose-600 dark:text-rose-400 mb-4">
          <FileQuestion className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-[#1c192c] dark:text-[#f4eeff]">
          Khóa Học Không Tồn Tại
        </h2>
        <p className="text-sm text-[#635a72] dark:text-[#a9a0b2] mt-2 max-w-md mx-auto">
          Khóa học với mã ID này không tồn tại hoặc đã bị gỡ bỏ khỏi hệ thống.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link
            href="/teacher/courses"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#7240b8] hover:bg-[#60359d] text-white text-sm font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Về danh sách khóa học</span>
          </Link>
        </div>
      </div>
    );
  }

  // State: General Error with Retry
  if (isError && !isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 flex items-center justify-center mx-auto text-rose-600 dark:text-rose-400 mb-4">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-[#1c192c] dark:text-[#f4eeff]">
          Lỗi Tải Báo Cáo Hiệu Suất
        </h2>
        <p className="text-sm text-[#635a72] dark:text-[#a9a0b2] mt-2 max-w-md mx-auto">
          {errorMessage || 'Đã có lỗi xảy ra trong quá trình kết nối với máy chủ thống kê.'}
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#7240b8] hover:bg-[#60359d] text-white text-sm font-semibold transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Thử lại</span>
          </button>
          <Link
            href="/teacher/courses"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#eceaf3] dark:border-[#352e43] bg-white dark:bg-[#1d1926] text-sm font-semibold text-[#1c192c] dark:text-[#f4eeff] hover:bg-[#f7f1ff] dark:hover:bg-[#282234] transition-colors"
          >
            <span>Về danh sách</span>
          </Link>
        </div>
      </div>
    );
  }

  const course = performanceData?.course || null;
  const overview = performanceData?.overview || null;
  const curriculum = performanceData?.curriculum || null;
  const quizzes = performanceData?.quizzes || null;
  const lessonsFunnel = performanceData?.lessonsFunnel || [];

  const totalStudents = overview?.students?.totalStudents || 0;
  const totalRevenue = overview?.revenue?.totalRevenue || 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Course Header & Navigation */}
      <PerformanceHeader
        course={course}
        courseId={courseId}
        coursesList={coursesList}
        totalStudents={totalStudents}
        totalRevenue={totalRevenue}
        isLoading={isLoading}
        onRefresh={handleRefresh}
      />

      {/* 2. Key Performance Indicators Overview (6 Cards) */}
      <PerformanceKpiCards
        overview={overview}
        isLoading={isLoading}
      />

      {/* 3. Learning Progress & Rating Analytics */}
      <PerformanceLearningAnalytics
        overview={overview}
        curriculum={curriculum}
        isLoading={isLoading}
      />

      {/* 4. Lesson Completion Funnel Analytics */}
      <PerformanceLessonFunnel
        funnel={lessonsFunnel}
        totalStudents={totalStudents}
        isLoading={isLoading}
      />

      {/* 5. Quiz Performance Analytics */}
      <PerformanceQuizAnalytics
        quizzes={quizzes}
        courseId={courseId}
        isLoading={isLoading}
      />
    </div>
  );
}
