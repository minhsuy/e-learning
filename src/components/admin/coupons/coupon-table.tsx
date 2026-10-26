'use client';

import React, { useState } from 'react';
import {
  Ticket,
  Copy,
  Check,
  Eye,
  Edit2,
  Trash2,
  AlertCircle,
  RotateCcw,
  Plus,
  Globe,
  BookOpen,
  Calendar,
  Users,
  Loader2,
} from 'lucide-react';
import { AdminCouponItem } from '@/types/admin-coupon';
import {
  formatCouponDiscount,
  getCouponValidityStatus,
} from '@/services/admin-coupon.service';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';

interface CouponTableProps {
  coupons: AdminCouponItem[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onViewDetail: (coupon: AdminCouponItem) => void;
  onEdit: (coupon: AdminCouponItem) => void;
  onDelete: (coupon: AdminCouponItem) => void;
  onToggleActive: (coupon: AdminCouponItem) => Promise<void>;
  togglingId: string | null;
  hasFilters: boolean;
  onResetFilters: () => void;
  onCreateOpen: () => void;
}

export function CouponTable({
  coupons,
  loading,
  error,
  onRetry,
  onViewDetail,
  onEdit,
  onDelete,
  onToggleActive,
  togglingId,
  hasFilters,
  onResetFilters,
  onCreateOpen,
}: CouponTableProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyCode = (id: string, code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!navigator?.clipboard) return;
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    toast.success(`Đã sao chép mã "${code}"!`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // 1. Error State
  if (error) {
    return (
      <div className="p-8 sm:p-12 text-center rounded-2xl bg-white dark:bg-[#1d1926] border border-rose-200 dark:border-rose-900/40 shadow-xs space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="space-y-1 max-w-md mx-auto">
          <h4 className="text-base font-bold text-[#1c192c] dark:text-[#f4eeff]">
            Không thể tải danh sách mã giảm giá
          </h4>
          <p className="text-xs text-[#635a72] dark:text-[#a9a0b2]">{error}</p>
        </div>
        <button
          onClick={onRetry}
          className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#7240b8] text-white hover:bg-[#5d3299] transition-colors inline-flex items-center gap-1.5 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Thử lại</span>
        </button>
      </div>
    );
  }

  // 2. Loading State (Skeletons)
  if (loading) {
    return (
      <div className="rounded-2xl bg-white dark:bg-[#1d1926] border border-[#f1ebff] dark:border-[#2b2438] overflow-hidden shadow-xs">
        {/* Desktop skeleton */}
        <div className="hidden lg:block">
          <div className="grid grid-cols-12 gap-4 px-5 py-3.5 bg-[#fdf8ff] dark:bg-[#17141f] border-b border-[#f1ebff] dark:border-[#2b2438]">
            <div className="col-span-3 h-4 bg-[#f1ebff] dark:bg-[#2b2438] rounded-md animate-pulse" />
            <div className="col-span-2 h-4 bg-[#f1ebff] dark:bg-[#2b2438] rounded-md animate-pulse" />
            <div className="col-span-2 h-4 bg-[#f1ebff] dark:bg-[#2b2438] rounded-md animate-pulse" />
            <div className="col-span-2 h-4 bg-[#f1ebff] dark:bg-[#2b2438] rounded-md animate-pulse" />
            <div className="col-span-2 h-4 bg-[#f1ebff] dark:bg-[#2b2438] rounded-md animate-pulse" />
            <div className="col-span-1 h-4 bg-[#f1ebff] dark:bg-[#2b2438] rounded-md animate-pulse" />
          </div>

          <div className="divide-y divide-[#f1ebff] dark:divide-[#2b2438]">
            {[1, 2, 3, 4, 5].map((idx) => (
              <div key={idx} className="grid grid-cols-12 gap-4 px-5 py-4 items-center">
                <div className="col-span-3 space-y-2">
                  <div className="h-5 w-24 bg-[#f1ebff] dark:bg-[#2b2438] rounded-md animate-pulse" />
                  <div className="h-3.5 w-40 bg-[#f1ebff] dark:bg-[#2b2438] rounded-md animate-pulse" />
                </div>
                <div className="col-span-2 h-5 w-20 bg-[#f1ebff] dark:bg-[#2b2438] rounded-md animate-pulse" />
                <div className="col-span-2 h-5 w-24 bg-[#f1ebff] dark:bg-[#2b2438] rounded-md animate-pulse" />
                <div className="col-span-2 space-y-1.5">
                  <div className="h-3.5 w-16 bg-[#f1ebff] dark:bg-[#2b2438] rounded-md animate-pulse" />
                  <div className="h-1.5 w-28 bg-[#f1ebff] dark:bg-[#2b2438] rounded-md animate-pulse" />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <div className="h-3.5 w-28 bg-[#f1ebff] dark:bg-[#2b2438] rounded-md animate-pulse" />
                  <div className="h-4 w-16 bg-[#f1ebff] dark:bg-[#2b2438] rounded-md animate-pulse" />
                </div>
                <div className="col-span-1 flex justify-end gap-1">
                  <div className="w-7 h-7 bg-[#f1ebff] dark:bg-[#2b2438] rounded-lg animate-pulse" />
                  <div className="w-7 h-7 bg-[#f1ebff] dark:bg-[#2b2438] rounded-lg animate-pulse" />
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
                <div className="h-5 w-28 bg-[#f1ebff] dark:bg-[#2b2438] rounded-md animate-pulse" />
                <div className="h-5 w-16 bg-[#f1ebff] dark:bg-[#2b2438] rounded-md animate-pulse" />
              </div>
              <div className="h-3.5 w-48 bg-[#f1ebff] dark:bg-[#2b2438] rounded-md animate-pulse" />
              <div className="h-1.5 w-full bg-[#f1ebff] dark:bg-[#2b2438] rounded-md animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 3. Empty State
  if (coupons.length === 0) {
    return (
      <div className="p-8 sm:p-14 text-center rounded-2xl bg-white dark:bg-[#1d1926] border border-[#f1ebff] dark:border-[#2b2438] shadow-xs space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-[#f7f1ff] dark:bg-[#2b2438] text-[#7240b8] dark:text-[#a87ffb] flex items-center justify-center mx-auto">
          <Ticket className="w-7 h-7" />
        </div>

        <div className="space-y-1.5 max-w-md mx-auto">
          <h4 className="text-base sm:text-lg font-bold text-[#1c192c] dark:text-[#f4eeff]">
            {hasFilters
              ? 'Không tìm thấy mã giảm giá phù hợp'
              : 'Chưa có mã giảm giá nào trên hệ thống'}
          </h4>
          <p className="text-xs sm:text-sm text-[#635a72] dark:text-[#a9a0b2]">
            {hasFilters
              ? 'Thử thay đổi từ khóa tìm kiếm hoặc bỏ các tiêu chí lọc để xem thêm kết quả.'
              : 'Khởi tạo mã ưu đãi đầu tiên để triển khai các chiến dịch khuyến mãi cho học viên.'}
          </p>
        </div>

        <div>
          {hasFilters ? (
            <button
              onClick={onResetFilters}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-[#7240b8]/30 text-[#7240b8] dark:text-[#a87ffb] hover:bg-[#f7f1ff] dark:hover:bg-[#2b2438] transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Đặt lại bộ lọc</span>
            </button>
          ) : (
            <button
              onClick={onCreateOpen}
              className="px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-[#7240b8] text-white hover:bg-[#5d3299] shadow-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo mã giảm giá đầu tiên</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // 4. Data State
  return (
    <div className="rounded-2xl bg-white dark:bg-[#1d1926] border border-[#f1ebff] dark:border-[#2b2438] overflow-hidden shadow-xs">
      {/* ================= DESKTOP TABLE VIEW (>= 1024px) ================= */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#fdf8ff] dark:bg-[#17141f] border-b border-[#f1ebff] dark:border-[#2b2438] text-[#635a72] dark:text-[#a9a0b2] font-semibold">
              <th className="py-3.5 pl-5 pr-4">Mã & Tiêu đề</th>
              <th className="py-3.5 px-3">Mức giảm</th>
              <th className="py-3.5 px-3">Phạm vi</th>
              <th className="py-3.5 px-3">Lượt dùng</th>
              <th className="py-3.5 px-3">Thời hạn</th>
              <th className="py-3.5 px-3 text-center">Trạng thái</th>
              <th className="py-3.5 pl-3 pr-5 text-right">Thao tác</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#f1ebff] dark:divide-[#2b2438] text-[#1c192c] dark:text-[#f4eeff]">
            {coupons.map((coupon) => {
              const id = coupon.id || coupon._id || '';
              const validity = getCouponValidityStatus(coupon);
              const isGlobal = !coupon.courses || coupon.courses.length === 0;
              const used = coupon.used || 0;
              const limit = coupon.limit;
              const hasLimit = typeof limit === 'number' && limit > 0;
              const usagePct = hasLimit ? Math.min(100, Math.round((used / limit) * 100)) : 0;
              const isToggling = togglingId === id;

              return (
                <tr
                  key={id}
                  onClick={() => onViewDetail(coupon)}
                  className="hover:bg-[#fdf8ff]/60 dark:hover:bg-[#17141f]/40 transition-colors cursor-pointer group"
                >
                  {/* Code & Title */}
                  <td className="py-3.5 pl-5 pr-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs px-2 py-0.5 rounded-md bg-[#f7f1ff] dark:bg-[#2b2438] text-[#7240b8] dark:text-[#a87ffb] border border-[#7240b8]/20">
                          {coupon.code}
                        </span>

                        <button
                          type="button"
                          onClick={(e) => handleCopyCode(id, coupon.code, e)}
                          className="p-1 rounded text-[#635a72] hover:text-[#7240b8] transition-colors"
                          title="Sao chép mã"
                          aria-label="Sao chép mã"
                        >
                          {copiedId === id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {coupon.author && (
                          <span className="text-[10px] text-[#635a72] dark:text-[#a9a0b2] bg-black/5 dark:bg-white/5 px-1.5 py-0.5 rounded">
                            {coupon.author.username}
                          </span>
                        )}
                      </div>

                      <p className="font-medium text-xs text-[#1c192c] dark:text-[#f4eeff] line-clamp-1 max-w-xs">
                        {coupon.title}
                      </p>
                    </div>
                  </td>

                  {/* Discount Value */}
                  <td className="py-3.5 px-3">
                    <div className="space-y-0.5">
                      <span className="font-bold text-sm text-[#7240b8] dark:text-[#a87ffb]">
                        {formatCouponDiscount(coupon.type, coupon.value)}
                      </span>
                      <p className="text-[10px] text-[#635a72] dark:text-[#a9a0b2]">
                        {(coupon.type || '').toLowerCase() === 'percentage'
                          ? 'Tỷ lệ %'
                          : 'Cố định'}
                      </p>
                    </div>
                  </td>

                  {/* Scope */}
                  <td className="py-3.5 px-3">
                    {isGlobal ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/40">
                        <Globe className="w-3 h-3" />
                        <span>Toàn sàn</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40">
                        <BookOpen className="w-3 h-3" />
                        <span>{coupon.courses?.length || 0} khóa</span>
                      </span>
                    )}
                  </td>

                  {/* Usage */}
                  <td className="py-3.5 px-3">
                    <div className="space-y-1 min-w-[100px]">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-[#1c192c] dark:text-[#f4eeff]">
                          {used}
                        </span>
                        <span className="text-[#635a72] dark:text-[#a9a0b2]">
                          {hasLimit ? `/ ${limit}` : 'Vô hạn'}
                        </span>
                      </div>
                      {hasLimit && (
                        <div className="w-full bg-[#f1ebff] dark:bg-[#2b2438] h-1.5 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all duration-300',
                              usagePct >= 100
                                ? 'bg-rose-500'
                                : 'bg-[#7240b8] dark:bg-[#a87ffb]'
                            )}
                            style={{ width: `${usagePct}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Validity / End date */}
                  <td className="py-3.5 px-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-[11px] text-[#635a72] dark:text-[#a9a0b2]">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {coupon.endDate
                            ? new Date(coupon.endDate).toLocaleDateString('vi-VN')
                            : 'Vô thời hạn'}
                        </span>
                      </div>

                      <span
                        className={cn(
                          'inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold',
                          validity === 'active' &&
                            'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
                          validity === 'upcoming' &&
                            'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400',
                          validity === 'expired' &&
                            'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400',
                          validity === 'exhausted' &&
                            'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
                          validity === 'disabled' &&
                            'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                        )}
                      >
                        {validity === 'active' && 'Hiệu lực'}
                        {validity === 'upcoming' && 'Chưa tới'}
                        {validity === 'expired' && 'Hết hạn'}
                        {validity === 'exhausted' && 'Hết lượt'}
                        {validity === 'disabled' && 'Đã tắt'}
                      </span>
                    </div>
                  </td>

                  {/* Status Toggle */}
                  <td className="py-3.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      disabled={isToggling}
                      onClick={() => onToggleActive(coupon)}
                      className={cn(
                        'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden disabled:opacity-50',
                        coupon.active ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-700'
                      )}
                      title={coupon.active ? 'Bấm để tắt kích hoạt' : 'Bấm để kích hoạt'}
                      aria-label={coupon.active ? 'Tắt kích hoạt' : 'Kích hoạt'}
                    >
                      {isToggling ? (
                        <span className="flex items-center justify-center w-full h-full">
                          <Loader2 className="w-3 h-3 text-white animate-spin" />
                        </span>
                      ) : (
                        <span
                          className={cn(
                            'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out',
                            coupon.active ? 'translate-x-4' : 'translate-x-0'
                          )}
                        />
                      )}
                    </button>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 pl-3 pr-5 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onViewDetail(coupon)}
                        className="p-1.5 rounded-lg text-[#635a72] hover:text-[#7240b8] dark:text-[#a9a0b2] dark:hover:text-[#a87ffb] hover:bg-[#f7f1ff] dark:hover:bg-[#2b2438] transition-colors"
                        title="Xem chi tiết"
                        aria-label="Xem chi tiết"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onEdit(coupon)}
                        className="p-1.5 rounded-lg text-[#635a72] hover:text-[#7240b8] dark:text-[#a9a0b2] dark:hover:text-[#a87ffb] hover:bg-[#f7f1ff] dark:hover:bg-[#2b2438] transition-colors"
                        title="Chỉnh sửa mã"
                        aria-label="Chỉnh sửa mã"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDelete(coupon)}
                        className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                        title="Xóa mã"
                        aria-label="Xóa mã"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ================= MOBILE / TABLET CARD VIEW (< 1024px) ================= */}
      <div className="lg:hidden p-3.5 sm:p-4 space-y-3 divide-y divide-[#f1ebff] dark:divide-[#2b2438]">
        {coupons.map((coupon, idx) => {
          const id = coupon.id || coupon._id || '';
          const validity = getCouponValidityStatus(coupon);
          const isGlobal = !coupon.courses || coupon.courses.length === 0;
          const used = coupon.used || 0;
          const limit = coupon.limit;
          const hasLimit = typeof limit === 'number' && limit > 0;
          const isToggling = togglingId === id;

          return (
            <div
              key={id}
              onClick={() => onViewDetail(coupon)}
              className={cn(
                'space-y-3 cursor-pointer',
                idx > 0 && 'pt-3'
              )}
            >
              {/* Card Header: Code & Discount */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono font-bold text-xs px-2 py-0.5 rounded-md bg-[#f7f1ff] dark:bg-[#2b2438] text-[#7240b8] dark:text-[#a87ffb] border border-[#7240b8]/20 truncate">
                    {coupon.code}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => handleCopyCode(id, coupon.code, e)}
                    className="p-1 text-[#635a72] hover:text-[#7240b8]"
                  >
                    {copiedId === id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                <span className="font-extrabold text-sm text-[#7240b8] dark:text-[#a87ffb] shrink-0">
                  {formatCouponDiscount(coupon.type, coupon.value)}
                </span>
              </div>

              {/* Title */}
              <p className="text-xs font-medium text-[#1c192c] dark:text-[#f4eeff] line-clamp-1">
                {coupon.title}
              </p>

              {/* Meta pills */}
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#635a72] dark:text-[#a9a0b2]">
                <span className="flex items-center gap-1">
                  {isGlobal ? <Globe className="w-3 h-3 text-indigo-500" /> : <BookOpen className="w-3 h-3 text-amber-500" />}
                  {isGlobal ? 'Toàn sàn' : `${coupon.courses?.length || 0} khóa học`}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  Đã dùng: {used}{hasLimit ? `/${limit}` : ''}
                </span>
                <span>•</span>
                <span
                  className={cn(
                    'px-1.5 py-0.2 rounded text-[10px] font-semibold',
                    validity === 'active' && 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40',
                    validity === 'expired' && 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40',
                    validity === 'disabled' && 'text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800'
                  )}
                >
                  {validity === 'active' && 'Hiệu lực'}
                  {validity === 'upcoming' && 'Chưa bắt đầu'}
                  {validity === 'expired' && 'Hết hạn'}
                  {validity === 'exhausted' && 'Hết lượt'}
                  {validity === 'disabled' && 'Đã tắt'}
                </span>
              </div>

              {/* Actions & Switch */}
              <div
                className="flex items-center justify-between pt-1"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-[#635a72] dark:text-[#a9a0b2]">Kích hoạt:</span>
                  <button
                    type="button"
                    disabled={isToggling}
                    onClick={() => onToggleActive(coupon)}
                    className={cn(
                      'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200',
                      coupon.active ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-700'
                    )}
                  >
                    <span
                      className={cn(
                        'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition duration-200',
                        coupon.active ? 'translate-x-4' : 'translate-x-0'
                      )}
                    />
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onViewDetail(coupon)}
                    className="p-1.5 rounded-lg text-[#635a72] hover:text-[#7240b8]"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onEdit(coupon)}
                    className="p-1.5 rounded-lg text-[#635a72] hover:text-[#7240b8]"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(coupon)}
                    className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
