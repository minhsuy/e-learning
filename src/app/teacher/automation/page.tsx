'use client';

import React, { useState } from 'react';
import {
  Bot,
  RefreshCw,
  AlertCircle,
  Clock,
  BellRing,
  PauseCircle,
  CalendarCheck,
  AlertTriangle,
  Link as LinkIcon,
} from 'lucide-react';
import { useTelegramSchedules } from '@/hooks/use-telegram-schedules';
import { TeacherTelegramCard } from '@/components/teacher/telegram/teacher-telegram-card';
import { DailyReportScheduleCard } from '@/components/teacher/telegram/daily-report-schedule-card';
import { WeeklyReportScheduleCard } from '@/components/teacher/telegram/weekly-report-schedule-card';
import { TelegramPauseDialog } from '@/components/teacher/telegram/telegram-pause-dialog';
import { TelegramIcon } from '@/components/teacher/telegram/telegram-icon';
import { formatNextRunDate, TelegramReportSchedule } from '@/types/telegram-schedule';

/**
 * Computes the earliest next scheduled run from Daily and Weekly schedules.
 */
function getEarliestNextRun(
  daily?: TelegramReportSchedule,
  weekly?: TelegramReportSchedule
): { isoString: string; label: string } | null {
  const candidates: { date: Date; isoString: string; label: string }[] = [];

  if (daily?.isEnabled && daily.nextRunAt) {
    const d = new Date(daily.nextRunAt);
    if (!isNaN(d.getTime())) {
      candidates.push({ date: d, isoString: daily.nextRunAt, label: 'Hằng ngày' });
    }
  }

  if (weekly?.isEnabled && weekly.nextRunAt) {
    const d = new Date(weekly.nextRunAt);
    if (!isNaN(d.getTime())) {
      candidates.push({ date: d, isoString: weekly.nextRunAt, label: 'Hằng tuần' });
    }
  }

  if (candidates.length === 0) return null;
  candidates.sort((a, b) => a.date.getTime() - b.date.getTime());
  return { isoString: candidates[0].isoString, label: candidates[0].label };
}

