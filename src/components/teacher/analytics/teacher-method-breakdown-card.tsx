'use client';

import React from 'react';
import { PieChart, Gift } from 'lucide-react';
import { TeacherPaymentMethodBreakdownItem } from '@/types/teacher-statistics';
import { formatTeacherVND, normalizeMethodBreakdown } from '@/lib/teacher-analytics';

interface TeacherMethodBreakdownCardProps {
  breakdown: TeacherPaymentMethodBreakdownItem[] | undefined;
  loading: boolean;
}

export function TeacherMethodBreakdownCard({
  breakdown,
  loading,
}: TeacherMethodBreakdownCardProps) {
  const { allItems, monetaryItems, freeItem, totalRevenue, totalOrders } =
    normalizeMethodBreakdown(breakdown);

  const radius = 52;
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
      <div className="flex items-center gap-2.5 pb-3 border-b border-[#f1ebff] dark:border-[#2b2438]">
        <div className="w-8 h-8 rounded-lg bg-[#f7f1ff] dark:bg-[#2b2438] text-[#7240b8] dark:text-[#a87ffb] flex items-center justify-center shrink-0">
          <PieChart className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-base font-bold text-[#1c192c] dark:text-[#f4eeff]">
            Doanh số theo kênh thanh toán
          </h2>
          <p className="text-xs text-[#635a72] dark:text-[#a9a0b2]">
            Biểu đồ tròn chỉ gồm kênh có doanh thu tiền tệ (đơn 0 ₫ tách riêng)
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-6 flex flex-col items-center gap-4 animate-pulse">
          <div className="w-32 h-32 rounded-full border-[12px] border-[#f1ebff] dark:border-[#2b2438]" />
          <div className="w-full space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-9 rounded-xl bg-[#f7f1ff] dark:bg-[#221d2d]" />
            ))}
          </div>
        </div>
      ) : allItems.length === 0 ? (
        <div className="py-10 text-center text-xs text-[#635a72] dark:text-[#a9a0b2]">
          Chưa phát sinh đơn hoàn tất nào trong chu kỳ đã chọn.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative w-32 h-32 shrink-0 flex items-center justify-center">
              <svg
                viewBox="0 0 132 132"
                role="img"
                aria-label="Biểu đồ tỷ trọng doanh thu theo phương thức thanh toán"
                className="w-full h-full -rotate-90"
              >
                <circle
                  cx="66"
                  cy="66"
                  r={radius}
                  fill="none"
                  stroke="currentColor"
                  className="text-[#f1ebff] dark:text-[#2b2438]"
                  strokeWidth="14"
                />
                {segments.map((seg) => (
                  <circle
                    key={seg.key}
                    cx="66"
                    cy="66"
                    r={radius}
                    fill="none"
                    stroke={seg.color}
                    strokeWidth="14"
                    strokeDasharray={seg.strokeDasharray}
                    strokeDashoffset={seg.strokeDashoffset}
                  />
                ))}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-2">
                <span className="text-[10px] text-[#8e849e]">Doanh số</span>
                <span className="text-[11px] font-bold text-[#1c192c] dark:text-[#f4eeff] leading-tight">
                  {formatTeacherVND(totalRevenue)}
                </span>
              </div>
            </div>

            <div className="flex-1 w-full space-y-2">
              {allItems
                .filter((item) => !item.isFree)
                .map((item) => (
                  <div
                    key={item.paymentMethod}
                    className="p-2.5 rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="inline-flex items-center gap-2 font-semibold text-[#1c192c] dark:text-[#f4eeff]">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span>{item.shortLabel}</span>
                      </span>
                      <span className="font-bold text-[#1c192c] dark:text-[#f4eeff]">
                        {formatTeacherVND(item.revenue)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#635a72] dark:text-[#a9a0b2]">
                      <span>{new Intl.NumberFormat('vi-VN').format(item.completedOrders)} đơn</span>
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

          {freeItem && (
            <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/25 border border-emerald-200 dark:border-emerald-900/40 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <Gift className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div>
                  <p className="font-semibold text-emerald-900 dark:text-emerald-200">
                    Đơn miễn phí ({new Intl.NumberFormat('vi-VN').format(freeItem.completedOrders)} đơn)
                  </p>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-300/80">
                    {freeItem.orderSharePercent.toFixed(1)}% tổng đơn hoàn tất — đóng góp 0 ₫
                  </p>
                </div>
              </div>
              <span className="font-bold text-emerald-800 dark:text-emerald-300">0 ₫</span>
            </div>
          )}

          <p className="text-[11px] text-[#8e849e] dark:text-[#8d8299]">
            Tổng cộng {new Intl.NumberFormat('vi-VN').format(totalOrders)} đơn hoàn tất thuộc khóa học của bạn.
          </p>
        </div>
      )}
    </div>
  );
}
