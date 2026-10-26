'use client';

import React, { useEffect } from 'react';
import Image from 'next/image';
import {
  X,
  Receipt,
  User,
  BookOpen,
  Ticket,
  Calendar,
  CreditCard,
  CheckCircle2,
  Clock,
  XCircle,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';
import { AdminOrderItem } from '@/types/admin-order';
import { formatVND, normalizeOrderStatus } from '@/services/admin-order.service';
import { cn } from '@/lib/utils';

interface OrderDetailModalProps {
  order: AdminOrderItem | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenStatusModal?: (order: AdminOrderItem, targetStatus: 'completed' | 'rejected') => void;
}

export function OrderDetailModal({
  order,
  isOpen,
  onClose,
  onOpenStatusModal,
}: OrderDetailModalProps) {
  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !order) return null;

  const normalizedStatus = normalizeOrderStatus(order.status);
  const isPending = normalizedStatus === 'PENDING';
  const isCompleted = normalizedStatus === 'COMPLETED';
  const isRejected = normalizedStatus === 'REJECTED';

  const formatDate = (isoString?: string) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      return new Intl.DateTimeFormat('vi-VN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(d);
    } catch {
      return isoString;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-detail-modal-title"
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-[#1d1926] rounded-2xl border border-[#f1ebff] dark:border-[#2b2438] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#f1ebff] dark:border-[#2b2438] bg-[#fdf8ff] dark:bg-[#17141f]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#f7f1ff] dark:bg-[#2b2438] text-[#7240b8] dark:text-[#a87ffb] flex items-center justify-center shadow-xs">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3
                  id="order-detail-modal-title"
                  className="text-base font-bold text-[#1c192c] dark:text-[#f4eeff]"
                >
                  Chi tiết đơn hàng {order.code}
                </h3>
                {isCompleted && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                    <CheckCircle2 className="w-3 h-3" /> Hoàn tất
                  </span>
                )}
                {isPending && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                    <Clock className="w-3 h-3" /> Chờ xử lý
                  </span>
                )}
                {isRejected && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300">
                    <XCircle className="w-3 h-3" /> Đã từ chối
                  </span>
                )}
              </div>
              <p className="text-xs text-[#635a72] dark:text-[#a9a0b2]">
                ID: <span className="font-mono">{order.id || order._id}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8e849e] hover:text-[#1c192c] dark:hover:text-[#f4eeff] hover:bg-[#f1ebff] dark:hover:bg-[#2b2438] transition-colors cursor-pointer"
            title="Đóng modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs text-[#635a72] dark:text-[#a9a0b2]">
          {/* Grid: Customer & Payment Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Customer Box */}
            <div className="p-4 rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1c192c] dark:text-[#f4eeff] mb-2 pb-1.5 border-b border-[#f1ebff] dark:border-[#2b2438]">
                <User className="w-3.5 h-3.5 text-[#7240b8] dark:text-[#a87ffb]" />
                <span>Thông tin khách hàng</span>
              </div>
              <div className="space-y-1.5">
                <div>
                  <span className="text-[#8e849e] dark:text-[#8d8299]">Họ tên / Username:</span>{' '}
                  <strong className="text-[#1c192c] dark:text-[#f4eeff]">
                    {order.user?.username || 'Chưa cập nhật'}
                  </strong>
                </div>
                <div>
                  <span className="text-[#8e849e] dark:text-[#8d8299]">Email:</span>{' '}
                  <span className="font-mono text-[#1c192c] dark:text-[#f4eeff]">
                    {order.user?.email || 'N/A'}
                  </span>
                </div>
                {order.user?.phone && (
                  <div>
                    <span className="text-[#8e849e] dark:text-[#8d8299]">Số điện thoại:</span>{' '}
                    <span className="text-[#1c192c] dark:text-[#f4eeff]">{order.user.phone}</span>
                  </div>
                )}
                <div>
                  <span className="text-[#8e849e] dark:text-[#8d8299]">Mã học viên (ID):</span>{' '}
                  <span className="font-mono text-[11px] text-[#635a72] dark:text-[#a9a0b2]">
                    {order.userId || order.user?.id || order.user?._id || 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment & Order Status Box */}
            <div className="p-4 rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1c192c] dark:text-[#f4eeff] mb-2 pb-1.5 border-b border-[#f1ebff] dark:border-[#2b2438]">
                <CreditCard className="w-3.5 h-3.5 text-[#7240b8] dark:text-[#a87ffb]" />
                <span>Đối soát thanh toán</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[#8e849e] dark:text-[#8d8299]">Trạng thái đơn:</span>
                  <span className="font-semibold text-[#1c192c] dark:text-[#f4eeff]">
                    {normalizedStatus}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#8e849e] dark:text-[#8d8299]">Thanh toán:</span>
                  <span
                    className={cn(
                      'font-semibold px-2 py-0.5 rounded-full text-[11px]',
                      isCompleted && 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300',
                      isPending && 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300',
                      isRejected && 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                    )}
                  >
                    {isCompleted ? 'Đã thu tiền (Paid)' : isPending ? 'Chờ thanh toán (Pending)' : 'Đã hủy'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#8e849e] dark:text-[#8d8299]">Ghi danh (Enrollment):</span>
                  <span className="text-[#1c192c] dark:text-[#f4eeff]">
                    {isCompleted ? 'Đã kích hoạt khóa học' : 'Chưa kích hoạt'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Rejection Details Box if rejected */}
          {isRejected && (order.rejectedReason || order.rejectedAt) && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-xs text-rose-800 dark:text-rose-300 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-rose-700 dark:text-rose-400">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Thông tin từ chối đơn hàng:</span>
              </div>
              {order.rejectedReason && (
                <p className="leading-relaxed pl-5">
                  Lý do: <span className="font-medium text-[#1c192c] dark:text-[#f4eeff]">{order.rejectedReason}</span>
                </p>
              )}
              {order.rejectedAt && (
                <p className="text-[11px] text-[#8e849e] dark:text-[#8d8299] pl-5">
                  Thời gian từ chối: {formatDate(order.rejectedAt)}
                </p>
              )}
            </div>
          )}

          {/* Course Details Box */}
          <div className="p-4 rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#f1ebff] dark:border-[#2b2438]">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1c192c] dark:text-[#f4eeff]">
                <BookOpen className="w-3.5 h-3.5 text-[#7240b8] dark:text-[#a87ffb]" />
                <span>Khóa học trong đơn hàng</span>
              </div>
              <span className="text-[11px] text-[#8e849e] dark:text-[#8d8299]">
                1 sản phẩm
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-[#f1ebff] dark:bg-[#2b2438] shrink-0 border border-[#f1ebff] dark:border-[#2b2438]">
                {order.course?.image ? (
                  <Image
                    src={order.course.image}
                    alt={order.course.title || 'Course thumbnail'}
                    fill
                    className="object-cover"
                    sizes="64px"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#7240b8] dark:text-[#a87ffb]">
                    <BookOpen className="w-6 h-6" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-[#1c192c] dark:text-[#f4eeff] line-clamp-1">
                  {order.course?.title || (order.courseId ? 'Khóa học #' + order.courseId : 'Khóa học')}
                </h4>
                <p className="text-[11px] text-[#8e849e] dark:text-[#8d8299] line-clamp-1 mt-0.5">
                  Mã khóa học: <span className="font-mono">{order.courseId || order.course?.id || 'N/A'}</span>
                </p>
                {order.course?.slug && (
                  <a
                    href={`/courses/${order.course.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-[#7240b8] dark:text-[#a87ffb] hover:underline mt-1"
                  >
                    <span>Xem trang khóa học</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              <div className="text-right shrink-0">
                <span className="text-sm font-bold text-[#1c192c] dark:text-[#f4eeff]">
                  {formatVND(order.amount)}
                </span>
              </div>
            </div>
          </div>

          {/* Coupon Info Box if applied */}
          {order.coupon && (
            <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/40 flex items-center justify-between text-xs text-purple-900 dark:text-purple-300">
              <div className="flex items-center gap-2">
                <Ticket className="w-4 h-4 text-[#7240b8] dark:text-[#a87ffb]" />
                <div>
                  <span className="font-semibold">Mã giảm giá áp dụng: </span>
                  <span className="font-mono font-bold px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/60 text-[#7240b8] dark:text-[#a87ffb]">
                    {order.coupon.code}
                  </span>
                </div>
              </div>
              <div className="font-semibold text-rose-600 dark:text-rose-400">
                - {formatVND(order.discount)}
              </div>
            </div>
          )}

          {/* Financial Breakdown */}
          <div className="p-4 rounded-xl bg-white dark:bg-[#1d1926] border border-[#f1ebff] dark:border-[#2b2438] space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#8e849e] dark:text-[#8d8299]">Giá gốc khóa học:</span>
              <span className="text-[#1c192c] dark:text-[#f4eeff] font-medium">
                {formatVND(order.amount)}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#8e849e] dark:text-[#8d8299]">Chiết khấu coupon:</span>
              <span className="text-rose-600 dark:text-rose-400 font-medium">
                - {formatVND(order.discount)}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm pt-2 border-t border-[#f1ebff] dark:border-[#2b2438]">
              <span className="font-bold text-[#1c192c] dark:text-[#f4eeff]">
                Tổng thanh toán thực thu:
              </span>
              <span className="font-bold text-[#7240b8] dark:text-[#a87ffb] text-base">
                {formatVND(order.total)}
              </span>
            </div>
          </div>

          {/* Timestamps & Audit Trail */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#8e849e] dark:text-[#8d8299] pt-2 border-t border-[#f1ebff] dark:border-[#2b2438]">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>Ngày tạo: {formatDate(order.createdAt)}</span>
            </div>
            {order.updatedAt && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Cập nhật: {formatDate(order.updatedAt)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between gap-3 p-5 border-t border-[#f1ebff] dark:border-[#2b2438] bg-[#fdf8ff] dark:bg-[#17141f]">
          <div className="flex items-center gap-2">
            {isPending && onOpenStatusModal && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenStatusModal(order, 'completed');
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Duyệt đơn</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenStatusModal(order, 'rejected');
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:hover:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 transition-colors cursor-pointer"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Từ chối</span>
                </button>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl text-[#635a72] dark:text-[#a9a0b2] hover:bg-[#f1ebff] dark:hover:bg-[#2b2438] transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
