'use client';

import React from 'react';
import { CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react';

interface StudentStatusBadgeProps {
  status?: string | null;
  className?: string;
}

export function StudentStatusBadge({ status, className = '' }: StudentStatusBadgeProps) {
  const normalized = (status || '').toUpperCase().trim();

  switch (normalized) {
    case 'ACTIVE':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800 ${className}`}
        >
          <CheckCircle2 className="w-3 h-3" />
          <span>Đang học</span>
        </span>
      );

    case 'COMPLETED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800 ${className}`}
        >
          <CheckCircle2 className="w-3 h-3" />
          <span>Hoàn thành</span>
        </span>
      );

    case 'CANCELED':
    case 'CANCELLED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800 ${className}`}
        >
          <XCircle className="w-3 h-3" />
          <span>Đã hủy</span>
        </span>
      );

    case 'PENDING':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800 ${className}`}
        >
          <Clock className="w-3 h-3" />
          <span>Chờ xử lý</span>
        </span>
      );

    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 ${className}`}
        >
          <AlertCircle className="w-3 h-3" />
          <span>{status || 'Không xác định'}</span>
        </span>
      );
  }
}
