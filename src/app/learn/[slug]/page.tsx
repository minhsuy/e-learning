'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { useAuthContext } from '@/contexts/auth-context';
import { courseService } from '@/services/course.service';
import { lessonService } from '@/services/lesson.service';
import { progressService } from '@/services/progress.service';
import { enrollmentService } from '@/services/enrollment.service';
import { orderService } from '@/services/order.service';
import { ratingService } from '@/services/rating.service';
import { certificateService } from '@/services/certificate.service';
import { ApiCourseDetail, ApiCourseChapter } from '@/types/course';
import { ApiLessonItem } from '@/types/lesson';
import { ApiRatingItem } from '@/types/rating';
import { ApiCertificate } from '@/types/certificate';
import { AppApiError } from '@/types/api';
import { toast } from '@/lib/toast';
import { quizService } from '@/services/quiz.service';
import { ApiQuizDetail } from '@/types/quiz';
import { videoService } from '@/services/video.service';
import { LessonPlaybackData } from '@/types/video';
import { Loader2 } from 'lucide-react';
import { QuizView } from '@/components/quiz/quiz-view';
import { CourseRatingSection } from '@/components/course/course-rating-section';
import { LessonComments } from '@/components/course/lesson-comments';

interface ChapterWithLessons extends ApiCourseChapter {
  fullLessons: ApiLessonItem[];
}

