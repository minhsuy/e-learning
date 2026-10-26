'use client';

import React, { useState } from 'react';
import {
  Search,
  Eye,
  AlertTriangle,
  RefreshCw,
  ShoppingBag,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Tag,
  Calendar,
  X,
  DollarSign,
} from 'lucide-react';
import { ApiOrderItem } from '@/types/order';

interface OrdersTableProps {
  orders: ApiOrderItem[];
  availableMonths?: string[];
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  allCourses?: { id: string; title: string }[];
  selectedCourseId: string;
  onCourseChange: (courseId: string) => void;
  monthCompletedRevenue?: number;
  monthCompletedCount?: number;
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onPageChange: (newPage: number) => void;
  onRefresh: () => void;
  onViewDetail: (order: ApiOrderItem) => void;
}

function formatVND(amount?: number): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '0 đ';
  return `${Math.round(amount).toLocaleString('vi-VN')} đ`;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

function formatMonthLabel(ym: string): string {
  if (!ym || ym === 'all') return 'Tất cả các tháng';
  const parts = ym.split('-');
  if (parts.length === 2) {
    return `Tháng ${parseInt(parts[1], 10)}/${parts[0]}`;
  }
  return ym;
}

export function OrdersTable({
  orders = [],
  availableMonths = [],
  selectedMonth,
  onMonthChange,
  allCourses = [],
  selectedCourseId,
  onCourseChange,
  monthCompletedRevenue = 0,
  monthCompletedCount = 0,
  isLoading = false,
  isError = false,
  errorMessage = '',
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  pagination,
  onPageChange,
  onRefresh,
  onViewDetail,
}: OrdersTableProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyCode = (code?: string, id?: string) => {
    const textToCopy = code || id || '';
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(id || textToCopy);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const statusTabs = [
    { label: 'Tất cả', value: 'all' },
    { label: 'Đã thanh toán', value: 'completed' },
    { label: 'Chờ thanh toán', value: 'pending' },
    { label: 'Bị từ chối', value: 'rejected' },
  ];

  const hasActiveFilters =
    selectedMonth !== 'all' ||
    selectedCourseId !== 'all' ||
    statusFilter !== 'all' ||
    searchTerm.trim().length > 0;

  const handleResetFilters = () => {
    onMonthChange('all');
    onCourseChange('all');
    onStatusFilterChange('all');
    onSearchChange('');
  };

  return (
    <div className="bg-white dark:bg-[#1d1926] rounded-2xl border border-[#eceaf3] dark:border-[#352e43] overflow-hidden shadow-xs">
      {/* Table Toolbar Container */}
      <div className="p-4 sm:p-5 border-b border-[#eceaf3] dark:border-[#352e43] space-y-3.5">
        {/* Row 1: Status Filter Tabs & Search */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            {statusTabs.map((tab) => {
              const isSelected = statusFilter === tab.value;
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => onStatusFilterChange(tab.value)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#7240b8] text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-[#252030] text-[#635a72] dark:text-[#a9a0b2] hover:bg-slate-200 dark:hover:bg-[#2c2638] hover:text-[#1c192c] dark:hover:text-[#f4eeff]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative w-full lg:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo mã đơn, tên hoặc email..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-[#252030] border border-[#eceaf3] dark:border-[#352e43] text-xs text-[#1c192c] dark:text-[#f4eeff] placeholder-slate-400 focus:outline-none focus:border-[#7240b8] focus:ring-1 focus:ring-[#7240b8] transition-all"
            />
          </div>
        </div>

        {/* Row 2: Month Filter & Course Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-[#eceaf3]/70 dark:border-[#352e43]/60">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Month Filter Selector */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#eceaf3] dark:border-[#352e43] bg-slate-50/70 dark:bg-[#252030] text-xs text-[#1c192c] dark:text-[#f4eeff]">
              <Calendar className="w-3.5 h-3.5 text-[#7240b8] dark:text-[#a87ffb] shrink-0" />
              <span className="text-[#635a72] dark:text-[#a9a0b2] shrink-0">Tháng:</span>
              <select
                value={selectedMonth}
                onChange={(e) => onMonthChange(e.target.value)}
                className="bg-transparent font-semibold focus:outline-none cursor-pointer text-xs"
              >
                <option value="all">Tất cả các tháng</option>
                {availableMonths.map((ym) => (
                  <option key={ym} value={ym} className="dark:bg-[#1d1926]">
                    {formatMonthLabel(ym)}
                  </option>
                ))}
              </select>
            </div>

            {/* Course Filter Selector */}
            {allCourses.length > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#eceaf3] dark:border-[#352e43] bg-slate-50/70 dark:bg-[#252030] text-xs text-[#1c192c] dark:text-[#f4eeff]">
                <BookOpen className="w-3.5 h-3.5 text-[#7240b8] dark:text-[#a87ffb] shrink-0" />
                <span className="text-[#635a72] dark:text-[#a9a0b2] shrink-0">Khóa học:</span>
                <select
                  value={selectedCourseId}
                  onChange={(e) => onCourseChange(e.target.value)}
                  className="bg-transparent font-semibold focus:outline-none cursor-pointer text-xs max-w-[200px] sm:max-w-[240px] truncate"
                >
                  <option value="all">Tất cả khóa học</option>
                  {allCourses.map((c) => (
                    <option key={c.id} value={c.id} className="dark:bg-[#1d1926]">
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Reset Filters CTA if any active */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-[#7240b8] dark:hover:text-[#a87ffb] transition-colors self-start sm:self-auto cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Xóa bộ lọc</span>
            </button>
          )}
        </div>

        {/* Row 3: Month Revenue Highlight Banner (when a specific month is selected) */}
        {selectedMonth !== 'all' && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-gradient-to-r from-violet-50 to-emerald-50/60 dark:from-violet-950/30 dark:to-emerald-950/20 border border-violet-200/80 dark:border-violet-900/40 text-xs text-[#1c192c] dark:text-[#f4eeff]">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <span>Đang xem: <strong className="font-bold text-[#7240b8] dark:text-[#a87ffb]">{formatMonthLabel(selectedMonth)}</strong></span>
                <span className="text-slate-400 dark:text-slate-600 mx-2">•</span>
                <span>Doanh thu đơn đã duyệt (hoàn tất): <strong className="text-emerald-600 dark:text-emerald-400 font-extrabold text-sm">{formatVND(monthCompletedRevenue)}</strong> ({monthCompletedCount} đơn)</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onMonthChange('all')}
              className="text-[11px] font-semibold text-[#7240b8] dark:text-[#a87ffb] hover:underline self-start sm:self-auto cursor-pointer"
            >
              Xem tất cả các tháng
            </button>
          </div>
        )}
      </div>

      {/* Main Table Content */}
      {isError ? (
        <div className="p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 flex items-center justify-center mx-auto text-rose-600 dark:text-rose-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-[#1c192c] dark:text-[#f4eeff]">
            Lỗi tải danh sách đơn hàng
          </h3>
          <p className="text-xs text-[#635a72] dark:text-[#a9a0b2] max-w-sm mx-auto">
            {errorMessage || 'Đã có sự cố khi kết nối tới hệ thống đơn hàng.'}
          </p>
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#7240b8] hover:bg-[#60359d] text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Thử lại</span>
          </button>
        </div>
      ) : isLoading ? (
        <div className="p-6 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-16 rounded-xl bg-slate-50 dark:bg-[#252030] animate-pulse flex items-center px-4 justify-between"
            >
              <div className="w-1/4 h-4 bg-slate-200 dark:bg-slate-700 rounded" />
              <div className="w-1/4 h-4 bg-slate-200 dark:bg-slate-700 rounded" />
              <div className="w-1/6 h-4 bg-slate-200 dark:bg-slate-700 rounded" />
              <div className="w-1/8 h-4 bg-slate-200 dark:bg-slate-700 rounded" />
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="p-16 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-[#252030] flex items-center justify-center mx-auto text-slate-400">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-[#1c192c] dark:text-[#f4eeff]">
            Không tìm thấy đơn hàng nào
          </h3>
          <p className="text-xs text-[#635a72] dark:text-[#a9a0b2] max-w-sm mx-auto">
            {hasActiveFilters
              ? 'Không có đơn hàng nào khớp với điều kiện tìm kiếm, tháng hoặc khóa học đã chọn.'
              : 'Hiện tại chưa có học viên nào đặt mua các khóa học của bạn.'}
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-3.5 py-1.5 rounded-xl border border-[#eceaf3] dark:border-[#352e43] text-xs font-semibold text-[#7240b8] dark:text-[#a87ffb] hover:bg-[#f7f1ff] dark:hover:bg-[#252030] transition-colors cursor-pointer"
            >
              Đặt lại tất cả bộ lọc
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#fbf9fe] dark:bg-[#252030] text-[#635a72] dark:text-[#a9a0b2] border-b border-[#eceaf3] dark:border-[#352e43]">
              <tr>
                <th className="py-3 px-4 font-semibold">Mã đơn hàng</th>
                <th className="py-3 px-4 font-semibold min-w-[220px]">Khóa học</th>
                <th className="py-3 px-4 font-semibold">Người mua</th>
                <th className="py-3 px-4 font-semibold text-right">Giảm giá</th>
                <th className="py-3 px-4 font-semibold text-right">Tổng thanh toán</th>
                <th className="py-3 px-4 font-semibold">Thời gian</th>
                <th className="py-3 px-4 font-semibold text-center">Trạng thái</th>
                <th className="py-3 px-4 font-semibold text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eceaf3] dark:divide-[#352e43]">
              {orders.map((order) => {
                const orderId = order.id || order._id || '';
                const code = order.code || (orderId ? orderId.substring(0, 8).toUpperCase() : '—');
                const course = order.course;
                const user = order.user;
                const statusNormalized = (order.status || '').toUpperCase();

                // Status styling
                let statusBadge = (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/40">
                    Chờ xử lý
                  </span>
                );

                if (statusNormalized === 'COMPLETED') {
                  statusBadge = (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/40">
                      Đã thanh toán
                    </span>
                  );
                } else if (statusNormalized === 'REJECTED' || statusNormalized === 'CANCELLED') {
                  statusBadge = (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/40">
                      Đã từ chối
                    </span>
                  );
                }

                return (
                  <tr
                    key={orderId}
                    className="hover:bg-violet-50/20 dark:hover:bg-[#252030]/50 transition-colors"
                  >
                    {/* Order Code */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-[#1c192c] dark:text-[#f4eeff]">
                          {code}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyCode(order.code, orderId)}
                          className="p-1 rounded text-slate-400 hover:text-[#7240b8] transition-colors cursor-pointer"
                          title="Sao chép mã đơn"
                        >
                          {copiedId === orderId || copiedId === order.code ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Course */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-7 rounded-md bg-[#f7f1ff] dark:bg-[#282234] border border-[#eceaf3] dark:border-[#3d364b] overflow-hidden shrink-0">
                          {course?.image ? (
                            <img
                              src={course.image}
                              alt={course.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                              <BookOpen className="w-3.5 h-3.5 text-[#7240b8]" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-[#1c192c] dark:text-[#f4eeff] line-clamp-1">
                            {course?.title || 'Khóa học không xác định'}
                          </p>
                          <span className="text-[10px] text-[#635a72] dark:text-[#a9a0b2]">
                            Giá gốc: {formatVND(course?.price || order.amount)}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Buyer User */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-medium text-[#1c192c] dark:text-[#f4eeff]">
                        {user?.username || 'Học viên'}
                      </div>
                      <div className="text-[11px] text-[#635a72] dark:text-[#a9a0b2]">
                        {user?.email || '—'}
                      </div>
                    </td>

                    {/* Discount */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      {order.discount > 0 ? (
                        <div>
                          <span className="font-semibold text-rose-600 dark:text-rose-400">
                            -{formatVND(order.discount)}
                          </span>
                          {order.coupon?.code && (
                            <div className="flex items-center justify-end gap-0.5 text-[10px] text-slate-400">
                              <Tag className="w-2.5 h-2.5" />
                              <span>{order.coupon.code}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    {/* Total Amount */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <span className="font-bold text-sm text-[#7240b8] dark:text-[#a87ffb]">
                        {formatVND(order.total)}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="py-3 px-4 whitespace-nowrap text-[#635a72] dark:text-[#a9a0b2]">
                      {formatDate(order.createdAt)}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {statusBadge}
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onViewDetail(order)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#eceaf3] dark:border-[#352e43] bg-white dark:bg-[#252030] text-[#1c192c] dark:text-[#f4eeff] hover:bg-[#f7f1ff] dark:hover:bg-[#2c2638] hover:text-[#7240b8] dark:hover:text-[#a87ffb] text-xs font-semibold transition-colors cursor-pointer"
                        title="Xem chi tiết đơn hàng"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Chi tiết</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Controls */}
      {pagination && pagination.totalPages > 1 && (
        <div className="p-4 border-t border-[#eceaf3] dark:border-[#352e43] flex items-center justify-between text-xs text-[#635a72] dark:text-[#a9a0b2]">
          <div>
            Hiển thị trang <strong className="text-[#1c192c] dark:text-[#f4eeff]">{pagination.page}</strong> / {pagination.totalPages} (Tổng {pagination.total} đơn)
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={pagination.page <= 1 || isLoading}
              onClick={() => onPageChange(pagination.page - 1)}
              className="p-1.5 rounded-lg border border-[#eceaf3] dark:border-[#352e43] hover:bg-[#f7f1ff] dark:hover:bg-[#252030] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              title="Trang trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-2 font-semibold text-[#1c192c] dark:text-[#f4eeff]">
              {pagination.page}
            </span>

            <button
              type="button"
              disabled={pagination.page >= pagination.totalPages || isLoading}
              onClick={() => onPageChange(pagination.page + 1)}
              className="p-1.5 rounded-lg border border-[#eceaf3] dark:border-[#352e43] hover:bg-[#f7f1ff] dark:hover:bg-[#252030] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              title="Trang sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
