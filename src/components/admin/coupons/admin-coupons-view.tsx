'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  AdminCouponItem,
  AdminCouponKpis,
  AdminCouponsPagination,
  CouponFilterStatus,
  CouponFilterType,
  CouponFilterScope,
  CouponFilterValidity,
} from '@/types/admin-coupon';
import {
  adminCouponService,
  getCouponValidityStatus,
  normalizeCouponApiError,
} from '@/services/admin-coupon.service';
import { CouponKpiSummary } from './coupon-kpi-summary';
import { CouponFiltersBar } from './coupon-filters-bar';
import { CouponTable } from './coupon-table';
import { CouponPagination } from './coupon-pagination';
import { CouponDetailModal } from './coupon-detail-modal';
import { CreateCouponModal } from './create-coupon-modal';
import { EditCouponModal } from './edit-coupon-modal';
import { DeleteCouponModal } from './delete-coupon-modal';
import { toast } from '@/lib/toast';

export function AdminCouponsView() {
  // 1. Data States
  const [coupons, setCoupons] = useState<AdminCouponItem[]>([]);
  const [pagination, setPagination] = useState<AdminCouponsPagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 2. Filter States
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<CouponFilterStatus>('all');
  const [typeFilter, setTypeFilter] = useState<CouponFilterType>('all');
  const [scopeFilter, setScopeFilter] = useState<CouponFilterScope>('all');
  const [validityFilter, setValidityFilter] = useState<CouponFilterValidity>('all');

  // 3. KPI State
  const [kpis, setKpis] = useState<AdminCouponKpis>({
    totalCoupons: null,
    activeCoupons: null,
    inactiveCoupons: null,
    totalUsed: null,
    totalLimit: null,
  });
  const [loadingKpis, setLoadingKpis] = useState(true);

  // 4. Reload trigger
  const [reloadTrigger, setReloadTrigger] = useState(0);

  // 5. Modal States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [detailCouponId, setDetailCouponId] = useState<string | null>(null);
  const [couponToEdit, setCouponToEdit] = useState<AdminCouponItem | null>(null);
  const [couponToDelete, setCouponToDelete] = useState<AdminCouponItem | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Fetch KPI statistics
  const fetchKpis = useCallback(async (signal?: AbortSignal) => {
    try {
      await Promise.resolve();
      setLoadingKpis(true);
      const data = await adminCouponService.getCouponKpis({ signal });
      setKpis(data);
    } catch {
      // Ignore KPI load errors
    } finally {
      setLoadingKpis(false);
    }
  }, []);

  // Fetch coupons from backend with pagination, search, and active status
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const loadData = async () => {
      await Promise.resolve();
      if (!isMounted) return;

      setLoading(true);
      setError(null);

      try {
        const activeParam =
          statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined;

        const res = await adminCouponService.getCoupons(
          {
            page: pagination.page,
            limit: pagination.limit,
            search: search.trim() || undefined,
            active: activeParam,
          },
          { signal: controller.signal }
        );

        if (isMounted) {
          const fetchedCoupons = res.data?.coupons || [];
          setCoupons(fetchedCoupons);

          if (res.data?.pagination) {
            setPagination((prev) => ({
              ...prev,
              ...res.data.pagination,
            }));
          } else {
            setPagination((prev) => ({
              ...prev,
              total: fetchedCoupons.length,
              totalPages: Math.max(1, Math.ceil(fetchedCoupons.length / prev.limit)),
            }));
          }
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return;
        if (isMounted) {
          const msg = normalizeCouponApiError(err, 'Không thể tải danh sách mã giảm giá.');
          setError(msg);
          toast.error(msg);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }

      if (isMounted) {
        await fetchKpis(controller.signal);
      }
    };

    void loadData();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [pagination.page, pagination.limit, search, statusFilter, reloadTrigger, fetchKpis]);

  // Client-side additional filtering for Type, Scope, and Validity on current page
  const filteredCoupons = useMemo(() => {
    return coupons.filter((coupon) => {
      // Type Filter
      if (typeFilter !== 'all') {
        const cleanType = (coupon.type || '').toLowerCase();
        if (cleanType !== typeFilter) return false;
      }

      // Scope Filter
      if (scopeFilter !== 'all') {
        const isGlobal = !coupon.courses || coupon.courses.length === 0;
        if (scopeFilter === 'global' && !isGlobal) return false;
        if (scopeFilter === 'specific' && isGlobal) return false;
      }

      // Validity Filter
      if (validityFilter !== 'all') {
        const validity = getCouponValidityStatus(coupon);
        if (validityFilter === 'valid' && validity !== 'active') return false;
        if (validityFilter === 'upcoming' && validity !== 'upcoming') return false;
        if (validityFilter === 'expired' && validity !== 'expired') return false;
        if (validityFilter === 'exhausted' && validity !== 'exhausted') return false;
      }

      return true;
    });
  }, [coupons, typeFilter, scopeFilter, validityFilter]);

  // Reset all filters
  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setTypeFilter('all');
    setScopeFilter('all');
    setValidityFilter('all');
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Quick toggle active status
  const handleToggleActive = async (coupon: AdminCouponItem) => {
    const couponId = coupon.id || coupon._id;
    if (!couponId || togglingId) return;

    setTogglingId(couponId);
    try {
      const res = await adminCouponService.toggleCouponActive(couponId, coupon.active);
      const newActive = !coupon.active;
      toast.success(
        res?.message ||
          `Đã ${newActive ? 'kích hoạt' : 'tắt'} mã giảm giá "${coupon.code}" thành công!`
      );

      // Local state update
      setCoupons((prev) =>
        prev.map((c) =>
          (c.id || c._id) === couponId ? { ...c, active: newActive } : c
        )
      );

      // Refresh KPIs
      void fetchKpis();
    } catch (err: unknown) {
      const msg = normalizeCouponApiError(err, 'Không thể cập nhật trạng thái mã giảm giá.');
      toast.error(msg);
    } finally {
      setTogglingId(null);
    }
  };

  // Handle successful delete
  const handleDeleteSuccess = (deletedId: string) => {
    setCoupons((prev) => prev.filter((c) => (c.id || c._id) !== deletedId));
    setPagination((prev) => {
      const newTotal = Math.max(0, prev.total - 1);
      const newTotalPages = Math.max(1, Math.ceil(newTotal / prev.limit));
      const newPage = prev.page > newTotalPages ? newTotalPages : prev.page;
      return {
        ...prev,
        total: newTotal,
        totalPages: newTotalPages,
        page: newPage,
      };
    });
    setReloadTrigger((n) => n + 1);
  };

  // Handle successful create
  const handleCreateSuccess = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    setReloadTrigger((n) => n + 1);
  };

  // Handle successful edit
  const handleEditSuccess = (updatedCoupon: AdminCouponItem) => {
    const updatedId = updatedCoupon.id || updatedCoupon._id;
    setCoupons((prev) =>
      prev.map((c) => ((c.id || c._id) === updatedId ? { ...c, ...updatedCoupon } : c))
    );
    setReloadTrigger((n) => n + 1);
  };

  const hasActiveFilters =
    search.trim() !== '' ||
    statusFilter !== 'all' ||
    typeFilter !== 'all' ||
    scopeFilter !== 'all' ||
    validityFilter !== 'all';

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* 1. Header Row */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-[#f1ebff] dark:border-[#2b2438]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1c192c] dark:text-[#f4eeff] tracking-tight">
              Quản lý Mã giảm giá
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#f7f1ff] dark:bg-[#2b2438] text-[#7240b8] dark:text-[#a87ffb] border border-[#7240b8]/20">
              Admin Coupon Module
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#635a72] dark:text-[#a9a0b2]">
            Thiết lập các chương trình khuyến mãi, chiết khấu phần trăm hoặc tiền cố định, quản lý thời hạn và lượt sử dụng.
          </p>
        </div>
      </div>

      {/* 2. KPI Summary Cards */}
      <CouponKpiSummary kpis={kpis} loading={loadingKpis} />

      {/* 3. Filters & Search Bar */}
      <CouponFiltersBar
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPagination((prev) => ({ ...prev, page: 1 }));
        }}
        statusFilter={statusFilter}
        onStatusFilterChange={(val) => {
          setStatusFilter(val);
          setPagination((prev) => ({ ...prev, page: 1 }));
        }}
        typeFilter={typeFilter}
        onTypeFilterChange={(val) => setTypeFilter(val)}
        scopeFilter={scopeFilter}
        onScopeFilterChange={(val) => setScopeFilter(val)}
        validityFilter={validityFilter}
        onValidityFilterChange={(val) => setValidityFilter(val)}
        onResetFilters={handleResetFilters}
        onCreateOpen={() => setIsCreateOpen(true)}
        loading={loading}
      />

      {/* 4. Coupon Table & Cards */}
      <CouponTable
        coupons={filteredCoupons}
        loading={loading}
        error={error}
        onRetry={() => setReloadTrigger((n) => n + 1)}
        onViewDetail={(c) => setDetailCouponId(c.id || c._id || null)}
        onEdit={(c) => setCouponToEdit(c)}
        onDelete={(c) => setCouponToDelete(c)}
        onToggleActive={handleToggleActive}
        togglingId={togglingId}
        hasFilters={hasActiveFilters}
        onResetFilters={handleResetFilters}
        onCreateOpen={() => setIsCreateOpen(true)}
      />

      {/* 5. Pagination */}
      {!loading && !error && filteredCoupons.length > 0 && (
        <CouponPagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          limit={pagination.limit}
          onPageChange={(p) => setPagination((prev) => ({ ...prev, page: p }))}
          onLimitChange={(l) => setPagination((prev) => ({ ...prev, limit: l, page: 1 }))}
          loading={loading}
        />
      )}

      {/* 6. Modals */}
      <CouponDetailModal
        couponId={detailCouponId}
        isOpen={!!detailCouponId}
        onClose={() => setDetailCouponId(null)}
        onEdit={(c) => {
          setDetailCouponId(null);
          setCouponToEdit(c);
        }}
        onDelete={(c) => {
          setDetailCouponId(null);
          setCouponToDelete(c);
        }}
      />

      <CreateCouponModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      <EditCouponModal
        coupon={couponToEdit}
        isOpen={!!couponToEdit}
        onClose={() => setCouponToEdit(null)}
        onSuccess={handleEditSuccess}
      />

      <DeleteCouponModal
        coupon={couponToDelete}
        isOpen={!!couponToDelete}
        onClose={() => setCouponToDelete(null)}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
}
