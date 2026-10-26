'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Layers,
  Plus,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
} from 'lucide-react';
import { TeacherCourseItem } from '@/types/course';
import { ApiChapterItem } from '@/types/chapter';
import { ApiLessonItem } from '@/types/lesson';
import { ApiQuizDetail } from '@/types/quiz';
import { courseService } from '@/services/course.service';
import { chapterService } from '@/services/chapter.service';
import { lessonService } from '@/services/lesson.service';
import { quizService } from '@/services/quiz.service';
import { CurriculumHeader } from '@/components/teacher/curriculum/curriculum-header';
import { ChapterAccordionItem } from '@/components/teacher/curriculum/chapter-accordion-item';
import { ChapterModal } from '@/components/teacher/curriculum/chapter-modal';
import { ChapterDeleteModal } from '@/components/teacher/curriculum/chapter-delete-modal';
import { LessonModal } from '@/components/teacher/curriculum/lesson-modal';
import { LessonDeleteModal } from '@/components/teacher/curriculum/lesson-delete-modal';
import { VideoPreviewModal } from '@/components/teacher/curriculum/video-preview-modal';
import { QuizModal } from '@/components/teacher/quiz/quiz-modal';
import { QuizDeleteModal } from '@/components/teacher/quiz/quiz-delete-modal';
import { QuizStudioModal } from '@/components/teacher/quiz/quiz-studio-modal';
import { toast } from '@/lib/toast';

