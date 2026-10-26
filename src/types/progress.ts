/**
 * TMDEMY — Progress Tracking API Contract Types (api/PROGRESS_API.md)
 */

export interface ApiProgressLessonItem {
  id: string;
  _id?: string;
  title?: string;
  order?: number;
  completed: boolean;
}

export interface ApiCourseProgressData {
  totalLessons: number;
  completedLessons: number;
  percent: number;
  lessons: ApiProgressLessonItem[];
}

export interface GetCourseProgressResponse {
  success: boolean;
  message?: string;
  data: ApiCourseProgressData;
}

export interface CompleteLessonPayload {
  courseId: string;
  lessonId: string;
}

export interface CompleteLessonResponse {
  success: boolean;
  message?: string;
  data: {
    progress: number;
  };
}
