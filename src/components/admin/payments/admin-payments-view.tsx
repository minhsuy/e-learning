'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  ChartNoAxesCombined,
  ArrowRight,
  RefreshCw,
  Search,
  X,
  RotateCcw,
  Filter,
  Info,
} from 'lucide-react';
import { AdminDashboardSummaryData } from '@/types/admin-dashboard';
import {
  AdminFinancialStatsData,
  AdminOrderItem,
  AdminOrdersPagination,
  AnalyticsPaymentMethodFilter,
  OrderFilterStatus,
} from '@/types/admin-order';
import { PaymentDiagnosticsData, PaymentReconciliationData } from '@/types/payment';
import { adminDashboardService } from '@/services/admin-dashboard.service';
import { adminOrderService, normalizeOrderApiError } from '@/services/admin-order.service';
import {
  getAdminPaymentDiagnostics,
  getAdminPaymentReconciliation,
} from '@/services/payment.service';
import { OrderTable } from '@/components/admin/orders/order-table';
import { OrderPagination } from '@/components/admin/orders/order-pagination';
import { OrderDetailModal } from '@/components/admin/orders/order-detail-modal';
import { OrderStatusModal } from '@/components/admin/orders/order-status-modal';
import { PaymentSummaryCards } from './payment-summary-cards';
import { PaymentDiagnosticsPanel } from './payment-diagnostics-panel';
import { PaymentReconciliationPanel } from './payment-reconciliation-panel';
import { cn } from '@/lib/utils';

const METHOD_TABS: Array<{ value: AnalyticsPaymentMethodFilter; label: string }> = [
  { value: 'all', label: 'Tất cả kênh thanh toán' },
  { value: 'sepay_bank_transfer', label: 'SePay / VietQR' },
  { value: 'manual_bank_transfer', label: 'Chuyển khoản thủ công' },
  { value: 'free', label: 'Miễn phí (0 ₫)' },
  { value: 'legacy_unknown', label: 'Phương thức cũ' },
];

const STATUS_OPTIONS: Array<{ value: OrderFilterStatus; label: string }> = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'pending', label: 'Đang chờ (Pending)' },
  { value: 'completed', label: 'Đã hoàn tất' },
  { value: 'rejected', label: 'Đã từ chối' },
];

