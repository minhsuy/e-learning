'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  AdminOrderItem,
  AdminOrderKpis,
  AdminOrdersPagination,
  OrderFilterStatus,
} from '@/types/admin-order';
import {
  adminOrderService,
  normalizeOrderApiError,
} from '@/services/admin-order.service';
import { OrderKpiSummary } from './order-kpi-summary';
import { OrderFiltersBar } from './order-filters-bar';
import { OrderTable } from './order-table';
import { OrderPagination } from './order-pagination';
import { OrderDetailModal } from './order-detail-modal';
import { OrderStatusModal } from './order-status-modal';

export function AdminOrdersView() {
  // 1. Data States
  const [orders, setOrders] = useState<AdminOrderItem[]>([]);
  const [pagination, setPagination] = useState<AdminOrdersPagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 2. Filter States
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderFilterStatus>('all');

  // 3. KPI State
  const [kpis, setKpis] = useState<AdminOrderKpis>({
    totalOrders: null,
    completedOrders: null,
    pendingOrders: null,
    rejectedOrders: null,
    totalRevenue: null,
  });
  const [loadingKpis, setLoadingKpis] = useState(true);

  // 4. Reload trigger
  const [reloadTrigger, setReloadTrigger] = useState(0);

  // 5. Modal States
  const [detailOrder, setDetailOrder] = useState<AdminOrderItem | null>(null);
  const [statusOrder, setStatusOrder] = useState<AdminOrderItem | null>(null);
  const [targetStatus, setTargetStatus] = useState<'completed' | 'rejected' | null>(null);

  // Fetch KPI statistics
  const fetchKpis = useCallback(async (signal?: AbortSignal) => {
    try {
      await Promise.resolve();
      setLoadingKpis(true);
      const data = await adminOrderService.getOrderKpis({ signal });
      setKpis(data);
    } catch {
      // Ignore KPI load errors
    } finally {
      setLoadingKpis(false);
    }
  }, []);

  // Fetch orders from backend with pagination, search, and status
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const loadData = async () => {
      await Promise.resolve();
      if (!isMounted) return;

      setLoading(true);
      setError(null);

      try {
        const res = await adminOrderService.getOrders(
          {
            page: pagination.page,
            limit: pagination.limit,
            status: statusFilter !== 'all' ? statusFilter : undefined,
            search: search.trim() ? search.trim() : undefined,
          },
          { signal: controller.signal }
        );

        if (!isMounted) return;

        if (res.success && res.data) {
          setOrders(res.data.orders || []);
          setPagination(res.data.pagination);
        } else {
          setOrders([]);
          setError(res.message || 'Không thể tải danh sách đơn hàng.');
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        if (err instanceof Error && err.name === 'AbortError') return;

        const msg = normalizeOrderApiError(err, 'Không thể tải danh sách đơn hàng từ máy chủ.');
        setError(msg);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }

      if (isMounted) {
        await fetchKpis(controller.signal);
      }
    };

    loadData();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [pagination.page, pagination.limit, statusFilter, search, reloadTrigger, fetchKpis]);

  // Handlers for Filters
  const handleSearchChange = useCallback((newSearch: string) => {
    setSearch(newSearch);
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  const handleStatusFilterChange = useCallback((newStatus: OrderFilterStatus) => {
    setStatusFilter(newStatus);
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  const handleResetFilters = useCallback(() => {
    setSearch('');
    setStatusFilter('all');
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  // Handlers for Pagination
  const handlePageChange = useCallback((newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  }, []);

  const handleLimitChange = useCallback((newLimit: number) => {
    setPagination((prev) => ({ ...prev, limit: newLimit, page: 1 }));
  }, []);

  // Handlers for Status Modal
  const handleOpenStatusModal = useCallback(
    (order: AdminOrderItem, target: 'completed' | 'rejected') => {
      setStatusOrder(order);
      setTargetStatus(target);
    },
    []
  );

  const handleStatusSuccess = useCallback(
    (orderId: string, newStatus: 'completed' | 'rejected') => {
      // 1. Refresh list and KPIs
      setReloadTrigger((prev) => prev + 1);

      // 2. If detail modal is open for this order, update its status
      if (detailOrder && (detailOrder.id === orderId || detailOrder._id === orderId)) {
        if (newStatus === 'completed') {
          setDetailOrder((prev) => (prev ? { ...prev, status: 'COMPLETED' } : null));
        } else {
          setDetailOrder(null); // Order rejected/deleted
        }
      }
    },
    [detailOrder]
  );

  return (
    <div className="space-y-6">
      {/* 1. Header Title & Subtitle */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-[#f1ebff] dark:border-[#2b2438]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl md:text-3xl font-bold text-[#1c192c] dark:text-[#f4eeff] tracking-tight">
              Quản lý Đơn hàng
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#f7f1ff] dark:bg-[#2b2438] text-[#7240b8] dark:text-[#a87ffb] border border-[#7240b8]/20">
              Admin Module
            </span>
          </div>
          <p className="text-sm text-[#635a72] dark:text-[#a9a0b2]">
            Giám sát toàn bộ giao dịch mua khóa học, kiểm tra đối soát thanh toán và phê duyệt kích hoạt quyền học tập cho học viên.
          </p>
        </div>
      </div>

      {/* 2. KPI Summary Cards */}
      <OrderKpiSummary kpis={kpis} loading={loadingKpis} />

      {/* 3. Filters Bar */}
      <OrderFiltersBar
        search={search}
        onSearchChange={handleSearchChange}
        statusFilter={statusFilter}
        onStatusFilterChange={handleStatusFilterChange}
        onResetFilters={handleResetFilters}
        loading={loading}
      />

      {/* 4. Orders Table / Cards */}
      <div className="space-y-4">
        <OrderTable
          orders={orders}
          loading={loading}
          error={error}
          onRetry={() => setReloadTrigger((prev) => prev + 1)}
          onViewDetail={(order) => setDetailOrder(order)}
          onOpenStatusModal={handleOpenStatusModal}
          hasFilters={search.trim() !== '' || statusFilter !== 'all'}
          onResetFilters={handleResetFilters}
        />

        {/* 5. Pagination */}
        <OrderPagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          limit={pagination.limit}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
          loading={loading}
        />
      </div>

      {/* 6. Order Detail Modal */}
      <OrderDetailModal
        order={detailOrder}
        isOpen={!!detailOrder}
        onClose={() => setDetailOrder(null)}
        onOpenStatusModal={handleOpenStatusModal}
      />

      {/* 7. Order Status Transition Modal */}
      <OrderStatusModal
        order={statusOrder}
        targetStatus={targetStatus}
        isOpen={!!statusOrder && !!targetStatus}
        onClose={() => {
          setStatusOrder(null);
          setTargetStatus(null);
        }}
        onSuccess={handleStatusSuccess}
      />
    </div>
  );
}
