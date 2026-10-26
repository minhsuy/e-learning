'use client';

import React, { useEffect } from 'react';
import {
  X,
  PlayCircle,
  ExternalLink,
  CheckCircle2,
  Clock,
  BookOpen,
  Sparkles,
  Layers,
  ShoppingBag,
  GraduationCap,
  Loader2,
} from 'lucide-react';
import { ApiCourseChapterLesson } from '@/types/course';
import { cn } from '@/lib/utils';

export interface DemoLessonItem {
  lesson: ApiCourseChapterLesson;
  chapterTitle: string;
}

interface DemoLessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLesson: ApiCourseChapterLesson | null;
  chapterTitle?: string;
  courseTitle?: string;
  coursePrice?: number;
  isEnrolled?: boolean;
  onEnrollOrCheckout?: () => void;
  allDemoLessons?: DemoLessonItem[];
  onSelectDemoLesson?: (lesson: ApiCourseChapterLesson, chapterTitle: string) => void;
  loading?: boolean;
}

export function parseVideoUrl(url?: string): {
  type: 'youtube' | 'direct' | 'unknown' | 'empty';
  embedUrl?: string;
  directUrl?: string;
} {
  if (!url || !url.trim()) {
    return { type: 'empty' };
  }

  const trimmed = url.trim();

  // YouTube match: regular watch URL, youtu.be short URL, or embed URL
  const ytMatch = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/
  );
  if (ytMatch && ytMatch[1]) {
    return {
      type: 'youtube',
      embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0`,
    };
  }

  // Direct video file extension or Cloudinary video stream
  if (
    trimmed.match(/\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i) ||
    trimmed.includes('/video/upload/') ||
    trimmed.includes('.m3u8')
  ) {
    return {
      type: 'direct',
      directUrl: trimmed,
    };
  }

  // Fallback to direct URL if valid HTTP(S) URL
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return {
        type: 'direct',
        directUrl: trimmed,
      };
    }
  } catch {
    // Invalid URL
  }

  return { type: 'unknown' };
}

function formatDuration(seconds?: number): string {
  if (!seconds || seconds <= 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatPrice(price?: number): string {
  if (price === undefined || price === null || price === 0) return 'Miễn phí';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(price);
}

export function DemoLessonModal({
  isOpen,
  onClose,
  currentLesson,
  chapterTitle,
  courseTitle,
  coursePrice,
  isEnrolled = false,
  onEnrollOrCheckout,
  allDemoLessons = [],
  onSelectDemoLesson,
  loading = false,
}: DemoLessonModalProps) {
  // Close on Escape
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

  if (!isOpen || !currentLesson) return null;

  const videoInfo = parseVideoUrl(currentLesson.videoUrl);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl border border-[#eceaf3] dark:border-[#352e43] bg-white dark:bg-[#181422] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#f1ebff] dark:border-[#2b2438] bg-[#fbf8ff] dark:bg-[#1c1827]">
          <div className="flex items-center gap-2.5 min-w-0 pr-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#7240b8] text-white text-[11px] font-bold shadow-xs shrink-0">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Học thử miễn phí</span>
            </span>

            <div className="min-w-0">
              <h3 className="font-bold text-sm sm:text-base text-[#1c192c] dark:text-[#f4eeff] truncate">
                {currentLesson.title}
              </h3>
              {chapterTitle && (
                <p className="text-[11px] text-[#635a72] dark:text-[#a9a0b2] truncate">
                  {chapterTitle} {courseTitle ? `• ${courseTitle}` : ''}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#635a72] dark:text-[#a9a0b2] hover:text-[#1c192c] dark:hover:text-[#f4eeff] hover:bg-black/5 dark:hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
            aria-label="Đóng cửa sổ học thử"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Video Screen & Details */}
        <div className="flex-1 overflow-y-auto">
          {/* 1. Main Video Area */}
          <div className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden">
            {loading ? (
              <div className="flex flex-col items-center gap-3 text-white">
                <Loader2 className="w-9 h-9 animate-spin text-[#a87ffb]" />
                <p className="text-xs text-[#d1c4e9]">Đang tải video bài học thử...</p>
              </div>
            ) : videoInfo.type === 'youtube' && videoInfo.embedUrl ? (
              <iframe
                src={videoInfo.embedUrl}
                title={currentLesson.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              />
            ) : videoInfo.type === 'direct' && videoInfo.directUrl ? (
              <video
                src={videoInfo.directUrl}
                controls
                autoPlay
                playsInline
                className="w-full h-full object-contain"
              >
                Trình duyệt của bạn không hỗ trợ phát thẻ video trực tiếp.
              </video>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center max-w-md text-white/90">
                <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-3">
                  <PlayCircle className="w-8 h-8 text-[#d6c4ff]" />
                </div>
                <h4 className="text-sm sm:text-base font-bold text-white mb-1.5">
                  Bài học thử nghiệm không có video streaming
                </h4>
                <p className="text-xs text-[#b4a9c7] leading-relaxed mb-4">
                  Bài học thử này có thể ở định dạng bài đọc tóm tắt (Text) hoặc giảng viên chưa gắn liên kết video cho bài học này.
                </p>
                {currentLesson.content && (
                  <div className="w-full max-h-36 overflow-y-auto p-3.5 rounded-xl bg-white/5 border border-white/10 text-left text-xs text-[#e0d6f2] whitespace-pre-wrap leading-relaxed">
                    {currentLesson.content}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. Sub-Bar: Info & Multi-Demo Navigation */}
          <div className="p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#f1ebff] dark:border-[#2b2438]">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-base text-[#1c192c] dark:text-[#f4eeff]">
                    {currentLesson.title}
                  </span>
                  {currentLesson.duration ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#f7f1ff] dark:bg-[#282136] text-[11px] font-semibold text-[#7240b8] dark:text-[#a87ffb] border border-[#7240b8]/15">
                      <Clock className="w-3 h-3" />
                      <span>{formatDuration(currentLesson.duration)}</span>
                    </span>
                  ) : null}
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Miễn phí xem trước</span>
                  </span>
                </div>
                <p className="text-xs text-[#635a72] dark:text-[#a9a0b2]">
                  {chapterTitle || 'Nội dung giáo trình'}
                </p>
              </div>

              {/* Action Link to Full Player if External */}
              {currentLesson.videoUrl && (
                <a
                  href={currentLesson.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-[#7240b8] dark:text-[#a87ffb] hover:underline font-semibold shrink-0"
                >
                  <span>Mở liên kết nguồn</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

            {/* Lesson Text Content / Description if available */}
            {currentLesson.content && (
              <div className="p-4 rounded-xl bg-[#fdfaff] dark:bg-[#1d1927] border border-[#f1ebff] dark:border-[#2f2742] space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#7240b8] dark:text-[#a87ffb]">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Tóm tắt nội dung bài học:</span>
                </div>
                <p className="text-xs text-[#4b4452] dark:text-[#b4a9c7] leading-relaxed whitespace-pre-wrap">
                  {currentLesson.content}
                </p>
              </div>
            )}

            {/* 3. Playlist of other demo lessons in the same course */}
            {allDemoLessons.length > 1 && (
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#635a72] dark:text-[#a9a0b2] flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#7240b8] dark:text-[#a87ffb]" />
                    <span>Các bài học thử khác trong khóa ({allDemoLessons.length} bài)</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {allDemoLessons.map((item, idx) => {
                    const isSelected =
                      (item.lesson.id || item.lesson._id) ===
                      (currentLesson.id || currentLesson._id);

                    return (
                      <button
                        key={item.lesson.id || item.lesson._id || idx}
                        type="button"
                        onClick={() => {
                          if (onSelectDemoLesson) {
                            onSelectDemoLesson(item.lesson, item.chapterTitle);
                          }
                        }}
                        className={cn(
                          'flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer',
                          isSelected
                            ? 'bg-[#f5eeff] dark:bg-[#2b213b] border-[#7240b8] dark:border-[#a87ffb] shadow-xs'
                            : 'bg-white dark:bg-[#1d1927] border-[#f1ebff] dark:border-[#2b2438] hover:bg-[#fcfaff] dark:hover:bg-[#231d2e]'
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <div
                            className={cn(
                              'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold',
                              isSelected
                                ? 'bg-[#7240b8] text-white'
                                : 'bg-[#f7f1ff] dark:bg-[#282136] text-[#7240b8] dark:text-[#a87ffb]'
                            )}
                          >
                            {isSelected ? (
                              <PlayCircle className="w-4 h-4 animate-pulse" />
                            ) : (
                              idx + 1
                            )}
                          </div>
                          <div className="min-w-0">
                            <p
                              className={cn(
                                'text-xs font-semibold truncate',
                                isSelected
                                  ? 'text-[#7240b8] dark:text-[#a87ffb]'
                                  : 'text-[#1c192c] dark:text-[#f4eeff]'
                              )}
                            >
                              {item.lesson.title}
                            </p>
                            <p className="text-[10px] text-[#635a72] dark:text-[#a9a0b2] truncate">
                              {item.chapterTitle}
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          {isSelected ? (
                            <span className="text-[10px] font-bold text-[#7240b8] dark:text-[#a87ffb]">
                              Đang phát
                            </span>
                          ) : (
                            <span className="text-[10px] text-[#635a72] dark:text-[#a9a0b2]">
                              {formatDuration(item.lesson.duration)}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom CTA Bar */}
        <div className="p-4 sm:px-6 bg-[#fbf8ff] dark:bg-[#1c1827] border-t border-[#f1ebff] dark:border-[#2b2438] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-center sm:text-left">
            <div className="w-9 h-9 rounded-xl bg-[#ede3ff] dark:bg-[#2d233e] text-[#7240b8] dark:text-[#a87ffb] flex items-center justify-center shrink-0 hidden sm:flex">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#1c192c] dark:text-[#f4eeff]">
                {isEnrolled ? 'Bạn đã ghi danh khóa học này' : 'Yêu thích nội dung bài giảng?'}
              </p>
              <p className="text-[11px] text-[#635a72] dark:text-[#a9a0b2]">
                {isEnrolled
                  ? 'Vào lớp học để xem toàn bộ bài giảng và thực hành trắc nghiệm.'
                  : 'Ghi danh ngay để mở khóa toàn bộ bài học, bài tập thực hành và nhận chứng chỉ.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#635a72] dark:text-[#a9a0b2] hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer w-full sm:w-auto"
            >
              Đóng
            </button>

            {onEnrollOrCheckout && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEnrollOrCheckout();
                }}
                className="px-5 py-2.5 rounded-xl bg-[#7240b8] hover:bg-[#5f339c] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto shrink-0"
              >
                {isEnrolled ? (
                  <>
                    <BookOpen className="w-4 h-4" />
                    <span>Vào lớp học ngay</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    <span>
                      {coursePrice && coursePrice > 0
                        ? `Ghi danh ngay (${formatPrice(coursePrice)})`
                        : 'Ghi danh học miễn phí'}
                    </span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
