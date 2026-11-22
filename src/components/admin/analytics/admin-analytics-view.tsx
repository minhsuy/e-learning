'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ChartNoAxesCombined, CreditCard, ArrowRight, Info } from 'lucide-react';
import {
  AdminFinancialStatsData,
  AdminSalesBreakdownData,
  AdminSalesSortBy,
} from '@/types/admin-order';
import { adminOrderService, normalizeOrderApiError } from '@/services/admin-order.service';
import { adminDashboardService } from '@/services/admin-dashboard.service';
import {
  AdminAnalyticsFilterState,
  DEFAULT_ANALYTICS_FILTERS,
  buildFinancialQueryParams,
  buildSalesQueryParams,
  getTimeRangeLabel,
  parseAnalyticsFiltersFromSearchParams,
  serializeAnalyticsFiltersToSearchParams,
  validateAnalyticsDateRange,
} from '@/lib/admin-analytics';
import { AnalyticsFilterBar, FilterSelectOption } from './analytics-filter-bar';
import { AnalyticsKpiGrid } from './analytics-kpi-grid';
import { RevenueTrendChart } from './revenue-trend-chart';
import { PaymentMethodChart } from './payment-method-chart';
import { OrderStatusBreakdown } from './order-status-breakdown';
import { SalesBreakdownCard } from './sales-breakdown-section';

