'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { orderService } from '@/services/order.service';
import { courseService } from '@/services/course.service';
import { ApiOrderItem } from '@/types/order';
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
  const [isError, setIsError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [reloadKey, setReloadKey] = useState<number>(0);

  // Stats
  const [serverPagination, setServerPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

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

  // Page indicators use only the current server page.


  // 2. Fetch Teacher Courses for Course Filter
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchCourses = async () => {
      try {
        const options: { id: string; title: string }[] = [];
        for (let coursePage = 1; coursePage <= 100; coursePage++) {
          const res = await courseService.getTeacherCourses({ limit: 100, page: coursePage }, { signal: controller.signal });
          options.push(...res.data.courses.map(course => ({ id: course.id || course._id || '', title: course.title })));
          if (coursePage >= res.data.pagination.totalPages) break;
        }
        if (isMounted) setTeacherCourses(options);
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
  // Management filters and pagination run on the server, across every owned course.
  useEffect(() => {
    const controller = new AbortController();
    async function loadOrders() {
      setIsLoading(true);
      setIsError(false);
      try {
        let createdFrom: string | undefined;
        let createdTo: string | undefined;
        if (selectedMonth !== 'all') {
          const [year, month] = selectedMonth.split('-').map(Number);
          createdFrom = new Date(year, month - 1, 1).toISOString();
          createdTo = new Date(new Date(year, month, 1).getTime() - 1).toISOString();
        }
        const response = await orderService.getTeacherOrders({
          page, limit: pageSize,
          search: debouncedSearch.trim() || undefined,
          status: statusFilter === 'all' ? undefined : statusFilter,
          courseId: selectedCourseId === 'all' ? undefined : selectedCourseId,
          createdFrom, createdTo, sortBy: 'createdAt', sortOrder: 'desc',
        }, { signal: controller.signal });
        if (!response.success || !response.data) throw new Error(response.message || 'Không thể tải đơn hàng.');
        if (!controller.signal.aborted) {
          setAllOrders(response.data.orders);
          setServerPagination(response.data.pagination);
        }
      } catch (error: unknown) {
        if (!controller.signal.aborted) {
          setIsError(true);
          setErrorMessage(error instanceof Error ? error.message : 'Không thể tải đơn hàng.');
          setAllOrders([]);
        }
      } finally { if (!controller.signal.aborted) setIsLoading(false); }
    }
    void loadOrders();
    return () => controller.abort();
  }, [reloadKey, page, selectedMonth, selectedCourseId, statusFilter, debouncedSearch]);

  // Extract available months dynamically from orders list
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    for (let offset = 0; offset < 24; offset++) { const date = new Date(); date.setDate(1); date.setMonth(date.getMonth() - offset); set.add(String(date.getFullYear()) + '-' + String(date.getMonth() + 1).padStart(2, '0')); }
    if (selectedMonth !== 'all') set.add(selectedMonth);

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
  }, [allOrders, selectedMonth]);

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

  // These are explicitly current-page indicators, not a new revenue analytics API.
  const monthStats = useMemo(() => {
    const completed = allOrders.filter(order => order.status.toLowerCase() === 'completed');
    return { monthTotalOrders: allOrders.length, monthCompletedCount: completed.length,
      monthPendingCount: allOrders.filter(order => order.status.toLowerCase() === 'pending').length,
      monthCompletedRevenue: completed.reduce((sum, order) => sum + order.total, 0) };
  }, [allOrders]);
  const kpiData = { totalOrders: monthStats.monthTotalOrders, completedOrders: monthStats.monthCompletedCount,
    pendingOrders: monthStats.monthPendingCount, totalOrderValue: monthStats.monthCompletedRevenue };
  const totalFiltered = serverPagination.total;
  const totalPages = Math.max(1, serverPagination.totalPages);
  const paginatedOrders = allOrders;

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
        totalOrders={serverPagination.total}
        isLoading={isLoading}
        onRefresh={handleRefresh}
      />

      {/* 2. KPI Cards (Dynamically reflects selected month and completed orders revenue) */}
      <OrdersKpiCards pageScoped
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
        isLoading={isLoading && isLoading}
      />

      {/* 3. Orders Table & Toolbar with Month and Course Filters */}
      <OrdersTable pageScoped
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
        onSearchChange={(value) => { setSearchTerm(value); setPage(1); }}
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
