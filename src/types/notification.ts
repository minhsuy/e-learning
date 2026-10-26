import { ApiPagination, ApiResponse } from './api';

export type NotificationType =
  | 'COMMENT'
  | 'RATING'
  | 'ORDER'
  | 'MESSAGE'
  | 'SYSTEM'
  | 'COURSE'
  | 'LESSON'
  | 'COMMENT_REPLY'
  | 'QUIZ'
  | (string & {});

export interface ApiNotificationSender {
  id: string;
  _id?: string;
  username: string;
  avatar?: string;
}

export interface NotificationMetadata {
  courseId?: string;
  courseSlug?: string;
  lessonId?: string;
  commentId?: string;
  parentId?: string;
  [key: string]: unknown;
}

export interface ApiNotification {
  id: string;
  _id?: string;
  senderId?: string;
  receiverId?: string;
  sender?: ApiNotificationSender | null;
  type: NotificationType;
  message: string;
  relatedId?: string | null;
  metadata?: NotificationMetadata | null;
  isRead: boolean;
  read?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface GetNotificationsParams {
  page?: number;
  limit?: number;
  type?: NotificationType;
}

export interface NotificationsListData {
  notifications: ApiNotification[];
  pagination: ApiPagination;
}

export type GetNotificationsResponse = ApiResponse<NotificationsListData>;

export interface MarkReadData {
  id: string;
  _id?: string;
  isRead: boolean;
  read?: boolean;
}

export type MarkNotificationReadResponse = ApiResponse<MarkReadData>;
