import { apiClient } from '@/lib/api/client';
import { MessageListResponse } from '@/types/message';

/**
 * Message Service
 * Fetches message history for a conversation.
 * Strictly adheres to api/MESSAGE_API.md source of truth.
 */
export const messageService = {
  /**
   * Fetch all messages in a conversation for the authenticated participant.
   */
  getMessages(conversationId: string): Promise<MessageListResponse> {
    return apiClient.get<MessageListResponse>(`/api/messages/${conversationId}`);
  },
};
