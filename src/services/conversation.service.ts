import { apiClient } from '@/lib/api/client';
import {
  ConversationDetailResponse,
  ConversationListResponse,
  CreateConversationRequest,
} from '@/types/conversation';

/**
 * Conversation Service
 * Manages 1-on-1 private chats and group course chats.
 * Strictly adheres to api/CONVERSATION_API.md source of truth.
 */
export const conversationService = {
  /**
   * Fetch all conversations the authenticated user is participating in.
   * Ordered by newest message / update time.
   */
  getConversations(): Promise<ConversationListResponse> {
    return apiClient.get<ConversationListResponse>('/api/conversations/');
  },

  /**
   * Initialize a new conversation or retrieve an existing one.
   * Idempotent: returns existing 1-1 chat if already created between sender and receiver.
   */
  createConversation(data: CreateConversationRequest): Promise<ConversationDetailResponse> {
    return apiClient.post<ConversationDetailResponse>('/api/conversations/', data);
  },
};
