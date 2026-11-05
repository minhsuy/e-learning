'use client';

import React from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Unlink,
  Loader2,
  Calendar,
  User,
} from 'lucide-react';
import { TelegramIcon } from './telegram-icon';
import { TelegramLinkModal } from './telegram-link-modal';
import { TelegramUnlinkDialog } from './telegram-unlink-dialog';
import { useTeacherTelegram } from '@/hooks/use-teacher-telegram';

interface TeacherTelegramCardProps {
  className?: string;
}

function formatLinkedDate(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

export function TeacherTelegramCard({ className = '' }: TeacherTelegramCardProps) {
  const {
    status,
    isLoadingStatus,
    isGeneratingToken,
    isUnlinking,
    linkData,
    isModalOpen,
    isConfirmUnlinkOpen,
    openLinkModal,
    closeLinkModal,
    openConfirmUnlink,
    closeConfirmUnlink,
    unlink,
  } = useTeacherTelegram();

  // Skeleton state while initial status is loading
  if (isLoadingStatus && !status) {
    return (
      <div
        className={`w-full p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#1d1926] border border-[#f1ebff] dark:border-[#2f2742] shadow-xs flex items-center justify-between gap-4 animate-pulse ${className}`}
      >
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#f0ebf8] dark:bg-[#2b2438]" />
          <div className="space-y-2">
            <div className="h-4 bg-[#f0ebf8] dark:bg-[#2b2438] rounded-md w-36" />
            <div className="h-3 bg-[#f0ebf8] dark:bg-[#2b2438] rounded-md w-64" />
          </div>
        </div>
        <div className="h-9 bg-[#f0ebf8] dark:bg-[#2b2438] rounded-xl w-32" />
      </div>
    );
  }

  const isLinked = Boolean(status?.isLinked && status?.account);
  const account = status?.account;

  const displayName = account?.telegramUsername
    ? `@${account.telegramUsername}`
    : account?.telegramFirstName
    ? account.telegramFirstName
    : `ID: ${account?.telegramUserId || 'Đã liên kết'}`;

  return (
    <>
      <section
        aria-label="Kết nối Telegram"
        className={`w-full p-4 sm:p-5 rounded-2xl transition-all shadow-xs border ${
          isLinked
            ? 'bg-gradient-to-r from-emerald-50/70 via-white to-teal-50/40 dark:from-emerald-950/20 dark:via-[#1d1926] dark:to-teal-950/10 border-emerald-200/80 dark:border-emerald-900/40'
            : 'bg-white dark:bg-[#1d1926] border-[#f1ebff] dark:border-[#2f2742]'
        } ${className}`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Left Block: Icon & Information */}
          <div className="flex items-start sm:items-center gap-3.5">
            <div
              className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs transition-colors ${
                isLinked
                  ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-sky-50 dark:bg-sky-950/40 text-[#24A1DE] border border-sky-100 dark:border-sky-900/40'
              }`}
            >
              {isLinked ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <TelegramIcon size={24} className="text-[#24A1DE]" />
              )}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-[#1c192c] dark:text-[#f4eeff]">
                  {isLinked ? 'Đã kết nối Telegram Bot' : 'Kết nối Telegram'}
                </h3>

                {/* Status Badges */}
                {isLinked ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Đã liên kết</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    <AlertCircle className="w-3 h-3 text-slate-400" />
                    <span>Chưa liên kết</span>
                  </span>
                )}
              </div>

              {isLinked ? (
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#635a72] dark:text-[#a9a0b2]">
                  <span className="inline-flex items-center gap-1 font-medium text-[#1c192c] dark:text-[#f4eeff]">
                    <User className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>{displayName}</span>
                  </span>

                  {account?.linkedAt && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                      <Calendar className="w-3.5 h-3.5 opacity-70" />
                      <span>Liên kết từ: {formatLinkedDate(account.linkedAt)}</span>
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-xs text-[#635a72] dark:text-[#a9a0b2] max-w-xl">
                  Liên kết Telegram để nhận báo cáo doanh thu, đơn hàng mới và thống kê học viên tự động.
                </p>
              )}
            </div>
          </div>

          {/* Right Block: Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center w-full sm:w-auto">
            {isLinked ? (
              <button
                type="button"
                onClick={openConfirmUnlink}
                disabled={isUnlinking}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 bg-white dark:bg-[#1d1926] border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors shadow-2xs cursor-pointer disabled:opacity-60"
              >
                <Unlink className="w-3.5 h-3.5" />
                <span>Hủy liên kết</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={openLinkModal}
                disabled={isGeneratingToken}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-[#24A1DE] hover:bg-[#1f8ec4] active:scale-[0.98] transition-all shadow-sm shadow-[#24A1DE]/25 disabled:opacity-60 cursor-pointer"
              >
                {isGeneratingToken ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang tạo mã...</span>
                  </>
                ) : (
                  <>
                    <TelegramIcon size={16} className="text-white" />
                    <span>Liên kết Telegram</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Linking Modal */}
      <TelegramLinkModal
        isOpen={isModalOpen}
        linkData={linkData}
        isLoadingNewToken={isGeneratingToken}
        onClose={closeLinkModal}
        onRegenerateToken={openLinkModal}
      />

      {/* Unlink Confirmation Dialog */}
      <TelegramUnlinkDialog
        isOpen={isConfirmUnlinkOpen}
        account={account || null}
        isUnlinking={isUnlinking}
        onClose={closeConfirmUnlink}
        onConfirm={unlink}
      />
    </>
  );
}
