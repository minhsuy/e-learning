'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { adminDashboardService, AdminKpiTotals } from '@/services/admin-dashboard.service';
import {
  AdminCourseSummary,
  AdminOrderSummary,
  AdminUserSummary,
} from '@/types/admin-dashboard';
import { DashboardHeader } from './dashboard-header';
import { KpiGrid } from './kpi-grid';
import { PendingCoursesCard } from './pending-courses-card';
import { RecentUsersCard } from './recent-users-card';
import { PendingOrdersCard } from './pending-orders-card';
import { QuickActionsCard } from './quick-actions-card';
import { CommentModerationBanner } from './comment-moderation-banner';
import { Clock, Users, Zap } from 'lucide-react';

const INITIAL_KPIS: AdminKpiTotals = {
  totalUsers: null,
  totalTeachers: null,
  totalStudents: null,
  totalCourses: null,
  pendingCourses: null,
  approvedCourses: null,
  totalOrders: null,
  pendingOrders: null,
  completedOrders: null,
  totalComments: null,
  totalCoupons: null,
};

export function AdminDashboardView() {
  // 1. KPI State
  const [kpis, setKpis] = useState<AdminKpiTotals>(INITIAL_KPIS);
  const [kpiLoading, setKpiLoading] = useState<boolean>(true);
  const [kpiError, setKpiError] = useState<string | null>(null);

  // 2. Pending Courses State
  const [pendingCourses, setPendingCourses] = useState<AdminCourseSummary[]>([]);
  const [coursesLoading, setCoursesLoading] = useState<boolean>(true);
  const [coursesError, setCoursesError] = useState<string | null>(null);

  // 3. Recent Users State
  const [recentUsers, setRecentUsers] = useState<AdminUserSummary[]>([]);
  const [usersLoading, setUsersLoading] = useState<boolean>(true);
  const [usersError, setUsersError] = useState<string | null>(null);

  // 4. Pending Orders State
  const [pendingOrders, setPendingOrders] = useState<AdminOrderSummary[]>([]);
  const [ordersLoading, setOrdersLoading] = useState<boolean>(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  // Refresh & reload triggers
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [reloadKey, setReloadKey] = useState<number>(0);

  // Individual section retry triggers
  const [kpiRetryKey, setKpiRetryKey] = useState<number>(0);
  const [coursesRetryKey, setCoursesRetryKey] = useState<number>(0);
  const [usersRetryKey, setUsersRetryKey] = useState<number>(0);
  const [ordersRetryKey, setOrdersRetryKey] = useState<number>(0);

  // 1. Fetch KPI totals
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchKpis = async () => {
      await Promise.resolve();
      if (!isMounted) return;

      setKpiLoading(true);
      setKpiError(null);
      try {
        const summary = await adminDashboardService.getDashboardSummary({ signal: controller.signal });
        if (isMounted && summary.success && summary.data) {
          const { counts, financials, recentUsers: summaryUsers } = summary.data;
          setKpis({
            totalUsers: counts.totalUsers ?? null,
            totalTeachers: counts.totalTeachers ?? null,
            totalStudents: counts.totalStudents ?? null,
            totalCourses: counts.totalCourses ?? null,
            pendingCourses: counts.pendingCourses ?? null,
            approvedCourses: counts.approvedCourses ?? null,
            totalOrders: counts.totalOrders ?? null,
            pendingOrders: counts.pendingOrders ?? null,
            completedOrders: counts.completedOrders ?? null,
            totalComments: counts.totalComments ?? null,
            totalCoupons: null,
            totalRevenue: financials?.totalRevenue ?? null,
            conversionRate: financials?.conversionRate ?? null,
          });
          if (Array.isArray(summaryUsers) && summaryUsers.length > 0) {
            setRecentUsers(summaryUsers);
            setUsersLoading(false);
          }
        } else {
          const totals = await adminDashboardService.getAllKpiTotals({ signal: controller.signal });
          if (isMounted) {
            setKpis(totals);
          }
        }
      } catch (err: unknown) {
        if (!controller.signal.aborted && isMounted) {
          try {
            const totals = await adminDashboardService.getAllKpiTotals({ signal: controller.signal });
            if (isMounted) setKpis(totals);
          } catch {
            const message = err instanceof Error ? err.message : 'Không thể tải chỉ số KPI';
            setKpiError(message);
          }
        }
      } finally {
        if (isMounted && !controller.signal.aborted) {
          setKpiLoading(false);
        }
      }
    };

    fetchKpis();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [reloadKey, kpiRetryKey]);

  // 2. Fetch Pending Courses
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchCourses = async () => {
      await Promise.resolve();
      if (!isMounted) return;

      setCoursesLoading(true);
      setCoursesError(null);
      try {
        const items = await adminDashboardService.getPendingCourses(5, { signal: controller.signal });
        if (isMounted) {
          setPendingCourses(items);
        }
      } catch (err: unknown) {
        if (!controller.signal.aborted && isMounted) {
          const message = err instanceof Error ? err.message : 'Không thể tải khóa học chờ duyệt';
          setCoursesError(message);
        }
      } finally {
        if (isMounted && !controller.signal.aborted) {
          setCoursesLoading(false);
        }
      }
    };

    fetchCourses();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [reloadKey, coursesRetryKey]);

  // 3. Fetch Recent Users
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchUsers = async () => {
      await Promise.resolve();
      if (!isMounted) return;

      setUsersLoading(true);
      setUsersError(null);
      try {
        const items = await adminDashboardService.getRecentUsers(5, { signal: controller.signal });
        if (isMounted) {
          setRecentUsers(items);
        }
      } catch (err: unknown) {
        if (!controller.signal.aborted && isMounted) {
          const message = err instanceof Error ? err.message : 'Không thể tải người dùng mới';
          setUsersError(message);
        }
      } finally {
        if (isMounted && !controller.signal.aborted) {
          setUsersLoading(false);
        }
      }
    };

    fetchUsers();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [reloadKey, usersRetryKey]);

  // 4. Fetch Pending Orders
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchOrders = async () => {
      await Promise.resolve();
      if (!isMounted) return;

      setOrdersLoading(true);
      setOrdersError(null);
      try {
        const items = await adminDashboardService.getPendingOrders(5, { signal: controller.signal });
        if (isMounted) {
          setPendingOrders(items);
        }
      } catch (err: unknown) {
        if (!controller.signal.aborted && isMounted) {
          const message = err instanceof Error ? err.message : 'Không thể tải danh sách đơn hàng';
          setOrdersError(message);
        }
      } finally {
        if (isMounted && !controller.signal.aborted) {
          setOrdersLoading(false);
        }
      }
    };

    fetchOrders();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [reloadKey, ordersRetryKey]);

  // Handle master refresh
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setReloadKey((prev) => prev + 1);
    setLastUpdated(new Date());
    setTimeout(() => {
      setRefreshing(false);
    }, 600);
  }, []);

  const pendingCoursesTotal = kpis.pendingCourses;
  const pendingOrdersTotal = kpis.pendingOrders;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* ================= SECTION 1: HEADER & OVERVIEW KPIS ================= */}
      <section aria-label="Tổng quan hệ thống" className="space-y-6">
        <DashboardHeader
          lastUpdated={lastUpdated}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />

        <KpiGrid
          totals={kpis}
          loading={kpiLoading}
          error={kpiError}
          onRetry={() => setKpiRetryKey((prev) => prev + 1)}
        />
      </section>

      {/* ================= SECTION 2: PENDING TASKS (VIỆC CẦN XỬ LÝ) ================= */}
      <section aria-label="Việc cần xử lý" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-[#f1ebff] dark:border-[#2b2438]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1c192c] dark:text-[#f4eeff]">
                Việc cần xử lý (Pending Tasks)
              </h2>
              <p className="text-xs text-[#635a72] dark:text-[#a9a0b2]">
                Các tác vụ và yêu cầu đang chờ Ban quản trị TMdemy thẩm định & xét duyệt
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {pendingCoursesTotal !== null && pendingCoursesTotal > 0 && (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40">
                {pendingCoursesTotal} khóa học chờ duyệt
              </span>
            )}
            {pendingOrdersTotal !== null && pendingOrdersTotal > 0 && (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40">
                {pendingOrdersTotal} đơn hàng cần xử lý
              </span>
            )}
          </div>
        </div>

        {/* 2 Operations Cards: Pending Courses & Pending Orders */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PendingCoursesCard
            courses={pendingCourses}
            loading={coursesLoading}
            error={coursesError}
            onRetry={() => setCoursesRetryKey((prev) => prev + 1)}
          />

          <PendingOrdersCard
            orders={pendingOrders}
            loading={ordersLoading}
            error={ordersError}
            onRetry={() => setOrdersRetryKey((prev) => prev + 1)}
          />
        </div>

        {/* Comment Moderation Status Banner */}
        <CommentModerationBanner totalComments={kpis.totalComments} />
      </section>

      {/* ================= SECTION 3 & 4: RECENT ACTIVITY & QUICK ACTIONS ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Section 3: Recent Activity (5 Cols on LG) */}
        <section aria-label="Hoạt động gần đây" className="lg:col-span-5 space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-[#f1ebff] dark:border-[#2b2438]">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1c192c] dark:text-[#f4eeff]">
                Hoạt động gần đây
              </h2>
              <p className="text-xs text-[#635a72] dark:text-[#a9a0b2]">
                Dữ liệu tài khoản người dùng đăng ký mới
              </p>
            </div>
          </div>

          <RecentUsersCard
            users={recentUsers}
            loading={usersLoading}
            error={usersError}
            onRetry={() => setUsersRetryKey((prev) => prev + 1)}
          />
        </section>

        {/* Section 4: Quick Actions (7 Cols on LG) */}
        <section aria-label="Thao tác nhanh" className="lg:col-span-7 space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-[#f1ebff] dark:border-[#2b2438]">
            <div className="w-7 h-7 rounded-lg bg-[#f7f1ff] dark:bg-[#2b2438] text-[#7240b8] dark:text-[#a87ffb] flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1c192c] dark:text-[#f4eeff]">
                Thao tác nhanh (Quick Actions)
              </h2>
              <p className="text-xs text-[#635a72] dark:text-[#a9a0b2]">
                Phím tắt điều hướng đến toàn bộ 6 phân hệ quản trị
              </p>
            </div>
          </div>

          <QuickActionsCard />
        </section>
      </div>
    </div>
  );
}
