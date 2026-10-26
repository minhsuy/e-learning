/**
 * TMDEMY — Bunny Stream Video API Contract Types
 * Defines interfaces for TUS upload, video status, deletion, and playback.
 * Reference: BUNNY_STREAM_INTEGRATION_REPORT.md
 */

export type BunnyVideoStatus =
  | 'CREATED'
  | 'UPLOADING'
  | 'PROCESSING'
  | 'READY'
  | 'FAILED'
  | string;

export interface UploadSignatureRequest {
  title: string;
  courseId: string;
  chapterId?: string;
}

export interface UploadSignatureData {
  videoId: string;
  libraryId: string | number;
  uploadUrl: string;
  authorizationSignature: string;
  authorizationExpire: number;
  expiresAt?: string;
}

export interface UploadSignatureResponse {
  success: boolean;
  message: string;
  data: UploadSignatureData;
}

export interface VideoStatusData {
  videoId: string;
  status: BunnyVideoStatus;
  rawStatus: number; // 0: Created, 1: Uploading, 2,3: Processing, 4: Ready, 5,6: Failed
  encodeProgress: number; // 0 - 100
  duration?: number; // duration in seconds
  length?: number; // alias for duration in seconds
  hasMP4Fallback?: boolean;
  thumbnailUrl?: string;
  availableResolutions?: string[];
}

export interface VideoStatusResponse {
  success: boolean;
  data: VideoStatusData;
}

export interface DeleteVideoResponse {
  success: boolean;
  message: string;
}

export interface LessonPlaybackDetail {
  videoId: string;
  libraryId: string | number;
  embedUrl: string;
  hlsUrl: string;
  thumbnailUrl?: string;
  previewUrl?: string;
  videoStatus: BunnyVideoStatus;
}

export interface LessonPlaybackData {
  lessonId: string;
  title: string;
  slug?: string;
  isDemo: boolean;
  type?: string;
  duration?: number;
  playback?: LessonPlaybackDetail;
  videoUrl?: string; // Fallback (e.g. HLS playlist link, Cloudinary, YouTube, direct MP4)
  // Optional convenience fields if flattened
  embedUrl?: string;
  status?: BunnyVideoStatus;
  videoId?: string;
}

export interface LessonPlaybackResponse {
  success: boolean;
  data: LessonPlaybackData;
  message?: string;
}
