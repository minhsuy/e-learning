/**
 * Teacher Statistics Types (api/TEACHER_STATISTICS_API.md)
 */

export type TeacherTimeBasis = 'recognizedAt' | 'paidAt' | 'createdAt';
export type TeacherTimezone = 'Asia/Ho_Chi_Minh' | 'UTC';

export interface TeacherOverviewRevenue {
  totalRevenue: number;
  completedOrders: number;
  totalOrders?: number;
  paidOrders?: number;
  freeOrders?: number;
  averageOrderValue: number;
  currency: string;
}

export interface TeacherOverviewStudents {
  totalStudents: number;
  totalEnrollments?: number;
  activeStudents: number;
  completedStudents: number;
}

export interface TeacherOverviewCourses {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
}

export interface TeacherOverviewRating {
  averageRating: number;
  totalReviews: number;
}

export interface TeacherOverviewEngagement {
  averageRating: number;
  totalReviews: number;
  certificatesIssued: number;
}

export interface TeacherOverviewData {
  revenue: TeacherOverviewRevenue;
  students: TeacherOverviewStudents;
  courses: TeacherOverviewCourses;
  rating: TeacherOverviewRating;
  engagement?: TeacherOverviewEngagement;
}

export interface TeacherOverviewResponse {
  success: boolean;
  message?: string;
  data: TeacherOverviewData;
}

export interface TeacherRevenueTimelineItem {
  date: string;
  revenue: number;
  orderCount?: number;
  ordersCount: number;
}

export interface TeacherPaymentMethodBreakdownItem {
  paymentMethod: string;
  completedOrders: number;
  revenue: number;
}

export interface TeacherRevenueReportingMeta {
  timeBasis: TeacherTimeBasis | string;
  timezone: TeacherTimezone | string;
  startDate: string;
  endDate: string;
  legacyEstimatedOrders: number;
  undatedLegacyOrders: number;
}

export interface TeacherRevenueSummary {
  totalRevenue: number;
  totalOrders: number;
  completedOrders?: number;
  paidOrders?: number;
  freeOrders?: number;
  totalDiscount?: number;
  averageOrderValue: number;
  currency: string;
}

export interface TeacherRevenueData {
  summary: TeacherRevenueSummary;
  timeline: TeacherRevenueTimelineItem[];
  methodBreakdown?: TeacherPaymentMethodBreakdownItem[];
  reporting?: TeacherRevenueReportingMeta;
}

export interface TeacherRevenueResponse {
  success: boolean;
  message?: string;
  data: TeacherRevenueData;
}

export type TeacherRevenuePeriod = '7days' | '30days' | '12months' | 'custom';

export interface TeacherRevenueParams {
  period?: TeacherRevenuePeriod;
  startDate?: string;
  endDate?: string;
  courseId?: string;
  timeBasis?: TeacherTimeBasis;
  timezone?: TeacherTimezone;
}

export interface TeacherCourseStatItem {
  id: string;
  _id?: string;
  title: string;
  slug: string;
  image?: string;
  price: number;
  status: 'approved' | 'pending' | 'rejected' | string;
  view: number;
  sold?: number;
  totalStudents: number;
  totalRevenue: number;
  completedOrders?: number;
  paidOrders?: number;
  freeOrders?: number;
  averageRating: number;
  totalReviews: number;
  averageProgress?: number;
  completionRate?: number;
  createdAt: string;
}

