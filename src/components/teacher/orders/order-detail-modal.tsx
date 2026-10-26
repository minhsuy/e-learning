'use client';

import React, { useState } from 'react';
import {
  X,
  ShoppingBag,
  User,
  BookOpen,
  DollarSign,
  Calendar,
  Tag,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  AlertCircle,
} from 'lucide-react';
import { ApiOrderItem } from '@/types/order';
import { orderService } from '@/services/order.service';
import { toast } from '@/lib/toast';

interface OrderDetailModalProps {
  isOpen: boolean;
  order: ApiOrderItem | null;
  onClose: () => void;
  onStatusUpdated?: (updatedOrder: ApiOrderItem) => void;
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
      second: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

export function OrderDetailModal({
  isOpen,
  order,
  onClose,
  onStatusUpdated,
}: OrderDetailModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  if (!isOpen || !order) return null;

  const orderId = order.id || order._id || '';
  const orderCode = order.code || (orderId ? orderId.substring(0, 8).toUpperCase() : '—');
  const course = order.course;
  const user = order.user;
  const statusNormalized = (order.status || '').toUpperCase();
  const isPending = statusNormalized === 'PENDING';

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleUpdateStatus = async (newStatus: 'completed' | 'rejected') => {
    if (!orderId) return;
    setIsUpdating(true);
    try {
      const res = await orderService.updateOrderStatus(orderId, { status: newStatus });
      if (res.success) {
        toast.success(
          newStatus === 'completed'
            ? 'Đã xác nhận thanh toán đơn hàng thành công! Học viên đã được tự động ghi danh.'
            : 'Đã từ chối đơn hàng thành công.'
        );
        if (onStatusUpdated) {
          onStatusUpdated({
            ...order,
            status: newStatus.toUpperCase() as ApiOrderItem['status'],
          });
        }
        onClose();
      } else {
        toast.error(res.message || 'Không thể cập nhật trạng thái đơn hàng.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Có lỗi xảy ra khi cập nhật.';
      toast.error(msg);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#1d1926] rounded-2xl border border-[#eceaf3] dark:border-[#352e43] shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-[#eceaf3] dark:border-[#352e43] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-[#7240b8] dark:text-[#a87ffb] shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#1c192c] dark:text-[#f4eeff]">
                  Chi tiết đơn hàng {orderCode}
                </h3>
                {statusNormalized === 'COMPLETED' ? (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/40">
                    Đã thanh toán
                  </span>
                ) : statusNormalized === 'REJECTED' || statusNormalized === 'CANCELLED' ? (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/40">
                    Đã từ chối
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/40">
                    Chờ thanh toán
                  </span>
                )}
              </div>
              <p className="text-xs text-[#635a72] dark:text-[#a9a0b2] mt-0.5 font-mono">
                ID: {orderId}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Section 1: Khóa học đã mua */}
          <div className="p-4 rounded-xl bg-[#fbf9fe] dark:bg-[#252030] border border-[#eceaf3] dark:border-[#352e43]">
            <div className="flex items-center gap-2 mb-2 text-xs font-bold text-[#7240b8] dark:text-[#a87ffb] uppercase tracking-wider">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Khóa học</span>
            </div>
            <div className="flex items-center gap-3.5">
              <div className="w-16 h-11 rounded-lg bg-[#f7f1ff] dark:bg-[#282234] border border-[#eceaf3] dark:border-[#3d364b] overflow-hidden shrink-0">
                {course?.image ? (
                  <img
                    src={course.image}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#7240b8]">
                    <BookOpen className="w-5 h-5" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-sm text-[#1c192c] dark:text-[#f4eeff] line-clamp-1">
                  {course?.title || 'Khóa học không xác định'}
                </h4>
                <div className="flex items-center gap-3 text-xs text-[#635a72] dark:text-[#a9a0b2] mt-0.5">
                  <span>Giá niêm yết: {formatVND(course?.price || order.amount)}</span>
                  {course?.slug && (
                    <span className="font-mono text-[11px] text-slate-400 truncate">
                      /{course.slug}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Thông tin người mua */}
          <div className="p-4 rounded-xl bg-[#fbf9fe] dark:bg-[#252030] border border-[#eceaf3] dark:border-[#352e43]">
            <div className="flex items-center gap-2 mb-2.5 text-xs font-bold text-[#7240b8] dark:text-[#a87ffb] uppercase tracking-wider">
              <User className="w-3.5 h-3.5" />
              <span>Thông tin người mua (Học viên)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[#635a72] dark:text-[#a9a0b2] block text-[11px]">Họ và tên</span>
                <strong className="text-sm text-[#1c192c] dark:text-[#f4eeff]">
                  {user?.username || 'Học viên'}
                </strong>
              </div>
              <div>
                <span className="text-[#635a72] dark:text-[#a9a0b2] block text-[11px]">Địa chỉ Email</span>
                <strong className="text-sm text-[#1c192c] dark:text-[#f4eeff]">
                  {user?.email || '—'}
                </strong>
              </div>
              <div className="sm:col-span-2 flex items-center justify-between pt-1 border-t border-[#eceaf3] dark:border-[#352e43]">
                <span className="text-[11px] text-[#635a72] dark:text-[#a9a0b2]">Mã tài khoản học viên (User ID):</span>
                <div className="flex items-center gap-1 font-mono text-[11px] text-slate-500">
                  <span>{order.userId}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(order.userId, 'userId')}
                    className="p-1 hover:text-[#7240b8] cursor-pointer"
                    title="Sao chép User ID"
                  >
                    {copiedField === 'userId' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Chi tiết thanh toán & Coupon */}
          <div className="p-4 rounded-xl bg-[#fbf9fe] dark:bg-[#252030] border border-[#eceaf3] dark:border-[#352e43] space-y-2 text-xs">
            <div className="flex items-center gap-2 mb-2 text-xs font-bold text-[#7240b8] dark:text-[#a87ffb] uppercase tracking-wider">
              <DollarSign className="w-3.5 h-3.5" />
              <span>Chi tiết thanh toán</span>
            </div>

            <div className="flex items-center justify-between text-[#635a72] dark:text-[#a9a0b2]">
              <span>Giá gốc khóa học:</span>
              <span className="font-medium text-[#1c192c] dark:text-[#f4eeff]">
                {formatVND(order.amount)}
              </span>
            </div>

            {order.discount > 0 && (
              <div className="flex items-center justify-between text-rose-600 dark:text-rose-400">
                <span className="flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  <span>Giảm giá {order.coupon?.code ? `(Mã: ${order.coupon.code})` : ''}:</span>
                </span>
                <span className="font-semibold">
                  -{formatVND(order.discount)}
                </span>
              </div>
            )}

            <div className="pt-2 border-t border-[#eceaf3] dark:border-[#352e43] flex items-center justify-between">
              <span className="font-bold text-sm text-[#1c192c] dark:text-[#f4eeff]">
                Tổng tiền thanh toán:
              </span>
              <span className="font-extrabold text-base text-[#7240b8] dark:text-[#a87ffb]">
                {formatVND(order.total)}
              </span>
            </div>
          </div>

          {/* Section 4: Mốc thời gian */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#252030]/60 border border-[#eceaf3] dark:border-[#352e43] grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <div>
                <span className="text-[11px] text-[#635a72] dark:text-[#a9a0b2] block">Ngày đặt hàng:</span>
                <span className="font-medium text-[#1c192c] dark:text-[#f4eeff]">
                  {formatDate(order.createdAt)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <div>
                <span className="text-[11px] text-[#635a72] dark:text-[#a9a0b2] block">Cập nhật gần nhất:</span>
                <span className="font-medium text-[#1c192c] dark:text-[#f4eeff]">
                  {formatDate(order.updatedAt)}
                </span>
              </div>
            </div>
          </div>

          {/* PENDING Actions Notification */}
          {isPending && (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong>Đơn hàng đang chờ xử lý:</strong> Sau khi học viên hoàn tất chuyển khoản hoặc thanh toán, bạn có thể bấm &quot;Xác nhận hoàn tất&quot; để hệ thống tự động kích hoạt quyền học và mở khóa nội dung cho học viên.
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-[#eceaf3] dark:border-[#352e43] bg-slate-50/50 dark:bg-[#252030]/40 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isUpdating}
            className="px-4 py-2 rounded-xl border border-[#eceaf3] dark:border-[#352e43] bg-white dark:bg-[#1d1926] text-xs font-semibold text-[#1c192c] dark:text-[#f4eeff] hover:bg-[#f7f1ff] dark:hover:bg-[#282234] transition-colors cursor-pointer"
          >
            Đóng
          </button>

          {isPending && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => handleUpdateStatus('rejected')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-semibold hover:bg-rose-100 dark:hover:bg-rose-950/60 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Từ chối đơn</span>
              </button>

              <button
                type="button"
                disabled={isUpdating}
                onClick={() => handleUpdateStatus('completed')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isUpdating ? 'Đang cập nhật...' : 'Xác nhận hoàn tất'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