function formatDuration(seconds?: number): string {
  if (!seconds || seconds <= 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function getYouTubeEmbedUrl(url?: string): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  return match ? `https://www.youtube.com/embed/${match[1]}?autoplay=1&enablejsapi=1` : null;
}

export default function ClassroomPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const slug = (params?.slug as string) || '';
  const initialLessonParam = searchParams?.get('lesson');

  const { user, isAuthenticated } = useAuthContext();

  // Core Data States
  const [course, setCourse] = useState<ApiCourseDetail | null>(null);
  const [chapters, setChapters] = useState<ChapterWithLessons[]>([]);
  const [activeLesson, setActiveLesson] = useState<ApiLessonItem | null>(null);
  const [failedVideoUrl, setFailedVideoUrl] = useState<string | null>(null);
  const hasVideoError = Boolean(activeLesson?.videoUrl && failedVideoUrl === activeLesson.videoUrl);

  // Bunny Video CDN Playback States
  const [bunnyPlayback, setBunnyPlayback] = useState<LessonPlaybackData | null>(null);
  const [isLoadingBunny, setIsLoadingBunny] = useState(false);
  const [bunnyError, setBunnyError] = useState<string | null>(null);
  const [bunnyRetryKey, setBunnyRetryKey] = useState(0);

  // Access & Enrollment States
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [hasPendingOrder, setHasPendingOrder] = useState(false);
  const [enrollmentError, setEnrollmentError] = useState<string | null>(null);
  const [isRetryingEnrollment, setIsRetryingEnrollment] = useState(false);

  // Progress States
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(new Set());
  const [isUpdatingProgress, setIsUpdatingProgress] = useState(false);
  const [issuedCertificate, setIssuedCertificate] = useState<ApiCertificate | null>(null);

  // UX Lifecycle States
  const [isLoading, setIsLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Tab & Accordion States
  const tabQuery = searchParams?.get('tab');
  const commentQuery = searchParams?.get('commentId') || searchParams?.get('comment');
  const initialActiveTab = tabQuery === 'qa' || commentQuery ? 'qa' : (tabQuery as 'overview' | 'quiz' | 'qa' | 'notes' | 'reviews') || 'overview';
  const [activeTab, setActiveTab] = useState<'overview' | 'quiz' | 'qa' | 'notes' | 'reviews'>(initialActiveTab);
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({});

  // Synchronize active tab if navigated via notification (tab=qa or commentId present)
  useEffect(() => {
    let isCancelled = false;

    const syncTab = async () => {
      await Promise.resolve();
      if (isCancelled) return;

      const tabParam = searchParams?.get('tab');
      const commentParam = searchParams?.get('commentId') || searchParams?.get('comment');
      if (tabParam === 'qa' || commentParam) {
        setActiveTab('qa');
      }
    };

    void syncTab();

    return () => {
      isCancelled = true;
    };
  }, [searchParams]);

  // Quiz States
  const [activeQuiz, setActiveQuiz] = useState<ApiQuizDetail | null>(null);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(false);
  const [userRefreshKey, setUserRefreshKey] = useState(0);

  const [ratingsData, setRatingsData] = useState<{
    averageRating: number;
    totalRatings: number;
    ratings: ApiRatingItem[];
  } | null>(null);

  // Notes State (Persistent locally per course & lesson)
  const [noteContent, setNoteContent] = useState('');
  const [notesList, setNotesList] = useState<{ id: string; time: string; text: string }[]>([]);

  // Load private local notes when active lesson changes
  useEffect(() => {
    if (!course || !activeLesson) return;
    const courseId = course.id || course._id;
    const lessonId = activeLesson.id || activeLesson._id;
    if (!courseId || !lessonId) return;

    let isMounted = true;
    try {
      const stored = localStorage.getItem(`tmdemy-notes-${courseId}-${lessonId}`);
      const parsed = stored ? JSON.parse(stored) : [];
      queueMicrotask(() => {
        if (isMounted) {
          setNotesList(parsed);
        }
      });
    } catch {
      queueMicrotask(() => {
        if (isMounted) {
          setNotesList([]);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [course, activeLesson]);

  // Fetch Quiz for Active Lesson
  useEffect(() => {
    const lessonId = activeLesson ? (activeLesson.id || activeLesson._id) : undefined;
    let isCurrent = true;
    const controller = new AbortController();

    async function loadLessonQuiz() {
      if (!lessonId) {
        if (isCurrent) setActiveQuiz(null);
        return;
      }
      setIsLoadingQuiz(true);
      try {
        const res = await quizService.getQuizByLesson(lessonId, { signal: controller.signal });
        if (isCurrent) {
          if (res.data && res.data.length > 0) {
            setActiveQuiz(res.data[0]);
          } else {
            setActiveQuiz(null);
          }
        }
      } catch {
        if (isCurrent) setActiveQuiz(null);
      } finally {
        if (isCurrent) setIsLoadingQuiz(false);
      }
    }

    loadLessonQuiz();

    return () => {
      isCurrent = false;
      controller.abort();
    };
  }, [activeLesson]);

  // Main Classroom Data Fetcher
  // 1. Main Classroom Data Fetcher (Public Course & Chapters)
  const loadClassroomData = useCallback(async (signal?: AbortSignal) => {
    if (!slug) return;
    setIsLoading(true);
    setErrorMessage(null);
    setIsNotFound(false);

    try {
      // 1. Fetch Course Detail by Slug
      const courseRes = await courseService.getCourseBySlug(slug, { signal });
      if (signal?.aborted) return;
      const courseData = courseRes.data;
      setCourse(courseData);

      // 2. Fetch full lessons for each chapter
      const rawChapters = courseData.chapters || [];
      const enrichedChapters: ChapterWithLessons[] = await Promise.all(
        rawChapters.map(async (chap, idx) => {
          const chapId = chap.id || chap._id || `chap-${idx}`;
          try {
            const lessonsRes = await lessonService.getLessonsByChapter(chapId, { signal });
            return {
              ...chap,
              fullLessons: lessonsRes.data || [],
            };
          } catch {
            // Fallback to embedded lessons if chapter lessons call fails
            const fallbackLessons: ApiLessonItem[] = (chap.lessons || []).map((l, lIdx) => ({
              id: l.id || l._id || `lesson-${idx}-${lIdx}`,
              title: l.title,
              slug: l.slug,
              duration: l.duration,
              isDemo: l.isDemo,
              order: l.order || lIdx + 1,
              type: l.type || 'VIDEO',
              bunnyVideoId: (l as ApiLessonItem).bunnyVideoId,
              videoStatus: (l as ApiLessonItem).videoStatus,
            }));
            return {
              ...chap,
              fullLessons: fallbackLessons,
            };
          }
        })
      );

      if (signal?.aborted) return;
      setChapters(enrichedChapters);

      // Flatten all lessons
      const allLessons: ApiLessonItem[] = [];
      enrichedChapters.forEach((ch) => {
        allLessons.push(...ch.fullLessons);
      });

      // 3. Determine active lesson
      let targetLesson: ApiLessonItem | null = null;
      const lessonQuery = typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('lesson')
        : initialLessonParam;

      if (lessonQuery) {
        targetLesson =
          allLessons.find(
            (l) => l.id === lessonQuery || l._id === lessonQuery || l.slug === lessonQuery
          ) || null;
      }
      if (!targetLesson && allLessons.length > 0) {
        targetLesson = allLessons[0];
      }
      setActiveLesson(targetLesson);

      // Auto-expand chapter of active lesson
      if (targetLesson) {
        const foundChap = enrichedChapters.find((ch) =>
          ch.fullLessons.some((l) => (l.id || l._id) === (targetLesson?.id || targetLesson?._id))
        );
        if (foundChap) {
          const chapId = foundChap.id || foundChap._id || 'chap-0';
          setExpandedChapters({ [chapId]: true });
        } else if (enrichedChapters.length > 0) {
          const firstId = enrichedChapters[0].id || enrichedChapters[0]._id || 'chap-0';
          setExpandedChapters({ [firstId]: true });
        }
      }

      setIsLoading(false);
    } catch (err: unknown) {
      if (signal?.aborted) return;
      if (err instanceof Error && err.name === 'AbortError') return;
      if (
        (err as { name?: string })?.name === 'AbortError' ||
        (err instanceof AppApiError &&
          err.statusCode === 0 &&
          (err.raw as { name?: string })?.name === 'AbortError')
      ) {
        return;
      }

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
  }, [slug, initialLessonParam]);

  // Trigger Classroom Data Fetch on mount or slug change
  useEffect(() => {
    let isCurrent = true;
    const controller = new AbortController();

    async function init() {
      await loadClassroomData(controller.signal);
    }

    if (isCurrent) {
      init();
    }

    return () => {
      isCurrent = false;
      controller.abort();
    };
  }, [loadClassroomData]);


  // 2. User-specific Data Fetcher (Enrollment, Progress, Ratings) - Non-blocking
  useEffect(() => {
    if (!course) return;
    const courseId = course.id || course._id;
    if (!courseId) return;
    const targetCourseId: string = courseId;

    let isCurrent = true;
    const controller = new AbortController();

    async function loadUserData() {
      // Check Enrollment if user is authenticated
      let userIsEnrolled = false;
      if (isAuthenticated) {
        try {
          setEnrollmentError(null);
          // Parallel fetch enrollment records and completed orders
          const [enrollRes, completedOrdersRes] = await Promise.all([
            enrollmentService.getMyEnrollments({ signal: controller.signal }).catch(() => null),
            orderService.getMyOrders(
              { status: 'COMPLETED', limit: 100 },
              { signal: controller.signal }
            ).catch(() => null),
          ]);

          if (isCurrent) {
            const enrolledViaEnrollment = enrollRes?.data && Array.isArray(enrollRes.data)
              ? enrollRes.data.some(
                  (e) =>
                    e.status !== 'CANCELED' &&
                    e.status !== 'canceled' &&
                    ((courseId && (e.courseId === courseId || e.course?.id === courseId)) || e.course?.slug === slug)
                )
              : false;

            const enrolledViaCompletedOrder = completedOrdersRes?.data?.orders && Array.isArray(completedOrdersRes.data.orders)
              ? completedOrdersRes.data.orders.some(
                  (o) =>
                    (o.status === 'COMPLETED' || o.status === 'completed') &&
                    ((courseId && (o.courseId === courseId || o.course?.id === courseId)) || o.course?.slug === slug)
                )
              : false;

            userIsEnrolled = Boolean(enrolledViaEnrollment || enrolledViaCompletedOrder);
            setIsEnrolled(userIsEnrolled);
          }

          // If not enrolled, check if user has a pending order
          if (!userIsEnrolled) {
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
              // Non-blocking
            }
          }
        } catch (err: unknown) {
          if (isCurrent) {
            setEnrollmentError(
              err instanceof AppApiError
                ? err.message
                : 'Không thể xác thực quyền ghi danh từ máy chủ do lỗi kết nối mạng.'
            );
          }
        }
      } else {
        if (isCurrent) {
          setIsEnrolled(false);
          setHasPendingOrder(false);
          setEnrollmentError(null);
        }
      }

      // Fetch Course Progress if Enrolled, Author, or Admin
      const authorId = course?.author?.id || course?.author?._id;
      const currentUserId = user?.id || (user as { _id?: string })?._id;
      const userRole = user?.role?.toLowerCase();
      const isAuthorOrAdmin = (currentUserId && authorId && currentUserId === authorId) || userRole === 'admin';

      if (userIsEnrolled || isAuthorOrAdmin) {
        try {
          const progressRes = await progressService.getCourseProgress(targetCourseId, { signal: controller.signal });
          if (isCurrent && progressRes.data) {
            setProgressPercent(progressRes.data.percent || 0);
            const compIds = new Set<string>();
            (progressRes.data.lessons || []).forEach((item) => {
              if (item.completed) {
                const id = item.id || item._id;
                if (id) compIds.add(id);
              }
            });
            setCompletedLessonIds(compIds);
          }
        } catch {
          // Non-blocking
        }

        // Check if certificate has been officially issued for this course
        try {
          const cert = await certificateService.getCertificateByCourse(targetCourseId, {
            signal: controller.signal,
          });
          if (isCurrent) {
            setIssuedCertificate(cert);
          }
        } catch {
          // Non-blocking
        }
      }

      // Fetch Ratings
      try {
        const ratingRes = await ratingService.getCourseRatings(targetCourseId, { signal: controller.signal });
        if (isCurrent && ratingRes.data) {
          setRatingsData(ratingRes.data);
        }
      } catch {
        // Non-blocking
      }
    }

    loadUserData();

    // Stale-revalidation when switching back to tab/window
    const handleRevalidate = () => {
      if (document.visibilityState === 'visible' && isAuthenticated) {
        loadUserData();
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
  }, [course, isAuthenticated, user, slug, userRefreshKey]);

  const handleRetryEnrollment = async () => {
    if (!course || isRetryingEnrollment) return;
    const courseId = course.id || course._id;
    if (!courseId) return;

    setIsRetryingEnrollment(true);
    setEnrollmentError(null);
    try {
      const [enrollRes, completedOrdersRes] = await Promise.all([
        enrollmentService.getMyEnrollments().catch(() => null),
        orderService.getMyOrders({ status: 'COMPLETED', limit: 100 }).catch(() => null),
      ]);

      const enrolledViaEnrollment = enrollRes?.data && Array.isArray(enrollRes.data)
        ? enrollRes.data.some(
            (e) =>
              e.status !== 'CANCELED' &&
              e.status !== 'canceled' &&
              ((courseId && (e.courseId === courseId || e.course?.id === courseId)) || e.course?.slug === slug)
          )
        : false;

      const enrolledViaCompletedOrder = completedOrdersRes?.data?.orders && Array.isArray(completedOrdersRes.data.orders)
        ? completedOrdersRes.data.orders.some(
            (o) =>
              (o.status === 'COMPLETED' || o.status === 'completed') &&
              ((courseId && (o.courseId === courseId || o.course?.id === courseId)) || o.course?.slug === slug)
          )
        : false;

      const userIsEnrolled = Boolean(enrolledViaEnrollment || enrolledViaCompletedOrder);
      setIsEnrolled(userIsEnrolled);
      if (userIsEnrolled) {
        setHasPendingOrder(false);
      } else {
        const ordersRes = await orderService.getMyOrders({ status: 'PENDING', limit: 100 });
        if (ordersRes.data?.orders && Array.isArray(ordersRes.data.orders)) {
          const pending = ordersRes.data.orders.some(
            (o) =>
              (o.status === 'PENDING' || o.status === 'pending') &&
              ((courseId && (o.courseId === courseId || o.course?.id === courseId)) || o.course?.slug === slug)
          );
          setHasPendingOrder(pending);
        }
      }
    } catch (err: unknown) {
      setEnrollmentError(
        err instanceof AppApiError ? err.message : 'Lỗi kết nối máy chủ khi xác thực quyền ghi danh.'
      );
    } finally {
      setIsRetryingEnrollment(false);
    }
  };


  // Flattened ordered list of all lessons
  const allOrderedLessons = useMemo(() => {
    const list: ApiLessonItem[] = [];
    chapters.forEach((chap) => {
      list.push(...chap.fullLessons);
    });
    return list;
  }, [chapters]);

  // Synchronize active lesson with URL search params on browser Back/Forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const currentParam = new URLSearchParams(window.location.search).get('lesson');
      if (!currentParam || allOrderedLessons.length === 0) return;
      const target = allOrderedLessons.find(
        (l) => l.id === currentParam || l._id === currentParam || l.slug === currentParam
      );
      if (target) {
        setActiveLesson(target);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [allOrderedLessons]);

  // Current active lesson index
  const activeLessonIndex = useMemo(() => {
    if (!activeLesson) return -1;
    const currentId = activeLesson.id || activeLesson._id;
    return allOrderedLessons.findIndex((l) => (l.id || l._id) === currentId);
  }, [activeLesson, allOrderedLessons]);

  const isAuthorOrAdmin = useMemo(() => {
    const userRole = user?.role?.toLowerCase();
    if (userRole === 'admin') return true;
    const authorId = course?.author?.id || course?.author?._id;
    const currentUserId = user?.id || (user as { _id?: string })?._id;
    return Boolean(authorId && currentUserId && currentUserId === authorId);
  }, [user, course]);

  // Access validation: Is current user authorized to access the active lesson?
  const canAccessActiveLesson = useMemo(() => {
    if (!activeLesson) return false;
    if (activeLesson.isDemo) return true; // Demo lesson is accessible to all
    if (isAuthorOrAdmin) return true;
    return isEnrolled;
  }, [activeLesson, isAuthorOrAdmin, isEnrolled]);

  // Fetch Bunny Stream Video Playback (Secure signed embedUrl / HLS stream)
  useEffect(() => {
    const lessonId = activeLesson ? (activeLesson.id || activeLesson._id) : undefined;
    const hasBunny = Boolean(activeLesson?.bunnyVideoId);
    let isCurrent = true;
    const controller = new AbortController();

    async function loadBunnyPlayback() {
      if (!lessonId || !hasBunny || !canAccessActiveLesson) {
        if (isCurrent) {
          setBunnyPlayback(null);
          setBunnyError(null);
          setIsLoadingBunny(false);
        }
        return;
      }

      setIsLoadingBunny(true);
      setBunnyError(null);

      try {
        const res = await videoService.getLessonPlayback(lessonId, { signal: controller.signal });
        if (!isCurrent) return;
        if (res.success && res.data) {
          setBunnyPlayback(res.data);
        } else {
          setBunnyError('Không thể lấy liên kết phát video bảo mật từ Bunny CDN.');
        }
      } catch (err: unknown) {
        if (!isCurrent) return;
        setBunnyError(
          err instanceof Error ? err.message : 'Lỗi khi kết nối luồng phát Bunny CDN.'
        );
      } finally {
        if (isCurrent) {
          setIsLoadingBunny(false);
        }
      }
    }

    void loadBunnyPlayback();

    return () => {
      isCurrent = false;
      controller.abort();
    };
  }, [activeLesson, canAccessActiveLesson, bunnyRetryKey]);

  // Toggle chapter accordion
  const toggleChapter = (chapterId: string) => {
    setExpandedChapters((prev) => ({
      ...prev,
      [chapterId]: !prev[chapterId],
    }));
  };

  // Switch to another lesson
  const handleSelectLesson = (lesson: ApiLessonItem, chapterId: string) => {
    setActiveLesson(lesson);
    setExpandedChapters((prev) => ({ ...prev, [chapterId]: true }));
    const lessonId = lesson.id || lesson._id;
    if (lessonId) {
      router.replace(`/learn/${slug}?lesson=${lessonId}`, { scroll: false });
    }
  };

  // Prev / Next lesson navigation
  const handleNavigateLesson = (direction: 'prev' | 'next') => {
    if (activeLessonIndex === -1) return;
    const nextIdx = direction === 'next' ? activeLessonIndex + 1 : activeLessonIndex - 1;
    if (nextIdx >= 0 && nextIdx < allOrderedLessons.length) {
      const target = allOrderedLessons[nextIdx];
      setActiveLesson(target);
      const targetChap = chapters.find((ch) =>
        ch.fullLessons.some((l) => (l.id || l._id) === (target.id || target._id))
      );
      if (targetChap) {
        const chapId = targetChap.id || targetChap._id;
        if (chapId) {
          setExpandedChapters((prev) => ({ ...prev, [chapId]: true }));
        }
      }
      const lessonId = target.id || target._id;
      if (lessonId) {
        router.replace(`/learn/${slug}?lesson=${lessonId}`, { scroll: false });
      }
    }
  };

  // Toggle lesson completed state
  const handleToggleComplete = async () => {
    if (!course || !activeLesson || isUpdatingProgress) return;
    const courseId = course.id || course._id;
    const lessonId = activeLesson.id || activeLesson._id;
    if (!courseId || !lessonId) return;

    if (!isEnrolled && user?.role?.toLowerCase() !== 'admin') {
      toast.warning('Vui lòng ghi danh khóa học để lưu tiến độ hoàn thành bài học.');
      return;
    }

    setIsUpdatingProgress(true);
    const isCurrentlyDone = completedLessonIds.has(lessonId);

    try {
      if (isCurrentlyDone) {
        const res = await progressService.uncompleteLesson({ courseId, lessonId });
        setCompletedLessonIds((prev) => {
          const next = new Set(prev);
          next.delete(lessonId);
          return next;
        });
        if (res.data?.progress !== undefined) {
          setProgressPercent(res.data.progress);
        }
        toast.info('Đã hủy hoàn thành bài học.');
      } else {
        const res = await progressService.completeLesson({ courseId, lessonId });
        setCompletedLessonIds((prev) => {
          const next = new Set(prev);
          next.add(lessonId);
          return next;
        });
        if (res.data?.progress !== undefined) {
          setProgressPercent(res.data.progress);
          if (res.data.progress === 100) {
            toast.success('🎉 Chúc mừng bạn đã hoàn thành 100% nội dung khóa học!');
          } else {
            toast.success('Đã đánh dấu hoàn thành bài học!');
          }
        } else {
          toast.success('Đã đánh dấu hoàn thành bài học!');
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof AppApiError ? err.message : 'Không thể cập nhật tiến độ học.';
      toast.error(msg);
    } finally {
      setIsUpdatingProgress(false);
    }
  };

  // Handle quiz completed callback to auto-sync learning progress
  const handleQuizCompleted = async (result: { passed: boolean; score: number; percentage: number }) => {
    setUserRefreshKey((k) => k + 1);

    if (!result.passed) {
      toast.info('Bạn chưa vượt qua bài kiểm tra. Hãy ôn lại bài học và thử lại khi đủ điều kiện nhé.');
      return;
    }

    const courseId = course?.id || course?._id;
    const lessonId = activeLesson?.id || activeLesson?._id;
    if (!courseId || !lessonId) return;

    if (!isEnrolled && user?.role?.toLowerCase() !== 'admin') {
      return;
    }

    // If already marked as completed, avoid duplicate API calls
    if (completedLessonIds.has(lessonId)) {
      return;
    }

    try {
      const res = await progressService.completeLesson({ courseId, lessonId });
      setCompletedLessonIds((prev) => {
        const next = new Set(prev);
        next.add(lessonId);
        return next;
      });
      if (res.data?.progress !== undefined) {
        setProgressPercent(res.data.progress);
        if (res.data.progress === 100) {
          toast.success('🎉 Chúc mừng bạn đã hoàn thành 100% nội dung khóa học!');
        } else {
          toast.success('🎉 Đạt bài kiểm tra! Tiến độ bài học đã được tự động ghi nhận.');
        }
      } else {
        toast.success('🎉 Đạt bài kiểm tra! Tiến độ bài học đã được tự động ghi nhận.');
      }
    } catch (err: unknown) {
      const msg = err instanceof AppApiError ? err.message : 'Không thể tự động đồng bộ tiến độ bài học.';
      toast.error(msg);
    }
  };

  // Add personal note
  const handleAddNote = () => {
    if (!noteContent.trim() || !course || !activeLesson) return;
    const courseId = course.id || course._id;
    const lessonId = activeLesson.id || activeLesson._id;
    if (!courseId || !lessonId) return;

    const newNote = {
      id: Date.now().toString(),
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      text: noteContent.trim(),
    };

    const updated = [newNote, ...notesList];
    setNotesList(updated);
    setNoteContent('');

    try {
      localStorage.setItem(`tmdemy-notes-${courseId}-${lessonId}`, JSON.stringify(updated));
    } catch {
      // Storage error
    }
  };


  // Video embed URL
  const youtubeUrl = activeLesson ? getYouTubeEmbedUrl(activeLesson.videoUrl) : null;
  const isDirectVideo = Boolean(activeLesson?.videoUrl && !youtubeUrl);
  const bunnyEmbedUrl = bunnyPlayback?.playback?.embedUrl || bunnyPlayback?.embedUrl;
  const bunnyVideoStatus = bunnyPlayback?.playback?.videoStatus || bunnyPlayback?.status;
  const bunnyVideoId =
    bunnyPlayback?.playback?.videoId || bunnyPlayback?.videoId || activeLesson?.bunnyVideoId || 'bunny-video';

  // Active lesson completed flag
  const activeLessonId = activeLesson ? (activeLesson.id || activeLesson._id) : undefined;
  const isActiveLessonCompleted = activeLessonId ? completedLessonIds.has(activeLessonId) : false;

  // ==================== 1. LOADING SKELETON STATE ====================
  if (isLoading) {
    return (
      <AppShell>
        <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-6 animate-pulse">
          {/* Header Skeleton */}
          <div className="h-14 bg-slate-200 dark:bg-[#282136] rounded-xl mb-6" />

          {/* 2-Column Grid Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-4 h-[600px] bg-slate-200 dark:bg-[#282136] rounded-2xl" />
            <div className="lg:col-span-8 flex flex-col gap-6">
              <div className="aspect-video w-full bg-slate-200 dark:bg-[#282136] rounded-2xl" />
              <div className="h-16 bg-slate-200 dark:bg-[#282136] rounded-xl" />
              <div className="h-64 bg-slate-200 dark:bg-[#282136] rounded-2xl" />
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  // ==================== 2. NOT FOUND (404) STATE ====================
  if (isNotFound || !course) {
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
            Khóa học với định danh <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#282136] text-[#7240b8] dark:text-[#a87ffb] font-mono text-xs">{slug}</code> không tồn tại hoặc bạn chưa được cấp quyền truy cập.
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
  if (errorMessage) {
    return (
      <AppShell>
        <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-16 text-center">
          <div className="w-20 h-20 rounded-full bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-5">
            <span className="material-symbols-outlined text-[44px]">cloud_off</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#1c192c] dark:text-[#f4eeff] mb-2">
            Lỗi kết nối phòng học
          </h1>
          <p className="text-sm md:text-base text-[#635a72] dark:text-[#b4a9c7] max-w-md mb-8">
            {errorMessage}
          </p>
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <button
              onClick={() => {
                setIsLoading(true);
                setErrorMessage(null);
                loadClassroomData();
              }}
              className="px-5 py-2.5 rounded-xl bg-[#7240b8] hover:bg-[#8b5ad3] text-white text-sm font-semibold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">refresh</span>
              Thử lại
            </button>
            <Link
              href={`/courses/${slug}`}
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#282136] dark:hover:bg-[#342a47] text-[#1c192c] dark:text-[#f4eeff] text-sm font-semibold transition-colors"
            >
              Xem trang khóa học
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  // Calculate total lessons & completed lessons
  const totalLessonsCount = allOrderedLessons.length;
  const completedCount = completedLessonIds.size;

  return (
    <AppShell>
      {/* 1. TOP STICKY CLASSROOM SUB-HEADER BAR */}
      <div className="sticky top-16 z-30 bg-white/95 dark:bg-[#16131e]/95 backdrop-blur-md border-b border-[#f1ebff] dark:border-[#2b2438] px-4 md:px-8 py-3">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href={`/courses/${slug}`}
              className="p-1.5 rounded-lg text-[#635a72] dark:text-[#b4a9c7] hover:bg-[#f7f1ff] dark:hover:bg-[#282136] hover:text-[#7240b8] dark:hover:text-[#a87ffb] transition-colors shrink-0"
              title="Quay lại chi tiết khóa học"
            >
              <span className="material-symbols-outlined text-[22px]">arrow_back</span>
            </Link>
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-bold text-[#7240b8] dark:text-[#a87ffb] uppercase tracking-wider">
                Lớp học trực tuyến
              </span>
              <h1 className="text-sm md:text-base font-bold text-[#1c192c] dark:text-[#f4eeff] truncate">
                {course.title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4 self-end md:self-auto shrink-0">
            {/* Progress gauge */}
            <div className="hidden sm:flex flex-col items-end gap-1">
              <div className="flex items-center gap-1.5 text-xs text-[#635a72] dark:text-[#b4a9c7]">
                <span>Tiến độ:</span>
                <strong className="text-[#7240b8] dark:text-[#a87ffb] font-bold">
                  {completedCount}/{totalLessonsCount} bài ({progressPercent}%)
                </strong>
              </div>
              <div className="w-36 h-2 rounded-full bg-[#ebe5ff] dark:bg-[#282136] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#7240b8] dark:bg-[#a87ffb] transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              {course?.id && (
                issuedCertificate ? (
                  <Link
                    href={`/certificates?courseId=${encodeURIComponent(course.id)}`}
                    className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                    title="Xem chứng chỉ tốt nghiệp chính thức"
                  >
                    <span className="material-symbols-outlined text-[18px]">verified</span>
                    <span className="hidden md:inline">Xem chứng chỉ</span>
                  </Link>
                ) : progressPercent >= 70 ? (
                  <Link
                    href={`/certificates?courseId=${encodeURIComponent(course.id)}`}
                    className="px-3.5 py-2 rounded-xl bg-primary hover:bg-[#8b5ad3] text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                    title="Đủ điều kiện: Gửi yêu cầu cấp chứng chỉ tốt nghiệp"
                  >
                    <span className="material-symbols-outlined text-[18px]">workspace_premium</span>
                    <span className="hidden md:inline">Nhận chứng chỉ</span>
                  </Link>
                ) : null
              )}
              <button
                onClick={handleToggleComplete}
                disabled={isUpdatingProgress || !canAccessActiveLesson}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer ${
                  isActiveLessonCompleted
                    ? 'bg-[#00855b] text-white hover:bg-[#00704d]'
                    : 'bg-[#7240b8] hover:bg-[#8b5ad3] text-white'
                } ${!canAccessActiveLesson ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {isActiveLessonCompleted ? 'check_circle' : 'radio_button_unchecked'}
                </span>
                <span>{isActiveLessonCompleted ? 'Đã hoàn thành bài' : 'Đánh dấu hoàn thành'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN 2-COLUMN CLASSROOM LAYOUT */}
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: CURRICULUM ACCORDION (4 cols on lg) */}
          <aside className="lg:col-span-4 order-2 lg:order-1 flex flex-col gap-4">
            <div className="bg-white dark:bg-[#1d1926] rounded-2xl p-5 border border-[#f1ebff] dark:border-[#2f2742] shadow-xs flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#f7f1ff] dark:border-[#2b2438]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#7240b8] dark:text-[#a87ffb] text-[22px]">
                    menu_book
                  </span>
                  <h2 className="text-base font-bold text-[#1c192c] dark:text-[#f4eeff]">Nội dung khóa học</h2>
                </div>
                <span className="text-xs text-[#635a72] dark:text-[#b4a9c7] font-medium">
                  {chapters.length} chương • {totalLessonsCount} bài
                </span>
              </div>

              {/* Chapter Accordion List */}
              {chapters.length > 0 ? (
                <div className="flex flex-col gap-2.5">
                  {chapters.map((chapter, idx) => {
                    const chapterId = chapter.id || chapter._id || `chap-${idx}`;
                    const isExpanded = !!expandedChapters[chapterId];
                    const chapterLessons = chapter.fullLessons || [];

                    // Calculate completed in this chapter
                    const completedInChapter = chapterLessons.filter((l) => {
                      const id = l.id || l._id;
                      return id ? completedLessonIds.has(id) : false;
                    }).length;
                    const isChapterFinished =
                      chapterLessons.length > 0 && completedInChapter === chapterLessons.length;

                    return (
                      <div
                        key={chapterId}
                        className="rounded-xl border border-[#f1ebff] dark:border-[#2f2742] overflow-hidden transition-all bg-white dark:bg-[#1d1926]"
                      >
                        {/* Chapter Header Toggle */}
                        <button
                          onClick={() => toggleChapter(chapterId)}
                          className={`w-full px-4 py-3 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer ${
                            isExpanded
                              ? 'bg-[#f7f1ff]/70 dark:bg-[#231d30]'
                              : 'hover:bg-[#f7f1ff]/40 dark:hover:bg-[#231d30]/50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0 ${
                                isChapterFinished
                                  ? 'bg-[#00855b]/15 text-[#00855b]'
                                  : 'bg-[#ebe5ff] dark:bg-[#342a47] text-[#7240b8] dark:text-[#a87ffb]'
                              }`}
                            >
                              {isChapterFinished ? '✓' : idx + 1}
                            </span>
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-bold text-[#1c192c] dark:text-[#f4eeff] truncate">
                                {chapter.title}
                              </span>
                              <span className="text-[11px] text-[#635a72] dark:text-[#b4a9c7]">
                                {completedInChapter}/{chapterLessons.length} bài hoàn thành
                              </span>
                            </div>
                          </div>

                          <span
                            className={`material-symbols-outlined text-[#635a72] dark:text-[#b4a9c7] text-[20px] transition-transform ${
                              isExpanded ? 'rotate-180 text-[#7240b8] dark:text-[#a87ffb]' : ''
                            }`}
                          >
                            expand_more
                          </span>
                        </button>

                        {/* Lesson Items inside Chapter */}
                        {isExpanded && (
                          <div className="px-2 py-2 flex flex-col gap-1 bg-[#fdf8ff] dark:bg-[#171420] border-t border-[#f1ebff] dark:border-[#2b2438]">
                            {chapterLessons.map((lesson, lIdx) => {
                              const lessonId = lesson.id || lesson._id || `l-${lIdx}`;
                              const isCurrent = (activeLesson?.id || activeLesson?._id) === lessonId;
                              const isLessonCompleted = completedLessonIds.has(lessonId);

                              // Access rule
                              const isAccessible =
                                isEnrolled || isAuthorOrAdmin || lesson.isDemo;

                              return (
                                <button
                                  key={lessonId}
                                  onClick={() => handleSelectLesson(lesson, chapterId)}
                                  className={`w-full text-left px-3 py-2.5 rounded-lg text-xs flex items-center justify-between gap-2.5 transition-all cursor-pointer ${
                                    isCurrent
                                      ? 'bg-[#7240b8] text-white font-bold shadow-xs'
                                      : !isAccessible
                                      ? 'opacity-65 text-[#7c7483] dark:text-[#8d8496] bg-transparent hover:bg-slate-100 dark:hover:bg-[#221d2d]'
                                      : 'text-[#4b4452] dark:text-[#cdc3d4] hover:bg-white dark:hover:bg-[#231d30] hover:text-[#1c192c] dark:hover:text-[#f4eeff]'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    {!isAccessible ? (
                                      <span className="material-symbols-outlined text-[16px] text-[#7c7483] dark:text-[#8d8496]">
                                        lock
                                      </span>
                                    ) : isLessonCompleted ? (
                                      <span
                                        className={`material-symbols-outlined text-[16px] ${
                                          isCurrent ? 'text-white' : 'text-[#00855b]'
                                        }`}
                                      >
                                        check_circle
                                      </span>
                                    ) : isCurrent ? (
                                      <span className="material-symbols-outlined text-[16px] text-white animate-pulse">
                                        play_arrow
                                      </span>
                                    ) : (
                                      <span className="material-symbols-outlined text-[16px] text-[#7240b8] dark:text-[#a87ffb]">
                                        play_circle
                                      </span>
                                    )}

                                    <span className="truncate leading-tight">
                                      {lesson.title}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0">
                                    {lesson.isDemo && !isEnrolled && (
                                      <span className="px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[10px] font-bold">
                                        Xem thử
                                      </span>
                                    )}
                                    {isCurrent && activeQuiz && (
                                      <span
                                        className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                          isCurrent
                                            ? 'bg-white/20 text-white'
                                            : 'bg-purple-100 text-[#7240b8] dark:bg-purple-950/60 dark:text-[#a87ffb]'
                                        }`}
                                      >
                                        Quiz
                                      </span>
                                    )}
                                    <span
                                      className={`text-[11px] ${
                                        isCurrent ? 'text-white/80' : 'text-[#7c7483] dark:text-[#8d8496]'
                                      }`}
                                    >
                                      {formatDuration(lesson.duration)}
                                    </span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-[#635a72] dark:text-[#b4a9c7]">
                  Chưa có danh sách bài học nào được tạo.
                </div>
              )}

              {/* Instructor Mentor Info Card */}
              {course.author && (
                <div className="pt-4 border-t border-[#f7f1ff] dark:border-[#2b2438] flex items-center gap-3">
                  <img
                    src={
                      course.author.avatar && course.author.avatar.trim()
                        ? course.author.avatar
                        : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
                    }
                    alt={course.author.username}
                    className="w-11 h-11 rounded-full object-cover ring-2 ring-[#7240b8]/20"
                  />
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-[#1c192c] dark:text-[#f4eeff] truncate">
                        {course.author.username}
                      </span>
                      <span className="px-1.5 py-0.2 rounded bg-[#00855b]/15 text-[#00855b] text-[10px] font-bold">
                        Giảng viên
                      </span>
                    </div>
                    <span className="text-[11px] text-[#635a72] dark:text-[#b4a9c7] truncate">
                      {course.author.role === 'ADMIN' ? 'Ban cố vấn & Quản trị viên' : 'Chuyên gia hướng dẫn'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* RIGHT COLUMN: CINEMA VIDEO PLAYER & TABS (8 cols on lg) */}
          <section className="lg:col-span-8 order-1 lg:order-2 flex flex-col gap-6">
            {/* 1. CINEMA VIDEO PLAYER CONTAINER */}
            <div className="relative overflow-hidden rounded-2xl bg-[#0e0c15] shadow-xl border border-black/20 aspect-video flex flex-col justify-center items-center group">
              {allOrderedLessons.length === 0 ? (
                /* EMPTY CURRICULUM STATE */
                <div className="p-8 text-center flex flex-col items-center justify-center max-w-md gap-3 z-20">
                  <div className="w-16 h-16 rounded-full bg-purple-900/50 text-purple-300 flex items-center justify-center mb-1">
                    <span className="material-symbols-outlined text-[36px]">auto_stories</span>
                  </div>
                  <h3 className="text-lg font-bold text-white">
                    Khóa học đang cập nhật bài giảng
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Giảng viên và đội ngũ học thuật đang hoàn thiện nội dung cho khóa học này. Vui lòng quay lại sau hoặc tham khảo các khóa học khác của TMdemy.
                  </p>
                  <div className="flex items-center gap-3 pt-2">
                    <Link
                      href="/my-courses"
                      className="px-5 py-2.5 rounded-xl bg-[#7240b8] hover:bg-[#8b5ad3] text-white text-xs font-bold transition-all shadow-md"
                    >
                      Khóa học của tôi
                    </Link>
                    <Link
                      href="/courses"
                      className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all"
                    >
                      Khám phá thêm
                    </Link>
                  </div>
                </div>
              ) : !canAccessActiveLesson ? (
                /* ACCESS RESTRICTION OVERLAY */
                <div className="p-8 text-center flex flex-col items-center justify-center max-w-md gap-4 z-20">
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center ${
                      enrollmentError
                        ? 'bg-rose-900/50 text-rose-300'
                        : hasPendingOrder
                        ? 'bg-amber-900/50 text-amber-300'
                        : 'bg-purple-900/50 text-purple-300'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[36px]">
                      {enrollmentError ? 'wifi_off' : hasPendingOrder ? 'pending_actions' : 'lock'}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white">
                    {enrollmentError
                      ? 'Không thể xác thực quyền truy cập'
                      : hasPendingOrder
                      ? 'Đơn hàng đang chờ phê duyệt'
                      : 'Bài học yêu cầu ghi danh khóa học'}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {enrollmentError
                      ? enrollmentError
                      : hasPendingOrder
                      ? 'Bạn đã đặt đơn hàng cho khóa học này và đang chờ Giảng viên hoặc Quản trị viên duyệt thanh toán. Lớp học sẽ tự động mở sau khi đơn hàng hoàn tất.'
                      : 'Bạn đang xem ở chế độ khách hoặc chưa ghi danh vào khóa học này. Hãy đăng ký để mở khóa toàn bộ bài giảng và học liệu thực hành.'}
                  </p>
                  <div className="flex items-center gap-3 pt-2">
                    {enrollmentError ? (
                      <button
                        onClick={handleRetryEnrollment}
                        disabled={isRetryingEnrollment}
                        className="px-5 py-2.5 rounded-xl bg-[#7240b8] hover:bg-[#8b5ad3] text-white text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-2"
                      >
                        <span className={`material-symbols-outlined text-[16px] ${isRetryingEnrollment ? 'animate-spin' : ''}`}>
                          refresh
                        </span>
                        <span>{isRetryingEnrollment ? 'Đang kiểm tra...' : 'Thử lại ngay'}</span>
                      </button>
                    ) : hasPendingOrder ? (
                      <Link
                        href="/orders"
                        className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-[16px]">shopping_bag</span>
                        <span>Xem Đơn hàng của tôi</span>
                      </Link>
                    ) : !isAuthenticated ? (
                      <Link
                        href={`/login?redirect=/learn/${slug}`}
                        className="px-5 py-2.5 rounded-xl bg-[#7240b8] hover:bg-[#8b5ad3] text-white text-xs font-bold transition-all shadow-md"
                      >
                        Đăng nhập ngay
                      </Link>
                    ) : (
                      <Link
                        href={`/courses/${slug}`}
                        className="px-5 py-2.5 rounded-xl bg-[#7240b8] hover:bg-[#8b5ad3] text-white text-xs font-bold transition-all shadow-md"
                      >
                        Ghi danh khóa học ngay
                      </Link>
                    )}
                  </div>
                </div>
              ) : activeLesson?.bunnyVideoId ? (
                /* 1. BUNNY STREAM CDN PLAYER */
                isLoadingBunny ? (
                  <div className="p-8 text-center flex flex-col items-center justify-center max-w-md gap-3 z-20">
                    <Loader2 className="w-10 h-10 animate-spin text-[#a87ffb]" />
                    <h3 className="text-base font-bold text-white">
                      Đang kết nối luồng phát Bunny Stream...
                    </h3>
                    <p className="text-xs text-slate-300">
                      Khởi tạo mạng phân phối CDN và mã hóa tương thích đa phân giải HLS.
                    </p>
                  </div>
                ) : bunnyEmbedUrl ? (
                  <iframe
                    key={bunnyVideoId}
                    src={bunnyEmbedUrl}
                    title={activeLesson?.title || 'Bài học Bunny Stream'}
                    allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                    allowFullScreen
                    className="w-full h-full border-0"
                  />
                ) : bunnyVideoStatus === 'PROCESSING' ? (
                  <div className="p-8 text-center flex flex-col items-center justify-center max-w-md gap-3 z-20">
                    <div className="w-16 h-16 rounded-full bg-purple-900/50 text-purple-300 flex items-center justify-center mb-1">
                      <Loader2 className="w-8 h-8 animate-spin text-[#a87ffb]" />
                    </div>
                    <h3 className="text-base font-bold text-white">Video đang được mã hóa HLS</h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Video bài giảng đã tải lên hoàn tất và đang được máy chủ Bunny Stream CDN chuyển mã đa phân giải (360p - 1080p).
                      Hệ thống sẽ tự động sẵn sàng trong ít phút.
                    </p>
                    <button
                      onClick={() => setBunnyRetryKey((k) => k + 1)}
                      className="px-4 py-2 rounded-xl bg-[#7240b8] hover:bg-[#8b5ad3] text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer mt-2"
                    >
                      <span className="material-symbols-outlined text-[16px]">refresh</span>
                      <span>Kiểm tra lại trạng thái</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-8 text-center flex flex-col items-center justify-center max-w-md gap-3 z-20">
                    <div className="w-16 h-16 rounded-full bg-rose-900/50 text-rose-300 flex items-center justify-center mb-1">
                      <span className="material-symbols-outlined text-[36px]">videocam_off</span>
                    </div>
                    <h3 className="text-base font-bold text-white">Không thể kết nối luồng phát video</h3>
                    <p className="text-xs text-slate-300">
                      {bunnyError || 'Đã có lỗi xảy ra khi xác thực quyền truy cập video bài giảng.'}
                    </p>
                    <button
                      onClick={() => setBunnyRetryKey((k) => k + 1)}
                      className="px-4 py-2 rounded-xl bg-[#7240b8] hover:bg-[#8b5ad3] text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer mt-1"
                    >
                      <span className="material-symbols-outlined text-[16px]">refresh</span>
                      <span>Thử tải lại</span>
                    </button>
                  </div>
                )
              ) : youtubeUrl ? (
                /* 2. YOUTUBE EMBED PLAYER (LEGACY FALLBACK) */
                <iframe
                  src={youtubeUrl}
                  title={activeLesson?.title || 'Bài học'}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              ) : isDirectVideo ? (
                hasVideoError ? (
                  /* 3. VIDEO PLAYBACK ERROR FALLBACK */
                  <div className="p-8 text-center flex flex-col items-center justify-center max-w-md gap-3 z-20">
                    <div className="w-16 h-16 rounded-full bg-rose-900/50 text-rose-300 flex items-center justify-center mb-1">
                      <span className="material-symbols-outlined text-[36px]">videocam_off</span>
                    </div>
                    <h3 className="text-base font-bold text-white">Không thể phát video bài học</h3>
                    <p className="text-xs text-slate-300">
                      Đã xảy ra lỗi khi tải nguồn phát video hoặc trình duyệt không hỗ trợ định dạng này.
                    </p>
                    <button
                      onClick={() => setFailedVideoUrl(null)}
                      className="px-4 py-2 rounded-xl bg-[#7240b8] hover:bg-[#8b5ad3] text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer mt-1"
                    >
                      <span className="material-symbols-outlined text-[16px]">refresh</span>
                      Thử tải lại video
                    </button>
                  </div>
                ) : (
                  /* 4. DIRECT HTML5 VIDEO PLAYER (LEGACY FALLBACK) */
                  <video
                    key={activeLesson?.videoUrl}
                    src={activeLesson?.videoUrl}
                    controls
                    playsInline
                    onError={() => setFailedVideoUrl(activeLesson?.videoUrl || '')}
                    className="w-full h-full object-contain"
                  />
                )
              ) : (
                /* 5. NO VIDEO URL / TEXT READING LESSON */
                <div className="p-8 text-center flex flex-col items-center justify-center max-w-md gap-3 z-20">
                  <span className="material-symbols-outlined text-[48px] text-purple-400">
                    description
                  </span>
                  <h3 className="text-base font-bold text-white">
                    {activeLesson?.title || 'Bài học lý thuyết & thực hành'}
                  </h3>
                  <p className="text-xs text-slate-300">
                    Bài học này tập trung vào tài liệu đọc, hướng dẫn mã nguồn và thực hành dự án. Vui lòng xem chi tiết ở tab &quot;Tổng quan &amp; Nội dung&quot; bên dưới.
                  </p>
                </div>
              )}
            </div>

            {/* 2. VIDEO ACTION & NAV BUTTONS BAR */}
            <div className="bg-white dark:bg-[#1d1926] rounded-xl p-4 border border-[#f1ebff] dark:border-[#2f2742] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleToggleComplete}
                  disabled={isUpdatingProgress || !canAccessActiveLesson}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    isActiveLessonCompleted
                      ? 'bg-[#00855b] text-white hover:bg-[#00704d]'
                      : 'bg-[#ebe5ff] dark:bg-[#282136] text-[#7240b8] dark:text-[#a87ffb] hover:bg-[#7240b8] hover:text-white'
                  } ${!canAccessActiveLesson ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {isActiveLessonCompleted ? 'check_circle' : 'radio_button_unchecked'}
                  </span>
                  <span>{isActiveLessonCompleted ? 'Đã hoàn thành bài này' : 'Đánh dấu hoàn thành'}</span>
                </button>

                {activeQuiz && (
                  <button
                    onClick={() => setActiveTab('quiz')}
                    className="px-3.5 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-[#7240b8] dark:text-[#a87ffb] hover:bg-[#ebe5ff] dark:hover:bg-[#342a47] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-[#e6dffa] dark:border-[#382d50]"
                  >
                    <span className="material-symbols-outlined text-[18px]">quiz</span>
                    <span>Làm bài kiểm tra ({activeQuiz.questions?.length || 0} câu)</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  onClick={() => handleNavigateLesson('prev')}
                  disabled={activeLessonIndex <= 0}
                  className="px-3 py-2 rounded-xl border border-[#e6dffa] dark:border-[#382d50] text-xs font-semibold text-[#4b4452] dark:text-[#cdc3d4] hover:bg-[#f7f1ff] dark:hover:bg-[#282136] transition-colors flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                  <span>Bài trước</span>
                </button>
                <button
                  onClick={() => handleNavigateLesson('next')}
                  disabled={activeLessonIndex === -1 || activeLessonIndex >= allOrderedLessons.length - 1}
                  className="px-4 py-2 rounded-xl bg-[#7240b8] hover:bg-[#8b5ad3] text-white text-xs font-bold transition-colors flex items-center gap-1 shadow-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <span>Bài tiếp theo</span>
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
              </div>
            </div>

            {/* 3. WORKSPACE TABS */}
            <div className="bg-white dark:bg-[#1d1926] rounded-2xl border border-[#f1ebff] dark:border-[#2f2742] shadow-xs overflow-hidden">
              {/* Tab Navigation Header */}
              <div className="flex border-b border-[#f1ebff] dark:border-[#2b2438] px-4 overflow-x-auto">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-4 py-3.5 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 shrink-0 cursor-pointer ${
                    activeTab === 'overview'
                      ? 'border-[#7240b8] text-[#7240b8] dark:border-[#a87ffb] dark:text-[#a87ffb]'
                      : 'border-transparent text-[#635a72] dark:text-[#b4a9c7] hover:text-[#1c192c] dark:hover:text-[#f4eeff]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">description</span>
                  <span>Tổng quan &amp; Nội dung</span>
                </button>
                <button
                  onClick={() => setActiveTab('quiz')}
                  className={`px-4 py-3.5 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 shrink-0 cursor-pointer ${
                    activeTab === 'quiz'
                      ? 'border-[#7240b8] text-[#7240b8] dark:border-[#a87ffb] dark:text-[#a87ffb]'
                      : 'border-transparent text-[#635a72] dark:text-[#b4a9c7] hover:text-[#1c192c] dark:hover:text-[#f4eeff]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">quiz</span>
                  <span>Bài kiểm tra {activeQuiz ? `(${activeQuiz.questions?.length || 0})` : ''}</span>
                  {activeQuiz && (
                    <span className="w-2 h-2 rounded-full bg-[#7240b8] dark:bg-[#a87ffb] animate-pulse" />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('qa')}
                  className={`px-4 py-3.5 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 shrink-0 cursor-pointer ${
                    activeTab === 'qa'
                      ? 'border-[#7240b8] text-[#7240b8] dark:border-[#a87ffb] dark:text-[#a87ffb]'
                      : 'border-transparent text-[#635a72] dark:text-[#b4a9c7] hover:text-[#1c192c] dark:hover:text-[#f4eeff]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">forum</span>
                  <span>Hỏi đáp &amp; Thảo luận</span>
                </button>
                <button
                  onClick={() => setActiveTab('notes')}
                  className={`px-4 py-3.5 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 shrink-0 cursor-pointer ${
                    activeTab === 'notes'
                      ? 'border-[#7240b8] text-[#7240b8] dark:border-[#a87ffb] dark:text-[#a87ffb]'
                      : 'border-transparent text-[#635a72] dark:text-[#b4a9c7] hover:text-[#1c192c] dark:hover:text-[#f4eeff]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">edit_note</span>
                  <span>Ghi chú ({notesList.length})</span>
                </button>
                <button
                  onClick={() => setActiveTab('reviews')}
                  className={`px-4 py-3.5 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 shrink-0 cursor-pointer ${
                    activeTab === 'reviews'
                      ? 'border-[#7240b8] text-[#7240b8] dark:border-[#a87ffb] dark:text-[#a87ffb]'
                      : 'border-transparent text-[#635a72] dark:text-[#b4a9c7] hover:text-[#1c192c] dark:hover:text-[#f4eeff]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">star</span>
                  <span>Đánh giá ({ratingsData?.totalRatings || 0})</span>
                </button>
              </div>

              {/* Tab Contents */}
              <div className="p-6">
                {/* TAB 1: OVERVIEW & REAL LESSON CONTENT */}
                {activeTab === 'overview' && (
                  <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-2">
                      <h3 className="text-lg font-bold text-[#1c192c] dark:text-[#f4eeff]">
                        {activeLesson?.title}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-[#635a72] dark:text-[#b4a9c7]">
                        <span>Thời lượng: {formatDuration(activeLesson?.duration)}</span>
                        <span>•</span>
                        <span>Loại: {activeLesson?.type || 'Video bài giảng'}</span>
                        {activeLesson?.isDemo && (
                          <>
                            <span>•</span>
                            <span className="text-amber-600 dark:text-amber-400 font-bold">Bài học học thử miễn phí</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Lesson Text / Content */}
                    <div className="p-5 rounded-xl bg-[#f7f1ff] dark:bg-[#16131e] border border-[#f1ebff] dark:border-[#2f2742] text-sm text-[#383141] dark:text-[#ded8e8] leading-relaxed whitespace-pre-line">
                      {activeLesson?.content || course.description || 'Chưa có nội dung tóm tắt cho bài học này.'}
                    </div>

                    {/* Course Outcomes & Documents Reference */}
                    {course.info?.benefits && course.info.benefits.length > 0 && (
                      <div className="flex flex-col gap-3">
                        <h4 className="text-xs font-bold text-[#1c192c] dark:text-[#f4eeff] uppercase tracking-wider">
                          Mục tiêu kiến thức trọng tâm
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {course.info.benefits.map((b, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-xs text-[#4b4452] dark:text-[#cdc3d4]">
                              <span className="material-symbols-outlined text-[#00855b] text-[18px] shrink-0 mt-0.5">
                                check
                              </span>
                              <span>{b}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB: QUIZ & QUESTION EXPERIENCE */}
                {activeTab === 'quiz' && (
                  <div className="flex flex-col gap-6">
                    {isLoadingQuiz ? (
                      <div className="py-12 text-center flex flex-col items-center justify-center gap-3 animate-pulse">
                        <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-[#282136]" />
                        <span className="text-xs text-[#635a72] dark:text-[#b4a9c7]">
                          Đang kiểm tra dữ liệu bài kiểm tra...
                        </span>
                      </div>
                    ) : activeQuiz ? (
                      <QuizView
                        quiz={activeQuiz}
                        courseSlug={slug}
                        isEnrolled={canAccessActiveLesson}
                        onBackToLesson={() => setActiveTab('overview')}
                        onCompleted={handleQuizCompleted}
                      />
                    ) : (
                      <div className="py-12 text-center flex flex-col items-center justify-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-[#282136] text-[#968e9e] flex items-center justify-center">
                          <span className="material-symbols-outlined text-[36px]">quiz</span>
                        </div>
                        <h3 className="text-base font-bold text-[#1c192c] dark:text-[#f4eeff]">
                          Bài học này chưa có bài kiểm tra
                        </h3>
                        <p className="text-xs text-[#635a72] dark:text-[#b4a9c7] max-w-sm">
                          Giảng viên chưa thiết lập câu hỏi trắc nghiệm cho bài học này. Bạn có thể tiếp tục học bài tiếp theo hoặc xem nội dung lý thuyết.
                        </p>
                        <button
                          onClick={() => setActiveTab('overview')}
                          className="px-4 py-2 rounded-xl bg-[#7240b8] hover:bg-[#8b5ad3] text-white text-xs font-bold transition-all shadow-xs cursor-pointer mt-1"
                        >
                          Quay lại nội dung bài học
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: Q&A / REAL COMMENTS */}
                {activeTab === 'qa' && activeLesson && (
                  <LessonComments
                    lessonId={activeLesson.id || activeLesson._id || ''}
                    courseId={course.id || course._id || ''}
                    courseSlug={slug}
                    lessonTitle={activeLesson.title}
                    targetCommentId={searchParams?.get('commentId') || searchParams?.get('comment')}
                    targetParentId={searchParams?.get('parentId')}
                  />
                )}

                {/* TAB 3: NOTES */}
                {activeTab === 'notes' && (
                  <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-3">
                      <textarea
                        value={noteContent}
                        onChange={(e) => setNoteContent(e.target.value)}
                        placeholder="Ghi chú lại điểm cốt lõi hoặc ý tưởng khi học bài này..."
                        rows={3}
                        className="w-full p-3.5 rounded-xl border border-[#e6dffa] dark:border-[#382d50] bg-white dark:bg-[#16131e] text-xs text-[#1c192c] dark:text-[#f4eeff] placeholder:text-[#968e9e] focus:outline-none focus:ring-2 focus:ring-[#7240b8] transition-all"
                      />
                      <div className="flex justify-end">
                        <button
                          onClick={handleAddNote}
                          disabled={!noteContent.trim()}
                          className="px-4 py-2 rounded-xl bg-[#7240b8] hover:bg-[#8b5ad3] text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                        >
                          Lưu ghi chú
                        </button>
                      </div>
                    </div>

                    {notesList.length > 0 ? (
                      <div className="flex flex-col gap-3">
                        {notesList.map((n) => (
                          <div
                            key={n.id}
                            className="p-3.5 rounded-xl bg-[#f7f1ff] dark:bg-[#16131e] border border-[#f1ebff] dark:border-[#2f2742] flex flex-col gap-1.5"
                          >
                            <span className="text-[10px] font-bold text-[#7240b8] dark:text-[#a87ffb]">
                              {n.time}
                            </span>
                            <p className="text-xs text-[#1c192c] dark:text-[#f4eeff] leading-relaxed">
                              {n.text}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-8 text-center text-xs text-[#635a72] dark:text-[#b4a9c7]">
                        Bạn chưa có ghi chú nào cho bài học này.
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 4: RATINGS & REVIEWS */}
                {activeTab === 'reviews' && (
                  <CourseRatingSection
                    courseId={course.id || course._id || ''}
                    courseSlug={slug}
                    isEnrolled={isEnrolled || canAccessActiveLesson}
                    initialRatings={ratingsData}
                    onRatingSubmitted={async () => {
                      const cId = course.id || course._id;
                      if (cId) {
                        try {
                          const ratingRes = await ratingService.getCourseRatings(cId);
                          if (ratingRes.data) {
                            setRatingsData(ratingRes.data);
                          }
                        } catch {
                          // Non-blocking
                        }
                      }
                    }}
                  />
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
