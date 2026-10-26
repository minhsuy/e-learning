'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Trash2, X, Loader2, ShieldAlert, ArrowRight } from 'lucide-react';
import { TeacherCourseItem } from '@/types/course';
import { courseService } from '@/services/course.service';
import { toast } from '@/lib/toast';
import { AppApiError } from '@/types/api';

interface CourseDeleteModalProps {
  course: TeacherCourseItem | null;
  isOpen: boolean;
  onClose: () => void;
  onDeleted: (deletedId: string) => void;
}

export function CourseDeleteModal({
  course,
  isOpen,
  onClose,
  onDeleted,
}: CourseDeleteModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Close on Escape key
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDeleting) {
        setErrorMsg(null);
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDeleting, onClose]);

  if (!isOpen || !course) return null;

  const isPending = (course.status || '').toLowerCase() === 'pending';
  const isApproved = (course.status || '').toLowerCase() === 'approved';

  const handleClose = () => {
    if (isDeleting) return;
    setErrorMsg(null);
    onClose();
  };

  const handleDelete = async () => {
    if (isDeleting) return;

    setIsDeleting(true);
    setErrorMsg(null);

    try {
      const courseId = course.id || course._id;
      if (!courseId) throw new Error('Không tìm thấy mã khóa học');

      const res = await courseService.deleteTeacherCourse(courseId);
      toast.success(res?.message || 'Xóa khóa học thành công!');
      onDeleted(courseId);
      onClose();
    } catch (err: unknown) {
      if (err instanceof AppApiError) {
        setErrorMsg(err.message);
        toast.error(err.message);
      } else if (err instanceof Error) {
        setErrorMsg(err.message);
        toast.error(err.message);
      } else {
        const fallback = 'Không thể xóa khóa học. Vui lòng thử lại sau.';
        setErrorMsg(fallback);
        toast.error(fallback);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={handleClose}
      role="presentation"
    >
      <div
        className="w-full max-w-md rounded-2xl border border-[#eceaf3] dark:border-[#352e43] bg-white dark:bg-[#1d1926] p-6 shadow-xl space-y-5 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                isPending
                  ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                  : 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'
              }`}
            >
              {isPending ? <Trash2 className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
            </div>
            <div>
              <h2 id="delete-dialog-title" className="text-base font-bold text-[#1c192c] dark:text-[#f4eeff]">
                {isPending ? 'Xóa khóa học?' : 'Chính sách xóa khóa học'}
              </h2>
              <p className="text-xs text-[#635a72] dark:text-[#a9a0b2]">
                Mã: <span className="font-mono">{course.id || course._id}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={isDeleting}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-40"
            aria-label="Đóng dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content body */}
        <div className="space-y-3">
          {/* Selected Course Summary Box */}
          <div className="p-3.5 rounded-xl bg-[#f7f1ff] dark:bg-[#282234] border border-[#eceaf3] dark:border-[#3b334a]">
            <p className="text-xs text-[#635a72] dark:text-[#a9a0b2] line-clamp-1">Khóa học được chọn:</p>
            <p className="text-sm font-semibold text-[#1c192c] dark:text-[#f4eeff] line-clamp-2 mt-0.5">
              {course.title}
            </p>
            <div className="flex items-center gap-2 mt-2 text-xs">
              <span className="text-[#635a72] dark:text-[#a9a0b2]">Trạng thái:</span>
              {isPending ? (
                <span className="font-semibold text-amber-600 dark:text-amber-400">
                  CHỜ DUYỆT (PENDING)
                </span>
              ) : isApproved ? (
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  ĐÃ DUYỆT (APPROVED)
                </span>
              ) : (
                <span className="font-semibold text-rose-600 dark:text-rose-400">
                  BỊ TỪ CHỐI (REJECTED)
                </span>
              )}
            </div>
          </div>

          {/* Conditional Guidance Box */}
          {isPending ? (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-200 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Bạn có chắc chắn muốn xóa khóa học này? Khóa học đang ở trạng thái Chờ duyệt (PENDING) và sẽ bị xóa vĩnh viễn khỏi hệ thống.
              </p>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <span>Không thể tự xóa khóa học đã duyệt / phát hành</span>
              </div>
              <p className="leading-relaxed text-[11px] text-amber-900/90 dark:text-amber-200/90">
                Theo quy định của hệ thống TMdemy, Giảng viên chỉ có quyền xóa các khóa học ở trạng thái <strong>Chờ duyệt (PENDING)</strong>.
              </p>
              <p className="leading-relaxed text-[11px] text-amber-900/90 dark:text-amber-200/90">
                Đối với các khóa học đã được duyệt hoặc đã phát hành, nhằm bảo vệ quyền truy cập của các học viên đã mua và tính toàn vẹn của lịch sử giao dịch đơn hàng, chỉ <strong>Quản trị viên (Admin)</strong> mới có quyền gỡ bỏ hoặc thực hiện xóa mềm (soft-delete).
              </p>
              <p className="leading-relaxed text-[11px] font-medium text-[#7240b8] dark:text-[#a87ffb]">
                💡 Gợi ý: Nếu bạn có tài khoản Quản trị viên, bạn có thể thực hiện xóa khóa học này tại Cổng Admin.
              </p>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300">
              {errorMsg}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {isPending ? (
            <>
              <button
                type="button"
                onClick={handleClose}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-40"
              >
                Hủy
              </button>

              <button
                type="button"
                id="teacher-confirm-delete-btn"
                data-testid="teacher-confirm-delete-btn"
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang xóa...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Xác nhận xóa</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Đã hiểu
              </button>

              <Link
                href="/admin/courses"
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-[#7240b8] hover:bg-[#5f339d] text-white shadow-xs transition-colors inline-flex items-center gap-1.5"
              >
                <span>Cổng Quản trị Admin</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
