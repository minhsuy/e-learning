'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Mail,
  Calendar,
  BookOpen,
  Award,
  Hash,
  AlertCircle,
  UserX,
  CheckCircle2,
  FileText,
  Clock,
  RefreshCw,
  GraduationCap,
  Check,
  XCircle,
} from 'lucide-react';
import {
  CourseStudentItem,
  StudentLearningProgressData,
} from '@/types/enrollment';
import { enrollmentService } from '@/services/enrollment.service';
import { StudentStatusBadge } from './student-status-badge';
import { AppApiError } from '@/types/api';

interface StudentDetailModalProps {
  isOpen: boolean;
  student: CourseStudentItem | null;
  courseId?: string;
  courseTitle?: string;
  onClose: () => void;
  onRequestRemove?: (student: CourseStudentItem) => void;
}

export function StudentDetailModal({
  isOpen,
  student,
  courseId,
  courseTitle,
  onClose,
  onRequestRemove,
}: StudentDetailModalProps) {
  const [progressData, setProgressData] = useState<StudentLearningProgressData | null>(null);
  const [isLoadingProgress, setIsLoadingProgress] = useState<boolean>(true);
  const [isProgressError, setIsProgressError] = useState<boolean>(false);
  const [progressErrorMessage, setProgressErrorMessage] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'overview' | 'lessons' | 'quizzes'>('overview');
  const [reloadKey, setReloadKey] = useState<number>(0);

  const targetUserId = student?.userId || student?.user?.id || student?.user?._id || '';
  const effectiveCourseId = courseId || student?.courseId || '';

  // Fetch student detailed progress
  useEffect(() => {
    if (!isOpen || !student || !effectiveCourseId || !targetUserId) {
      return;
    }

    let isMounted = true;
    const controller = new AbortController();

    const fetchProgress = async () => {
      try {
        const res = await enrollmentService.getStudentProgress(effectiveCourseId, targetUserId, {
          signal: controller.signal,
        });
        if (isMounted && res?.data) {
          setProgressData(res.data);
          setIsProgressError(false);
          setProgressErrorMessage('');
        }
      } catch (err: unknown) {
        if (!isMounted || controller.signal.aborted) return;
        setIsProgressError(true);
        if (err instanceof AppApiError) {
          if (err.statusCode === 403) {
            setProgressErrorMessage('Bạn không có quyền xem chi tiết tiến độ học tập của học viên này.');
          } else if (err.statusCode === 404) {
            setProgressErrorMessage('Không tìm thấy thông tin ghi danh của học viên.');
          } else {
            setProgressErrorMessage(err.message);
          }
        } else if (err instanceof Error) {
          setProgressErrorMessage(err.message);
        } else {
          setProgressErrorMessage('Không thể tải tiến độ học tập chi tiết của học viên.');
        }
      } finally {
        if (isMounted && !controller.signal.aborted) {
          setIsLoadingProgress(false);
        }
      }
    };

    fetchProgress();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [isOpen, student, effectiveCourseId, targetUserId, reloadKey]);

  const handleRetry = () => {
    setIsLoadingProgress(true);
    setReloadKey((prev) => prev + 1);
  };

  if (!isOpen || !student) return null;

  const username = student.user?.username || 'Học viên';
  const email = student.user?.email || 'Chưa cung cấp email';
  const avatar = student.user?.avatar;
  const progress =
    typeof progressData?.enrollment?.progress === 'number'
      ? progressData.enrollment.progress
      : typeof student.progress === 'number'
      ? student.progress
      : 0;
  const enrollmentStatus = progressData?.enrollment?.status || student.status;
  const enrollmentId = progressData?.enrollment?.id || student.id || student._id || 'N/A';

  const completedLessons = progressData?.completedLessons || [];
  const quizSubmissions = progressData?.quizSubmissions || [];

  // Format enrolled date
  let formattedEnrolledDate = 'Không rõ';
  const enrolledAtDate = progressData?.enrollment?.enrolledAt || student.enrolledAt || student.createdAt;
  if (enrolledAtDate) {
    try {
      const d = new Date(enrolledAtDate);
      formattedEnrolledDate = new Intl.DateTimeFormat('vi-VN', {
        dateStyle: 'full',
        timeStyle: 'short',
      }).format(d);
    } catch {
      formattedEnrolledDate = enrolledAtDate;
    }
  }

  // Format completed date (if finished course)
  let formattedCompletedDate: string | null = null;
  if (progressData?.enrollment?.completedAt) {
    try {
      const d = new Date(progressData.enrollment.completedAt);
      formattedCompletedDate = new Intl.DateTimeFormat('vi-VN', {
        dateStyle: 'full',
        timeStyle: 'short',
      }).format(d);
    } catch {
      formattedCompletedDate = progressData.enrollment.completedAt;
    }
  }

  // Progress Bar styling
  const progressColor =
    progress >= 80
      ? 'bg-emerald-500'
      : progress >= 40
      ? 'bg-[#7240b8] dark:bg-[#a87ffb]'
      : 'bg-amber-500';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-2xl rounded-2xl border border-[#eceaf3] dark:border-[#352e43] bg-white dark:bg-[#1d1926] p-5 sm:p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="student-detail-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-3 border-b border-[#eceaf3] dark:border-[#352e43] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#f7f1ff] dark:bg-[#282234] text-[#7240b8] dark:text-[#a87ffb] flex items-center justify-center shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="student-detail-modal-title"
                className="text-base font-bold text-[#1c192c] dark:text-[#f4eeff]"
              >
                Hồ sơ & Tiến độ học viên
              </h2>
              <p className="text-xs text-[#635a72] dark:text-[#a9a0b2] mt-0.5">
                Chi tiết hồ sơ, danh sách bài học đã hoàn thành và điểm số bài kiểm tra Quiz
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Đóng dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation Bar */}
        <div className="flex items-center gap-1.5 p-1 bg-[#f7f1ff]/70 dark:bg-[#252030] rounded-xl border border-[#eceaf3] dark:border-[#352e43] text-xs font-semibold shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg transition-all ${
              activeTab === 'overview'
                ? 'bg-white dark:bg-[#1d1926] text-[#7240b8] dark:text-[#a87ffb] shadow-xs'
                : 'text-[#635a72] dark:text-[#a9a0b2] hover:text-[#1c192c] dark:hover:text-[#f4eeff]'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Tổng quan hồ sơ</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('lessons')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg transition-all ${
              activeTab === 'lessons'
                ? 'bg-white dark:bg-[#1d1926] text-[#7240b8] dark:text-[#a87ffb] shadow-xs'
                : 'text-[#635a72] dark:text-[#a9a0b2] hover:text-[#1c192c] dark:hover:text-[#f4eeff]'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Bài học đã xong</span>
            {!isLoadingProgress && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#eceaf3] dark:bg-[#352e43] text-[#7240b8] dark:text-[#a87ffb]">
                {completedLessons.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('quizzes')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg transition-all ${
              activeTab === 'quizzes'
                ? 'bg-white dark:bg-[#1d1926] text-[#7240b8] dark:text-[#a87ffb] shadow-xs'
                : 'text-[#635a72] dark:text-[#a9a0b2] hover:text-[#1c192c] dark:hover:text-[#f4eeff]'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5 text-[#7240b8] dark:text-[#a87ffb]" />
            <span>Kết quả Quiz</span>
            {!isLoadingProgress && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#eceaf3] dark:bg-[#352e43] text-[#7240b8] dark:text-[#a87ffb]">
                {quizSubmissions.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab Contents Area */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Error Banner */}
          {isProgressError && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center justify-between gap-3 text-xs text-rose-700 dark:text-rose-300">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                <span>{progressErrorMessage || 'Đã có lỗi xảy ra khi nạp chi tiết tiến độ học tập.'}</span>
              </div>
              <button
                type="button"
                onClick={handleRetry}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-[11px] shrink-0 transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Thử lại</span>
              </button>
            </div>
          )}

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Student Profile Card */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-[#fdf8ff] dark:bg-[#252030] border border-[#eceaf3] dark:border-[#352e43]">
                <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-[#f0e6ff] dark:bg-[#342a45] text-[#7240b8] dark:text-[#c4a4fc] flex items-center justify-center font-bold text-lg shrink-0 border border-[#e2d5f8] dark:border-[#4d3c67]">
                  {avatar ? (
                    <img
                      src={avatar}
                      alt={username}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    username.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-bold text-[#1c192c] dark:text-[#f4eeff] truncate">
                      {username}
                    </h3>
                    <StudentStatusBadge status={enrollmentStatus} />
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-[#635a72] dark:text-[#a9a0b2]">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{email}</span>
                  </div>
                </div>
              </div>

              {/* 3-Metric Summary Grid */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#221c2d] border border-slate-100 dark:border-[#2e263d]">
                  <p className="text-[11px] text-[#635a72] dark:text-[#a9a0b2]">Tiến độ</p>
                  <p className="text-base sm:text-lg font-bold text-[#7240b8] dark:text-[#a87ffb] mt-0.5">
                    {progress}%
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#221c2d] border border-slate-100 dark:border-[#2e263d]">
                  <p className="text-[11px] text-[#635a72] dark:text-[#a9a0b2]">Bài hoàn thành</p>
                  <p className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {isLoadingProgress ? '...' : completedLessons.length}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#221c2d] border border-slate-100 dark:border-[#2e263d]">
                  <p className="text-[11px] text-[#635a72] dark:text-[#a9a0b2]">Bài Quiz đã thi</p>
                  <p className="text-base sm:text-lg font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                    {isLoadingProgress ? '...' : quizSubmissions.length}
                  </p>
                </div>
              </div>

              {/* Detailed Info Grid */}
              <div className="space-y-2.5 text-xs">
                {/* Course Name */}
                {courseTitle && (
                  <div className="flex items-start justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-[#221c2d] border border-slate-100 dark:border-[#2e263d]">
                    <div className="flex items-center gap-2 text-[#635a72] dark:text-[#a9a0b2]">
                      <BookOpen className="w-4 h-4 text-[#7240b8] dark:text-[#a87ffb]" />
                      <span>Khóa học:</span>
                    </div>
                    <span className="font-semibold text-right text-[#1c192c] dark:text-[#f4eeff] max-w-[280px]">
                      {courseTitle}
                    </span>
                  </div>
                )}

                {/* Enrolled Date */}
                <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-[#221c2d] border border-slate-100 dark:border-[#2e263d]">
                  <div className="flex items-center gap-2 text-[#635a72] dark:text-[#a9a0b2]">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>Thời điểm đăng ký:</span>
                  </div>
                  <span className="font-medium text-right text-slate-800 dark:text-slate-200">
                    {formattedEnrolledDate}
                  </span>
                </div>

                {/* Completed Date (if any) */}
                {formattedCompletedDate && (
                  <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
                    <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>Thời điểm hoàn thành:</span>
                    </div>
                    <span className="font-semibold text-right text-emerald-800 dark:text-emerald-200">
                      {formattedCompletedDate}
                    </span>
                  </div>
                )}

                {/* User ID */}
                <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-[#221c2d] border border-slate-100 dark:border-[#2e263d]">
                  <div className="flex items-center gap-2 text-[#635a72] dark:text-[#a9a0b2]">
                    <Hash className="w-4 h-4 text-slate-400" />
                    <span>Mã học viên (User ID):</span>
                  </div>
                  <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400 truncate max-w-[240px]">
                    {targetUserId}
                  </span>
                </div>

                {/* Enrollment Record ID */}
                <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-[#221c2d] border border-slate-100 dark:border-[#2e263d]">
                  <div className="flex items-center gap-2 text-[#635a72] dark:text-[#a9a0b2]">
                    <Hash className="w-4 h-4 text-slate-400" />
                    <span>Mã ghi danh:</span>
                  </div>
                  <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400 truncate max-w-[240px]">
                    {enrollmentId}
                  </span>
                </div>

                {/* Progress Bar Section */}
                <div className="p-3.5 rounded-xl bg-[#f7f1ff]/60 dark:bg-[#261f33] border border-[#eceaf3] dark:border-[#352e43] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-semibold text-xs text-[#1c192c] dark:text-[#f4eeff]">
                      <Award className="w-4 h-4 text-[#7240b8] dark:text-[#a87ffb]" />
                      <span>Tiến độ hoàn thành khóa học</span>
                    </div>
                    <span className="font-bold text-xs text-[#7240b8] dark:text-[#a87ffb]">
                      {progress}%
                    </span>
                  </div>

                  <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${progressColor}`}
                      style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                    />
                  </div>

                  <p className="text-[11px] text-[#635a72] dark:text-[#a9a0b2]">
                    {progress >= 100
                      ? 'Học viên đã hoàn thành toàn bộ nội dung của khóa học này.'
                      : progress > 0
                      ? `Học viên đã hoàn thành ${completedLessons.length} bài học và đang tiếp tục học tập.`
                      : 'Học viên chưa bắt đầu xem bài học nào trong khóa học này.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: COMPLETED LESSONS */}
          {activeTab === 'lessons' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between text-xs text-[#635a72] dark:text-[#a9a0b2]">
                <span className="font-medium">
                  Tổng số bài học đã hoàn thành:{' '}
                  <strong className="text-emerald-600 dark:text-emerald-400">
                    {completedLessons.length}
                  </strong>
                </span>
              </div>

              {isLoadingProgress ? (
                <div className="space-y-2 animate-pulse py-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-12 rounded-xl bg-slate-100 dark:bg-[#252030] border border-slate-200/50 dark:border-slate-800"
                    />
                  ))}
                </div>
              ) : completedLessons.length === 0 ? (
                <div className="py-12 px-4 text-center space-y-3 bg-[#fdf8ff] dark:bg-[#252030] rounded-2xl border border-dashed border-[#eceaf3] dark:border-[#352e43]">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-[#1c192c] dark:text-[#f4eeff]">
                      Chưa hoàn thành bài học nào
                    </h4>
                    <p className="text-xs text-[#635a72] dark:text-[#a9a0b2] max-w-sm mx-auto">
                      Học viên chưa xem hoặc chưa đánh dấu hoàn thành bài học nào trong khóa học này.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {completedLessons.map((lesson, idx) => {
                    let formattedLessonDate = 'N/A';
                    if (lesson.completedAt) {
                      try {
                        const d = new Date(lesson.completedAt);
                        formattedLessonDate = new Intl.DateTimeFormat('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        }).format(d);
                      } catch {
                        formattedLessonDate = lesson.completedAt;
                      }
                    }

                    return (
                      <div
                        key={lesson.id || lesson.lessonId || idx}
                        className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-[#1d1926] border border-[#eceaf3] dark:border-[#352e43] hover:border-[#7240b8]/30 transition-all text-xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                            <Check className="w-4 h-4 stroke-[3]" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-[#1c192c] dark:text-[#f4eeff] truncate">
                              {lesson.title || `Bài học #${idx + 1}`}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono truncate">
                              ID: {lesson.lessonId}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 shrink-0 text-[11px]">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{formattedLessonDate}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: QUIZ SUBMISSIONS */}
          {activeTab === 'quizzes' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between text-xs text-[#635a72] dark:text-[#a9a0b2]">
                <span className="font-medium">
                  Tổng số bài kiểm tra đã làm:{' '}
                  <strong className="text-[#7240b8] dark:text-[#a87ffb]">
                    {quizSubmissions.length}
                  </strong>
                </span>
              </div>

              {isLoadingProgress ? (
                <div className="space-y-2 animate-pulse py-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-16 rounded-xl bg-slate-100 dark:bg-[#252030] border border-slate-200/50 dark:border-slate-800"
                    />
                  ))}
                </div>
              ) : quizSubmissions.length === 0 ? (
                <div className="py-12 px-4 text-center space-y-3 bg-[#fdf8ff] dark:bg-[#252030] rounded-2xl border border-dashed border-[#eceaf3] dark:border-[#352e43]">
                  <div className="w-12 h-12 rounded-2xl bg-[#f7f1ff] dark:bg-[#282234] text-[#7240b8] dark:text-[#a87ffb] flex items-center justify-center mx-auto">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-[#1c192c] dark:text-[#f4eeff]">
                      Chưa nộp bài kiểm tra nào
                    </h4>
                    <p className="text-xs text-[#635a72] dark:text-[#a9a0b2] max-w-sm mx-auto">
                      Học viên này chưa tham gia nộp bài kiểm tra Quiz nào trong các chương học của khóa học.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {quizSubmissions.map((sub, idx) => {
                    let formattedSubDate = 'N/A';
                    if (sub.submittedAt) {
                      try {
                        const d = new Date(sub.submittedAt);
                        formattedSubDate = new Intl.DateTimeFormat('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        }).format(d);
                      } catch {
                        formattedSubDate = sub.submittedAt;
                      }
                    }

                    const isPassed = !!sub.passed;
                    const maxScore = typeof sub.maxScore === 'number' && sub.maxScore > 0 ? sub.maxScore : 10;
                    const score = typeof sub.score === 'number' ? sub.score : 0;
                    const percent = Math.round((score / maxScore) * 100);

                    return (
                      <div
                        key={sub.id || sub.quizId || idx}
                        className="p-3.5 rounded-xl bg-white dark:bg-[#1d1926] border border-[#eceaf3] dark:border-[#352e43] hover:border-[#7240b8]/30 transition-all text-xs space-y-2"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-[#f7f1ff] dark:bg-[#282234] text-[#7240b8] dark:text-[#a87ffb] flex items-center justify-center shrink-0 mt-0.5">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-[#1c192c] dark:text-[#f4eeff]">
                                {sub.quizTitle || `Bài Quiz #${idx + 1}`}
                              </p>
                              <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mt-0.5">
                                <Clock className="w-3 h-3 shrink-0" />
                                <span>Nộp lúc: {formattedSubDate}</span>
                              </div>
                            </div>
                          </div>

                          {/* Pass/Fail Badge */}
                          <div className="shrink-0">
                            {isPassed ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40">
                                <Check className="w-3 h-3 stroke-[3]" />
                                <span>Đạt ({percent}%)</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40">
                                <XCircle className="w-3 h-3" />
                                <span>Chưa đạt ({percent}%)</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Score Indicator */}
                        <div className="flex items-center justify-between pt-1 border-t border-[#eceaf3]/60 dark:border-[#352e43]/60 text-[11px]">
                          <span className="text-slate-500 dark:text-slate-400">
                            Điểm số đạt được:
                          </span>
                          <span className="font-bold text-[#1c192c] dark:text-[#f4eeff]">
                            <strong className="text-base text-[#7240b8] dark:text-[#a87ffb]">
                              {score}
                            </strong>{' '}
                            / {maxScore} điểm
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#eceaf3] dark:border-[#352e43] shrink-0">
          {onRequestRemove ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onRequestRemove(student);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            >
              <UserX className="w-3.5 h-3.5" />
              <span>Gỡ học viên này</span>
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
