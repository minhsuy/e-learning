'use client';

import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Globe,
  BookOpen,
  RefreshCw,
  RotateCcw,
  AlertCircle,
} from 'lucide-react';
import {
  DEFAULT_TEACHER_ANALYTICS_FILTERS,
  TeacherAnalyticsFilterState,
  validateTeacherDateRange,
} from '@/lib/teacher-analytics';
import {
  TeacherRevenuePeriod,
  TeacherTimeBasis,
  TeacherTimezone,
} from '@/types/teacher-statistics';
import { cn } from '@/lib/utils';

export interface TeacherCourseOption {
  id: string;
  title: string;
  status?: string;
}

interface TeacherAnalyticsFilterBarProps {
  filters: TeacherAnalyticsFilterState;
  onApplyFilters: (next: TeacherAnalyticsFilterState) => void;
  onResetFilters: () => void;
  onRefresh: () => void;
  loading: boolean;
  courses: TeacherCourseOption[];
  lastUpdated: Date | null;
}

const PERIOD_OPTIONS: Array<{ value: TeacherRevenuePeriod; label: string }> = [
  { value: '7days', label: '7 ngày' },
  { value: '30days', label: '30 ngày' },
  { value: '12months', label: '12 tháng' },
  { value: 'custom', label: 'Tùy chỉnh' },
];

const TIME_BASIS_OPTIONS: Array<{ value: TeacherTimeBasis; label: string }> = [
  { value: 'recognizedAt', label: 'Ngày ghi nhận (recognizedAt)' },
  { value: 'paidAt', label: 'Ngày thanh toán (paidAt)' },
  { value: 'createdAt', label: 'Ngày tạo đơn (createdAt)' },
];

const TIMEZONE_OPTIONS: Array<{ value: TeacherTimezone; label: string }> = [
  { value: 'Asia/Ho_Chi_Minh', label: 'Việt Nam (UTC+7)' },
  { value: 'UTC', label: 'UTC (00:00)' },
];

