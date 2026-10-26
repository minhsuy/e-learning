'use client';

import React, { useState } from 'react';
import {
  X,
  FileVideo,
  FileText,
  Loader2,
  AlertCircle,
  Play,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { ApiLessonItem } from '@/types/lesson';
import { lessonService } from '@/services/lesson.service';
import { parseVideoUrl } from './video-preview-modal';
import { BunnyVideoUploader } from './bunny-video-uploader';
import { toast } from '@/lib/toast';
import { AppApiError } from '@/types/api';

interface LessonModalProps {
  courseId: string;
  chapterId: string;
  chapterTitle?: string;
  lesson: ApiLessonItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  suggestedOrder?: number;
}

interface LessonFormContentProps {
  courseId: string;
  chapterId: string;
  chapterTitle?: string;
  lesson: ApiLessonItem | null;
  onClose: () => void;
  onSuccess: () => void;
  suggestedOrder: number;
}

function LessonFormContent({
  courseId,
  chapterId,
  chapterTitle,
  lesson,
  onClose,
  onSuccess,
  suggestedOrder,
}: LessonFormContentProps) {
  const isEditing = Boolean(lesson);

  const initialType = (lesson?.type || 'video').toLowerCase() === 'text' ? 'text' : 'video';
  const initialDuration = lesson?.duration || 0;

  const [title, setTitle] = useState(lesson?.title || '');
  const [type, setType] = useState<'video' | 'text'>(initialType);
  const [durationMinutes, setDurationMinutes] = useState<number>(
    isEditing ? Math.floor(initialDuration / 60) : 10
  );
  const [durationSeconds, setDurationSeconds] = useState<number>(
    isEditing ? initialDuration % 60 : 0
  );
  const [bunnyVideoId, setBunnyVideoId] = useState<string | null>(lesson?.bunnyVideoId || null);
  const [videoSourceMode, setVideoSourceMode] = useState<'bunny' | 'url'>(
    lesson?.bunnyVideoId ? 'bunny' : lesson?.videoUrl ? 'url' : 'bunny'
  );
  const [videoUrl, setVideoUrl] = useState(lesson?.videoUrl || '');
  const [content, setContent] = useState(lesson?.content || '');
  const [isDemo, setIsDemo] = useState(Boolean(lesson?.isDemo));
  const [showLivePreview, setShowLivePreview] = useState(Boolean(lesson?.videoUrl));

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleClose = () => {
    if (isSubmitting) return;
    setValidationError(null);
    onClose();
  };

  const videoParsed = parseVideoUrl(videoUrl);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setValidationError('Vui lòng nhập tên bài học.');
      return;
    }

    if (trimmedTitle.length < 5) {
      setValidationError('Tên bài học phải có tối thiểu 5 ký tự theo quy định hệ thống.');
      return;
    }

    const totalDurationSecs = Math.max(0, durationMinutes * 60 + durationSeconds);

    const trimmedVideoUrl = videoUrl.trim();
    if (type === 'video' && videoSourceMode === 'url' && trimmedVideoUrl) {
      try {
        new URL(trimmedVideoUrl);
      } catch {
        setValidationError('Đường dẫn Video URL không hợp lệ. Vui lòng nhập URL dạng http:// hoặc https://');
        return;
      }
    }

    setValidationError(null);
    setIsSubmitting(true);

    try {
      const payloadVideoId = videoSourceMode === 'bunny' ? (bunnyVideoId || undefined) : undefined;
      const payloadVideoUrl = videoSourceMode === 'url' ? (trimmedVideoUrl || undefined) : undefined;

      if (isEditing && lesson) {
        const lessonId = lesson.id || lesson._id;
        if (!lessonId) throw new Error('Không tìm thấy mã bài học');

        await lessonService.updateLesson(lessonId, {
          title: trimmedTitle,
          type,
          duration: totalDurationSecs,
          bunnyVideoId: payloadVideoId,
          videoUrl: payloadVideoUrl,
          content: content.trim() || undefined,
          isDemo,
        });
        toast.success(`Đã cập nhật bài học "${trimmedTitle}" thành công!`);
      } else {
        await lessonService.createLesson({
          title: trimmedTitle,
          chapter: chapterId,
          course: courseId,
          type,
          duration: totalDurationSecs,
          bunnyVideoId: payloadVideoId,
          videoUrl: payloadVideoUrl,
          content: content.trim() || undefined,
          isDemo,
          order: suggestedOrder,
        });
        toast.success(`Đã tạo bài học mới "${trimmedTitle}" thành công!`);
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      if (err instanceof AppApiError) {
        setValidationError(err.message);
        toast.error(err.message);
      } else if (err instanceof Error) {
        setValidationError(err.message);
        toast.error(err.message);
      } else {
        const fallback = 'Đã có lỗi xảy ra khi lưu bài học.';
        setValidationError(fallback);
        toast.error(fallback);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="w-full max-w-2xl rounded-2xl border border-[#eceaf3] dark:border-[#352e43] bg-white dark:bg-[#1d1926] p-6 shadow-xl space-y-5 animate-in zoom-in-95 duration-200 my-8 max-h-[90vh] overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lesson-modal-title"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 pb-1 border-b border-[#eceaf3] dark:border-[#352e43]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#f7f1ff] dark:bg-[#282234] text-[#7240b8] dark:text-[#a87ffb] flex items-center justify-center shrink-0">
            {type === 'video' ? <FileVideo className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
          </div>
          <div>
            <h2
              id="lesson-modal-title"
              className="text-base font-bold text-[#1c192c] dark:text-[#f4eeff]"
            >
              {isEditing ? 'Chỉnh sửa bài học' : 'Thêm bài học mới'}
            </h2>
            {chapterTitle && (
              <p className="text-xs text-[#635a72] dark:text-[#a9a0b2] truncate max-w-sm">
                Chương: <span className="font-semibold">{chapterTitle}</span>
              </p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={handleClose}
          disabled={isSubmitting}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-40"
          aria-label="Đóng dialog"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Form Body */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {validationError && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Lesson Title */}
        <div className="space-y-1.5">
          <label
            htmlFor="lesson-title-input"
            className="block text-xs font-semibold text-[#1c192c] dark:text-[#f4eeff]"
          >
            Tên bài học <span className="text-rose-500">*</span>
          </label>
          <input
            id="lesson-title-input"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="VD: 1.1 Khởi tạo dự án Next.js và thiết lập môi trường"
            required
            disabled={isSubmitting}
            className="w-full h-10 px-3.5 rounded-xl border border-[#e2e0ea] dark:border-[#3d364b] text-xs sm:text-sm text-[#1c192c] dark:text-[#f4eeff] bg-[#fdf8ff] dark:bg-[#252030] focus:outline-none focus:ring-2 focus:ring-[#7240b8] transition-colors"
          />
          <p className="text-[11px] text-[#635a72] dark:text-[#a9a0b2]">
            Tối thiểu 5 ký tự theo quy định hợp đồng API TMDEMY.
          </p>
        </div>

        {/* Type Selection & Duration Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Type */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#1c192c] dark:text-[#f4eeff]">
              Hình thức bài học
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('video')}
                disabled={isSubmitting}
                className={`flex items-center justify-center gap-2 h-10 px-3 rounded-xl text-xs font-semibold border transition-all ${
                  type === 'video'
                    ? 'bg-[#7240b8] text-white border-[#7240b8] shadow-xs'
                    : 'bg-white dark:bg-[#252030] border-[#e2e0ea] dark:border-[#3d364b] text-[#635a72] dark:text-[#a9a0b2] hover:bg-[#f7f1ff]'
                }`}
              >
                <FileVideo className="w-4 h-4" />
                <span>Video</span>
              </button>

              <button
                type="button"
                onClick={() => setType('text')}
                disabled={isSubmitting}
                className={`flex items-center justify-center gap-2 h-10 px-3 rounded-xl text-xs font-semibold border transition-all ${
                  type === 'text'
                    ? 'bg-[#7240b8] text-white border-[#7240b8] shadow-xs'
                    : 'bg-white dark:bg-[#252030] border-[#e2e0ea] dark:border-[#3d364b] text-[#635a72] dark:text-[#a9a0b2] hover:bg-[#f7f1ff]'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Tài liệu (Text)</span>
              </button>
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#1c192c] dark:text-[#f4eeff]">
              Thời lượng ước tính
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Math.max(0, Number(e.target.value)))}
                  disabled={isSubmitting}
                  className="w-full h-10 px-3 pr-10 rounded-xl border border-[#e2e0ea] dark:border-[#3d364b] text-xs sm:text-sm text-[#1c192c] dark:text-[#f4eeff] bg-[#fdf8ff] dark:bg-[#252030] focus:outline-none focus:ring-2 focus:ring-[#7240b8]"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#635a72] dark:text-[#a9a0b2]">
                  phút
                </span>
              </div>

              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={durationSeconds}
                  onChange={(e) => setDurationSeconds(Math.max(0, Math.min(59, Number(e.target.value))))}
                  disabled={isSubmitting}
                  className="w-full h-10 px-3 pr-10 rounded-xl border border-[#e2e0ea] dark:border-[#3d364b] text-xs sm:text-sm text-[#1c192c] dark:text-[#f4eeff] bg-[#fdf8ff] dark:bg-[#252030] focus:outline-none focus:ring-2 focus:ring-[#7240b8]"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#635a72] dark:text-[#a9a0b2]">
                  giây
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Video Source Configuration (Only active when type === 'video') */}
        {type === 'video' && (
          <div className="space-y-3 p-4 rounded-2xl border border-[#eceaf3] dark:border-[#352e43] bg-[#fbf9fe] dark:bg-[#201b2a]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#eceaf3] dark:border-[#352e43]">
              <label className="block text-xs font-semibold text-[#1c192c] dark:text-[#f4eeff]">
                Nguồn phát video bài giảng
              </label>

              {/* Source Switcher Buttons */}
              <div className="inline-flex p-1 bg-white dark:bg-[#181422] rounded-xl border border-[#eceaf3] dark:border-[#352e43]">
                <button
                  type="button"
                  onClick={() => setVideoSourceMode('bunny')}
                  disabled={isSubmitting}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    videoSourceMode === 'bunny'
                      ? 'bg-[#7240b8] text-white shadow-xs'
                      : 'text-[#635a72] dark:text-[#a9a0b2] hover:text-[#1c192c] dark:hover:text-[#f4eeff]'
                  }`}
                >
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  <span>Tải lên CDN (Bunny Stream)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setVideoSourceMode('url')}
                  disabled={isSubmitting}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    videoSourceMode === 'url'
                      ? 'bg-[#7240b8] text-white shadow-xs'
                      : 'text-[#635a72] dark:text-[#a9a0b2] hover:text-[#1c192c] dark:hover:text-[#f4eeff]'
                  }`}
                >
                  <span>Liên kết ngoài (YouTube/MP4)</span>
                </button>
              </div>
            </div>

            {/* Mode 1: Bunny Stream CDN Direct Upload */}
            {videoSourceMode === 'bunny' && (
              <BunnyVideoUploader
                courseId={courseId}
                chapterId={chapterId}
                initialVideoId={bunnyVideoId || undefined}
                onVideoAssigned={(vid, duration) => {
                  setBunnyVideoId(vid);
                  if (duration && duration > 0) {
                    setDurationMinutes(Math.floor(duration / 60));
                    setDurationSeconds(Math.floor(duration % 60));
                  }
                }}
                onVideoRemoved={() => {
                  setBunnyVideoId(null);
                }}
                disabled={isSubmitting}
              />
            )}

            {/* Mode 2: External Video URL */}
            {videoSourceMode === 'url' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[#635a72] dark:text-[#a9a0b2]">
                    Hỗ trợ YouTube, link trực tiếp MP4, WebM hoặc Cloudinary CDN.
                  </span>
                  {videoUrl && (
                    <button
                      type="button"
                      onClick={() => setShowLivePreview(!showLivePreview)}
                      className="text-xs font-semibold text-[#7240b8] dark:text-[#a87ffb] hover:underline flex items-center gap-1"
                    >
                      <Play className="w-3 h-3" />
                      <span>{showLivePreview ? 'Ẩn xem trước' : 'Xem trước video'}</span>
                    </button>
                  )}
                </div>

                <input
                  id="lesson-videourl-input"
                  type="url"
                  value={videoUrl}
                  onChange={(e) => {
                    setVideoUrl(e.target.value);
                    if (e.target.value.trim()) setShowLivePreview(true);
                  }}
                  placeholder="https://www.youtube.com/watch?v=... hoặc URL video MP4"
                  disabled={isSubmitting}
                  className="w-full h-10 px-3.5 rounded-xl border border-[#e2e0ea] dark:border-[#3d364b] text-xs sm:text-sm text-[#1c192c] dark:text-[#f4eeff] bg-white dark:bg-[#252030] focus:outline-none focus:ring-2 focus:ring-[#7240b8]"
                />

                {/* Live Video Preview Box */}
                {showLivePreview && videoUrl.trim() && (
                  <div className="mt-2 rounded-xl overflow-hidden border border-[#eceaf3] dark:border-[#352e43] bg-black aspect-video max-h-56 w-full flex items-center justify-center">
                    {videoParsed.type === 'youtube' && videoParsed.embedUrl ? (
                      <iframe
                        src={videoParsed.embedUrl}
                        title="Preview"
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : videoParsed.type === 'direct' && videoParsed.directUrl ? (
                      <video
                        src={videoParsed.directUrl}
                        controls
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="p-4 text-center text-xs text-amber-400 flex items-center justify-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>URL chưa nhận diện được player. Hãy kiểm tra lại định dạng.</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Demo Lesson Toggle */}
        <div className="p-3.5 rounded-xl border border-[#eceaf3] dark:border-[#352e43] bg-[#f7f1ff]/50 dark:bg-[#282234]/50 flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#1c192c] dark:text-[#f4eeff]">
                Cho phép học thử (Free Demo)
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                <Sparkles className="w-3 h-3" />
                <span>Xem trước</span>
              </span>
            </div>
            <p className="text-[11px] text-[#635a72] dark:text-[#a9a0b2]">
              Học viên chưa mua khóa học có thể xem miễn phí bài học này để trải nghiệm chất lượng giảng dạy.
            </p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={isDemo}
              onChange={(e) => setIsDemo(e.target.checked)}
              disabled={isSubmitting}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#7240b8]"></div>
          </label>
        </div>

        {/* Lesson Content / Notes */}
        <div className="space-y-1.5">
          <label
            htmlFor="lesson-content-input"
            className="block text-xs font-semibold text-[#1c192c] dark:text-[#f4eeff]"
          >
            Nội dung tóm tắt / Hướng dẫn bài học
          </label>
          <textarea
            id="lesson-content-input"
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Ghi chú nội dung trọng tâm, tài liệu tham khảo đính kèm hoặc yêu cầu thực hành..."
            disabled={isSubmitting}
            className="w-full p-3 rounded-xl border border-[#e2e0ea] dark:border-[#3d364b] text-xs sm:text-sm text-[#1c192c] dark:text-[#f4eeff] bg-[#fdf8ff] dark:bg-[#252030] focus:outline-none focus:ring-2 focus:ring-[#7240b8] transition-colors resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#eceaf3] dark:border-[#352e43]">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-40"
          >
            Hủy
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-[#7240b8] hover:bg-[#5e3299] text-white shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>{isEditing ? 'Cập nhật bài học' : 'Lưu bài học'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export function LessonModal({
  courseId,
  chapterId,
  chapterTitle,
  lesson,
  isOpen,
  onClose,
  onSuccess,
  suggestedOrder = 1,
}: LessonModalProps) {
  if (!isOpen) return null;

  const key = lesson ? lesson.id || lesson._id || 'edit' : `new-${chapterId}-${suggestedOrder}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto"
      onClick={onClose}
    >
      <LessonFormContent
        key={key}
        courseId={courseId}
        chapterId={chapterId}
        chapterTitle={chapterTitle}
        lesson={lesson}
        onClose={onClose}
        onSuccess={onSuccess}
        suggestedOrder={suggestedOrder}
      />
    </div>
  );
}
