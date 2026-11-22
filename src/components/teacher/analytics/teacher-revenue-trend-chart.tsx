'use client';

import React, { useState } from 'react';
import { TrendingUp, AlertCircle, RotateCcw, Info, Calendar } from 'lucide-react';
import { TeacherRevenueData } from '@/types/teacher-statistics';
import {
  formatCompactVND,
  formatTeacherVND,
  getTimeBasisLabel,
  normalizeTeacherRevenueTimeline,
} from '@/lib/teacher-analytics';

interface TeacherRevenueTrendChartProps {
  data: TeacherRevenueData | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

export function TeacherRevenueTrendChart({
  data,
  loading,
  error,
  onRetry,
}: TeacherRevenueTrendChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const timeline = normalizeTeacherRevenueTimeline(data);
  const summary = data?.summary;
  const reporting = data?.reporting;
  const legacyEstimatedOrders = reporting?.legacyEstimatedOrders ?? 0;
  const undatedLegacyOrders = reporting?.undatedLegacyOrders ?? 0;
  const activeTimeBasis = reporting?.timeBasis || 'recognizedAt';
  const activeTimezone = reporting?.timezone || 'Asia/Ho_Chi_Minh';

  const maxRevenue = Math.max(...timeline.map((p) => p.revenue), 0);
  const yMax = maxRevenue > 0 ? maxRevenue * 1.15 : 100_000;

  const svgW = 800;
  const svgH = 260;
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

  const linePoints = timeline
    .map((pt, i) => `${getX(i).toFixed(1)},${getY(pt.revenue).toFixed(1)}`)
    .join(' ');
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

  const maxXLabels = 8;
  const xStep = timeline.length > maxXLabels ? Math.ceil(timeline.length / maxXLabels) : 1;
  const hoveredPoint = hoveredIdx !== null && timeline[hoveredIdx] ? timeline[hoveredIdx] : null;

  return (
    <div className="bg-white dark:bg-[#1d1926] rounded-2xl border border-[#f1ebff] dark:border-[#2b2438] p-5 sm:p-6 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-[#f1ebff] dark:border-[#2b2438]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#f7f1ff] dark:bg-[#2b2438] text-[#7240b8] dark:text-[#a87ffb] flex items-center justify-center shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#1c192c] dark:text-[#f4eeff]">
              Biểu đồ xu hướng doanh thu khóa học
            </h2>
            <p className="text-xs text-[#635a72] dark:text-[#a9a0b2]">
              Tổng doanh số chu kỳ:{' '}
              <strong className="text-[#7240b8] dark:text-[#a87ffb]">
                {formatTeacherVND(summary?.totalRevenue)}
              </strong>
              {summary ? (
                <span>
                  {' '}
                  • {summary.paidOrders ?? summary.totalOrders} trả phí / {summary.freeOrders ?? 0} miễn phí
                  {summary.totalDiscount ? ` • Giảm giá: ${formatTeacherVND(summary.totalDiscount)}` : ''}
                </span>
              ) : null}
            </p>
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
            Có <strong>{new Intl.NumberFormat('vi-VN').format(legacyEstimatedOrders)}</strong> đơn hàng lịch sử chưa lưu{' '}
            <code className="font-mono text-[11px]">paidAt</code> nên thời điểm ghi nhận được ước lượng theo ngày tạo đơn{' '}
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
            Chế độ <code className="font-mono text-[11px]">paidAt</code> không bao gồm{' '}
            <strong>{new Intl.NumberFormat('vi-VN').format(undatedLegacyOrders)}</strong> đơn lịch sử chưa có mốc thanh toán xác thực.
          </span>
        </div>
      )}

      {error ? (
        <div className="h-60 flex flex-col items-center justify-center text-center gap-3 p-6 rounded-xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40">
          <AlertCircle className="w-7 h-7 text-rose-600 dark:text-rose-400" />
          <div className="space-y-1 max-w-md">
            <p className="text-sm font-bold text-[#1c192c] dark:text-[#f4eeff]">
              Không thể tải biểu đồ doanh thu
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
        <div className="h-60 flex flex-col justify-end gap-2 pt-6 pb-2 animate-pulse">
          <div className="flex-1 w-full rounded-xl bg-[#f7f1ff] dark:bg-[#221d2d]" />
          <div className="flex justify-between gap-2">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="h-3 w-12 bg-[#f1ebff] dark:bg-[#2b2438] rounded" />
            ))}
          </div>
        </div>
      ) : timeline.length === 0 ? (
        <div className="h-60 flex flex-col items-center justify-center text-center p-6 rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-dashed border-[#e6dffa] dark:border-[#2b2438]">
          <TrendingUp className="w-8 h-8 text-[#cdc3d4] dark:text-[#4b4359] mb-2" />
          <p className="text-sm font-bold text-[#1c192c] dark:text-[#f4eeff]">
            Chưa có dữ liệu doanh thu trong chu kỳ này
          </p>
          <p className="text-xs text-[#635a72] dark:text-[#a9a0b2] mt-1 max-w-md">
            Khi học viên hoàn tất mua khóa học của bạn trong khoảng thời gian đã chọn, chuỗi doanh thu sẽ hiển thị tại đây.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Hover Readout */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] text-xs">
            {hoveredPoint ? (
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-mono font-bold text-[#1c192c] dark:text-[#f4eeff]">
                  {hoveredPoint.date}
                </span>
                <span className="font-bold text-[#7240b8] dark:text-[#a87ffb]">
                  {formatTeacherVND(hoveredPoint.revenue)}
                </span>
                <span className="text-[#635a72] dark:text-[#a9a0b2]">
                  {new Intl.NumberFormat('vi-VN').format(hoveredPoint.orderCount)} đơn hoàn tất
                </span>
              </div>
            ) : (
              <span className="text-[#635a72] dark:text-[#a9a0b2]">
                Di chuột lên các mốc ngày/tháng để xem chi tiết doanh số
              </span>
            )}
            <span className="text-[11px] font-medium text-[#635a72] dark:text-[#a9a0b2]">
              Giá trị đơn TB: <strong className="text-[#1c192c] dark:text-[#f4eeff]">{formatTeacherVND(summary?.averageOrderValue)}</strong>
            </span>
          </div>

          <div className="w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${svgW} ${svgH}`}
              role="img"
              aria-label="Biểu đồ xu hướng doanh thu khóa học của giảng viên"
              className="w-full min-w-[500px] h-60 select-none"
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <defs>
                <linearGradient id="teacherRevenueAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7240b8" stopOpacity="0.32" />
                  <stop offset="100%" stopColor="#7240b8" stopOpacity="0.02" />
                </linearGradient>
              </defs>

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

              <path d={areaPath} fill="url(#teacherRevenueAreaGrad)" />

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
        </div>
      )}
    </div>
  );
}
