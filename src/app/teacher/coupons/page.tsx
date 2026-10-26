'use client';

import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { couponService } from '@/services/coupon.service';
import {
  CouponItem,
  CreateCouponDto,
  UpdateCouponDto,
} from '@/types/coupon';
import { AppApiError } from '@/types/api';
import { toast } from '@/lib/toast';

import { CouponKpiCards } from '@/components/teacher/coupons/coupon-kpi-cards';
import { CouponTable } from '@/components/teacher/coupons/coupon-table';
import { CouponFormModal } from '@/components/teacher/coupons/coupon-form-modal';
import { CouponDeleteModal } from '@/components/teacher/coupons/coupon-delete-modal';

export default function TeacherCouponsPage() {
  // Coupon data state
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'percentage' | 'number'>('all');

  // UI & Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [reloadTrigger, setReloadTrigger] = useState(0);

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponItem | null>(null);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingCoupon, setDeletingCoupon] = useState<CouponItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Debounce search input (350ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch Coupons from API
  useEffect(() => {
    let isMounted = true;

    const loadCoupons = async () => {
      try {
        setIsLoading(true);
        setIsError(false);
        setErrorMessage('');

        const activeParam =
          statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined;

        const res = await couponService.getCoupons({
          page: pagination.page,
          limit: pagination.limit,
          search: debouncedSearch.trim() || undefined,
          active: activeParam,
        });

        if (!isMounted) return;

        if (res.data) {
          let fetchedCoupons = res.data.coupons || [];

          // Client-side filter for type if backend doesn't filter type in query
          if (typeFilter !== 'all') {
            fetchedCoupons = fetchedCoupons.filter(
              (c) => (c.type || '').toLowerCase() === typeFilter.toLowerCase()
            );
          }

          setCoupons(fetchedCoupons);
          if (res.data.pagination) {
            setPagination(res.data.pagination);
          } else {
            setPagination((prev) => ({
              ...prev,
              total: fetchedCoupons.length,
              totalPages: Math.max(1, Math.ceil(fetchedCoupons.length / prev.limit)),
            }));
          }
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        console.error('Error fetching teacher coupons:', err);
        setIsError(true);
        if (err instanceof AppApiError) {
          setErrorMessage(err.message || 'Không thể tải danh sách mã giảm giá.');
        } else if (err instanceof Error) {
          setErrorMessage(err.message);
        } else {
          setErrorMessage('Không thể kết nối đến máy chủ để tải danh sách mã giảm giá.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadCoupons();

    return () => {
      isMounted = false;
    };
  }, [pagination.page, pagination.limit, debouncedSearch, statusFilter, typeFilter, reloadTrigger]);

  // Handler for create / update coupon
  const handleFormSubmit = async (
    data: CreateCouponDto | UpdateCouponDto,
    isEdit: boolean,
    id?: string
  ) => {
    try {
      setIsSubmittingForm(true);

      if (isEdit && id) {
        await couponService.updateCoupon(id, data);
        toast.success('Cập nhật mã giảm giá thành công!');
      } else {
        await couponService.createCoupon(data as CreateCouponDto);
        toast.success('Tạo mã giảm giá mới thành công!');
      }

      setIsFormModalOpen(false);
      setEditingCoupon(null);
      setReloadTrigger((prev) => prev + 1);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Không thể lưu mã giảm giá. Vui lòng kiểm tra lại.';
      toast.error(msg);
      throw new Error(msg);
    } finally {
      setIsSubmittingForm(false);
    }
  };

  // Handler for toggle active status inline
  const handleToggleActive = async (coupon: CouponItem) => {
    const couponId = coupon.id || coupon._id;
    if (!couponId) return;

    const newActiveState = !coupon.active;
    try {
      await couponService.updateCoupon(couponId, { active: newActiveState });
      toast.success(
        newActiveState
          ? `Đã kích hoạt mã "${coupon.code}"`
          : `Đã tạm dừng mã "${coupon.code}"`
      );
      setReloadTrigger((prev) => prev + 1);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Không thể thay đổi trạng thái mã giảm giá.';
      toast.error(msg);
    }
  };

  // Handler for delete coupon
  const handleDeleteConfirm = async (couponId: string) => {
    try {
      setIsDeleting(true);
      await couponService.deleteCoupon(couponId);
      toast.success('Đã xóa mã giảm giá thành công!');
      setIsDeleteModalOpen(false);
      setDeletingCoupon(null);
      setReloadTrigger((prev) => prev + 1);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Không thể xóa mã giảm giá. Vui lòng thử lại.';
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-[#7240b8] dark:text-[#a87ffb] uppercase tracking-wider">
              Kênh Giảng Viên
            </span>
            <span className="text-[#7c7483] dark:text-[#968e9e]">•</span>
            <span className="text-xs text-[#7c7483] dark:text-[#968e9e]">Khuyến Mãi & Tiếp Thị</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#1c192c] dark:text-[#f4eeff] tracking-tight">
            Quản lý mã giảm giá
          </h1>
          <p className="text-xs md:text-sm text-[#635a72] dark:text-[#cdc3d4] mt-1 max-w-2xl">
            Tạo và cấu hình các chương trình ưu đãi học phí dành riêng cho các khóa học của bạn để thu hút thêm học viên mới.
          </p>
        </div>

        {/* CTA Button */}
        <button
          onClick={() => {
            setEditingCoupon(null);
            setIsFormModalOpen(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-[#7240b8] hover:bg-[#5e3299] text-white text-xs md:text-sm font-semibold shadow-xs flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo mã giảm giá mới</span>
        </button>
      </div>

      {/* KPI Summary Cards */}
      <CouponKpiCards
        coupons={coupons}
        totalFromPagination={pagination.total}
        isLoading={isLoading}
      />

      {/* Coupon Listing & Filter Table */}
      <CouponTable
        coupons={coupons}
        isLoading={isLoading}
        isError={isError}
        errorMessage={errorMessage}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={(val) => {
          setStatusFilter(val as 'all' | 'active' | 'inactive');
          setPagination((prev) => ({ ...prev, page: 1 }));
        }}
        typeFilter={typeFilter}
        onTypeFilterChange={(val) => {
          setTypeFilter(val as 'all' | 'percentage' | 'number');
          setPagination((prev) => ({ ...prev, page: 1 }));
        }}
        pagination={pagination}
        onPageChange={(newPage) => setPagination((prev) => ({ ...prev, page: newPage }))}
        onRefresh={() => setReloadTrigger((prev) => prev + 1)}
        onCreateNew={() => {
          setEditingCoupon(null);
          setIsFormModalOpen(true);
        }}
        onEditCoupon={(coupon) => {
          setEditingCoupon(coupon);
          setIsFormModalOpen(true);
        }}
        onDeleteCoupon={(coupon) => {
          setDeletingCoupon(coupon);
          setIsDeleteModalOpen(true);
        }}
        onToggleActive={handleToggleActive}
      />

      {/* Create / Edit Modal */}
      <CouponFormModal
        isOpen={isFormModalOpen}
        coupon={editingCoupon}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingCoupon(null);
        }}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmittingForm}
      />

      {/* Delete Confirmation Modal */}
      <CouponDeleteModal
        isOpen={isDeleteModalOpen}
        coupon={deletingCoupon}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingCoupon(null);
        }}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </div>
  );
}
