'use client';

import React, { useState, useEffect } from 'react';
import { X, PlayCircle, ExternalLink, AlertTriangle, Loader2, Sparkles } from 'lucide-react';
import { ApiLessonItem } from '@/types/lesson';
import { videoService } from '@/services/video.service';
import { LessonPlaybackData } from '@/types/video';

interface VideoPreviewModalProps {
  lesson: ApiLessonItem | null;
  isOpen: boolean;
  onClose: () => void;
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

export function VideoPreviewModal({ lesson, isOpen, onClose }: VideoPreviewModalProps) {
  const [playbackData, setPlaybackData] = useState<LessonPlaybackData | null>(null);
  const [isLoadingPlayback, setIsLoadingPlayback] = useState(false);
  const [playbackError, setPlaybackError] = useState<string | null>(null);

  const lessonId = lesson ? lesson.id || lesson._id : null;
  const hasBunny = Boolean(lesson?.bunnyVideoId);

  useEffect(() => {
    let isCancelled = false;

    if (!isOpen || !lessonId || !hasBunny) {
      queueMicrotask(() => {
        if (!isCancelled) {
          setPlaybackData(null);
          setPlaybackError(null);
          setIsLoadingPlayback(false);
        }
      });
      return;
    }

    async function fetchPlayback() {
      if (!lessonId) return;
      setIsLoadingPlayback(true);
      setPlaybackError(null);
      try {
        const res = await videoService.getLessonPlayback(lessonId);
        if (isCancelled) return;
        if (res.success && res.data) {
          setPlaybackData(res.data);
        } else {
          setPlaybackError('Không thể lấy thông tin phát video từ máy chủ.');
        }
      } catch (err: unknown) {
        if (isCancelled) return;
        setPlaybackError(
          err instanceof Error ? err.message : 'Không thể tải nguồn phát video từ Bunny CDN.'
        );
      } finally {
        if (!isCancelled) setIsLoadingPlayback(false);
      }
    }

    void fetchPlayback();

    return () => {
      isCancelled = true;
    };
  }, [isOpen, lessonId, hasBunny]);

  if (!isOpen || !lesson) return null;

  const videoInfo = parseVideoUrl(lesson.videoUrl);
  const bunnyEmbed = playbackData?.playback?.embedUrl || playbackData?.embedUrl;
  const bunnyStatus = playbackData?.playback?.videoStatus || playbackData?.status;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl rounded-2xl border border-[#eceaf3] dark:border-[#352e43] bg-white dark:bg-[#1d1926] p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="video-preview-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-2 border-b border-[#eceaf3] dark:border-[#352e43]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#f7f1ff] dark:bg-[#282234] text-[#7240b8] dark:text-[#a87ffb] flex items-center justify-center shrink-0">
              <PlayCircle className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {hasBunny ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    <span>Bunny Stream CDN</span>
                  </span>
                ) : (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#f7f1ff] dark:bg-[#282234] text-[#7240b8] dark:text-[#a87ffb]">
                    Xem trước video bài học
                  </span>
                )}
                {lesson.isDemo && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                    Học thử (Free Demo)
                  </span>
                )}
                {bunnyStatus === 'PROCESSING' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
                    Đang mã hóa HLS
                  </span>
                )}
              </div>
              <h2
                id="video-preview-title"
                className="text-base font-bold text-[#1c192c] dark:text-[#f4eeff] truncate mt-0.5"
              >
                {lesson.title}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Đóng preview"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Video Player Area */}
        <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black flex items-center justify-center border border-slate-800">
          {/* Option 1: Bunny Stream Playback */}
          {hasBunny ? (
            isLoadingPlayback ? (
              <div className="flex flex-col items-center justify-center gap-3 p-6 text-slate-300">
                <Loader2 className="w-8 h-8 animate-spin text-[#a87ffb]" />
                <p className="text-xs font-semibold">Đang chuẩn bị luồng phát Bunny CDN...</p>
              </div>
            ) : bunnyEmbed ? (
              <iframe
                src={bunnyEmbed}
                title={lesson.title}
                allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                allowFullScreen
                className="w-full h-full border-0"
              />
            ) : (
              <div className="text-center p-6 space-y-2 text-slate-400">
                <AlertTriangle className="w-10 h-10 mx-auto text-amber-500 opacity-80" />
                <p className="text-sm font-semibold text-slate-200">
                  {playbackError || 'Chưa sẵn sàng phát luồng Bunny CDN'}
                </p>
                <p className="text-xs text-slate-400">
                  Bunny Video ID: <code className="font-mono text-emerald-400">{lesson.bunnyVideoId}</code>
                </p>
              </div>
            )
          ) : /* Option 2: YouTube Fallback */
          videoInfo.type === 'youtube' && videoInfo.embedUrl ? (
            <iframe
              src={videoInfo.embedUrl}
              title={lesson.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full border-0"
            />
          ) : /* Option 3: Direct Video Fallback */
          videoInfo.type === 'direct' && videoInfo.directUrl ? (
            <video
              src={videoInfo.directUrl}
              controls
              autoPlay
              className="w-full h-full object-contain"
            >
              Trình duyệt của bạn không hỗ trợ thẻ video HTML5.
            </video>
          ) : (
            /* Option 4: Empty / Unknown Format */
            <div className="text-center p-6 space-y-2 text-slate-400">
              <AlertTriangle className="w-10 h-10 mx-auto text-amber-500 opacity-80" />
              <p className="text-sm font-semibold text-slate-200">
                {videoInfo.type === 'empty'
                  ? 'Bài học chưa có đường dẫn video (videoUrl trống)'
                  : 'Định dạng đường dẫn video không được hỗ trợ để phát trực tiếp'}
              </p>
              {lesson.videoUrl && (
                <a
                  href={lesson.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-[#a87ffb] hover:underline"
                >
                  <span>Mở liên kết trong tab mới</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between text-xs text-[#635a72] dark:text-[#a9a0b2] pt-1">
          <div className="truncate max-w-md">
            {hasBunny ? (
              <span className="text-[11px] text-emerald-700 dark:text-emerald-400">
                ID Bunny CDN: <span className="font-mono font-semibold">{lesson.bunnyVideoId}</span>
              </span>
            ) : (
              <>
                URL:{' '}
                <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {lesson.videoUrl || 'Chưa thiết lập'}
                </span>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
