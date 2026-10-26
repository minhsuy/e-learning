'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import * as tus from 'tus-js-client';
import { videoService } from '@/services/video.service';
import { BunnyVideoStatus, VideoStatusData } from '@/types/video';
import { AppApiError } from '@/types/api';

export type BunnyUploadStage =
  | 'idle'
  | 'signing'
  | 'uploading'
  | 'paused'
  | 'transcoding'
  | 'ready'
  | 'error';

export interface UseBunnyUploadOptions {
  courseId: string;
  chapterId?: string;
  initialVideoId?: string;
  onUploadSuccess?: (videoId: string) => void;
  onReady?: (status: VideoStatusData) => void;
  onError?: (error: string) => void;
}

export function useBunnyUpload({
  courseId,
  chapterId,
  initialVideoId,
  onUploadSuccess,
  onReady,
  onError,
}: UseBunnyUploadOptions) {
  const [file, setFile] = useState<File | null>(null);
  const [videoId, setVideoId] = useState<string | null>(initialVideoId || null);
  const [stage, setStage] = useState<BunnyUploadStage>(initialVideoId ? 'ready' : 'idle');
  const [uploadProgress, setUploadProgress] = useState<number>(initialVideoId ? 100 : 0);
  const [bytesUploaded, setBytesUploaded] = useState<number>(0);
  const [totalBytes, setTotalBytes] = useState<number>(0);
  const [transcodeProgress, setTranscodeProgress] = useState<number>(0);
  const [videoStatus, setVideoStatus] = useState<BunnyVideoStatus | null>(null);
  const [statusData, setStatusData] = useState<VideoStatusData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const uploadRef = useRef<tus.Upload | null>(null);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Store latest callbacks in refs to prevent closure staleness
  const callbacksRef = useRef({ onUploadSuccess, onReady, onError });
  useEffect(() => {
    callbacksRef.current = { onUploadSuccess, onReady, onError };
  }, [onUploadSuccess, onReady, onError]);

  // Stop polling helper
  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  // Poll transcoding status from backend until terminal state
  const startStatusPolling = useCallback(
    (targetVideoId: string) => {
      stopPolling();

      const checkStatus = async () => {
        if (!isMountedRef.current) return;

        try {
          const res = await videoService.getVideoStatus(targetVideoId);
          if (!isMountedRef.current || !res.success) return;

          const data = res.data;
          setStatusData(data);
          setVideoStatus(data.status);
          setTranscodeProgress(data.encodeProgress || 0);

          // Terminal state 1: READY (status 4)
          if (data.status === 'READY' || data.rawStatus === 4) {
            stopPolling();
            setStage('ready');
            setTranscodeProgress(100);
            callbacksRef.current.onReady?.(data);
            return;
          }

          // Terminal state 2: FAILED (status 5 or 6)
          if (data.status === 'FAILED' || data.rawStatus === 5 || data.rawStatus === 6) {
            stopPolling();
            setStage('error');
            const err = 'Quá trình mã hóa video trên Bunny Stream thất bại. Vui lòng thử lại.';
            setErrorMessage(err);
            callbacksRef.current.onError?.(err);
            return;
          }

          // In-progress state: PROCESSING (rawStatus 2 or 3)
          setStage('transcoding');
        } catch {
          // Non-fatal polling failure (keep polling)
        }
      };

      // Immediate check, then poll every 3 seconds
      void checkStatus();
      pollTimerRef.current = setInterval(() => {
        void checkStatus();
      }, 3000);
    },
    [stopPolling]
  );

  // If initialVideoId was provided (e.g. editing existing lesson), check its status
  useEffect(() => {
    if (initialVideoId && !file) {
      startStatusPolling(initialVideoId);
    }
  }, [initialVideoId, file, startStatusPolling]);

  // Lifecycle cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      stopPolling();
      if (uploadRef.current) {
        try {
          uploadRef.current.abort();
        } catch {
          // Safe ignore
        }
        uploadRef.current = null;
      }
    };
  }, [stopPolling]);

  // 1. File selection with validation
  const selectFile = useCallback((selectedFile: File): boolean => {
    setErrorMessage(null);

    // Validate video type
    const validVideoExtensions = /\.(mp4|mov|m4v|webm|mkv|avi|wmv|flv)$/i;
    const isVideoMime = selectedFile.type.startsWith('video/');
    const hasVideoExtension = validVideoExtensions.test(selectedFile.name);

    if (!isVideoMime && !hasVideoExtension) {
      const err = 'Định dạng tệp không hợp lệ. Vui lòng chọn tệp video (MP4, MOV, WebM, M4V, MKV).';
      setErrorMessage(err);
      callbacksRef.current.onError?.(err);
      return false;
    }

    // Validate file size (max 5GB)
    const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024;
    if (selectedFile.size > MAX_FILE_SIZE) {
      const err = 'Dung lượng tệp vượt quá giới hạn 5GB cho phép.';
      setErrorMessage(err);
      callbacksRef.current.onError?.(err);
      return false;
    }

    // Reset upload instance and states for new file
    if (uploadRef.current) {
      try {
        uploadRef.current.abort();
      } catch {}
      uploadRef.current = null;
    }
    stopPolling();

    setFile(selectedFile);
    setVideoId(null);
    setStage('idle');
    setUploadProgress(0);
    setBytesUploaded(0);
    setTotalBytes(selectedFile.size);
    setTranscodeProgress(0);
    setVideoStatus(null);
    setStatusData(null);

    return true;
  }, [stopPolling]);

  // 2. Start new upload
  const startUpload = useCallback(async () => {
    if (!file) {
      const err = 'Vui lòng chọn một tệp video trước khi bắt đầu tải lên.';
      setErrorMessage(err);
      callbacksRef.current.onError?.(err);
      return;
    }

    // Prevent duplicate triggers
    if (stage === 'signing' || stage === 'uploading') {
      return;
    }

    // If currently paused, resume instead of restarting
    if (stage === 'paused' && uploadRef.current) {
      uploadRef.current.start();
      setStage('uploading');
      return;
    }

    setErrorMessage(null);
    setStage('signing');

    try {
      // Step A: Request TUS credentials from Backend
      const sanitizedTitle = file.name.replace(/\.[^/.]+$/, '').trim() || 'Untitled Lesson Video';
      const sigRes = await videoService.getUploadSignature({
        title: sanitizedTitle,
        courseId,
        chapterId,
      });

      if (!isMountedRef.current) return;

      const {
        videoId: newVideoId,
        libraryId,
        uploadUrl,
        authorizationSignature,
        authorizationExpire,
      } = sigRes.data;

      setVideoId(newVideoId);
      setStage('uploading');

      // Step B: Initialize TUS upload direct to Bunny
      const upload = new tus.Upload(file, {
        endpoint: uploadUrl,
        retryDelays: [0, 3000, 5000, 10000, 20000],
        headers: {
          AuthorizationSignature: authorizationSignature,
          AuthorizationExpire: authorizationExpire.toString(),
          VideoId: newVideoId,
          LibraryId: libraryId.toString(),
        },
        metadata: {
          filetype: file.type || 'video/mp4',
          title: file.name,
        },
        onError: (error) => {
          if (!isMountedRef.current) return;
          console.error('Lỗi TUS upload lên Bunny CDN:', error);
          setStage('error');
          const errText = error?.message || 'Tải video lên thất bại. Vui lòng kiểm tra kết nối.';
          setErrorMessage(errText);
          callbacksRef.current.onError?.(errText);
        },
        onProgress: (uploaded, total) => {
          if (!isMountedRef.current) return;
          const percentage = Math.min(100, Math.round((uploaded / total) * 100));
          setUploadProgress(percentage);
          setBytesUploaded(uploaded);
          setTotalBytes(total);
        },
        onSuccess: () => {
          if (!isMountedRef.current) return;
          // TUS upload binary completed 100%!
          setUploadProgress(100);
          setStage('transcoding');

          // Notify parent that upload succeeded and videoId is ready to be linked
          callbacksRef.current.onUploadSuccess?.(newVideoId);

          // Begin polling transcoding progress until READY
          startStatusPolling(newVideoId);
        },
      });

      uploadRef.current = upload;

      // Start TUS upload
      upload.start();
    } catch (err: unknown) {
      if (!isMountedRef.current) return;
      setStage('error');
      let msg = 'Không thể xin cấp quyền tải video lên Bunny.';
      if (err instanceof AppApiError) {
        msg = err.message;
      } else if (err instanceof Error) {
        msg = err.message;
      }
      setErrorMessage(msg);
      callbacksRef.current.onError?.(msg);
    }
  }, [file, stage, courseId, chapterId, startStatusPolling]);

  // 3. Pause active upload
  const pauseUpload = useCallback(() => {
    if (!uploadRef.current || stage !== 'uploading') return;
    try {
      uploadRef.current.abort();
    } catch {}
    setStage('paused');
  }, [stage]);

  // 4. Resume paused upload
  const resumeUpload = useCallback(() => {
    if (!uploadRef.current || stage !== 'paused') return;
    try {
      uploadRef.current.start();
      setStage('uploading');
    } catch (err) {
      console.error('Không thể tiếp tục tải lên:', err);
      setStage('error');
      setErrorMessage('Không thể tiếp tục tải video. Vui lòng bấm thử lại.');
    }
  }, [stage]);

  // 5. Retry failed upload
  const retryUpload = useCallback(() => {
    setErrorMessage(null);
    if (uploadRef.current) {
      try {
        uploadRef.current.start();
        setStage('uploading');
        return;
      } catch {
        // Fallback to fresh start
      }
    }
    void startUpload();
  }, [startUpload]);

  // 6. Cancel & reset
  const cancelUpload = useCallback(() => {
    stopPolling();
    if (uploadRef.current) {
      try {
        uploadRef.current.abort();
      } catch {}
      uploadRef.current = null;
    }
    setFile(null);
    setVideoId(null);
    setStage('idle');
    setUploadProgress(0);
    setBytesUploaded(0);
    setTotalBytes(0);
    setTranscodeProgress(0);
    setVideoStatus(null);
    setStatusData(null);
    setErrorMessage(null);
  }, [stopPolling]);

  return {
    file,
    videoId,
    stage,
    uploadProgress,
    bytesUploaded,
    totalBytes,
    transcodeProgress,
    videoStatus,
    statusData,
    errorMessage,
    isUploading: stage === 'uploading',
    isPaused: stage === 'paused',
    isTranscoding: stage === 'transcoding',
    isReady: stage === 'ready',
    selectFile,
    startUpload,
    pauseUpload,
    resumeUpload,
    retryUpload,
    cancelUpload,
  };
}