export default function TeacherAutomationPage() {
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

  // Derived states
  const isLinked = Boolean(schedules?.isTelegramLinked);
  const daily = schedules?.daily;
  const weekly = schedules?.weekly;

  const activeCount = (daily?.isEnabled ? 1 : 0) + (weekly?.isEnabled ? 1 : 0);
  const anyScheduleActive = activeCount > 0;
  const earliestNextRun = getEarliestNextRun(daily, weekly);

  const handleScrollToTelegramCard = () => {
    const el = document.getElementById('teacher-telegram-card');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
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

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6 sm:space-y-8">
      {/* ================= PAGE HEADER BANNER ================= */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#7240b8] via-[#854ecc] to-[#5b27a1] text-white p-6 sm:p-8 shadow-sm">
        <div className="relative z-10 max-w-3xl space-y-3.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-purple-100 border border-white/20">
            <Bot className="w-3.5 h-3.5 text-amber-300" />
            <span>Trung tâm Tự động hóa • Automation Center</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Tự động hóa
          </h1>

          <p className="text-sm sm:text-base text-purple-100/90 leading-relaxed">
            Quản lý các tác vụ, báo cáo và thông báo tự động dành cho giảng viên. Hệ thống tự động gửi phân tích kinh doanh, học viên và nhận định AI Gemini trực tiếp qua Telegram theo lịch định sẵn.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void fetchSchedules(false)}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-[#7240b8] font-bold text-xs sm:text-sm hover:bg-purple-50 transition-colors shadow-sm active:scale-[0.98] disabled:opacity-60 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Làm mới dữ liệu</span>
            </button>

            <button
              type="button"
              disabled={!isLinked || !anyScheduleActive || isPausing}
              onClick={() => setIsPauseDialogOpen(true)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors border active:scale-[0.98] ${
                isLinked && anyScheduleActive
                  ? 'bg-white/15 hover:bg-white/25 text-white border-white/25 cursor-pointer'
                  : 'bg-white/5 text-purple-200/50 border-white/10 cursor-not-allowed opacity-50'
              }`}
            >
              <PauseCircle className="w-4 h-4" />
              <span>Tạm dừng tất cả</span>
            </button>
          </div>
        </div>

        {/* Ambient Decorative Accents */}
        <div className="absolute -right-8 -bottom-12 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute right-20 top-4 w-32 h-32 rounded-full bg-amber-400/10 blur-xl pointer-events-none" />
      </section>

      {/* ================= ERROR STATE BANNER ================= */}
      {error && !schedules && (
        <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/80 dark:bg-rose-950/20 flex items-center justify-between gap-3 text-rose-800 dark:text-rose-300">
          <div className="flex items-center gap-3 text-xs sm:text-sm">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => void fetchSchedules(false)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-[#1d1926] text-rose-700 dark:text-rose-300 text-xs font-semibold shadow-xs hover:bg-rose-50 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Thử lại</span>
          </button>
        </div>
      )}

      {/* ================= SECTION C: AUTOMATION OVERVIEW (3 SUMMARY CARDS) ================= */}
      <section aria-label="Tổng quan tự động hóa">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          {/* Card 1: Telegram Status */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#1d1926] border border-[#f1ebff] dark:border-[#2f2742] shadow-xs flex flex-col justify-between space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-[#24A1DE] flex items-center justify-center shrink-0 border border-sky-100 dark:border-sky-900/40">
                <TelegramIcon size={22} className="text-[#24A1DE]" />
              </div>

              {isLinked ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Đã kết nối</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  <span>Chưa liên kết</span>
                </span>
              )}
            </div>

            <div>
              <p className="text-xs font-semibold text-[#7c7483] dark:text-[#968e9e] uppercase tracking-wider">
                Trạng thái Telegram
              </p>
              <h2 className="text-lg sm:text-xl font-extrabold text-[#1c192c] dark:text-[#f4eeff] mt-1 truncate">
                {isLinked
                  ? schedules?.telegramUsername
                    ? `@${schedules.telegramUsername}`
                    : 'Đã liên kết'
                  : 'Chưa liên kết'}
              </h2>
              <p className="text-xs text-[#635a72] dark:text-[#a9a0b2] mt-1">
                {isLinked
                  ? 'Sẵn sàng nhận thông báo và báo cáo tự động'
                  : 'Cần kết nối Telegram để kích hoạt gửi báo cáo'}
              </p>
            </div>
          </div>

          {/* Card 2: Active Schedules Count */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#1d1926] border border-[#f1ebff] dark:border-[#2f2742] shadow-xs flex flex-col justify-between space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-[#7240b8] dark:text-[#a87ffb] flex items-center justify-center shrink-0 border border-purple-100 dark:border-purple-900/40">
                <BellRing className="w-5 h-5" />
              </div>

              {anyScheduleActive ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{activeCount}/2 Đang bật</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  <span>Tất cả tắt</span>
                </span>
              )}
            </div>

            <div>
              <p className="text-xs font-semibold text-[#7c7483] dark:text-[#968e9e] uppercase tracking-wider">
                Lịch báo cáo hoạt động
              </p>
              <h2 className="text-lg sm:text-xl font-extrabold text-[#1c192c] dark:text-[#f4eeff] mt-1">
                {activeCount === 2
                  ? '2 / 2 Báo cáo'
                  : activeCount === 1
                  ? '1 / 2 Báo cáo'
                  : 'Đang tạm dừng'}
              </h2>
              <p className="text-xs text-[#635a72] dark:text-[#a9a0b2] mt-1">
                {daily?.isEnabled && weekly?.isEnabled
                  ? 'Cả báo cáo hằng ngày và hằng tuần đang hoạt động'
                  : daily?.isEnabled
                  ? 'Chỉ báo cáo hằng ngày đang hoạt động'
                  : weekly?.isEnabled
                  ? 'Chỉ báo cáo hằng tuần đang hoạt động'
                  : 'Chưa có lịch báo cáo tự động nào được bật'}
              </p>
            </div>
          </div>

          {/* Card 3: Next Scheduled Delivery */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#1d1926] border border-[#f1ebff] dark:border-[#2f2742] shadow-xs flex flex-col justify-between space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 border border-teal-100 dark:border-teal-900/40">
                <Clock className="w-5 h-5" />
              </div>

              {earliestNextRun ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                  <CalendarCheck className="w-3 h-3" />
                  <span>{earliestNextRun.label}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  <span>Không có</span>
                </span>
              )}
            </div>

            <div>
              <p className="text-xs font-semibold text-[#7c7483] dark:text-[#968e9e] uppercase tracking-wider">
                Lần gửi tiếp theo
              </p>
              <h2 className="text-base sm:text-lg font-extrabold text-[#1c192c] dark:text-[#f4eeff] mt-1 truncate">
                {earliestNextRun
                  ? formatNextRunDate(earliestNextRun.isoString)
                  : 'Chưa có lịch'}
              </h2>
              <p className="text-xs text-[#635a72] dark:text-[#a9a0b2] mt-1">
                {earliestNextRun
                  ? 'Gửi tự động theo múi giờ Việt Nam (UTC+7)'
                  : 'Bật lịch để hệ thống tự động lên lịch gửi'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= SECTION A: TELEGRAM CONNECTION (TG-02B) ================= */}
      <section aria-labelledby="telegram-section-heading" className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-950/50 text-[#7240b8] dark:text-[#a87ffb] flex items-center justify-center font-bold text-xs">
            1
          </div>
          <div>
            <h2
              id="telegram-section-heading"
              className="text-base sm:text-lg font-bold text-[#1c192c] dark:text-[#f4eeff]"
            >
              Liên kết tài khoản Telegram
            </h2>
            <p className="text-xs text-[#635a72] dark:text-[#a9a0b2]">
              Kết nối tài khoản Telegram cá nhân với TMdemy Teacher Bot để nhận thông báo tức thời.
            </p>
          </div>
        </div>

        {/* Existing TG-02B Linking Card */}
        <TeacherTelegramCard />
      </section>

      {/* ================= SECTION B: AUTOMATED REPORTS SCHEDULING (TG-05) ================= */}
      <section aria-labelledby="schedules-section-heading" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-950/50 text-[#7240b8] dark:text-[#a87ffb] flex items-center justify-center font-bold text-xs">
              2
            </div>
            <div>
              <h2
                id="schedules-section-heading"
                className="text-base sm:text-lg font-bold text-[#1c192c] dark:text-[#f4eeff]"
              >
                Cấu hình lịch báo cáo tự động
              </h2>
              <p className="text-xs text-[#635a72] dark:text-[#a9a0b2]">
                Tự động gửi thông báo tổng kết doanh thu và học viên định kỳ theo giờ Việt Nam (UTC+7).
              </p>
            </div>
          </div>

          {/* Quick Pause Action */}
          <button
            type="button"
            disabled={!isLinked || !anyScheduleActive || isPausing}
            onClick={() => setIsPauseDialogOpen(true)}
            className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all self-start sm:self-auto cursor-pointer ${
              anyScheduleActive && isLinked
                ? 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 border border-amber-200 dark:border-amber-900/50 shadow-2xs active:scale-[0.98]'
                : 'text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 cursor-not-allowed opacity-60'
            }`}
          >
            <PauseCircle className="w-3.5 h-3.5" />
            <span>Tạm dừng tất cả báo cáo</span>
          </button>
        </div>

        {/* Unlinked Banner Warning */}
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
              onClick={handleScrollToTelegramCard}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer"
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span>Liên kết Telegram ngay</span>
            </button>
          </div>
        )}

        {/* Section B Grid: Daily & Weekly Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 items-stretch">
          <DailyReportScheduleCard
            schedule={daily}
            isTelegramLinked={isLinked}
            isSaving={isSavingDaily}
            onSave={updateDaily}
            onConnectTelegram={handleScrollToTelegramCard}
          />

          <WeeklyReportScheduleCard
            schedule={weekly}
            isTelegramLinked={isLinked}
            isSaving={isSavingWeekly}
            onSave={updateWeekly}
            onConnectTelegram={handleScrollToTelegramCard}
          />
        </div>
      </section>

      {/* Confirmation Dialog for Pausing All Reports */}
      <TelegramPauseDialog
        isOpen={isPauseDialogOpen}
        isPausing={isPausing}
        onClose={() => setIsPauseDialogOpen(false)}
        onConfirm={handleConfirmPause}
      />
    </div>
  );
}