export default function TeacherCurriculumBuilderPage() {
  const params = useParams();
  const courseId = (params?.id as string) || '';

  // Data states
  const [course, setCourse] = useState<TeacherCourseItem | null>(null);
  const [chapters, setChapters] = useState<ApiChapterItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [reloadKey, setReloadKey] = useState<number>(0);

  // Accordion expansion state: map of chapterId -> boolean
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({});

  // Modals state
  const [chapterModalState, setChapterModalState] = useState<{
    isOpen: boolean;
    chapter: ApiChapterItem | null;
  }>({ isOpen: false, chapter: null });

  const [chapterDeleteState, setChapterDeleteState] = useState<{
    isOpen: boolean;
    chapter: ApiChapterItem | null;
  }>({ isOpen: false, chapter: null });

  const [lessonModalState, setLessonModalState] = useState<{
    isOpen: boolean;
    chapter: ApiChapterItem | null;
    lesson: ApiLessonItem | null;
  }>({ isOpen: false, chapter: null, lesson: null });

  const [lessonDeleteState, setLessonDeleteState] = useState<{
    isOpen: boolean;
    lesson: ApiLessonItem | null;
  }>({ isOpen: false, lesson: null });

  const [videoPreviewState, setVideoPreviewState] = useState<{
    isOpen: boolean;
    lesson: ApiLessonItem | null;
  }>({ isOpen: false, lesson: null });

  // Quiz states
  const [lessonQuizzes, setLessonQuizzes] = useState<Record<string, ApiQuizDetail | null>>({});
  const [quizModalState, setQuizModalState] = useState<{
    isOpen: boolean;
    lesson: ApiLessonItem | null;
    quiz: ApiQuizDetail | null;
  }>({ isOpen: false, lesson: null, quiz: null });

  const [quizDeleteState, setQuizDeleteState] = useState<{
    isOpen: boolean;
    quiz: ApiQuizDetail | null;
    lessonTitle?: string;
  }>({ isOpen: false, quiz: null });

  const [quizStudioState, setQuizStudioState] = useState<{
    isOpen: boolean;
    quiz: ApiQuizDetail | null;
    lesson: ApiLessonItem | null;
  }>({ isOpen: false, quiz: null, lesson: null });

  // Main Data Loader Effect
  useEffect(() => {
    if (!courseId) return;

    let isMounted = true;
    const controller = new AbortController();

    const fetchCurriculum = async () => {
      try {
        // 1. Fetch Course details
        const courseData = await courseService.getTeacherCourseById(courseId, { signal: controller.signal });
        if (!isMounted) return;
        setCourse(courseData);

        // 2. Fetch Chapters by Course
        const chaptersRes = await chapterService.getChaptersByCourse(courseId, { signal: controller.signal });
        if (!isMounted) return;

        const rawChapters = (chaptersRes?.data || []).filter((ch) => !ch._destroy);

        // 3. Enrich each chapter with full lesson details (including videoUrl, content, isDemo)
        const enrichedChapters: ApiChapterItem[] = await Promise.all(
          rawChapters.map(async (chap, idx) => {
            const chapId = chap.id || chap._id;
            if (!chapId) return chap;

            try {
              const lessonsRes = await lessonService.getLessonsByChapter(chapId, { signal: controller.signal });
              const fullLessons = lessonsRes?.data || [];
              return {
                ...chap,
                order: typeof chap.order === 'number' ? chap.order : idx + 1,
                lessons: fullLessons.length > 0 ? fullLessons : chap.lessons || [],
              };
            } catch {
              // Fallback to embedded lessons if individual chapter lesson lookup fails
              return {
                ...chap,
                order: typeof chap.order === 'number' ? chap.order : idx + 1,
              };
            }
          })
        );

        if (!isMounted) return;

        // Sort chapters by order
        enrichedChapters.sort((a, b) => (a.order || 0) - (b.order || 0));
        setChapters(enrichedChapters);

        // 4. Fetch Quizzes for all lessons in parallel
        const allLessons: ApiLessonItem[] = [];
        enrichedChapters.forEach((ch) => {
          (ch.lessons || []).forEach((l) => allLessons.push(l));
        });

        const quizzesMap: Record<string, ApiQuizDetail | null> = {};
        await Promise.all(
          allLessons.map(async (les) => {
            const lId = les.id || les._id;
            if (!lId) return;
            try {
              const qRes = await quizService.getQuizByLesson(lId, { signal: controller.signal });
              quizzesMap[lId] = qRes?.data && qRes.data.length > 0 ? qRes.data[0] : null;
            } catch {
              quizzesMap[lId] = null;
            }
          })
        );

        if (!isMounted) return;
        setLessonQuizzes(quizzesMap);

        // Automatically expand all chapters on initial load
        setExpandedChapters((prev) => {
          const next = { ...prev };
          enrichedChapters.forEach((ch) => {
            const id = ch.id || ch._id;
            if (id && next[id] === undefined) {
              next[id] = true;
            }
          });
          return next;
        });
      } catch (err: unknown) {
        if (!isMounted) return;
        setIsError(true);
        const msg = err instanceof Error ? err.message : 'Không thể tải giáo trình khóa học.';
        setErrorMessage(msg);
        toast.error(msg);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchCurriculum();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [courseId, reloadKey]);

  // Aggregate Metrics
  const { totalLessons, totalDurationSeconds, totalDemoLessons } = useMemo(() => {
    let lessonsCount = 0;
    let durationSecs = 0;
    let demoCount = 0;

    chapters.forEach((chap) => {
      (chap.lessons || []).forEach((l) => {
        lessonsCount += 1;
        durationSecs += l.duration || 0;
        if (l.isDemo) demoCount += 1;
      });
    });

    return {
      totalLessons: lessonsCount,
      totalDurationSeconds: durationSecs,
      totalDemoLessons: demoCount,
    };
  }, [chapters]);

  // Accordion Expand / Collapse controls
  const allExpanded = useMemo(() => {
    if (chapters.length === 0) return false;
    return chapters.every((ch) => {
      const id = ch.id || ch._id;
      return id ? Boolean(expandedChapters[id]) : false;
    });
  }, [chapters, expandedChapters]);

  const handleToggleExpand = (chapterId: string) => {
    setExpandedChapters((prev) => ({
      ...prev,
      [chapterId]: !prev[chapterId],
    }));
  };

  const handleToggleExpandAll = () => {
    const targetState = !allExpanded;
    const next: Record<string, boolean> = {};
    chapters.forEach((ch) => {
      const id = ch.id || ch._id;
      if (id) next[id] = targetState;
    });
    setExpandedChapters(next);
  };

  // Chapter Actions
  const handleOpenAddChapter = () => {
    setChapterModalState({ isOpen: true, chapter: null });
  };

  const handleOpenEditChapter = (chapter: ApiChapterItem) => {
    setChapterModalState({ isOpen: true, chapter });
  };

  const handleOpenDeleteChapter = (chapter: ApiChapterItem) => {
    setChapterDeleteState({ isOpen: true, chapter });
  };

  const handleChapterDeleted = (deletedId: string) => {
    setChapters((prev) => prev.filter((ch) => ch.id !== deletedId && ch._id !== deletedId));
    setReloadKey((prev) => prev + 1);
  };

  // Lesson Actions
  const handleOpenAddLesson = (chapter: ApiChapterItem) => {
    setLessonModalState({ isOpen: true, chapter, lesson: null });
  };

  const handleOpenEditLesson = (lesson: ApiLessonItem, chapter: ApiChapterItem) => {
    setLessonModalState({ isOpen: true, chapter, lesson });
  };

  const handleOpenDeleteLesson = (lesson: ApiLessonItem) => {
    setLessonDeleteState({ isOpen: true, lesson });
  };

  const handleLessonDeleted = (deletedLessonId: string) => {
    setChapters((prev) =>
      prev.map((ch) => ({
        ...ch,
        lessons: (ch.lessons || []).filter(
          (l) => l.id !== deletedLessonId && l._id !== deletedLessonId
        ),
      }))
    );
    setReloadKey((prev) => prev + 1);
  };

  const handleOpenPreviewVideo = (lesson: ApiLessonItem) => {
    setVideoPreviewState({ isOpen: true, lesson });
  };

  // Quiz Actions
  const handleCreateQuiz = (lesson: ApiLessonItem) => {
    setQuizModalState({ isOpen: true, lesson, quiz: null });
  };

  const handleOpenQuizStudio = (quiz: ApiQuizDetail, lesson: ApiLessonItem) => {
    setQuizStudioState({ isOpen: true, quiz, lesson });
  };

  const handleDeleteQuiz = (quiz: ApiQuizDetail, lesson: ApiLessonItem) => {
    setQuizDeleteState({ isOpen: true, quiz, lessonTitle: lesson.title });
  };

  const handleQuizSaved = (savedQuiz: ApiQuizDetail) => {
    const lId = savedQuiz.lesson;
    if (lId) {
      setLessonQuizzes((prev) => ({ ...prev, [lId]: savedQuiz }));
    }
    const currentTargetLesson = quizModalState.lesson;
    setQuizModalState({ isOpen: false, lesson: null, quiz: null });

    // Open Quiz Studio immediately so teacher can add questions
    if (currentTargetLesson) {
      setQuizStudioState({ isOpen: true, quiz: savedQuiz, lesson: currentTargetLesson });
    }
  };

  const handleQuizDeleted = (quizId: string) => {
    setLessonQuizzes((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((k) => {
        if (next[k]?.id === quizId || (next[k] as { _id?: string })?._id === quizId) {
          next[k] = null;
        }
      });
      return next;
    });
    setQuizDeleteState({ isOpen: false, quiz: null });
    setQuizStudioState({ isOpen: false, quiz: null, lesson: null });
  };

  const handleQuizUpdatedFromStudio = (updatedQuiz: ApiQuizDetail) => {
    const lId = updatedQuiz.lesson;
    if (lId) {
      setLessonQuizzes((prev) => ({ ...prev, [lId]: updatedQuiz }));
    }
    setQuizStudioState((prev) => ({ ...prev, quiz: updatedQuiz }));
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      {/* Header & Overview Banner */}
      <CurriculumHeader
        course={course}
        courseId={courseId}
        totalChapters={chapters.length}
        totalLessons={totalLessons}
        totalDurationSeconds={totalDurationSeconds}
        totalDemoLessons={totalDemoLessons}
        onAddChapter={handleOpenAddChapter}
        allExpanded={allExpanded}
        onToggleExpandAll={handleToggleExpandAll}
      />

      {/* Main Content Area */}
      {isLoading ? (
        // Loading Skeleton
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-[#eceaf3] dark:border-[#352e43] bg-white dark:bg-[#1d1926] p-6 space-y-4 shadow-xs animate-pulse"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-slate-200 dark:bg-slate-800 rounded-md" />
                  <div className="w-20 h-6 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                  <div className="w-48 h-5 bg-slate-200 dark:bg-slate-800 rounded-md" />
                </div>
                <div className="w-28 h-8 bg-slate-200 dark:bg-slate-800 rounded-xl" />
              </div>
              <div className="space-y-2 pt-2 border-t border-[#eceaf3] dark:border-[#352e43]">
                <div className="h-10 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
                <div className="h-10 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        // Error State
        <div className="rounded-2xl border border-rose-200 dark:border-rose-900 bg-white dark:bg-[#1d1926] p-10 text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 mx-auto flex items-center justify-center">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-[#1c192c] dark:text-[#f4eeff]">
            Không thể tải dữ liệu giáo trình
          </h2>
          <p className="text-xs sm:text-sm text-[#635a72] dark:text-[#a9a0b2] max-w-md mx-auto">
            {errorMessage || 'Khóa học không tồn tại hoặc bạn không có quyền truy cập khóa học này.'}
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setReloadKey((prev) => prev + 1)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#7240b8] hover:bg-[#5e3299] text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Thử lại</span>
            </button>
            <Link
              href="/teacher/courses"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#eceaf3] dark:border-[#352e43] text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Về danh sách khóa học</span>
            </Link>
          </div>
        </div>
      ) : chapters.length === 0 ? (
        // Empty State (No Chapters Yet)
        <div className="rounded-2xl border border-[#eceaf3] dark:border-[#352e43] bg-white dark:bg-[#1d1926] p-12 text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-[#f7f1ff] dark:bg-[#282234] text-[#7240b8] dark:text-[#a87ffb] mx-auto flex items-center justify-center">
            <Layers className="w-8 h-8" />
          </div>
          <h2 className="text-base sm:text-lg font-bold text-[#1c192c] dark:text-[#f4eeff]">
            Khóa học chưa có chương mục nào
          </h2>
          <p className="text-xs sm:text-sm text-[#635a72] dark:text-[#a9a0b2] max-w-md mx-auto leading-relaxed">
            Hãy bắt đầu xây dựng giáo trình bằng cách tạo Chương học đầu tiên (ví dụ: &quot;Chương 1: Khởi động và Giới thiệu tổng quan&quot;).
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={handleOpenAddChapter}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#7240b8] hover:bg-[#5e3299] text-white text-xs sm:text-sm font-semibold shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm chương học đầu tiên</span>
            </button>
          </div>
        </div>
      ) : (
        // Chapters Accordion List
        <div className="space-y-4">
          {chapters.map((chapter, idx) => {
            const chapId = chapter.id || chapter._id || `chap-${idx}`;
            const isExpanded = Boolean(expandedChapters[chapId]);

            return (
              <ChapterAccordionItem
                key={chapId}
                chapter={chapter}
                chapterIndex={idx}
                isExpanded={isExpanded}
                lessonQuizzes={lessonQuizzes}
                onToggleExpand={() => handleToggleExpand(chapId)}
                onEditChapter={handleOpenEditChapter}
                onDeleteChapter={handleOpenDeleteChapter}
                onAddLesson={handleOpenAddLesson}
                onEditLesson={handleOpenEditLesson}
                onDeleteLesson={handleOpenDeleteLesson}
                onPreviewVideo={handleOpenPreviewVideo}
                onOpenQuizStudio={handleOpenQuizStudio}
                onCreateQuiz={handleCreateQuiz}
                onDeleteQuiz={handleDeleteQuiz}
              />
            );
          })}
        </div>
      )}

      {/* Chapter Create / Edit Modal */}
      <ChapterModal
        courseId={courseId}
        chapter={chapterModalState.chapter}
        isOpen={chapterModalState.isOpen}
        onClose={() => setChapterModalState({ isOpen: false, chapter: null })}
        onSuccess={() => setReloadKey((prev) => prev + 1)}
        suggestedOrder={chapters.length + 1}
      />

      {/* Chapter Delete Confirmation Modal */}
      <ChapterDeleteModal
        chapter={chapterDeleteState.chapter}
        isOpen={chapterDeleteState.isOpen}
        onClose={() => setChapterDeleteState({ isOpen: false, chapter: null })}
        onDeleted={handleChapterDeleted}
      />

      {/* Lesson Create / Edit Modal */}
      <LessonModal
        courseId={courseId}
        chapterId={lessonModalState.chapter?.id || lessonModalState.chapter?._id || ''}
        chapterTitle={lessonModalState.chapter?.title}
        lesson={lessonModalState.lesson}
        isOpen={lessonModalState.isOpen}
        onClose={() => setLessonModalState({ isOpen: false, chapter: null, lesson: null })}
        onSuccess={() => setReloadKey((prev) => prev + 1)}
        suggestedOrder={(lessonModalState.chapter?.lessons?.length || 0) + 1}
      />

      {/* Lesson Delete Confirmation Modal */}
      <LessonDeleteModal
        lesson={lessonDeleteState.lesson}
        isOpen={lessonDeleteState.isOpen}
        onClose={() => setLessonDeleteState({ isOpen: false, lesson: null })}
        onDeleted={handleLessonDeleted}
      />

      {/* Video Quick Preview Modal */}
      <VideoPreviewModal
        lesson={videoPreviewState.lesson}
        isOpen={videoPreviewState.isOpen}
        onClose={() => setVideoPreviewState({ isOpen: false, lesson: null })}
      />

      {/* Quiz Create / Edit Settings Modal */}
      <QuizModal
        courseId={courseId}
        lessonId={quizModalState.lesson?.id || quizModalState.lesson?._id || ''}
        lessonTitle={quizModalState.lesson?.title}
        quiz={quizModalState.quiz}
        isOpen={quizModalState.isOpen}
        onClose={() => setQuizModalState({ isOpen: false, lesson: null, quiz: null })}
        onSuccess={handleQuizSaved}
      />

      {/* Quiz Delete Confirmation Modal */}
      <QuizDeleteModal
        quiz={quizDeleteState.quiz}
        lessonTitle={quizDeleteState.lessonTitle}
        isOpen={quizDeleteState.isOpen}
        onClose={() => setQuizDeleteState({ isOpen: false, quiz: null })}
        onDeleted={handleQuizDeleted}
      />

      {/* Quiz Studio Modal */}
      <QuizStudioModal
        courseId={courseId}
        quiz={quizStudioState.quiz}
        lessonId={quizStudioState.lesson?.id || quizStudioState.lesson?._id || ''}
        lessonTitle={quizStudioState.lesson?.title}
        isOpen={quizStudioState.isOpen}
        onClose={() => setQuizStudioState({ isOpen: false, quiz: null, lesson: null })}
        onQuizUpdated={handleQuizUpdatedFromStudio}
        onQuizDeleted={handleQuizDeleted}
      />
    </div>
  );
}
