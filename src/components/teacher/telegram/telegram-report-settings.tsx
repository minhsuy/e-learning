'use client';

import React, { useState } from 'react';
import {
  BellRing,
  PauseCircle,
  RefreshCw,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Link as LinkIcon,
} from 'lucide-react';
import { DailyReportScheduleCard } from './daily-report-schedule-card';
import { WeeklyReportScheduleCard } from './weekly-report-schedule-card';
import { TelegramPauseDialog } from './telegram-pause-dialog';
import { useTelegramSchedules } from '@/hooks/use-telegram-schedules';

interface TelegramReportSettingsProps {
  className?: string;
}

export function TelegramReportSettings({ className = '' }: TelegramReportSettingsProps) {
  const {
    schedules,
    isLoading,
    isSavingDaily,
    isSavingWeekly,
    isPausing,
    error,
    fetchSchedules,
    updateDaily,
    updateWeekly,
    pauseAll,
  } = useTelegramSchedules();

  const [isPauseDialogOpen, setIsPauseDialogOpen] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  const handleScrollToLinkCard = () => {
    const el = document.getElementById('teacher-telegram-card');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Add a quick pulse effect to draw attention
      el.classList.add('ring-2', 'ring-[#24A1DE]', 'ring-offset-2');
      setTimeout(() => {
        el.classList.remove('ring-2', 'ring-[#24A1DE]', 'ring-offset-2');
      }, 2000);
    }
  };

  const handleConfirmPause = async (): Promise<boolean> => {
    const success = await pauseAll();
    if (success) {
      setIsPauseDialogOpen(false);
    }
    return success;
  };

  // Skeleton loading state
  if (isLoading && !schedules) {
    return (
      <section
        aria-label="Cài đặt lịch báo cáo Telegram"
        className={`w-full p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#1d1926] border border-[#f1ebff] dark:border-[#2f2742] shadow-xs space-y-4 animate-pulse ${className}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#f0ebf8] dark:bg-[#2b2438]" />
            <div className="space-y-1.5">
              <div className="h-4 bg-[#f0ebf8] dark:bg-[#2b2438] rounded-md w-48" />
              <div className="h-3 bg-[#f0ebf8] dark:bg-[#2b2438] rounded-md w-72" />
            </div>
          </div>
          <div className="h-8 bg-[#f0ebf8] dark:bg-[#2b2438] rounded-lg w-28" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
          <div className="h-56 rounded-2xl bg-[#f8f5fd] dark:bg-[#231b2e]" />
          <div className="h-56 rounded-2xl bg-[#f8f5fd] dark:bg-[#231b2e]" />
        </div>
      </section>
    );
  }

  // Error state
  if (error && !schedules) {
    return (
      <section
        aria-label="Lỗi tải lịch báo cáo Telegram"
        className={`w-full p-4 sm:p-5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 flex items-center justify-between gap-4 ${className}`}
      >
        <div className="flex items-center gap-3 text-xs sm:text-sm text-rose-800 dark:text-rose-300">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
        <button
          type="button"
          onClick={() => void fetchSchedules()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#1d1926] border border-rose-200 dark:border-rose-800 text-xs font-semibold text-rose-700 dark:text-rose-300 hover:bg-rose-50 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Thử lại</span>
        </button>
      </section>
    );
  }

  const isLinked = Boolean(schedules?.isTelegramLinked);
  const daily = schedules?.daily;
  const weekly = schedules?.weekly;

  const anyScheduleActive = Boolean(daily?.isEnabled || weekly?.isEnabled);

  return (
    <section
      aria-label="Cài đặt lịch báo cáo tự động Telegram"
      className={`w-full rounded-2xl bg-white dark:bg-[#1d1926] border border-[#f1ebff] dark:border-[#2f2742] shadow-xs overflow-hidden transition-all ${className}`}
    >
      {/* Header Bar */}
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#f7f1ff] dark:border-[#2b2438]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7240b8] to-[#8f5ee0] text-white flex items-center justify-center shrink-0 shadow-xs">
            <BellRing className="w-5 h-5" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-[#1c192c] dark:text-[#f4eeff]">
                Cài đặt Báo cáo Tự động Telegram
              </h2>

              {/* Status summary badges */}
              {isLinked ? (
                anyScheduleActive ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Đang hoạt động</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    Đang tạm dừng
                  </span>
                )
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                  <span>Chưa kết nối Telegram</span>
                </span>
              )}
            </div>

            <p className="text-xs text-[#635a72] dark:text-[#a9a0b2] mt-0.5">
              Tự động gửi thông báo tổng kết doanh thu và học viên định kỳ theo giờ Việt Nam (UTC+7)
            </p>
          </div>
        </div>

        {/* Right utility buttons: Refresh & Expand/Collapse */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            type="button"
            onClick={() => void fetchSchedules()}
            disabled={isLoading}
            title="Làm mới lịch báo cáo"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#eceaf3] dark:border-[#352e43] hover:bg-[#faf7fd] dark:hover:bg-[#282136] text-xs font-semibold text-[#635a72] dark:text-[#a9a0b2] transition-colors cursor-pointer"
          >
            <span>{isExpanded ? 'Thu gọn' : 'Chi tiết'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expandable Content Area */}
      {isExpanded && (
        <div className="p-4 sm:p-6 space-y-5">
          {/* Unlinked Banner Alert */}
          {!isLinked && (
            <div className="p-4 rounded-xl bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900 dark:text-amber-200">
              <div className="flex items-start sm:items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
                <div className="space-y-0.5 text-xs sm:text-sm">
                  <p className="font-bold">Chưa kết nối tài khoản Telegram</p>
                  <p className="text-xs text-amber-800/90 dark:text-amber-300/80">
                    Bạn cần liên kết tài khoản Giảng viên với Bot Telegram trước khi có thể bật lịch nhận báo cáo tự động.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleScrollToLinkCard}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer"
              >
                <LinkIcon className="w-3.5 h-3.5" />
                <span>Liên kết Telegram ngay</span>
              </button>
            </div>
          )}

          {/* Section B & C Grid: Daily & Weekly Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 items-stretch">
            {/* Section B: Daily Report Card */}
            <DailyReportScheduleCard
              schedule={daily}
              isTelegramLinked={isLinked}
              isSaving={isSavingDaily}
              onSave={updateDaily}
              onConnectTelegram={handleScrollToLinkCard}
            />

            {/* Section C: Weekly Report Card */}
            <WeeklyReportScheduleCard
              schedule={weekly}
              isTelegramLinked={isLinked}
              isSaving={isSavingWeekly}
              onSave={updateWeekly}
              onConnectTelegram={handleScrollToLinkCard}
            />
          </div>

          {/* Section D: Pause All Reports & Global Notes */}
          <div className="pt-3 border-t border-[#f1ebff] dark:border-[#2f2742] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 text-xs text-[#8c8296] dark:text-[#968b9f]">
              <Sparkles className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              <span>
                Báo cáo tự động bao gồm nhận định nhanh từ AI Gemini giúp tối ưu hiệu quả khóa học.
              </span>
            </div>

            {/* Pause All Action Button */}
            <button
              type="button"
              disabled={!isLinked || !anyScheduleActive || isPausing}
              onClick={() => setIsPauseDialogOpen(true)}
              className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                anyScheduleActive && isLinked
                  ? 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 border border-amber-200 dark:border-amber-900/50 shadow-2xs active:scale-[0.98]'
                  : 'text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 cursor-not-allowed opacity-60'
              }`}
            >
              <PauseCircle className="w-3.5 h-3.5" />
              <span>Tạm dừng tất cả báo cáo</span>
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Pausing All Reports */}
      <TelegramPauseDialog
        isOpen={isPauseDialogOpen}
        isPausing={isPausing}
        onClose={() => setIsPauseDialogOpen(false)}
        onConfirm={handleConfirmPause}
      />
    </section>
  );
}

