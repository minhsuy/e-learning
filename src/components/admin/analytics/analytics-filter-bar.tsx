'use client';

import React, { useState } from 'react';
import {
  Calendar,
  Filter,
  RefreshCw,
  RotateCcw,
  SlidersHorizontal,
  AlertCircle,
  Clock,
  Globe,
} from 'lucide-react';
import {
  AdminAnalyticsFilterState,
  DEFAULT_ANALYTICS_FILTERS,
  validateAnalyticsDateRange,
} from '@/lib/admin-analytics';
import {
  AnalyticsPaymentMethodFilter,
  AnalyticsTimeBasis,
  AnalyticsTimeRange,
  AnalyticsTimezone,
} from '@/types/admin-order';
import { cn } from '@/lib/utils';

export interface FilterSelectOption {
  id: string;
  label: string;
}

interface AnalyticsFilterBarProps {
  filters: AdminAnalyticsFilterState;
  onApplyFilters: (next: AdminAnalyticsFilterState) => void;
  onResetFilters: () => void;
  onRefresh: () => void;
  loading: boolean;
  teachers: FilterSelectOption[];
  courses: FilterSelectOption[];
  lastUpdated: Date | null;
}

const PERIOD_OPTIONS: Array<{ value: AnalyticsTimeRange; label: string }> = [
  { value: '7days', label: '7 ngày' },
  { value: '30days', label: '30 ngày' },
  { value: '12months', label: '12 tháng' },
  { value: 'all', label: 'Toàn thời gian' },
  { value: 'custom', label: 'Tùy chỉnh' },
];

const PAYMENT_METHOD_OPTIONS: Array<{ value: AnalyticsPaymentMethodFilter; label: string }> = [
  { value: 'all', label: 'Tất cả phương thức' },
  { value: 'sepay_bank_transfer', label: 'SePay / VietQR' },
  { value: 'manual_bank_transfer', label: 'Chuyển khoản thủ công' },
  { value: 'free', label: 'Đơn miễn phí (0 ₫)' },
  { value: 'legacy_unknown', label: 'Dữ liệu cũ / Chưa phân loại' },
];

const TIME_BASIS_OPTIONS: Array<{ value: AnalyticsTimeBasis; label: string }> = [
  { value: 'recognizedAt', label: 'Ngày ghi nhận (recognizedAt)' },
  { value: 'paidAt', label: 'Ngày thanh toán (paidAt)' },
  { value: 'createdAt', label: 'Ngày tạo đơn (createdAt)' },
];

const TIMEZONE_OPTIONS: Array<{ value: AnalyticsTimezone; label: string }> = [
  { value: 'Asia/Ho_Chi_Minh', label: 'Việt Nam (UTC+7)' },
  { value: 'UTC', label: 'UTC (00:00)' },
];

