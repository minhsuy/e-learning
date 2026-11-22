'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ChartNoAxesCombined, ArrowLeft, BookOpen } from 'lucide-react';
import {
  TeacherCoursePerformanceData,
  TeacherCoursesStatsData,
  TeacherEnrollmentStatsData,
  TeacherLearningStatsData,
  TeacherOverviewData,
  TeacherRevenueData,
} from '@/types/teacher-statistics';
import { teacherStatisticsService } from '@/services/teacher-statistics.service';
import {
  DEFAULT_TEACHER_ANALYTICS_FILTERS,
  TeacherAnalyticsFilterState,
  buildTeacherEnrollmentQueryParams,
  buildTeacherRevenueQueryParams,
  getTeacherPeriodLabel,
  isValidCourseUuid,
  normalizeTeacherApiError,
  parseTeacherFiltersFromSearchParams,
  serializeTeacherFiltersToSearchParams,
  validateTeacherDateRange,
} from '@/lib/teacher-analytics';
import {
  TeacherAnalyticsFilterBar,
  TeacherCourseOption,
} from './teacher-analytics-filter-bar';
import { TeacherOverviewKpis } from './teacher-overview-kpis';
import { TeacherRevenueTrendChart } from './teacher-revenue-trend-chart';
import { TeacherMethodBreakdownCard } from './teacher-method-breakdown-card';
import {
  TeacherCourseStatusFilter,
  TeacherCoursesRanking,
  TeacherCoursesSortBy,
} from './teacher-courses-ranking';
import { TeacherCoursePerformancePreview } from './teacher-course-performance-preview';
import { TeacherEnrollmentAnalytics } from './teacher-enrollment-analytics';
import { TeacherLearningAnalytics } from './teacher-learning-analytics';

