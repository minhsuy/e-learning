'use client';

import React, { useState } from 'react';
import {
  Search,
  Tag,
  Percent,
  DollarSign,
  Copy,
  Check,
  Edit,
  Trash2,
  AlertTriangle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  X,
  Plus,
} from 'lucide-react';
import { CouponItem } from '@/types/coupon';
import { toast } from '@/lib/toast';

interface CouponTableProps {
  coupons: CouponItem[];
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string; // 'all' | 'active' | 'inactive'
  onStatusFilterChange: (status: string) => void;
  typeFilter: string; // 'all' | 'percentage' | 'number'
  onTypeFilterChange: (type: string) => void;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onPageChange: (newPage: number) => void;
  onRefresh: () => void;
  onCreateNew: () => void;
  onEditCoupon: (coupon: CouponItem) => void;
  onDeleteCoupon: (coupon: CouponItem) => void;
  onToggleActive?: (coupon: CouponItem) => void;
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return 'Không thời hạn';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function isExpired(endDateStr?: string | null): boolean {
  if (!endDateStr) return false;
  try {
    return new Date(endDateStr) < new Date();
  } catch {
    return false;
  }
}

export function CouponTable({
  coupons,
  isLoading = false,
  isError = false,
  errorMessage = '',
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  typeFilter,
  onTypeFilterChange,
  pagination,
  onPageChange,
  onRefresh,
  onCreateNew,
  onEditCoupon,
  onDeleteCoupon,
  onToggleActive,
}: CouponTableProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    toast.success(`Đã sao chép mã ưu đãi "${code}"!`);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  return (
    <div className="space-y-4">
      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-[#17141f] rounded-2xl border border-[#f1ebff] dark:border-[#2b2438] p-4 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7c7483]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm theo mã ưu đãi hoặc tiêu đề..."
            className="w-full pl-9.5 pr-8 py-2 text-xs rounded-xl bg-[#faf6ff] dark:bg-[#1f1b29] border border-[#e8ddfc] dark:border-[#382e4a] text-[#1c192c] dark:text-[#f4eeff] placeholder-[#9c93a4] focus:outline-hidden focus:border-[#7240b8] dark:focus:border-[#a87ffb] transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#7c7483] hover:text-[#1c192c] dark:hover:text-[#f4eeff]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns & Refresh */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#faf6ff] dark:bg-[#1f1b29] border border-[#e8ddfc] dark:border-[#382e4a] text-xs font-semibold text-[#4b4452] dark:text-[#cdc3d4] focus:outline-hidden focus:border-[#7240b8] cursor-pointer"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="inactive">Tạm dừng</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => onTypeFilterChange(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#faf6ff] dark:bg-[#1f1b29] border border-[#e8ddfc] dark:border-[#382e4a] text-xs font-semibold text-[#4b4452] dark:text-[#cdc3d4] focus:outline-hidden focus:border-[#7240b8] cursor-pointer"
          >
            <option value="all">Tất cả loại giảm</option>
            <option value="percentage">Phần trăm (%)</option>
            <option value="number">Số tiền (VND)</option>
          </select>

          {/* Refresh button */}
          <button
            onClick={onRefresh}
            title="Làm mới dữ liệu"
            className="p-2 rounded-xl border border-[#e8ddfc] dark:border-[#382e4a] bg-[#faf6ff] dark:bg-[#1f1b29] text-[#635a72] dark:text-[#cdc3d4] hover:bg-[#f3eaff] dark:hover:bg-[#282136] transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white dark:bg-[#17141f] rounded-2xl border border-[#f1ebff] dark:border-[#2b2438] shadow-xs overflow-hidden">
        {isLoading ? (
          /* Loading Skeleton */
          <div className="p-6 space-y-4">
            <div className="h-6 w-48 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-16 rounded-xl bg-gray-100 dark:bg-gray-800/60 animate-pulse"
                />
              ))}
            </div>
          </div>
        ) : isError ? (
          /* Error State */
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-[#1c192c] dark:text-[#f4eeff]">
              Không thể tải danh sách mã giảm giá
            </h3>
            <p className="text-xs text-[#7c7483] dark:text-[#968e9e] mt-1 max-w-sm">
              {errorMessage || 'Đã có lỗi xảy ra trong quá trình truy vấn dữ liệu từ máy chủ.'}
            </p>
            <button
              onClick={onRefresh}
              className="mt-4 px-4 py-2 rounded-xl bg-[#7240b8] text-white text-xs font-semibold hover:bg-[#5e3299] transition-all cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Thử lại</span>
            </button>
          </div>
        ) : coupons.length === 0 ? (
          /* Empty State */
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-[#7240b8]/10 dark:bg-[#a87ffb]/20 text-[#7240b8] dark:text-[#a87ffb] flex items-center justify-center mb-3">
              <Tag className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-[#1c192c] dark:text-[#f4eeff]">
              {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                ? 'Không tìm thấy mã giảm giá phù hợp'
                : 'Chưa có mã giảm giá nào'}
            </h3>
            <p className="text-xs text-[#7c7483] dark:text-[#968e9e] mt-1 max-w-sm leading-relaxed">
              {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                ? 'Hãy thử thay đổi từ khóa tìm kiếm hoặc điều chỉnh các bộ lọc trạng thái.'
                : 'Tạo mã ưu đãi đầu tiên để kích thích học viên ghi danh vào các khóa học của bạn.'}
            </p>
            {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' ? (
              <button
                onClick={() => {
                  onSearchChange('');
                  onStatusFilterChange('all');
                  onTypeFilterChange('all');
                }}
                className="mt-4 px-4 py-2 rounded-xl border border-[#e8ddfc] dark:border-[#382e4a] text-xs font-semibold text-[#7240b8] dark:text-[#a87ffb] hover:bg-[#f7f1ff] dark:hover:bg-[#221c2e] transition-colors cursor-pointer"
              >
                Đặt lại bộ lọc
              </button>
            ) : (
              <button
                onClick={onCreateNew}
                className="mt-4 px-4 py-2.5 rounded-xl bg-[#7240b8] text-white text-xs font-semibold hover:bg-[#5e3299] transition-all shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tạo mã giảm giá mới</span>
              </button>
            )}
          </div>
        ) : (
          /* Real Data Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#f1ebff] dark:border-[#2b2438] bg-[#fbf8ff] dark:bg-[#1a1622] text-[#635a72] dark:text-[#cdc3d4] font-bold">
                  <th className="py-3.5 px-4">Mã ưu đãi</th>
                  <th className="py-3.5 px-4">Tiêu đề chương trình</th>
                  <th className="py-3.5 px-4">Mức giảm</th>
                  <th className="py-3.5 px-4">Khóa học áp dụng</th>
                  <th className="py-3.5 px-4">Lượt dùng / Hạn mức</th>
                  <th className="py-3.5 px-4">Thời hạn</th>
                  <th className="py-3.5 px-4">Trạng thái</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1ebff] dark:divide-[#2b2438]">
                {coupons.map((coupon) => {
                  const couponId = coupon.id || coupon._id || '';
                  const isCopied = copiedId === couponId;
                  const isPercentage = (coupon.type || '').toLowerCase() === 'percentage';
                  const limit = coupon.limit ?? 0;
                  const used = coupon.used ?? 0;
                  const usagePercent = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
                  const expired = isExpired(coupon.endDate);

                  // Count courses
                  const courseCount = Array.isArray(coupon.courses)
                    ? coupon.courses.length
                    : Array.isArray(coupon.courseIds)
                    ? coupon.courseIds.length
                    : 0;

                  return (
                    <tr
                      key={couponId}
                      className="hover:bg-[#faf5ff] dark:hover:bg-[#1f1b29] transition-colors"
                    >
                      {/* Code Badge with Copy button */}
                      <td className="py-3.5 px-4 font-mono font-bold">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#f3eaff] dark:bg-[#2d2242] text-[#7240b8] dark:text-[#a87ffb] border border-[#e8ddfc] dark:border-[#382e4a]">
                          <span>{coupon.code}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyCode(coupon.code, couponId)}
                            title="Sao chép mã"
                            className="p-0.5 hover:text-[#5e3299] dark:hover:text-white transition-colors cursor-pointer"
                          >
                            {isCopied ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Title */}
                      <td className="py-3.5 px-4 max-w-[200px]">
                        <p className="font-semibold text-[#1c192c] dark:text-[#f4eeff] truncate">
                          {coupon.title}
                        </p>
                      </td>

                      {/* Discount Value */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                            isPercentage
                              ? 'bg-purple-500/10 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300'
                              : 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                          }`}
                        >
                          {isPercentage ? (
                            <>
                              <Percent className="w-3 h-3" />
                              <span>{coupon.value}%</span>
                            </>
                          ) : (
                            <>
                              <DollarSign className="w-3 h-3" />
                              <span>{coupon.value.toLocaleString('vi-VN')} đ</span>
                            </>
                          )}
                        </span>
                      </td>

                      {/* Applicable Courses */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-xs text-[#635a72] dark:text-[#cdc3d4]">
                          <BookOpen className="w-3.5 h-3.5 text-[#7240b8]" />
                          <span className="font-semibold">{courseCount} khóa học</span>
                        </div>
                      </td>

                      {/* Used / Limit Progress */}
                      <td className="py-3.5 px-4 min-w-[140px]">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px]">
                            <span className="font-semibold text-[#1c192c] dark:text-[#f4eeff]">
                              {used} {limit > 0 ? `/ ${limit}` : 'lượt'}
                            </span>
                            {limit > 0 && (
                              <span className="text-[#7c7483] dark:text-[#968e9e]">
                                {usagePercent}%
                              </span>
                            )}
                          </div>
                          {limit > 0 && (
                            <div className="w-full h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  usagePercent >= 90
                                    ? 'bg-red-500'
                                    : usagePercent >= 50
                                    ? 'bg-amber-500'
                                    : 'bg-[#7240b8]'
                                }`}
                                style={{ width: `${usagePercent}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Period */}
                      <td className="py-3.5 px-4 text-[11px]">
                        <div className="space-y-0.5">
                          <p className="text-[#635a72] dark:text-[#cdc3d4]">
                            {coupon.startDate ? formatDate(coupon.startDate) : 'Từ lúc tạo'}
                          </p>
                          <p className="text-[#7c7483] dark:text-[#968e9e]">
                            Đến: {formatDate(coupon.endDate)}
                          </p>
                          {expired && (
                            <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-bold bg-red-500/10 text-red-600 dark:text-red-400">
                              Đã hết hạn
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {onToggleActive ? (
                          <button
                            type="button"
                            onClick={() => onToggleActive(coupon)}
                            className="cursor-pointer group flex items-center gap-1.5"
                            title="Nhấn để đổi trạng thái"
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${
                                coupon.active ? 'bg-emerald-500' : 'bg-gray-400'
                              }`}
                            />
                            <span
                              className={`text-[11px] font-bold ${
                                coupon.active
                                  ? 'text-emerald-700 dark:text-emerald-300'
                                  : 'text-gray-500 dark:text-gray-400'
                              }`}
                            >
                              {coupon.active ? 'Hoạt động' : 'Tạm dừng'}
                            </span>
                          </button>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                coupon.active ? 'bg-emerald-500' : 'bg-gray-400'
                              }`}
                            />
                            <span
                              className={`text-[11px] font-bold ${
                                coupon.active
                                  ? 'text-emerald-700 dark:text-emerald-300'
                                  : 'text-gray-500 dark:text-gray-400'
                              }`}
                            >
                              {coupon.active ? 'Hoạt động' : 'Tạm dừng'}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => onEditCoupon(coupon)}
                            title="Chỉnh sửa mã"
                            className="p-1.5 rounded-lg text-[#635a72] dark:text-[#cdc3d4] hover:bg-[#f3eaff] dark:hover:bg-[#282136] hover:text-[#7240b8] dark:hover:text-[#a87ffb] transition-colors cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteCoupon(coupon)}
                            title="Xóa mã"
                            className="p-1.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Server Pagination Footer */}
        {!isLoading && !isError && coupons.length > 0 && (
          <div className="p-4 border-t border-[#f1ebff] dark:border-[#2b2438] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#635a72] dark:text-[#cdc3d4]">
            <p>
              Hiển thị <span className="font-bold text-[#1c192c] dark:text-[#f4eeff]">{coupons.length}</span> trên tổng số{' '}
              <span className="font-bold text-[#1c192c] dark:text-[#f4eeff]">{pagination.total}</span> mã giảm giá
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={pagination.page <= 1}
                onClick={() => onPageChange(pagination.page - 1)}
                className="px-3 py-1.5 rounded-xl border border-[#e8ddfc] dark:border-[#382e4a] hover:bg-[#f7f1ff] dark:hover:bg-[#221c2e] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Trước</span>
              </button>

              <span className="px-2 font-semibold">
                Trang {pagination.page} / {Math.max(1, pagination.totalPages)}
              </span>

              <button
                type="button"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => onPageChange(pagination.page + 1)}
                className="px-3 py-1.5 rounded-xl border border-[#e8ddfc] dark:border-[#382e4a] hover:bg-[#f7f1ff] dark:hover:bg-[#221c2e] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-1"
              >
                <span>Sau</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