export function AnalyticsFilterBar({
  filters,
  onApplyFilters,
  onResetFilters,
  onRefresh,
  loading,
  teachers,
  courses,
  lastUpdated,
}: AnalyticsFilterBarProps) {
  const [draftStartDate, setDraftStartDate] = useState(filters.startDate);
  const [draftEndDate, setDraftEndDate] = useState(filters.endDate);
  const [prevDates, setPrevDates] = useState({ start: filters.startDate, end: filters.endDate });
  const [dateError, setDateError] = useState<string | null>(null);

  if (prevDates.start !== filters.startDate || prevDates.end !== filters.endDate) {
    setPrevDates({ start: filters.startDate, end: filters.endDate });
    setDraftStartDate(filters.startDate);
    setDraftEndDate(filters.endDate);
  }

  const isCustomActive = filters.timeRange === 'custom';

  const hasNonDefaultFilters =
    filters.timeRange !== DEFAULT_ANALYTICS_FILTERS.timeRange ||
    filters.timeBasis !== DEFAULT_ANALYTICS_FILTERS.timeBasis ||
    filters.timezone !== DEFAULT_ANALYTICS_FILTERS.timezone ||
    filters.paymentMethod !== DEFAULT_ANALYTICS_FILTERS.paymentMethod ||
    filters.teacherId !== '' ||
    filters.courseId !== '';

  const handlePeriodClick = (period: AnalyticsTimeRange) => {
    setDateError(null);
    if (period === 'custom') {
      const today = new Date();
      const endDefault = draftEndDate || today.toISOString().slice(0, 10);
      const startObj = new Date(today.getTime() - 29 * 86_400_000);
      const startDefault = draftStartDate || startObj.toISOString().slice(0, 10);
      setDraftStartDate(startDefault);
      setDraftEndDate(endDefault);
      const check = validateAnalyticsDateRange('custom', startDefault, endDefault);
      if (check.valid) {
        onApplyFilters({
          ...filters,
          timeRange: 'custom',
          startDate: startDefault,
          endDate: endDefault,
        });
      }
      return;
    }

    onApplyFilters({
      ...filters,
      timeRange: period,
      startDate: '',
      endDate: '',
    });
  };

  const handleApplyCustomDates = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateAnalyticsDateRange('custom', draftStartDate, draftEndDate);
    if (!validation.valid) {
      setDateError(validation.error || 'Khoảng thời gian không hợp lệ.');
      return;
    }
    setDateError(null);
    onApplyFilters({
      ...filters,
      timeRange: 'custom',
      startDate: draftStartDate.trim(),
      endDate: draftEndDate.trim(),
    });
  };

  return (
    <div className="bg-white dark:bg-[#1d1926] rounded-2xl border border-[#f1ebff] dark:border-[#2b2438] p-4 sm:p-5 shadow-xs space-y-4">
      {/* Row 1: Period Pills & Refresh / Reset */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-[#635a72] dark:text-[#a9a0b2] mr-1 inline-flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#7240b8] dark:text-[#a87ffb]" />
            Chu kỳ:
          </span>
          <div
            role="group"
            aria-label="Chọn chu kỳ phân tích"
            className="inline-flex flex-wrap items-center gap-1 p-1 rounded-xl bg-[#f7f1ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438]"
          >
            {PERIOD_OPTIONS.map((opt) => {
              const active = filters.timeRange === opt.value;
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

      {/* Row 1b: Custom Date Range Form (Only submits on explicit click) */}
      {isCustomActive && (
        <form
          onSubmit={handleApplyCustomDates}
          className="p-3.5 rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-[#e6dffa] dark:border-[#2b2438] space-y-2.5"
        >
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <label
                htmlFor="analytics-start-date"
                className="block text-[11px] font-semibold text-[#635a72] dark:text-[#a9a0b2]"
              >
                Từ ngày (YYYY-MM-DD)
              </label>
              <input
                id="analytics-start-date"
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
                htmlFor="analytics-end-date"
                className="block text-[11px] font-semibold text-[#635a72] dark:text-[#a9a0b2]"
              >
                Đến ngày (YYYY-MM-DD)
              </label>
              <input
                id="analytics-end-date"
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

      {/* Row 2: Secondary Filters (Payment Method, TimeBasis, Timezone, Teacher, Course) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-3 border-t border-[#f1ebff] dark:border-[#2b2438]">
        {/* Payment Method */}
        <div className="space-y-1">
          <label
            htmlFor="analytics-payment-method"
            className="flex items-center gap-1 text-[11px] font-semibold text-[#635a72] dark:text-[#a9a0b2]"
          >
            <Filter className="w-3 h-3 text-[#7240b8] dark:text-[#a87ffb]" />
            <span>Phương thức thanh toán</span>
          </label>
          <select
            id="analytics-payment-method"
            value={filters.paymentMethod}
            onChange={(e) =>
              onApplyFilters({
                ...filters,
                paymentMethod: e.target.value as AnalyticsPaymentMethodFilter,
              })
            }
            disabled={loading}
            className="w-full h-9 px-2.5 rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] text-xs text-[#1c192c] dark:text-[#f4eeff] focus:outline-hidden focus:ring-2 focus:ring-[#7240b8]/30 cursor-pointer"
          >
            {PAYMENT_METHOD_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Time Basis */}
        <div className="space-y-1">
          <label
            htmlFor="analytics-time-basis"
            className="flex items-center gap-1 text-[11px] font-semibold text-[#635a72] dark:text-[#a9a0b2]"
          >
            <Clock className="w-3 h-3 text-[#7240b8] dark:text-[#a87ffb]" />
            <span>Cơ sở ghi nhận ngày</span>
          </label>
          <select
            id="analytics-time-basis"
            value={filters.timeBasis}
            onChange={(e) =>
              onApplyFilters({
                ...filters,
                timeBasis: e.target.value as AnalyticsTimeBasis,
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
            htmlFor="analytics-timezone"
            className="flex items-center gap-1 text-[11px] font-semibold text-[#635a72] dark:text-[#a9a0b2]"
          >
            <Globe className="w-3 h-3 text-[#7240b8] dark:text-[#a87ffb]" />
            <span>Múi giờ báo cáo</span>
          </label>
          <select
            id="analytics-timezone"
            value={filters.timezone}
            onChange={(e) =>
              onApplyFilters({
                ...filters,
                timezone: e.target.value as AnalyticsTimezone,
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

        {/* Teacher Filter (Applies to Financial Overview & Timeline) */}
        <div className="space-y-1">
          <label
            htmlFor="analytics-teacher-filter"
            className="flex items-center gap-1 text-[11px] font-semibold text-[#635a72] dark:text-[#a9a0b2]"
          >
            <SlidersHorizontal className="w-3 h-3 text-[#7240b8] dark:text-[#a87ffb]" />
            <span>Giảng viên (KPI & Biểu đồ)</span>
          </label>
          <select
            id="analytics-teacher-filter"
            value={filters.teacherId}
            onChange={(e) =>
              onApplyFilters({
                ...filters,
                teacherId: e.target.value,
              })
            }
            disabled={loading}
            className="w-full h-9 px-2.5 rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] text-xs text-[#1c192c] dark:text-[#f4eeff] focus:outline-hidden focus:ring-2 focus:ring-[#7240b8]/30 cursor-pointer"
          >
            <option value="">Tất cả giảng viên</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Course Filter (Applies to Financial Overview & Timeline) */}
        <div className="space-y-1">
          <label
            htmlFor="analytics-course-filter"
            className="flex items-center gap-1 text-[11px] font-semibold text-[#635a72] dark:text-[#a9a0b2]"
          >
            <SlidersHorizontal className="w-3 h-3 text-[#7240b8] dark:text-[#a87ffb]" />
            <span>Khóa học (KPI & Biểu đồ)</span>
          </label>
          <select
            id="analytics-course-filter"
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
            <option value="">Tất cả khóa học</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
