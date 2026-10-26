'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import {
  X,
  BookOpen,
  User,
  Tag,
  DollarSign,
  Calendar,
  Layers,
  Video,
  Eye,
  ShoppingBag,
  CheckCircle2,
  XCircle,
  Loader2,
  Trash2,
} from 'lucide-react';
import { AdminChapterItem, AdminCourseItem } from '@/types/admin-course';
import { adminCourseService } from '@/services/admin-course.service';
import { cn } from '@/lib/utils';

interface CourseDetailModalProps {
  course: AdminCourseItem | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove?: (course: AdminCourseItem) => void;
  onReject?: (course: AdminCourseItem) => void;
  onDelete?: (course: AdminCourseItem) => void;
}

export function CourseDetailModal({
  course,
  isOpen,
  onClose,
  onApprove,
  onReject,
  onDelete,
}: CourseDetailModalProps) {
  const [chapters, setChapters] = useState<AdminChapterItem[]>([]);
  const [loadingChapters, setLoadingChapters] = useState(false);
  const [chaptersError, setChaptersError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !course) return;

    let isMounted = true;

    const fetchChapters = async () => {
      await Promise.resolve();
      if (!isMounted) return;

      setLoadingChapters(true);
      setChaptersError(null);

      try {
        const res = await adminCourseService.getCourseChapters(course.id);
        if (isMounted) {
          setChapters(res.data || []);
        }
      } catch (err) {
        if (isMounted) {
          setChaptersError(err instanceof Error ? err.message : 'Không thể tải giáo trình khóa học');
        }
      } finally {
        if (isMounted) {
          setLoadingChapters(false);
        }
      }
    };

    void fetchChapters();

    return () => {
      isMounted = false;
    };
  }, [isOpen, course]);

  if (!isOpen || !course) return null;

  const isPending = (course.status || '').toLowerCase() === 'pending';
  const isApproved = (course.status || '').toLowerCase() === 'approved';
  const isRejected = (course.status || '').toLowerCase() === 'rejected';

  const formatPrice = (price?: number) => {
    if (price === undefined || price === null || price === 0) return 'Miễn phí';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '—';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}p ${secs > 0 ? `${secs}s` : ''}`;
  };

  const totalLessons = chapters.reduce((sum, ch) => sum + (ch.lessons?.length || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#1d1926] rounded-2xl border border-[#f1ebff] dark:border-[#2b2438] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f1ebff] dark:border-[#2b2438] bg-[#fdf8ff] dark:bg-[#17141f]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#f7f1ff] dark:bg-[#2b2438] text-[#7240b8] dark:text-[#a87ffb] flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm sm:text-base text-[#1c192c] dark:text-[#f4eeff]">
                Chi tiết & Thẩm định Khóa học
              </h2>
              <p className="text-[11px] text-[#635a72] dark:text-[#a9a0b2]">
                Mã khóa học: <span className="font-mono">{course.id}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto text-xs flex-1">
          {/* Main Course Hero & Title */}
          <div className="flex flex-col sm:flex-row items-start gap-4 p-4 rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438]">
            <div className="relative w-full sm:w-44 aspect-video rounded-lg overflow-hidden bg-black/5 shrink-0 border border-[#f1ebff] dark:border-[#2b2438]">
              {course.image ? (
                <Image
                  src={course.image}
                  alt={course.title}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <BookOpen className="w-8 h-8" />
                </div>
              )}
            </div>

            <div className="flex-1 space-y-2 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    'px-2.5 py-0.5 rounded-full text-[11px] font-bold border',
                    isApproved && 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    isPending && 'bg-amber-50 text-amber-700 border-amber-200',
                    isRejected && 'bg-rose-50 text-rose-700 border-rose-200'
                  )}
                >
                  {isApproved ? 'ĐÃ DUYỆT (APPROVED)' : isPending ? 'CHỜ DUYỆT (PENDING)' : 'BỊ TỪ CHỐI (REJECTED)'}
                </span>

                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white dark:bg-[#1d1926] border border-[#f1ebff] dark:border-[#2b2438]">
                  Trình độ: {course.level || 'Chung'}
                </span>

                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white dark:bg-[#1d1926] border border-[#f1ebff] dark:border-[#2b2438]">
                  Loại: {course.type || 'PAID'}
                </span>
              </div>

              <h3 className="font-bold text-sm sm:text-base text-[#1c192c] dark:text-[#f4eeff] leading-snug">
                {course.title}
              </h3>

              <p className="text-[11px] font-mono text-[#635a72] dark:text-[#a9a0b2] truncate">
                Slug: /{course.slug}
              </p>
            </div>
          </div>

          {/* Rejection Reason Alert if course is rejected */}
          {isRejected && (
            <div className="p-3.5 rounded-xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-xs flex items-start gap-3">
              <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-rose-800 dark:text-rose-300">
                  Lý do từ chối phê duyệt:
                </p>
                <p className="text-rose-700 dark:text-rose-400 text-[11px] leading-relaxed">
                  {course.rejectionReason || 'Chưa có ghi chú lý do chi tiết từ người kiểm duyệt.'}
                </p>
              </div>
            </div>
          )}

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-white dark:bg-[#1d1926] border border-[#f1ebff] dark:border-[#2b2438]">
              <span className="text-[11px] text-[#635a72] dark:text-[#a9a0b2] flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5" />
                Giá niêm yết
              </span>
              <p className="text-sm font-bold text-[#7240b8] dark:text-[#a87ffb] mt-1">
                {formatPrice(course.price)}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-[#1d1926] border border-[#f1ebff] dark:border-[#2b2438]">
              <span className="text-[11px] text-[#635a72] dark:text-[#a9a0b2] flex items-center gap-1">
                <ShoppingBag className="w-3.5 h-3.5" />
                Lượt mua
              </span>
              <p className="text-sm font-bold text-[#1c192c] dark:text-[#f4eeff] mt-1">
                {course.sold || 0}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-[#1d1926] border border-[#f1ebff] dark:border-[#2b2438]">
              <span className="text-[11px] text-[#635a72] dark:text-[#a9a0b2] flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                Lượt xem
              </span>
              <p className="text-sm font-bold text-[#1c192c] dark:text-[#f4eeff] mt-1">
                {course.view || 0}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-[#1d1926] border border-[#f1ebff] dark:border-[#2b2438]">
              <span className="text-[11px] text-[#635a72] dark:text-[#a9a0b2] flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Ngày tạo
              </span>
              <p className="text-xs font-semibold text-[#1c192c] dark:text-[#f4eeff] mt-1 truncate">
                {formatDate(course.createdAt)}
              </p>
            </div>
          </div>

          {/* Teacher and Category Info Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Teacher Details */}
            <div className="p-3.5 rounded-xl bg-white dark:bg-[#1d1926] border border-[#f1ebff] dark:border-[#2b2438] space-y-2">
              <span className="text-[11px] font-bold text-[#635a72] dark:text-[#a9a0b2] uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#7240b8]" />
                Giảng viên hướng dẫn
              </span>
              <div className="flex items-center gap-3 pt-1">
                <div className="relative w-9 h-9 rounded-full overflow-hidden bg-[#f1ebff] dark:bg-[#2b2438] shrink-0 flex items-center justify-center">
                  {course.author?.avatar ? (
                    <Image
                      src={course.author.avatar}
                      alt={course.author.username}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <User className="w-4 h-4 text-[#7240b8]" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm text-[#1c192c] dark:text-[#f4eeff] truncate">
                    {course.author?.username || '—'}
                  </p>
                  <p className="text-[11px] text-[#635a72] dark:text-[#a9a0b2] truncate">
                    {course.author?.email || 'Chưa cập nhật email'}
                  </p>
                </div>
              </div>
            </div>

            {/* Category Info */}
            <div className="p-3.5 rounded-xl bg-white dark:bg-[#1d1926] border border-[#f1ebff] dark:border-[#2b2438] space-y-2">
              <span className="text-[11px] font-bold text-[#635a72] dark:text-[#a9a0b2] uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-[#7240b8]" />
                Phân loại danh mục
              </span>
              <div className="pt-1 space-y-1">
                <p className="font-bold text-sm text-[#1c192c] dark:text-[#f4eeff]">
                  {course.category?.name || 'Chung'}
                </p>
                <p className="text-[11px] text-[#635a72] dark:text-[#a9a0b2]">
                  Định danh: <span className="font-mono">{course.category?.id || '—'}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Curriculum Inspection Section */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs uppercase tracking-wider text-[#635a72] dark:text-[#a9a0b2] flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#7240b8]" />
                <span>Giáo trình khóa học</span>
                {!loadingChapters && (
                  <span className="font-normal normal-case text-muted-foreground">
                    ({chapters.length} chương, {totalLessons} bài học)
                  </span>
                )}
              </h4>
            </div>

            {/* Chapters list */}
            {loadingChapters ? (
              <div className="p-6 text-center text-muted-foreground rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#7240b8]" />
                <span>Đang tải danh sách chương & bài học...</span>
              </div>
            ) : chaptersError ? (
              <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 text-rose-700 dark:text-rose-300">
                {chaptersError}
              </div>
            ) : chapters.length === 0 ? (
              <div className="p-5 text-center text-muted-foreground rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438]">
                Giảng viên chưa đăng tải chương hoặc bài học nào cho khóa học này.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {chapters.map((ch, idx) => (
                  <div
                    key={ch.id || ch._id || idx}
                    className="rounded-xl border border-[#f1ebff] dark:border-[#2b2438] bg-white dark:bg-[#1d1926] p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between font-semibold text-xs text-[#1c192c] dark:text-[#f4eeff]">
                      <span className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-[#f7f1ff] dark:bg-[#2b2438] text-[#7240b8] dark:text-[#a87ffb] flex items-center justify-center text-[10px]">
                          {idx + 1}
                        </span>
                        {ch.title}
                      </span>
                      <span className="text-[11px] font-normal text-[#635a72] dark:text-[#a9a0b2]">
                        {ch.lessons?.length || 0} bài học
                      </span>
                    </div>

                    {ch.lessons && ch.lessons.length > 0 && (
                      <div className="pl-7 space-y-1.5 pt-1 border-t border-[#f1ebff]/60 dark:border-[#2b2438]/60">
                        {ch.lessons.map((lesson, lIdx) => (
                          <div
                            key={lesson.id || lesson._id || lIdx}
                            className="flex items-center justify-between text-[11px] text-[#635a72] dark:text-[#a9a0b2]"
                          >
                            <span className="flex items-center gap-2 truncate">
                              <Video className="w-3 h-3 text-[#7240b8] shrink-0" />
                              <span className="truncate">{lesson.title}</span>
                              {lesson.isDemo && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">
                                  Học thử
                                </span>
                              )}
                            </span>
                            <span className="shrink-0 font-mono text-[10px]">
                              {formatDuration(lesson.duration)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Footer */}
        <div className="px-6 py-4 border-t border-[#f1ebff] dark:border-[#2b2438] bg-[#fdf8ff] dark:bg-[#17141f] flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-[#635a72] dark:text-[#a9a0b2]">
            {isPending ? (
              <span className="text-amber-600 dark:text-amber-400 font-medium">
                Khóa học đang chờ bạn phê duyệt hoặc từ chối
              </span>
            ) : isApproved ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                Khóa học đã được duyệt và đang mở bán
              </span>
            ) : (
              <span className="text-rose-600 dark:text-rose-400 font-medium">
                Khóa học đã bị từ chối
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-[#1d1926] border border-[#f1ebff] dark:border-[#2b2438] text-[#635a72] dark:text-[#a9a0b2] hover:bg-[#f7f1ff] dark:hover:bg-[#2b2438] transition-colors"
            >
              Đóng
            </button>

            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(course)}
                data-testid="detail-delete-course-btn"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors"
                title="Xóa khóa học (Admin)"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa khóa học</span>
              </button>
            )}

            {isPending && onReject && (
              <button
                type="button"
                onClick={() => onReject(course)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Từ chối</span>
              </button>
            )}

            {isPending && onApprove && (
              <button
                type="button"
                onClick={() => onApprove(course)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Phê duyệt khóa học</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
