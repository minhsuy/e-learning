/**
 * TMDEMY — Lesson AI Content & Summary Types
 */

export type AiProcessingStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface LessonAiContentData {
  id: string;
  summary?: string | null;
  transcript?: string | null;
  transcriptOriginal?: string | null;
  transcriptRefined?: string | null;
  aiProcessingStatus?: AiProcessingStatus | null;
  aiProcessedAt?: string | null;
  aiProcessingError?: string | null;
  updatedAt?: string;
}

export interface LessonAiContentResponse {
  success: boolean;
  statusCode?: number;
  message?: string;
  data: LessonAiContentData;
}

export interface UpdateLessonAiContentPayload {
  summary?: string;
  transcript?: string;
  transcriptRefined?: string;
}

export interface TriggerAiProcessPayload {
  jobType?: 'TRANSCRIBE_AND_SUMMARIZE' | 'TRANSCRIPTION' | 'SUMMARY';
  model?: string;
  videoFingerprint?: string;
}

export interface AiJobStatusData {
  id: string;
  status: 'PENDING' | 'SUBMITTING' | 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  jobType: string;
  currentStage?: string;
  errorMessage?: string | null;
  completedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AiJobStatusResponse {
  success: boolean;
  statusCode?: number;
  message?: string;
  data?: AiJobStatusData;
}
