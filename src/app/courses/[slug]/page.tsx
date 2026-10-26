'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { useAuth } from '@/contexts/auth-context';
import { useFavorites } from '@/hooks/use-favorites';
import { courseService } from '@/services/course.service';
import { ratingService } from '@/services/rating.service';
import { enrollmentService } from '@/services/enrollment.service';
import { orderService } from '@/services/order.service';
import { conversationService } from '@/services/conversation.service';
import { toast } from '@/lib/toast';
import { ApiCourseDetail, ApiCourseChapterLesson } from '@/types/course';
import { ApiRatingItem } from '@/types/rating';
import { AppApiError } from '@/types/api';
import { CourseRatingSection } from '@/components/course/course-rating-section';
import { lessonService } from '@/services/lesson.service';
import { DemoLessonModal, DemoLessonItem } from '@/components/course/demo-lesson-modal';
import { cn } from '@/lib/utils';

interface CourseDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

function formatDuration(seconds?: number): string {
  if (!seconds || seconds <= 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatTotalDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0 giờ';
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hours === 0) return `${mins} phút`;
  if (mins === 0) return `${hours} giờ`;
  return `${hours} giờ ${mins} phút`;
}

function getYouTubeEmbedUrl(url?: string): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  return match ? `https://www.youtube.com/embed/${match[1]}?autoplay=1` : null;
}

