import React from 'react';
import { CheckCircle2, Clock, XCircle, FileEdit } from 'lucide-react';
import { TeacherCourseStatus } from '@/types/course';

interface CourseStatusBadgeProps {
  status: TeacherCourseStatus;
  className?: string;
  showIcon?: boolean;
}

export function CourseStatusBadge({ status, className = '', showIcon = true }: CourseStatusBadgeProps) {
  const normalized = (status || '').toLowerCase();

  switch (normalized) {
    case 'approved':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 ${className}`}
        >
          {showIcon && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
          <span>Đã duyệt</span>
        </span>
      );

    case 'pending':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800 cursor-help ${className}`}
          title="Đang chờ Admin phê duyệt"
        >
          {showIcon && <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />}
          <span>Chờ duyệt</span>
        </span>
      );

    case 'rejected':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800 ${className}`}
        >
          {showIcon && <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />}
          <span>Bị từ chối</span>
        </span>
      );

    case 'draft':
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 ${className}`}
        >
          {showIcon && <FileEdit className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />}
          <span>Bản nháp</span>
        </span>
      );
  }
}
