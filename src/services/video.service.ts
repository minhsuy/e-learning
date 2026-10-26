import { apiClient } from '@/lib/api/client';
import {
  UploadSignatureRequest,
  UploadSignatureResponse,
  VideoStatusResponse,
  DeleteVideoResponse,
  LessonPlaybackResponse,
} from '@/types/video';

/**
 * TMDEMY — Bunny Stream Video Service
 * Interacts with TMDEMY Backend for video signature, status, deletion, and playback.
 * Strictly adheres to BUNNY_STREAM_INTEGRATION_REPORT.md.
 */
export const videoService = {
  /**
   * Request TUS upload credentials and create video placeholder on Bunny Stream.
   * POST /api/videos/upload-signature
   * Required Roles: TEACHER (course owner), ADMIN
   */
  async getUploadSignature(
    data: UploadSignatureRequest,
    options?: { signal?: AbortSignal }
  ): Promise<UploadSignatureResponse> {
    return apiClient.post<UploadSignatureResponse>('/api/videos/upload-signature', data, {
      signal: options?.signal,
    });
  },

  /**
   * Query real-time video transcoding and encoding progress (0-100%).
   * GET /api/videos/:videoId/status
   * Required Roles: TEACHER (video owner), ADMIN
   */
  async getVideoStatus(
    videoId: string,
    options?: { signal?: AbortSignal }
  ): Promise<VideoStatusResponse> {
    return apiClient.get<VideoStatusResponse>(
      `/api/videos/${encodeURIComponent(videoId)}/status`,
      { signal: options?.signal }
    );
  },

  /**
   * Permanently delete video asset from Bunny Stream and database.
   * DELETE /api/videos/:videoId
   * Required Roles: TEACHER (video owner), ADMIN
   */
  async deleteVideo(
    videoId: string,
    options?: { signal?: AbortSignal }
  ): Promise<DeleteVideoResponse> {
    return apiClient.delete<DeleteVideoResponse>(
      `/api/videos/${encodeURIComponent(videoId)}`,
      { signal: options?.signal }
    );
  },

  /**
   * Retrieve secure playback URLs (Embed URL, HLS playlist, thumbnail).
   * GET /api/videos/lesson/:lessonId/playback
   * Permissions: Enrolled students, Demo lessons, Teacher author, Admin
   */
  async getLessonPlayback(
    lessonId: string,
    options?: { signal?: AbortSignal }
  ): Promise<LessonPlaybackResponse> {
    return apiClient.get<LessonPlaybackResponse>(
      `/api/videos/lesson/${encodeURIComponent(lessonId)}/playback`,
      { signal: options?.signal }
    );
  },
};
