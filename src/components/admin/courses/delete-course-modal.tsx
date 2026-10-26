'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Trash2, X, AlertTriangle, Loader2, BookOpen } from 'lucide-react';
import { AdminCourseItem } from '@/types/admin-course';
import { adminCourseService } from '@/services/admin-course.service';
import { toast } from '@/lib/toast';

interface DeleteCourseModalProps {
  course: AdminCourseItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function DeleteCourseModal({
  course,
  isOpen,
  onClose,
  onSuccess,
}: DeleteCourseModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, onClose]);

  if (!isOpen || !course) return null;

  const courseId = course.id || course._id;

  const handleClose = () => {
    if (loading) return;
    setError(null);
    onClose();
  };

  const handleConfirm = async () => {
    if (!courseId || loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await adminCourseService.deleteCourse(courseId);
      toast.success(res?.message || `Đã xóa khóa học "${course.title}" thành công!`);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Không thể xóa khóa học. Vui lòng thử lại sau.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price?: number) => {
    if (price === undefined || price === null || price === 0) {
      return 'Miễn phí';
    }
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const getStatusBadge = (status?: string) => {
    const norm = (status || '').toLowerCase();
    switch (norm) {
      case 'approved':
        return {
          label: 'Đã duyệt',
          className:
            'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40',
        };
      case 'rejected':
        return {
          label: 'Bị từ chối',
          className:
            'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/40',
        };
      case 'pending':
      default:
        return {
          label: 'Chờ duyệt',
          className:
            'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/40',
        };
    }
  };

  const statusBadge = getStatusBadge(course.status);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={handleClose}
      role="presentation"
    >
      <div
        className="relative w-full max-w-md bg-white dark:bg-[#1d1926] rounded-2xl border border-[#f1ebff] dark:border-[#2b2438] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-course-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f1ebff] dark:border-[#2b2438] bg-[#fdf8ff] dark:bg-[#17141f]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 flex items-center justify-center shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="delete-course-title"
                className="text-base font-bold text-[#1c192c] dark:text-[#f4eeff]"
              >
                Xóa khóa học (Admin)
              </h2>
              <p className="text-xs text-[#635a72] dark:text-[#a9a0b2]">
                Thao tác xóa mềm khóa học khỏi hệ thống
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-black/5 dark:hover:bg-white/10 transition-colors disabled:opacity-40"
            aria-label="Đóng dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 text-xs">
          {/* Target Course Info Card */}
          <div className="p-3.5 rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] flex items-center gap-3">
            <div className="relative w-16 h-11 rounded-lg overflow-hidden bg-[#f1ebff] dark:bg-[#2b2438] shrink-0 border border-[#f1ebff] dark:border-[#2b2438] flex items-center justify-center">
              {course.image ? (
                <Image
                  src={course.image}
                  alt={course.title}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <BookOpen className="w-5 h-5 text-[#7240b8]" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-[#1c192c] dark:text-[#f4eeff] line-clamp-2 leading-tight">
                {course.title}
              </p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-[11px] text-[#635a72] dark:text-[#a9a0b2]">
                  GV: <strong>{course.author?.username || '—'}</strong>
                </span>
                <span className="text-[10px] text-[#635a72] dark:text-[#a9a0b2]">•</span>
                <span className="text-[11px] font-semibold text-[#7240b8] dark:text-[#a87ffb]">
                  {formatPrice(course.price)}
                </span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] font-semibold border ${statusBadge.className}`}
                >
                  {statusBadge.label}
                </span>
              </div>
            </div>
          </div>

          {/* Warning Notice Box */}
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>Cảnh báo xóa mềm (Soft-delete)</span>
            </div>
            <p className="leading-relaxed">
              Khóa học sẽ được chuyển sang trạng thái xóa mềm (
              <code className="px-1 py-0.5 rounded bg-rose-100 dark:bg-rose-900/60 font-mono text-[11px]">
                isDestroyed = true
              </code>
              ). Khóa học sẽ bị ẩn khỏi học viên và danh mục công khai, nhưng lịch sử đơn hàng
              và các quyền lợi đã mua của học viên vẫn được giữ nguyên vẹn.
            </p>
          </div>

          {/* Error Message Display */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300">
              {error}
            </div>
          )}

          {/* Action Footer */}
          <div className="pt-3 border-t border-[#f1ebff] dark:border-[#2b2438] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-[#1d1926] border border-[#f1ebff] dark:border-[#2b2438] text-[#635a72] dark:text-[#a9a0b2] hover:bg-[#f7f1ff] dark:hover:bg-[#2b2438] transition-colors disabled:opacity-40"
            >
              Hủy
            </button>

            <button
              type="button"
              id="confirm-delete-course-btn"
              data-testid="confirm-delete-course-btn"
              onClick={handleConfirm}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang xóa...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xác nhận xóa</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
