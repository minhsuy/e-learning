/**
 * TMDEMY — Chapter API Contract Types (api/CHAPTER_API.md)
 */

import { ApiLessonItem } from './lesson';

export interface ApiChapterItem {
  id: string;
  _id?: string;
  title: string;
  order: number;
  course: string;
  courseId?: string;
  _destroy?: boolean;
  lessons?: ApiLessonItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface GetChaptersByCourseResponse {
  success: boolean;
  message?: string;
  data: ApiChapterItem[];
}

export interface CreateChapterDto {
  title: string;
  order?: number;
}

export interface CreateChapterResponse {
  success: boolean;
  message: string;
  data: ApiChapterItem;
}

export interface UpdateChapterDto {
  title?: string;
  order?: number;
  _destroy?: boolean;
}

export interface UpdateChapterResponse {
  success: boolean;
  message: string;
  data: ApiChapterItem;
}

export interface DeleteChapterResponse {
  success: boolean;
  message: string;
}
