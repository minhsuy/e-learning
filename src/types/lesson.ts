/**
 * TMDEMY — Lesson API Contract Types (api/LESSON_API.md)
 */

export interface ApiLessonItem {
  id: string;
  _id?: string;
  title: string;
  slug?: string;
  chapterId?: string;
  chapter?: string;
  courseId?: string;
  course?: string;
  authorId?: string;
  author?: string;
  order: number;
  duration?: number; // duration in seconds
  type?: 'VIDEO' | 'video' | 'TEXT' | 'text' | string;
  content?: string;
  videoUrl?: string;
  bunnyVideoId?: string;
  videoStatus?: 'CREATED' | 'UPLOADING' | 'PROCESSING' | 'READY' | 'FAILED' | string;
  isDemo?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface GetLessonsByChapterResponse {
  success: boolean;
  message?: string;
  data: ApiLessonItem[];
}

export interface CreateLessonDto {
  title: string;
  chapter: string;
  course: string;
  type?: 'video' | 'text' | string;
  duration?: number;
  videoUrl?: string;
  bunnyVideoId?: string;
  content?: string;
  isDemo?: boolean;
  order?: number;
}

export interface CreateLessonResponse {
  success: boolean;
  message: string;
  data: ApiLessonItem;
}

export interface UpdateLessonDto {
  title?: string;
  duration?: number;
  videoUrl?: string;
  bunnyVideoId?: string;
  content?: string;
  isDemo?: boolean;
  type?: 'video' | 'text' | string;
}

export interface UpdateLessonResponse {
  success: boolean;
  message?: string;
  data: ApiLessonItem;
}

export interface DeleteLessonResponse {
  success: boolean;
  message: string;
}
