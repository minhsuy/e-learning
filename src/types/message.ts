import { ApiResponse } from './api';

export type MessageType = 'text' | 'image' | 'file';

export interface MessageSender {
  id: string;
  _id?: string;
  username: string;
  avatar?: string | null;
}

export interface Message {
  id: string;
  _id?: string;
  conversationId: string;
  conversation?: string;
  senderId: string;
  sender: MessageSender;
  content: string;
  type: MessageType;
  isEdited?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface SendMessagePayload {
  conversationId: string;
  content: string;
  type?: MessageType;
}

export interface EditMessagePayload {
  messageId: string;
  content: string;
}

export interface DeleteMessagePayload {
  messageId: string;
}

export interface TypingPayload {
  conversationId: string;
}

export interface UserTypingEvent {
  userId: string;
  conversationId: string;
}

export type MessageListResponse = ApiResponse<Message[]>;
