'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Calendar, RefreshCw } from 'lucide-react';
import { EarningsTimelineChart } from '@/components/commission/earnings-timeline-chart';
import {
  extractCommissionApiError,
  NormalizedCommissionError,
  validateCommissionCustomRange,
} from '@/lib/commission-earnings';
import { formatVnd, maxVndBigInt, vndRatioPercent } from '@/lib/vndCurrency';
import { teacherEarningsService } from '@/services/teacher-earnings.service';
import {
  CommissionTimezone,
  TeacherEarningsPeriod,
  TeacherEarningsStatsData,
} from '@/types/commission-earnings';

interface CourseOption {
  id: string;
  title: string;
}

interface TeacherEarningsStatisticsProps {
  courses: CourseOption[];
}

export function TeacherEarningsStatistics({ courses }: TeacherEarningsStatisticsProps) {
  const [period, setPeriod] = useState<TeacherEarningsPeriod>('30days');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [timezone, setTimezone] = useState<CommissionTimezone>('Asia/Ho_Chi_Minh');
  const [courseId, setCourseId] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const [data, setData] = useState<TeacherEarningsStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<NormalizedCommissionError | null>(null);

  const fetchStats = useCallback(
    async (signal?: AbortSignal) => {
      const check = validateCommissionCustomRange(period, startDate, endDate);
      if (!check.valid) {
        setValidationError(check.error || 'Khoảng ngày không hợp lệ.');
        setLoading(false);
        return;
      }
      setValidationError(null);
      setLoading(true);
      setError(null);

      try {
        const res = await teacherEarningsService.getStatistics(
          {
            period,
            startDate: period === 'custom' ? startDate : undefined,
            endDate: period === 'custom' ? endDate : undefined,
            timezone,
            courseId: courseId || undefined,
          },
          { signal }
        );
        setData(res.data);
      } catch (err) {
        if ((err as { name?: string })?.name === 'AbortError') return;
        setError(extractCommissionApiError(err, 'Không thể tải thống kê thu nhập hoa hồng.'));
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [period, startDate, endDate, timezone, courseId]
  );

  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(() => {
      if (!controller.signal.aborted) void fetchStats(controller.signal);
    });
    return () => controller.abort();
  }, [fetchStats]);

  const maxCourseAmount = maxVndBigInt((data?.byCourse || []).map((c) => c.teacherEarnings));

  return (
    <div className="space-y-5">
      {/* Filter Controls */}
      <div className="rounded-2xl bg-white dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] p-4 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#635a72] dark:text-[#a9a0b2] mb-1">
              Chu kỳ thống kê
            </label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as TeacherEarningsPeriod)}
              className="w-full h-9 px-3 rounded-xl border border-[#e5daf7] dark:border-[#342c44] bg-[#fdfbff] dark:bg-[#1f1b29] text-xs font-medium text-[#1c192c] dark:text-[#f4eeff]"
            >
              <option value="7days">7 ngày gần nhất</option>
              <option value="30days">30 ngày gần nhất</option>
              <option value="12months">12 tháng gần nhất</option>
              <option value="custom">Tùy chỉnh khoảng ngày</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#635a72] dark:text-[#a9a0b2] mb-1">
              Múi giờ báo cáo
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value as CommissionTimezone)}
              className="w-full h-9 px-3 rounded-xl border border-[#e5daf7] dark:border-[#342c44] bg-[#fdfbff] dark:bg-[#1f1b29] text-xs font-medium text-[#1c192c] dark:text-[#f4eeff]"
            >
              <option value="Asia/Ho_Chi_Minh">Asia/Ho_Chi_Minh (GMT+7)</option>
              <option value="UTC">UTC (GMT+0)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#635a72] dark:text-[#a9a0b2] mb-1">
              Lọc theo khóa học
            </label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="w-full h-9 px-3 rounded-xl border border-[#e5daf7] dark:border-[#342c44] bg-[#fdfbff] dark:bg-[#1f1b29] text-xs font-medium text-[#1c192c] dark:text-[#f4eeff]"
            >
              <option value="">Tất cả khóa học</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={() => fetchStats()}
              className="w-full h-9 inline-flex items-center justify-center gap-1.5 px-3 rounded-xl bg-[#7240b8] hover:bg-[#5e3299] text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Làm mới biểu đồ
            </button>
          </div>
        </div>

        {period === 'custom' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#f7f1ff] dark:border-[#2b2438]">
            <div>
              <label className="block text-[11px] font-semibold text-[#635a72] dark:text-[#a9a0b2] mb-1">
                Từ ngày (YYYY-MM-DD)
              </label>
              <div className="relative">
                <Calendar className="w-3.5 h-3.5 text-[#7c7483] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full h-9 pl-8 pr-3 rounded-xl border border-[#e5daf7] dark:border-[#342c44] bg-[#fdfbff] dark:bg-[#1f1b29] text-xs text-[#1c192c] dark:text-[#f4eeff]"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#635a72] dark:text-[#a9a0b2] mb-1">
                Đến ngày (YYYY-MM-DD)
              </label>
              <div className="relative">
                <Calendar className="w-3.5 h-3.5 text-[#7c7483] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full h-9 pl-8 pr-3 rounded-xl border border-[#e5daf7] dark:border-[#342c44] bg-[#fdfbff] dark:bg-[#1f1b29] text-xs text-[#1c192c] dark:text-[#f4eeff]"
                />
              </div>
            </div>
          </div>
        )}

        {validationError && (
          <p className="text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 rounded-xl px-3 py-2">
            {validationError}
          </p>
        )}
      </div>

      {error && (
        <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 p-4 flex items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <p className="text-xs text-rose-800 dark:text-rose-200">{error.message}</p>
          </div>
          <button
            type="button"
            onClick={() => fetchStats()}
            className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold shrink-0 cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Period Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Cơ sở tính hoa hồng (Commission Base)',
            value: data ? formatVnd(data.periodSummary.totalCommissionBase) : '—',
            accent: 'text-[#1c192c] dark:text-[#f4eeff]',
          },
          {
            label: 'Thu nhập Giảng viên trong kỳ',
            value: data ? formatVnd(data.periodSummary.totalTeacherEarnings) : '—',
            accent: 'text-[#7240b8] dark:text-[#c4a6ff]',
          },
          {
            label: 'Phần chia sẻ Nền tảng',
            value: data ? formatVnd(data.periodSummary.totalPlatformShare) : '—',
            accent: 'text-sky-600 dark:text-sky-400',
          },
          {
            label: 'Số khoản thu nhập phát sinh',
            value: data ? `${data.periodSummary.earningCount} khoản` : '—',
            accent: 'text-emerald-700 dark:text-emerald-400',
          },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-2xl bg-white dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] p-4 shadow-2xs"
          >
            <p className="text-[11px] font-semibold text-[#635a72] dark:text-[#a9a0b2]">
              {card.label}
            </p>
            {loading ? (
              <div className="h-7 w-28 rounded bg-[#f1ebff] dark:bg-[#2b2438] animate-pulse mt-2" />
            ) : (
              <p className={`text-xl font-extrabold tabular-nums mt-1.5 ${card.accent}`}>
                {card.value}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Dual-Series Timeline Chart */}
      <EarningsTimelineChart
        timeline={data?.timeline || []}
        loading={loading}
        title="Biến động thu nhập hoa hồng theo thời gian"
        subtitle={`Ghi nhận theo recognizedAt • Múi giờ ${timezone}`}
      />

      {/* By Course Breakdown */}
      <div className="rounded-2xl bg-white dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] p-5 shadow-2xs">
        <div className="mb-4">
          <h3 className="text-sm sm:text-base font-bold text-[#1c192c] dark:text-[#f4eeff]">
            Phân bổ thu nhập theo từng khóa học
          </h3>
          <p className="text-xs text-[#635a72] dark:text-[#a9a0b2] mt-0.5">
            Tổng hợp thu nhập thực nhận của bạn theo từng khóa học trong chu kỳ đã chọn
          </p>
        </div>

        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-12 rounded-xl bg-[#f7f1ff] dark:bg-[#221d2d]" />
            ))}
          </div>
        ) : !data || data.byCourse.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#7c7483] dark:text-[#968e9e] border border-dashed border-[#e5daf7] dark:border-[#2b2438] rounded-xl">
            Chưa có khoản thu nhập nào theo khóa học trong chu kỳ này.
          </div>
        ) : (
          <div className="space-y-3">
            {data.byCourse.map((item) => {
              const pct = vndRatioPercent(item.teacherEarnings, maxCourseAmount);
              return (
                <div
                  key={item.courseId}
                  className="rounded-xl border border-[#f1ebff] dark:border-[#2b2438] p-3.5 bg-[#fdfbff] dark:bg-[#1c1826]"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-2">
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-[#1c192c] dark:text-[#f4eeff] truncate">
                        {item.courseTitle}
                      </p>
                      <p className="text-[11px] text-[#7c7483] dark:text-[#968e9e]">
                        {item.earningCount} khoản thu nhập
                      </p>
                    </div>
                    <p className="text-sm font-extrabold text-[#7240b8] dark:text-[#c4a6ff] tabular-nums shrink-0">
                      {formatVnd(item.teacherEarnings)}
                    </p>
                  </div>
                  <div className="h-2 w-full rounded-full bg-[#eee7f9] dark:bg-[#2b2438] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#7240b8] transition-all duration-300"
                      style={{ width: `${Math.max(4, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
