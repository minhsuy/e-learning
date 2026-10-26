'use client';

import React, { useEffect, useState } from 'react';
import {
  X,
  Ticket,
  Copy,
  Check,
  Calendar,
  Globe,
  BookOpen,
  Edit2,
  Trash2,
  AlertCircle,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { AdminCouponItem } from '@/types/admin-coupon';
import {
  adminCouponService,
  formatCouponDiscount,
  getCouponValidityStatus,
  normalizeCouponApiError,
} from '@/services/admin-coupon.service';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface CouponDetailModalProps {
  couponId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (coupon: AdminCouponItem) => void;
  onDelete: (coupon: AdminCouponItem) => void;
}

function CouponDetailModalContent({
  couponId,
  onClose,
  onEdit,
  onDelete,
}: Omit<CouponDetailModalProps, 'isOpen'> & { couponId: string }) {
  const [coupon, setCoupon] = useState<AdminCouponItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Load detailed coupon data when opened
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchDetail = async () => {
      await Promise.resolve();
      if (!isMounted) return;

      setLoading(true);
      setError(null);

      try {
        const res = await adminCouponService.getCouponById(couponId, {
          signal: controller.signal,
        });
        if (isMounted && res.data) {
          setCoupon(res.data);
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return;
        if (isMounted) {
          const msg = normalizeCouponApiError(err, 'Không thể tải chi tiết mã giảm giá.');
          setError(msg);
          toast.error(msg);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void fetchDetail();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [couponId]);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleCopyCode = (code: string) => {
    if (!navigator?.clipboard) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success(`Đã sao chép mã "${code}" vào clipboard!`);
    setTimeout(() => setCopied(false), 2000);
  };

  const validity = coupon ? getCouponValidityStatus(coupon) : 'disabled';
  const used = coupon?.used || 0;
  const limit = coupon?.limit;
  const hasLimit = typeof limit === 'number' && limit > 0;
  const usagePercentage = hasLimit ? Math.min(100, Math.round((used / limit) * 100)) : 0;

  const isGlobal = !coupon?.courses || coupon.courses.length === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-[#1d1926] border border-[#f1ebff] dark:border-[#2b2438] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="coupon-detail-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#f1ebff] dark:border-[#2b2438] bg-[#fdf8ff] dark:bg-[#17141f]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#f7f1ff] dark:bg-[#2b2438] text-[#7240b8] dark:text-[#a87ffb] flex items-center justify-center shrink-0 border border-[#7240b8]/20">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <h3
                id="coupon-detail-title"
                className="text-base font-bold text-[#1c192c] dark:text-[#f4eeff]"
              >
                Chi tiết Mã giảm giá
              </h3>
              <p className="text-xs text-[#635a72] dark:text-[#a9a0b2]">
                Thông tin cấu hình ưu đãi, thời hạn và phạm vi khóa học
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#635a72] hover:text-[#1c192c] dark:text-[#a9a0b2] dark:hover:text-[#f4eeff] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body (Scrollable) */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#7240b8] dark:text-[#a87ffb]" />
              <p className="text-xs text-[#635a72] dark:text-[#a9a0b2]">
                Đang tải dữ liệu chi tiết mã giảm giá...
              </p>
            </div>
          ) : error || !coupon ? (
            <div className="py-12 text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
              <p className="text-sm font-semibold text-[#1c192c] dark:text-[#f4eeff]">
                {error || 'Không tìm thấy thông tin mã giảm giá'}
              </p>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#7240b8] text-white hover:bg-[#5d3299] transition-colors"
              >
                Đóng
              </button>
            </div>
          ) : (
            <>
              {/* Code Banner */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#f7f1ff] via-white to-[#f7f1ff] dark:from-[#231b30] dark:via-[#1d1926] dark:to-[#231b30] border border-[#7240b8]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-2xl font-black text-[#7240b8] dark:text-[#a87ffb] tracking-wider">
                      {coupon.code}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyCode(coupon.code)}
                      className="p-1.5 rounded-lg border border-[#7240b8]/30 bg-white dark:bg-[#1d1926] text-[#7240b8] dark:text-[#a87ffb] hover:bg-[#f7f1ff] dark:hover:bg-[#2b2438] transition-colors"
                      title="Sao chép mã"
                      aria-label="Sao chép mã"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <h4 className="text-sm font-bold text-[#1c192c] dark:text-[#f4eeff]">
                    {coupon.title}
                  </h4>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={cn(
                      'px-3 py-1 rounded-full text-xs font-semibold',
                      validity === 'active' &&
                        'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/50',
                      validity === 'upcoming' &&
                        'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700/50',
                      validity === 'expired' &&
                        'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-700/50',
                      validity === 'exhausted' &&
                        'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/50',
                      validity === 'disabled' &&
                        'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700'
                    )}
                  >
                    {validity === 'active' && 'Đang hiệu lực'}
                    {validity === 'upcoming' && 'Chưa bắt đầu'}
                    {validity === 'expired' && 'Đã hết hạn'}
                    {validity === 'exhausted' && 'Đã hết lượt dùng'}
                    {validity === 'disabled' && 'Vô hiệu hóa'}
                  </span>

                  <span
                    className={cn(
                      'px-2.5 py-1 rounded-full text-xs font-medium',
                      coupon.active
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                        : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                    )}
                  >
                    {coupon.active ? 'Kích hoạt' : 'Tắt'}
                  </span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438]">
                  <p className="text-[11px] font-medium text-[#635a72] dark:text-[#a9a0b2]">
                    Mức giảm giá
                  </p>
                  <p className="text-base sm:text-lg font-bold text-[#7240b8] dark:text-[#a87ffb] mt-0.5">
                    {formatCouponDiscount(coupon.type, coupon.value)}
                  </p>
                  <span className="text-[10px] text-[#635a72] dark:text-[#a9a0b2]">
                    {(coupon.type || '').toLowerCase() === 'percentage'
                      ? 'Tỷ lệ % chiết khấu'
                      : 'Số tiền cố định'}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438]">
                  <p className="text-[11px] font-medium text-[#635a72] dark:text-[#a9a0b2]">
                    Lượt sử dụng
                  </p>
                  <p className="text-base sm:text-lg font-bold text-[#1c192c] dark:text-[#f4eeff] mt-0.5">
                    {used}
                    <span className="text-xs text-[#635a72] dark:text-[#a9a0b2] font-normal">
                      {hasLimit ? ` / ${limit}` : ' (Vô hạn)'}
                    </span>
                  </p>
                  {hasLimit && (
                    <div className="w-full bg-[#f1ebff] dark:bg-[#2b2438] h-1.5 rounded-full mt-1.5 overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-300',
                          usagePercentage >= 100 ? 'bg-rose-500' : 'bg-[#7240b8] dark:bg-[#a87ffb]'
                        )}
                        style={{ width: `${usagePercentage}%` }}
                      />
                    </div>
                  )}
                </div>

                <div className="p-3.5 rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438]">
                  <p className="text-[11px] font-medium text-[#635a72] dark:text-[#a9a0b2]">
                    Phạm vi áp dụng
                  </p>
                  <p className="text-base sm:text-lg font-bold text-[#1c192c] dark:text-[#f4eeff] mt-0.5">
                    {isGlobal ? 'Toàn sàn' : `${coupon.courses?.length || 0} khóa học`}
                  </p>
                  <span className="text-[10px] text-[#635a72] dark:text-[#a9a0b2]">
                    {isGlobal ? 'Mọi khóa học' : 'Chỉ định'}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438]">
                  <p className="text-[11px] font-medium text-[#635a72] dark:text-[#a9a0b2]">
                    Người tạo mã
                  </p>
                  <p className="text-sm font-bold text-[#1c192c] dark:text-[#f4eeff] mt-0.5 truncate">
                    {coupon.author?.username || 'Hệ thống'}
                  </p>
                  <span className="text-[10px] uppercase font-semibold text-[#7240b8] dark:text-[#a87ffb]">
                    {coupon.author?.role || 'Admin'}
                  </span>
                </div>
              </div>

              {/* Time Validity Details */}
              <div className="p-4 rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] space-y-2 text-xs">
                <div className="flex items-center gap-2 font-bold text-[#1c192c] dark:text-[#f4eeff]">
                  <Calendar className="w-4 h-4 text-[#7240b8] dark:text-[#a87ffb]" />
                  <span>Thời gian hiệu lực</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[#635a72] dark:text-[#a9a0b2]">
                  <div>
                    <span className="font-medium text-[#1c192c] dark:text-[#f4eeff]">
                      Bắt đầu:{' '}
                    </span>
                    {coupon.startDate
                      ? new Date(coupon.startDate).toLocaleString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Không giới hạn ngày bắt đầu'}
                  </div>

                  <div>
                    <span className="font-medium text-[#1c192c] dark:text-[#f4eeff]">
                      Kết thúc:{' '}
                    </span>
                    {coupon.endDate
                      ? new Date(coupon.endDate).toLocaleString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Vô thời hạn'}
                  </div>
                </div>

                <div className="pt-2 border-t border-[#f1ebff] dark:border-[#2b2438] flex flex-wrap gap-4 text-[11px] text-[#635a72] dark:text-[#a9a0b2]">
                  {coupon.createdAt && (
                    <span>
                      Ngày tạo:{' '}
                      {new Date(coupon.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  )}
                  {coupon.updatedAt && (
                    <span>
                      Cập nhật lần cuối:{' '}
                      {new Date(coupon.updatedAt).toLocaleDateString('vi-VN')}
                    </span>
                  )}
                </div>
              </div>

              {/* Applicable Courses Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#7240b8] dark:text-[#a87ffb]" />
                    <h4 className="text-sm font-bold text-[#1c192c] dark:text-[#f4eeff]">
                      Danh sách khóa học áp dụng
                    </h4>
                  </div>
                  <span className="text-xs text-[#635a72] dark:text-[#a9a0b2]">
                    {isGlobal
                      ? 'Toàn bộ khóa học'
                      : `${coupon.courses?.length || 0} khóa học`}
                  </span>
                </div>

                {isGlobal ? (
                  <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 text-xs text-indigo-900 dark:text-indigo-300 flex items-start gap-2.5">
                    <Globe className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold mb-0.5">Mã giảm giá quy mô toàn sàn</p>
                      <p className="text-indigo-800 dark:text-indigo-300/80">
                        Học viên có thể áp dụng mã này khi thanh toán bất kỳ khóa học nào đang mở bán trên nền tảng TMdemy.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {coupon.courses?.map((courseItem, idx) => {
                      const isObj = typeof courseItem === 'object' && courseItem !== null;
                      const courseId = isObj ? courseItem.id || courseItem._id : courseItem;
                      const courseTitle = isObj ? courseItem.title : `Khóa học #${courseId}`;
                      const coursePrice = isObj && courseItem.price !== undefined ? courseItem.price : null;
                      const courseSlug = isObj ? courseItem.slug : null;

                      return (
                        <div
                          key={courseId || idx}
                          className="p-3 rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-[#f7f1ff] dark:bg-[#2b2438] text-[#7240b8] dark:text-[#a87ffb] flex items-center justify-center shrink-0 font-bold text-[11px]">
                              {idx + 1}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-[#1c192c] dark:text-[#f4eeff] truncate">
                                {courseTitle}
                              </p>
                              {courseSlug && (
                                <p className="font-mono text-[10px] text-[#635a72] dark:text-[#a9a0b2] truncate">
                                  /{courseSlug}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {coursePrice !== null && (
                              <span className="font-bold text-[#1c192c] dark:text-[#f4eeff]">
                                {new Intl.NumberFormat('vi-VN', {
                                  style: 'currency',
                                  currency: 'VND',
                                }).format(coursePrice)}
                              </span>
                            )}
                            {courseSlug && (
                              <Link
                                href={`/courses/${courseSlug}`}
                                target="_blank"
                                className="p-1 rounded-md text-[#635a72] hover:text-[#7240b8] transition-colors"
                                title="Xem trang khóa học"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Link>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-t border-[#f1ebff] dark:border-[#2b2438] bg-[#fdf8ff] dark:bg-[#17141f]">
          <div className="flex items-center gap-2">
            {coupon && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onDelete(coupon);
                }}
                className="px-3 py-2 text-xs font-semibold rounded-xl border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa mã</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-medium rounded-xl border border-[#f1ebff] dark:border-[#2b2438] text-[#1c192c] dark:text-[#f4eeff] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              Đóng
            </button>

            {coupon && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(coupon);
                }}
                className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-[#7240b8] hover:bg-[#5d3299] text-white shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Chỉnh sửa</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function CouponDetailModal({
  couponId,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}: CouponDetailModalProps) {
  if (!isOpen || !couponId) return null;

  return (
    <CouponDetailModalContent
      key={couponId}
      couponId={couponId}
      onClose={onClose}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  );
}