export function TeacherAnalyticsFilterBar({
  filters,
  onApplyFilters,
  onResetFilters,
  onRefresh,
  loading,
  courses,
  lastUpdated,
}: TeacherAnalyticsFilterBarProps) {
  const [draftStartDate, setDraftStartDate] = useState(filters.startDate);
  const [draftEndDate, setDraftEndDate] = useState(filters.endDate);
  const [prevDates, setPrevDates] = useState({ start: filters.startDate, end: filters.endDate });
  const [dateError, setDateError] = useState<string | null>(null);

  if (prevDates.start !== filters.startDate || prevDates.end !== filters.endDate) {
    setPrevDates({ start: filters.startDate, end: filters.endDate });
    setDraftStartDate(filters.startDate);
    setDraftEndDate(filters.endDate);
  }

  const isCustomActive = filters.period === 'custom';
  const hasNonDefaultFilters =
    filters.period !== DEFAULT_TEACHER_ANALYTICS_FILTERS.period ||
    filters.timeBasis !== DEFAULT_TEACHER_ANALYTICS_FILTERS.timeBasis ||
    filters.timezone !== DEFAULT_TEACHER_ANALYTICS_FILTERS.timezone ||
    filters.courseId !== '';

  const handlePeriodClick = (period: TeacherRevenuePeriod) => {
    setDateError(null);
    if (period === 'custom') {
      const today = new Date();
      const endDefault = draftEndDate || today.toISOString().slice(0, 10);
      const startObj = new Date(today.getTime() - 29 * 86_400_000);
      const startDefault = draftStartDate || startObj.toISOString().slice(0, 10);
      setDraftStartDate(startDefault);
      setDraftEndDate(endDefault);
      const check = validateTeacherDateRange('custom', startDefault, endDefault);
      if (check.valid) {
        onApplyFilters({
          ...filters,
          period: 'custom',
          startDate: startDefault,
          endDate: endDefault,
        });
      }
      return;
    }

    onApplyFilters({
      ...filters,
      period,
      startDate: '',
      endDate: '',
    });
  };

  const handleApplyCustomDates = (e: React.FormEvent) => {
    e.preventDefault();
    const check = validateTeacherDateRange('custom', draftStartDate, draftEndDate);
    if (!check.valid) {
      setDateError(check.error || 'Khoảng thời gian không hợp lệ.');
      return;
    }
    setDateError(null);
    onApplyFilters({
      ...filters,
      period: 'custom',
      startDate: draftStartDate.trim(),
      endDate: draftEndDate.trim(),
    });
  };

  return (
    <div className="bg-white dark:bg-[#1d1926] rounded-2xl border border-[#f1ebff] dark:border-[#2b2438] p-4 sm:p-5 shadow-xs space-y-4">
      {/* Row 1: Period Selector + Refresh / Reset */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-[#635a72] dark:text-[#a9a0b2] mr-1 inline-flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#7240b8] dark:text-[#a87ffb]" />
            Chu kỳ:
          </span>
          <div
            role="group"
            aria-label="Chọn chu kỳ phân tích giảng viên"
            className="inline-flex flex-wrap items-center gap-1 p-1 rounded-xl bg-[#f7f1ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438]"
          >
            {PERIOD_OPTIONS.map((opt) => {
              const active = filters.period === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handlePeriodClick(opt.value)}
                  disabled={loading && !isCustomActive}
                  aria-pressed={active}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                    active
                      ? 'bg-[#7240b8] text-white shadow-xs'
                      : 'text-[#635a72] dark:text-[#a9a0b2] hover:text-[#1c192c] dark:hover:text-[#f4eeff] hover:bg-white/70 dark:hover:bg-[#2b2438]'
                  )}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
          {lastUpdated && (
            <span className="text-[11px] text-[#8e849e] dark:text-[#8d8299]">
              Cập nhật lúc{' '}
              {new Intl.DateTimeFormat('vi-VN', { timeStyle: 'medium' }).format(lastUpdated)}
            </span>
          )}
          {hasNonDefaultFilters && (
            <button
              type="button"
              onClick={() => {
                setDateError(null);
                onResetFilters();
              }}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-950/50 border border-rose-200 dark:border-rose-900/40 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Đặt lại</span>
            </button>
          )}
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#7240b8] dark:text-[#a87ffb] bg-[#f7f1ff] dark:bg-[#2b2438] hover:bg-[#ede5fa] dark:hover:bg-[#352c48] border border-[#7240b8]/20 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* Custom Date Range Form (Submits only on explicit button click) */}
      {isCustomActive && (
        <form
          onSubmit={handleApplyCustomDates}
          className="p-3.5 rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-[#e6dffa] dark:border-[#2b2438] space-y-2.5"
        >
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <label
                htmlFor="teacher-analytics-start-date"
                className="block text-[11px] font-semibold text-[#635a72] dark:text-[#a9a0b2]"
              >
                Từ ngày (YYYY-MM-DD)
              </label>
              <input
                id="teacher-analytics-start-date"
                type="date"
                value={draftStartDate}
                onChange={(e) => {
                  setDraftStartDate(e.target.value);
                  setDateError(null);
                }}
                className="h-9 px-3 rounded-xl bg-white dark:bg-[#1d1926] border border-[#e6dffa] dark:border-[#352e43] text-xs text-[#1c192c] dark:text-[#f4eeff] focus:outline-hidden focus:ring-2 focus:ring-[#7240b8]/30"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="teacher-analytics-end-date"
                className="block text-[11px] font-semibold text-[#635a72] dark:text-[#a9a0b2]"
              >
                Đến ngày (YYYY-MM-DD)
              </label>
              <input
                id="teacher-analytics-end-date"
                type="date"
                value={draftEndDate}
                onChange={(e) => {
                  setDraftEndDate(e.target.value);
                  setDateError(null);
                }}
                className="h-9 px-3 rounded-xl bg-white dark:bg-[#1d1926] border border-[#e6dffa] dark:border-[#352e43] text-xs text-[#1c192c] dark:text-[#f4eeff] focus:outline-hidden focus:ring-2 focus:ring-[#7240b8]/30"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="h-9 px-4 rounded-xl text-xs font-semibold bg-[#7240b8] hover:bg-[#5e3299] text-white shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              Áp dụng khoảng ngày
            </button>
          </div>

          {dateError && (
            <p
              role="alert"
              className="text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1.5 font-medium"
            >
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{dateError}</span>
            </p>
          )}
        </form>
      )}

      {/* Row 2: TimeBasis, Timezone, Owned Course Filter */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-[#f1ebff] dark:border-[#2b2438]">
        {/* Time Basis */}
        <div className="space-y-1">
          <label
            htmlFor="teacher-analytics-time-basis"
            className="flex items-center gap-1 text-[11px] font-semibold text-[#635a72] dark:text-[#a9a0b2]"
          >
            <Clock className="w-3 h-3 text-[#7240b8] dark:text-[#a87ffb]" />
            <span>Cơ sở ghi nhận ngày</span>
          </label>
          <select
            id="teacher-analytics-time-basis"
            value={filters.timeBasis}
            onChange={(e) =>
              onApplyFilters({
                ...filters,
                timeBasis: e.target.value as TeacherTimeBasis,
              })
            }
            disabled={loading}
            className="w-full h-9 px-2.5 rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] text-xs text-[#1c192c] dark:text-[#f4eeff] focus:outline-hidden focus:ring-2 focus:ring-[#7240b8]/30 cursor-pointer"
          >
            {TIME_BASIS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Timezone */}
        <div className="space-y-1">
          <label
            htmlFor="teacher-analytics-timezone"
            className="flex items-center gap-1 text-[11px] font-semibold text-[#635a72] dark:text-[#a9a0b2]"
          >
            <Globe className="w-3 h-3 text-[#7240b8] dark:text-[#a87ffb]" />
            <span>Múi giờ báo cáo</span>
          </label>
          <select
            id="teacher-analytics-timezone"
            value={filters.timezone}
            onChange={(e) =>
              onApplyFilters({
                ...filters,
                timezone: e.target.value as TeacherTimezone,
              })
            }
            disabled={loading}
            className="w-full h-9 px-2.5 rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] text-xs text-[#1c192c] dark:text-[#f4eeff] focus:outline-hidden focus:ring-2 focus:ring-[#7240b8]/30 cursor-pointer"
          >
            {TIMEZONE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Owned Course Filter */}
        <div className="space-y-1">
          <label
            htmlFor="teacher-analytics-course-filter"
            className="flex items-center gap-1 text-[11px] font-semibold text-[#635a72] dark:text-[#a9a0b2]"
          >
            <BookOpen className="w-3 h-3 text-[#7240b8] dark:text-[#a87ffb]" />
            <span>Lọc theo khóa học của tôi</span>
          </label>
          <select
            id="teacher-analytics-course-filter"
            value={filters.courseId}
            onChange={(e) =>
              onApplyFilters({
                ...filters,
                courseId: e.target.value,
              })
            }
            disabled={loading}
            className="w-full h-9 px-2.5 rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] text-xs text-[#1c192c] dark:text-[#f4eeff] focus:outline-hidden focus:ring-2 focus:ring-[#7240b8]/30 cursor-pointer"
          >
            <option value="">Tất cả khóa học của tôi</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
