'use client';

import React, { useState } from 'react';
import { TrendingUp, AlertCircle, RotateCcw, Info, Calendar } from 'lucide-react';
import { AdminFinancialStatsData } from '@/types/admin-order';
import {
  formatCompactVND,
  getTimeBasisLabel,
  normalizeRevenueTimeline,
} from '@/lib/admin-analytics';
import { formatVND } from '@/services/admin-order.service';

interface RevenueTrendChartProps {
  data: AdminFinancialStatsData | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

export function RevenueTrendChart({ data, loading, error, onRetry }: RevenueTrendChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const timeline = normalizeRevenueTimeline(data);
  const reporting = data?.reporting;
  const legacyEstimatedOrders = reporting?.legacyEstimatedOrders ?? 0;
  const undatedLegacyOrders = reporting?.undatedLegacyOrders ?? 0;
  const activeTimeBasis = reporting?.timeBasis || 'recognizedAt';
  const activeTimezone = reporting?.timezone || 'Asia/Ho_Chi_Minh';
  const granularity = reporting?.granularity === 'month' ? 'Tháng' : 'Ngày';

  const maxRevenue = Math.max(...timeline.map((p) => p.revenue), 0);
  const yMax = maxRevenue > 0 ? maxRevenue * 1.15 : 100_000;
  const totalSeriesRevenue = timeline.reduce((sum, p) => sum + p.revenue, 0);
  const totalSeriesOrders = timeline.reduce((sum, p) => sum + p.orderCount, 0);

  // SVG Geometry (viewBox coordinate system for crisp responsive rendering)
  const svgW = 800;
  const svgH = 270;
  const padL = 68;
  const padR = 20;
  const padT = 20;
  const padB = 34;
  const plotW = svgW - padL - padR;
  const plotH = svgH - padT - padB;

  const getX = (index: number) => {
    if (timeline.length <= 1) return padL + plotW / 2;
    return padL + (index / (timeline.length - 1)) * plotW;
  };

  const getY = (revenue: number) => {
    const ratio = yMax > 0 ? Math.min(Math.max(revenue / yMax, 0), 1) : 0;
    return padT + plotH - ratio * plotH;
  };

  const linePoints = timeline.map((pt, i) => `${getX(i).toFixed(1)},${getY(pt.revenue).toFixed(1)}`).join(' ');
  const areaPath =
    timeline.length > 0
      ? `M ${getX(0).toFixed(1)},${(padT + plotH).toFixed(1)} ` +
        timeline.map((pt, i) => `L ${getX(i).toFixed(1)},${getY(pt.revenue).toFixed(1)}`).join(' ') +
        ` L ${getX(timeline.length - 1).toFixed(1)},${(padT + plotH).toFixed(1)} Z`
      : '';

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((frac) => ({
    value: yMax * frac,
    y: padT + plotH - frac * plotH,
  }));

  // Determine how many X-axis labels to show without crowding
  const maxXLabels = 8;
  const xStep = timeline.length > maxXLabels ? Math.ceil(timeline.length / maxXLabels) : 1;

  const hoveredPoint = hoveredIdx !== null && timeline[hoveredIdx] ? timeline[hoveredIdx] : null;

  return (
    <div className="bg-white dark:bg-[#1d1926] rounded-2xl border border-[#f1ebff] dark:border-[#2b2438] p-5 sm:p-6 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-[#f1ebff] dark:border-[#2b2438]">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#f7f1ff] dark:bg-[#2b2438] text-[#7240b8] dark:text-[#a87ffb] flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1c192c] dark:text-[#f4eeff]">
                Xu hướng doanh thu theo thời gian
              </h2>
              <p className="text-xs text-[#635a72] dark:text-[#a9a0b2]">
                Chuỗi thời gian đầy đủ (bao gồm các mốc 0 ₫) • Gom nhóm theo {granularity}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#f7f1ff] dark:bg-[#2b2438] text-[#7240b8] dark:text-[#a87ffb] text-[11px] font-semibold">
            <Calendar className="w-3 h-3" />
            {getTimeBasisLabel(activeTimeBasis)}
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] text-[11px] font-medium text-[#635a72] dark:text-[#a9a0b2]">
            {activeTimezone}
          </span>
        </div>
      </div>

      {/* Legacy estimation / undated legacy notes */}
      {legacyEstimatedOrders > 0 && (
        <div
          role="note"
          className="flex items-start gap-2 p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200"
        >
          <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <span>
            Có <strong>{new Intl.NumberFormat('vi-VN').format(legacyEstimatedOrders)}</strong> đơn hàng lịch sử chưa ghi nhận mốc{' '}
            <code className="font-mono text-[11px]">paidAt</code> nên ngày ghi nhận được ước lượng từ ngày tạo đơn{' '}
            <code className="font-mono text-[11px]">createdAt</code> (không phải thời điểm ngân hàng xác nhận).
          </span>
        </div>
      )}

      {undatedLegacyOrders > 0 && (
        <div
          role="note"
          className="flex items-start gap-2 p-3 rounded-xl bg-sky-50/80 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-900/40 text-xs text-sky-900 dark:text-sky-200"
        >
          <Info className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
          <span>
            Chế độ <code className="font-mono text-[11px]">paidAt</code> đã loại trừ{' '}
            <strong>{new Intl.NumberFormat('vi-VN').format(undatedLegacyOrders)}</strong> đơn hoàn tất cũ không có ngày thanh toán xác thực.
          </span>
        </div>
      )}

      {/* Body States */}
      {error ? (
        <div className="h-64 flex flex-col items-center justify-center text-center gap-3 p-6 rounded-xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200/70 dark:border-rose-900/40">
          <AlertCircle className="w-7 h-7 text-rose-600 dark:text-rose-400" />
          <div className="space-y-1 max-w-md">
            <p className="text-sm font-bold text-[#1c192c] dark:text-[#f4eeff]">
              Không thể tải biểu đồ xu hướng doanh thu
            </p>
            <p className="text-xs text-[#635a72] dark:text-[#a9a0b2]">{error}</p>
          </div>
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#7240b8] hover:bg-[#5e3299] text-white text-xs font-semibold cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Thử lại</span>
          </button>
        </div>
      ) : loading ? (
        <div className="h-64 flex flex-col justify-end gap-2 pt-6 pb-2 animate-pulse">
          <div className="flex-1 w-full rounded-xl bg-[#f7f1ff] dark:bg-[#221d2d]" />
          <div className="flex justify-between gap-2">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="h-3 w-12 bg-[#f1ebff] dark:bg-[#2b2438] rounded" />
            ))}
          </div>
        </div>
      ) : timeline.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-center p-6 rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-dashed border-[#e6dffa] dark:border-[#2b2438]">
          <TrendingUp className="w-8 h-8 text-[#cdc3d4] dark:text-[#4b4359] mb-2" />
          <p className="text-sm font-bold text-[#1c192c] dark:text-[#f4eeff]">
            Chưa có dữ liệu doanh thu trong bộ lọc này
          </p>
          <p className="text-xs text-[#635a72] dark:text-[#a9a0b2] mt-1 max-w-md">
            Thử mở rộng chu kỳ thời gian hoặc chọn tất cả phương thức thanh toán để xem chuỗi doanh thu.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Interactive Hover Readout Banner */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] text-xs">
            {hoveredPoint ? (
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-mono font-bold text-[#1c192c] dark:text-[#f4eeff]">
                  {hoveredPoint.date}
                </span>
                <span className="font-bold text-[#7240b8] dark:text-[#a87ffb]">
                  {formatVND(hoveredPoint.revenue)}
                </span>
                <span className="text-[#635a72] dark:text-[#a9a0b2]">
                  {new Intl.NumberFormat('vi-VN').format(hoveredPoint.orderCount)} đơn hoàn tất
                </span>
              </div>
            ) : (
              <span className="text-[#635a72] dark:text-[#a9a0b2]">
                Di chuột lên biểu đồ để xem chi tiết doanh thu từng mốc thời gian
              </span>
            )}
            <span className="font-semibold text-[#1c192c] dark:text-[#f4eeff]">
              Tổng chuỗi: <span className="text-[#7240b8] dark:text-[#a87ffb]">{formatVND(totalSeriesRevenue)}</span>{' '}
              ({new Intl.NumberFormat('vi-VN').format(totalSeriesOrders)} đơn)
            </span>
          </div>

          {/* Responsive SVG Area/Line Chart */}
          <div className="w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${svgW} ${svgH}`}
              role="img"
              aria-label="Biểu đồ xu hướng doanh thu theo thời gian"
              className="w-full min-w-[520px] h-64 select-none"
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <defs>
                <linearGradient id="adminRevenueAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7240b8" stopOpacity="0.32" />
                  <stop offset="100%" stopColor="#7240b8" stopOpacity="0.02" />
                </linearGradient>
              </defs>

              {/* Horizontal Grid Lines & Y-Axis Ticks */}
              {yTicks.map((tick, idx) => (
                <g key={idx}>
                  <line
                    x1={padL}
                    x2={svgW - padR}
                    y1={tick.y}
                    y2={tick.y}
                    stroke="currentColor"
                    className="text-[#ece5fa] dark:text-[#2b2438]"
                    strokeDasharray={idx === 0 ? undefined : '4 4'}
                    strokeWidth={1}
                  />
                  <text
                    x={padL - 8}
                    y={tick.y + 4}
                    textAnchor="end"
                    className="fill-[#7c7483] dark:fill-[#968e9e] text-[10px] font-medium"
                  >
                    {formatCompactVND(tick.value)}
                  </text>
                </g>
              ))}

              {/* Area Fill */}
              <path d={areaPath} fill="url(#adminRevenueAreaGrad)" />

              {/* Line Stroke */}
              {timeline.length > 1 && (
                <polyline
                  fill="none"
                  stroke="#7240b8"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={linePoints}
                />
              )}

              {/* Hover Crosshair */}
              {hoveredIdx !== null && timeline[hoveredIdx] && (
                <line
                  x1={getX(hoveredIdx)}
                  x2={getX(hoveredIdx)}
                  y1={padT}
                  y2={padT + plotH}
                  stroke="#7240b8"
                  strokeOpacity={0.35}
                  strokeDasharray="3 3"
                  strokeWidth={1.5}
                />
              )}

              {/* Interactive Data Points + Invisible Hit Columns */}
              {timeline.map((pt, idx) => {
                const cx = getX(idx);
                const cy = getY(pt.revenue);
                const isHovered = hoveredIdx === idx;
                const colWidth = timeline.length > 1 ? plotW / (timeline.length - 1) : plotW;
                const showXLabel = idx % xStep === 0 || idx === timeline.length - 1;

                return (
                  <g key={pt.date}>
                    <rect
                      x={Math.max(padL, cx - colWidth / 2)}
                      y={padT}
                      width={Math.max(colWidth, 12)}
                      height={plotH + padB}
                      fill="transparent"
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredIdx(idx)}
                    />
                    {(isHovered || timeline.length <= 16 || pt.revenue > 0) && (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={isHovered ? 5.5 : pt.revenue > 0 ? 3 : 2}
                        fill={isHovered ? '#5e3299' : pt.revenue > 0 ? '#7240b8' : '#cdc3d4'}
                        stroke="#ffffff"
                        strokeWidth={isHovered ? 2 : 1.2}
                      />
                    )}
                    {showXLabel && (
                      <text
                        x={cx}
                        y={svgH - 10}
                        textAnchor="middle"
                        className="fill-[#7c7483] dark:fill-[#968e9e] text-[10px] font-medium"
                      >
                        {pt.label}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Legend Footer */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#f1ebff] dark:border-[#2b2438] text-[11px] text-[#635a72] dark:text-[#a9a0b2]">
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-1 rounded-full bg-[#7240b8]" />
                <span>Doanh thu ghi nhận (VND)</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#cdc3d4]" />
                <span>Mốc 0 ₫ (không có đơn hoàn tất)</span>
              </span>
            </div>
            <span>Hiển thị {timeline.length} điểm dữ liệu liên tục</span>
          </div>
        </div>
      )}
    </div>
  );
}
