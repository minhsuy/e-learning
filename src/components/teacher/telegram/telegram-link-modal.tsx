'use client';

import React, { useEffect, useState } from 'react';
import {
  ExternalLink,
  Copy,
  Check,
  Clock,
  AlertTriangle,
  RefreshCw,
  X,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { TelegramIcon } from './telegram-icon';
import { TeacherTelegramLinkTokenData } from '@/types/telegram';

interface TelegramLinkModalProps {
  isOpen: boolean;
  linkData: TeacherTelegramLinkTokenData | null;
  isLoadingNewToken?: boolean;
  onClose: () => void;
  onRegenerateToken: () => Promise<void>;
}

function getRemainingSeconds(expiresAt?: string): number {
  if (!expiresAt) return 15 * 60;
  const diffMs = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.floor(diffMs / 1000));
}

export function TelegramLinkModal({
  isOpen,
  linkData,
  isLoadingNewToken = false,
  onClose,
  onRegenerateToken,
}: TelegramLinkModalProps) {
  const [copied, setCopied] = useState(false);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(() =>
    getRemainingSeconds(linkData?.expiresAt)
  );

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Token 15-minute expiration countdown timer
  useEffect(() => {
    if (!isOpen || !linkData?.expiresAt) return;

    const timer = setInterval(() => {
      const remaining = getRemainingSeconds(linkData.expiresAt);
      setTimeLeftSeconds(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, linkData?.expiresAt]);

  if (!isOpen || !linkData) return null;

  const isExpired = timeLeftSeconds <= 0;
  const minutes = Math.floor(timeLeftSeconds / 60);
  const seconds = timeLeftSeconds % 60;
  const formattedCountdown = `${minutes.toString().padStart(2, '0')}:${seconds
    .toString()
    .padStart(2, '0')}`;

  const manualCommand = `/link ${linkData.token}`;

  const handleCopyCommand = async () => {
    try {
      await navigator.clipboard.writeText(manualCommand);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback if clipboard API is blocked
      const textArea = document.createElement('textarea');
      textArea.value = manualCommand;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-[#eceaf3] dark:border-[#352e43] bg-white dark:bg-[#1d1926] p-6 sm:p-7 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="telegram-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/40 text-[#24A1DE] flex items-center justify-center shrink-0 border border-sky-100 dark:border-sky-900/40 shadow-xs">
              <TelegramIcon size={24} className="text-[#24A1DE]" />
            </div>
            <div>
              <h2
                id="telegram-modal-title"
                className="text-lg font-bold text-[#1c192c] dark:text-[#f4eeff]"
              >
                Liên kết Telegram Bot
              </h2>
              <p className="text-xs text-[#635a72] dark:text-[#a9a0b2]">
                Nhận thông báo doanh thu, đơn hàng &amp; báo cáo học viên tự động
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Đóng hộp thoại"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Countdown & Status Banner */}
        <div
          className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
            isExpired
              ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300'
              : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {isExpired ? (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            )}
            <span className="font-medium">
              {isExpired ? 'Mã liên kết đã hết hạn (15 phút)' : 'Mã liên kết có hiệu lực trong:'}
            </span>
          </div>

          <span className="font-mono font-bold text-sm tracking-wider">
            {isExpired ? '00:00' : formattedCountdown}
          </span>
        </div>

        {/* Expired State */}
        {isExpired ? (
          <div className="p-5 rounded-2xl bg-[#fbf9fe] dark:bg-[#251e30] border border-[#f1ebff] dark:border-[#352e43] text-center space-y-3">
            <p className="text-xs text-[#635a72] dark:text-[#a9a0b2]">
              Phiên liên kết đã kết thúc để đảm bảo an toàn. Vui lòng tạo mã mới để tiếp tục.
            </p>
            <button
              type="button"
              onClick={onRegenerateToken}
              disabled={isLoadingNewToken}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#7240b8] hover:bg-[#854ecc] text-white text-xs font-bold transition-all shadow-xs disabled:opacity-60 cursor-pointer"
            >
              {isLoadingNewToken ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang tạo mã mới...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>Tạo mã liên kết mới</span>
                </>
              )}
            </button>
          </div>
        ) : (
          /* Active Token State */
          <div className="space-y-4">
            {/* Cách 1: Nút bấm trực tiếp Deep Link */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-sky-50/80 to-blue-50/60 dark:from-sky-950/20 dark:to-blue-950/20 border border-sky-100 dark:border-sky-900/40 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[#24A1DE]">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#24A1DE] text-white text-[10px]">
                  1
                </span>
                <span>Cách 1 — Mở trực tiếp (Khuyên dùng)</span>
              </div>

              <p className="text-xs text-[#4b4452] dark:text-[#b4a9c7] leading-relaxed">
                Nhấn vào nút bên dưới để mở ứng dụng Telegram và tự động liên kết tài khoản Giảng viên với Bot:
              </p>

              <a
                href={linkData.deepLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 rounded-xl bg-[#24A1DE] hover:bg-[#1f8ec4] active:scale-[0.99] text-white text-xs sm:text-sm font-bold transition-all shadow-md shadow-[#24A1DE]/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <TelegramIcon size={18} className="text-white" />
                <span>Mở Telegram để liên kết ngay</span>
                <ExternalLink className="w-4 h-4 opacity-80" />
              </a>
            </div>

            {/* Cách 2: Nhập lệnh thủ công */}
            <div className="p-4 rounded-xl bg-[#f7f1ff] dark:bg-[#251e30] border border-[#f1ebff] dark:border-[#352e43] space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-[#7240b8] dark:text-[#a87ffb]">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#7240b8] dark:bg-[#a87ffb] text-white dark:text-[#1c192c] text-[10px]">
                    2
                  </span>
                  <span>Cách 2 — Sao chép lệnh gửi Bot</span>
                </div>

                <button
                  type="button"
                  onClick={handleCopyCommand}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-[#1d1926] text-[#7240b8] dark:text-[#a87ffb] border border-[#eceaf3] dark:border-[#3b334a] hover:bg-purple-50 dark:hover:bg-[#2f273d] transition-colors cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600 font-bold">Đã chép!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Sao chép lệnh</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-[11px] text-[#635a72] dark:text-[#a9a0b2]">
                Mở khung chat với Bot và gửi chính xác đoạn lệnh sau:
              </p>

              <div className="p-2.5 rounded-lg bg-white dark:bg-[#1d1926] border border-[#eceaf3] dark:border-[#3b334a] font-mono text-[11px] sm:text-xs text-[#1c192c] dark:text-[#f4eeff] break-all select-all flex items-center justify-between gap-2">
                <span className="truncate">{manualCommand}</span>
              </div>
            </div>

            {/* Polling Live Sync Feedback */}
            <div className="flex items-center justify-center gap-2 pt-1 text-xs text-[#635a72] dark:text-[#b4a9c7]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#24A1DE] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#24A1DE]" />
              </span>
              <span>Đang chờ bạn xác nhận trên Telegram (tự động cập nhật sau 3 giây)...</span>
            </div>
          </div>
        )}

        {/* Security Micro Footer */}
        <div className="pt-2 border-t border-[#f1ebff] dark:border-[#2f2742] flex items-center justify-between text-[11px] text-[#8c8296] dark:text-[#968b9f]">
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Mã liên kết một lần, tự hủy sau 15 phút</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="font-semibold hover:text-[#7240b8] dark:hover:text-[#a87ffb] transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
