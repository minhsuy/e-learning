'use client';

import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  FileVideo,
  Pause,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Sparkles,
  Layers,
  Clock,
} from 'lucide-react';
import { useBunnyUpload } from '@/hooks/use-bunny-upload';
import { VideoStatusData } from '@/types/video';

interface BunnyVideoUploaderProps {
  courseId: string;
  chapterId?: string;
  initialVideoId?: string;
  onVideoAssigned: (bunnyVideoId: string, duration?: number) => void;
  onVideoRemoved: () => void;
  disabled?: boolean;
}

function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function formatDuration(seconds?: number): string {
  if (!seconds || seconds <= 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function BunnyVideoUploader({
  courseId,
  chapterId,
  initialVideoId,
  onVideoAssigned,
  onVideoRemoved,
  disabled = false,
}: BunnyVideoUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [currentBunnyId, setCurrentBunnyId] = useState<string | null>(initialVideoId || null);

  const {
    file,
    videoId,
    stage,
    uploadProgress,
    bytesUploaded,
    totalBytes,
    transcodeProgress,
    statusData,
    errorMessage,
    isUploading,
    isPaused,
    selectFile,
    startUpload,
    pauseUpload,
    resumeUpload,
    retryUpload,
    cancelUpload,
  } = useBunnyUpload({
    courseId,
    chapterId,
    initialVideoId: currentBunnyId || undefined,
    onUploadSuccess: (newVideoId) => {
      setCurrentBunnyId(newVideoId);
      onVideoAssigned(newVideoId);
    },
    onReady: (status: VideoStatusData) => {
      if (status.videoId) {
        setCurrentBunnyId(status.videoId);
        onVideoAssigned(status.videoId, status.duration || status.length);
      }
    },
  });

  // Handle Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled || isUploading) return;

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles && droppedFiles.length > 0) {
      const selected = droppedFiles[0];
      const valid = selectFile(selected);
      if (valid) {
        // Automatically initiate upload for streamlined UX
        setTimeout(() => {
          void startUpload();
        }, 100);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      const selected = selectedFiles[0];
      const valid = selectFile(selected);
      if (valid) {
        setTimeout(() => {
          void startUpload();
        }, 100);
      }
    }
  };

  const handleRemoveExistingVideo = () => {
    cancelUpload();
    setCurrentBunnyId(null);
    onVideoRemoved();
  };

  // If there is an existing video already configured and not uploading new file
  const hasExistingAssignedVideo = Boolean(currentBunnyId && !file);

  return (
    <div className="space-y-3">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/webm,video/x-matroska,.mp4,.mov,.webm,.mkv"
        onChange={handleFileChange}
        disabled={disabled || isUploading}
        className="hidden"
      />

      {/* Case 1: Existing Assigned Video view */}
      {hasExistingAssignedVideo && (
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    Video Bunny CDN đã liên kết
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-200/60 dark:bg-emerald-800/40 text-emerald-900 dark:text-emerald-200">
                    {stage === 'ready' ? 'HLS READY' : 'PROCESSING'}
                  </span>
                </div>
                <p className="text-xs text-[#635a72] dark:text-[#a9a0b2] mt-0.5">
                  Mã Bunny Video ID:{' '}
                  <span className="font-mono text-emerald-700 dark:text-emerald-400 font-semibold">
                    {currentBunnyId}
                  </span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRemoveExistingVideo}
              disabled={disabled}
              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-colors"
              title="Xóa hoặc đổi video khác"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Transcoding Info Box if status is available */}
          {statusData && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-emerald-200/60 dark:border-emerald-900/40 text-[11px] text-[#635a72] dark:text-[#a9a0b2]">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Thời lượng: {formatDuration(statusData.duration || statusData.length)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  Độ phân giải:{' '}
                  {statusData.availableResolutions && statusData.availableResolutions.length > 0
                    ? statusData.availableResolutions.join(', ')
                    : statusData.hasMP4Fallback
                    ? '720p / HLS'
                    : 'HLS Adaptive'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Mã hóa: {statusData.encodeProgress || 100}%</span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-emerald-700 dark:text-emerald-400">
              ✓ Video đã sẵn sàng phát qua chuẩn streaming thích ứng HLS của Bunny Stream.
            </span>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className="text-xs font-semibold text-[#7240b8] dark:text-[#a87ffb] hover:underline"
            >
              Thay đổi video khác
            </button>
          </div>
        </div>
      )}

      {/* Case 2: No File Selected yet -> Dropzone View */}
      {!hasExistingAssignedVideo && !file && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
            isDragOver
              ? 'border-[#7240b8] bg-[#f7f1ff] dark:bg-[#282234]'
              : 'border-[#e2e0ea] dark:border-[#3d364b] hover:border-[#7240b8] bg-[#fdf8ff] dark:bg-[#252030]/50'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className="w-12 h-12 rounded-2xl bg-[#f7f1ff] dark:bg-[#282234] text-[#7240b8] dark:text-[#a87ffb] flex items-center justify-center mx-auto mb-3 shadow-xs">
            <UploadCloud className="w-6 h-6" />
          </div>

          <h3 className="text-xs sm:text-sm font-bold text-[#1c192c] dark:text-[#f4eeff]">
            Kéo thả tệp video vào đây hoặc{' '}
            <span className="text-[#7240b8] dark:text-[#a87ffb] underline underline-offset-2">
              chọn từ máy tính
            </span>
          </h3>

          <p className="text-[11px] text-[#635a72] dark:text-[#a9a0b2] mt-1.5 max-w-md mx-auto">
            Tải trực tiếp lên mạng phân phối Bunny Stream CDN qua chuẩn TUS Resumable. Hỗ trợ MP4,
            MOV, WebM, MKV (tối đa 5GB). Video tự động được mã hóa đa độ phân giải 360p - 1080p.
          </p>

          <div className="mt-3 flex items-center justify-center gap-2 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 py-1 px-3 rounded-full w-fit mx-auto border border-emerald-200/60 dark:border-emerald-900/40">
            <Sparkles className="w-3 h-3" />
            <span>Tối ưu băng thông, chống giật lag và chống tải lậu video</span>
          </div>
        </div>
      )}

      {/* Case 3: File Selected -> Upload & Transcode Lifecycle View */}
      {!hasExistingAssignedVideo && file && (
        <div className="rounded-2xl border border-[#eceaf3] dark:border-[#352e43] bg-white dark:bg-[#1d1926] p-4 space-y-4 shadow-xs">
          {/* File Info Bar */}
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#eceaf3] dark:border-[#352e43]">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-[#f7f1ff] dark:bg-[#282234] text-[#7240b8] dark:text-[#a87ffb] flex items-center justify-center shrink-0">
                <FileVideo className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#1c192c] dark:text-[#f4eeff] truncate">
                  {file.name}
                </p>
                <p className="text-[11px] text-[#635a72] dark:text-[#a9a0b2]">
                  {formatBytes(file.size)}
                  {totalBytes > 0 && isUploading && (
                    <span className="ml-2 font-mono">
                      ({formatBytes(bytesUploaded)} / {formatBytes(totalBytes)})
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Stage Badge */}
            <div className="shrink-0">
              {stage === 'signing' && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-1 rounded-lg">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Cấp chữ ký TUS...</span>
                </span>
              )}
              {stage === 'uploading' && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2.5 py-1 rounded-lg">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang tải lên CDN ({uploadProgress}%)</span>
                </span>
              )}
              {stage === 'paused' && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-1 rounded-lg">
                  <Pause className="w-3 h-3" />
                  <span>Tạm dừng ({uploadProgress}%)</span>
                </span>
              )}
              {stage === 'transcoding' && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50 px-2.5 py-1 rounded-lg">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang mã hóa HLS ({transcodeProgress}%)</span>
                </span>
              )}
              {stage === 'ready' && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-lg">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Hoàn tất & Sẵn sàng</span>
                </span>
              )}
              {stage === 'error' && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-2.5 py-1 rounded-lg">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Lỗi tải lên</span>
                </span>
              )}
            </div>
          </div>

          {/* Progress Indicators */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#1c192c] dark:text-[#f4eeff]">
                {stage === 'transcoding'
                  ? 'Tiến độ mã hóa video (Bunny Transcode)'
                  : 'Tiến độ tải dữ liệu lên Bunny CDN'}
              </span>
              <span className="font-bold text-[#7240b8] dark:text-[#a87ffb] font-mono">
                {stage === 'transcoding' ? `${transcodeProgress}%` : `${uploadProgress}%`}
              </span>
            </div>

            {/* Binary Upload Bar */}
            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  stage === 'paused'
                    ? 'bg-amber-500'
                    : stage === 'error'
                    ? 'bg-rose-500'
                    : stage === 'transcoding' || stage === 'ready'
                    ? 'bg-emerald-500'
                    : 'bg-[#7240b8]'
                }`}
                style={{
                  width: `${stage === 'transcoding' || stage === 'ready' ? 100 : uploadProgress}%`,
                }}
              />
            </div>
          </div>

          {/* Stage Notes & Explanations */}
          {stage === 'transcoding' && (
            <div className="p-3 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-900/40 text-xs text-purple-900 dark:text-purple-200 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                <span>Video đã tải lên Bunny Stream thành công 100%!</span>
              </div>
              <p className="text-[11px] text-purple-700 dark:text-purple-300 leading-relaxed">
                Bạn <strong>hoàn toàn có thể bấm &quot;Lưu bài học&quot; ngay bây giờ</strong>. Mã
                video <code className="font-mono font-bold">{videoId}</code> đã được gắn kết hợp
                lệ. Hệ thống sẽ tiếp tục xử lý các độ phân giải trong nền mà không làm gián đoạn
                thao tác của bạn.
              </p>
            </div>
          )}

          {stage === 'ready' && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 text-xs text-emerald-800 dark:text-emerald-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Video đã mã hóa xong toàn bộ độ phân giải và sẵn sàng phát mượt mà!</span>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold">Đã xảy ra lỗi:</p>
                <p>{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-1">
            {stage === 'idle' && (
              <button
                type="button"
                onClick={() => void startUpload()}
                disabled={disabled}
                className="px-3.5 py-1.5 rounded-xl bg-[#7240b8] hover:bg-[#5e3299] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Bắt đầu tải lên</span>
              </button>
            )}

            {isUploading && (
              <button
                type="button"
                onClick={pauseUpload}
                disabled={disabled}
                className="px-3 py-1.5 rounded-xl bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/50 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Pause className="w-3.5 h-3.5" />
                <span>Tạm dừng</span>
              </button>
            )}

            {isPaused && (
              <button
                type="button"
                onClick={resumeUpload}
                disabled={disabled}
                className="px-3.5 py-1.5 rounded-xl bg-[#7240b8] hover:bg-[#5e3299] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Tiếp tục tải lên</span>
              </button>
            )}

            {stage === 'error' && (
              <button
                type="button"
                onClick={retryUpload}
                disabled={disabled}
                className="px-3.5 py-1.5 rounded-xl bg-[#7240b8] hover:bg-[#5e3299] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Thử lại</span>
              </button>
            )}

            {/* Cancel/Reset Button */}
            <button
              type="button"
              onClick={cancelUpload}
              disabled={disabled || stage === 'signing'}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {stage === 'ready' || stage === 'transcoding' ? 'Chọn video khác' : 'Hủy tải lên'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
