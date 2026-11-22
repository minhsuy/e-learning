import { apiClient } from '@/lib/api/client';
import {
  CreateSessionPayload,
  CreateSessionResponse,
  DeleteSessionResponse,
  GetSessionDetailsResponse,
  ListSessionsParams,
  ListSessionsResponse,
  SendMessagePayload,
  SendMessageResponse,
  UpdateSessionPayload,
  UpdateSessionResponse,
} from '@/types/ai-tutor';

/**
 * TMDEMY — AI Tutor Service
 * Connects to Node.js backend endpoints at `/api/v1/ai-tutor`
 * Primary Source of Truth: api/AI_TUTOR_CHAT_API.md
 */
export const aiTutorService = {
  /**
   * Create a new conversation session for a lesson
   * POST /api/v1/ai-tutor/lessons/:lessonId/sessions
   */
  async createSession(
    lessonId: string,
    payload?: CreateSessionPayload,
    options?: { signal?: AbortSignal }
  ): Promise<CreateSessionResponse> {
    return apiClient.post<CreateSessionResponse>(
      `/api/v1/ai-tutor/lessons/${encodeURIComponent(lessonId)}/sessions`,
      payload || {},
      { signal: options?.signal }
    );
  },

  /**
   * List all conversation sessions for the current student in a lesson
   * GET /api/v1/ai-tutor/lessons/:lessonId/sessions
   */
  async listSessions(
    lessonId: string,
    params?: ListSessionsParams,
    options?: { signal?: AbortSignal }
  ): Promise<ListSessionsResponse> {
    const queryParams: Record<string, string | number | boolean | undefined> = {};
    if (params?.page) queryParams.page = params.page;
    if (params?.limit) queryParams.limit = params.limit;
    if (params?.status) queryParams.status = params.status;
    if (params?.includeArchived !== undefined) queryParams.includeArchived = params.includeArchived;

    return apiClient.get<ListSessionsResponse>(
      `/api/v1/ai-tutor/lessons/${encodeURIComponent(lessonId)}/sessions`,
      {
        params: queryParams,
        signal: options?.signal,
      }
    );
  },

  /**
   * Get full session details and chronological message history
   * GET /api/v1/ai-tutor/sessions/:sessionId
   */
  async getSession(
    sessionId: string,
    params?: { page?: number; limit?: number },
    options?: { signal?: AbortSignal }
  ): Promise<GetSessionDetailsResponse> {
    const queryParams: Record<string, string | number | boolean | undefined> = {};
    if (params?.page) queryParams.page = params.page;
    if (params?.limit) queryParams.limit = params.limit;

    return apiClient.get<GetSessionDetailsResponse>(
      `/api/v1/ai-tutor/sessions/${encodeURIComponent(sessionId)}`,
      {
        params: queryParams,
        signal: options?.signal,
      }
    );
  },

  /**
   * Submit a student question to the session and receive grounded RAG answer
   * POST /api/v1/ai-tutor/sessions/:sessionId/messages
   */
  async sendMessage(
    sessionId: string,
    payload: SendMessagePayload,
    options?: { signal?: AbortSignal }
  ): Promise<SendMessageResponse> {
    return apiClient.post<SendMessageResponse>(
      `/api/v1/ai-tutor/sessions/${encodeURIComponent(sessionId)}/messages`,
      {
        content: payload.content.trim(),
      },
      { signal: options?.signal }
    );
  },

  /**
   * Rename session or toggle active/archived state
   * PATCH /api/v1/ai-tutor/sessions/:sessionId
   */
  async updateSession(
    sessionId: string,
    payload: UpdateSessionPayload,
    options?: { signal?: AbortSignal }
  ): Promise<UpdateSessionResponse> {
    return apiClient.patch<UpdateSessionResponse>(
      `/api/v1/ai-tutor/sessions/${encodeURIComponent(sessionId)}`,
      payload,
      { signal: options?.signal }
    );
  },

  /**
   * Archive (soft delete) or permanently delete a conversation session
   * DELETE /api/v1/ai-tutor/sessions/:sessionId?permanent=true|false
   */
  async deleteSession(
    sessionId: string,
    params?: { permanent?: boolean },
    options?: { signal?: AbortSignal }
  ): Promise<DeleteSessionResponse> {
    const queryParams: Record<string, string | number | boolean | undefined> = {};
    if (params?.permanent !== undefined) {
      queryParams.permanent = params.permanent;
    }

    return apiClient.delete<DeleteSessionResponse>(
      `/api/v1/ai-tutor/sessions/${encodeURIComponent(sessionId)}`,
      {
        params: queryParams,
        signal: options?.signal,
      }
    );
  },
};
