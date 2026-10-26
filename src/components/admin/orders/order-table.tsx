'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  Receipt,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  BookOpen,
  Copy,
  Check,
  AlertCircle,
  RotateCcw,
  CreditCard,
  Ticket,
  Calendar,
} from 'lucide-react';
import { AdminOrderItem } from '@/types/admin-order';
import { formatVND, normalizeOrderStatus } from '@/services/admin-order.service';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';

interface OrderTableProps {
  orders: AdminOrderItem[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onViewDetail: (order: AdminOrderItem) => void;
  onOpenStatusModal: (order: AdminOrderItem, targetStatus: 'completed' | 'rejected') => void;
  hasFilters: boolean;
  onResetFilters: () => void;
}

export function OrderTable({
  orders,
  loading,
  error,
  onRetry,
  onViewDetail,
  onOpenStatusModal,
  hasFilters,
  onResetFilters,
}: OrderTableProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyCode = (id: string, code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!navigator?.clipboard) return;
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    toast.success(`Đã sao chép mã đơn "${code}"!`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      return new Intl.DateTimeFormat('vi-VN', {
        dateStyle: 'short',
        timeStyle: 'short',
      }).format(d);
    } catch {
      return isoString;
    }
  };

  // 1. Error State
  if (error) {
    return (
      <div className="p-8 sm:p-12 text-center rounded-2xl bg-white dark:bg-[#1d1926] border border-rose-200 dark:border-rose-900/50 shadow-xs space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7" />
        </div>
        <div className="space-y-1.5 max-w-md mx-auto">
          <h4 className="text-base sm:text-lg font-bold text-[#1c192c] dark:text-[#f4eeff]">
            Không thể tải danh sách đơn hàng
          </h4>
          <p className="text-xs sm:text-sm text-[#635a72] dark:text-[#a9a0b2]">
            {error}
          </p>
        </div>
        <button
          onClick={onRetry}
          className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-[#7240b8] text-white hover:bg-[#5d3299] shadow-xs transition-colors inline-flex items-center gap-2 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Thử lại</span>
        </button>
      </div>
    );
  }

  // 2. Loading Skeleton State
  if (loading && orders.length === 0) {
    return (
      <div className="rounded-2xl bg-white dark:bg-[#1d1926] border border-[#f1ebff] dark:border-[#2b2438] overflow-hidden shadow-xs">
        {/* Desktop skeleton */}
        <div className="hidden lg:block">
          <div className="grid grid-cols-12 gap-4 px-5 py-3.5 bg-[#fdf8ff] dark:bg-[#17141f] border-b border-[#f1ebff] dark:border-[#2b2438]">
            <div className="col-span-2 h-4 bg-[#f1ebff] dark:bg-[#2b2438] rounded-md animate-pulse" />
            <div className="col-span-3 h-4 bg-[#f1ebff] dark:bg-[#2b2438] rounded-md animate-pulse" />
            <div className="col-span-3 h-4 bg-[#f1ebff] dark:bg-[#2b2438] rounded-md animate-pulse" />
            <div className="col-span-2 h-4 bg-[#f1ebff] dark:bg-[#2b2438] rounded-md animate-pulse" />
            <div className="col-span-2 h-4 bg-[#f1ebff] dark:bg-[#2b2438] rounded-md animate-pulse" />
          </div>

          <div className="divide-y divide-[#f1ebff] dark:divide-[#2b2438]">
            {[1, 2, 3, 4, 5].map((idx) => (
              <div key={idx} className="grid grid-cols-12 gap-4 px-5 py-4 items-center">
                <div className="col-span-2 space-y-1.5">
                  <div className="h-4 w-28 bg-[#f1ebff] dark:bg-[#2b2438] rounded-md animate-pulse" />
                  <div className="h-3 w-20 bg-[#f1ebff] dark:bg-[#2b2438] rounded-md animate-pulse" />
                </div>
                <div className="col-span-3 space-y-1.5">
                  <div className="h-4 w-32 bg-[#f1ebff] dark:bg-[#2b2438] rounded-md animate-pulse" />
                  <div className="h-3 w-40 bg-[#f1ebff] dark:bg-[#2b2438] rounded-md animate-pulse" />
                </div>
                <div className="col-span-3 flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-lg bg-[#f1ebff] dark:bg-[#2b2438] animate-pulse shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-3.5 w-full bg-[#f1ebff] dark:bg-[#2b2438] rounded-md animate-pulse" />
                    <div className="h-3 w-20 bg-[#f1ebff] dark:bg-[#2b2438] rounded-md animate-pulse" />
                  </div>
                </div>
                <div className="col-span-2 space-y-1">
                  <div className="h-4 w-24 bg-[#f1ebff] dark:bg-[#2b2438] rounded-md animate-pulse" />
                  <div className="h-3 w-16 bg-[#f1ebff] dark:bg-[#2b2438] rounded-md animate-pulse" />
                </div>
                <div className="col-span-2 flex justify-end gap-1.5">
                  <div className="w-8 h-8 bg-[#f1ebff] dark:bg-[#2b2438] rounded-lg animate-pulse" />
                  <div className="w-8 h-8 bg-[#f1ebff] dark:bg-[#2b2438] rounded-lg animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile skeleton */}
        <div className="lg:hidden p-4 space-y-3">
          {[1, 2, 3].map((idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl border border-[#f1ebff] dark:border-[#2b2438] space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="h-4 w-28 bg-[#f1ebff] dark:bg-[#2b2438] rounded-md animate-pulse" />
                <div className="h-4 w-16 bg-[#f1ebff] dark:bg-[#2b2438] rounded-md animate-pulse" />
              </div>
              <div className="h-3.5 w-48 bg-[#f1ebff] dark:bg-[#2b2438] rounded-md animate-pulse" />
              <div className="h-3.5 w-32 bg-[#f1ebff] dark:bg-[#2b2438] rounded-md animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 3. Empty State
  if (orders.length === 0) {
    return (
      <div className="p-8 sm:p-14 text-center rounded-2xl bg-white dark:bg-[#1d1926] border border-[#f1ebff] dark:border-[#2b2438] shadow-xs space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-[#f7f1ff] dark:bg-[#2b2438] text-[#7240b8] dark:text-[#a87ffb] flex items-center justify-center mx-auto">
          <Receipt className="w-7 h-7" />
        </div>

        <div className="space-y-1.5 max-w-md mx-auto">
          <h4 className="text-base sm:text-lg font-bold text-[#1c192c] dark:text-[#f4eeff]">
            {hasFilters
              ? 'Không tìm thấy đơn hàng nào phù hợp'
              : 'Chưa có đơn hàng nào trên hệ thống'}
          </h4>
          <p className="text-xs sm:text-sm text-[#635a72] dark:text-[#a9a0b2]">
            {hasFilters
              ? 'Thử thay đổi từ khóa tìm kiếm (mã đơn, email, họ tên) hoặc điều chỉnh bộ lọc trạng thái.'
              : 'Các đơn hàng đăng ký khóa học của học viên sẽ tự động hiển thị tại đây.'}
          </p>
        </div>

        {hasFilters && (
          <div>
            <button
              onClick={onResetFilters}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-[#7240b8]/30 text-[#7240b8] dark:text-[#a87ffb] hover:bg-[#f7f1ff] dark:hover:bg-[#2b2438] transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Đặt lại bộ lọc</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  // 4. Data State
  return (
    <div className="rounded-2xl bg-white dark:bg-[#1d1926] border border-[#f1ebff] dark:border-[#2b2438] overflow-hidden shadow-xs">
      {/* ================= DESKTOP TABLE VIEW (>= 1024px) ================= */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#fdf8ff] dark:bg-[#17141f] border-b border-[#f1ebff] dark:border-[#2b2438] text-[11px] font-semibold text-[#635a72] dark:text-[#a9a0b2] uppercase tracking-wider">
              <th className="py-3.5 px-4">Mã đơn hàng</th>
              <th className="py-3.5 px-4">Học viên</th>
              <th className="py-3.5 px-4">Khóa học đăng ký</th>
              <th className="py-3.5 px-4">Số tiền & Chiết khấu</th>
              <th className="py-3.5 px-4">Trạng thái đơn</th>
              <th className="py-3.5 px-4">Thanh toán</th>
              <th className="py-3.5 px-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f1ebff] dark:divide-[#2b2438] text-xs">
            {orders.map((order) => {
              const orderId = order.id || order._id || '';
              const normalizedStatus = normalizeOrderStatus(order.status);
              const isPending = normalizedStatus === 'PENDING';
              const isCompleted = normalizedStatus === 'COMPLETED';
              const isRejected = normalizedStatus === 'REJECTED';
              const isCopied = copiedId === orderId;

              return (
                <tr
                  key={orderId}
                  onClick={() => onViewDetail(order)}
                  className="hover:bg-[#fcfaff] dark:hover:bg-[#231e2e] transition-colors cursor-pointer group"
                >
                  {/* Mã đơn hàng & Ngày tạo */}
                  <td className="py-3.5 px-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-xs text-[#1c192c] dark:text-[#f4eeff]">
                          {order.code}
                        </span>
                        <button
                          onClick={(e) => handleCopyCode(orderId, order.code, e)}
                          className="text-[#8e849e] hover:text-[#7240b8] dark:hover:text-[#a87ffb] transition-colors p-0.5 rounded cursor-pointer"
                          title="Sao chép mã đơn"
                        >
                          {isCopied ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
                          )}
                        </button>
                      </div>
                      <p className="text-[11px] text-[#8e849e] dark:text-[#8d8299] flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(order.createdAt)}</span>
                      </p>
                    </div>
                  </td>

                  {/* Học viên */}
                  <td className="py-3.5 px-4">
                    <div className="space-y-0.5">
                      <div className="font-semibold text-[#1c192c] dark:text-[#f4eeff]">
                        {order.user?.username || 'Học viên'}
                      </div>
                      <p className="text-[11px] text-[#8e849e] dark:text-[#8d8299] font-mono truncate max-w-[180px]">
                        {order.user?.email || 'N/A'}
                      </p>
                    </div>
                  </td>

                  {/* Khóa học đăng ký */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5 max-w-[240px]">
                      <div className="relative w-9 h-9 rounded-lg overflow-hidden bg-[#f7f1ff] dark:bg-[#2b2438] shrink-0 border border-[#f1ebff] dark:border-[#2b2438]">
                        {order.course?.image ? (
                          <Image
                            src={order.course.image}
                            alt={order.course.title || 'Course'}
                            fill
                            className="object-cover"
                            sizes="36px"
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#7240b8] dark:text-[#a87ffb]">
                            <BookOpen className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-[#1c192c] dark:text-[#f4eeff] truncate">
                          {order.course?.title || (order.courseId ? 'Khóa học #' + order.courseId : 'Khóa học')}
                        </p>
                        <p className="text-[11px] text-[#8e849e] dark:text-[#8d8299] font-mono">
                          ID: {order.courseId ? order.courseId.slice(-8) : order.course?.id ? order.course.id.slice(-8) : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Số tiền & Chiết khấu */}
                  <td className="py-3.5 px-4">
                    <div className="space-y-0.5">
                      <div className="font-bold text-[#7240b8] dark:text-[#a87ffb]">
                        {formatVND(order.total)}
                      </div>
                      {order.discount > 0 ? (
                        <div className="text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1">
                          <Ticket className="w-3 h-3" />
                          <span>- {formatVND(order.discount)}</span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-[#8e849e] dark:text-[#8d8299]">
                          Giá gốc: {formatVND(order.amount)}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Trạng thái đơn hàng */}
                  <td className="py-3.5 px-4">
                    {isCompleted && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Hoàn tất</span>
                      </span>
                    )}
                    {isPending && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                        <Clock className="w-3 h-3" />
                        <span>Chờ duyệt</span>
                      </span>
                    )}
                    {isRejected && (
                      <div className="space-y-0.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300">
                          <XCircle className="w-3 h-3" />
                          <span>Đã từ chối</span>
                        </span>
                        {order.rejectedReason && (
                          <p className="text-[10px] text-rose-600 dark:text-rose-400 truncate max-w-[130px]" title={order.rejectedReason}>
                            {order.rejectedReason}
                          </p>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Trạng thái thanh toán */}
                  <td className="py-3.5 px-4">
                    <span
                      className={cn(
                        'text-[11px] font-medium flex items-center gap-1',
                        isCompleted && 'text-emerald-700 dark:text-emerald-400',
                        isPending && 'text-amber-700 dark:text-amber-400',
                        isRejected && 'text-rose-700 dark:text-rose-400'
                      )}
                    >
                      <CreditCard className="w-3 h-3" />
                      <span>
                        {isCompleted ? 'Đã thanh toán' : isPending ? 'Chờ thanh toán' : 'Đã hủy'}
                      </span>
                    </span>
                  </td>

                  {/* Hành động */}
                  <td className="py-3.5 px-4 text-right">
                    <div
                      className="flex items-center justify-end gap-1.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => onViewDetail(order)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-[#635a72] dark:text-[#a9a0b2] hover:text-[#7240b8] dark:hover:text-[#a87ffb] hover:bg-[#f7f1ff] dark:hover:bg-[#2b2438] transition-colors cursor-pointer"
                        title="Xem chi tiết đơn"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {isPending && (
                        <>
                          <button
                            onClick={() => onOpenStatusModal(order, 'completed')}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
                            title="Xác nhận duyệt hoàn tất"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onOpenStatusModal(order, 'rejected')}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                            title="Từ chối đơn"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ================= MOBILE / TABLET CARD VIEW (< 1024px) ================= */}
      <div className="lg:hidden divide-y divide-[#f1ebff] dark:divide-[#2b2438]">
        {orders.map((order) => {
          const orderId = order.id || order._id || '';
          const normalizedStatus = normalizeOrderStatus(order.status);
          const isPending = normalizedStatus === 'PENDING';
          const isCompleted = normalizedStatus === 'COMPLETED';
          const isRejected = normalizedStatus === 'REJECTED';
          const isCopied = copiedId === orderId;

          return (
            <div
              key={orderId}
              onClick={() => onViewDetail(order)}
              className="p-4 space-y-3 hover:bg-[#fcfaff] dark:hover:bg-[#231e2e] transition-colors cursor-pointer"
            >
              {/* Row 1: Code, Status & Copy */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-xs text-[#1c192c] dark:text-[#f4eeff]">
                    {order.code}
                  </span>
                  <button
                    onClick={(e) => handleCopyCode(orderId, order.code, e)}
                    className="text-[#8e849e] hover:text-[#7240b8] dark:hover:text-[#a87ffb] transition-colors p-0.5 rounded cursor-pointer"
                  >
                    {isCopied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                <div>
                  {isCompleted && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                      <CheckCircle2 className="w-3 h-3" /> Hoàn tất
                    </span>
                  )}
                  {isPending && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                      <Clock className="w-3 h-3" /> Chờ duyệt
                    </span>
                  )}
                  {isRejected && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300">
                      <XCircle className="w-3 h-3" /> Đã từ chối
                    </span>
                  )}
                </div>
              </div>

              {/* Row 2: Course & Student */}
              <div className="flex items-center gap-3">
                <div className="relative w-11 h-11 rounded-lg overflow-hidden bg-[#f7f1ff] dark:bg-[#2b2438] shrink-0 border border-[#f1ebff] dark:border-[#2b2438]">
                  {order.course?.image ? (
                    <Image
                      src={order.course.image}
                      alt={order.course.title || 'Course'}
                      fill
                      className="object-cover"
                      sizes="44px"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#7240b8] dark:text-[#a87ffb]">
                      <BookOpen className="w-4 h-4" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-semibold text-[#1c192c] dark:text-[#f4eeff] line-clamp-1">
                    {order.course?.title || (order.courseId ? 'Khóa học #' + order.courseId : 'Khóa học')}
                  </h4>
                  <p className="text-[11px] text-[#635a72] dark:text-[#a9a0b2] truncate mt-0.5">
                    Học viên: <strong className="text-[#1c192c] dark:text-[#f4eeff]">{order.user?.username || order.user?.email || 'N/A'}</strong>
                  </p>
                </div>
              </div>

              {/* Row 3: Financial & Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-[#f1ebff] dark:border-[#2b2438]">
                <div>
                  <span className="text-[11px] text-[#8e849e] dark:text-[#8d8299]">Tổng tiền: </span>
                  <span className="text-xs font-bold text-[#7240b8] dark:text-[#a87ffb]">
                    {formatVND(order.total)}
                  </span>
                </div>

                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onViewDetail(order)}
                    className="px-2.5 py-1 text-xs font-medium rounded-lg text-[#635a72] dark:text-[#a9a0b2] hover:bg-[#f7f1ff] dark:hover:bg-[#2b2438] border border-[#f1ebff] dark:border-[#2b2438] cursor-pointer"
                  >
                    Chi tiết
                  </button>

                  {isPending && (
                    <>
                      <button
                        onClick={() => onOpenStatusModal(order, 'completed')}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
                      >
                        Duyệt
                      </button>
                      <button
                        onClick={() => onOpenStatusModal(order, 'rejected')}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-100 cursor-pointer"
                      >
                        Hủy
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
