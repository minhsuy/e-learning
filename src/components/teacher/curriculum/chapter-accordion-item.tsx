'use client';

import React from 'react';
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Edit,
  Trash2,
  FileVideo,
  FileText,
  PlayCircle,
  Clock,
  Sparkles,
  BookOpen,
  HelpCircle,
} from 'lucide-react';
import { ApiChapterItem } from '@/types/chapter';
import { ApiLessonItem } from '@/types/lesson';
import { ApiQuizDetail } from '@/types/quiz';

interface ChapterAccordionItemProps {
  chapter: ApiChapterItem;
  chapterIndex: number;
  isExpanded: boolean;
  lessonQuizzes?: Record<string, ApiQuizDetail | null>;
  onToggleExpand: () => void;
  onEditChapter: (chapter: ApiChapterItem) => void;
  onDeleteChapter: (chapter: ApiChapterItem) => void;
  onAddLesson: (chapter: ApiChapterItem) => void;
  onEditLesson: (lesson: ApiLessonItem, chapter: ApiChapterItem) => void;
  onDeleteLesson: (lesson: ApiLessonItem) => void;
  onPreviewVideo: (lesson: ApiLessonItem) => void;
  onOpenQuizStudio?: (quiz: ApiQuizDetail, lesson: ApiLessonItem) => void;
  onCreateQuiz?: (lesson: ApiLessonItem) => void;
  onDeleteQuiz?: (quiz: ApiQuizDetail, lesson: ApiLessonItem) => void;
}

