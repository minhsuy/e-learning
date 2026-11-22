/**
 * TMDEMY — AI TUTOR TYPES & DTOs
 *
 * Source of Truth: api/AI_TUTOR_CHAT_API.md
 * Handles student AI Tutor conversation sessions, multi-turn chat messages,
 * grounded RAG citations, and video player seeking.
 */

export type AiTutorRole = 'user' | 'assistant';

export type RagStatus =
  | 'ANSWERED'
  | 'INSUFFICIENT_CONTEXT'
  | 'INDEX_NOT_READY'
  | 'INDEX_STALE';

/**
 * Citation DTO representing a timestamped segment in the lesson video transcript.
 * Note: startTime and endTime are in SECONDS (float), never milliseconds.
 */
export interface CitationDto {
  chunkId: string;
  startTime: number;          // In seconds (float)
  endTime: number;            // In seconds (float)
  startTimeFormatted: string; // e.g. "00:45"
  endTimeFormatted: string;   // e.g. "01:30"
  snippet: string;            // Exact transcript excerpt
}

/**
 * Retrieval diagnostic information returned by backend RAG pipeline.
 */
export interface AiTutorRetrievalInfo {
  retrievedChunkCount?: number;
  usedChunkCount?: number;
}

/**
 * An individual message within an AI Tutor conversation session.
 */
export interface AiTutorMessage {
  id: string;
  sessionId: string;
  role: AiTutorRole;
  content: string;
  citations: CitationDto[];
  promptTokens?: number | null;
  completionTokens?: number | null;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Conversation session scoped to a specific (student, lesson) pair.
 */
export interface AiTutorSession {
  id: string;
  userId: string;
  lessonId: string;
  title: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    messages: number;
  };
}

export interface AiTutorPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * API Request & Response Types
 */

export interface CreateSessionPayload {
  title?: string;
}

export interface CreateSessionResponse {
  success: boolean;
  statusCode?: number;
  message?: string;
  data: AiTutorSession;
}

export interface ListSessionsParams {
  page?: number;
  limit?: number;
  status?: 'active' | 'archived' | 'all';
  includeArchived?: boolean;
}

export interface ListSessionsResponse {
  success: boolean;
  statusCode?: number;
  message?: string;
  data: AiTutorSession[];
  pagination: AiTutorPagination;
}

export interface GetSessionDetailsResponse {
  success: boolean;
  statusCode?: number;
  message?: string;
  data?:
    | {
        session?: AiTutorSession;
        messages?: AiTutorMessage[];
        pagination?: AiTutorPagination;
      }
    | AiTutorSession;
  messages?: AiTutorMessage[];
  pagination?: AiTutorPagination;
}

export interface SendMessagePayload {
  content: string;
  question?: string; // Accepted as alias by backend
}

export interface SendMessageResponse {
  success: boolean;
  statusCode?: number;
  message?: string;
  data: {
    userMessage: AiTutorMessage;
    assistantMessage: AiTutorMessage;
    ragStatus: RagStatus;
    retrieval?: AiTutorRetrievalInfo;
  };
}

export interface UpdateSessionPayload {
  title?: string;
  isActive?: boolean;
}

export interface UpdateSessionResponse {
  success: boolean;
  statusCode?: number;
  message?: string;
  data: AiTutorSession;
}

export interface DeleteSessionResponse {
  success: boolean;
  statusCode?: number;
  action: 'ARCHIVED' | 'DELETED';
  message: string;
}

/**
 * Video Player Handle Interface for seeking from citations.
 */
export interface LessonVideoPlayerHandle {
  seekTo: (seconds: number) => void;
}

