'use client';

import React from 'react';
import {
  ShoppingBag,
  CheckCircle2,
  Clock,
  DollarSign,
  Info,
} from 'lucide-react';

interface OrdersKpiCardsProps {
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  totalOrderValue: number;
  selectedMonth?: string;
  selectedMonthLabel?: string;
  monthCompletedRevenue?: number;
  monthCompletedCount?: number;
  monthPendingCount?: number;
  monthTotalOrders?: number;
  isLoading?: boolean;
}

function formatVND(amount?: number): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '0 đ';
  return `${Math.round(amount).toLocaleString('vi-VN')} đ`;
}

export function OrdersKpiCards({
  totalOrders,
  completedOrders,
  pendingOrders,
  totalOrderValue,
  selectedMonth = 'all',
  selectedMonthLabel = 'Tất cả các tháng',
  monthCompletedRevenue,
  monthCompletedCount,
  monthPendingCount,
  monthTotalOrders,
  isLoading = false,
}: OrdersKpiCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-2xl bg-white dark:bg-[#1d1926] border border-[#eceaf3] dark:border-[#352e43] p-4.5 space-y-3 animate-pulse shadow-xs"
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800" />
              <div className="w-12 h-3.5 bg-slate-100 dark:bg-slate-800 rounded" />
            </div>
            <div className="h-7 w-24 bg-slate-100 dark:bg-slate-800 rounded" />
            <div className="h-3 w-32 bg-slate-50 dark:bg-slate-850 rounded" />
          </div>
        ))}
      </div>
    );
  }

  const isMonthSelected = selectedMonth !== 'all';

  // Dynamic values depending on month filter
  const displayTotalOrders = isMonthSelected
    ? (monthTotalOrders ?? totalOrders)
    : totalOrders;
  const displayCompletedOrders = isMonthSelected
    ? (monthCompletedCount ?? completedOrders)
    : completedOrders;
  const displayPendingOrders = isMonthSelected
    ? (monthPendingCount ?? pendingOrders)
    : pendingOrders;
  const displayRevenue = isMonthSelected
    ? (monthCompletedRevenue ?? totalOrderValue)
    : totalOrderValue;

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tổng đơn hàng */}
        <div className="rounded-2xl bg-white dark:bg-[#1d1926] border border-[#eceaf3] dark:border-[#352e43] p-4.5 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#635a72] dark:text-[#a9a0b2]">
              {isMonthSelected ? `Đơn hàng (${selectedMonthLabel})` : 'Tổng đơn hàng'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-[#7240b8] dark:text-[#a87ffb]">
              <ShoppingBag className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-[#1c192c] dark:text-[#f4eeff]">
              {displayTotalOrders}
            </div>
            <p className="text-[11px] text-[#635a72] dark:text-[#a9a0b2] mt-0.5">
              {isMonthSelected
                ? `Tổng đơn phát sinh trong ${selectedMonthLabel.toLowerCase()}`
                : 'Toàn bộ đơn mua khóa học của bạn'}
            </p>
          </div>
        </div>

        {/* Card 2: Đã thanh toán (Completed) */}
        <div className="rounded-2xl bg-white dark:bg-[#1d1926] border border-[#eceaf3] dark:border-[#352e43] p-4.5 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#635a72] dark:text-[#a9a0b2]">
              {isMonthSelected ? `Đã duyệt (${selectedMonthLabel})` : 'Đã thanh toán'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {displayCompletedOrders}
            </div>
            <p className="text-[11px] text-[#635a72] dark:text-[#a9a0b2] mt-0.5">
              {isMonthSelected
                ? `Đơn hoàn tất trong ${selectedMonthLabel.toLowerCase()}`
                : 'Đơn hoàn tất & đã ghi danh học'}
            </p>
          </div>
        </div>

        {/* Card 3: Chờ xử lý (Pending) */}
        <div className="rounded-2xl bg-white dark:bg-[#1d1926] border border-[#eceaf3] dark:border-[#352e43] p-4.5 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#635a72] dark:text-[#a9a0b2]">
              {isMonthSelected ? `Chờ thanh toán (${selectedMonthLabel})` : 'Chờ thanh toán'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Clock className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {displayPendingOrders}
            </div>
            <p className="text-[11px] text-[#635a72] dark:text-[#a9a0b2] mt-0.5">
              {isMonthSelected
                ? `Đơn chờ duyệt trong ${selectedMonthLabel.toLowerCase()}`
                : 'Đơn chờ duyệt hoặc chuyển khoản'}
            </p>
          </div>
        </div>

        {/* Card 4: Tổng giá trị / Doanh thu tháng đã duyệt (Hoàn tất) */}
        <div className={`rounded-2xl border p-4.5 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between ${
          isMonthSelected
            ? 'bg-gradient-to-br from-[#fbf8ff] to-[#f4edff] dark:from-[#211a2e] dark:to-[#1d1729] border-[#7240b8]/30 dark:border-[#a87ffb]/40 ring-1 ring-[#7240b8]/20'
            : 'bg-white dark:bg-[#1d1926] border-[#eceaf3] dark:border-[#352e43]'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-xs font-bold text-[#7240b8] dark:text-[#a87ffb] truncate">
                {isMonthSelected
                  ? `Doanh thu ${selectedMonthLabel} (Đã duyệt)`
                  : 'Tổng giá trị đơn hàng'}
              </span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <DollarSign className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-[#1c192c] dark:text-[#f4eeff]">
              {formatVND(displayRevenue)}
            </div>
            <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
              {isMonthSelected ? (
                <>
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{displayCompletedOrders} đơn hàng đã hoàn tất</span>
                </>
              ) : (
                <span>Tổng giá trị giao dịch thành công</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Disclaimed Footnote (Section 8: Order Value ≠ Teacher Payout) */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#252030] text-[11px] text-[#635a72] dark:text-[#a9a0b2]">
        <Info className="w-3.5 h-3.5 text-[#7240b8] dark:text-[#a87ffb] shrink-0" />
        <span>
          <strong>Lưu ý:</strong> Doanh thu phản ánh số tiền của các đơn hàng đã duyệt hoàn tất ({displayCompletedOrders} đơn), chưa bao gồm các khoản khấu trừ hoa hồng nền tảng và quyết toán chi trả thực tế (Teacher Payout).
        </span>
      </div>
    </div>
  );
}