export function TeacherAnalyticsView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Global Filters synced with URL
  const [filters, setFilters] = useState<TeacherAnalyticsFilterState>(() =>
    parseTeacherFiltersFromSearchParams(searchParams)
  );

  // Owned courses dropdown options
  const [ownedCourses, setOwnedCourses] = useState<TeacherCourseOption[]>([]);

  // 1. Overview State (GET /api/teacher/statistics/overview)
  const [overview, setOverview] = useState<TeacherOverviewData | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState<string | null>(null);

  // 2. Revenue State (GET /api/teacher/statistics/revenue)
  const [revenue, setRevenue] = useState<TeacherRevenueData | null>(null);
  const [revenueLoading, setRevenueLoading] = useState(true);
  const [revenueError, setRevenueError] = useState<string | null>(null);

  // 3. Courses Ranking State (GET /api/teacher/statistics/courses)
  const [coursesData, setCoursesData] = useState<TeacherCoursesStatsData | null>(null);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [coursesError, setCoursesError] = useState<string | null>(null);
  const [coursesPage, setCoursesPage] = useState(1);
  const [coursesSortBy, setCoursesSortBy] = useState<TeacherCoursesSortBy>('revenue');
  const [coursesStatusFilter, setCoursesStatusFilter] =
    useState<TeacherCourseStatusFilter>('all');

  // 4. Enrollments State (GET /api/teacher/statistics/enrollments)
  const [enrollments, setEnrollments] = useState<TeacherEnrollmentStatsData | null>(null);
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(true);
  const [enrollmentsError, setEnrollmentsError] = useState<string | null>(null);

  // 5. Learning State (GET /api/teacher/statistics/learning)
  const [learning, setLearning] = useState<TeacherLearningStatsData | null>(null);
  const [learningLoading, setLearningLoading] = useState(true);
  const [learningError, setLearningError] = useState<string | null>(null);

  // 6. Course Performance Preview State (GET /api/teacher/statistics/course-performance/:courseId)
  const [selectedPerformanceCourseId, setSelectedPerformanceCourseId] = useState<string>(
    () => filters.courseId || ''
  );
  const [performanceData, setPerformanceData] = useState<TeacherCoursePerformanceData | null>(
    null
  );
  const [performanceLoading, setPerformanceLoading] = useState(false);
  const [performanceError, setPerformanceError] = useState<{
    statusCode: number | null;
    message: string;
  } | null>(null);

  // Refresh & retry keys
  const [reloadKey, setReloadKey] = useState(0);
  const [perfRetryKey, setPerfRetryKey] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const { period, startDate, endDate, timeBasis, timezone, courseId } = filters;

  const syncUrlParams = useCallback(
    (next: TeacherAnalyticsFilterState) => {
      const qs = serializeTeacherFiltersToSearchParams(next).toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router]
  );

  const handleApplyFilters = useCallback(
    (next: TeacherAnalyticsFilterState) => {
      const validation = validateTeacherDateRange(next.period, next.startDate, next.endDate);
      if (!validation.valid) return;
      setFilters(next);
      if (next.courseId) {
        setSelectedPerformanceCourseId(next.courseId);
      }
      syncUrlParams(next);
    },
    [syncUrlParams]
  );

  const handleResetFilters = useCallback(() => {
    setFilters(DEFAULT_TEACHER_ANALYTICS_FILTERS);
    syncUrlParams(DEFAULT_TEACHER_ANALYTICS_FILTERS);
  }, [syncUrlParams]);

  const handleRefresh = useCallback(() => {
    setReloadKey((k) => k + 1);
  }, []);

  // Load owned courses catalog once for course dropdown (max 100 owned courses)
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const loadOwnedCourses = async () => {
      try {
        const res = await teacherStatisticsService.getCoursesStats(
          { page: 1, limit: 100, sortBy: 'revenue', order: 'desc' },
          { signal: controller.signal }
        );
        if (!isMounted) return;
        if (res.success && res.data?.courses) {
          const opts = res.data.courses
            .map((c) => ({
              id: c.id || c._id || '',
              title: c.title,
              status: c.status,
            }))
            .filter((item) => Boolean(item.id));
          setOwnedCourses(opts);
          setSelectedPerformanceCourseId((prev) => prev || opts[0]?.id || '');
        }
      } catch {
        // Non-blocking; course ranking panel handles its own error display
      }
    };

    void loadOwnedCourses();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [reloadKey]);

  // 1. Fetch Overview
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const loadOverview = async () => {
      await Promise.resolve();
      if (!isMounted) return;
      setOverviewLoading(true);
      setOverviewError(null);
      try {
        const res = await teacherStatisticsService.getOverview({ signal: controller.signal });
        if (!isMounted) return;
        if (res.success && res.data) {
          setOverview(res.data);
          setLastUpdated(new Date());
        } else {
          setOverviewError(res.message || 'Không thể tải chỉ số tổng quan giảng viên.');
        }
      } catch (err: unknown) {
        if (!isMounted || controller.signal.aborted) return;
        setOverviewError(
          normalizeTeacherApiError(err, 'Không thể tải dữ liệu tổng quan giảng viên.').message
        );
      } finally {
        if (isMounted) setOverviewLoading(false);
      }
    };

    void loadOverview();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [reloadKey]);

  // 2. Fetch Revenue Timeline & Payment Method Breakdown
  useEffect(() => {
    const validation = validateTeacherDateRange(period, startDate, endDate);
    if (!validation.valid) return;

    let isMounted = true;
    const controller = new AbortController();

    const loadRevenue = async () => {
      await Promise.resolve();
      if (!isMounted) return;
      setRevenueLoading(true);
      setRevenueError(null);
      try {
        const query = buildTeacherRevenueQueryParams({
          period,
          startDate,
          endDate,
          timeBasis,
          timezone,
          courseId,
        });
        const res = await teacherStatisticsService.getRevenue(query, {
          signal: controller.signal,
        });
        if (!isMounted) return;
        if (res.success && res.data) {
          setRevenue(res.data);
          setLastUpdated(new Date());
        } else {
          setRevenueError(res.message || 'Không thể tải dữ liệu doanh thu.');
        }
      } catch (err: unknown) {
        if (!isMounted || controller.signal.aborted) return;
        setRevenueError(
          normalizeTeacherApiError(err, 'Không thể tải dữ liệu doanh thu giảng viên.').message
        );
      } finally {
        if (isMounted) setRevenueLoading(false);
      }
    };

    void loadRevenue();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [period, startDate, endDate, timeBasis, timezone, courseId, reloadKey]);

  // 3. Fetch Paginated Courses Ranking
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const loadCourses = async () => {
      await Promise.resolve();
      if (!isMounted) return;
      setCoursesLoading(true);
      setCoursesError(null);
      try {
        const res = await teacherStatisticsService.getCoursesStats(
          {
            page: coursesPage,
            limit: 10,
            sortBy: coursesSortBy,
            order: 'desc',
            status: coursesStatusFilter !== 'all' ? coursesStatusFilter : undefined,
          },
          { signal: controller.signal }
        );
        if (!isMounted) return;
        if (res.success && res.data) {
          setCoursesData(res.data);
        } else {
          setCoursesError(res.message || 'Không thể tải bảng xếp hạng khóa học.');
        }
      } catch (err: unknown) {
        if (!isMounted || controller.signal.aborted) return;
        setCoursesError(
          normalizeTeacherApiError(err, 'Không thể tải thống kê từng khóa học.').message
        );
      } finally {
        if (isMounted) setCoursesLoading(false);
      }
    };

    void loadCourses();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [coursesPage, coursesSortBy, coursesStatusFilter, reloadKey]);

  // 4. Fetch Enrollments Analytics
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const loadEnrollments = async () => {
      await Promise.resolve();
      if (!isMounted) return;
      setEnrollmentsLoading(true);
      setEnrollmentsError(null);
      try {
        const query = buildTeacherEnrollmentQueryParams({
          period,
          startDate,
          endDate,
          timeBasis,
          timezone,
          courseId,
        });
        const res = await teacherStatisticsService.getEnrollmentsStats(query, {
          signal: controller.signal,
        });
        if (!isMounted) return;
        if (res.success && res.data) {
          setEnrollments(res.data);
        } else {
          setEnrollmentsError(res.message || 'Không thể tải thống kê ghi danh.');
        }
      } catch (err: unknown) {
        if (!isMounted || controller.signal.aborted) return;
        setEnrollmentsError(
          normalizeTeacherApiError(err, 'Không thể tải xu hướng ghi danh học viên.').message
        );
      } finally {
        if (isMounted) setEnrollmentsLoading(false);
      }
    };

    void loadEnrollments();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [period, startDate, endDate, timeBasis, timezone, courseId, reloadKey]);

  // 5. Fetch Student Learning Analytics
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const loadLearning = async () => {
      await Promise.resolve();
      if (!isMounted) return;
      setLearningLoading(true);
      setLearningError(null);
      try {
        const res = await teacherStatisticsService.getLearningStats(
          isValidCourseUuid(courseId) ? { courseId } : undefined,
          { signal: controller.signal }
        );
        if (!isMounted) return;
        if (res.success && res.data) {
          setLearning(res.data);
        } else {
          setLearningError(res.message || 'Không thể tải dữ liệu tiến độ học tập.');
        }
      } catch (err: unknown) {
        if (!isMounted || controller.signal.aborted) return;
        setLearningError(
          normalizeTeacherApiError(err, 'Không thể tải chỉ số hiệu quả đào tạo.').message
        );
      } finally {
        if (isMounted) setLearningLoading(false);
      }
    };

    void loadLearning();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [courseId, reloadKey]);

  // 6. Fetch Course Performance Snapshot for Selected Owned Course
  useEffect(() => {
    if (!isValidCourseUuid(selectedPerformanceCourseId)) return;

    let isMounted = true;
    const controller = new AbortController();

    const loadPerformance = async () => {
      await Promise.resolve();
      if (!isMounted) return;
      setPerformanceLoading(true);
      setPerformanceError(null);
      try {
        const res = await teacherStatisticsService.getCoursePerformance(
          selectedPerformanceCourseId,
          { signal: controller.signal }
        );
        if (!isMounted) return;
        if (res.success && res.data) {
          setPerformanceData(res.data);
        } else {
          setPerformanceError({
            statusCode: null,
            message: res.message || 'Không thể tải dữ liệu hiệu suất khóa học.',
          });
        }
      } catch (err: unknown) {
        if (!isMounted || controller.signal.aborted) return;
        setPerformanceError(
          normalizeTeacherApiError(err, 'Không thể tải chi tiết hiệu suất khóa học.')
        );
      } finally {
        if (isMounted) setPerformanceLoading(false);
      }
    };

    void loadPerformance();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [selectedPerformanceCourseId, reloadKey, perfRetryKey]);

  const effectivePerformanceData =
    performanceData &&
    (performanceData.course.id === selectedPerformanceCourseId ||
      performanceData.course._id === selectedPerformanceCourseId)
      ? performanceData
      : null;

  const enrollmentPeriodLabel =
    period === '7days'
      ? getTeacherPeriodLabel('7days')
      : period === '12months'
      ? getTeacherPeriodLabel('12months')
      : getTeacherPeriodLabel('30days');

  const isAnyLoading =
    overviewLoading ||
    revenueLoading ||
    coursesLoading ||
    enrollmentsLoading ||
    learningLoading;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-3 border-b border-[#f1ebff] dark:border-[#2b2438]">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <div className="w-9 h-9 rounded-xl bg-[#f7f1ff] dark:bg-[#2b2438] text-[#7240b8] dark:text-[#a87ffb] flex items-center justify-center">
              <ChartNoAxesCombined className="w-5 h-5" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#1c192c] dark:text-[#f4eeff] tracking-tight">
              Phân tích &amp; Báo cáo
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#f7f1ff] dark:bg-[#2b2438] text-[#7240b8] dark:text-[#a87ffb] border border-[#7240b8]/20">
              Teacher Studio
            </span>
          </div>
          <p className="text-sm text-[#635a72] dark:text-[#a9a0b2]">
            Theo dõi doanh thu khóa học, kênh thanh toán, xu hướng ghi danh và hiệu quả đào tạo của riêng bạn.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <Link
            href="/teacher/courses"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-[#1d1926] border border-[#f1ebff] dark:border-[#2b2438] hover:border-[#7240b8]/40 text-xs font-semibold text-[#1c192c] dark:text-[#f4eeff] hover:text-[#7240b8] dark:hover:text-[#a87ffb] shadow-xs transition-all"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#7240b8] dark:text-[#a87ffb]" />
            <span>Khóa học của tôi</span>
          </Link>
          <Link
            href="/teacher/dashboard"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#f7f1ff] dark:bg-[#2b2438] hover:bg-[#ede5fa] dark:hover:bg-[#352c48] text-xs font-semibold text-[#7240b8] dark:text-[#a87ffb] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Về Tổng quan</span>
          </Link>
        </div>
      </div>

      {/* 1. Shared Filter Toolbar */}
      <TeacherAnalyticsFilterBar
        filters={filters}
        onApplyFilters={handleApplyFilters}
        onResetFilters={handleResetFilters}
        onRefresh={handleRefresh}
        loading={isAnyLoading}
        courses={ownedCourses}
        lastUpdated={lastUpdated}
      />

      {/* 2. Teacher KPI Overview (GET /api/teacher/statistics/overview) */}
      <section aria-label="Tổng quan chỉ số giảng viên">
        <TeacherOverviewKpis
          data={overview}
          loading={overviewLoading}
          error={overviewError}
          onRetry={handleRefresh}
        />
      </section>

      {/* 3. Revenue Trend Chart & Payment Method Breakdown (GET /api/teacher/statistics/revenue) */}
      <section
        aria-label="Phân tích doanh thu và kênh thanh toán"
        className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start"
      >
        <div className="xl:col-span-8">
          <TeacherRevenueTrendChart
            data={revenue}
            loading={revenueLoading}
            error={revenueError}
            onRetry={handleRefresh}
          />
        </div>
        <div className="xl:col-span-4">
          <TeacherMethodBreakdownCard
            breakdown={revenue?.methodBreakdown}
            loading={revenueLoading}
          />
        </div>
      </section>

      {/* 4. Top-Performing Courses Ranking (GET /api/teacher/statistics/courses) */}
      <section aria-label="Xếp hạng hiệu suất khóa học">
        <TeacherCoursesRanking
          data={coursesData}
          overviewCourses={overview?.courses}
          loading={coursesLoading}
          error={coursesError}
          statusFilter={coursesStatusFilter}
          sortBy={coursesSortBy}
          selectedCourseId={selectedPerformanceCourseId}
          onStatusFilterChange={(status) => {
            setCoursesStatusFilter(status);
            setCoursesPage(1);
          }}
          onSortByChange={(sort) => {
            setCoursesSortBy(sort);
            setCoursesPage(1);
          }}
          onPageChange={setCoursesPage}
          onSelectCourseForPerformance={(id) => setSelectedPerformanceCourseId(id)}
          onRetry={handleRefresh}
        />
      </section>

      {/* 5. Course Performance Snapshot + Entry to Full Course Performance Page */}
      <section aria-label="Hiệu suất chi tiết theo khóa học">
        <TeacherCoursePerformancePreview
          courses={ownedCourses}
          selectedCourseId={selectedPerformanceCourseId}
          onSelectCourse={setSelectedPerformanceCourseId}
          data={effectivePerformanceData}
          loading={performanceLoading}
          error={performanceError}
          onRetry={() => setPerfRetryKey((k) => k + 1)}
        />
      </section>

      {/* 6. Enrollment Analytics & Student Learning Analytics */}
      <section
        aria-label="Phân tích ghi danh và tiến độ học tập"
        className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start"
      >
        <div className="xl:col-span-7">
          <TeacherEnrollmentAnalytics
            data={enrollments}
            loading={enrollmentsLoading}
            error={enrollmentsError}
            periodLabel={enrollmentPeriodLabel}
            isCustomPeriodFallback={period === 'custom'}
            onRetry={handleRefresh}
          />
        </div>
        <div className="xl:col-span-5">
          <TeacherLearningAnalytics
            data={learning}
            loading={learningLoading}
            error={learningError}
            onRetry={handleRefresh}
          />
        </div>
      </section>
    </div>
  );
}
