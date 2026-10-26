'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { XCircle, X, AlertTriangle, Loader2, BookOpen } from 'lucide-react';
import { AdminCourseItem } from '@/types/admin-course';
import { adminCourseService } from '@/services/admin-course.service';
import { toast } from '@/lib/toast';

interface RejectCourseModalProps {
  course: AdminCourseItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function RejectCourseModal({
  course,
  isOpen,
  onClose,
  onSuccess,
}: RejectCourseModalProps) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !course) return null;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await adminCourseService.rejectCourse(course.id, reason);
      toast.success(`Đã từ chối khóa học "${course.title}".`);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể từ chối khóa học';
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
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-base">
            <XCircle className="w-5 h-5" />
            <h2>Từ chối phê duyệt khóa học</h2>
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

          {/* Feedback Reason Textarea */}
          <div className="space-y-1.5">
            <label
              htmlFor="rejection-reason"
              className="font-bold text-xs text-[#1c192c] dark:text-[#f4eeff] flex items-center justify-between"
            >
              <span>Lý do từ chối / Góp ý hoàn thiện:</span>
              <span className="font-normal text-[11px] text-[#635a72] dark:text-[#a9a0b2]">
                (Không bắt buộc)
              </span>
            </label>
            <textarea
              id="rejection-reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={loading}
              placeholder="Nhập lý do từ chối hoặc phản hồi cho giảng viên (ví dụ: Chất lượng âm thanh video chưa tốt, thiếu tài liệu đính kèm, nội dung chưa đầy đủ)..."
              className="w-full p-3 rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] text-xs text-[#1c192c] dark:text-[#f4eeff] placeholder:text-[#635a72]/60 focus:outline-hidden focus:ring-2 focus:ring-rose-500/30 transition-all resize-none"
            />
          </div>

          {/* Warning Notice */}
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 text-rose-800 dark:text-rose-300 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Chính sách kiểm duyệt</span>
            </div>
            <p className="leading-relaxed">
              Khóa học sẽ chuyển sang trạng thái <strong>REJECTED</strong>. Giảng viên sẽ nhận được thông báo để chỉnh sửa lại giáo trình trước khi gửi yêu cầu duyệt mới.
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
              id="confirm-reject-course-btn"
              data-testid="confirm-reject-course-btn"
              onClick={handleConfirm}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang từ chối...</span>
                </>
              ) : (
                <>
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Xác nhận từ chối</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
