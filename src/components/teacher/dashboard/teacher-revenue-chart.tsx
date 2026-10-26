'use client';

import React, { useState } from 'react';
import { TeacherRevenueData, TeacherRevenuePeriod } from '@/types/teacher-statistics';

interface TeacherRevenueChartProps {
  data?: TeacherRevenueData | null;
  isLoading?: boolean;
  period: TeacherRevenuePeriod;
  onPeriodChange: (period: TeacherRevenuePeriod) => void;
}

function formatVND(amount?: number): string {
  if (amount === undefined || amount === null) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDateLabel(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}`;
  }
  if (parts.length === 2) {
    return `T${parts[1]}`;
  }
  return dateStr;
}

export function TeacherRevenueChart({
  data,
  isLoading,
  period,
  onPeriodChange,
}: TeacherRevenueChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const timeline = data?.timeline || [];
  const summary = data?.summary;

  const maxRevenue = Math.max(...timeline.map((item) => item.revenue), 1);

  return (
    <div className="rounded-2xl bg-white dark:bg-[#1d1926] border border-[#ECEAF3] dark:border-[#352e43] p-5 sm:p-6 space-y-6 shadow-xs">
      {/* Header with timeframe filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#f1ebff] dark:border-[#2b2438]">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[#1c192c] dark:text-[#f4eeff]">
            Biểu đồ Doanh thu
          </h2>
          <p className="text-xs text-[#635a72] dark:text-[#a9a0b2] mt-0.5">
            Tổng thu nhập giai đoạn này: <strong className="text-[#7240b8] dark:text-[#a87ffb] font-bold">{formatVND(summary?.totalRevenue)}</strong>
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#f7f1ff] dark:bg-[#2b2438] border border-[#f1ebff] dark:border-[#352e43] self-start sm:self-auto">
          {(
            [
              { id: '7days', label: '7 ngày' },
              { id: '30days', label: '30 ngày' },
              { id: '12months', label: '12 tháng' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onPeriodChange(item.id)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                period === item.id
                  ? 'bg-white dark:bg-[#1d1926] text-[#7240b8] dark:text-[#a87ffb] shadow-xs'
                  : 'text-[#635a72] dark:text-[#a9a0b2] hover:text-[#1c192c] dark:hover:text-[#f4eeff]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Canvas */}
      {isLoading ? (
        <div className="h-64 flex items-end gap-2 pt-8 pb-4 animate-pulse">
          {[40, 65, 30, 80, 55, 90, 70, 45, 60, 75, 85, 50].map((h, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div
                className="w-full max-w-[20px] bg-[#f1ebff] dark:bg-[#2b2438] rounded-t-sm"
                style={{ height: `${h}%` }}
              />
              <div className="w-8 h-2 bg-[#f1ebff] dark:bg-[#2b2438] rounded" />
            </div>
          ))}
        </div>
      ) : timeline.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-[#635a72] dark:text-[#a9a0b2]">
          <span className="material-symbols-outlined text-4xl text-[#cdc3d4] dark:text-[#4b4359] mb-2">
            bar_chart
          </span>
          <p className="text-sm font-semibold text-[#1c192c] dark:text-[#f4eeff]">
            Chưa có dữ liệu doanh thu
          </p>
          <p className="text-xs text-[#7c7483] dark:text-[#968e9e] mt-1 max-w-sm">
            Khi học viên hoàn tất thanh toán khóa học trong chu kỳ này, biểu đồ sẽ tự động cập nhật doanh số.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative h-64 w-full flex items-end justify-between pt-8 pb-4">
            {/* Guide Grid Lines */}
            <div className="absolute inset-x-0 top-0 h-px bg-[#f1ebff] dark:bg-[#2b2438]" />
            <div className="absolute inset-x-0 top-1/4 h-px border-t border-dashed border-[#f1ebff] dark:border-[#2b2438]" />
            <div className="absolute inset-x-0 top-2/4 h-px border-t border-dashed border-[#f1ebff] dark:border-[#2b2438]" />
            <div className="absolute inset-x-0 top-3/4 h-px border-t border-dashed border-[#f1ebff] dark:border-[#2b2438]" />
            <div className="absolute inset-x-0 bottom-6 h-px bg-[#e6dffa] dark:bg-[#352e43]" />

            {/* Interactive Timeline Bars */}
            <div className="relative z-10 w-full h-full flex items-end justify-between gap-1 sm:gap-2">
              {timeline.map((item, index) => {
                const heightPercent = maxRevenue > 0 ? Math.max((item.revenue / maxRevenue) * 100, 4) : 4;
                const isHovered = hoveredIndex === index;

                return (
                  <div
                    key={item.date}
                    className="relative flex-1 h-full flex flex-col items-center justify-end group cursor-pointer"
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    {/* Tooltip on hover */}
                    {isHovered && (
                      <div className="absolute -top-12 z-30 bg-[#1c192c] dark:bg-[#f4eeff] text-white dark:text-[#1c192c] px-2.5 py-1.5 rounded-lg text-xs font-semibold shadow-lg whitespace-nowrap animate-in fade-in zoom-in-95 pointer-events-none flex flex-col items-center">
                        <span className="text-[10px] opacity-80">{item.date}</span>
                        <span className="font-bold">{formatVND(item.revenue)}</span>
                        {item.ordersCount > 0 && (
                          <span className="text-[10px] text-emerald-400 dark:text-emerald-700">
                            {item.ordersCount} đơn hàng
                          </span>
                        )}
                        <div className="w-2 h-2 bg-[#1c192c] dark:bg-[#f4eeff] rotate-45 -mb-1 mt-0.5" />
                      </div>
                    )}

                    {/* Bar Pill */}
                    <div
                      className={`w-full max-w-[20px] rounded-t-sm transition-all duration-200 ${
                        item.revenue > 0
                          ? isHovered
                            ? 'bg-[#5e3299] dark:bg-[#d6c4ff] ring-2 ring-[#7240b8]/40'
                            : 'bg-[#7240b8] dark:bg-[#a87ffb]'
                          : 'bg-[#f1ebff] dark:bg-[#2b2438]'
                      }`}
                      style={{ height: `${heightPercent}%` }}
                    />

                    {/* X-axis date label */}
                    <span className="text-[10px] font-medium text-[#7c7483] dark:text-[#968e9e] mt-2 select-none truncate max-w-[32px]">
                      {formatDateLabel(item.date)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Legend */}
          <div className="flex flex-wrap items-center justify-between text-xs text-[#635a72] dark:text-[#a9a0b2] pt-2 border-t border-[#f1ebff] dark:border-[#2b2438]">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#7240b8] dark:bg-[#a87ffb]" />
                Doanh thu thực tế
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#f1ebff] dark:bg-[#2b2438]" />
                Ngày không có giao dịch
              </span>
            </div>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {summary?.totalOrders || 0} đơn hàng trong chu kỳ
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
