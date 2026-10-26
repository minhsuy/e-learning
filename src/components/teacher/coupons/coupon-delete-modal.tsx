'use client';

import React from 'react';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';
import { CouponItem } from '@/types/coupon';

interface CouponDeleteModalProps {
  isOpen: boolean;
  coupon: CouponItem | null;
  onClose: () => void;
  onConfirm: (id: string) => Promise<void>;
  isDeleting: boolean;
}

export function CouponDeleteModal({
  isOpen,
  coupon,
  onClose,
  onConfirm,
  isDeleting,
}: CouponDeleteModalProps) {
  if (!isOpen || !coupon) return null;

  const couponId = coupon.id || coupon._id || '';

  const handleConfirm = async () => {
    if (!couponId || isDeleting) return;
    await onConfirm(couponId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white dark:bg-[#1a1622] rounded-2xl border border-[#f1ebff] dark:border-[#2b2438] shadow-2xl p-6 relative overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-coupon-title"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isDeleting}
          aria-label="Đóng hộp thoại"
          className="absolute top-4 right-4 p-1.5 rounded-lg text-[#7c7483] hover:text-[#1c192c] dark:hover:text-[#f4eeff] hover:bg-[#f7f1ff] dark:hover:bg-[#2b2438] transition-colors disabled:opacity-50 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon */}
        <div className="flex items-center gap-3.5 mb-4">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3
              id="delete-coupon-title"
              className="text-lg font-bold text-[#1c192c] dark:text-[#f4eeff]"
            >
              Xác nhận xóa mã giảm giá
            </h3>
            <p className="text-xs text-[#7c7483] dark:text-[#968e9e]">
              Hành động này không thể hoàn tác sau khi xác nhận
            </p>
          </div>
        </div>

        {/* Content Body */}
        <div className="my-4 p-4 rounded-xl bg-[#faf5ff] dark:bg-[#221c2e] border border-[#f1ebff] dark:border-[#2b2438] space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-[#635a72] dark:text-[#cdc3d4]">Mã giảm giá:</span>
            <span className="font-mono font-bold text-[#7240b8] dark:text-[#a87ffb] bg-white dark:bg-[#17141f] px-2 py-0.5 rounded border border-[#e8ddfc] dark:border-[#382e4a]">
              {coupon.code}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-[#635a72] dark:text-[#cdc3d4]">Tiêu đề:</span>
            <span className="font-semibold text-[#1c192c] dark:text-[#f4eeff] truncate max-w-[200px]">
              {coupon.title}
            </span>
          </div>
          {typeof coupon.used === 'number' && coupon.used > 0 && (
            <div className="flex justify-between items-center text-xs pt-1 border-t border-[#eee5fc] dark:border-[#342b46]">
              <span className="text-amber-600 dark:text-amber-400 font-medium">Lượt đã áp dụng:</span>
              <span className="font-bold text-amber-700 dark:text-amber-300">
                {coupon.used} lượt
              </span>
            </div>
          )}
        </div>

        <p className="text-xs text-[#635a72] dark:text-[#cdc3d4] leading-relaxed mb-6">
          Bạn có chắc chắn muốn xóa mã <strong className="font-bold text-[#1c192c] dark:text-[#f4eeff]">{coupon.code}</strong> khỏi hệ thống? Học viên sẽ không còn có thể sử dụng mã này trong các đơn hàng tương lai.
        </p>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2.5 rounded-xl border border-[#e2d8f3] dark:border-[#382e4a] text-xs font-semibold text-[#635a72] dark:text-[#cdc3d4] hover:bg-[#f7f1ff] dark:hover:bg-[#221c2e] transition-colors disabled:opacity-50 cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs flex items-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang xóa...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Xóa mã giảm giá</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
