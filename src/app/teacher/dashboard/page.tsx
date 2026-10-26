'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  BookOpen, 
  PlusCircle, 
  TrendingUp, 
  AlertCircle, 
  RefreshCw 
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { teacherStatisticsService } from '@/services/teacher-statistics.service';
import { enrollmentService } from '@/services/enrollment.service';
import { 
  TeacherOverviewData, 
  TeacherRevenueData, 
  TeacherRevenuePeriod, 
  TeacherCourseStatItem,
  TeacherLearningStatsData
} from '@/types/teacher-statistics';
import { CourseStudentItem } from '@/types/enrollment';
import { TeacherKpiCards } from '@/components/teacher/dashboard/teacher-kpi-cards';
import { TeacherRevenueChart } from '@/components/teacher/dashboard/teacher-revenue-chart';
import { TeacherCourseSummary } from '@/components/teacher/dashboard/teacher-course-summary';
import { TeacherRecentEnrollments } from '@/components/teacher/dashboard/teacher-recent-enrollments';
import { TeacherLearningCard } from '@/components/teacher/dashboard/teacher-learning-card';

export default function TeacherDashboardPage() {
  const { user } = useAuth();

  // State
  const [overview, setOverview] = useState<TeacherOverviewData | null>(null);
  const [revenueData, setRevenueData] = useState<TeacherRevenueData | null>(null);
  const [coursesStats, setCoursesStats] = useState<TeacherCourseStatItem[]>([]);
  const [learningStats, setLearningStats] = useState<TeacherLearningStatsData | null>(null);
  const [recentStudents, setRecentStudents] = useState<CourseStudentItem[]>([]);

  const [period, setPeriod] = useState<TeacherRevenuePeriod>('30days');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingRevenue, setIsLoadingRevenue] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Load Main Dashboard Data (Overview, Top Courses, Learning)
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        // Parallel API Fetching via centralized client
        const [overviewRes, coursesRes, learningRes, revenueRes] = await Promise.allSettled([
          teacherStatisticsService.getOverview(),
          teacherStatisticsService.getCoursesStats({ limit: 5, sortBy: 'revenue', order: 'desc' }),
          teacherStatisticsService.getLearningStats(),
          teacherStatisticsService.getRevenue({ period }),
        ]);

        if (!isMounted) return;

        // 1. Process Overview
        if (overviewRes.status === 'fulfilled' && overviewRes.value.success) {
          setOverview(overviewRes.value.data);
        }

        // 2. Process Courses Stats
        let topCourseId: string | null = null;
        if (coursesRes.status === 'fulfilled' && coursesRes.value.success) {
          const list = coursesRes.value.data?.courses || [];
          setCoursesStats(list);
          if (list.length > 0) {
            topCourseId = list[0].id || list[0]._id || null;
          }
        }

        // 3. Process Learning Stats
        if (learningRes.status === 'fulfilled' && learningRes.value.success) {
          setLearningStats(learningRes.value.data);
        }

        // 4. Process Revenue Timeline
        if (revenueRes.status === 'fulfilled' && revenueRes.value.success) {
          setRevenueData(revenueRes.value.data);
        }

        // 5. Fetch Recent Enrolled Students if topCourseId exists
        if (topCourseId) {
          try {
            const studentsRes = await enrollmentService.getCourseStudents(topCourseId, { limit: 5 });
            if (isMounted && studentsRes.success && studentsRes.data?.students) {
              setRecentStudents(studentsRes.data.students);
            }
          } catch {
            if (isMounted) setRecentStudents([]);
          }
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : 'Không thể tải dữ liệu bảng điều khiển giảng viên.';
        setError(msg);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void fetchData();

    return () => {
      isMounted = false;
    };
  }, [period, reloadKey]);

  // Handle revenue period change
  const handlePeriodChange = async (newPeriod: TeacherRevenuePeriod) => {
    setPeriod(newPeriod);
    setIsLoadingRevenue(true);
    try {
      const res = await teacherStatisticsService.getRevenue({ period: newPeriod });
      if (res.success) {
        setRevenueData(res.data);
      }
    } catch {
      // Maintain previous data on transient error
    } finally {
      setIsLoadingRevenue(false);
    }
  };

  const handleRetry = () => {
    setIsLoading(true);
    setError(null);
    setReloadKey((prev) => prev + 1);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6 sm:space-y-8">
      {/* ================= 1. WELCOME MANAGEMENT BANNER ================= */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#7240b8] via-[#854ecc] to-[#5b27a1] text-white p-6 sm:p-8 shadow-sm">
        <div className="relative z-10 max-w-2xl space-y-3.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-purple-100 border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Kênh Giảng Viên • TMDEMY Studio</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Xin chào, {user?.username || 'Giảng viên'}! <span className="inline-block animate-bounce">👋</span>
          </h1>

          <p className="text-sm sm:text-base text-purple-100/90 leading-relaxed">
            Hôm nay bạn đang quản lý <strong className="font-bold text-white">{overview?.courses?.total || 0} khóa học</strong> và đồng hành cùng <strong className="font-bold text-white">{(overview?.students?.totalStudents || 0).toLocaleString('vi-VN')} học viên</strong>. Chúc bạn có một ngày giảng dạy hiệu quả!
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link
              href="/teacher/courses/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-[#7240b8] font-bold text-xs sm:text-sm hover:bg-purple-50 transition-colors shadow-sm active:scale-[0.98]"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Tạo khóa học mới</span>
            </Link>

            <Link
              href="/teacher/courses"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-semibold text-xs sm:text-sm transition-colors border border-white/20 active:scale-[0.98]"
            >
              <BookOpen className="w-4 h-4" />
              <span>Quản lý khóa học</span>
            </Link>

            <Link
              href="/teacher/analytics"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm transition-colors border border-white/10 active:scale-[0.98]"
            >
              <TrendingUp className="w-4 h-4" />
              <span>Báo cáo chi tiết</span>
            </Link>
          </div>
        </div>

        {/* Decorative Ambient Accents */}
        <div className="absolute -right-8 -bottom-12 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute right-20 top-4 w-32 h-32 rounded-full bg-amber-400/10 blur-xl pointer-events-none" />
      </section>

      {/* ================= ERROR STATE BANNER ================= */}
      {error && (
        <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/80 dark:bg-rose-950/20 flex items-center justify-between gap-3 text-rose-800 dark:text-rose-300">
          <div className="flex items-center gap-3 text-xs sm:text-sm">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={handleRetry}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-[#1d1926] text-rose-700 dark:text-rose-300 text-xs font-semibold shadow-xs hover:bg-rose-50 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Thử lại</span>
          </button>
        </div>
      )}

      {/* ================= 2. 4 KPI METRIC CARDS ================= */}
      <TeacherKpiCards overview={overview} isLoading={isLoading} />

      {/* ================= 3. MAIN DASHBOARD CANVAS (7 COLS / 5 COLS) ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* Left Column (7 cols): Revenue Chart & Course Summary */}
        <div className="lg:col-span-7 space-y-6 sm:space-y-8">
          <TeacherRevenueChart
            data={revenueData}
            isLoading={isLoading || isLoadingRevenue}
            period={period}
            onPeriodChange={handlePeriodChange}
          />

          <TeacherCourseSummary
            courses={coursesStats}
            isLoading={isLoading}
          />
        </div>

        {/* Right Column (5 cols): Recent Enrollments & Learning Progress */}
        <div className="lg:col-span-5 space-y-6 sm:space-y-8">
          <TeacherRecentEnrollments
            students={recentStudents}
            isLoading={isLoading}
          />

          <TeacherLearningCard
            data={learningStats}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
