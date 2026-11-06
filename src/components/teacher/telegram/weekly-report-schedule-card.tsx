'use client';

import React, { useState } from 'react';
import {
  BarChart3,
  CheckCircle2,
  AlertCircle,
  Save,
  Loader2,
  Lock,
} from 'lucide-react';
import {
  DAY_OF_WEEK_OPTIONS,
  formatNextRunDate,
  TelegramReportSchedule,
  UpdateWeeklySchedulePayload,
} from '@/types/telegram-schedule';

interface WeeklyReportScheduleCardProps {
  schedule?: TelegramReportSchedule | null;
  isTelegramLinked: boolean;
  isSaving: boolean;
  onSave: (payload: UpdateWeeklySchedulePayload) => Promise<boolean>;
  onConnectTelegram?: () => void;
}

const COMMON_WEEKLY_TIMES = ['07:00', '08:00', '09:00', '18:00', '20:00'];

export function WeeklyReportScheduleCard({
  schedule,
  isTelegramLinked,
  isSaving,
  onSave,
  onConnectTelegram,
}: WeeklyReportScheduleCardProps) {
  const [editedEnabled, setEditedEnabled] = useState<boolean | null>(null);
  const [editedDayOfWeek, setEditedDayOfWeek] = useState<number | null>(null);
  const [editedTime, setEditedTime] = useState<string | null>(null);

  const isEnabled = editedEnabled !== null ? editedEnabled : (schedule?.isEnabled ?? false);
  const dayOfWeek = editedDayOfWeek !== null ? editedDayOfWeek : (schedule?.dayOfWeek ?? 1);
  const deliveryTime = editedTime !== null ? editedTime : (schedule?.deliveryTime || '08:00');

  const hasChanges =
    schedule !== undefined &&
    schedule !== null &&
    ((editedEnabled !== null && editedEnabled !== schedule.isEnabled) ||
      (editedDayOfWeek !== null && editedDayOfWeek !== (schedule.dayOfWeek ?? 1)) ||
      (editedTime !== null && editedTime !== (schedule.deliveryTime || '08:00')));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isTelegramLinked) {
      onConnectTelegram?.();
      return;
    }
    const success = await onSave({
      isEnabled,
      dayOfWeek,
      deliveryTime,
    });
    if (success) {
      setEditedEnabled(null);
      setEditedDayOfWeek(null);
      setEditedTime(null);
    }
  };

  return (
    <div className="flex flex-col justify-between p-5 rounded-2xl bg-white dark:bg-[#1d1926] border border-[#f1ebff] dark:border-[#2f2742] shadow-xs transition-all hover:border-purple-200 dark:hover:border-purple-900/40">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Card Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-900/40">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#1c192c] dark:text-[#f4eeff]">
                  Báo cáo hằng tuần
                </h3>
                {schedule?.isEnabled ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    Đang bật
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    Đang tắt
                  </span>
                )}
              </div>
              <p className="text-xs text-[#635a72] dark:text-[#a9a0b2] mt-0.5">
                Nhận tổng kết doanh thu, đơn hàng và so sánh tăng trưởng tuần
              </p>
            </div>
          </div>
        </div>

        {/* Toggle Switch */}
        <div className="p-3.5 rounded-xl bg-[#faf7fd] dark:bg-[#251e30] border border-[#f1ebff] dark:border-[#352e43] flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <label
              htmlFor="weekly-toggle"
              className="text-xs font-semibold text-[#1c192c] dark:text-[#f4eeff] cursor-pointer"
            >
              Bật báo cáo hằng tuần
            </label>
            <p className="text-[11px] text-[#635a72] dark:text-[#a9a0b2]">
              Tự động gửi đánh giá hiệu suất so với tuần trước kèm gợi ý AI
            </p>
          </div>

          <button
            type="button"
            id="weekly-toggle"
            role="switch"
            aria-checked={isEnabled}
            disabled={!isTelegramLinked || isSaving}
            onClick={() => setEditedEnabled(!isEnabled)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#7240b8] focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed ${
              isEnabled ? 'bg-[#7240b8]' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                isEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Day of Week & Delivery Time Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Day of week */}
          <div className="space-y-1.5">
            <label
              htmlFor="weekly-day-select"
              className="text-xs font-semibold text-[#1c192c] dark:text-[#f4eeff]"
            >
              Ngày gửi báo cáo
            </label>
            <select
              id="weekly-day-select"
              value={dayOfWeek}
              disabled={!isTelegramLinked || isSaving}
              onChange={(e) => setEditedDayOfWeek(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-white dark:bg-[#1d1926] border border-[#dcd6e8] dark:border-[#3d344d] text-[#1c192c] dark:text-[#f4eeff] focus:outline-none focus:ring-2 focus:ring-[#7240b8] disabled:opacity-50 disabled:bg-slate-50 dark:disabled:bg-slate-900 cursor-pointer"
            >
              {DAY_OF_WEEK_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label} ({opt.shortLabel})
                </option>
              ))}
            </select>
          </div>

          {/* Delivery time */}
          <div className="space-y-1.5">
            <label
              htmlFor="weekly-time-input"
              className="flex items-center justify-between text-xs font-semibold text-[#1c192c] dark:text-[#f4eeff]"
            >
              <span>Giờ gửi</span>
              <span className="text-[10px] text-[#8c8296] dark:text-[#968b9f] font-normal">
                UTC+7
              </span>
            </label>
            <input
              type="time"
              id="weekly-time-input"
              value={deliveryTime}
              disabled={!isTelegramLinked || isSaving}
              onChange={(e) => setEditedTime(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-white dark:bg-[#1d1926] border border-[#dcd6e8] dark:border-[#3d344d] text-[#1c192c] dark:text-[#f4eeff] focus:outline-none focus:ring-2 focus:ring-[#7240b8] disabled:opacity-50 disabled:bg-slate-50 dark:disabled:bg-slate-900"
            />
          </div>
        </div>

        {/* Quick preset chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-[11px]">
          <span className="text-[#8c8296] dark:text-[#968b9f] text-[10px] shrink-0">Gợi ý giờ:</span>
          {COMMON_WEEKLY_TIMES.map((time) => (
            <button
              key={time}
              type="button"
              disabled={!isTelegramLinked || isSaving}
              onClick={() => setEditedTime(time)}
              className={`px-2 py-0.5 rounded-lg transition-colors cursor-pointer disabled:opacity-40 ${
                deliveryTime === time
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60'
              }`}
            >
              {time}
            </button>
          ))}
        </div>

        {/* Schedule Delivery Info */}
        <div className="pt-2 border-t border-[#f1ebff] dark:border-[#2f2742] space-y-1.5 text-xs text-[#635a72] dark:text-[#a9a0b2]">
          <div className="flex items-center justify-between">
            <span className="font-medium">Lần gửi tiếp theo:</span>
            <span className="font-semibold text-[#1c192c] dark:text-[#f4eeff]">
              {isEnabled ? formatNextRunDate(schedule?.nextRunAt) : 'Đang tạm dừng'}
            </span>
          </div>

          {schedule?.lastRunAt && (
            <div className="flex items-center justify-between text-[11px]">
              <span className="opacity-80">Lần gửi gần nhất:</span>
              <span className="inline-flex items-center gap-1">
                {schedule.lastStatus === 'SUCCESS' ? (
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                ) : schedule.lastStatus === 'FAILED' ? (
                  <AlertCircle className="w-3 h-3 text-rose-600" />
                ) : null}
                <span>{formatNextRunDate(schedule.lastRunAt)}</span>
              </span>
            </div>
          )}
        </div>

        {/* Unlinked Notice if Applicable */}
        {!isTelegramLinked && (
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 flex items-center justify-between gap-2 text-xs text-amber-800 dark:text-amber-300">
            <div className="flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Cần liên kết Telegram để bật lịch</span>
            </div>
            {onConnectTelegram && (
              <button
                type="button"
                onClick={onConnectTelegram}
                className="font-bold underline hover:text-amber-900 cursor-pointer text-[11px]"
              >
                Liên kết ngay
              </button>
            )}
          </div>
        )}

        {/* Action Button */}
        <div className="pt-1 flex items-center justify-end">
          <button
            type="submit"
            disabled={!isTelegramLinked || isSaving || !hasChanges}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
              hasChanges && isTelegramLinked
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20 active:scale-[0.98]'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-slate-700'
            }`}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>{hasChanges ? 'Lưu thay đổi' : 'Đã đồng bộ'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

