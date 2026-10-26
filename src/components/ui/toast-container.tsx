'use client';

import React, { useEffect, useState } from 'react';
import { ToastItem, ToastType, subscribeToasts, toast } from '@/lib/toast';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const TYPE_CONFIG: Record<
  ToastType,
  {
    icon: React.ComponentType<{ className?: string }>;
    accentColor: string;
    progressBarColor: string;
    iconColor: string;
    badgeTitle: string;
  }
> = {
  success: {
    icon: CheckCircle2,
    accentColor: 'border-l-emerald-500 dark:border-l-emerald-400',
    progressBarColor: 'bg-emerald-500 dark:bg-emerald-400',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    badgeTitle: 'Thành công',
  },
  error: {
    icon: AlertCircle,
    accentColor: 'border-l-[#ba1a1a] dark:border-l-[#ffb4ab]',
    progressBarColor: 'bg-[#ba1a1a] dark:bg-[#ffb4ab]',
    iconColor: 'text-[#ba1a1a] dark:text-[#ffb4ab]',
    badgeTitle: 'Lỗi',
  },
  warning: {
    icon: AlertTriangle,
    accentColor: 'border-l-amber-500 dark:border-l-amber-400',
    progressBarColor: 'bg-amber-500 dark:bg-amber-400',
    iconColor: 'text-amber-600 dark:text-amber-400',
    badgeTitle: 'Cảnh báo',
  },
  info: {
    icon: Info,
    accentColor: 'border-l-[#7240b8] dark:border-l-[#a87ffb]',
    progressBarColor: 'bg-[#7240b8] dark:bg-[#a87ffb]',
    iconColor: 'text-[#7240b8] dark:text-[#a87ffb]',
    badgeTitle: 'Thông tin',
  },
};

function ToastMessageItem({ item }: { item: ToastItem }) {
  const [progress, setProgress] = useState(100);
  const config = TYPE_CONFIG[item.type];
  const IconComponent = config.icon;
  const duration = item.duration ?? 3500;

  useEffect(() => {
    if (duration <= 0) return;
    const intervalTime = 20;
    const step = (intervalTime / duration) * 100;
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return Math.max(0, prev - step);
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [duration]);

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`pointer-events-auto relative w-full overflow-hidden rounded-xl bg-white dark:bg-[#1d1926] shadow-[0_12px_28px_rgba(0,0,0,0.12),0_4px_10px_rgba(0,0,0,0.06)] border border-[#f1ebff] dark:border-[#352e43] border-l-4 ${config.accentColor} p-3.5 sm:p-4 transition-all animate-in slide-in-from-top-3 sm:slide-in-from-right-3 fade-in duration-200`}
    >
      <div className="flex items-start gap-3">
        <div className={`shrink-0 mt-0.5 ${config.iconColor}`}>
          <IconComponent className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-bold text-[#1c192c] dark:text-[#f4eeff]">
              {item.title || config.badgeTitle}
            </span>
          </div>
          <p className="text-xs sm:text-[13px] text-[#4b4452] dark:text-[#cdc3d4] mt-0.5 leading-relaxed break-words">
            {item.message}
          </p>
        </div>

        <button
          onClick={() => toast.dismiss(item.id)}
          aria-label="Đóng thông báo"
          className="shrink-0 p-1 rounded-md text-[#7c7483] dark:text-[#968e9e] hover:text-[#1c192c] dark:hover:text-[#f4eeff] hover:bg-[#f7f1ff] dark:hover:bg-[#2b2438] transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress Bar */}
      {duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black/5 dark:bg-white/5">
          <div
            className={`h-full ${config.progressBarColor} transition-[width] ease-linear duration-75`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    return subscribeToasts((newToasts) => {
      setToasts(newToasts);
    });
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-label="Thông báo hệ thống"
      className="fixed top-4 right-4 left-4 sm:left-auto sm:w-[400px] z-[9999] pointer-events-none flex flex-col gap-2.5"
    >
      {toasts.map((item) => (
        <ToastMessageItem key={item.id} item={item} />
      ))}
    </div>
  );
}
