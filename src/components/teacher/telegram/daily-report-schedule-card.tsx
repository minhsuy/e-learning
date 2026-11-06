'use client';

import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Save,
  Loader2,
  Lock,
} from 'lucide-react';
import {
  formatNextRunDate,
  TelegramReportSchedule,
  UpdateDailySchedulePayload,
} from '@/types/telegram-schedule';

interface DailyReportScheduleCardProps {
  schedule?: TelegramReportSchedule | null;
  isTelegramLinked: boolean;
  isSaving: boolean;
  onSave: (payload: UpdateDailySchedulePayload) => Promise<boolean>;
  onConnectTelegram?: () => void;
}

const COMMON_DAILY_TIMES = ['18:00', '20:00', '20:30', '21:00', '22:00'];

export function DailyReportScheduleCard({
  schedule,
  isTelegramLinked,
  isSaving,
  onSave,
  onConnectTelegram,
}: DailyReportScheduleCardProps) {
  const [editedEnabled, setEditedEnabled] = useState<boolean | null>(null);
  const [editedTime, setEditedTime] = useState<string | null>(null);

  const isEnabled = editedEnabled !== null ? editedEnabled : (schedule?.isEnabled ?? false);
  const deliveryTime = editedTime !== null ? editedTime : (schedule?.deliveryTime || '20:00');

  const hasChanges =
    schedule !== undefined &&
    schedule !== null &&
    ((editedEnabled !== null && editedEnabled !== schedule.isEnabled) ||
      (editedTime !== null && editedTime !== (schedule.deliveryTime || '20:00')));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isTelegramLinked) {
      onConnectTelegram?.();
      return;
    }
    const success = await onSave({
      isEnabled,
      deliveryTime,
    });
    if (success) {
      setEditedEnabled(null);
      setEditedTime(null);
    }
  };

  return (
    <div className="flex flex-col justify-between p-5 rounded-2xl bg-white dark:bg-[#1d1926] border border-[#f1ebff] dark:border-[#2f2742] shadow-xs transition-all hover:border-purple-200 dark:hover:border-purple-900/40">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Card Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-[#7240b8] dark:text-[#a87ffb] flex items-center justify-center shrink-0 border border-purple-100 dark:border-purple-900/40">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#1c192c] dark:text-[#f4eeff]">
                  Báo cáo hằng ngày
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
                Tự động nhận thống kê kinh doanh mỗi ngày qua Telegram
              </p>
            </div>
          </div>
        </div>

        {/* Toggle Switch */}
        <div className="p-3.5 rounded-xl bg-[#faf7fd] dark:bg-[#251e30] border border-[#f1ebff] dark:border-[#352e43] flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <label
              htmlFor="daily-toggle"
              className="text-xs font-semibold text-[#1c192c] dark:text-[#f4eeff] cursor-pointer"
            >
              Bật báo cáo hằng ngày
            </label>
            <p className="text-[11px] text-[#635a72] dark:text-[#a9a0b2]">
              Gửi tóm tắt doanh thu, đơn hàng &amp; học viên mới hôm nay
            </p>
          </div>

          <button
            type="button"
            id="daily-toggle"
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

        {/* Delivery Time Selection */}
        <div className="space-y-2">
          <label
            htmlFor="daily-time-input"
            className="flex items-center justify-between text-xs font-semibold text-[#1c192c] dark:text-[#f4eeff]"
          >
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#7240b8] dark:text-[#a87ffb]" />
              <span>Giờ nhận báo cáo</span>
            </span>
            <span className="text-[11px] text-[#8c8296] dark:text-[#968b9f] font-normal">
              Múi giờ: Asia/Ho_Chi_Minh (UTC+7)
            </span>
          </label>

          <div className="flex items-center gap-2">
            <input
              type="time"
              id="daily-time-input"
              value={deliveryTime}
              disabled={!isTelegramLinked || isSaving}
              onChange={(e) => setEditedTime(e.target.value)}
              className="w-36 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-white dark:bg-[#1d1926] border border-[#dcd6e8] dark:border-[#3d344d] text-[#1c192c] dark:text-[#f4eeff] focus:outline-none focus:ring-2 focus:ring-[#7240b8] disabled:opacity-50 disabled:bg-slate-50 dark:disabled:bg-slate-900"
            />

            {/* Quick preset chips */}
            <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto">
              {COMMON_DAILY_TIMES.map((time) => (
                <button
                  key={time}
                  type="button"
                  disabled={!isTelegramLinked || isSaving}
                  onClick={() => setEditedTime(time)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer disabled:opacity-40 ${
                    deliveryTime === time
                      ? 'bg-[#7240b8] text-white font-bold'
                      : 'bg-purple-50 dark:bg-purple-950/40 text-[#7240b8] dark:text-[#a87ffb] hover:bg-purple-100 dark:hover:bg-purple-900/60'
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>
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
                ? 'bg-[#7240b8] hover:bg-[#854ecc] text-white shadow-purple-600/20 active:scale-[0.98]'
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

