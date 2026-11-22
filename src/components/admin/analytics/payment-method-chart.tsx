'use client';

import React from 'react';
import { PieChart, Gift } from 'lucide-react';
import { AdminPaymentMethodBreakdownItem } from '@/types/admin-order';
import { normalizeMethodBreakdown } from '@/lib/admin-analytics';
import { formatVND } from '@/services/admin-order.service';

interface PaymentMethodChartProps {
  breakdown: AdminPaymentMethodBreakdownItem[] | undefined;
  loading: boolean;
}

export function PaymentMethodChart({ breakdown, loading }: PaymentMethodChartProps) {
  const { allItems, monetaryItems, freeItem, totalRevenue, totalOrders } =
    normalizeMethodBreakdown(breakdown);

  // Donut Chart geometry
  const radius = 56;
  const circumference = 2 * Math.PI * radius;

  const segments = monetaryItems.reduce<
    Array<{
      key: string;
      color: string;
      strokeDasharray: string;
      strokeDashoffset: number;
    }>
  >((acc, item) => {
    const share = totalRevenue > 0 ? item.revenue / totalRevenue : 0;
    const length = share * circumference;
    const prevUsed = acc.reduce((sum, seg) => sum + Number(seg.strokeDasharray.split(' ')[0]), 0);
    acc.push({
      key: item.paymentMethod,
      color: item.color,
      strokeDasharray: `${length.toFixed(2)} ${(circumference - length).toFixed(2)}`,
      strokeDashoffset: -prevUsed,
    });
    return acc;
  }, []);

  return (
    <div className="bg-white dark:bg-[#1d1926] rounded-2xl border border-[#f1ebff] dark:border-[#2b2438] p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2.5 pb-3 border-b border-[#f1ebff] dark:border-[#2b2438]">
        <div className="w-8 h-8 rounded-lg bg-[#f7f1ff] dark:bg-[#2b2438] text-[#7240b8] dark:text-[#a87ffb] flex items-center justify-center">
          <PieChart className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-base font-bold text-[#1c192c] dark:text-[#f4eeff]">
            Phân bổ theo phương thức thanh toán
          </h2>
          <p className="text-xs text-[#635a72] dark:text-[#a9a0b2]">
            Tỷ trọng doanh thu tiền tệ (đơn miễn phí 0 ₫ tách riêng bên dưới)
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-8 flex flex-col items-center gap-4 animate-pulse">
          <div className="w-36 h-36 rounded-full border-[14px] border-[#f1ebff] dark:border-[#2b2438]" />
          <div className="w-full space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-9 rounded-xl bg-[#f7f1ff] dark:bg-[#221d2d]" />
            ))}
          </div>
        </div>
      ) : allItems.length === 0 ? (
        <div className="py-10 text-center text-xs text-[#635a72] dark:text-[#a9a0b2]">
          Chưa có dữ liệu phân bổ phương thức thanh toán trong chu kỳ đã chọn.
        </div>
      ) : (
        <div className="space-y-5">
          {/* SVG Donut Chart (Monetary Revenue Only) */}
          <div className="flex flex-col sm:flex-row items-center gap-5">
            <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
              <svg
                viewBox="0 0 144 144"
                role="img"
                aria-label="Biểu đồ tròn tỷ trọng doanh thu theo phương thức thanh toán"
                className="w-full h-full -rotate-90"
              >
                <circle
                  cx="72"
                  cy="72"
                  r={radius}
                  fill="none"
                  stroke="currentColor"
                  className="text-[#f1ebff] dark:text-[#2b2438]"
                  strokeWidth="16"
                />
                {segments.map((seg) => (
                  <circle
                    key={seg.key}
                    cx="72"
                    cy="72"
                    r={radius}
                    fill="none"
                    stroke={seg.color}
                    strokeWidth="16"
                    strokeDasharray={seg.strokeDasharray}
                    strokeDashoffset={seg.strokeDashoffset}
                  />
                ))}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-3">
                <span className="text-[10px] font-medium text-[#8e849e] dark:text-[#8d8299]">
                  Tổng doanh thu
                </span>
                <span className="text-xs font-bold text-[#1c192c] dark:text-[#f4eeff] leading-tight mt-0.5">
                  {formatVND(totalRevenue)}
                </span>
              </div>
            </div>

            {/* Monetary Method Rows */}
            <div className="flex-1 w-full space-y-2.5">
              {allItems
                .filter((item) => !item.isFree)
                .map((item) => (
                  <div
                    key={item.paymentMethod}
                    className="p-2.5 rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="inline-flex items-center gap-2 font-semibold text-[#1c192c] dark:text-[#f4eeff]">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span>{item.label}</span>
                      </span>
                      <span className="font-bold text-[#1c192c] dark:text-[#f4eeff]">
                        {formatVND(item.revenue)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#635a72] dark:text-[#a9a0b2]">
                      <span>
                        {new Intl.NumberFormat('vi-VN').format(item.completedOrders)} đơn hoàn tất
                      </span>
                      <span>
                        {item.revenueSharePercent !== null
                          ? `${item.revenueSharePercent.toFixed(1)}% doanh thu`
                          : '0% doanh thu'}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Dedicated Free Orders Row (Explicit 0 VND — never mixed as monetary donut slice) */}
          {freeItem && (
            <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/25 border border-emerald-200 dark:border-emerald-900/40 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                  <Gift className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="font-semibold text-emerald-900 dark:text-emerald-200">
                    {freeItem.label}
                  </p>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-300/80">
                    {new Intl.NumberFormat('vi-VN').format(freeItem.completedOrders)} đơn (
                    {freeItem.orderSharePercent.toFixed(1)}% tổng số đơn hoàn tất) — không tính vào biểu đồ doanh thu tiền tệ
                  </p>
                </div>
              </div>
              <span className="font-bold text-emerald-800 dark:text-emerald-300">0 ₫</span>
            </div>
          )}

          <p className="text-[11px] text-[#8e849e] dark:text-[#8d8299]">
            Tổng cộng: {new Intl.NumberFormat('vi-VN').format(totalOrders)} đơn hàng hoàn tất trên tất cả phương thức.
          </p>
        </div>
      )}
    </div>
  );
}
