/**
 * Enrollment API Contract Types (api/ENROLLMENT_API.md)
 */
export interface ApiEnrollmentItem {
  id?: string;
  _id?: string;
  userId: string;
  courseId: string;
  progress?: number;
  status?: 'ACTIVE' | 'COMPLETED' | 'CANCELED' | string;
  completedAt?: string | null;
  createdAt?: string;
  enrolledAt?: string;
  course?: {
    id?: string;
    _id?: string;
    slug?: string;
    title?: string;
    image?: string;
    price?: number;
    level?: string;
  };
}

export interface GetMyEnrollmentsResponse {
  success: boolean;
  message?: string;
  data: ApiEnrollmentItem[];
}

export interface CourseStudentItem {
  id?: string;
  _id?: string;
  userId: string;
  courseId: string;
  progress?: number;
  status?: string;
  user?: {
    id?: string;
    _id?: string;
    username: string;
    email: string;
    avatar?: string;
  };
  enrolledAt?: string;
  createdAt?: string;
}

export interface GetCourseStudentsResponse {
  success: boolean;
  message?: string;
  data: {
    students: CourseStudentItem[];
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface RemoveStudentResponse {
  success: boolean;
  message?: string;
}

export interface StudentCompletedLessonItem {
  id?: string;
  _id?: string;
  lessonId: string;
  title: string;
  completed: boolean;
  completedAt: string;
}

export interface StudentQuizSubmissionItem {
  id?: string;
  _id?: string;
  quizId: string;
  quizTitle: string;
  score: number;
  maxScore: number;
  passed: boolean;
  submittedAt: string;
}

export interface StudentLearningProgressEnrollment {
  id?: string;
  _id?: string;
  userId: string;
  courseId: string;
  progress: number;
  status: string;
  enrolledAt: string;
  completedAt?: string | null;
}

export interface StudentLearningProgressData {
  enrollment: StudentLearningProgressEnrollment;
  completedLessons: StudentCompletedLessonItem[];
  quizSubmissions: StudentQuizSubmissionItem[];
}

export interface GetStudentLearningProgressResponse {
  success: boolean;
  message?: string;
  data: StudentLearningProgressData;
}


