'use client';

import React, { useState } from 'react';
import { AlertTriangle, UserX, X, Loader2 } from 'lucide-react';
import { CourseStudentItem } from '@/types/enrollment';
import { enrollmentService } from '@/services/enrollment.service';
import { AppApiError } from '@/types/api';
import { toast } from '@/lib/toast';

interface StudentRemoveModalProps {
  isOpen: boolean;
  student: CourseStudentItem | null;
  courseId: string;
  courseTitle?: string;
  onClose: () => void;
  onSuccess: (removedUserId: string) => void;
}

export function StudentRemoveModal({
  isOpen,
  student,
  courseId,
  courseTitle,
  onClose,
  onSuccess,
}: StudentRemoveModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !student) return null;

  const studentName = student.user?.username || 'Học viên';
  const studentEmail = student.user?.email || 'Chưa có email';
  const targetUserId = student.userId || student.user?.id || student.user?._id || '';

  const handleConfirm = async () => {
    if (!targetUserId || !courseId) {
      toast.error('Thiếu mã học viên hoặc mã khóa học hợp lệ.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await enrollmentService.removeStudent(courseId, targetUserId);
      toast.success(`Đã gỡ học viên ${studentName} khỏi khóa học thành công!`);
      onSuccess(targetUserId);
      onClose();
    } catch (err: unknown) {
      let msg = 'Không thể gỡ học viên. Vui lòng thử lại sau.';
      if (err instanceof AppApiError) {
        msg = err.message;
      } else if (err instanceof Error) {
        msg = err.message;
      }
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={isSubmitting ? undefined : onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-md rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-white dark:bg-[#1d1926] p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="remove-student-modal-title"
        aria-describedby="remove-student-modal-desc"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-100 dark:border-rose-900/40">
              <UserX className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="remove-student-modal-title"
                className="text-base font-bold text-slate-900 dark:text-slate-100"
              >
                Gỡ học viên khỏi khóa học
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Xác nhận hủy quyền truy cập của học viên
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-40"
            aria-label="Đóng dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Student Target Summary Box */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#252030] border border-slate-200 dark:border-[#3d364b] space-y-1.5 text-xs">
          <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
            <span>Học viên:</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">{studentName}</span>
          </div>
          <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
            <span>Email:</span>
            <span className="font-mono text-slate-700 dark:text-slate-300">{studentEmail}</span>
          </div>
          {courseTitle && (
            <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-800">
              <span>Khóa học:</span>
              <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
                {courseTitle}
              </span>
            </div>
          )}
        </div>

        {/* Backend Atomic Rules Warning Callout */}
        <div
          id="remove-student-modal-desc"
          className="p-3.5 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-xs text-rose-800 dark:text-rose-300 space-y-1.5"
        >
          <div className="flex items-center gap-1.5 font-semibold text-rose-900 dark:text-rose-200">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Quy tắc xử lý của hệ thống:</span>
          </div>
          <ul className="list-disc list-inside space-y-1 pl-1 text-[11px] leading-relaxed opacity-90">
            <li>Học viên sẽ mất quyền truy cập và bị xóa khỏi danh sách ghi danh khóa học.</li>
            <li>Hệ thống tự động giảm số lượng đã bán (sold) của khóa học này đi 1.</li>
            <li>Đơn hàng liên quan của học viên với khóa học sẽ được xóa tự động trên máy chủ.</li>
            <li>Thao tác này không thể hoàn tác sau khi đã xác nhận.</li>
          </ul>
        </div>

        {/* Error message if API fails */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            Hủy bỏ
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 active:scale-[0.98]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang xử lý...</span>
              </>
            ) : (
              <>
                <UserX className="w-4 h-4" />
                <span>Xác nhận gỡ học viên</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