export function AdminAnalyticsView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Global Filters (initialized from URL searchParams)
  const [filters, setFilters] = useState<AdminAnalyticsFilterState>(() =>
    parseAnalyticsFiltersFromSearchParams(searchParams)
  );

  // Filter reference dropdown options
  const [teachers, setTeachers] = useState<FilterSelectOption[]>([]);
  const [courses, setCourses] = useState<FilterSelectOption[]>([]);

  // Financial Stats State
  const [financialData, setFinancialData] = useState<AdminFinancialStatsData | null>(null);
  const [financialLoading, setFinancialLoading] = useState(true);
  const [financialError, setFinancialError] = useState<string | null>(null);

  // Course Sales Breakdown State
  const [courseSales, setCourseSales] = useState<AdminSalesBreakdownData | null>(null);
  const [courseSalesLoading, setCourseSalesLoading] = useState(true);
  const [courseSalesError, setCourseSalesError] = useState<string | null>(null);
  const [coursePage, setCoursePage] = useState(1);
  const [courseSortBy, setCourseSortBy] = useState<AdminSalesSortBy>('revenue');

  // Teacher Sales Breakdown State
  const [teacherSales, setTeacherSales] = useState<AdminSalesBreakdownData | null>(null);
  const [teacherSalesLoading, setTeacherSalesLoading] = useState(true);
  const [teacherSalesError, setTeacherSalesError] = useState<string | null>(null);
  const [teacherPage, setTeacherPage] = useState(1);
  const [teacherSortBy, setTeacherSortBy] = useState<AdminSalesSortBy>('revenue');

  // Manual reload triggers & timestamp
  const [reloadKey, setReloadKey] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Load Teachers and Courses reference lists for optional filters (non-blocking)
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const loadReferenceLists = async () => {
      const [teachersRes, coursesRes] = await Promise.allSettled([
        adminDashboardService.getUsers({ role: 'teacher', limit: 100 }, { signal: controller.signal }),
        adminDashboardService.getCourses({ limit: 100 }, { signal: controller.signal }),
      ]);

      if (!isMounted) return;

      if (teachersRes.status === 'fulfilled' && teachersRes.value.success && teachersRes.value.data?.users) {
        setTeachers(
          teachersRes.value.data.users.map((u) => ({
            id: u.id || u._id || '',
            label: `${u.username || u.email} (${u.email})`,
          })).filter((item) => Boolean(item.id))
        );
      }

      if (coursesRes.status === 'fulfilled' && coursesRes.value.success && coursesRes.value.data?.courses) {
        setCourses(
          coursesRes.value.data.courses.map((c) => ({
            id: c.id || c._id || '',
            label: c.title,
          })).filter((item) => Boolean(item.id))
        );
      }
    };

    void loadReferenceLists();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  // Sync filters to URL without triggering full navigation scroll
  const syncUrlParams = useCallback(
    (nextFilters: AdminAnalyticsFilterState) => {
      const nextParams = serializeAnalyticsFiltersToSearchParams(nextFilters);
      const qs = nextParams.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router]
  );

  const handleApplyFilters = useCallback(
    (nextFilters: AdminAnalyticsFilterState) => {
      const validation = validateAnalyticsDateRange(
        nextFilters.timeRange,
        nextFilters.startDate,
        nextFilters.endDate
      );
      if (!validation.valid) return;

      setFilters(nextFilters);
      setCoursePage(1);
      setTeacherPage(1);
      syncUrlParams(nextFilters);
    },
    [syncUrlParams]
  );

  const handleResetFilters = useCallback(() => {
    setFilters(DEFAULT_ANALYTICS_FILTERS);
    setCoursePage(1);
    setTeacherPage(1);
    syncUrlParams(DEFAULT_ANALYTICS_FILTERS);
  }, [syncUrlParams]);

  const handleRefresh = useCallback(() => {
    setReloadKey((prev) => prev + 1);
  }, []);

  // 1. Fetch Financial Analytics (GET /api/admin/statistics/financial)
  useEffect(() => {
    const validation = validateAnalyticsDateRange(
      filters.timeRange,
      filters.startDate,
      filters.endDate
    );
    if (!validation.valid) return;

    let isMounted = true;
    const controller = new AbortController();

    const loadFinancial = async () => {
      await Promise.resolve();
      if (!isMounted) return;
      setFinancialLoading(true);
      setFinancialError(null);
      try {
        const query = buildFinancialQueryParams(filters);
        const res = await adminOrderService.getFinancialStats(query, {
          signal: controller.signal,
        });
        if (!isMounted) return;
        if (res.success && res.data) {
          setFinancialData(res.data);
          setLastUpdated(new Date());
        } else {
          setFinancialError(res.message || 'Không thể tải dữ liệu thống kê tài chính.');
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        if (err instanceof Error && err.name === 'AbortError') return;
        setFinancialError(
          normalizeOrderApiError(err, 'Không thể tải thống kê tài chính từ máy chủ.')
        );
      } finally {
        if (isMounted) setFinancialLoading(false);
      }
    };

    void loadFinancial();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [filters, reloadKey]);

  const { timeRange, startDate, endDate, timeBasis, timezone, paymentMethod } = filters;

  // 2. Fetch Top Courses Sales Breakdown (GET /api/admin/statistics/sales?groupBy=course)
  useEffect(() => {
    const validation = validateAnalyticsDateRange(timeRange, startDate, endDate);
    if (!validation.valid) return;

    let isMounted = true;
    const controller = new AbortController();

    const loadCourseSales = async () => {
      await Promise.resolve();
      if (!isMounted) return;
      setCourseSalesLoading(true);
      setCourseSalesError(null);
      try {
        const query = buildSalesQueryParams(
          {
            timeRange,
            startDate,
            endDate,
            timeBasis,
            timezone,
            paymentMethod,
            teacherId: '',
            courseId: '',
          },
          {
            groupBy: 'course',
            page: coursePage,
            limit: 10,
            sortBy: courseSortBy,
            order: 'desc',
          }
        );
        const res = await adminOrderService.getSalesBreakdown(query, {
          signal: controller.signal,
        });
        if (!isMounted) return;
        if (res.success && res.data) {
          setCourseSales(res.data);
        } else {
          setCourseSalesError(res.message || 'Không thể tải bảng xếp hạng khóa học.');
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        if (err instanceof Error && err.name === 'AbortError') return;
        setCourseSalesError(
          normalizeOrderApiError(err, 'Không thể tải doanh số theo khóa học.')
        );
      } finally {
        if (isMounted) setCourseSalesLoading(false);
      }
    };

    void loadCourseSales();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [
    timeRange,
    startDate,
    endDate,
    timeBasis,
    timezone,
    paymentMethod,
    coursePage,
    courseSortBy,
    reloadKey,
  ]);

  // 3. Fetch Revenue by Teacher Breakdown (GET /api/admin/statistics/sales?groupBy=teacher)
  useEffect(() => {
    const validation = validateAnalyticsDateRange(timeRange, startDate, endDate);
    if (!validation.valid) return;

    let isMounted = true;
    const controller = new AbortController();

    const loadTeacherSales = async () => {
      await Promise.resolve();
      if (!isMounted) return;
      setTeacherSalesLoading(true);
      setTeacherSalesError(null);
      try {
        const query = buildSalesQueryParams(
          {
            timeRange,
            startDate,
            endDate,
            timeBasis,
            timezone,
            paymentMethod,
            teacherId: '',
            courseId: '',
          },
          {
            groupBy: 'teacher',
            page: teacherPage,
            limit: 10,
            sortBy: teacherSortBy,
            order: 'desc',
          }
        );
        const res = await adminOrderService.getSalesBreakdown(query, {
          signal: controller.signal,
        });
        if (!isMounted) return;
        if (res.success && res.data) {
          setTeacherSales(res.data);
        } else {
          setTeacherSalesError(res.message || 'Không thể tải doanh số theo giảng viên.');
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        if (err instanceof Error && err.name === 'AbortError') return;
        setTeacherSalesError(
          normalizeOrderApiError(err, 'Không thể tải doanh số theo giảng viên.')
        );
      } finally {
        if (isMounted) setTeacherSalesLoading(false);
      }
    };

    void loadTeacherSales();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [
    timeRange,
    startDate,
    endDate,
    timeBasis,
    timezone,
    paymentMethod,
    teacherPage,
    teacherSortBy,
    reloadKey,
  ]);

  const periodLabel =
    filters.timeRange === 'custom' && filters.startDate && filters.endDate
      ? `${filters.startDate} → ${filters.endDate}`
      : getTimeRangeLabel(filters.timeRange);

  const hasScopedEntityFilter = Boolean(filters.teacherId || filters.courseId);

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
              Business Intelligence
            </span>
          </div>
          <p className="text-sm text-[#635a72] dark:text-[#a9a0b2]">
            Phân tích doanh thu, đơn hàng và hiệu quả kinh doanh của TMdemy.
          </p>
        </div>

        <Link
          href="/admin/payments"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-[#1d1926] border border-[#f1ebff] dark:border-[#2b2438] hover:border-[#7240b8]/40 text-xs font-semibold text-[#1c192c] dark:text-[#f4eeff] hover:text-[#7240b8] dark:hover:text-[#a87ffb] shadow-xs transition-all self-start md:self-auto"
        >
          <CreditCard className="w-4 h-4 text-[#7240b8] dark:text-[#a87ffb]" />
          <span>Đi tới Quản lý thanh toán</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Global Filter Toolbar */}
      <AnalyticsFilterBar
        filters={filters}
        onApplyFilters={handleApplyFilters}
        onResetFilters={handleResetFilters}
        onRefresh={handleRefresh}
        loading={financialLoading || courseSalesLoading || teacherSalesLoading}
        teachers={teachers}
        courses={courses}
        lastUpdated={lastUpdated}
      />

      {/* Financial KPI Overview */}
      <section aria-label="Chỉ số tài chính tổng quan">
        <AnalyticsKpiGrid
          data={financialData}
          loading={financialLoading}
          periodLabel={periodLabel}
        />
      </section>

      {/* Revenue Trend Chart */}
      <section aria-label="Biểu đồ xu hướng doanh thu">
        <RevenueTrendChart
          data={financialData}
          loading={financialLoading}
          error={financialError}
          onRetry={handleRefresh}
        />
      </section>

      {/* Method Breakdown + Order Status Breakdown */}
      <section
        aria-label="Phân tích phương thức thanh toán và trạng thái đơn hàng"
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        <PaymentMethodChart
          breakdown={financialData?.methodBreakdown}
          loading={financialLoading}
        />
        <OrderStatusBreakdown data={financialData} loading={financialLoading} />
      </section>

      {/* Notice if Teacher/Course filter is active on financial overview */}
      {hasScopedEntityFilter && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-[#e6dffa] dark:border-[#2b2438] text-xs text-[#635a72] dark:text-[#a9a0b2]">
          <Info className="w-4 h-4 text-[#7240b8] dark:text-[#a87ffb] shrink-0 mt-0.5" />
          <span>
            Bộ lọc Giảng viên / Khóa học hiện áp dụng cho phần <strong>KPI tổng quan &amp; Biểu đồ xu hướng</strong>. Hai bảng xếp hạng toàn sàn bên dưới phản ánh chu kỳ, cơ sở thời gian, múi giờ và phương thức thanh toán đang chọn.
          </span>
        </div>
      )}

      {/* Sales Breakdown: Top Courses & Revenue by Teacher */}
      <section aria-label="Báo cáo doanh số theo khóa học và giảng viên" className="space-y-6">
        <SalesBreakdownCard
          groupBy="course"
          data={courseSales}
          loading={courseSalesLoading}
          error={courseSalesError}
          sortBy={courseSortBy}
          order="desc"
          onSortChange={(nextSort) => {
            setCourseSortBy(nextSort);
            setCoursePage(1);
          }}
          onPageChange={setCoursePage}
          onRetry={handleRefresh}
        />

        <SalesBreakdownCard
          groupBy="teacher"
          data={teacherSales}
          loading={teacherSalesLoading}
          error={teacherSalesError}
          sortBy={teacherSortBy}
          order="desc"
          onSortChange={(nextSort) => {
            setTeacherSortBy(nextSort);
            setTeacherPage(1);
          }}
          onPageChange={setTeacherPage}
          onRetry={handleRefresh}
        />
      </section>
    </div>
  );
}
