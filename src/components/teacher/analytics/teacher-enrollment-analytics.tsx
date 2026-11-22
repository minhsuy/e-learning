'use client';

import React, { useState } from 'react';
import { Users, AlertCircle, RotateCcw, Info } from 'lucide-react';
import { TeacherEnrollmentStatsData } from '@/types/teacher-statistics';
import { normalizeTeacherEnrollmentTimeline } from '@/lib/teacher-analytics';

interface TeacherEnrollmentAnalyticsProps {
  data: TeacherEnrollmentStatsData | null;
  loading: boolean;
  error: string | null;
  periodLabel: string;
  isCustomPeriodFallback?: boolean;
  onRetry: () => void;
}

function fmt(n: number | undefined): string {
  return new Intl.NumberFormat('vi-VN').format(n ?? 0);
}

export function TeacherEnrollmentAnalytics({
  data,
  loading,
  error,
  periodLabel,
  isCustomPeriodFallback = false,
  onRetry,
}: TeacherEnrollmentAnalyticsProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const timeline = normalizeTeacherEnrollmentTimeline(data);
  const summary = data?.summary;
  const total = summary?.totalEnrollments ?? 0;
  const activeCount = summary?.activeCount ?? 0;
  const completedCount = summary?.completedCount ?? 0;
  const canceledCount = summary?.canceledCount ?? 0;

  const maxCount = Math.max(...timeline.map((p) => p.count), 1);
  const totalInPeriod = timeline.reduce((sum, p) => sum + p.count, 0);
  const hoveredPoint = hoveredIdx !== null && timeline[hoveredIdx] ? timeline[hoveredIdx] : null;

  const svgW = 640;
  const svgH = 200;
  const padL = 38;
  const padR = 14;
  const padT = 16;
  const padB = 30;
  const plotW = svgW - padL - padR;
  const plotH = svgH - padT - padB;
  const maxXLabels = 7;
  const xStep = timeline.length > maxXLabels ? Math.ceil(timeline.length / maxXLabels) : 1;

  return (
    <div className="bg-white dark:bg-[#1d1926] rounded-2xl border border-[#f1ebff] dark:border-[#2b2438] p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#f1ebff] dark:border-[#2b2438]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#1c192c] dark:text-[#f4eeff]">
              Phân tích Ghi danh học viên
            </h2>
            <p className="text-xs text-[#635a72] dark:text-[#a9a0b2]">
              Ghi danh mới ({periodLabel}): <strong>{fmt(totalInPeriod)}</strong> lượt • Danh mục khóa học hiện hành
            </p>
          </div>
        </div>
      </div>

      {isCustomPeriodFallback && (
        <div
          role="note"
          className="flex items-start gap-2 p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200"
        >
          <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <span>
            Biểu đồ ghi danh chưa hỗ trợ khoảng ngày tùy chọn (chỉ hỗ trợ 7 ngày, 30 ngày hoặc 12 tháng) — hệ thống đang hiển thị dữ liệu theo chu kỳ <strong>{periodLabel}</strong> thay cho khoảng ngày doanh thu đang chọn.
          </span>
        </div>
      )}

      {error ? (
        <div className="p-5 rounded-xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-center space-y-2.5">
          <AlertCircle className="w-6 h-6 text-rose-600 dark:text-rose-400 mx-auto" />
          <p className="text-xs font-medium text-rose-800 dark:text-rose-300">{error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#7240b8] hover:bg-[#5e3299] text-white text-xs font-semibold cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Thử lại</span>
          </button>
        </div>
      ) : loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-[#f7f1ff] dark:bg-[#221d2d]" />
            ))}
          </div>
          <div className="h-44 rounded-xl bg-[#f7f1ff] dark:bg-[#221d2d]" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Status Distribution Counters (ACTIVE / COMPLETED / CANCELED) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            <div className="p-3 rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438]">
              <p className="text-[11px] text-[#635a72] dark:text-[#a9a0b2]">Tổng ghi danh</p>
              <p className="text-lg font-bold text-[#1c192c] dark:text-[#f4eeff] mt-0.5">{fmt(total)}</p>
            </div>
            <div className="p-3 rounded-xl bg-sky-50/70 dark:bg-sky-950/25 border border-sky-200 dark:border-sky-900/40">
              <p className="text-[11px] text-sky-700 dark:text-sky-300">Đang học (ACTIVE)</p>
              <p className="text-lg font-bold text-sky-800 dark:text-sky-200 mt-0.5">{fmt(activeCount)}</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/25 border border-emerald-200 dark:border-emerald-900/40">
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300">Hoàn thành</p>
              <p className="text-lg font-bold text-emerald-800 dark:text-emerald-200 mt-0.5">
                {fmt(completedCount)}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-rose-50/70 dark:bg-rose-950/25 border border-rose-200 dark:border-rose-900/40">
              <p className="text-[11px] text-rose-700 dark:text-rose-300">Đã thu hồi / Hủy</p>
              <p className="text-lg font-bold text-rose-800 dark:text-rose-200 mt-0.5">{fmt(canceledCount)}</p>
            </div>
          </div>

          {/* Non-Monetary SVG Bar Chart for Enrollment Trend */}
          {timeline.length === 0 ? (
            <div className="h-44 flex items-center justify-center rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-dashed border-[#e6dffa] dark:border-[#2b2438] text-xs text-[#635a72] dark:text-[#a9a0b2]">
              Chưa có lượt ghi danh mới trong chu kỳ đã chọn.
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] text-xs">
                {hoveredPoint ? (
                  <span>
                    <strong className="font-mono text-[#1c192c] dark:text-[#f4eeff]">{hoveredPoint.date}</strong>:{' '}
                    <strong className="text-sky-600 dark:text-sky-400">{fmt(hoveredPoint.count)}</strong> lượt ghi danh mới
                  </span>
                ) : (
                  <span className="text-[#635a72] dark:text-[#a9a0b2]">
                    Di chuột lên các cột để xem số lượt ghi danh theo ngày/tháng
                  </span>
                )}
              </div>

              <div className="w-full overflow-x-auto">
                <svg
                  viewBox={`0 0 ${svgW} ${svgH}`}
                  role="img"
                  aria-label="Biểu đồ xu hướng ghi danh học viên mới"
                  className="w-full min-w-[420px] h-48 select-none"
                  onMouseLeave={() => setHoveredIdx(null)}
                >
                  {[0, 0.5, 1].map((frac, idx) => {
                    const y = padT + plotH - frac * plotH;
                    const val = Math.round(maxCount * frac);
                    return (
                      <g key={idx}>
                        <line
                          x1={padL}
                          x2={svgW - padR}
                          y1={y}
                          y2={y}
                          stroke="currentColor"
                          className="text-[#ece5fa] dark:text-[#2b2438]"
                          strokeDasharray={idx === 0 ? undefined : '4 4'}
                          strokeWidth={1}
                        />
                        <text
                          x={padL - 6}
                          y={y + 4}
                          textAnchor="end"
                          className="fill-[#7c7483] dark:fill-[#968e9e] text-[10px]"
                        >
                          {val}
                        </text>
                      </g>
                    );
                  })}

                  {timeline.map((pt, idx) => {
                    const slotW = plotW / Math.max(timeline.length, 1);
                    const barW = Math.min(Math.max(slotW * 0.62, 4), 24);
                    const x = padL + idx * slotW + (slotW - barW) / 2;
                    const barH = pt.count > 0 ? Math.max((pt.count / maxCount) * plotH, 4) : 2;
                    const y = padT + plotH - barH;
                    const isHovered = hoveredIdx === idx;
                    const showXLabel = idx % xStep === 0 || idx === timeline.length - 1;

                    return (
                      <g key={pt.date}>
                        <rect
                          x={padL + idx * slotW}
                          y={padT}
                          width={slotW}
                          height={plotH + padB}
                          fill="transparent"
                          className="cursor-pointer"
                          onMouseEnter={() => setHoveredIdx(idx)}
                        />
                        <rect
                          x={x}
                          y={y}
                          width={barW}
                          height={barH}
                          rx={3}
                          fill={pt.count > 0 ? (isHovered ? '#0284c7' : '#0ea5e9') : '#e2e8f0'}
                        />
                        {showXLabel && (
                          <text
                            x={padL + idx * slotW + slotW / 2}
                            y={svgH - 8}
                            textAnchor="middle"
                            className="fill-[#7c7483] dark:fill-[#968e9e] text-[10px]"
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

          <div className="flex items-start gap-2 text-[11px] text-[#8e849e] dark:text-[#8d8299]">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-sky-500" />
            <span>
              Số liệu ghi danh phản ánh trạng thái học tập trên danh mục khóa học hiện hành (bao gồm cả đơn miễn phí và quyền học bị thu hồi), không thay thế cho chỉ tiêu doanh thu tiền tệ.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