export interface TeacherCoursesStatsData {
  courses: TeacherCourseStatItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface TeacherCoursesStatsResponse {
  success: boolean;
  message?: string;
  data: TeacherCoursesStatsData;
}

export interface TeacherCoursesStatsParams {
  page?: number;
  limit?: number;
  sortBy?: 'revenue' | 'students' | 'rating' | 'createdAt';
  order?: 'asc' | 'desc';
  status?: 'approved' | 'pending' | 'rejected';
}

export interface TeacherEnrollmentTimelineItem {
  date: string;
  count: number;
  enrollmentsCount?: number;
}

export interface TeacherEnrollmentSummary {
  totalEnrollments: number;
  activeCount: number;
  completedCount: number;
  canceledCount: number;
}

export interface TeacherEnrollmentStatusSummary {
  active: number;
  completed: number;
  canceled: number;
  total: number;
}

export interface TeacherEnrollmentStatsData {
  summary: TeacherEnrollmentSummary;
  statusSummary?: TeacherEnrollmentStatusSummary;
  timeline: TeacherEnrollmentTimelineItem[];
}

export interface TeacherEnrollmentStatsResponse {
  success: boolean;
  message?: string;
  data: TeacherEnrollmentStatsData;
}

export interface TeacherEnrollmentStatsParams {
  period?: '7days' | '30days' | '12months';
  courseId?: string;
}

export interface TeacherLearningStatsData {
  totalStudents: number;
  averageProgress: number;
  completedStudents: number;
  completionRate: number;
  certificatesIssued: number;
  certificateRate: number;
}

export interface TeacherLearningStatsResponse {
  success: boolean;
  message?: string;
  data: TeacherLearningStatsData;
}

// ==========================================
// COURSE PERFORMANCE SNAPSHOT & FUNNEL TYPES
// ==========================================

export interface TeacherCoursePerformanceCourse {
  id: string;
  _id?: string;
  title: string;
  slug: string;
  image?: string;
  price?: number;
  oldPrice?: number;
  status: string;
  level?: string;
  type?: string;
  view?: number;
  sold?: number;
  rawSold?: number;
  authorId?: string;
  createdAt?: string;
  updatedAt?: string;
  category?: {
    id: string;
    _id?: string;
    name: string;
    slug: string;
  };
}

export interface TeacherCoursePerformanceRevenue {
  totalRevenue: number;
  completedOrders: number;
  paidOrders?: number;
  freeOrders?: number;
  totalDiscount: number;
  averageOrderValue: number;
  currency: string;
}

export interface TeacherCoursePerformanceStudents {
  totalStudents: number;
  activeStudents: number;
  completedStudents: number;
  canceledStudents: number;
  completionRate: number;
  averageProgress: number;
}

export interface TeacherCoursePerformanceEngagement {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<string, number>;
  certificatesIssued: number;
  certificateRate: number;
  averageCertificateGrade: number;
}

export interface TeacherCoursePerformanceOverview {
  revenue: TeacherCoursePerformanceRevenue;
  students: TeacherCoursePerformanceStudents;
  engagement: TeacherCoursePerformanceEngagement;
}

export interface TeacherCoursePerformanceCurriculum {
  totalChapters: number;
  totalLessons: number;
  totalDuration: number;
}

export interface TeacherCoursePerformanceQuizItem {
  quizId: string;
  title: string;
  lessonId: string;
  lessonTitle: string;
  passingGrade: number;
  totalQuestions: number;
  submissionsCount: number;
  averageScore: number;
  passCount: number;
  passRate: number;
}

export interface TeacherCoursePerformanceQuizzesSummary {
  totalQuizzes: number;
  totalSubmissions: number;
  averageScore: number;
  passRate: number;
}

export interface TeacherCoursePerformanceQuizzes {
  summary: TeacherCoursePerformanceQuizzesSummary;
  items: TeacherCoursePerformanceQuizItem[];
}

export interface TeacherCoursePerformanceLessonFunnelItem {
  lessonId: string;
  lessonTitle: string;
  order: number;
  duration: number;
  type: string;
  isDemo: boolean;
  chapter: {
    id: string;
    title: string;
    order: number;
  };
  hasQuiz: boolean;
  completedStudents: number;
  completionRate: number;
  dropOffFromPrevious: number;
}

export interface TeacherCoursePerformanceData {
  course: TeacherCoursePerformanceCourse;
  overview: TeacherCoursePerformanceOverview;
  curriculum: TeacherCoursePerformanceCurriculum;
  quizzes: TeacherCoursePerformanceQuizzes;
  lessonsFunnel: TeacherCoursePerformanceLessonFunnelItem[];
}

export interface TeacherCoursePerformanceResponse {
  success: boolean;
  message?: string;
  data: TeacherCoursePerformanceData;
}

