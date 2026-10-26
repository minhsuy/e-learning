'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Loader2, X, AlertTriangle, ShieldCheck } from 'lucide-react';
import { AdminOrderItem } from '@/types/admin-order';
import {
  adminOrderService,
  formatVND,
  normalizeOrderApiError,
} from '@/services/admin-order.service';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';

interface OrderStatusModalProps {
  order: AdminOrderItem | null;
  targetStatus: 'completed' | 'rejected' | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (orderId: string, newStatus: 'completed' | 'rejected') => void;
}

export function OrderStatusModal({
  order,
  targetStatus,
  isOpen,
  onClose,
  onSuccess,
}: OrderStatusModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rejectedReason, setRejectedReason] = useState('');

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, onClose]);

  if (!isOpen || !order || !targetStatus) return null;

  const orderId = order.id || order._id;
  const isApproving = targetStatus === 'completed';

  const handleClose = () => {
    if (loading) return;
    setError(null);
    setRejectedReason('');
    onClose();
  };

  const handleConfirm = async () => {
    if (!orderId || loading) return;

    setLoading(true);
    setError(null);

    try {
      await adminOrderService.updateOrderStatus(orderId, {
        status: targetStatus,
        rejectedReason: !isApproving && rejectedReason.trim() ? rejectedReason.trim() : undefined,
      });

      toast.success(
        isApproving
          ? `Đã duyệt hoàn tất đơn hàng ${order.code}. Học viên đã được cấp quyền học!`
          : `Đã từ chối đơn hàng ${order.code}. Bản ghi đã được lưu vết thành công.`
      );

      onSuccess(orderId, targetStatus);
      handleClose();
    } catch (err: unknown) {
      const msg = normalizeOrderApiError(
        err,
        isApproving
          ? 'Không thể duyệt đơn hàng. Vui lòng thử lại.'
          : 'Không thể từ chối đơn hàng. Vui lòng thử lại.'
      );
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-status-modal-title"
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-[#1d1926] rounded-2xl border border-[#f1ebff] dark:border-[#2b2438] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#f1ebff] dark:border-[#2b2438]">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                isApproving
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
              )}
            >
              {isApproving ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
            </div>
            <div>
              <h3
                id="order-status-modal-title"
                className="text-base font-bold text-[#1c192c] dark:text-[#f4eeff]"
              >
                {isApproving ? 'Xác nhận duyệt hoàn tất đơn hàng' : 'Từ chối & Hủy đơn hàng'}
              </h3>
              <p className="text-xs text-[#635a72] dark:text-[#a9a0b2]">
                Mã đơn: <span className="font-mono font-semibold text-[#1c192c] dark:text-[#f4eeff]">{order.code}</span>
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8e849e] hover:text-[#1c192c] dark:hover:text-[#f4eeff] hover:bg-[#f7f1ff] dark:hover:bg-[#2b2438] transition-colors disabled:opacity-40 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          {/* Order Snapshot Card */}
          <div className="p-4 rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] space-y-2 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-[#f1ebff] dark:border-[#2b2438]">
              <span className="text-[#635a72] dark:text-[#a9a0b2]">Khóa học:</span>
              <span className="font-medium text-[#1c192c] dark:text-[#f4eeff] text-right line-clamp-1 max-w-[260px]">
                {order.course?.title || (order.courseId ? 'Khóa học #' + order.courseId : 'Khóa học')}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-[#f1ebff] dark:border-[#2b2438]">
              <span className="text-[#635a72] dark:text-[#a9a0b2]">Học viên:</span>
              <span className="font-medium text-[#1c192c] dark:text-[#f4eeff] text-right">
                {order.user?.username || order.user?.email || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-[#635a72] dark:text-[#a9a0b2]">Số tiền thanh toán:</span>
              <span className="font-bold text-[#7240b8] dark:text-[#a87ffb] text-sm">
                {formatVND(order.total)}
              </span>
            </div>
          </div>

          {/* Description & Impact Warning */}
          {isApproving ? (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold mb-0.5">Hành động gạch nợ học phí:</p>
                <p className="leading-relaxed">
                  Hệ thống sẽ cập nhật trạng thái đơn thành <strong>COMPLETED</strong> và tự động kích hoạt quyền ghi danh học viên (Enrollment) vào khóa học ngay lập tức.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold mb-0.5">Lưu ý nghiệp vụ khi từ chối đơn hàng:</p>
                  <p className="leading-relaxed">
                    Đơn hàng sẽ chuyển sang trạng thái <strong>REJECTED</strong> và được lưu vết vĩnh viễn trong cơ sở dữ liệu phục vụ đối soát kế toán. Học viên sẽ bị thu hồi quyền truy cập khóa học và lượt dùng mã giảm giá (nếu có) được hoàn trả lại.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#1c192c] dark:text-[#f4eeff] mb-1.5">
                  Lý do từ chối đơn hàng (không bắt buộc):
                </label>
                <textarea
                  value={rejectedReason}
                  onChange={(e) => setRejectedReason(e.target.value)}
                  placeholder="Nhập lý do từ chối (ví dụ: Giao dịch không hợp lệ, học viên yêu cầu hủy đơn, thanh toán nhầm...)"
                  rows={2}
                  disabled={loading}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] text-[#1c192c] dark:text-[#f4eeff] placeholder:text-[#8e849e] dark:placeholder:text-[#8d8299] focus:outline-hidden focus:ring-2 focus:ring-rose-500/30 resize-none transition-all"
                />
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 p-5 border-t border-[#f1ebff] dark:border-[#2b2438] bg-[#fdf8ff] dark:bg-[#17141f]">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold rounded-xl text-[#635a72] dark:text-[#a9a0b2] hover:bg-[#f1ebff] dark:hover:bg-[#2b2438] transition-colors disabled:opacity-50 cursor-pointer"
          >
            Hủy bỏ
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className={cn(
              'inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl text-white shadow-xs transition-all disabled:opacity-50 cursor-pointer',
              isApproving
                ? 'bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600'
                : 'bg-rose-600 hover:bg-rose-700 dark:bg-rose-500 dark:hover:bg-rose-600'
            )}
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Đang xử lý...</span>
              </>
            ) : isApproving ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Xác nhận Duyệt</span>
              </>
            ) : (
              <>
                <XCircle className="w-3.5 h-3.5" />
                <span>Từ chối & Hủy</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
