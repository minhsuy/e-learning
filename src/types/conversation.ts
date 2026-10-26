import { ApiResponse } from './api';

export interface ConversationParticipant {
  id: string;
  _id?: string;
  username: string;
  avatar?: string | null;
  joinedAt?: string;
}

export interface ConversationLastMessage {
  id: string;
  _id?: string;
  conversationId?: string;
  conversation?: string;
  senderId?: string;
  sender?: unknown;
  content: string;
  type: 'text' | 'image' | 'file';
  createdAt: string;
}

export interface Conversation {
  id: string;
  _id?: string;
  isGroup: boolean;
  name?: string | null;
  courseId?: string | null;
  course?: unknown;
  lastMessageId?: string | null;
  lastMessage?: ConversationLastMessage | null;
  participants: ConversationParticipant[];
  displayName: string;
  avatar?: string | null;
  unreadCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateConversationRequest {
  receiverId?: string;
  isGroup?: boolean;
  courseId?: string;
  name?: string;
}

export type ConversationListResponse = ApiResponse<Conversation[]>;
export type ConversationDetailResponse = ApiResponse<Conversation>;
