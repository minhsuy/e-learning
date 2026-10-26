'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { CheckCircle2, X, AlertCircle, Loader2, BookOpen } from 'lucide-react';
import { AdminCourseItem } from '@/types/admin-course';
import { adminCourseService } from '@/services/admin-course.service';
import { toast } from '@/lib/toast';

interface ApproveCourseModalProps {
  course: AdminCourseItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ApproveCourseModal({
  course,
  isOpen,
  onClose,
  onSuccess,
}: ApproveCourseModalProps) {
  const [loading, setLoading] = useState(false);

  if (!isOpen || !course) return null;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await adminCourseService.approveCourse(course.id);
      toast.success(`Đã phê duyệt khóa học "${course.title}" thành công!`);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể phê duyệt khóa học';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white dark:bg-[#1d1926] rounded-2xl border border-[#f1ebff] dark:border-[#2b2438] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f1ebff] dark:border-[#2b2438] bg-[#fdf8ff] dark:bg-[#17141f]">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-base">
            <CheckCircle2 className="w-5 h-5" />
            <h2>Phê duyệt khóa học</h2>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 text-xs">
          {/* Target Course Summary */}
          <div className="p-3.5 rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] flex items-center gap-3">
            <div className="relative w-16 h-11 rounded-lg overflow-hidden bg-black/5 shrink-0 border border-[#f1ebff] dark:border-[#2b2438] flex items-center justify-center">
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
              <p className="text-[11px] text-[#635a72] dark:text-[#a9a0b2] mt-0.5 truncate">
                Giảng viên: {course.author?.username || '—'}
              </p>
            </div>
          </div>

          {/* Confirmation Notice */}
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Xác nhận phát hành khóa học</span>
            </div>
            <p className="leading-relaxed">
              Bạn có chắc chắn muốn duyệt khóa học này? Sau khi được duyệt, khóa học sẽ chuyển sang trạng thái <strong>APPROVED</strong> và hệ thống sẽ tự động gửi thông báo chúc mừng tới Giảng viên.
            </p>
          </div>

          {/* Action Footer */}
          <div className="pt-3 border-t border-[#f1ebff] dark:border-[#2b2438] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-[#1d1926] border border-[#f1ebff] dark:border-[#2b2438] text-[#635a72] dark:text-[#a9a0b2] hover:bg-[#f7f1ff] dark:hover:bg-[#2b2438] transition-colors"
            >
              Hủy
            </button>

            <button
              type="button"
              id="confirm-approve-course-btn"
              data-testid="confirm-approve-course-btn"
              onClick={handleConfirm}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang phê duyệt...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Xác nhận phê duyệt</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
