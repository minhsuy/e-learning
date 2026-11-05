'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';
import { TelegramAccount } from '@/types/telegram';

interface TelegramUnlinkDialogProps {
  isOpen: boolean;
  account: TelegramAccount | null;
  isUnlinking: boolean;
  onClose: () => void;
  onConfirm: () => Promise<boolean>;
}

export function TelegramUnlinkDialog({
  isOpen,
  account,
  isUnlinking,
  onClose,
  onConfirm,
}: TelegramUnlinkDialogProps) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isUnlinking) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isUnlinking, onClose]);

  if (!isOpen) return null;

  const displayName = account?.telegramUsername
    ? `@${account.telegramUsername}`
    : account?.telegramFirstName || `ID: ${account?.telegramUserId || 'Chưa rõ'}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={() => {
        if (!isUnlinking) onClose();
      }}
      role="presentation"
    >
      <div
        className="w-full max-w-md rounded-2xl border border-[#eceaf3] dark:border-[#352e43] bg-white dark:bg-[#1d1926] p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="unlink-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-200 dark:border-rose-900/40">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="unlink-dialog-title"
                className="text-base font-bold text-[#1c192c] dark:text-[#f4eeff]"
              >
                Hủy liên kết Telegram?
              </h2>
              <p className="text-xs text-[#635a72] dark:text-[#a9a0b2]">
                Tài khoản: <span className="font-semibold text-rose-600 dark:text-rose-400">{displayName}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isUnlinking}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-40"
            aria-label="Đóng hộp thoại"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Warning Body */}
        <div className="space-y-3">
          <div className="p-3.5 rounded-xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/40 flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-300">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
            <p className="leading-relaxed">
              Sau khi hủy liên kết, Bot Telegram TMDEMY sẽ ngừng gửi các thông báo đơn hàng mới, báo cáo doanh thu và chỉ số thống kê khóa học tới tài khoản này.
            </p>
          </div>

          <p className="text-xs text-[#635a72] dark:text-[#a9a0b2]">
            Bạn có thể kết nối lại với tài khoản này hoặc một tài khoản Telegram khác bất kỳ lúc nào.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isUnlinking}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
          >
            Hủy bỏ
          </button>

          <button
            type="button"
            onClick={() => void onConfirm()}
            disabled={isUnlinking}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white text-xs font-bold transition-all shadow-sm shadow-rose-600/20 disabled:opacity-50 cursor-pointer"
          >
            {isUnlinking ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang hủy liên kết...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Xác nhận hủy liên kết</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

