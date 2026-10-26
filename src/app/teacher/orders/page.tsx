'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { orderService } from '@/services/order.service';
import { teacherStatisticsService } from '@/services/teacher-statistics.service';
import { courseService } from '@/services/course.service';
import { ApiOrderItem } from '@/types/order';
import { TeacherOverviewRevenue } from '@/types/teacher-statistics';
import { AppApiError } from '@/types/api';

import { OrdersHeader } from '@/components/teacher/orders/orders-header';
import { OrdersKpiCards } from '@/components/teacher/orders/orders-kpi-cards';
import { OrdersTable } from '@/components/teacher/orders/orders-table';
import { OrderDetailModal } from '@/components/teacher/orders/order-detail-modal';

function formatMonthLabel(ym: string): string {
  if (!ym || ym === 'all') return 'Tất cả các tháng';
  const parts = ym.split('-');
  if (parts.length === 2) {
    return `Tháng ${parseInt(parts[1], 10)}/${parts[0]}`;
  }
  return ym;
}

export default function TeacherOrdersPage() {
  // Raw Data states
  const [allOrders, setAllOrders] = useState<ApiOrderItem[]>([]);
  const [teacherCourses, setTeacherCourses] = useState<{ id: string; title: string }[]>([]);

  // Filter states
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const pageSize = 10;

  // UI & Loading states
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isOverviewLoading, setIsOverviewLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [reloadKey, setReloadKey] = useState<number>(0);

  // Stats
  const [overviewRevenue, setOverviewRevenue] = useState<TeacherOverviewRevenue | null>(null);

  // Detail Modal state
  const [selectedOrder, setSelectedOrder] = useState<ApiOrderItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);

  // Debounce search input (400ms)
  useEffect(() => {
    if (searchTerm === debouncedSearch) return;

    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 400);

    return () => clearTimeout(handler);
  }, [searchTerm, debouncedSearch]);

  // 1. Fetch Teacher Overview Stats for KPI Cards
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchStats = async () => {
      setIsOverviewLoading(true);
      try {
        const statsRes = await teacherStatisticsService.getOverview({ signal: controller.signal });
        if (isMounted && statsRes?.data?.revenue) {
          setOverviewRevenue(statsRes.data.revenue);
        }
      } catch (err: unknown) {
        if (!controller.signal.aborted) {
          console.warn('Could not load teacher overview revenue stats:', err);
        }
      } finally {
        if (isMounted && !controller.signal.aborted) {
          setIsOverviewLoading(false);
        }
      }
    };

    fetchStats();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [reloadKey]);

  // 2. Fetch Teacher Courses for Course Filter
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchCourses = async () => {
      try {
        const res = await courseService.getTeacherCourses({ limit: 50 }, { signal: controller.signal });
        if (isMounted && res?.data?.courses) {
          setTeacherCourses(
            res.data.courses.map((c) => ({
              id: c.id || c._id || '',
              title: c.title,
            }))
          );
        }
      } catch (err: unknown) {
        if (!controller.signal.aborted) {
          console.warn('Could not load teacher courses for filter:', err);
        }
      }
    };

    fetchCourses();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  // 3. Fetch All Orders of the Teacher
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchOrders = async () => {
      setIsLoading(true);
      setIsError(false);
      setErrorMessage('');

      try {
        const res = await orderService.getTeacherOrders(
          { limit: 100 },
          { signal: controller.signal }
        );

        if (!isMounted) return;

        if (res && res.data) {
          const list = res.data.orders || [];
          setAllOrders(list);
        }
      } catch (err: unknown) {
        if (!isMounted || controller.signal.aborted) return;
        setIsError(true);

        if (err instanceof AppApiError) {
          if (err.statusCode === 403) {
            setErrorMessage('Bạn không có quyền truy cập quản trị đơn hàng.');
          } else {
            setErrorMessage(err.message || 'Không thể tải danh sách đơn hàng.');
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

    fetchOrders();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [reloadKey]);

  // Extract available months dynamically from orders list
  const availableMonths = useMemo(() => {
    const set = new Set<string>();

    allOrders.forEach((o) => {
      if (o.createdAt) {
        try {
          const d = new Date(o.createdAt);
          const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          set.add(ym);
        } catch {
          // ignore invalid date
        }
      }
    });

    return Array.from(set).sort().reverse();
  }, [allOrders]);

  // Merge courses from orders if not in teacherCourses list
  const mergedCourses = useMemo(() => {
    const map = new Map<string, string>();
    teacherCourses.forEach((c) => {
      if (c.id) map.set(c.id, c.title);
    });

    allOrders.forEach((o) => {
      const cid = o.courseId || o.course?.id || o.course?._id;
      if (cid && !map.has(cid)) {
        map.set(cid, o.course?.title || 'Khóa học');
      }
    });

    return Array.from(map.entries()).map(([id, title]) => ({ id, title }));
  }, [teacherCourses, allOrders]);

  // Multi-criteria Filtering
  const filteredOrders = useMemo(() => {
    return allOrders.filter((order) => {
      // 1. Filter by Month
      if (selectedMonth !== 'all') {
        if (!order.createdAt) return false;
        try {
          const d = new Date(order.createdAt);
          const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          if (ym !== selectedMonth) return false;
        } catch {
          return false;
        }
      }

      // 2. Filter by Course
      if (selectedCourseId !== 'all') {
        const orderCourseId = order.courseId || order.course?.id || order.course?._id;
        if (orderCourseId !== selectedCourseId) return false;
      }

      // 3. Filter by Status
      if (statusFilter !== 'all') {
        const st = (order.status || '').toLowerCase();
        if (st !== statusFilter.toLowerCase()) return false;
      }

      // 4. Search Filter
      if (debouncedSearch.trim()) {
        const q = debouncedSearch.trim().toLowerCase();
        const code = (order.code || '').toLowerCase();
        const userName = (order.user?.username || '').toLowerCase();
        const userEmail = (order.user?.email || '').toLowerCase();
        const courseTitle = (order.course?.title || '').toLowerCase();

        if (
          !code.includes(q) &&
          !userName.includes(q) &&
          !userEmail.includes(q) &&
          !courseTitle.includes(q)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [allOrders, selectedMonth, selectedCourseId, statusFilter, debouncedSearch]);

  // Month-specific Stats (for the selected month & course)
  const monthStats = useMemo(() => {
    const ordersInScope = allOrders.filter((order) => {
      // If month selected
      if (selectedMonth !== 'all') {
        if (!order.createdAt) return false;
        try {
          const d = new Date(order.createdAt);
          const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          if (ym !== selectedMonth) return false;
        } catch {
          return false;
        }
      }
      // If course selected
      if (selectedCourseId !== 'all') {
        const orderCourseId = order.courseId || order.course?.id || order.course?._id;
        if (orderCourseId !== selectedCourseId) return false;
      }
      return true;
    });

    const completed = ordersInScope.filter((o) => (o.status || '').toUpperCase() === 'COMPLETED');
    const pending = ordersInScope.filter((o) => (o.status || '').toUpperCase() === 'PENDING');
    const totalRev = completed.reduce((sum, o) => sum + (o.total || 0), 0);

    return {
      monthTotalOrders: ordersInScope.length,
      monthCompletedCount: completed.length,
      monthPendingCount: pending.length,
      monthCompletedRevenue: totalRev,
    };
  }, [allOrders, selectedMonth, selectedCourseId]);

  // Overall KPI values (When viewing All Time vs Specific Month)
  const kpiData = useMemo(() => {
    const isMonth = selectedMonth !== 'all';

    if (isMonth) {
      return {
        totalOrders: monthStats.monthTotalOrders,
        completedOrders: monthStats.monthCompletedCount,
        pendingOrders: monthStats.monthPendingCount,
        totalOrderValue: monthStats.monthCompletedRevenue,
      };
    }

    // All time
    const totalRevenue = overviewRevenue?.totalRevenue || 0;
    const completedCount = overviewRevenue?.completedOrders || 0;
    const totalCount = overviewRevenue?.totalOrders || allOrders.length;
    const pendingCount = Math.max(0, totalCount - completedCount);

    return {
      totalOrders: totalCount,
      completedOrders: completedCount,
      pendingOrders: pendingCount,
      totalOrderValue: totalRevenue,
    };
  }, [selectedMonth, monthStats, overviewRevenue, allOrders.length]);

  // Client-side Pagination on filtered orders
  const totalFiltered = filteredOrders.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const paginatedOrders = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, page, pageSize]);

  // Handlers
  const handleRefresh = () => {
    setReloadKey((prev) => prev + 1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleMonthChange = (newMonth: string) => {
    setSelectedMonth(newMonth);
    setPage(1);
  };

  const handleCourseChange = (newCourseId: string) => {
    setSelectedCourseId(newCourseId);
    setPage(1);
  };

  const handleStatusFilterChange = (newStatus: string) => {
    setStatusFilter(newStatus);
    setPage(1);
  };

  const handleViewDetail = (order: ApiOrderItem) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
  };

  const handleStatusUpdated = (updatedOrder: ApiOrderItem) => {
    setAllOrders((prev) =>
      prev.map((o) => {
        const match = (o.id && o.id === updatedOrder.id) || (o._id && o._id === updatedOrder._id);
        return match ? updatedOrder : o;
      })
    );
    setReloadKey((prev) => prev + 1);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Header */}
      <OrdersHeader
        totalOrders={allOrders.length}
        isLoading={isLoading}
        onRefresh={handleRefresh}
      />

      {/* 2. KPI Cards (Dynamically reflects selected month and completed orders revenue) */}
      <OrdersKpiCards
        totalOrders={kpiData.totalOrders}
        completedOrders={kpiData.completedOrders}
        pendingOrders={kpiData.pendingOrders}
        totalOrderValue={kpiData.totalOrderValue}
        selectedMonth={selectedMonth}
        selectedMonthLabel={formatMonthLabel(selectedMonth)}
        monthCompletedRevenue={monthStats.monthCompletedRevenue}
        monthCompletedCount={monthStats.monthCompletedCount}
        monthPendingCount={monthStats.monthPendingCount}
        monthTotalOrders={monthStats.monthTotalOrders}
        isLoading={isOverviewLoading && isLoading}
      />

      {/* 3. Orders Table & Toolbar with Month and Course Filters */}
      <OrdersTable
        orders={paginatedOrders}
        availableMonths={availableMonths}
        selectedMonth={selectedMonth}
        onMonthChange={handleMonthChange}
        allCourses={mergedCourses}
        selectedCourseId={selectedCourseId}
        onCourseChange={handleCourseChange}
        monthCompletedRevenue={monthStats.monthCompletedRevenue}
        monthCompletedCount={monthStats.monthCompletedCount}
        isLoading={isLoading}
        isError={isError}
        errorMessage={errorMessage}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={handleStatusFilterChange}
        pagination={{
          page,
          limit: pageSize,
          total: totalFiltered,
          totalPages,
        }}
        onPageChange={handlePageChange}
        onRefresh={handleRefresh}
        onViewDetail={handleViewDetail}
      />

      {/* 4. Order Detail Modal */}
      <OrderDetailModal
        isOpen={isDetailOpen}
        order={selectedOrder}
        onClose={() => setIsDetailOpen(false)}
        onStatusUpdated={handleStatusUpdated}
      />
    </div>
  );
}