export function AdminPaymentsView() {
  // 1. Operational Summary States
  const [summary, setSummary] = useState<AdminDashboardSummaryData | null>(null);
  const [financial, setFinancial] = useState<AdminFinancialStatsData | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  // 2. Diagnostics State
  const [diagnostics, setDiagnostics] = useState<PaymentDiagnosticsData | null>(null);
  const [diagnosticsLoading, setDiagnosticsLoading] = useState(true);
  const [diagnosticsError, setDiagnosticsError] = useState<string | null>(null);

  // 3. Reconciliation State
  const [reconciliation, setReconciliation] = useState<PaymentReconciliationData | null>(null);
  const [reconciliationLoading, setReconciliationLoading] = useState(true);
  const [reconciliationError, setReconciliationError] = useState<string | null>(null);
  const [windowDays, setWindowDays] = useState<7 | 14 | 30>(30);

  // 4. Payment-Filtered Orders List State (Reusing existing GET /api/orders)
  const [orders, setOrders] = useState<AdminOrderItem[]>([]);
  const [pagination, setPagination] = useState<AdminOrdersPagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  // Filters for payment orders list
  const [paymentMethod, setPaymentMethod] = useState<AnalyticsPaymentMethodFilter>('sepay_bank_transfer');
  const [statusFilter, setStatusFilter] = useState<OrderFilterStatus>('all');
  const [sortBy, setSortBy] = useState<'createdAt' | 'paidAt' | 'total'>('createdAt');
  const [search, setSearch] = useState('');
  const [localSearch, setLocalSearch] = useState('');

  // Modal states
  const [detailOrder, setDetailOrder] = useState<AdminOrderItem | null>(null);
  const [detailOrderId, setDetailOrderId] = useState<string | null>(null);
  const [statusOrder, setStatusOrder] = useState<AdminOrderItem | null>(null);
  const [targetStatus, setTargetStatus] = useState<'completed' | 'rejected' | null>(null);

  // Refresh & tracking
  const [reloadKey, setReloadKey] = useState(0);
  const [diagRetryKey, setDiagRetryKey] = useState(0);
  const [reconRetryKey, setReconRetryKey] = useState(0);
  const [ordersRetryKey, setOrdersRetryKey] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Debounce search input (400ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== search) {
        setSearch(localSearch);
        setPagination((prev) => ({ ...prev, page: 1 }));
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [localSearch, search]);

  // Load Operational Summary (dashboard summary + all-time paidOrders financial stats)
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const loadSummary = async () => {
      await Promise.resolve();
      if (!isMounted) return;
      setSummaryLoading(true);
      const [summaryRes, financialRes] = await Promise.allSettled([
        adminDashboardService.getDashboardSummary({ signal: controller.signal }),
        adminOrderService.getFinancialStats(
          { timeRange: 'all', timeBasis: 'recognizedAt', timezone: 'Asia/Ho_Chi_Minh' },
          { signal: controller.signal }
        ),
      ]);

      if (!isMounted) return;

      if (summaryRes.status === 'fulfilled' && summaryRes.value.success && summaryRes.value.data) {
        setSummary(summaryRes.value.data);
      }
      if (
        financialRes.status === 'fulfilled' &&
        financialRes.value.success &&
        financialRes.value.data
      ) {
        setFinancial(financialRes.value.data);
      }
      setLastUpdated(new Date());
      setSummaryLoading(false);
    };

    void loadSummary();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [reloadKey]);

  // Load Payment Diagnostics (GET /api/payments/admin/diagnostics)
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const loadDiagnostics = async () => {
      await Promise.resolve();
      if (!isMounted) return;
      setDiagnosticsLoading(true);
      setDiagnosticsError(null);
      try {
        const res = await getAdminPaymentDiagnostics({ signal: controller.signal });
        if (!isMounted) return;
        if (res.success && res.data) {
          setDiagnostics(res.data);
        } else {
          setDiagnosticsError(res.error || 'Không thể tải dữ liệu chẩn đoán thanh toán.');
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        if (err instanceof Error && err.name === 'AbortError') return;
        setDiagnosticsError(
          normalizeOrderApiError(err, 'Không thể tải thông tin chẩn đoán webhook thanh toán.')
        );
      } finally {
        if (isMounted) setDiagnosticsLoading(false);
      }
    };

    void loadDiagnostics();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [reloadKey, diagRetryKey]);

  // Load Payment Reconciliation (GET /api/payments/admin/reconciliation)
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const loadReconciliation = async () => {
      await Promise.resolve();
      if (!isMounted) return;
      setReconciliationLoading(true);
      setReconciliationError(null);
      try {
        const now = new Date();
        const fromDate = new Date(now.getTime() - windowDays * 86_400_000);
        const res = await getAdminPaymentReconciliation(
          {
            from: fromDate.toISOString(),
            to: now.toISOString(),
            limit: 100,
            external: false,
          },
          { signal: controller.signal }
        );
        if (!isMounted) return;
        if (res.success && res.data) {
          setReconciliation(res.data);
        } else {
          setReconciliationError(res.error || 'Không thể tải báo cáo đối soát thanh toán.');
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        if (err instanceof Error && err.name === 'AbortError') return;
        setReconciliationError(
          normalizeOrderApiError(err, 'Không thể tải báo cáo đối soát từ máy chủ.')
        );
      } finally {
        if (isMounted) setReconciliationLoading(false);
      }
    };

    void loadReconciliation();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [windowDays, reloadKey, reconRetryKey]);

  // Load Payment-Focused Orders List (GET /api/orders with paymentMethod filter)
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const loadOrders = async () => {
      await Promise.resolve();
      if (!isMounted) return;
      setOrdersLoading(true);
      setOrdersError(null);
      try {
        const res = await adminOrderService.getOrders(
          {
            page: pagination.page,
            limit: pagination.limit,
            paymentMethod: paymentMethod !== 'all' ? paymentMethod : undefined,
            status: statusFilter !== 'all' ? statusFilter : undefined,
            search: search.trim() || undefined,
            sortBy,
            sortOrder: 'desc',
          },
          { signal: controller.signal }
        );

        if (!isMounted) return;
        if (res.success && res.data) {
          setOrders(res.data.orders || []);
          setPagination(res.data.pagination);
        } else {
          setOrders([]);
          setOrdersError(res.message || 'Không thể tải danh sách giao dịch đơn hàng.');
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        if (err instanceof Error && err.name === 'AbortError') return;
        setOrdersError(
          normalizeOrderApiError(err, 'Không thể tải danh sách đơn thanh toán từ máy chủ.')
        );
      } finally {
        if (isMounted) setOrdersLoading(false);
      }
    };

    void loadOrders();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [
    pagination.page,
    pagination.limit,
    paymentMethod,
    statusFilter,
    sortBy,
    search,
    reloadKey,
    ordersRetryKey,
  ]);

  const handleRefreshAll = useCallback(() => {
    setReloadKey((prev) => prev + 1);
  }, []);

  const handleResetFilters = useCallback(() => {
    setPaymentMethod('all');
    setStatusFilter('all');
    setSortBy('createdAt');
    setSearch('');
    setLocalSearch('');
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  const handleOpenStatusModal = useCallback(
    (order: AdminOrderItem, target: 'completed' | 'rejected') => {
      setStatusOrder(order);
      setTargetStatus(target);
    },
    []
  );

  const handleStatusSuccess = useCallback(
    (orderId: string, newStatus: 'completed' | 'rejected') => {
      setReloadKey((prev) => prev + 1);
      if (detailOrder && (detailOrder.id === orderId || detailOrder._id === orderId)) {
        if (newStatus === 'completed') {
          setDetailOrder((prev) => (prev ? { ...prev, status: 'COMPLETED' } : null));
        } else {
          setDetailOrder(null);
          setDetailOrderId(null);
        }
      }
    },
    [detailOrder]
  );

  const isAnyLoading =
    summaryLoading || diagnosticsLoading || reconciliationLoading || ordersLoading;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-3 border-b border-[#f1ebff] dark:border-[#2b2438]">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#1c192c] dark:text-[#f4eeff] tracking-tight">
              Quản lý thanh toán
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800/40">
              Payment Operations
            </span>
          </div>
          <p className="text-sm text-[#635a72] dark:text-[#a9a0b2]">
            Theo dõi giao dịch SePay, đối soát và các vấn đề thanh toán cần xử lý.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          {lastUpdated && (
            <span className="text-[11px] text-[#8e849e] dark:text-[#8d8299]">
              Cập nhật lúc{' '}
              {new Intl.DateTimeFormat('vi-VN', { timeStyle: 'medium' }).format(lastUpdated)}
            </span>
          )}
          <button
            type="button"
            onClick={handleRefreshAll}
            disabled={isAnyLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#f7f1ff] dark:bg-[#2b2438] hover:bg-[#ede5fa] dark:hover:bg-[#352c48] text-[#7240b8] dark:text-[#a87ffb] text-xs font-semibold border border-[#7240b8]/20 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', isAnyLoading && 'animate-spin')} />
            <span>Làm mới dữ liệu</span>
          </button>
          <Link
            href="/admin/analytics"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-[#1d1926] border border-[#f1ebff] dark:border-[#2b2438] hover:border-[#7240b8]/40 text-xs font-semibold text-[#1c192c] dark:text-[#f4eeff] hover:text-[#7240b8] dark:hover:text-[#a87ffb] shadow-xs transition-all"
          >
            <ChartNoAxesCombined className="w-3.5 h-3.5 text-[#7240b8] dark:text-[#a87ffb]" />
            <span>Phân tích &amp; Báo cáo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 1. Payment Operational Summary Cards */}
      <section aria-label="Tổng quan vận hành thanh toán">
        <PaymentSummaryCards
          summary={summary}
          financial={financial}
          diagnostics={diagnostics}
          loading={summaryLoading && diagnosticsLoading}
        />
      </section>

      {/* 2. Diagnostics & Reconciliation Panels */}
      <section aria-label="Chẩn đoán và đối soát thanh toán" className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <PaymentDiagnosticsPanel
          data={diagnostics}
          loading={diagnosticsLoading}
          error={diagnosticsError}
          onRetry={() => setDiagRetryKey((k) => k + 1)}
        />

        <PaymentReconciliationPanel
          data={reconciliation}
          loading={reconciliationLoading}
          error={reconciliationError}
          windowDays={windowDays}
          onWindowDaysChange={setWindowDays}
          onInspectOrder={(orderId) => {
            setDetailOrder(null);
            setDetailOrderId(orderId);
          }}
          onRetry={() => setReconRetryKey((k) => k + 1)}
        />
      </section>

      {/* 3. Payment-Focused Order List (Reusing OrderTable, OrderPagination, OrderDetailModal) */}
      <section aria-label="Danh sách đơn hàng theo kênh thanh toán" className="space-y-4">
        <div className="bg-white dark:bg-[#1d1926] rounded-2xl border border-[#f1ebff] dark:border-[#2b2438] p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#f1ebff] dark:border-[#2b2438]">
            <div>
              <h2 className="text-base font-bold text-[#1c192c] dark:text-[#f4eeff]">
                Danh sách đơn hàng &amp; đối soát theo kênh thanh toán
              </h2>
              <p className="text-xs text-[#635a72] dark:text-[#a9a0b2]">
                Nhấn vào từng dòng để xem chi tiết giao dịch đã lọc an toàn (<code className="font-mono text-[11px]">GET /api/orders/:id</code>). Đơn SePay được đối soát tự động; chỉ đơn chuyển khoản thủ công/cũ ở trạng thái PENDING mới cho phép duyệt tay.
              </p>
            </div>
            <Link
              href="/admin/orders"
              className="text-xs font-semibold text-[#7240b8] dark:text-[#a87ffb] hover:underline inline-flex items-center gap-1 shrink-0"
            >
              <span>Mở Quản lý Đơn hàng</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Payment Method Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-[#635a72] dark:text-[#a9a0b2] mr-1 inline-flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-[#7240b8] dark:text-[#a87ffb]" />
              Kênh thanh toán:
            </span>
            {METHOD_TABS.map((tab) => {
              const active = paymentMethod === tab.value;
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => {
                    setPaymentMethod(tab.value);
                    setPagination((prev) => ({ ...prev, page: 1 }));
                  }}
                  disabled={ordersLoading}
                  aria-pressed={active}
                  className={cn(
                    'px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer',
                    active
                      ? 'bg-[#7240b8] text-white shadow-xs'
                      : 'bg-[#fdf8ff] dark:bg-[#17141f] text-[#635a72] dark:text-[#a9a0b2] hover:bg-[#f1ebff] dark:hover:bg-[#2b2438] border border-[#f1ebff] dark:border-[#2b2438]'
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Search + Status + Sort Row */}
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#8e849e] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                placeholder="Tìm theo mã đơn, tên khóa học, học viên hoặc email..."
                className="w-full pl-10 pr-9 py-2 text-xs sm:text-sm rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] text-[#1c192c] dark:text-[#f4eeff] placeholder:text-[#8e849e] focus:outline-hidden focus:ring-2 focus:ring-[#7240b8]/30"
              />
              {localSearch && (
                <button
                  type="button"
                  onClick={() => {
                    setLocalSearch('');
                    setSearch('');
                    setPagination((prev) => ({ ...prev, page: 1 }));
                  }}
                  aria-label="Xóa tìm kiếm"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8e849e] hover:text-[#1c192c] dark:hover:text-[#f4eeff] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <select
              aria-label="Lọc theo trạng thái đơn"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as OrderFilterStatus);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              disabled={ordersLoading}
              className="h-9 px-3 rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] text-xs font-medium text-[#1c192c] dark:text-[#f4eeff] cursor-pointer"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <select
              aria-label="Sắp xếp đơn thanh toán"
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as 'createdAt' | 'paidAt' | 'total');
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              disabled={ordersLoading}
              className="h-9 px-3 rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] text-xs font-medium text-[#1c192c] dark:text-[#f4eeff] cursor-pointer"
            >
              <option value="createdAt">Sắp xếp: Ngày tạo mới nhất</option>
              <option value="paidAt">Sắp xếp: Thời điểm thanh toán</option>
              <option value="total">Sắp xếp: Giá trị đơn hàng</option>
            </select>

            {(paymentMethod !== 'all' || statusFilter !== 'all' || search.trim() !== '') && (
              <button
                type="button"
                onClick={handleResetFilters}
                disabled={ordersLoading}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 border border-rose-200 dark:border-rose-900/40 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Đặt lại</span>
              </button>
            )}
          </div>

          <div className="flex items-start gap-2 text-[11px] text-[#635a72] dark:text-[#a9a0b2]">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#7240b8] dark:text-[#a87ffb]" />
            <span>
              Trạng thái hiển thị trên bảng là <strong>trạng thái đơn hàng</strong> (Order status). Để xem trạng thái giao dịch nhà cung cấp và mã tham chiếu Admin, vui lòng nhấn xem chi tiết đơn hàng.
            </span>
          </div>
        </div>

        {/* Reused OrderTable + OrderPagination */}
        <OrderTable
          orders={orders}
          loading={ordersLoading}
          error={ordersError}
          onRetry={() => setOrdersRetryKey((k) => k + 1)}
          onViewDetail={(order) => {
            setDetailOrder(order);
            setDetailOrderId(order.id || order._id || null);
          }}
          onOpenStatusModal={handleOpenStatusModal}
          hasFilters={paymentMethod !== 'all' || statusFilter !== 'all' || search.trim() !== ''}
          onResetFilters={handleResetFilters}
        />

        <OrderPagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          limit={pagination.limit}
          onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
          onLimitChange={(limit) => setPagination((prev) => ({ ...prev, limit, page: 1 }))}
          loading={ordersLoading}
        />
      </section>

      {/* Reused Enhanced OrderDetailModal (calls GET /api/orders/:id) */}
      <OrderDetailModal
        order={detailOrder}
        orderId={detailOrderId}
        isOpen={Boolean(detailOrder || detailOrderId)}
        onClose={() => {
          setDetailOrder(null);
          setDetailOrderId(null);
        }}
        onOpenStatusModal={handleOpenStatusModal}
      />

      {/* Reused OrderStatusModal (Only for eligible manual/legacy pending orders) */}
      <OrderStatusModal
        order={statusOrder}
        targetStatus={targetStatus}
        isOpen={Boolean(statusOrder && targetStatus)}
        onClose={() => {
          setStatusOrder(null);
          setTargetStatus(null);
        }}
        onSuccess={handleStatusSuccess}
      />
    </div>
  );
}