export default function CourseDetailPage({ params }: CourseDetailPageProps) {
  // Unwrap Next.js 15+ promise-based params
  const { slug } = React.use(params);
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { isFavorite, toggleFavorite, isToggling } = useFavorites();

  // Data States
  const [course, setCourse] = useState<ApiCourseDetail | null>(null);
  const [ratings, setRatings] = useState<{
    averageRating: number;
    totalRatings: number;
    ratings: ApiRatingItem[];
  } | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [hasPendingOrder, setHasPendingOrder] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);

  // UX States
  const [isLoading, setIsLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Interaction States
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({});
  const [allExpanded, setAllExpanded] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);

  // Demo Lesson Preview States
  const [selectedDemoLesson, setSelectedDemoLesson] = useState<ApiCourseChapterLesson | null>(null);
  const [selectedChapterTitle, setSelectedChapterTitle] = useState<string>('');
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [isLoadingDemoVideo, setIsLoadingDemoVideo] = useState(false);
  const [chapterLessonsCache, setChapterLessonsCache] = useState<
    Record<string, Record<string, { videoUrl?: string; content?: string }>>
  >({});

  const courseId = course?.id || course?._id || '';
  const isDetailFavorited = courseId ? isFavorite(courseId) : false;
  const isDetailToggling = courseId ? isToggling(courseId) : false;

  const handleToggleFavorite = async () => {
    if (!courseId) return;
    await toggleFavorite(courseId);
  };

  // Fetch data with abort controller & clean lifecycle
  useEffect(() => {
    let isCurrent = true;
    const controller = new AbortController();

    async function loadData() {
      try {
        const courseRes = await courseService.getCourseBySlug(slug, { signal: controller.signal });
        if (!isCurrent) return;

        const courseData = courseRes.data;
        setCourse(courseData);

        // Auto-expand first chapter if chapters exist
        if (courseData.chapters && courseData.chapters.length > 0) {
          const firstId = courseData.chapters[0].id || courseData.chapters[0]._id || 'chap-0';
          setExpandedChapters({ [firstId]: true });
        }

        // Fetch public ratings if course ID is available
        const courseId = courseData.id || courseData._id;
        if (courseId) {
          try {
            const ratingRes = await ratingService.getCourseRatings(courseId, { signal: controller.signal });
            if (isCurrent && ratingRes.data) {
              setRatings(ratingRes.data);
            }
          } catch {
            // Non-blocking for reviews
          }
        }

        // Fetch enrollment & order states if user is logged in
        if (isAuthenticated) {
          try {
            const [enrollRes, completedOrdersRes] = await Promise.all([
              enrollmentService.getMyEnrollments({ signal: controller.signal }).catch(() => null),
              orderService.getMyOrders({ status: 'COMPLETED', limit: 100 }, { signal: controller.signal }).catch(() => null),
            ]);

            if (isCurrent) {
              const enrolledViaEnrollment = enrollRes?.data && Array.isArray(enrollRes.data)
                ? enrollRes.data.some(
                    (e) => (courseId && (e.courseId === courseId || e.course?.id === courseId)) || e.course?.slug === slug
                  )
                : false;

              const enrolledViaCompletedOrder = completedOrdersRes?.data?.orders && Array.isArray(completedOrdersRes.data.orders)
                ? completedOrdersRes.data.orders.some(
                    (o) =>
                      (o.status === 'COMPLETED' || o.status === 'completed') &&
                      ((courseId && (o.courseId === courseId || o.course?.id === courseId)) || o.course?.slug === slug)
                  )
                : false;

              const enrolled = Boolean(enrolledViaEnrollment || enrolledViaCompletedOrder);
              setIsEnrolled(enrolled);

              // If not enrolled, check for pending order (limit 100 to prevent missing beyond page 1)
              if (!enrolled) {
                try {
                  const ordersRes = await orderService.getMyOrders(
                    { status: 'PENDING', limit: 100 },
                    { signal: controller.signal }
                  );
                  if (isCurrent && ordersRes.data?.orders && Array.isArray(ordersRes.data.orders)) {
                    const pending = ordersRes.data.orders.some(
                      (o) =>
                        (o.status === 'PENDING' || o.status === 'pending') &&
                        ((courseId && (o.courseId === courseId || o.course?.id === courseId)) || o.course?.slug === slug)
                    );
                    setHasPendingOrder(pending);
                  }
                } catch {
                  // Non-blocking for pending order check
                }
              }
            }
          } catch {
            // Non-blocking for enrollments
          }
        }

        if (isCurrent) {
          setIsLoading(false);
        }
      } catch (err: unknown) {
        if (!isCurrent) return;
        if (err instanceof Error && err.name === 'AbortError') return;

        if (err instanceof AppApiError && err.statusCode === 404) {
          setIsNotFound(true);
        } else {
          const msg =
            err instanceof AppApiError
              ? err.message
              : 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối mạng.';
          setErrorMessage(msg);
        }
        setIsLoading(false);
      }
    }

    loadData();

    // Stale-revalidation when switching back to this tab/window
    const handleRevalidate = () => {
      if (document.visibilityState === 'visible' && isAuthenticated) {
        loadData();
      }
    };
    document.addEventListener('visibilitychange', handleRevalidate);
    window.addEventListener('focus', handleRevalidate);

    return () => {
      isCurrent = false;
      controller.abort();
      document.removeEventListener('visibilitychange', handleRevalidate);
      window.removeEventListener('focus', handleRevalidate);
    };
  }, [slug, isAuthenticated]);

  const handleRetry = () => {
    setIsLoading(true);
    setErrorMessage(null);
    setIsNotFound(false);
    const controller = new AbortController();
    (async () => {
      try {
        const courseRes = await courseService.getCourseBySlug(slug, { signal: controller.signal });
        setCourse(courseRes.data);
        setIsLoading(false);
      } catch (err) {
        if (err instanceof AppApiError && err.statusCode === 404) {
          setIsNotFound(true);
        } else {
          setErrorMessage(err instanceof AppApiError ? err.message : 'Lỗi kết nối.');
        }
        setIsLoading(false);
      }
    })();
  };

  // Free enrollment handler with real Order API & enrollment refresh
  const handleFreeEnroll = async () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/courses/${slug}`);
      return;
    }

    if (!course) return;
    const courseId = course.id || course._id;
    if (!courseId) {
      toast.error('Không tìm thấy thông tin định danh khóa học.');
      return;
    }

    if (isEnrolled) {
      router.push(`/learn/${course.slug}`);
      return;
    }

    if (hasPendingOrder) {
      toast.warning('Đơn hàng của khóa học này đang chờ phê duyệt.');
      return;
    }

    setIsEnrolling(true);
    try {
      const res = await orderService.createOrder({ courseId });
      const orderData = res.data;
      const orderStatus = orderData?.status?.toUpperCase();

      if (orderStatus === 'COMPLETED') {
        setIsEnrolled(true);
        toast.success('Đăng ký khóa học thành công! Chào mừng bạn vào lớp học.');
        router.push(`/learn/${course.slug}`);
      } else if (orderStatus === 'PENDING') {
        setHasPendingOrder(true);
        toast.info('Đơn hàng đã được tạo và đang chờ giảng viên duyệt.');
      } else {
        toast.success('Đã gửi yêu cầu đăng ký khóa học.');
      }
    } catch (err: unknown) {
      const msg =
        err instanceof AppApiError
          ? err.message
          : 'Đăng ký khóa học thất bại. Vui lòng thử lại sau.';
      if (
        err instanceof AppApiError &&
        err.statusCode === 400 &&
        msg.toLowerCase().includes('already enrolled')
      ) {
        setIsEnrolled(true);
        toast.info('Bạn đã ghi danh khóa học này rồi.');
        router.push(`/learn/${course.slug}`);
      } else if (
        err instanceof AppApiError &&
        err.statusCode === 400 &&
        msg.toLowerCase().includes('pending')
      ) {
        setHasPendingOrder(true);
        toast.warning('Bạn đang có đơn hàng chờ duyệt cho khóa học này.');
      } else {
        toast.error(msg);
      }
    } finally {
      setIsEnrolling(false);
    }
  };

  // Price formatter with 0d as 'Mien phi'
  const formatPrice = (amount: number) => {
    if (amount === 0) return 'Miễn phí';
    return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
  };

  const toggleChapter = (chapterId: string) => {
    setExpandedChapters((prev) => ({
      ...prev,
      [chapterId]: !prev[chapterId],
    }));
  };

  const toggleAllChapters = () => {
    if (!course?.chapters) return;
    const nextState = !allExpanded;
    setAllExpanded(nextState);
    const updated: Record<string, boolean> = {};
    course.chapters.forEach((c, idx) => {
      const cId = c.id || c._id || `chap-${idx}`;
      updated[cId] = nextState;
    });
    setExpandedChapters(updated);
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  // Compute all available demo lessons in course
  const courseChapters = course?.chapters;
  const allDemoLessons = useMemo<DemoLessonItem[]>(() => {
    if (!courseChapters) return [];
    const list: DemoLessonItem[] = [];
    courseChapters.forEach((chap) => {
      const chapId = chap.id || chap._id || '';
      if (chap.lessons && Array.isArray(chap.lessons)) {
        chap.lessons.forEach((l) => {
          if (l.isDemo) {
            const lessonId = l.id || l._id || '';
            const cached = chapId ? chapterLessonsCache[chapId]?.[lessonId] : undefined;
            list.push({
              lesson: {
                ...l,
                chapterId: chapId,
                videoUrl: cached?.videoUrl || l.videoUrl,
                content: cached?.content || l.content,
              },
              chapterTitle: chap.title,
            });
          }
        });
      }
    });
    return list;
  }, [courseChapters, chapterLessonsCache]);

  const loadLessonDetails = async (
    lesson: ApiCourseChapterLesson,
    chapterId?: string
  ): Promise<ApiCourseChapterLesson> => {
    if (lesson.videoUrl && lesson.content) {
      return lesson;
    }

    if (!chapterId) return lesson;

    const lessonId = lesson.id || lesson._id || '';
    if (chapterLessonsCache[chapterId]?.[lessonId]) {
      const cached = chapterLessonsCache[chapterId][lessonId];
      return {
        ...lesson,
        videoUrl: cached.videoUrl || lesson.videoUrl,
        content: cached.content || lesson.content,
      };
    }

    try {
      setIsLoadingDemoVideo(true);
      const res = await lessonService.getLessonsByChapter(chapterId);
      if (res.success && Array.isArray(res.data)) {
        const cacheMap: Record<string, { videoUrl?: string; content?: string }> = {};
        let matchedLesson = lesson;

        res.data.forEach((item) => {
          const itemId = item.id || item._id || '';
          if (itemId) {
            cacheMap[itemId] = {
              videoUrl: item.videoUrl,
              content: item.content,
            };
          }
          if (itemId === lessonId || (item.slug && item.slug === lesson.slug)) {
            matchedLesson = {
              ...lesson,
              videoUrl: item.videoUrl || lesson.videoUrl,
              content: item.content || lesson.content,
            };
          }
        });

        setChapterLessonsCache((prev) => ({
          ...prev,
          [chapterId]: {
            ...(prev[chapterId] || {}),
            ...cacheMap,
          },
        }));

        return matchedLesson;
      }
    } catch {
      // Ignore network errors, return base lesson
    } finally {
      setIsLoadingDemoVideo(false);
    }

    return lesson;
  };

  const handleOpenDemoLesson = async (
    lesson: ApiCourseChapterLesson,
    chapter: { id?: string; _id?: string; title: string }
  ) => {
    const chapId = chapter.id || chapter._id || '';
    setSelectedChapterTitle(chapter.title);

    if (lesson.videoUrl) {
      setSelectedDemoLesson({ ...lesson, chapterId: chapId });
      setIsDemoModalOpen(true);
      return;
    }

    setSelectedDemoLesson({ ...lesson, chapterId: chapId });
    setIsDemoModalOpen(true);

    const enriched = await loadLessonDetails(lesson, chapId);
    setSelectedDemoLesson(enriched);
  };

  const handleSelectDemoLesson = async (
    lesson: ApiCourseChapterLesson,
    chapterTitle: string
  ) => {
    setSelectedChapterTitle(chapterTitle);
    const chapId = lesson.chapterId || '';

    if (lesson.videoUrl) {
      setSelectedDemoLesson(lesson);
      return;
    }

    setSelectedDemoLesson(lesson);
    const enriched = await loadLessonDetails(lesson, chapId);
    setSelectedDemoLesson(enriched);
  };

  const handleEnrollOrCheckout = () => {
    if (isEnrolled || isAuthor) {
      router.push(`/learn/${course?.slug}`);
    } else if (course?.price === 0) {
      handleFreeEnroll();
    } else if (course?.slug) {
      router.push(`/checkout?course=${course.slug}`);
    }
  };

  // Calculations for lessons and duration
  const { totalLessonsCount, totalDurationSeconds } = useMemo(() => {
    if (!course?.chapters) return { totalLessonsCount: 0, totalDurationSeconds: 0 };
    let lessons = 0;
    let seconds = 0;
    course.chapters.forEach((chap) => {
      if (chap.lessons && Array.isArray(chap.lessons)) {
        lessons += chap.lessons.length;
        chap.lessons.forEach((l) => {
          if (typeof l.duration === 'number') seconds += l.duration;
        });
      }
    });
    return { totalLessonsCount: lessons, totalDurationSeconds: seconds };
  }, [course]);

  // Level display label
  const levelLabel = useMemo(() => {
    const raw = (course?.level || '').toLowerCase();
    switch (raw) {
      case 'beginner':
        return 'Mới bắt đầu';
      case 'intermediate':
        return 'Trung cấp';
      case 'advanced':
        return 'Nâng cao';
      default:
        return 'Mọi cấp độ';
    }
  }, [course?.level]);

  // Rating display stats
  const ratingValue = ratings?.averageRating && ratings.averageRating > 0 ? ratings.averageRating : 5.0;
  const ratingCount = ratings?.totalRatings || 0;

  // Rating breakdown percentages
  const ratingBreakdown = useMemo(() => {
    const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    if (!ratings?.ratings || ratings.ratings.length === 0) {
      return [
        { star: 5, percentage: 100 },
        { star: 4, percentage: 0 },
        { star: 3, percentage: 0 },
        { star: 2, percentage: 0 },
        { star: 1, percentage: 0 },
      ];
    }
    ratings.ratings.forEach((r) => {
      const s = Math.round(r.rate);
      if (counts[s] !== undefined) counts[s]++;
    });
    const total = ratings.ratings.length;
    return [5, 4, 3, 2, 1].map((star) => ({
      star,
      percentage: Math.round(((counts[star] || 0) / total) * 100),
    }));
  }, [ratings]);

  // Is user the creator/author of this course?
  const isAuthor = Boolean(
    user &&
    course?.author &&
    user.id === (course.author.id || course.author._id)
  );

  // Author / Instructor Identification & Direct Messaging
  const [isStartingChat, setIsStartingChat] = useState(false);
  const authorId =
    course?.author?.id ||
    course?.author?._id ||
    (course as { instructorId?: string })?.instructorId ||
    (course as { instructor?: { id?: string; _id?: string } })?.instructor?.id ||
    (course as { instructor?: { id?: string; _id?: string } })?.instructor?._id;

  const handleContactInstructor = async () => {
    if (!isAuthenticated) {
      toast.info('Vui lòng đăng nhập để trao đổi tin nhắn cùng giảng viên.');
      router.push(`/login?redirect=/courses/${slug}`);
      return;
    }

    if (isAuthor) {
      toast.info('Bạn chính là giảng viên phụ trách khóa học này.');
      return;
    }

    if (!authorId) {
      toast.error('Không tìm thấy thông tin giảng viên để kết nối.');
      return;
    }

    setIsStartingChat(true);
    try {
      const res = await conversationService.createConversation({
        receiverId: authorId,
        isGroup: false,
      });

      if (res.success && res.data) {
        const convId = res.data.id || res.data._id;
        toast.success(`Đang mở cuộc trò chuyện cùng ${authorName}...`);
        router.push(`/messages?conversationId=${convId}`);
      } else {
        router.push('/messages');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Không thể kết nối cuộc trò chuyện';
      toast.error(msg);
      router.push('/messages');
    } finally {
      setIsStartingChat(false);
    }
  };

  // YouTube embed URL
  const youtubeEmbedUrl = getYouTubeEmbedUrl(course?.intro_url || course?.introUrl);

  // ==================== 1. LOADING SKELETON STATE ====================
  if (isLoading) {
    return (
      <AppShell>
        <div className="relative w-full px-4 md:px-6 py-6 max-w-[1360px] mx-auto animate-pulse">
          {/* Breadcrumb Skeleton */}
          <div className="flex items-center gap-2 mb-6">
            <div className="h-4 w-16 bg-slate-200 dark:bg-[#282136] rounded" />
            <div className="h-4 w-4 bg-slate-200 dark:bg-[#282136] rounded" />
            <div className="h-4 w-20 bg-slate-200 dark:bg-[#282136] rounded" />
            <div className="h-4 w-4 bg-slate-200 dark:bg-[#282136] rounded" />
            <div className="h-4 w-40 bg-slate-200 dark:bg-[#282136] rounded" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column Skeleton */}
            <div className="lg:col-span-8 flex flex-col gap-8">
              <div className="flex flex-col gap-4">
                <div className="h-6 w-36 bg-slate-200 dark:bg-[#282136] rounded-full" />
                <div className="h-9 w-3/4 bg-slate-200 dark:bg-[#282136] rounded-lg" />
                <div className="h-5 w-full bg-slate-200 dark:bg-[#282136] rounded" />
                <div className="h-5 w-2/3 bg-slate-200 dark:bg-[#282136] rounded" />

                <div className="flex gap-4 pt-2">
                  <div className="h-5 w-24 bg-slate-200 dark:bg-[#282136] rounded" />
                  <div className="h-5 w-24 bg-slate-200 dark:bg-[#282136] rounded" />
                  <div className="h-5 w-24 bg-slate-200 dark:bg-[#282136] rounded" />
                </div>

                <div className="h-16 w-full bg-slate-200 dark:bg-[#282136] rounded-xl mt-2" />
              </div>

              {/* Video Box Skeleton */}
              <div className="aspect-video w-full bg-slate-200 dark:bg-[#282136] rounded-2xl" />

              {/* Outcomes Box Skeleton */}
              <div className="h-48 w-full bg-slate-200 dark:bg-[#282136] rounded-2xl" />

              {/* Curriculum Skeleton */}
              <div className="flex flex-col gap-3">
                <div className="h-6 w-48 bg-slate-200 dark:bg-[#282136] rounded" />
                <div className="h-14 w-full bg-slate-200 dark:bg-[#282136] rounded-xl" />
                <div className="h-14 w-full bg-slate-200 dark:bg-[#282136] rounded-xl" />
                <div className="h-14 w-full bg-slate-200 dark:bg-[#282136] rounded-xl" />
              </div>
            </div>

            {/* Right Column Skeleton */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              <div className="h-96 w-full bg-slate-200 dark:bg-[#282136] rounded-2xl" />
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  // ==================== 2. NOT FOUND (404) STATE ====================
  if (isNotFound) {
    return (
      <AppShell>
        <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-16 text-center">
          <div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-5">
            <span className="material-symbols-outlined text-[44px]">search_off</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#1c192c] dark:text-[#f4eeff] mb-2">
            Không tìm thấy khóa học
          </h1>
          <p className="text-sm md:text-base text-[#635a72] dark:text-[#b4a9c7] max-w-md mb-8">
            Khóa học với định danh <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#282136] text-[#7240b8] dark:text-[#a87ffb] font-mono text-xs">{slug}</code> không tồn tại hoặc đã được gỡ bỏ khỏi hệ thống TMDEMY.
          </p>
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <Link
              href="/courses"
              className="px-5 py-2.5 rounded-xl bg-[#7240b8] hover:bg-[#8b5ad3] text-white text-sm font-semibold transition-all shadow-sm"
            >
              Khám phá danh sách khóa học
            </Link>
            <Link
              href="/"
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#282136] dark:hover:bg-[#342a47] text-[#1c192c] dark:text-[#f4eeff] text-sm font-semibold transition-colors"
            >
              Về trang chủ
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  // ==================== 3. ERROR STATE ====================
  if (errorMessage || !course) {
    return (
      <AppShell>
        <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-16 text-center">
          <div className="w-20 h-20 rounded-full bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-5">
            <span className="material-symbols-outlined text-[44px]">cloud_off</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#1c192c] dark:text-[#f4eeff] mb-2">
            Không thể tải thông tin khóa học
          </h1>
          <p className="text-sm md:text-base text-[#635a72] dark:text-[#b4a9c7] max-w-md mb-8">
            {errorMessage || 'Đã xảy ra sự cố trong quá trình kết nối với máy chủ.'}
          </p>
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <button
              onClick={handleRetry}
              className="px-5 py-2.5 rounded-xl bg-[#7240b8] hover:bg-[#8b5ad3] text-white text-sm font-semibold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">refresh</span>
              Thử lại
            </button>
            <Link
              href="/courses"
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#282136] dark:hover:bg-[#342a47] text-[#1c192c] dark:text-[#f4eeff] text-sm font-semibold transition-colors"
            >
              Quay lại danh mục
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  // ==================== 4. SUCCESS STATE (REAL API DATA) ====================
  const originalPrice = course.oldPrice ?? course.old_price;
  const hasDiscount = Boolean(originalPrice && originalPrice > course.price);
  const discountPercent = hasDiscount && originalPrice
    ? Math.round((1 - course.price / originalPrice) * 100)
    : 0;

  const authorName = course.author?.username || 'Giảng viên TMdemy';
  const authorAvatar =
    course.author?.avatar &&
      course.author.avatar.trim() &&
      (course.author.avatar.startsWith('http://') ||
        course.author.avatar.startsWith('https://') ||
        course.author.avatar.startsWith('/'))
      ? course.author.avatar
      : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80';

  const categoryName = course.category?.name || 'Khóa học';
  const thumbnailImage =
    course.image && course.image.trim()
      ? course.image
      : 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&auto=format&fit=crop&q=80';

  const formattedUpdateDate = course.updatedAt
    ? new Date(course.updatedAt).toLocaleDateString('vi-VN', { month: '2-digit', year: 'numeric' })
    : course.createdAt
      ? new Date(course.createdAt).toLocaleDateString('vi-VN', { month: '2-digit', year: 'numeric' })
      : 'Gần đây';

  return (
    <AppShell>
      <div className="relative w-full px-4 md:px-6 py-6 max-w-[1360px] mx-auto">
        {/* Dynamic Atmospheric Glow */}
        <div className="absolute -top-10 left-1/4 w-96 h-96 bg-[#eddcff]/40 dark:bg-[#7240b8]/15 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-80 right-10 w-80 h-80 bg-[#e7dbf7]/50 dark:bg-[#7240b8]/10 rounded-full blur-3xl pointer-events-none -z-10" />

        {/* Breadcrumbs */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-xs text-[#635a72] dark:text-[#b4a9c7] mb-6 flex-wrap"
        >
          <Link href="/" className="hover:text-[#7240b8] dark:hover:text-[#a87ffb] transition-colors">
            Trang chủ
          </Link>
          <span className="material-symbols-outlined text-[15px] text-[#7c7483] dark:text-[#b4a9c7]">
            chevron_right
          </span>
          <Link href="/courses" className="hover:text-[#7240b8] dark:hover:text-[#a87ffb] transition-colors">
            Khóa học
          </Link>
          <span className="material-symbols-outlined text-[15px] text-[#7c7483] dark:text-[#b4a9c7]">
            chevron_right
          </span>
          <span className="hover:text-[#7240b8] dark:hover:text-[#a87ffb] transition-colors">
            {categoryName}
          </span>
          <span className="material-symbols-outlined text-[15px] text-[#7c7483] dark:text-[#b4a9c7]">
            chevron_right
          </span>
          <span className="text-[#1c192c] dark:text-[#f4eeff] font-semibold truncate max-w-xs md:max-w-md">
            {course.title}
          </span>
        </nav>

        {/* Main Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (Overview & Core Content - 8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-8">
            {/* Header Overview Block */}
            <section className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#ebe5ff] dark:bg-[#282136] text-[#7240b8] dark:text-[#a87ffb] text-xs font-semibold">
                  {categoryName} • {levelLabel}
                </span>

                {isEnrolled && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
                    <span className="material-symbols-outlined text-[14px]">check_circle</span>
                    Đã ghi danh học
                  </span>
                )}

                {isAuthor && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 text-xs font-semibold">
                    <span className="material-symbols-outlined text-[14px]">school</span>
                    Khóa học do bạn giảng dạy
                  </span>
                )}

                <span className="inline-flex items-center gap-1 text-[#635a72] dark:text-[#b4a9c7] text-xs ml-auto">
                  <span className="material-symbols-outlined text-[16px] text-[#7c7483] dark:text-[#b4a9c7]">
                    update
                  </span>
                  Cập nhật {formattedUpdateDate}
                </span>
              </div>

              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#1c192c] dark:text-[#f4eeff] tracking-tight leading-tight">
                {course.title}
              </h1>

              {course.description && (
                <p className="text-sm md:text-base text-[#4b4452] dark:text-[#b4a9c7] leading-relaxed">
                  {course.description}
                </p>
              )}

              {/* Metrics Strip */}
              <div className="flex flex-wrap items-center gap-y-2 gap-x-6 pt-1 text-[#1c192c] dark:text-[#f4eeff]">
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-bold text-[#7240b8] dark:text-[#a87ffb]">
                    {ratingValue.toFixed(1)}
                  </span>
                  <div className="flex items-center text-amber-500">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <span
                        key={i}
                        className="material-symbols-outlined text-[14px]"
                        style={{
                          fontVariationSettings: i <= Math.round(ratingValue) ? "'FILL' 1" : "'FILL' 0",
                        }}
                      >
                        star
                      </span>
                    ))}
                  </div>
                  <span className="text-xs text-[#635a72] dark:text-[#b4a9c7] font-medium">
                    ({ratingCount} đánh giá)
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-[#635a72] dark:text-[#b4a9c7] text-xs">
                  <span className="material-symbols-outlined text-[18px] text-[#7240b8] dark:text-[#a87ffb]">
                    group
                  </span>
                  <span className="font-bold text-[#1c192c] dark:text-[#f4eeff]">
                    {(course.sold || 0).toLocaleString()}
                  </span>
                  <span>học viên</span>
                </div>

                <div className="flex items-center gap-1.5 text-[#635a72] dark:text-[#b4a9c7] text-xs">
                  <span className="material-symbols-outlined text-[18px] text-[#7240b8] dark:text-[#a87ffb]">
                    visibility
                  </span>
                  <span className="font-bold text-[#1c192c] dark:text-[#f4eeff]">
                    {(course.view || 0).toLocaleString()}
                  </span>
                  <span>lượt xem</span>
                </div>

                <div className="flex items-center gap-1.5 text-[#635a72] dark:text-[#b4a9c7] text-xs">
                  <span className="material-symbols-outlined text-[18px] text-[#7240b8] dark:text-[#a87ffb]">
                    translate
                  </span>
                  <span>Tiếng Việt</span>
                </div>
              </div>

              {/* Quick Instructor Snippet */}
              <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[#f7f1ff] dark:bg-[#1d1926] border border-[#f1ebff] dark:border-[#2f2742]">
                <div className="flex items-center gap-3">
                  <img
                    src={authorAvatar}
                    alt={authorName}
                    className="w-12 h-12 rounded-full object-cover shadow-xs ring-2 ring-[#7240b8]/20 dark:ring-[#a87ffb]/20"
                  />
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-[#1c192c] dark:text-[#f4eeff]">
                        {authorName}
                      </span>
                      <span
                        className="material-symbols-outlined text-[16px] text-[#7240b8] dark:text-[#a87ffb]"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        verified
                      </span>
                    </div>
                    <span className="text-xs text-[#635a72] dark:text-[#b4a9c7]">
                      {course.author?.role === 'ADMIN'
                        ? 'Quản trị viên & Giảng viên TMDEMY'
                        : 'Giảng viên chuyên môn'}
                    </span>
                  </div>
                </div>

                {!isAuthor && (
                  <button
                    onClick={handleContactInstructor}
                    disabled={isStartingChat}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#eddcff]/70 dark:bg-[#282136] hover:bg-[#7240b8] hover:text-white text-[#7240b8] dark:text-[#a87ffb] text-xs font-bold transition-all active:scale-95 cursor-pointer disabled:opacity-60"
                    title="Nhắn tin với giảng viên"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {isStartingChat ? 'sync' : 'chat'}
                    </span>
                    <span className="hidden sm:inline">
                      {isStartingChat ? 'Đang mở...' : 'Nhắn tin'}
                    </span>
                  </button>
                )}
              </div>
            </section>

            {/* Course Video Preview Player */}
            <section className="relative rounded-2xl overflow-hidden bg-[#312e42] shadow-xl group">
              <div className="relative aspect-video w-full">
                {isPlayingPreview && youtubeEmbedUrl ? (
                  <iframe
                    src={youtubeEmbedUrl}
                    title={course.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full border-0"
                  />
                ) : (
                  <>
                    <img
                      src={thumbnailImage}
                      alt="Video Preview Poster"
                      className="w-full h-full object-cover opacity-85 group-hover:scale-102 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />

                    {/* Top Overlay Badge & Demo Lessons Counter */}
                    <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 dark:bg-[#1d1926]/90 backdrop-blur-md shadow-xs">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#00855b] animate-pulse" />
                      <span className="text-xs font-bold text-[#1c192c] dark:text-[#f4eeff]">
                        Xem video giới thiệu khóa học
                      </span>
                    </div>

                    {allDemoLessons.length > 0 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (allDemoLessons[0]) {
                            handleSelectDemoLesson(
                              allDemoLessons[0].lesson,
                              allDemoLessons[0].chapterTitle
                            );
                            setIsDemoModalOpen(true);
                          }
                        }}
                        className="absolute top-4 right-4 z-10 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#7240b8] hover:bg-[#5f339c] text-white text-xs font-bold shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer backdrop-blur-md"
                        title="Xem các bài học thử miễn phí của khóa học này"
                      >
                        <span className="material-symbols-outlined text-[15px]">sparkles</span>
                        <span>{allDemoLessons.length} bài học thử</span>
                      </button>
                    )}

                    {/* Play Button Interactive */}
                    <button
                      onClick={() => {
                        if (youtubeEmbedUrl) {
                          setIsPlayingPreview(true);
                        } else if (allDemoLessons.length > 0) {
                          handleSelectDemoLesson(
                            allDemoLessons[0].lesson,
                            allDemoLessons[0].chapterTitle
                          );
                          setIsDemoModalOpen(true);
                        } else {
                          toast.info('Khóa học chưa có video giới thiệu. Vui lòng xem thông tin giáo trình bên dưới.');
                        }
                      }}
                      aria-label="Phát video thử"
                      className="absolute inset-0 m-auto w-18 h-18 md:w-20 md:h-20 rounded-full bg-[#7240b8]/90 text-white flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 hover:bg-[#7240b8] transition-all duration-300 cursor-pointer"
                    >
                      <span
                        className="material-symbols-outlined text-[42px] ml-1"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        play_arrow
                      </span>
                    </button>

                    {/* Bottom Progress Preview Hint */}
                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white text-xs">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">videocam</span>
                        <span>Video giới thiệu: {course.title}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-white/20 backdrop-blur-xs font-semibold">
                        Full HD 1080p
                      </span>
                    </div>
                  </>
                )}
              </div>
            </section>

            {/* Section 1: "Bạn sẽ học được gì?" (Learning Outcomes / Benefits) */}
            {course.info?.benefits && course.info.benefits.length > 0 && (
              <section className="p-6 md:p-8 rounded-2xl bg-white dark:bg-[#1d1926] shadow-xs border border-[#f1ebff] dark:border-[#2f2742] flex flex-col gap-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-1.5 h-6 rounded-full bg-[#7240b8] dark:bg-[#a87ffb]" />
                  <h2 className="text-lg md:text-xl font-bold text-[#1c192c] dark:text-[#f4eeff]">
                    Bạn sẽ học được gì trong khóa học này?
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  {course.info.benefits.map((outcome, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3 rounded-xl hover:bg-[#f7f1ff] dark:hover:bg-[#282136] transition-colors"
                    >
                      <span
                        className="material-symbols-outlined text-[#7240b8] dark:text-[#a87ffb] text-[22px] shrink-0 mt-0.5"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        check_circle
                      </span>
                      <p className="text-xs md:text-sm text-[#1c192c] dark:text-[#f4eeff] leading-relaxed">
                        {outcome}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Section: Kỹ thuật & Công nghệ áp dụng (Techniques) */}
            {course.info?.techniques && course.info.techniques.length > 0 && (
              <section className="p-6 md:p-8 rounded-2xl bg-white dark:bg-[#1d1926] shadow-xs border border-[#f1ebff] dark:border-[#2f2742] flex flex-col gap-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-1.5 h-6 rounded-full bg-[#7240b8] dark:bg-[#a87ffb]" />
                  <h2 className="text-lg md:text-xl font-bold text-[#1c192c] dark:text-[#f4eeff]">
                    Kỹ thuật & Công nghệ trong khóa học
                  </h2>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {course.info.techniques.map((tech, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 rounded-lg bg-[#f7f1ff] dark:bg-[#282136] text-[#7240b8] dark:text-[#a87ffb] text-xs font-semibold border border-[#eedeff] dark:border-[#352c48]"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Section 2: "Nội dung khóa học" (Curriculum Accordion) */}
            <section className="flex flex-col gap-4">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2.5">
                    <div className="w-1.5 h-6 rounded-full bg-[#7240b8] dark:bg-[#a87ffb]" />
                    <h2 className="text-lg md:text-xl font-bold text-[#1c192c] dark:text-[#f4eeff]">
                      Nội dung khóa học
                    </h2>
                  </div>
                  <p className="text-xs text-[#635a72] dark:text-[#b4a9c7]">
                    {course.chapters?.length || 0} chương • {totalLessonsCount} bài học • Tổng thời lượng{' '}
                    {formatTotalDuration(totalDurationSeconds)}
                  </p>
                </div>

                {course.chapters && course.chapters.length > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={toggleAllChapters}
                      className="px-3.5 py-1.5 rounded-lg bg-[#ebe5ff] dark:bg-[#282136] text-[#7240b8] dark:text-[#a87ffb] hover:bg-[#7240b8] hover:text-white text-xs font-semibold transition-all cursor-pointer"
                    >
                      {allExpanded ? 'Thu gọn tất cả' : 'Mở rộng tất cả'}
                    </button>
                  </div>
                )}
              </div>

              {/* Accordion Container */}
              {course.chapters && course.chapters.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {course.chapters.map((chapter, idx) => {
                    const chapterId = chapter.id || chapter._id || `chap-${idx}`;
                    const isExpanded = !!expandedChapters[chapterId];
                    const lessonCount = chapter.lessons?.length || 0;

                    // Calculate chapter duration
                    let chapterDuration = 0;
                    if (chapter.lessons) {
                      chapter.lessons.forEach((l) => {
                        if (typeof l.duration === 'number') chapterDuration += l.duration;
                      });
                    }

                    return (
                      <div
                        key={chapterId}
                        className="rounded-xl overflow-hidden bg-white dark:bg-[#1d1926] shadow-xs border border-[#f1ebff] dark:border-[#2f2742] transition-all"
                      >
                        <button
                          onClick={() => toggleChapter(chapterId)}
                          className="w-full p-4 flex items-center justify-between bg-[#f7f1ff]/80 dark:bg-[#231d30] hover:bg-[#f7f1ff] dark:hover:bg-[#282136] transition-colors text-left cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`material-symbols-outlined text-[#7240b8] dark:text-[#a87ffb] text-[20px] transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''
                                }`}
                            >
                              expand_more
                            </span>
                            <div>
                              <span className="text-sm font-bold text-[#1c192c] dark:text-[#f4eeff] block">
                                {chapter.title}
                              </span>
                              <span className="text-xs text-[#635a72] dark:text-[#b4a9c7]">
                                {lessonCount} bài học
                                {chapterDuration > 0 && ` • ${formatTotalDuration(chapterDuration)}`}
                              </span>
                            </div>
                          </div>

                          <span className="text-xs text-[#635a72] dark:text-[#b4a9c7]">
                            {lessonCount} bài
                          </span>
                        </button>

                        {isExpanded && chapter.lessons && (
                          <div className="flex flex-col gap-2 p-2.5 bg-white dark:bg-[#1d1926]">
                            {chapter.lessons.map((lesson, lIdx) => {
                              const lessonId = lesson.id || lesson._id || `lesson-${lIdx}`;
                              const canAccess = isEnrolled || isAuthor || lesson.isDemo;
                              const isDemoLesson = Boolean(lesson.isDemo);

                              return (
                                <div
                                  key={lessonId}
                                  onClick={() => {
                                    if (isDemoLesson) {
                                      handleOpenDemoLesson(lesson, chapter);
                                    }
                                  }}
                                  className={cn(
                                    'flex items-center justify-between p-3 rounded-xl transition-all border border-transparent hover:border-[#f1ebff] dark:hover:border-[#2b2438] hover:bg-[#f7f1ff] dark:hover:bg-[#282136] group/lesson',
                                    isDemoLesson && 'cursor-pointer'
                                  )}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0 pr-3">
                                    <span
                                      className={cn(
                                        'material-symbols-outlined text-[18px] shrink-0 transition-colors text-[#7c7483] dark:text-[#b4a9c7]',
                                        isDemoLesson && 'group-hover/lesson:text-[#7240b8] dark:group-hover/lesson:text-[#a87ffb]'
                                      )}
                                    >
                                      {isDemoLesson
                                        ? 'play_circle'
                                        : canAccess
                                          ? 'smart_display'
                                          : 'lock'}
                                    </span>
                                    <span
                                      className={cn(
                                        'text-xs md:text-sm truncate transition-colors',
                                        canAccess && !isDemoLesson
                                          ? 'font-medium text-[#1c192c] dark:text-[#f4eeff]'
                                          : 'text-[#4b4452] dark:text-[#b4a9c7]',
                                        isDemoLesson && 'group-hover/lesson:text-[#7240b8] dark:group-hover/lesson:text-[#a87ffb]'
                                      )}
                                    >
                                      {lesson.title}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2.5 shrink-0">
                                    {isDemoLesson && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOpenDemoLesson(lesson, chapter);
                                        }}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#7240b8] hover:bg-[#5f339c] text-white text-[11px] font-medium shadow-2xs transition-all active:scale-95 cursor-pointer"
                                        title="Xem video học thử miễn phí"
                                      >
                                        <span className="material-symbols-outlined text-[13px]">
                                          smart_display
                                        </span>
                                        <span>Học thử</span>
                                      </button>
                                    )}
                                    <span className="text-xs text-[#635a72] dark:text-[#b4a9c7]">
                                      {formatDuration(lesson.duration)}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 rounded-xl bg-white dark:bg-[#1d1926] border border-[#f1ebff] dark:border-[#2f2742] text-center text-xs text-[#635a72] dark:text-[#b4a9c7]">
                  Giáo trình khóa học đang được giảng viên hoàn thiện và cập nhật.
                </div>
              )}
            </section>

            {/* Section: Yêu cầu khóa học (Requirements) */}
            {course.info?.requirements && course.info.requirements.length > 0 && (
              <section className="p-6 md:p-8 rounded-2xl bg-white dark:bg-[#1d1926] shadow-xs border border-[#f1ebff] dark:border-[#2f2742] flex flex-col gap-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-1.5 h-6 rounded-full bg-[#7240b8] dark:bg-[#a87ffb]" />
                  <h2 className="text-lg md:text-xl font-bold text-[#1c192c] dark:text-[#f4eeff]">
                    Yêu cầu tiên quyết khi tham gia
                  </h2>
                </div>
                <ul className="flex flex-col gap-2.5 pt-1">
                  {course.info.requirements.map((req, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs md:text-sm text-[#4b4452] dark:text-[#b4a9c7]">
                      <span className="material-symbols-outlined text-[18px] text-[#7240b8] dark:text-[#a87ffb] shrink-0 mt-0.5">
                        arrow_right
                      </span>
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Section 3: "Về giảng viên" (Instructor Profile Card) */}
            <section className="p-6 md:p-8 rounded-2xl bg-white dark:bg-[#1d1926] shadow-xs border border-[#f1ebff] dark:border-[#2f2742] flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-1.5 h-6 rounded-full bg-[#7240b8] dark:bg-[#a87ffb]" />
                  <h2 className="text-lg md:text-xl font-bold text-[#1c192c] dark:text-[#f4eeff]">
                    Về giảng viên
                  </h2>
                </div>

                {!isAuthor && (
                  <button
                    onClick={handleContactInstructor}
                    disabled={isStartingChat}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#7240b8] hover:bg-[#8b5ad3] text-white text-xs md:text-sm font-bold shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-60"
                    title="Gửi tin nhắn trực tiếp cho giảng viên"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {isStartingChat ? 'sync' : 'chat'}
                    </span>
                    <span>
                      {isStartingChat ? 'Đang kết nối...' : 'Nhắn tin cho giảng viên'}
                    </span>
                  </button>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-start gap-5">
                <div className="relative shrink-0">
                  <img
                    src={authorAvatar}
                    alt={authorName}
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover shadow-md ring-2 ring-[#7240b8]/20 dark:ring-[#a87ffb]/20"
                  />
                  <span className="absolute -bottom-2 -right-2 p-1.5 rounded-full bg-[#7240b8] dark:bg-[#8b5ad3] text-white flex items-center justify-center shadow-xs">
                    <span className="material-symbols-outlined text-[18px]">school</span>
                  </span>
                </div>

                <div className="flex flex-col gap-2 flex-1">
                  <div>
                    <h3 className="text-base md:text-lg font-bold text-[#1c192c] dark:text-[#f4eeff]">
                      {authorName}
                    </h3>
                    <p className="text-xs text-[#7240b8] dark:text-[#a87ffb] font-semibold">
                      {course.author?.role === 'ADMIN'
                        ? 'Quản trị viên & Giảng viên TMDEMY'
                        : 'Giảng viên chuyên môn'}
                    </p>
                  </div>

                  <p className="text-xs md:text-sm text-[#4b4452] dark:text-[#b4a9c7] leading-relaxed pt-1">
                    Giảng viên phụ trách khóa học tại nền tảng TMDEMY, đồng hành và hỗ trợ học viên giải đáp thắc mắc chuyên môn trong suốt quá trình học tập.
                  </p>

                  {/* Instructor Meta Badges & Direct Message Info */}
                  <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-[#f7f1ff] dark:border-[#282136] mt-2">
                    <div className="flex items-center gap-1.5 text-xs text-[#635a72] dark:text-[#b4a9c7]">
                      <span className="material-symbols-outlined text-[16px] text-[#7240b8] dark:text-[#a87ffb]">
                        schedule
                      </span>
                      <span>Phản hồi tin nhắn nhanh</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-[#635a72] dark:text-[#b4a9c7]">
                      <span className="material-symbols-outlined text-[16px] text-emerald-600 dark:text-emerald-400">
                        verified_user
                      </span>
                      <span>Giảng viên đã xác thực danh tính</span>
                    </div>

                    {course.author?.email && (
                      <div className="flex items-center gap-1.5 text-xs text-[#635a72] dark:text-[#b4a9c7]">
                        <span className="material-symbols-outlined text-[16px] text-[#7240b8] dark:text-[#a87ffb]">
                          mail
                        </span>
                        <span>{course.author.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Section 4: "Đánh giá từ học viên" (Student Reviews) */}
            <CourseRatingSection
              courseId={courseId}
              courseSlug={slug}
              isEnrolled={isEnrolled}
              initialRatings={ratings}
              onRatingSubmitted={async () => {
                if (courseId) {
                  try {
                    const ratingRes = await ratingService.getCourseRatings(courseId);
                    if (ratingRes.data) {
                      setRatings(ratingRes.data);
                    }
                  } catch {
                    // Non-blocking rating refresh
                  }
                }
              }}
            />
          </div>

          {/* Right Column: Floating Sticky Enrollment Card (4 cols) */}
          <div className="lg:col-span-4 sticky top-20 flex flex-col gap-4 z-30">
            <div className="rounded-2xl bg-white dark:bg-[#1d1926] shadow-xl p-6 flex flex-col gap-5 border border-[#f1ebff] dark:border-[#2f2742]">
              {/* Pricing Block */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-baseline gap-3 mt-1">
                  <span
                    className={`text-2xl md:text-3xl font-extrabold tracking-tight ${course.price === 0 ? 'text-green-500 text-base' : 'text-[#1c192c] dark:text-[#f4eeff]'
                      }`}
                  >
                    {formatPrice(course.price)}
                  </span>
                  {hasDiscount && (
                    <span className="text-sm text-[#7c7483] dark:text-[#b4a9c7] line-through">
                      {formatPrice(originalPrice!)}
                    </span>
                  )}
                  {hasDiscount && (
                    <span className="px-2 py-0.5 rounded-full bg-[#ffdad6] dark:bg-[#521b1b]/60 text-[#ba1a1a] dark:text-[#ffb4ab] text-xs font-bold">
                      Giảm {discountPercent}%
                    </span>
                  )}
                </div>

                <p className="text-xs text-[#635a72] dark:text-[#b4a9c7] flex items-center gap-1.5 mt-0.5">
                  <span className="material-symbols-outlined text-[16px] text-[#00855b] dark:text-[#4edea3]">
                    verified_user
                  </span>
                  Đảm bảo chất lượng đào tạo &amp; học liệu từ TMDEMY
                </p>
              </div>

              {/* CTAs based on Enrollment & Ownership */}
              <div className="flex flex-col gap-2.5">
                {isEnrolled || isAuthor ? (
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/learn/${course.slug}`}
                      className="flex-1 py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-sm font-bold shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[20px]">play_circle</span>
                      Vào học ngay
                    </Link>
                    <button
                      type="button"
                      onClick={handleToggleFavorite}
                      disabled={isDetailToggling}
                      aria-label={isDetailFavorited ? 'Bỏ yêu thích' : 'Lưu vào yêu thích'}
                      title={isDetailFavorited ? 'Bỏ yêu thích' : 'Lưu vào yêu thích'}
                      className="w-12 h-12 rounded-xl bg-[#f7f1ff] dark:bg-[#282136] hover:bg-[#ebe5ff] dark:hover:bg-[#342a47] text-[#4b4452] dark:text-[#b4a9c7] hover:text-[#ba1a1a] transition-colors flex items-center justify-center cursor-pointer shrink-0 disabled:opacity-60"
                    >
                      {isDetailToggling ? (
                        <span className="w-4 h-4 border-2 border-[#ba1a1a] border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <span
                          className="material-symbols-outlined text-[20px]"
                          style={{
                            fontVariationSettings: isDetailFavorited ? "'FILL' 1" : "'FILL' 0",
                            color: isDetailFavorited ? '#ba1a1a' : undefined,
                          }}
                        >
                          favorite
                        </span>
                      )}
                    </button>
                  </div>
                ) : hasPendingOrder ? (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 py-3.5 px-4 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-sm font-bold flex items-center justify-center gap-2 select-none">
                      <span className="material-symbols-outlined text-[20px]">pending_actions</span>
                      Đang chờ duyệt
                    </div>
                    <button
                      type="button"
                      onClick={handleToggleFavorite}
                      disabled={isDetailToggling}
                      aria-label={isDetailFavorited ? 'Bỏ yêu thích' : 'Lưu vào yêu thích'}
                      title={isDetailFavorited ? 'Bỏ yêu thích' : 'Lưu vào yêu thích'}
                      className="w-12 h-12 rounded-xl bg-[#f7f1ff] dark:bg-[#282136] hover:bg-[#ebe5ff] dark:hover:bg-[#342a47] text-[#4b4452] dark:text-[#b4a9c7] hover:text-[#ba1a1a] transition-colors flex items-center justify-center cursor-pointer shrink-0 disabled:opacity-60"
                    >
                      {isDetailToggling ? (
                        <span className="w-4 h-4 border-2 border-[#ba1a1a] border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <span
                          className="material-symbols-outlined text-[20px]"
                          style={{
                            fontVariationSettings: isDetailFavorited ? "'FILL' 1" : "'FILL' 0",
                            color: isDetailFavorited ? '#ba1a1a' : undefined,
                          }}
                        >
                          favorite
                        </span>
                      )}
                    </button>
                  </div>
                ) : course.price === 0 ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleFreeEnroll}
                      disabled={isEnrolling}
                      className="flex-1 py-3.5 px-4 rounded-xl bg-[#7240b8] hover:bg-[#8349d3] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100 text-white text-sm font-bold shadow-lg shadow-[#7240b8]/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isEnrolling ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Đang xử lý đăng ký...</span>
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[20px]">school</span>
                          <span>Đăng ký học miễn phí</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleToggleFavorite}
                      disabled={isDetailToggling}
                      aria-label={isDetailFavorited ? 'Bỏ yêu thích' : 'Lưu vào yêu thích'}
                      title={isDetailFavorited ? 'Bỏ yêu thích' : 'Lưu vào yêu thích'}
                      className="w-12 h-12 rounded-xl bg-[#f7f1ff] dark:bg-[#282136] hover:bg-[#ebe5ff] dark:hover:bg-[#342a47] text-[#4b4452] dark:text-[#b4a9c7] hover:text-[#ba1a1a] transition-colors flex items-center justify-center cursor-pointer shrink-0 disabled:opacity-60"
                    >
                      {isDetailToggling ? (
                        <span className="w-4 h-4 border-2 border-[#ba1a1a] border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <span
                          className="material-symbols-outlined text-[20px]"
                          style={{
                            fontVariationSettings: isDetailFavorited ? "'FILL' 1" : "'FILL' 0",
                            color: isDetailFavorited ? '#ba1a1a' : undefined,
                          }}
                        >
                          favorite
                        </span>
                      )}
                    </button>
                  </div>
                ) : (
                  <>
                    <Link
                      href={`/checkout?course=${course.slug}`}
                      className="w-full py-3.5 px-4 rounded-xl bg-[#7240b8] hover:bg-[#8b5ad3] active:scale-[0.98] text-white text-sm font-bold shadow-lg shadow-[#7240b8]/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[20px]">shopping_bag</span>
                      Mua khóa học ngay
                    </Link>

                    {allDemoLessons.length > 0 && !isEnrolled && !isAuthor && (
                      <button
                        type="button"
                        onClick={() => {
                          if (allDemoLessons[0]) {
                            handleSelectDemoLesson(
                              allDemoLessons[0].lesson,
                              allDemoLessons[0].chapterTitle
                            );
                            setIsDemoModalOpen(true);
                          }
                        }}
                        className="w-full py-2.5 px-4 rounded-xl border border-[#7240b8]/30 dark:border-[#a87ffb]/30 bg-[#fbf8ff] dark:bg-[#251e33] hover:bg-[#f3e8ff] dark:hover:bg-[#2f2541] text-[#7240b8] dark:text-[#a87ffb] text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <span className="material-symbols-outlined text-[17px]">smart_display</span>
                        <span>Học thử miễn phí ({allDemoLessons.length} bài)</span>
                      </button>
                    )}

                    <div className="grid grid-cols-5 gap-2.5">
                      <button className="col-span-4 py-2.5 px-4 rounded-xl bg-[#e7dbf7] dark:bg-[#282136] hover:bg-[#eadefa] dark:hover:bg-[#342a47] text-[#7240b8] dark:text-[#a87ffb] text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer">
                        <span className="material-symbols-outlined text-[18px]">add_shopping_cart</span>
                        Thêm vào giỏ hàng
                      </button>

                      <button
                        type="button"
                        onClick={handleToggleFavorite}
                        disabled={isDetailToggling}
                        aria-label={isDetailFavorited ? 'Bỏ yêu thích' : 'Lưu vào yêu thích'}
                        title={isDetailFavorited ? 'Bỏ yêu thích' : 'Lưu vào yêu thích'}
                        className="col-span-1 py-2.5 rounded-xl bg-[#f7f1ff] dark:bg-[#282136] hover:bg-[#ebe5ff] dark:hover:bg-[#342a47] text-[#4b4452] dark:text-[#b4a9c7] hover:text-[#ba1a1a] transition-colors flex items-center justify-center cursor-pointer disabled:opacity-60"
                      >
                        {isDetailToggling ? (
                          <span className="w-4 h-4 border-2 border-[#ba1a1a] border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <span
                            className="material-symbols-outlined text-[20px]"
                            style={{
                              fontVariationSettings: isDetailFavorited ? "'FILL' 1" : "'FILL' 0",
                              color: isDetailFavorited ? '#ba1a1a' : undefined,
                            }}
                          >
                            favorite
                          </span>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>

              <div className="w-full h-px bg-[#f1ebff] dark:bg-[#282136]" />

              {/* What's included checklist */}
              <div className="flex flex-col gap-3">
                <h4 className="text-xs font-bold text-[#1c192c] dark:text-[#f4eeff] uppercase tracking-wider">
                  Khóa học bao gồm:
                </h4>
                <ul className="flex flex-col gap-2.5 text-xs text-[#1c192c] dark:text-[#f4eeff]">
                  <li className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[#7240b8] dark:text-[#a87ffb] text-[18px]">
                      play_circle
                    </span>
                    <span>
                      <strong>{formatTotalDuration(totalDurationSeconds)}</strong> video học tập chi tiết
                    </span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[#7240b8] dark:text-[#a87ffb] text-[18px]">
                      menu_book
                    </span>
                    <span>
                      <strong>{totalLessonsCount}</strong> bài học &amp; thực hành
                    </span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[#7240b8] dark:text-[#a87ffb] text-[18px]">
                      all_inclusive
                    </span>
                    <span>
                      Truy cập <strong>trọn đời</strong> trên web &amp; thiết bị di động
                    </span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[#7240b8] dark:text-[#a87ffb] text-[18px]">
                      forum
                    </span>
                    <span>Hỗ trợ kỹ thuật và giải đáp thắc mắc chuyên môn</span>
                  </li>
                </ul>

                {/* Direct Consultation Link */}
                {!isAuthor && (
                  <div className="pt-2 border-t border-[#f7f1ff] dark:border-[#282136] flex items-center justify-between text-xs">
                    <span className="text-[#635a72] dark:text-[#b4a9c7]">Cần hỗ trợ về lộ trình?</span>
                    <button
                      onClick={handleContactInstructor}
                      disabled={isStartingChat}
                      className="font-bold text-[#7240b8] dark:text-[#a87ffb] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[15px]">chat</span>
                      <span>Hỏi giảng viên</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Share link button */}
              <div className="p-3 rounded-xl bg-[#f7f1ff] dark:bg-[#16131e] flex items-center justify-between border border-[#f1ebff] dark:border-[#282136]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#7240b8] dark:text-[#a87ffb] text-[18px]">
                    share
                  </span>
                  <span className="text-xs font-semibold text-[#1c192c] dark:text-[#f4eeff]">
                    Chia sẻ khóa học
                  </span>
                </div>
                <button
                  onClick={handleCopyLink}
                  className="text-xs text-[#7240b8] dark:text-[#a87ffb] font-bold cursor-pointer hover:underline"
                >
                  {copiedLink ? 'Đã sao chép!' : 'Sao chép liên kết'}
                </button>
              </div>
            </div>

            {/* Academic Guarantee Micro-Banner */}
            <div className="p-4 rounded-2xl bg-[#ebe5ff]/70 dark:bg-[#231d30] backdrop-blur-xs flex items-center gap-3 text-[#1c192c] dark:text-[#f4eeff] border border-[#d7baff]/50 dark:border-[#382d50]">
              <span className="material-symbols-outlined text-[#7240b8] dark:text-[#a87ffb] text-[28px] shrink-0">
                verified
              </span>
              <div className="flex flex-col">
                <span className="text-xs font-bold">Chuẩn đầu ra thực tế</span>
                <span className="text-[11px] text-[#635a72] dark:text-[#b4a9c7]">
                  Được xây dựng và kiểm duyệt chất lượng bởi TMDEMY
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Lesson Preview Modal */}
      <DemoLessonModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        currentLesson={selectedDemoLesson}
        chapterTitle={selectedChapterTitle}
        courseTitle={course?.title}
        coursePrice={course?.price}
        isEnrolled={isEnrolled}
        onEnrollOrCheckout={handleEnrollOrCheckout}
        allDemoLessons={allDemoLessons}
        onSelectDemoLesson={handleSelectDemoLesson}
        loading={isLoadingDemoVideo}
      />
    </AppShell>
  );
}
