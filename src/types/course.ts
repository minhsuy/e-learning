/**
 * TMDEMY — Course & Learning Types (Phase F3 UI First)
 * Strict TypeScript types for Course Catalog, Detail, and Student Dashboard UI.
 * Note: Placeholder UI types for F3; no backend integration yet.
 */

export type CourseLevel = 'all' | 'beginner' | 'intermediate' | 'advanced';

export interface CourseInstructor {
  name: string;
  avatar?: string;
  initials?: string;
  title: string;
  bio?: string;
  rating?: number;
  studentsCount?: number;
  experience?: string;
}

export interface CourseLesson {
  id: string;
  title: string;
  duration: string; // e.g., "15:20"
  isFreeTrial?: boolean;
  isCompleted?: boolean;
}

export interface CourseChapter {
  id: string;
  chapterNumber: number;
  title: string;
  lessonCount: number;
  totalDuration: string;
  badge?: string;
  lessons: CourseLesson[];
}

export interface CourseReview {
  id: string;
  studentName: string;
  studentRole: string;
  avatar: string;
  rating: number;
  timeAgo: string;
  comment: string;
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  description?: string;
  thumbnail: string;
  category: string;
  badge?: 'Bán chạy nhất' | 'Bán chạy' | 'Nổi bật' | 'Đánh giá cao' | 'Xu hướng' | 'Mới' | string;
  price: number;
  originalPrice?: number;
  durationHours: number;
  totalDuration?: number;
  formattedDuration?: string;
  level: CourseLevel;
  levelLabel: string;
  rating: number;
  reviewCount: number;
  studentCount?: number;
  updatedAt?: string;
  instructor: CourseInstructor;
  hasCertificate?: boolean;
}

export interface CourseDetailData extends Course {
  outcomes: string[];
  chapters: CourseChapter[];
  totalLessons: number;
  totalDurationHours: string;
  features: string[];
  reviews: CourseReview[];
  ratingBreakdown: {
    star: number;
    percentage: number;
  }[];
}

export interface InProgressCourse {
  id: string;
  slug: string;
  title: string;
  category: string;
  thumbnail: string;
  remainingTime: string;
  completedLessons: number;
  totalLessons: number;
  progressPercent: number;
}

export interface RecommendedCourseCard {
  id: string;
  slug: string;
  title: string;
  category: string;
  badge?: string;
  thumbnail: string;
  rating: number;
  studentCount: number;
  lessonCount: number;
  instructorName: string;
  price: number;
  originalPrice?: number;
}

export interface WeeklyActivityDay {
  day: string; // 'T2', 'T3', ...
  hours: number;
  isCompleted: boolean;
  isHighest?: boolean;
}

export interface DashboardData {
  studentName: string;
  studentRole: string;
  avatar: string;
  rewardPoints: number;
  streakDays: number;
  ranking: string;
  todayMinutes: string;
  weeklyGoalProgress: number;
  activeCoursesCount: number;
  completedCoursesCount: number;
  inProgressCourses: InProgressCourse[];
  recommendedCourses: RecommendedCourseCard[];
  weeklyActivity: WeeklyActivityDay[];
  weeklyTotalHours: number;
}

/**
 * API Contract Types for Public Course Catalog (api/COURSE_API.md)
 */
export interface ApiCourseAuthor {
  id?: string;
  _id?: string;
  username: string;
  avatar?: string;
  email?: string;
  role?: string;
}

export interface ApiCourseCategory {
  id?: string;
  _id?: string;
  name: string;
  slug: string;
  description?: string;
}

export interface ApiCourseItem {
  id?: string;
  _id?: string;
  title: string;
  slug: string;
  image?: string;
  intro_url?: string;
  introUrl?: string;
  description?: string;
  type?: 'paid' | 'free' | 'PAID' | 'FREE' | string;
  status?: string;
  level?: 'beginner' | 'intermediate' | 'advanced' | 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | string;
  price: number;
  old_price?: number;
  oldPrice?: number;
  view?: number;
  sold?: number;
  category?: ApiCourseCategory;
  author?: ApiCourseAuthor;
  createdAt?: string;
  updatedAt?: string;
  averageRating?: number;
  ratingCount?: number;
  totalDuration?: number; // duration in seconds
  [key: string]: unknown;
}

