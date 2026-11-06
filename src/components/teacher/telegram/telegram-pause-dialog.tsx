'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, PauseCircle, X, Loader2 } from 'lucide-react';

interface TelegramPauseDialogProps {
  isOpen: boolean;
  isPausing: boolean;
  onClose: () => void;
  onConfirm: () => Promise<boolean>;
}

export function TelegramPauseDialog({
  isOpen,
  isPausing,
  onClose,
  onConfirm,
}: TelegramPauseDialogProps) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isPausing) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isPausing, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={() => {
        if (!isPausing) onClose();
      }}
      role="presentation"
    >
      <div
        className="w-full max-w-md rounded-2xl border border-[#eceaf3] dark:border-[#352e43] bg-white dark:bg-[#1d1926] p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pause-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-200 dark:border-amber-900/40">
              <PauseCircle className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="pause-dialog-title"
                className="text-base font-bold text-[#1c192c] dark:text-[#f4eeff]"
              >
                Tạm dừng tất cả báo cáo?
              </h2>
              <p className="text-xs text-[#635a72] dark:text-[#a9a0b2]">
                Tắt lịch gửi báo cáo tự động qua Telegram
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isPausing}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-40 cursor-pointer"
            aria-label="Đóng hộp thoại"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Warning Body */}
        <div className="space-y-3">
          <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <p className="leading-relaxed">
              Hệ thống sẽ <strong>tạm dừng cả lịch báo cáo hàng ngày và hàng tuần</strong>. Bot sẽ không gửi tin nhắn thống kê định kỳ cho đến khi bạn bật lại.
            </p>
          </div>

          <p className="text-xs text-[#635a72] dark:text-[#a9a0b2] leading-relaxed">
            💡 <em>Lưu ý:</em> Tài khoản Telegram của bạn <strong>vẫn được giữ nguyên liên kết</strong>, bạn vẫn có thể sử dụng các lệnh tương tác trực tiếp với bot bất kỳ lúc nào.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isPausing}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
          >
            Hủy bỏ
          </button>

          <button
            type="button"
            onClick={() => void onConfirm()}
            disabled={isPausing}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-[0.98] text-white text-xs font-bold transition-all shadow-sm shadow-amber-600/20 disabled:opacity-50 cursor-pointer"
          >
            {isPausing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang tạm dừng...</span>
              </>
            ) : (
              <>
                <PauseCircle className="w-4 h-4" />
                <span>Xác nhận tạm dừng</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

