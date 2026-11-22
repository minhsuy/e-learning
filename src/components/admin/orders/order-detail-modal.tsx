'use client';

import React, { useEffect, useState } from 'react';
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
  ShieldCheck,
  Loader2,
  RotateCcw,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';
import { canManageManualOrder, orderPaymentMethodLabel } from '@/lib/order-actions';
import { AdminOrderDetailData, AdminOrderItem } from '@/types/admin-order';
import {
  adminOrderService,
  formatVND,
  normalizeOrderApiError,
  normalizeOrderStatus,
} from '@/services/admin-order.service';
import { cn } from '@/lib/utils';

interface OrderDetailModalProps {
  order: AdminOrderItem | null;
  orderId?: string | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenStatusModal?: (order: AdminOrderItem, targetStatus: 'completed' | 'rejected') => void;
}

function getTransactionStatusBadge(status: string): { label: string; className: string } {
  const upper = status?.toUpperCase() || '';
  switch (upper) {
    case 'SUCCESS':
      return {
        label: 'Thành công (SUCCESS)',
        className: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300',
      };
    case 'PENDING_MANUAL_REVIEW':
      return {
        label: 'Cần rà soát thủ công',
        className: 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300',
      };
    case 'FAILED':
      return {
        label: 'Thất bại (FAILED)',
        className: 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300',
      };
    case 'IGNORED':
      return {
        label: 'Bỏ qua (IGNORED)',
        className: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
      };
    default:
      return {
        label: status || 'Không rõ',
        className: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
      };
  }
}