export interface GetCoursesParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  level?: 'beginner' | 'intermediate' | 'advanced';
  type?: 'paid' | 'free';
  priceMin?: number;
  priceMax?: number;
  minRating?: number;
  durationMin?: number;
  durationMax?: number;
  durationRange?: 'lt-5' | '5-15' | 'gt-15' | string;
  sortBy?: 'createdAt' | 'price' | 'view' | 'sold' | 'rating' | string;
}

export interface GetCoursesResponse {
  success: boolean;
  message?: string;
  data: {
    courses: ApiCourseItem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

/**
 * Detailed Course API Contract Types (api/COURSE_API.md: GET /api/courses/:slug)
 */
export interface ApiCourseChapterLesson {
  id?: string;
  _id?: string;
  title: string;
  slug?: string;
  duration?: number; // duration in seconds
  isDemo?: boolean;
  order?: number;
  type?: string;
  videoUrl?: string;
  content?: string;
  chapterId?: string;
}

export interface ApiCourseChapter {
  id?: string;
  _id?: string;
  title: string;
  order?: number;
  lessons?: ApiCourseChapterLesson[];
  _destroy?: boolean;
}

export interface ApiCourseQA {
  question: string;
  answer: string;
}

export interface ApiCourseInfo {
  requirements?: string[];
  benefits?: string[];
  techniques?: string[];
  documents?: string[];
  qa?: ApiCourseQA[];
}

export interface ApiCourseDetail {
  id?: string;
  _id?: string;
  title: string;
  slug: string;
  image?: string;
  intro_url?: string;
  introUrl?: string;
  description?: string;
  type?: 'PAID' | 'FREE' | 'paid' | 'free' | string;
  status?: string;
  level?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'beginner' | 'intermediate' | 'advanced' | string;
  price: number;
  old_price?: number;
  oldPrice?: number;
  view?: number;
  sold?: number;
  createdAt?: string;
  updatedAt?: string;
  category?: ApiCourseCategory;
  author?: ApiCourseAuthor;
  info?: ApiCourseInfo;
  chapters?: ApiCourseChapter[];
}

export interface GetCourseDetailResponse {
  success: boolean;
  message?: string;
  data: ApiCourseDetail;
}

export function formatCourseDuration(totalSeconds?: number): string {
  if (typeof totalSeconds !== 'number' || totalSeconds <= 0) {
    return 'Chưa có bài học';
  }
  if (totalSeconds < 60) {
    return `${totalSeconds} giây`;
  }
  if (totalSeconds < 3600) {
    const mins = Math.floor(totalSeconds / 60);
    return `${mins} phút`;
  }
  const hours = Math.floor(totalSeconds / 3600);
  const remainingMins = Math.round((totalSeconds % 3600) / 60);
  if (remainingMins === 0) {
    return `${hours} giờ`;
  }
  return `${hours} giờ ${remainingMins}p`;
}

/**
 * Maps raw backend ApiCourseItem to the UI Course interface expected by CourseCard.
 */
export function mapApiCourseToCourse(item: ApiCourseItem): Course {
  const rawLevel = (item.level || '').toLowerCase();
  let normalizedLevel: CourseLevel = 'beginner';
  if (rawLevel === 'intermediate') normalizedLevel = 'intermediate';
  else if (rawLevel === 'advanced') normalizedLevel = 'advanced';

  const levelLabels: Record<string, string> = {
    beginner: 'Mới bắt đầu',
    intermediate: 'Trung cấp',
    advanced: 'Nâng cao',
  };

  const soldCount = typeof item.sold === 'number' ? item.sold : 0;
  const viewCount = typeof item.view === 'number' ? item.view : 0;

  let badge: string | undefined;
  if (viewCount >= 5000) {
    badge = 'Nổi bật';
  }

  const rawAuthor = item.author;
  const authorName = rawAuthor?.username || 'Giảng viên TMdemy';
  const authorInitials = authorName.slice(0, 2).toUpperCase();

  const priceNum = typeof item.price === 'number' ? item.price : Number(item.price) || 0;
  const oldPriceVal = item.oldPrice ?? item.old_price;
  const oldPriceNum = oldPriceVal !== undefined ? Number(oldPriceVal) : undefined;
  const totalDurationSec = typeof item.totalDuration === 'number' ? item.totalDuration : undefined;

  return {
    id: item.id || item._id || item.slug,
    slug: item.slug,
    title: item.title,
    description: item.description,
    thumbnail:
      item.image && item.image.trim().length > 0
        ? item.image
        : 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60',
    category: item.category?.name || 'Khác',
    badge,
    price: priceNum,
    originalPrice: oldPriceNum && oldPriceNum > priceNum ? oldPriceNum : undefined,
    totalDuration: totalDurationSec,
    formattedDuration: formatCourseDuration(totalDurationSec),
    durationHours: typeof item.totalDuration === 'number'
      ? Math.round((item.totalDuration / 3600) * 10) / 10
      : (typeof item.durationHours === 'number' ? item.durationHours : 0),
    level: normalizedLevel,
    levelLabel: levelLabels[normalizedLevel] || 'Mọi cấp độ',
    rating: typeof item.averageRating === 'number'
      ? Math.round(item.averageRating * 10) / 10
      : (typeof item.rating === 'number' ? item.rating : 0),
    reviewCount: typeof item.ratingCount === 'number'
      ? item.ratingCount
      : (typeof item.reviewCount === 'number' ? item.reviewCount : 0),
    studentCount: soldCount,
    updatedAt: item.updatedAt || item.createdAt,
    instructor: {
      name: authorName,
      avatar: rawAuthor?.avatar || undefined,
      initials: authorInitials,
      title: 'Giảng viên',
    },
    hasCertificate: true,
  };
}

/**
 * Teacher Course API Contract Types (api/TEACHER_API.md)
 */
export type TeacherCourseStatus = 'approved' | 'pending' | 'rejected' | string;

export interface TeacherCourseItem {
  id: string;
  _id?: string;
  title: string;
  slug: string;
  price: number;
  oldPrice?: number;
  old_price?: number;
  status: TeacherCourseStatus;
  level?: 'beginner' | 'intermediate' | 'advanced' | string;
  type?: 'paid' | 'free' | string;
  view?: number;
  sold?: number;
  image?: string;
  intro_url?: string;
  introUrl?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  category?: {
    id?: string;
    _id?: string;
    name: string;
    slug: string;
  };
  info?: {
    requirements?: string[];
    benefits?: string[];
    qa?: Array<{ question: string; answer: string }>;
  };
}

export interface GetTeacherCoursesParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'approved' | 'pending' | 'rejected' | string;
}

export interface GetTeacherCoursesResponse {
  success: boolean;
  message?: string;
  data: {
    courses: TeacherCourseItem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface CreateTeacherCourseDto {
  title: string;
  description: string;
  category?: string;
  type?: 'paid' | 'free';
  price?: number;
  old_price?: number;
  level?: 'beginner' | 'intermediate' | 'advanced';
  image?: string;
  intro_url?: string;
  info?: {
    requirements?: string[];
    benefits?: string[];
    qa?: Array<{ question: string; answer: string }>;
  };
}

export interface UpdateTeacherCourseDto {
  title?: string;
  description?: string;
  category?: string;
  type?: 'paid' | 'free';
  price?: number;
  old_price?: number;
  level?: 'beginner' | 'intermediate' | 'advanced';
  image?: string;
  intro_url?: string;
  info?: {
    requirements?: string[];
    benefits?: string[];
    qa?: Array<{ question: string; answer: string }>;
  };
}

export interface CreateTeacherCourseResponse {
  success: boolean;
  message?: string;
  data: TeacherCourseItem;
}

export interface UpdateTeacherCourseResponse {
  success: boolean;
  message?: string;
  data: TeacherCourseItem;
}

export interface DeleteTeacherCourseResponse {
  success: boolean;
  message: string;
}