function formatDuration(seconds?: number): string {
  if (!seconds || seconds <= 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function ChapterAccordionItem({
  chapter,
  chapterIndex,
  isExpanded,
  lessonQuizzes,
  onToggleExpand,
  onEditChapter,
  onDeleteChapter,
  onAddLesson,
  onEditLesson,
  onDeleteLesson,
  onPreviewVideo,
  onOpenQuizStudio,
  onCreateQuiz,
  onDeleteQuiz,
}: ChapterAccordionItemProps) {
  const lessons = chapter.lessons || [];
  const lessonCount = lessons.length;

  const totalSeconds = lessons.reduce((sum, l) => sum + (l.duration || 0), 0);
  const totalMins = Math.floor(totalSeconds / 60);

  return (
    <div className="rounded-2xl border border-[#eceaf3] dark:border-[#352e43] bg-white dark:bg-[#1d1926] shadow-xs overflow-hidden transition-all">
      {/* Chapter Header */}
      <div
        className={`p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 cursor-pointer select-none transition-colors ${
          isExpanded
            ? 'bg-[#f7f1ff]/60 dark:bg-[#282234]/60 border-b border-[#eceaf3] dark:border-[#352e43]'
            : 'hover:bg-[#f7f1ff]/30 dark:hover:bg-[#282234]/30'
        }`}
        onClick={onToggleExpand}
      >
        {/* Left: Expand Chevron, Order Badge & Title */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button
            type="button"
            className="p-1 rounded-lg text-slate-400 hover:text-[#7240b8] dark:hover:text-[#a87ffb] transition-colors"
            aria-label={isExpanded ? 'Thu gọn chương' : 'Mở rộng chương'}
          >
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-[#7240b8] dark:text-[#a87ffb]" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>

          <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-[#f7f1ff] dark:bg-[#282234] text-[#7240b8] dark:text-[#a87ffb] border border-[#eceaf3] dark:border-[#352e43] shrink-0">
            Chương {chapter.order || chapterIndex + 1}
          </span>

          <div className="min-w-0 flex-1">
            <h2 className="text-sm sm:text-base font-bold text-[#1c192c] dark:text-[#f4eeff] truncate">
              {chapter.title}
            </h2>
            <div className="flex items-center gap-3 text-xs text-[#635a72] dark:text-[#a9a0b2] mt-0.5">
              <span>{lessonCount} bài học</span>
              {totalSeconds > 0 && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{totalMins > 0 ? `${totalMins} phút` : `${totalSeconds} giây`}</span>
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div
          className="flex items-center gap-2 self-end sm:self-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Add Lesson Button */}
          <button
            type="button"
            onClick={() => onAddLesson(chapter)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#f7f1ff] dark:bg-[#282234] hover:bg-[#ede5fa] dark:hover:bg-[#352c48] text-[#7240b8] dark:text-[#a87ffb] text-xs font-semibold border border-[#eceaf3] dark:border-[#352e43] transition-colors"
            title="Thêm bài học mới vào chương này"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Thêm bài học</span>
          </button>

          {/* Edit Chapter */}
          <button
            type="button"
            onClick={() => onEditChapter(chapter)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-[#7240b8] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Sửa tên chương"
            aria-label={`Sửa tên chương ${chapter.title}`}
          >
            <Edit className="w-4 h-4" />
          </button>

          {/* Delete Chapter */}
          <button
            type="button"
            onClick={() => onDeleteChapter(chapter)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            title="Xóa chương học"
            aria-label={`Xóa chương ${chapter.title}`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Accordion Body: Lessons List */}
      {isExpanded && (
        <div className="p-4 sm:p-5 bg-white dark:bg-[#1d1926]">
          {lessonCount === 0 ? (
            <div className="p-8 text-center rounded-xl border border-dashed border-[#eceaf3] dark:border-[#352e43] bg-[#fdf8ff] dark:bg-[#252030] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#f7f1ff] dark:bg-[#282234] text-[#7240b8] dark:text-[#a87ffb] mx-auto flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
              <p className="text-xs sm:text-sm font-medium text-[#635a72] dark:text-[#a9a0b2]">
                Chưa có bài học nào trong chương này.
              </p>
              <button
                type="button"
                onClick={() => onAddLesson(chapter)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#7240b8] hover:bg-[#5e3299] text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm bài học đầu tiên</span>
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[#eceaf3] dark:divide-[#352e43] border border-[#eceaf3] dark:border-[#352e43] rounded-xl overflow-hidden">
              {lessons.map((lesson, lIdx) => {
                const lessonId = lesson.id || lesson._id || `lesson-${lIdx}`;
                const isVideo = (lesson.type || 'video').toLowerCase() === 'video';
                const hasVideoUrl = Boolean(lesson.videoUrl && lesson.videoUrl.trim());

                return (
                  <div
                    key={lessonId}
                    className="p-3 sm:p-4 flex items-center justify-between gap-3 hover:bg-[#f7f1ff]/40 dark:hover:bg-[#252030] transition-colors group"
                  >
                    {/* Left: Icon, Number & Title */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-lg bg-[#f7f1ff] dark:bg-[#282234] text-[#7240b8] dark:text-[#a87ffb] flex items-center justify-center shrink-0">
                        {isVideo ? <FileVideo className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                      </div>

                      <span className="text-xs font-mono font-semibold text-[#635a72] dark:text-[#a9a0b2] shrink-0">
                        {chapter.order || chapterIndex + 1}.{lesson.order || lIdx + 1}
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs sm:text-sm font-semibold text-[#1c192c] dark:text-[#f4eeff] truncate">
                            {lesson.title}
                          </span>

                          {lesson.isDemo && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                              <Sparkles className="w-3 h-3" />
                              <span>Học thử</span>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-[#635a72] dark:text-[#a9a0b2] mt-0.5">
                          <span className="capitalize">{isVideo ? 'Video' : 'Tài liệu'}</span>
                          <span>•</span>
                          <span>{formatDuration(lesson.duration)}</span>
                          {hasVideoUrl && (
                            <>
                              <span>•</span>
                              <span className="text-[#7240b8] dark:text-[#a87ffb] font-medium truncate max-w-xs">
                                Video sẵn sàng
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Quiz indicator / action */}
                      {(() => {
                        const quiz = lessonId && lessonQuizzes ? lessonQuizzes[lessonId] : null;
                        if (quiz) {
                          const qCount = quiz.questions?.length || 0;
                          return (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => onOpenQuizStudio?.(quiz, lesson)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-violet-50 text-[#7240b8] dark:bg-violet-950/70 dark:text-[#a87ffb] hover:bg-violet-100 dark:hover:bg-violet-900/60 border border-violet-200 dark:border-violet-800 transition-colors"
                                title="Mở Quiz Studio để quản lý câu hỏi"
                              >
                                <HelpCircle className="w-3.5 h-3.5 text-[#7240b8] dark:text-[#a87ffb]" />
                                <span>Quiz ({qCount} câu)</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => onDeleteQuiz?.(quiz, lesson)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                                title="Xóa bài kiểm tra này"
                                aria-label={`Xóa bài kiểm tra ${quiz.title}`}
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-500/80 hover:text-rose-600" />
                              </button>
                            </div>
                          );
                        }

                        return (
                          <button
                            type="button"
                            onClick={() => onCreateQuiz?.(lesson)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-500 hover:text-[#7240b8] dark:text-slate-400 dark:hover:text-[#a87ffb] hover:bg-[#f7f1ff] dark:hover:bg-[#282234] border border-dashed border-slate-300 dark:border-slate-700 hover:border-violet-300 transition-colors shrink-0"
                            title="Tạo bài kiểm tra (Quiz) cho bài học này"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Tạo Quiz</span>
                          </button>
                        );
                      })()}

                      <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-0.5 shrink-0" />

                      {/* Video Preview */}
                      {hasVideoUrl && (
                        <button
                          type="button"
                          onClick={() => onPreviewVideo(lesson)}
                          className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                          title="Xem trước video bài học"
                          aria-label={`Xem trước video bài học ${lesson.title}`}
                        >
                          <PlayCircle className="w-4 h-4" />
                        </button>
                      )}

                      {/* Edit Lesson */}
                      <button
                        type="button"
                        onClick={() => onEditLesson(lesson, chapter)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-[#7240b8] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Chỉnh sửa bài học"
                        aria-label={`Chỉnh sửa bài học ${lesson.title}`}
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      {/* Delete Lesson */}
                      <button
                        type="button"
                        onClick={() => onDeleteLesson(lesson)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Xóa bài học"
                        aria-label={`Xóa bài học ${lesson.title}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
