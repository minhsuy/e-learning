import { apiClient } from '@/lib/api/client';
import {
  TeacherOverviewResponse,
  TeacherRevenueParams,
  TeacherRevenueResponse,
  TeacherCoursesStatsParams,
  TeacherCoursesStatsResponse,
  TeacherEnrollmentStatsParams,
  TeacherEnrollmentStatsResponse,
  TeacherLearningStatsResponse,
  TeacherCoursePerformanceResponse,
} from '@/types/teacher-statistics';

/**
 * Teacher Statistics Service
 * Kết nối toàn bộ 6 API Thống kê Giảng viên theo chuẩn api/TEACHER_STATISTICS_API.md (STEP 08.2).
 * Mọi endpoint sử dụng cache: 'no-store' và xác thực danh tính giảng viên hoàn toàn qua Bearer JWT.
 */
export const teacherStatisticsService = {
  /**
   * 1. Cung cấp tổng quan các chỉ số KPI trọng yếu của Giảng viên
   * GET /api/teacher/statistics/overview
   */
  async getOverview(options?: { signal?: AbortSignal }): Promise<TeacherOverviewResponse> {
    return apiClient.get<TeacherOverviewResponse>('/api/teacher/statistics/overview', {
      signal: options?.signal,
      cache: 'no-store',
    });
  },

  /**
   * 2. Dữ liệu biểu đồ doanh thu theo chu kỳ (7days, 30days, 12months, custom), timeBasis, timezone, courseId
   * GET /api/teacher/statistics/revenue
   */
  async getRevenue(
    params?: TeacherRevenueParams,
    options?: { signal?: AbortSignal }
  ): Promise<TeacherRevenueResponse> {
    const queryParams: Record<string, string | undefined> = {};
    if (params?.period) queryParams.period = params.period;
    if (params?.startDate) queryParams.startDate = params.startDate;
    if (params?.endDate) queryParams.endDate = params.endDate;
    if (params?.courseId) queryParams.courseId = params.courseId;
    if (params?.timeBasis) queryParams.timeBasis = params.timeBasis;
    if (params?.timezone) queryParams.timezone = params.timezone;

    return apiClient.get<TeacherRevenueResponse>('/api/teacher/statistics/revenue', {
      params: queryParams,
      signal: options?.signal,
      cache: 'no-store',
    });
  },

  /**
   * 3. Bảng xếp hạng và hiệu suất từng khóa học của giảng viên
   * GET /api/teacher/statistics/courses
   */
  async getCoursesStats(
    params?: TeacherCoursesStatsParams,
    options?: { signal?: AbortSignal }
  ): Promise<TeacherCoursesStatsResponse> {
    const queryParams: Record<string, string | number | undefined> = {};
    if (params?.page !== undefined) queryParams.page = params.page;
    if (params?.limit !== undefined) queryParams.limit = params.limit;
    if (params?.sortBy) queryParams.sortBy = params.sortBy;
    if (params?.order) queryParams.order = params.order;
    if (params?.status) queryParams.status = params.status;

    return apiClient.get<TeacherCoursesStatsResponse>('/api/teacher/statistics/courses', {
      params: queryParams,
      signal: options?.signal,
      cache: 'no-store',
    });
  },

  /**
   * 4. Thống kê số lượng ghi danh mới theo thời gian và phân bố trạng thái
   * GET /api/teacher/statistics/enrollments
   */
  async getEnrollmentsStats(
    params?: TeacherEnrollmentStatsParams,
    options?: { signal?: AbortSignal }
  ): Promise<TeacherEnrollmentStatsResponse> {
    const queryParams: Record<string, string | undefined> = {};
    if (params?.period) queryParams.period = params.period;
    if (params?.courseId) queryParams.courseId = params.courseId;

    return apiClient.get<TeacherEnrollmentStatsResponse>('/api/teacher/statistics/enrollments', {
      params: queryParams,
      signal: options?.signal,
      cache: 'no-store',
    });
  },

  /**
   * 5. Thống kê tiến độ học tập trung bình, tỷ lệ hoàn thành và chứng chỉ đã cấp
   * GET /api/teacher/statistics/learning
   */
  async getLearningStats(
    params?: { courseId?: string },
    options?: { signal?: AbortSignal }
  ): Promise<TeacherLearningStatsResponse> {
    const queryParams: Record<string, string | undefined> = {};
    if (params?.courseId) queryParams.courseId = params.courseId;

    return apiClient.get<TeacherLearningStatsResponse>('/api/teacher/statistics/learning', {
      params: queryParams,
      signal: options?.signal,
      cache: 'no-store',
    });
  },

  /**
   * 6. Complete snapshot phân tích hiệu suất chuyên sâu và funnel bài học của khóa học
   * GET /api/teacher/statistics/course-performance/:courseId
   */
  async getCoursePerformance(
    courseId: string,
    options?: { signal?: AbortSignal }
  ): Promise<TeacherCoursePerformanceResponse> {
    return apiClient.get<TeacherCoursePerformanceResponse>(
      `/api/teacher/statistics/course-performance/${encodeURIComponent(courseId)}`,
      {
        signal: options?.signal,
        cache: 'no-store',
      }
    );
  },
};