export function OrderDetailModal({
  order,
  orderId,
  isOpen,
  onClose,
  onOpenStatusModal,
}: OrderDetailModalProps) {
  const targetOrderId = order?.id || order?._id || orderId || null;

  const [detailData, setDetailData] = useState<AdminOrderDetailData | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

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

  // Fetch read-only GET /api/orders/:id for authoritative paymentSummary & sanitized transactions
  useEffect(() => {
    if (!isOpen || !targetOrderId) {
      return;
    }

    let isMounted = true;
    const controller = new AbortController();

    const loadOrderDetail = async () => {
      await Promise.resolve();
      if (!isMounted) return;
      setDetailLoading(true);
      setDetailError(null);
      try {
        const res = await adminOrderService.getOrderDetail(targetOrderId, {
          signal: controller.signal,
        });
        if (!isMounted) return;
        if (res.success && res.data) {
          setDetailData(res.data);
        } else {
          setDetailError(res.message || 'Không thể tải chi tiết thanh toán đơn hàng.');
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        if (err instanceof Error && err.name === 'AbortError') return;
        setDetailError(
          normalizeOrderApiError(err, 'Không thể tải chi tiết giao dịch từ máy chủ.')
        );
      } finally {
        if (isMounted) {
          setDetailLoading(false);
        }
      }
    };

    void loadOrderDetail();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [isOpen, targetOrderId, retryCount]);

  if (!isOpen || (!order && !targetOrderId)) return null;

  const matchedDetail =
    detailData &&
    targetOrderId &&
    (detailData.order.id === targetOrderId || detailData.order._id === targetOrderId)
      ? detailData
      : null;

  const resolvedOrder = matchedDetail?.order ?? order;
  const paymentSummary = matchedDetail?.paymentSummary ?? null;
  const transactions = matchedDetail?.transactions ?? [];

  const formatDate = (isoString?: string | null) => {
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

  const normalizedStatus = resolvedOrder ? normalizeOrderStatus(resolvedOrder.status) : 'PENDING';
  const isPending = normalizedStatus === 'PENDING';
  const isCompleted = normalizedStatus === 'COMPLETED';
  const isRejected = normalizedStatus === 'REJECTED';

  const paymentMethod = paymentSummary?.paymentMethod ?? resolvedOrder?.paymentMethod ?? null;
  const paymentCode = paymentSummary?.paymentCode ?? resolvedOrder?.paymentCode ?? null;
  const paidAt = paymentSummary?.paidAt ?? resolvedOrder?.paidAt ?? null;
  const expiresAt = paymentSummary?.expiresAt ?? resolvedOrder?.expiresAt ?? null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-detail-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-[#1d1926] rounded-2xl border border-[#f1ebff] dark:border-[#2b2438] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#f1ebff] dark:border-[#2b2438] bg-[#fdf8ff] dark:bg-[#17141f]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#f7f1ff] dark:bg-[#2b2438] text-[#7240b8] dark:text-[#a87ffb] flex items-center justify-center shadow-xs shrink-0">
              <Receipt className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3
                  id="order-detail-modal-title"
                  className="text-base font-bold text-[#1c192c] dark:text-[#f4eeff] truncate"
                >
                  Chi tiết đơn hàng {resolvedOrder?.code || ''}
                </h3>
                {resolvedOrder && isCompleted && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                    <CheckCircle2 className="w-3 h-3" /> Hoàn tất
                  </span>
                )}
                {resolvedOrder && isPending && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                    <Clock className="w-3 h-3" /> Chờ xử lý
                  </span>
                )}
                {resolvedOrder && isRejected && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300">
                    <XCircle className="w-3 h-3" /> Đã từ chối
                  </span>
                )}
              </div>
              <p className="text-xs text-[#635a72] dark:text-[#a9a0b2] truncate">
                ID: <span className="font-mono">{targetOrderId}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8e849e] hover:text-[#1c192c] dark:hover:text-[#f4eeff] hover:bg-[#f1ebff] dark:hover:bg-[#2b2438] transition-colors cursor-pointer shrink-0"
            title="Đóng modal"
            aria-label="Đóng chi tiết đơn hàng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs text-[#635a72] dark:text-[#a9a0b2]">
          {!resolvedOrder && detailLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-[#7240b8] dark:text-[#a87ffb]" />
              <p className="text-xs text-[#635a72] dark:text-[#a9a0b2]">
                Đang tải chi tiết đơn hàng từ máy chủ...
              </p>
            </div>
          ) : !resolvedOrder && detailError ? (
            <div className="p-6 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-center space-y-3">
              <AlertTriangle className="w-6 h-6 text-rose-600 dark:text-rose-400 mx-auto" />
              <p className="text-xs font-medium text-rose-800 dark:text-rose-300">{detailError}</p>
              <button
                type="button"
                onClick={() => setRetryCount((c) => c + 1)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#7240b8] text-white hover:bg-[#5e3299] cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Thử lại</span>
              </button>
            </div>
          ) : resolvedOrder ? (
            <>
              {/* Grid: Customer & Payment Summary */}
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
                        {resolvedOrder.user?.username || 'Chưa cập nhật'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[#8e849e] dark:text-[#8d8299]">Email:</span>{' '}
                      <span className="font-mono text-[#1c192c] dark:text-[#f4eeff]">
                        {resolvedOrder.user?.email || 'N/A'}
                      </span>
                    </div>
                    {resolvedOrder.user?.phone && (
                      <div>
                        <span className="text-[#8e849e] dark:text-[#8d8299]">Số điện thoại:</span>{' '}
                        <span className="text-[#1c192c] dark:text-[#f4eeff]">{resolvedOrder.user.phone}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-[#8e849e] dark:text-[#8d8299]">Mã học viên (ID):</span>{' '}
                      <span className="font-mono text-[11px] text-[#635a72] dark:text-[#a9a0b2] break-all">
                        {resolvedOrder.userId || resolvedOrder.user?.id || resolvedOrder.user?._id || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payment & Order Status Box */}
                <div className="p-4 rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1c192c] dark:text-[#f4eeff] mb-2 pb-1.5 border-b border-[#f1ebff] dark:border-[#2b2438]">
                    <CreditCard className="w-3.5 h-3.5 text-[#7240b8] dark:text-[#a87ffb]" />
                    <span>Tóm tắt thanh toán</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[#8e849e] dark:text-[#8d8299]">Trạng thái đơn:</span>
                      <span className="font-semibold text-[#1c192c] dark:text-[#f4eeff]">
                        {normalizedStatus}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[#8e849e] dark:text-[#8d8299]">Phương thức:</span>
                      <span
                        className={cn(
                          'font-semibold px-2 py-0.5 rounded-full text-[11px]',
                          isCompleted && 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300',
                          isPending && 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300',
                          isRejected && 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                        )}
                      >
                        {orderPaymentMethodLabel(paymentMethod)}
                      </span>
                    </div>
                    {paymentCode && (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[#8e849e] dark:text-[#8d8299]">Mã thanh toán:</span>
                        <span className="font-mono font-bold text-[#7240b8] dark:text-[#a87ffb]">
                          {paymentCode}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[#8e849e] dark:text-[#8d8299]">Thanh toán lúc:</span>
                      <span className="text-[#1c192c] dark:text-[#f4eeff]">{formatDate(paidAt)}</span>
                    </div>
                    {expiresAt && (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[#8e849e] dark:text-[#8d8299]">Hạn thanh toán:</span>
                        <span className="text-[#1c192c] dark:text-[#f4eeff]">{formatDate(expiresAt)}</span>
                      </div>
                    )}
                    {paymentSummary && (
                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#f1ebff] dark:border-[#2b2438]">
                        <span className="text-[#8e849e] dark:text-[#8d8299]">
                          Tổng tiền giao dịch ({paymentSummary.transactionCount}):
                        </span>
                        <span className="font-semibold text-[#1c192c] dark:text-[#f4eeff]">
                          {formatVND(paymentSummary.totalTransferred)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Rejection Details Box if rejected */}
              {isRejected && (resolvedOrder.rejectedReason || resolvedOrder.rejectedAt) && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-xs text-rose-800 dark:text-rose-300 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-rose-700 dark:text-rose-400">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Thông tin từ chối đơn hàng:</span>
                  </div>
                  {resolvedOrder.rejectedReason && (
                    <p className="leading-relaxed pl-5">
                      Lý do:{' '}
                      <span className="font-medium text-[#1c192c] dark:text-[#f4eeff]">
                        {resolvedOrder.rejectedReason}
                      </span>
                    </p>
                  )}
                  {resolvedOrder.rejectedAt && (
                    <p className="text-[11px] text-[#8e849e] dark:text-[#8d8299] pl-5">
                      Thời gian từ chối: {formatDate(resolvedOrder.rejectedAt)}
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
                    {resolvedOrder.course ? '1 sản phẩm' : 'Đơn hàng mồ côi'}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-[#f1ebff] dark:bg-[#2b2438] shrink-0 border border-[#f1ebff] dark:border-[#2b2438]">
                    {resolvedOrder.course?.image ? (
                      <Image
                        src={resolvedOrder.course.image}
                        alt={resolvedOrder.course.title || 'Course thumbnail'}
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
                      {resolvedOrder.course?.title ||
                        (resolvedOrder.courseId
                          ? 'Khóa học #' + resolvedOrder.courseId
                          : '(Đơn hàng không gắn khóa học)')}
                    </h4>
                    <p className="text-[11px] text-[#8e849e] dark:text-[#8d8299] line-clamp-1 mt-0.5">
                      Mã khóa học:{' '}
                      <span className="font-mono">
                        {resolvedOrder.courseId || resolvedOrder.course?.id || 'N/A'}
                      </span>
                    </p>
                    {resolvedOrder.course?.slug && (
                      <a
                        href={`/courses/${resolvedOrder.course.slug}`}
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
                      {formatVND(resolvedOrder.amount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Coupon Info Box if applied */}
              {resolvedOrder.coupon && (
                <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/40 flex items-center justify-between text-xs text-purple-900 dark:text-purple-300">
                  <div className="flex items-center gap-2">
                    <Ticket className="w-4 h-4 text-[#7240b8] dark:text-[#a87ffb]" />
                    <div>
                      <span className="font-semibold">Mã giảm giá áp dụng: </span>
                      <span className="font-mono font-bold px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/60 text-[#7240b8] dark:text-[#a87ffb]">
                        {resolvedOrder.coupon.code}
                      </span>
                    </div>
                  </div>
                  <div className="font-semibold text-rose-600 dark:text-rose-400">
                    - {formatVND(resolvedOrder.discount)}
                  </div>
                </div>
              )}

              {/* Financial Breakdown */}
              <div className="p-4 rounded-xl bg-white dark:bg-[#1d1926] border border-[#f1ebff] dark:border-[#2b2438] space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#8e849e] dark:text-[#8d8299]">Giá gốc khóa học:</span>
                  <span className="text-[#1c192c] dark:text-[#f4eeff] font-medium">
                    {formatVND(resolvedOrder.amount)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#8e849e] dark:text-[#8d8299]">Chiết khấu coupon:</span>
                  <span className="text-rose-600 dark:text-rose-400 font-medium">
                    - {formatVND(resolvedOrder.discount)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm pt-2 border-t border-[#f1ebff] dark:border-[#2b2438]">
                  <span className="font-bold text-[#1c192c] dark:text-[#f4eeff]">
                    Tổng giá trị đơn hàng:
                  </span>
                  <span className="font-bold text-[#7240b8] dark:text-[#a87ffb] text-base">
                    {formatVND(resolvedOrder.total)}
                  </span>
                </div>
              </div>

              {/* Sanitized Payment Transaction History (STEP 08.2 — GET /api/orders/:id) */}
              <div className="p-4 rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] space-y-3">
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#f1ebff] dark:border-[#2b2438]">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1c192c] dark:text-[#f4eeff]">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#7240b8] dark:text-[#a87ffb]" />
                    <span>Lịch sử giao dịch thanh toán (Đã lọc an toàn)</span>
                  </div>
                  {detailLoading && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-[#7240b8] dark:text-[#a87ffb]">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Đang đồng bộ...
                    </span>
                  )}
                </div>

                {detailError ? (
                  <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300">
                    <span>{detailError}</span>
                    <button
                      type="button"
                      onClick={() => setRetryCount((c) => c + 1)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white dark:bg-[#1d1926] text-[11px] font-semibold border border-rose-200 dark:border-rose-800 hover:bg-rose-50 cursor-pointer shrink-0"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Thử lại
                    </button>
                  </div>
                ) : transactions.length === 0 ? (
                  <p className="text-[11px] text-[#8e849e] dark:text-[#8d8299] py-2">
                    {detailLoading
                      ? 'Đang tải danh sách giao dịch...'
                      : 'Chưa ghi nhận giao dịch thanh toán tự động (PaymentTransaction) nào cho đơn hàng này.'}
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {transactions.map((tx) => {
                      const badge = getTransactionStatusBadge(tx.status);
                      const isIncoming = tx.transferType?.toLowerCase() === 'in';
                      return (
                        <div
                          key={tx.id}
                          className="p-3 rounded-xl bg-white dark:bg-[#1d1926] border border-[#f1ebff] dark:border-[#2b2438] space-y-2"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span
                                className={cn(
                                  'w-6 h-6 rounded-lg flex items-center justify-center',
                                  isIncoming
                                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                                    : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
                                )}
                              >
                                {isIncoming ? (
                                  <ArrowDownLeft className="w-3.5 h-3.5" />
                                ) : (
                                  <ArrowUpRight className="w-3.5 h-3.5" />
                                )}
                              </span>
                              <div>
                                <span className="font-semibold text-[#1c192c] dark:text-[#f4eeff] uppercase">
                                  {tx.provider}
                                </span>
                                {tx.gateway && (
                                  <span className="text-[#8e849e] dark:text-[#8d8299]">
                                    {' '}
                                    • {tx.gateway}
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full', badge.className)}>
                              {badge.label}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
                            <div>
                              <span className="text-[#8e849e] dark:text-[#8d8299]">Số tiền giao dịch:</span>{' '}
                              <strong className="text-[#1c192c] dark:text-[#f4eeff]">
                                {formatVND(tx.transferAmount)}
                              </strong>
                            </div>
                            <div>
                              <span className="text-[#8e849e] dark:text-[#8d8299]">Thời điểm giao dịch:</span>{' '}
                              <span className="text-[#1c192c] dark:text-[#f4eeff]">
                                {formatDate(tx.transactionDate || tx.createdAt)}
                              </span>
                            </div>
                            {tx.paymentCode && (
                              <div>
                                <span className="text-[#8e849e] dark:text-[#8d8299]">Mã đối soát:</span>{' '}
                                <span className="font-mono text-[#1c192c] dark:text-[#f4eeff]">
                                  {tx.paymentCode}
                                </span>
                              </div>
                            )}
                            {tx.referenceCode && (
                              <div>
                                <span className="text-[#8e849e] dark:text-[#8d8299]">Mã tham chiếu (Admin):</span>{' '}
                                <span className="font-mono font-semibold text-[#7240b8] dark:text-[#a87ffb]">
                                  {tx.referenceCode}
                                </span>
                              </div>
                            )}
                            {tx.processedAt && (
                              <div className="sm:col-span-2">
                                <span className="text-[#8e849e] dark:text-[#8d8299]">Xử lý hoàn tất lúc:</span>{' '}
                                <span className="text-[#1c192c] dark:text-[#f4eeff]">
                                  {formatDate(tx.processedAt)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <p className="text-[10px] text-[#8e849e] dark:text-[#8d8299]">
                  Bảo mật dữ liệu: API chỉ đọc không trả về raw payload, số tài khoản ngân hàng hay khóa bí mật webhook.
                </p>
              </div>

              {/* Timestamps & Audit Trail */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#8e849e] dark:text-[#8d8299] pt-2 border-t border-[#f1ebff] dark:border-[#2b2438]">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Ngày tạo: {formatDate(resolvedOrder.createdAt)}</span>
                </div>
                {resolvedOrder.updatedAt && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Cập nhật: {formatDate(resolvedOrder.updatedAt)}</span>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between gap-3 p-5 border-t border-[#f1ebff] dark:border-[#2b2438] bg-[#fdf8ff] dark:bg-[#17141f]">
          <div className="flex items-center gap-2">
            {resolvedOrder && canManageManualOrder(resolvedOrder) && onOpenStatusModal && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenStatusModal(resolvedOrder, 'completed');
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
                    onOpenStatusModal(resolvedOrder, 'rejected');
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:hover:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 transition-colors cursor-pointer"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Từ chối</span>
                </button>
              </>
            )}
            {resolvedOrder &&
              resolvedOrder.paymentMethod?.toLowerCase() === 'sepay_bank_transfer' &&
              isPending && (
                <span className="text-[11px] text-amber-700 dark:text-amber-300 font-medium">
                  Đơn SePay tự động đối soát — không hỗ trợ duyệt/từ chối thủ công.
                </span>
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
