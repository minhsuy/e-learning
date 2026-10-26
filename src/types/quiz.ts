/**
 * TMDEMY — Quiz & Question API Contract Types (api/QUIZ_API.md, api/QUESTION_API.md, api/QUIZ_SUBMISSION_API.md)
 */

export type QuestionType = 'multiple_choice' | 'fill_in_blank' | string;

export interface ApiQuizQuestion {
  id: string;
  _id?: string;
  quizId?: string;
  quiz?: string;
  type: QuestionType;
  title: string;
  options?: string[];
  answer?: string;
  points?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiQuizDetail {
  id: string;
  _id?: string;
  title: string;
  description?: string;
  duration?: number; // Minutes
  passingGrade?: number; // e.g. 80 (%)
  passing_grade?: number;
  lessonId?: string;
  lesson?: string;
  courseId?: string;
  createdById?: string;
  created_by?: string;
  questions: ApiQuizQuestion[];
  createdAt?: string;
  updatedAt?: string;
}

export interface GetQuizByLessonResponse {
  success: boolean;
  message?: string;
  data: ApiQuizDetail[];
}

export interface CreateQuizDto {
  title: string;
  lesson: string;
  courseId: string;
  description?: string;
  duration?: number;
  passing_grade?: number;
}

export interface CreateQuizResponse {
  success: boolean;
  message: string;
  data: ApiQuizDetail;
}

export interface UpdateQuizDto {
  title?: string;
  description?: string;
  duration?: number;
  passing_grade?: number;
}

export interface UpdateQuizResponse {
  success: boolean;
  message?: string;
  data: ApiQuizDetail;
}

export interface DeleteQuizResponse {
  success: boolean;
  message: string;
}

export interface QuizSubmissionAnswerPayload {
  question: string;
  selectedAnswer: string;
}

export interface QuizSubmissionPayload {
  quizId: string;
  answers: QuizSubmissionAnswerPayload[];
}

export interface ApiSubmissionAnswerResult {
  id?: string;
  _id?: string;
  submissionId?: string;
  questionId: string;
  selectedAnswer: string;
  isCorrect?: boolean;
  question?: {
    id?: string;
    _id?: string;
    quizId?: string;
    title?: string;
    type?: string;
    points?: number;
  };
}

export interface ApiQuizSubmissionData {
  id?: string;
  _id?: string;
  submissionId?: string;
  quizId?: string;
  quiz?: string;
  userId?: string;
  user?:
    | string
    | {
        id?: string;
        _id?: string;
        username?: string;
        email?: string;
        avatar?: string;
      };
  score: number;
  totalPoints?: number;
  percentage: number;
  passed?: boolean;
  passingGrade?: number;
  answers?: ApiSubmissionAnswerResult[];
  completedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface GetQuizSubmissionResponse {
  success: boolean;
  message?: string;
  data: ApiQuizSubmissionData;
}

export interface SubmitQuizResponse {
  success: boolean;
  message?: string;
  data: {
    submissionId: string;
    quizId: string;
    userId: string;
    score: number;
    percentage: number;
    passed: boolean;
    passingGrade: number;
    createdAt: string;
  };
}

export interface TeacherQuizAnalyticsData {
  quizId: string;
  totalSubmissions: number;
  passedCount: number;
  failedCount: number;
  passRate: number;
  averageScore: number;
  averagePercentage: number;
  passingGrade: number;
}

export interface GetTeacherQuizAnalyticsResponse {
  success: boolean;
  message?: string;
  data: TeacherQuizAnalyticsData;
}
