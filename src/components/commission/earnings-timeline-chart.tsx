'use client';

import React, { useMemo, useState } from 'react';
import { formatTimelineAxisLabel } from '@/lib/admin-analytics';
import {
  formatCompactVndBigInt,
  formatVnd,
  maxVndBigInt,
  tryParseVndBigInt,
  vndRatioPercent,
} from '@/lib/vndCurrency';
import { EarningsTimelinePoint } from '@/types/commission-earnings';

interface EarningsTimelineChartProps {
  timeline: EarningsTimelinePoint[];
  loading?: boolean;
  title?: string;
  subtitle?: string;
  teacherLabel?: string;
  platformLabel?: string;
}

/**
 * Zero-dependency responsive dual-series SVG chart comparing Teacher Earnings vs Platform Share.
 * Uses exact BigInt scaling (vndRatioPercent & formatCompactVndBigInt) so monetary values never
 * lose precision even above Number.MAX_SAFE_INTEGER.
 */
export function EarningsTimelineChart({
  timeline,
  loading = false,
  title = 'Biểu đồ phân bổ hoa hồng theo thời gian',
  subtitle = 'So sánh phần thu nhập Giảng viên và phần Nền tảng ghi nhận theo chu kỳ',
  teacherLabel = 'Thu nhập Giảng viên',
  platformLabel = 'Phần Nền tảng',
}: EarningsTimelineChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const sorted = useMemo(
    () => [...(timeline || [])].sort((a, b) => a.date.localeCompare(b.date)),
    [timeline]
  );

  const maxAmount = useMemo(() => {
    const allValues: string[] = [];
    for (const pt of sorted) {
      allValues.push(pt.teacherEarnings, pt.platformShare);
    }
    return maxVndBigInt(allValues);
  }, [sorted]);

  const BI_ZERO = BigInt(0);
  const BI_HUNDRED = BigInt(100);

  const hasData = sorted.some(
    (p) => tryParseVndBigInt(p.teacherEarnings) > BI_ZERO || tryParseVndBigInt(p.platformShare) > BI_ZERO
  );

  if (loading) {
    return (
      <div className="rounded-2xl bg-white dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] p-5 space-y-4 animate-pulse">
        <div className="h-5 w-64 rounded bg-[#f1ebff] dark:bg-[#2b2438]" />
        <div className="h-56 w-full rounded-xl bg-[#f7f1ff] dark:bg-[#221d2d]" />
      </div>
    );
  }

  const width = 760;
  const height = 240;
  const padLeft = 68;
  const padRight = 20;
  const padTop = 18;
  const padBottom = 34;
  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const yTicks = [100, 75, 50, 25, 0];
  const count = sorted.length;
  const groupWidth = count > 0 ? chartW / count : chartW;
  const barWidth = Math.max(4, Math.min(18, groupWidth * 0.34));
  const labelEvery = count <= 10 ? 1 : Math.ceil(count / 8);

  const activePoint = hoveredIdx !== null && sorted[hoveredIdx] ? sorted[hoveredIdx] : null;

  return (
    <div className="rounded-2xl bg-white dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] p-5 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-[#1c192c] dark:text-[#f4eeff]">
            {title}
          </h3>
          <p className="text-xs text-[#635a72] dark:text-[#a9a0b2] mt-0.5">{subtitle}</p>
        </div>

        <div className="flex items-center gap-4 text-xs font-medium">
          <span className="inline-flex items-center gap-1.5 text-[#1c192c] dark:text-[#f4eeff]">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#7240b8]" aria-hidden="true" />
            {teacherLabel}
          </span>
          <span className="inline-flex items-center gap-1.5 text-[#635a72] dark:text-[#cdc3d4]">
            <span className="w-2.5 h-2.5 rounded-xs bg-sky-500" aria-hidden="true" />
            {platformLabel}
          </span>
        </div>
      </div>

      {sorted.length === 0 || !hasData ? (
        <div className="h-52 rounded-xl border border-dashed border-[#e5daf7] dark:border-[#2b2438] bg-[#fdfbff] dark:bg-[#1c1826] flex flex-col items-center justify-center text-center px-4">
          <p className="text-sm font-semibold text-[#4b4452] dark:text-[#cdc3d4]">
            Chưa có dữ liệu hoa hồng phát sinh trong chu kỳ này
          </p>
          <p className="text-xs text-[#7c7483] dark:text-[#968e9e] mt-1">
            Khi đơn hàng SePay đủ điều kiện hoàn tất trong thời gian bật tính năng, biểu đồ sẽ tự động hiển thị.
          </p>
        </div>
      ) : (
        <div className="relative">
          {activePoint && (
            <div className="mb-3 rounded-xl bg-[#f7f1ff] dark:bg-[#221d2d] border border-[#e5daf7] dark:border-[#342c44] px-3.5 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-bold text-[#1c192c] dark:text-[#f4eeff]">
                Ngày / Kỳ: {activePoint.date} ({activePoint.earningCount} khoản thu nhập)
              </span>
              <div className="flex flex-wrap items-center gap-4 tabular-nums">
                <span className="text-[#7240b8] dark:text-[#c4a6ff] font-semibold">
                  {teacherLabel}: {formatVnd(activePoint.teacherEarnings)}
                </span>
                <span className="text-sky-600 dark:text-sky-400 font-semibold">
                  {platformLabel}: {formatVnd(activePoint.platformShare)}
                </span>
              </div>
            </div>
          )}

          <div className="w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full min-w-[540px] h-auto select-none"
              role="img"
              aria-label={title}
            >
              {/* Horizontal Grid Lines & Y-Axis Labels */}
              {yTicks.map((pct) => {
                const y = padTop + chartH - (chartH * pct) / 100;
                const tickVal = (maxAmount * BigInt(pct)) / BI_HUNDRED;
                return (
                  <g key={pct}>
                    <line
                      x1={padLeft}
                      y1={y}
                      x2={width - padRight}
                      y2={y}
                      stroke="currentColor"
                      className="text-[#eee7f9] dark:text-[#2b2438]"
                      strokeDasharray={pct === 0 ? undefined : '3 3'}
                    />
                    <text
                      x={padLeft - 8}
                      y={y + 4}
                      textAnchor="end"
                      className="fill-[#7c7483] dark:fill-[#968e9e] text-[10px] tabular-nums"
                    >
                      {formatCompactVndBigInt(tickVal)}
                    </text>
                  </g>
                );
              })}

              {/* Grouped Bars */}
              {sorted.map((pt, idx) => {
                const centerX = padLeft + groupWidth * idx + groupWidth / 2;
                const teacherPct = vndRatioPercent(pt.teacherEarnings, maxAmount);
                const platformPct = vndRatioPercent(pt.platformShare, maxAmount);

                const teacherH = Math.max(
                  tryParseVndBigInt(pt.teacherEarnings) > BI_ZERO ? 2 : 0,
                  (chartH * teacherPct) / 100
                );
                const platformH = Math.max(
                  tryParseVndBigInt(pt.platformShare) > BI_ZERO ? 2 : 0,
                  (chartH * platformPct) / 100
                );

                const isHovered = hoveredIdx === idx;
                const showTick = idx % labelEvery === 0 || idx === count - 1;

                return (
                  <g
                    key={pt.date}
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                    className="cursor-pointer"
                  >
                    {/* Hover highlight column */}
                    <rect
                      x={padLeft + groupWidth * idx}
                      y={padTop}
                      width={groupWidth}
                      height={chartH}
                      fill={isHovered ? 'rgba(114, 64, 184, 0.08)' : 'transparent'}
                    />
                    {/* Teacher Earnings Bar */}
                    <rect
                      x={centerX - barWidth - 1}
                      y={padTop + chartH - teacherH}
                      width={barWidth}
                      height={teacherH}
                      rx={2}
                      fill={isHovered ? '#5e3299' : '#7240b8'}
                    >
                      <title>{`${pt.date} — ${teacherLabel}: ${formatVnd(pt.teacherEarnings)}`}</title>
                    </rect>
                    {/* Platform Share Bar */}
                    <rect
                      x={centerX + 1}
                      y={padTop + chartH - platformH}
                      width={barWidth}
                      height={platformH}
                      rx={2}
                      fill={isHovered ? '#0284c7' : '#0ea5e9'}
                    >
                      <title>{`${pt.date} — ${platformLabel}: ${formatVnd(pt.platformShare)}`}</title>
                    </rect>

                    {showTick && (
                      <text
                        x={centerX}
                        y={height - 10}
                        textAnchor="middle"
                        className="fill-[#7c7483] dark:fill-[#968e9e] text-[10px]"
                      >
                        {formatTimelineAxisLabel(pt.date)}
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
