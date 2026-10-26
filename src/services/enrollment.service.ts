import { apiClient } from '@/lib/api/client';
import {
  GetMyEnrollmentsResponse,
  GetCourseStudentsResponse,
  RemoveStudentResponse,
  GetStudentLearningProgressResponse,
} from '@/types/enrollment';

/**
 * Enrollment Service
 * Giao tiếp với endpoint ghi danh theo đặc tả api/ENROLLMENT_API.md
 */
export const enrollmentService = {
  /**
   * Lấy danh sách khóa học người dùng hiện tại đã ghi danh
   * GET /api/enrollments/my
   */
  async getMyEnrollments(options?: { signal?: AbortSignal }): Promise<GetMyEnrollmentsResponse> {
    return apiClient.get<GetMyEnrollmentsResponse>('/api/enrollments/my', {
      signal: options?.signal,
    });
  },

  /**
   * Giảng viên hoặc Quản trị viên xem danh sách học viên trong khóa học cụ thể
   * GET /api/enrollments/course/:id
   */
  async getCourseStudents(
    courseId: string,
    params?: { page?: number; limit?: number; search?: string },
    options?: { signal?: AbortSignal }
  ): Promise<GetCourseStudentsResponse> {
    const queryParams: Record<string, string | number | undefined> = {};
    if (params?.page !== undefined) queryParams.page = params.page;
    if (params?.limit !== undefined) queryParams.limit = params.limit;
    if (params?.search !== undefined && params.search.trim()) queryParams.search = params.search.trim();

    return apiClient.get<GetCourseStudentsResponse>(`/api/enrollments/course/${encodeURIComponent(courseId)}`, {
      params: queryParams,
      signal: options?.signal,
    });
  },

  /**
   * Giảng viên hoặc Quản trị viên gỡ bỏ học viên khỏi khóa học
   * DELETE /api/enrollments/course/:id/:userId
   */
  async removeStudent(
    courseId: string,
    userId: string,
    options?: { signal?: AbortSignal }
  ): Promise<RemoveStudentResponse> {
    return apiClient.delete<RemoveStudentResponse>(
      `/api/enrollments/course/${encodeURIComponent(courseId)}/${encodeURIComponent(userId)}`,
      { signal: options?.signal }
    );
  },

  /**
   * Giảng viên hoặc Quản trị viên xem tiến độ học tập chi tiết của học viên trong khóa học
   * GET /api/enrollments/course/:courseId/students/:userId/progress
   */
  async getStudentProgress(
    courseId: string,
    userId: string,
    options?: { signal?: AbortSignal }
  ): Promise<GetStudentLearningProgressResponse> {
    return apiClient.get<GetStudentLearningProgressResponse>(
      `/api/enrollments/course/${encodeURIComponent(courseId)}/students/${encodeURIComponent(userId)}/progress`,
      { signal: options?.signal }
    );
  },

  /**
   * Tra cứu tiến độ học tập chi tiết thông qua mã ghi danh
   * GET /api/enrollments/:enrollmentId/progress
   */
  async getStudentProgressByEnrollmentId(
    enrollmentId: string,
    options?: { signal?: AbortSignal }
  ): Promise<GetStudentLearningProgressResponse> {
    return apiClient.get<GetStudentLearningProgressResponse>(
      `/api/enrollments/${encodeURIComponent(enrollmentId)}/progress`,
      { signal: options?.signal }
    );
  },
};

