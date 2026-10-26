'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { useAuth } from '@/contexts/auth-context';
import { enrollmentService } from '@/services/enrollment.service';
import { progressService } from '@/services/progress.service';
import { ApiEnrollmentItem } from '@/types/enrollment';
import { ApiCourseProgressData } from '@/types/progress';
import { ApiCertificate } from '@/types/certificate';
import { certificateService } from '@/services/certificate.service';
import { AppApiError } from '@/types/api';

const DEFAULT_THUMBNAIL =
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80';

type SortMode = 'recent' | 'progress-high' | 'progress-low' | 'title-az';
type FilterTab = 'all' | 'in-progress' | 'completed' | 'not-started';

export default function MyCoursesPage() {
  const { isAuthenticated, status } = useAuth();

  const [enrollments, setEnrollments] = useState<ApiEnrollmentItem[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, ApiCourseProgressData>>({});
  const [certificatesMap, setCertificatesMap] = useState<Record<string, ApiCertificate>>({});
  const [isFetching, setIsFetching] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isLoading = status === 'loading' || isFetching;

  // Filter, Search, Sort & View Modes
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('recent');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Fetch Enrolled Courses from Real API
  const loadEnrollments = async (signal?: AbortSignal) => {
    setIsFetching(true);
    setErrorMessage(null);

    try {
      const [response, certsRes] = await Promise.all([
        enrollmentService.getMyEnrollments({ signal }),
        certificateService.getMyCertificates({ signal }).catch(() => null),
      ]);

      if (certsRes?.data && Array.isArray(certsRes.data)) {
        const cMap: Record<string, ApiCertificate> = {};
        certsRes.data.forEach((cert) => {
          if (cert.courseId) cMap[cert.courseId] = cert;
        });
        setCertificatesMap(cMap);
      } else {
        setCertificatesMap({});
      }

      if (response.success && Array.isArray(response.data)) {
        // Exclude canceled enrollments and require valid course reference
        const validEnrollments = response.data.filter(
          (e) =>
            e &&
            e.status !== 'CANCELED' &&
            e.status !== 'canceled' &&
            e.course &&
            (e.course.slug || e.course.id || e.course._id)
        );
        setEnrollments(validEnrollments);

        // Fetch detailed progress in parallel for enrolled courses
        const courseIds = validEnrollments
          .map((e) => e.courseId || e.course?.id || e.course?._id)
          .filter((id): id is string => Boolean(id));
        const uniqueCourseIds = Array.from(new Set(courseIds));

        if (uniqueCourseIds.length > 0) {
          const progressResults = await Promise.allSettled(
            uniqueCourseIds.map(async (cId) => {
              const res = await progressService.getCourseProgress(cId, { signal });
              return { cId, data: res.data };
            })
          );

          if (!signal?.aborted) {
            const newMap: Record<string, ApiCourseProgressData> = {};
            progressResults.forEach((result) => {
              if (result.status === 'fulfilled' && result.value?.data) {
                newMap[result.value.cId] = result.value.data;
              }
            });
            setProgressMap(newMap);
          }
        }
      } else {
        setEnrollments([]);
        setProgressMap({});
      }
    } catch (err: unknown) {
      if (signal?.aborted) return;
      if (err instanceof Error && err.name === 'AbortError') return;

      const msg =
        err instanceof AppApiError
          ? err.message
          : 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối mạng hoặc thử lại sau.';
      setErrorMessage(msg);
      setEnrollments([]);
      setProgressMap({});
    } finally {
      if (!signal?.aborted) {
        setIsFetching(false);
      }
    }
  };

  useEffect(() => {
    if (status === 'loading' || !isAuthenticated) return;

    let isCurrent = true;
    const controller = new AbortController();

    async function init() {
      if (isCurrent) {
        await loadEnrollments(controller.signal);
      }
    }

    init();

    // Stale-revalidation when switching back to tab/window
    const handleRevalidate = () => {
      if (document.visibilityState === 'visible' && isAuthenticated) {
        loadEnrollments();
      }
    };
    document.addEventListener('visibilitychange', handleRevalidate);
    window.addEventListener('focus', handleRevalidate);

    return () => {
      isCurrent = false;
      controller.abort();
      document.removeEventListener('visibilitychange', handleRevalidate);
      window.removeEventListener('focus', handleRevalidate);
    };
  }, [isAuthenticated, status]);

  // Counts & Overall Progress Calculation
  const counts = useMemo(() => {
    let inProgress = 0;
    let completed = 0;
    let notStarted = 0;
    let totalProgressSum = 0;

    enrollments.forEach((e) => {
      const courseId = e.courseId || e.course?.id || e.course?._id || '';
      const detailed = progressMap[courseId];
      const progress = detailed?.percent !== undefined
        ? Math.min(100, Math.max(0, detailed.percent))
        : Math.min(100, Math.max(0, e.progress ?? 0));
      totalProgressSum += progress;
      const isDone = progress >= 100 || e.status === 'COMPLETED';
      if (isDone) {
        completed++;
      } else if (progress === 0) {
        notStarted++;
      } else {
        inProgress++;
      }
    });

    const overallProgress = enrollments.length > 0
      ? Math.round(totalProgressSum / enrollments.length)
      : 0;

    return {
      all: enrollments.length,
      inProgress,
      completed,
      notStarted,
      overallProgress,
    };
  }, [enrollments, progressMap]);

  // Helper to retrieve the next uncompleted lesson for a course
  const getNextLesson = (courseId: string) => {
    const detailed = progressMap[courseId];
    if (!detailed || !detailed.lessons || detailed.lessons.length === 0) {
      return null;
    }
    const sorted = [...detailed.lessons].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const nextUncompleted = sorted.find((l) => !l.completed);
    if (nextUncompleted) {
      return {
        id: nextUncompleted.id || nextUncompleted._id || '',
        title: nextUncompleted.title || '',
        order: nextUncompleted.order ?? 1,
      };
    }
    const first = sorted[0];
    return {
      id: first.id || first._id || '',
      title: first.title || '',
      order: first.order ?? 1,
    };
  };

  // Find most recent active in-progress course for Continue Learning hero
  const mostRecentInProgress = useMemo(() => {
    // 1. Prioritize active in-progress courses (0 < progress < 100)
    const inProgressList = enrollments.filter((e) => {
      const courseId = e.courseId || e.course?.id || e.course?._id || '';
      const detailed = progressMap[courseId];
      const progress = detailed?.percent !== undefined
        ? Math.min(100, Math.max(0, detailed.percent))
        : Math.min(100, Math.max(0, e.progress ?? 0));
      return progress > 0 && progress < 100 && e.status !== 'COMPLETED';
    });

    if (inProgressList.length > 0) {
      return inProgressList.sort((a, b) => {
        const timeA = new Date(a.enrolledAt || a.createdAt || 0).getTime();
        const timeB = new Date(b.enrolledAt || b.createdAt || 0).getTime();
        return timeB - timeA;
      })[0];
    }

    // 2. If no in-progress courses, fallback to not-started course
    const notStartedList = enrollments.filter((e) => {
      const courseId = e.courseId || e.course?.id || e.course?._id || '';
      const detailed = progressMap[courseId];
      const progress = detailed?.percent !== undefined
        ? Math.min(100, Math.max(0, detailed.percent))
        : Math.min(100, Math.max(0, e.progress ?? 0));
      return progress === 0 && e.status !== 'COMPLETED';
    });

    return notStartedList[0] || null;
  }, [enrollments, progressMap]);

  // Filtered and Sorted Enrollments
  const filteredAndSortedEnrollments = useMemo(() => {
    const list = enrollments.filter((e) => {
      const title = e.course?.title || '';
      const matchesSearch = title.toLowerCase().includes(searchQuery.trim().toLowerCase());
      if (!matchesSearch) return false;

      const courseId = e.courseId || e.course?.id || e.course?._id || '';
      const detailed = progressMap[courseId];
      const progress = detailed?.percent !== undefined
        ? Math.min(100, Math.max(0, detailed.percent))
        : Math.min(100, Math.max(0, e.progress ?? 0));
      const isDone = progress >= 100 || e.status === 'COMPLETED';
      const isNotStarted = progress === 0 && e.status !== 'COMPLETED';

      if (filterTab === 'in-progress') return !isDone && progress > 0;
      if (filterTab === 'completed') return isDone;
      if (filterTab === 'not-started') return isNotStarted;
      return true;
    });

    list.sort((a, b) => {
      const cIdA = a.courseId || a.course?.id || a.course?._id || '';
      const cIdB = b.courseId || b.course?.id || b.course?._id || '';
      const progA = progressMap[cIdA]?.percent !== undefined
        ? progressMap[cIdA].percent
        : Math.min(100, Math.max(0, a.progress ?? 0));
      const progB = progressMap[cIdB]?.percent !== undefined
        ? progressMap[cIdB].percent
        : Math.min(100, Math.max(0, b.progress ?? 0));
      const titleA = a.course?.title || '';
      const titleB = b.course?.title || '';

      if (sortMode === 'progress-high') return progB - progA;
      if (sortMode === 'progress-low') return progA - progB;
      if (sortMode === 'title-az') return titleA.localeCompare(titleB);

      // Default 'recent' sorting by completedAt or createdAt
      const timeA = new Date(a.completedAt || a.createdAt || 0).getTime();
      const timeB = new Date(b.completedAt || b.createdAt || 0).getTime();
      return timeB - timeA;
    });

    return list;
  }, [enrollments, progressMap, filterTab, searchQuery, sortMode]);

  const formatEnrollmentDate = (dateString?: string) => {
    if (!dateString) return 'Gần đây';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return 'Gần đây';
    }
  };

  return (
    <AppShell>
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
        {/* 1. BREADCRUMBS & PAGE HEADING */}
        <section className="flex flex-col gap-2">
          <nav className="flex items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            <Link
              href="/"
              className="hover:text-primary transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">home</span>
              <span>Trang chủ</span>
            </Link>
            <span className="text-zinc-300 dark:text-zinc-600">/</span>
            <span className="text-zinc-900 dark:text-zinc-100 font-semibold">Khóa học của tôi</span>
          </nav>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mt-1">
            <div>
              <h1 className="font-heading font-extrabold text-2xl lg:text-3xl text-zinc-900 dark:text-zinc-100 tracking-tight">
                Khóa học của tôi
              </h1>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
                Tiếp tục hành trình học tập và nâng cao năng lực chuyên môn của bạn.
              </p>
            </div>

            {/* Header Status Pill (from Stitch) */}
            {isAuthenticated && (
              <div className="inline-flex items-center gap-2.5 self-start lg:self-auto px-4 py-2 rounded-full bg-white dark:bg-[#1d1926] border border-zinc-200/80 dark:border-[#2f2742] shadow-2xs text-xs font-medium text-zinc-700 dark:text-zinc-300">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {counts.all} khóa học đã đăng ký
                </span>
                <span className="text-zinc-300 dark:text-zinc-600">•</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <span
                    className="material-symbols-outlined text-[16px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    verified
                  </span>
                  {counts.completed} chứng chỉ sẵn sàng
                </span>
              </div>
            )}
          </div>
        </section>

        {/* 2. STATS METRICS STRIP (from Stitch) */}
        {isAuthenticated && (
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Stat Card 1 */}
            <div className="bg-white dark:bg-[#1d1926] rounded-2xl p-5 border border-zinc-200/80 dark:border-[#2f2742] shadow-xs flex items-center justify-between hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors">
              <div>
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Khóa học tham gia
                </span>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="font-heading font-extrabold text-3xl text-zinc-900 dark:text-zinc-100 tracking-tight">
                    {String(counts.all).padStart(2, '0')}
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">khóa học</span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Tổng hợp tất cả chuyên đề đang theo
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-[#282136] border border-purple-100 dark:border-purple-900/40 flex items-center justify-center text-primary shrink-0 shadow-2xs">
                <span className="material-symbols-outlined text-[26px]">menu_book</span>
              </div>
            </div>

            {/* Stat Card 2 */}
            <div className="bg-white dark:bg-[#1d1926] rounded-2xl p-5 border border-zinc-200/80 dark:border-[#2f2742] shadow-xs flex items-center justify-between hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors">
              <div>
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Đang trong tiến trình
                </span>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="font-heading font-extrabold text-3xl text-primary tracking-tight">
                    {String(counts.inProgress).padStart(2, '0')}
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">khóa học</span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 flex items-center gap-1">
                  <span
                    className="material-symbols-outlined text-amber-500 text-[16px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    local_fire_department
                  </span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    Tiến độ tích cực
                  </span>{' '}
                  trong tuần này
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-[#282136] border border-purple-100 dark:border-purple-900/40 flex items-center justify-center text-primary shrink-0 shadow-2xs">
                <span
                  className="material-symbols-outlined text-[26px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  play_circle
                </span>
              </div>
            </div>

            {/* Stat Card 3 */}
            <div className="bg-white dark:bg-[#1d1926] rounded-2xl p-5 border border-zinc-200/80 dark:border-[#2f2742] shadow-xs flex items-center justify-between hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors">
              <div>
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Khóa học hoàn thành
                </span>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="font-heading font-extrabold text-3xl text-emerald-700 dark:text-emerald-400 tracking-tight">
                    {String(counts.completed).padStart(2, '0')}
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">khóa học</span>
                </div>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium mt-1 flex items-center gap-1">
                  <span
                    className="material-symbols-outlined text-[16px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    workspace_premium
                  </span>
                  {counts.completed} chứng chỉ số xác thực
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800/40 flex items-center justify-center text-emerald-700 dark:text-emerald-400 shrink-0 shadow-2xs">
                <span
                  className="material-symbols-outlined text-[26px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  military_tech
                </span>
              </div>
            </div>

            {/* Stat Card 4 - Overall Learning Progress */}
            <div className="bg-white dark:bg-[#1d1926] rounded-2xl p-5 border border-zinc-200/80 dark:border-[#2f2742] shadow-xs flex items-center justify-between hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors">
              <div>
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Tiến độ trung bình
                </span>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="font-heading font-extrabold text-3xl text-[#7240b8] dark:text-[#a87ffb] tracking-tight">
                    {counts.overallProgress}%
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">hoàn tất</span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Tổng hợp qua {counts.all} khóa học
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-[#282136] border border-purple-100 dark:border-purple-900/40 flex items-center justify-center text-[#7240b8] dark:text-[#a87ffb] shrink-0 shadow-2xs">
                <span className="material-symbols-outlined text-[26px]">donut_large</span>
              </div>
            </div>
          </section>
        )}

        {/* 3. UNAUTHENTICATED STATE */}
        {status !== 'loading' && !isAuthenticated && (
          <div className="p-8 md:p-12 text-center rounded-2xl bg-white dark:bg-[#1d1926] border border-zinc-200/80 dark:border-[#2f2742] shadow-xs flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-full bg-purple-50 dark:bg-[#282136] flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[36px]">lock</span>
            </div>
            <div className="flex flex-col gap-1 max-w-md">
              <h2 className="font-heading font-bold text-lg md:text-xl text-zinc-900 dark:text-zinc-100">
                Vui lòng đăng nhập để xem khóa học của bạn
              </h2>
              <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400">
                Đăng nhập tài khoản TMdemy để tiếp tục học tập và quản lý các khóa học bạn đã đăng ký.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
              <Link
                href="/login?redirect=/my-courses"
                className="px-6 py-2.5 rounded-xl bg-primary hover:bg-[#8b5ad3] text-white text-sm font-bold shadow-md shadow-primary/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">login</span>
                <span>Đăng nhập ngay</span>
              </Link>
              <Link
                href="/courses"
                className="px-6 py-2.5 rounded-xl border border-zinc-200 dark:border-[#2f2742] hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">explore</span>
                <span>Khám phá khóa học</span>
              </Link>
            </div>
          </div>
        )}

        {/* 4. AUTHENTICATED CONTENT */}
        {isAuthenticated && (
          <>
            {/* CONTINUE LEARNING HERO (F7.3-F: Quick resume with next lesson) */}
            {mostRecentInProgress && mostRecentInProgress.course && (
              (() => {
                const item = mostRecentInProgress;
                const course = item.course!;
                const courseId = item.courseId || course.id || course._id || '';
                const courseSlug = course.slug || course.id || course._id || '';
                const progressDetail = progressMap[courseId];
                const progressVal = progressDetail?.percent !== undefined
                  ? Math.min(100, Math.max(0, progressDetail.percent))
                  : Math.min(100, Math.max(0, item.progress ?? 0));
                const nextLesson = getNextLesson(courseId);
                const learnUrl = nextLesson
                  ? `/learn/${encodeURIComponent(courseSlug)}?lesson=${encodeURIComponent(nextLesson.id)}`
                  : `/learn/${encodeURIComponent(courseSlug)}`;

                return (
                  <section className="bg-gradient-to-r from-purple-900 via-[#7240b8] to-[#8b5ad3] rounded-3xl p-6 lg:p-8 text-white shadow-lg relative overflow-hidden">
                    <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
                    <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-10 pointer-events-none hidden md:block">
                      <span className="material-symbols-outlined text-[180px]">play_circle</span>
                    </div>

                    <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                      {/* Left: Thumbnail & Course Info */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 max-w-2xl">
                        <div className="relative w-36 sm:w-44 aspect-video rounded-2xl overflow-hidden bg-white/10 shrink-0 border border-white/20 shadow-md">
                          <img
                            src={course.image || DEFAULT_THUMBNAIL}
                            alt={course.title || 'Course thumbnail'}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = DEFAULT_THUMBNAIL;
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                          <span className="absolute bottom-1.5 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-[10px] font-bold text-white">
                            {progressVal}% TIẾN ĐỘ
                          </span>
                        </div>

                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-bold tracking-wide uppercase">
                              Tiếp tục học gần đây
                            </span>
                            {course.level && (
                              <span className="text-[11px] text-white/80 font-medium">
                                • {course.level}
                              </span>
                            )}
                          </div>

                          <h2 className="text-lg sm:text-xl font-bold font-heading text-white line-clamp-2 leading-snug">
                            {course.title}
                          </h2>

                          {/* Next Lesson Indicator */}
                          {nextLesson ? (
                            <div className="flex items-center gap-2 text-xs text-purple-100 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-white/15 w-fit">
                              <span className="material-symbols-outlined text-[16px] text-[#4edea3]">
                                play_circle
                              </span>
                              <span className="font-semibold text-white truncate max-w-xs sm:max-w-md">
                                Bài tiếp theo: {nextLesson.title}
                              </span>
                            </div>
                          ) : (
                            <p className="text-xs text-purple-200">
                              Sẵn sàng tiếp tục bài giảng trong lớp học trực tuyến
                            </p>
                          )}

                          {/* Progress bar */}
                          <div className="flex flex-col gap-1 w-full max-w-md mt-1">
                            <div className="flex justify-between items-center text-xs text-purple-200">
                              <span>
                                {progressDetail && progressDetail.totalLessons > 0
                                  ? `Đã hoàn thành ${progressDetail.completedLessons}/${progressDetail.totalLessons} bài học`
                                  : `${progressVal}% hoàn thành`}
                              </span>
                              <span className="font-bold text-white">{progressVal}%</span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-white/20 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-[#4edea3] transition-all duration-500 shadow-xs"
                                style={{ width: `${progressVal}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right: CTA Actions */}
                      <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center gap-3 w-full sm:w-auto shrink-0">
                        <Link
                          href={learnUrl}
                          className="px-6 py-3 rounded-2xl bg-white text-[#7240b8] font-bold text-sm shadow-md hover:bg-purple-50 transition-all flex items-center justify-center gap-2 group cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">
                            play_arrow
                          </span>
                          <span>Tiếp tục học ngay</span>
                        </Link>

                        <Link
                          href={`/courses/${encodeURIComponent(courseSlug)}`}
                          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-sm transition-all flex items-center justify-center gap-1.5 text-center"
                        >
                          <span className="material-symbols-outlined text-[16px]">info</span>
                          <span>Thông tin khóa học</span>
                        </Link>
                      </div>
                    </div>
                  </section>
                );
              })()
            )}

            {/* FILTER TABS & TOOLBAR (from Stitch) */}
            <section className="bg-white dark:bg-[#1d1926] rounded-2xl p-3 lg:p-4 border border-zinc-200/80 dark:border-[#2f2742] shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
                <button
                  type="button"
                  onClick={() => setFilterTab('all')}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${filterTab === 'all'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                >
                  <span>Tất cả</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${filterTab === 'all'
                      ? 'bg-white/20 text-white'
                      : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
                      }`}
                  >
                    {counts.all}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setFilterTab('in-progress')}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${filterTab === 'in-progress'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                >
                  <span>Đang học</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${filterTab === 'in-progress'
                      ? 'bg-white/20 text-white'
                      : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
                      }`}
                  >
                    {counts.inProgress}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setFilterTab('completed')}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${filterTab === 'completed'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                >
                  <span>Đã hoàn thành</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${filterTab === 'completed'
                      ? 'bg-white/20 text-white'
                      : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
                      }`}
                  >
                    {counts.completed}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setFilterTab('not-started')}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${filterTab === 'not-started'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                >
                  <span>Chưa bắt đầu</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${filterTab === 'not-started'
                      ? 'bg-white/20 text-white'
                      : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
                      }`}
                  >
                    {counts.notStarted}
                  </span>
                </button>
              </div>

              {/* Right Controls: Search, Sort & View Mode */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Search Input */}
                <div className="relative flex-1 sm:w-60">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-zinc-400 pointer-events-none">
                    search
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm trong khóa học của bạn..."
                    className="w-full pl-9 pr-3 py-1.5 bg-zinc-50 dark:bg-[#171420] border border-zinc-200 dark:border-[#2f2742] rounded-xl text-xs text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:bg-white dark:focus:bg-[#1d1926] focus:border-primary/50 transition-all"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  )}
                </div>

                {/* Sort Dropdown */}
                <div className="relative">
                  <select
                    value={sortMode}
                    onChange={(e) => setSortMode(e.target.value as SortMode)}
                    className="appearance-none bg-zinc-50 dark:bg-[#171420] border border-zinc-200 dark:border-[#2f2742] text-zinc-700 dark:text-zinc-300 pl-3 pr-8 py-1.5 rounded-xl text-xs font-medium cursor-pointer focus:outline-none focus:bg-white dark:focus:bg-[#1d1926] focus:border-primary/50 transition-all"
                  >
                    <option value="recent">Học gần đây nhất</option>
                    <option value="progress-high">Tiến độ cao nhất</option>
                    <option value="progress-low">Tiến độ thấp nhất</option>
                    <option value="title-az">Tên khóa học (A-Z)</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-[18px] text-zinc-400 pointer-events-none">
                    arrow_drop_down
                  </span>
                </div>

                {/* Grid / List View Toggle */}
                <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60">
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    title="Chế độ lưới"
                    className={`p-1 rounded-lg transition-all cursor-pointer ${viewMode === 'grid'
                      ? 'bg-white dark:bg-[#1d1926] text-primary shadow-2xs'
                      : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
                      }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">grid_view</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    title="Chế độ danh sách"
                    className={`p-1 rounded-lg transition-all cursor-pointer ${viewMode === 'list'
                      ? 'bg-white dark:bg-[#1d1926] text-primary shadow-2xs'
                      : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
                      }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">view_agenda</span>
                  </button>
                </div>
              </div>
            </section>

            {/* 5. LOADING SKELETON */}
            {isLoading && (
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse'
                    : 'flex flex-col gap-4 animate-pulse'
                }
              >
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div
                    key={n}
                    className="bg-white dark:bg-[#1d1926] rounded-2xl p-4 border border-zinc-200/60 dark:border-[#2f2742] flex flex-col gap-3"
                  >
                    <div className="w-full aspect-video bg-zinc-200 dark:bg-[#282136] rounded-xl" />
                    <div className="h-3 bg-zinc-200 dark:bg-[#282136] rounded w-1/3 mt-1" />
                    <div className="h-5 bg-zinc-200 dark:bg-[#282136] rounded w-4/5" />
                    <div className="h-3 bg-zinc-200 dark:bg-[#282136] rounded w-2/5" />
                    <div className="h-2 bg-zinc-200 dark:bg-[#282136] rounded-full w-full mt-2" />
                    <div className="h-9 bg-zinc-200 dark:bg-[#282136] rounded-xl w-full mt-1" />
                  </div>
                ))}
              </div>
            )}

            {/* 6. ERROR & RETRY STATE */}
            {!isLoading && errorMessage && (
              <div className="rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/70 dark:border-rose-900/40 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-400 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[24px]">wifi_off</span>
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-sm text-zinc-900 dark:text-zinc-100">
                      Không thể tải danh sách khóa học
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      {errorMessage}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => loadEnrollments()}
                  className="px-4 py-2 rounded-xl bg-white dark:bg-[#1d1926] border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 text-xs font-semibold shadow-2xs flex items-center gap-1.5 shrink-0 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">refresh</span>
                  <span>Thử lại ngay</span>
                </button>
              </div>
            )}

            {/* 7. EMPTY STATE */}
            {!isLoading && !errorMessage && filteredAndSortedEnrollments.length === 0 && (
              <div className="rounded-2xl bg-white dark:bg-[#1d1926] border border-dashed border-zinc-200 dark:border-[#2f2742] p-10 flex flex-col items-center justify-center text-center max-w-xl mx-auto w-full">
                <div className="w-16 h-16 rounded-full bg-purple-50 dark:bg-[#282136] border border-purple-100 dark:border-purple-900/40 flex items-center justify-center text-primary mb-3">
                  <span className="material-symbols-outlined text-[32px]">auto_stories</span>
                </div>
                <h3 className="font-heading font-bold text-base text-zinc-900 dark:text-zinc-100">
                  {searchQuery || filterTab !== 'all'
                    ? 'Không tìm thấy khóa học phù hợp'
                    : 'Bạn chưa tham gia khóa học nào'}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mt-1 mb-4 leading-relaxed">
                  {searchQuery || filterTab !== 'all'
                    ? 'Thử thay đổi từ khóa tìm kiếm hoặc chọn bộ lọc trạng thái khác để xem khóa học.'
                    : 'Khám phá hơn 200+ khóa học chuẩn quốc tế và bắt đầu hành trình nâng cao năng lực công nghệ của bạn ngay hôm nay.'}
                </p>

                {searchQuery || filterTab !== 'all' ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setFilterTab('all');
                    }}
                    className="px-4 py-2 rounded-xl bg-primary hover:bg-[#8b5ad3] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-primary/20 transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">filter_alt_off</span>
                    <span>Xóa bộ lọc</span>
                  </button>
                ) : (
                  <Link
                    href="/courses"
                    className="px-4 py-2 rounded-xl bg-primary hover:bg-[#8b5ad3] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-primary/20 transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">explore</span>
                    <span>Khám phá khóa học</span>
                  </Link>
                )}
              </div>
            )}

            {/* 8. REAL ENROLLED COURSES DISPLAY */}
            {!isLoading && !errorMessage && filteredAndSortedEnrollments.length > 0 && (
              <>
                {viewMode === 'grid' ? (
                  /* GRID VIEW */
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredAndSortedEnrollments.map((item) => {
                      const course = item.course;
                      if (!course) return null;

                      const courseSlug = course.slug || course.id || course._id || item.courseId;
                      const courseId = item.courseId || course.id || course._id || '';
                      const progressDetail = progressMap[courseId];
                      const progressVal = progressDetail?.percent !== undefined
                        ? Math.min(100, Math.max(0, progressDetail.percent))
                        : Math.min(100, Math.max(0, item.progress ?? 0));
                      const isDone = progressVal >= 100 || item.status === 'COMPLETED';
                      const isNotStarted = progressVal === 0 && !isDone;
                      const hasCertificate = Boolean(certificatesMap[courseId]);
                      const nextLesson = getNextLesson(courseId);
                      const learnUrl = nextLesson
                        ? `/learn/${encodeURIComponent(courseSlug)}?lesson=${encodeURIComponent(nextLesson.id)}`
                        : `/learn/${encodeURIComponent(courseSlug)}`;

                      return (
                        <article
                          key={item.id || item._id || courseSlug}
                          className="group bg-white dark:bg-[#1d1926] rounded-2xl border border-zinc-200/80 dark:border-[#2f2742] shadow-xs hover:shadow-lg hover:border-zinc-300 dark:hover:border-zinc-600 transition-all duration-300 flex flex-col justify-between overflow-hidden"
                        >
                          <div>
                            {/* Cover 16:9 */}
                            <div className="relative w-full aspect-video overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                              <img
                                src={course.image || DEFAULT_THUMBNAIL}
                                alt={course.title || 'Course thumbnail'}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = DEFAULT_THUMBNAIL;
                                }}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent pointer-events-none" />

                              {/* Price / Free Badge */}
                              <div className="absolute top-3 left-3">
                                <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md text-primary shadow-xs">
                                  {course.price !== undefined && course.price === 0
                                    ? 'Miễn phí'
                                    : course.price !== undefined && course.price > 0
                                      ? `${course.price.toLocaleString('vi-VN')} đ`
                                      : 'Khóa học trực tuyến'}
                                </span>
                              </div>

                              {/* Status Badge */}
                              {hasCertificate ? (
                                <div className="absolute top-3 right-3">
                                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-700 text-white flex items-center gap-1 shadow-xs">
                                    <span
                                      className="material-symbols-outlined text-[14px]"
                                      style={{ fontVariationSettings: "'FILL' 1" }}
                                    >
                                      verified
                                    </span>
                                    <span>Đã cấp chứng chỉ</span>
                                  </span>
                                </div>
                              ) : isDone ? (
                                <div className="absolute top-3 right-3">
                                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-600 text-white flex items-center gap-1 shadow-xs">
                                    <span
                                      className="material-symbols-outlined text-[14px]"
                                      style={{ fontVariationSettings: "'FILL' 1" }}
                                    >
                                      check_circle
                                    </span>
                                    <span>Đã hoàn thành</span>
                                  </span>
                                </div>
                              ) : null}
                              {isNotStarted && (
                                <div className="absolute top-3 right-3">
                                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-zinc-700 text-white shadow-xs">
                                    Chưa bắt đầu
                                  </span>
                                </div>
                              )}

                              {/* Bottom Overlay Info */}
                              <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white text-xs">
                                <span className="flex items-center gap-1 drop-shadow-xs font-medium">
                                  <span className="material-symbols-outlined text-[16px] text-purple-300">
                                    schedule
                                  </span>
                                  <span>{formatEnrollmentDate(item.createdAt)}</span>
                                </span>
                                <span className="font-semibold bg-black/50 backdrop-blur-xs px-2 py-0.5 rounded-md text-[11px]">
                                  {isDone ? 'Đã hoàn tất' : `${progressVal}% tiến độ`}
                                </span>
                              </div>
                            </div>

                            {/* Card Content Body */}
                            <div className="p-5 flex flex-col gap-3">
                              <h2 className="font-heading font-bold text-base text-zinc-900 dark:text-zinc-100 group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                                {course.title}
                              </h2>

                              {/* Instructor Row */}
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-[#8b5ad3] text-white flex items-center justify-center text-xs font-bold border border-zinc-200 dark:border-zinc-700">
                                  <span className="material-symbols-outlined text-[18px]">
                                    person
                                  </span>
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-200 truncate">
                                    Giảng viên TMdemy
                                  </p>
                                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                                    Chuyên gia đào tạo
                                  </p>
                                </div>
                              </div>

                              {/* Progress Bar & Lesson Counter */}
                              <div className="mt-2">
                                <div className="flex justify-between items-center mb-1.5 text-xs">
                                  {hasCertificate ? (
                                    <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                                      <span className="material-symbols-outlined text-[14px]">
                                        workspace_premium
                                      </span>
                                      Đã nhận chứng chỉ tốt nghiệp
                                    </span>
                                  ) : isDone ? (
                                    <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                                      <span className="material-symbols-outlined text-[14px]">
                                        done_all
                                      </span>
                                      {progressDetail && progressDetail.totalLessons > 0
                                        ? `Hoàn thành (${progressDetail.completedLessons}/${progressDetail.totalLessons} bài)`
                                        : 'Hoàn thành khóa học'}
                                    </span>
                                  ) : isNotStarted ? (
                                    <span className="text-zinc-500 dark:text-zinc-400 font-medium">
                                      {progressDetail && progressDetail.totalLessons > 0
                                        ? `0/${progressDetail.totalLessons} bài học`
                                        : 'Chưa học bài nào'}
                                    </span>
                                  ) : (
                                    <span className="text-zinc-500 dark:text-zinc-400 font-medium">
                                      {progressDetail && progressDetail.totalLessons > 0
                                        ? `${progressDetail.completedLessons}/${progressDetail.totalLessons} bài học`
                                        : 'Tiến độ bài học'}
                                    </span>
                                  )}
                                  <span
                                    className={`font-bold ${isDone
                                      ? 'text-emerald-700 dark:text-emerald-400'
                                      : isNotStarted
                                        ? 'text-zinc-500'
                                        : 'text-primary'
                                      }`}
                                  >
                                    {progressVal}%
                                  </span>
                                </div>
                                <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-500 ${isDone
                                      ? 'bg-emerald-600'
                                      : isNotStarted
                                        ? 'bg-zinc-300 dark:bg-zinc-700'
                                        : 'bg-primary'
                                      }`}
                                    style={{ width: `${progressVal}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Action Button Footer */}
                          <div className="p-5 pt-0">
                            {hasCertificate ? (
                              <div className="grid grid-cols-2 gap-2.5">
                                <Link
                                  href={`/learn/${encodeURIComponent(courseSlug)}`}
                                  className="py-2.5 px-3 rounded-xl border border-zinc-200 dark:border-[#2f2742] hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                                >
                                  <span className="material-symbols-outlined text-[18px]">replay</span>
                                  <span>Ôn tập</span>
                                </Link>
                                <Link
                                  href={`/certificates?courseId=${encodeURIComponent(courseId)}`}
                                  className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-600/20 transition-all cursor-pointer"
                                >
                                  <span
                                    className="material-symbols-outlined text-[18px]"
                                    style={{ fontVariationSettings: "'FILL' 1" }}
                                  >
                                    verified
                                  </span>
                                  <span>Xem chứng chỉ</span>
                                </Link>
                              </div>
                            ) : isDone ? (
                              <div className="grid grid-cols-2 gap-2.5">
                                <Link
                                  href={`/learn/${encodeURIComponent(courseSlug)}`}
                                  className="py-2.5 px-3 rounded-xl border border-zinc-200 dark:border-[#2f2742] hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                                >
                                  <span className="material-symbols-outlined text-[18px]">replay</span>
                                  <span>Ôn tập</span>
                                </Link>
                                <Link
                                  href={`/certificates?courseId=${encodeURIComponent(courseId)}`}
                                  className="py-2.5 px-3 rounded-xl bg-primary hover:bg-[#8b5ad3] text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm shadow-primary/20 transition-all cursor-pointer"
                                >
                                  <span
                                    className="material-symbols-outlined text-[18px]"
                                    style={{ fontVariationSettings: "'FILL' 1" }}
                                  >
                                    workspace_premium
                                  </span>
                                  <span>Nhận chứng chỉ</span>
                                </Link>
                              </div>
                            ) : isNotStarted ? (
                              <Link
                                href={learnUrl}
                                className="w-full py-2.5 px-4 rounded-xl bg-primary hover:bg-[#8b5ad3] text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm shadow-primary/20 hover:shadow-md transition-all cursor-pointer group-hover:-translate-y-0.5"
                              >
                                <span className="material-symbols-outlined text-[18px]">
                                  rocket_launch
                                </span>
                                <span>Bắt đầu học ngay</span>
                              </Link>
                            ) : (
                              <Link
                                href={learnUrl}
                                className="w-full py-2.5 px-4 rounded-xl bg-primary hover:bg-[#8b5ad3] text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm shadow-primary/20 hover:shadow-md transition-all cursor-pointer group-hover:-translate-y-0.5"
                              >
                                <span
                                  className="material-symbols-outlined text-[18px]"
                                  style={{ fontVariationSettings: "'FILL' 1" }}
                                >
                                  play_arrow
                                </span>
                                <span>Tiếp tục học ngay</span>
                              </Link>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  /* LIST VIEW */
                  <div className="flex flex-col gap-4">
                    {filteredAndSortedEnrollments.map((item) => {
                      const course = item.course;
                      if (!course) return null;

                      const courseSlug = course.slug || course.id || course._id || item.courseId;
                      const courseId = item.courseId || course.id || course._id || '';
                      const progressDetail = progressMap[courseId];
                      const progressVal = progressDetail?.percent !== undefined
                        ? Math.min(100, Math.max(0, progressDetail.percent))
                        : Math.min(100, Math.max(0, item.progress ?? 0));
                      const isDone = progressVal >= 100 || item.status === 'COMPLETED';
                      const isNotStarted = progressVal === 0 && !isDone;
                      const hasCertificate = Boolean(certificatesMap[courseId]);
                      const nextLesson = getNextLesson(courseId);
                      const learnUrl = nextLesson
                        ? `/learn/${encodeURIComponent(courseSlug)}?lesson=${encodeURIComponent(nextLesson.id)}`
                        : `/learn/${encodeURIComponent(courseSlug)}`;

                      return (
                        <article
                          key={item.id || item._id || courseSlug}
                          className="group bg-white dark:bg-[#1d1926] rounded-2xl border border-zinc-200/80 dark:border-[#2f2742] p-4 shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row items-center gap-5 justify-between"
                        >
                          {/* Thumbnail on left */}
                          <div className="relative w-full md:w-60 aspect-video rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 shrink-0">
                            <img
                              src={course.image || DEFAULT_THUMBNAIL}
                              alt={course.title || 'Course thumbnail'}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = DEFAULT_THUMBNAIL;
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                            <div className="absolute bottom-2 left-2 text-white text-[11px] font-medium flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px] text-purple-300">
                                schedule
                              </span>
                              <span>{formatEnrollmentDate(item.createdAt)}</span>
                            </div>
                          </div>

                          {/* Middle Info */}
                          <div className="flex-1 w-full flex flex-col gap-2 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 dark:bg-purple-950/40 text-primary">
                                {course.price !== undefined && course.price === 0
                                  ? 'Miễn phí'
                                  : course.price !== undefined && course.price > 0
                                    ? `${course.price.toLocaleString('vi-VN')} đ`
                                    : 'Khóa học'}
                              </span>
                              {hasCertificate ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[13px]">verified</span>
                                  Đã cấp chứng chỉ
                                </span>
                              ) : isDone ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">
                                  Đã hoàn thành bài học
                                </span>
                              ) : isNotStarted ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                                  Chưa bắt đầu
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400">
                                  Đang học
                                </span>
                              )}
                            </div>

                            <h2 className="font-heading font-bold text-base text-zinc-900 dark:text-zinc-100 group-hover:text-primary transition-colors line-clamp-1">
                              {course.title}
                            </h2>

                            {/* Progress bar in List View */}
                            <div className="flex flex-col gap-1 max-w-md">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-zinc-500 dark:text-zinc-400 font-medium">
                                  {hasCertificate
                                    ? 'Đã nhận chứng chỉ tốt nghiệp'
                                    : isDone
                                    ? progressDetail && progressDetail.totalLessons > 0
                                      ? `Hoàn tất (${progressDetail.completedLessons}/${progressDetail.totalLessons} bài)`
                                      : 'Hoàn thành khóa học'
                                    : isNotStarted
                                      ? progressDetail && progressDetail.totalLessons > 0
                                        ? `0/${progressDetail.totalLessons} bài`
                                        : 'Chưa học bài nào'
                                      : progressDetail && progressDetail.totalLessons > 0
                                        ? `${progressDetail.completedLessons}/${progressDetail.totalLessons} bài học`
                                        : 'Tiến độ'}
                                </span>
                                <span
                                  className={`font-bold ${isDone
                                    ? 'text-emerald-700 dark:text-emerald-400'
                                    : 'text-primary'
                                    }`}
                                >
                                  {progressVal}%
                                </span>
                              </div>
                              <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${isDone ? 'bg-emerald-600' : 'bg-primary'
                                    }`}
                                  style={{ width: `${progressVal}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* CTA on right */}
                          <div className="w-full md:w-44 shrink-0 flex flex-col justify-center">
                            {hasCertificate ? (
                              <div className="flex flex-col gap-2">
                                <Link
                                  href={`/learn/${encodeURIComponent(courseSlug)}`}
                                  className="w-full py-2 px-3 rounded-xl border border-zinc-200 dark:border-[#2f2742] hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                                >
                                  <span className="material-symbols-outlined text-[16px]">
                                    replay
                                  </span>
                                  <span>Ôn tập</span>
                                </Link>
                                <Link
                                  href={`/certificates?courseId=${encodeURIComponent(courseId)}`}
                                  className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                                >
                                  <span className="material-symbols-outlined text-[16px]">
                                    verified
                                  </span>
                                  <span>Xem chứng chỉ</span>
                                </Link>
                              </div>
                            ) : isDone ? (
                              <div className="flex flex-col gap-2">
                                <Link
                                  href={`/learn/${encodeURIComponent(courseSlug)}`}
                                  className="w-full py-2 px-3 rounded-xl border border-zinc-200 dark:border-[#2f2742] hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                                >
                                  <span className="material-symbols-outlined text-[16px]">
                                    replay
                                  </span>
                                  <span>Ôn tập</span>
                                </Link>
                                <Link
                                  href={`/certificates?courseId=${encodeURIComponent(courseId)}`}
                                  className="w-full py-2 px-3 rounded-xl bg-primary hover:bg-[#8b5ad3] text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm shadow-primary/20 transition-all cursor-pointer"
                                >
                                  <span className="material-symbols-outlined text-[16px]">
                                    workspace_premium
                                  </span>
                                  <span>Nhận chứng chỉ</span>
                                </Link>
                              </div>
                            ) : (
                              <Link
                                href={learnUrl}
                                className="w-full py-2.5 px-4 rounded-xl bg-primary hover:bg-[#8b5ad3] text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm shadow-primary/20 transition-all cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[18px]">
                                  {isNotStarted ? 'rocket_launch' : 'play_arrow'}
                                </span>
                                <span>{isNotStarted ? 'Bắt đầu học' : 'Tiếp tục học'}</span>
                              </Link>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
