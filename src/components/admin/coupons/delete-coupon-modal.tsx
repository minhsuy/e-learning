'use client';

import React, { useEffect, useState } from 'react';
import { AlertTriangle, Loader2, X, Ticket, Users, ShieldAlert } from 'lucide-react';
import { AdminCouponItem } from '@/types/admin-coupon';
import {
  adminCouponService,
  formatCouponDiscount,
  normalizeCouponApiError,
} from '@/services/admin-coupon.service';
import { toast } from '@/lib/toast';

interface DeleteCouponModalProps {
  coupon: AdminCouponItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (deletedId: string) => void;
}

export function DeleteCouponModal({
  coupon,
  isOpen,
  onClose,
  onSuccess,
}: DeleteCouponModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Close on Escape key press
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

  if (!isOpen || !coupon) return null;

  const couponId = coupon.id || coupon._id;
  const usedCount = coupon.used || 0;
  const isUsed = usedCount > 0;

  const handleClose = () => {
    if (loading) return;
    setError(null);
    onClose();
  };

  const handleConfirm = async () => {
    if (!couponId || loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await adminCouponService.deleteCoupon(couponId);
      toast.success(res?.message || `Đã xóa mã giảm giá "${coupon.code}" thành công!`);
      onSuccess(couponId);
      onClose();
    } catch (err: unknown) {
      const msg = normalizeCouponApiError(err, 'Không thể xóa mã giảm giá. Vui lòng thử lại sau.');
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-md rounded-2xl bg-white dark:bg-[#1d1926] border border-[#f1ebff] dark:border-[#2b2438] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-coupon-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#f1ebff] dark:border-[#2b2438] bg-rose-50/50 dark:bg-rose-950/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3
                id="delete-coupon-title"
                className="text-base font-bold text-[#1c192c] dark:text-[#f4eeff]"
              >
                Xác nhận xóa mã giảm giá
              </h3>
              <p className="text-xs text-[#635a72] dark:text-[#a9a0b2]">
                Thao tác xóa vĩnh viễn khỏi cơ sở dữ liệu
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="p-1 rounded-lg text-[#635a72] hover:text-[#1c192c] dark:text-[#a9a0b2] dark:hover:text-[#f4eeff] hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-40 transition-colors"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <p className="text-sm text-[#1c192c] dark:text-[#f4eeff]">
            Bạn có chắc chắn muốn xóa mã giảm giá này? Thao tác này sẽ loại bỏ hoàn toàn mã khỏi hệ thống và không thể hoàn tác.
          </p>

          {/* Coupon Info Card */}
          <div className="p-4 rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Ticket className="w-4 h-4 text-[#7240b8] dark:text-[#a87ffb]" />
                <span className="font-mono font-bold text-sm text-[#7240b8] dark:text-[#a87ffb]">
                  {coupon.code}
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#7240b8]/10 text-[#7240b8] dark:text-[#a87ffb]">
                {formatCouponDiscount(coupon.type, coupon.value)}
              </span>
            </div>

            <p className="text-xs font-medium text-[#1c192c] dark:text-[#f4eeff] line-clamp-1">
              {coupon.title}
            </p>

            <div className="flex items-center gap-4 text-xs text-[#635a72] dark:text-[#a9a0b2] pt-1 border-t border-[#f1ebff] dark:border-[#2b2438]">
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                Đã dùng: <strong className="text-[#1c192c] dark:text-[#f4eeff]">{usedCount}</strong>
                {typeof coupon.limit === 'number' && ` / ${coupon.limit}`}
              </span>
              <span>•</span>
              <span>
                Trạng thái:{' '}
                <strong className={coupon.active ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-500'}>
                  {coupon.active ? 'Kích hoạt' : 'Vô hiệu hóa'}
                </strong>
              </span>
            </div>
          </div>

          {/* Warning for Used Coupons */}
          {isUsed && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-300 text-xs">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <span>
                <strong>Cảnh báo nghiệp vụ:</strong> Mã giảm giá này đã được sử dụng trong{' '}
                <strong>{usedCount} đơn hàng</strong> trước đây. Việc xóa mã có thể ảnh hưởng đến lịch sử tra cứu của học viên. Cân nhắc <strong>Vô hiệu hóa</strong> thay vì xóa.
              </span>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-xs text-rose-700 dark:text-rose-300">
              {error}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 p-5 border-t border-[#f1ebff] dark:border-[#2b2438] bg-[#fdf8ff] dark:bg-[#17141f]">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 text-xs sm:text-sm font-medium rounded-xl border border-[#f1ebff] dark:border-[#2b2438] text-[#1c192c] dark:text-[#f4eeff] hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-40 transition-colors cursor-pointer"
          >
            Hủy bỏ
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-xs flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang xóa...</span>
              </>
            ) : (
              <span>Xác nhận xóa</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
