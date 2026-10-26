'use client';

import React from 'react';
import Link from 'next/link';
import {
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { TeacherCoursePerformanceQuizzes } from '@/types/teacher-statistics';

interface PerformanceQuizAnalyticsProps {
  quizzes?: TeacherCoursePerformanceQuizzes | null;
  courseId: string;
  isLoading?: boolean;
}

export function PerformanceQuizAnalytics({
  quizzes,
  courseId,
  isLoading = false,
}: PerformanceQuizAnalyticsProps) {
  if (isLoading) {
    return (
      <div className="rounded-2xl bg-white dark:bg-[#1d1926] border border-[#eceaf3] dark:border-[#352e43] p-5 shadow-xs space-y-4 animate-pulse">
        <div className="h-5 w-48 bg-slate-100 dark:bg-slate-800 rounded" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-slate-50 dark:bg-slate-850 rounded-xl" />
          ))}
        </div>
        <div className="h-40 bg-slate-50 dark:bg-slate-850 rounded-xl" />
      </div>
    );
  }

  const summary = quizzes?.summary;
  const items = quizzes?.items || [];

  const totalQuizzes = summary?.totalQuizzes || 0;
  const totalSubmissions = summary?.totalSubmissions || 0;
  const averageScore = summary?.averageScore || 0;
  const passRate = summary?.passRate || 0;

  return (
    <div className="rounded-2xl bg-white dark:bg-[#1d1926] border border-[#eceaf3] dark:border-[#352e43] p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#eceaf3] dark:border-[#352e43]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-[#7240b8] dark:text-[#a87ffb]">
            <HelpCircle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#1c192c] dark:text-[#f4eeff]">
              Hiệu suất Kiểm tra &amp; Đánh giá (Quiz Analytics)
            </h3>
            <p className="text-xs text-[#635a72] dark:text-[#a9a0b2]">
              Thống kê lượt làm bài, điểm trung bình và tỷ lệ vượt qua bài kiểm tra
            </p>
          </div>
        </div>

        {totalQuizzes > 0 && (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-violet-50 dark:bg-violet-950/40 text-[#7240b8] dark:text-[#a87ffb] border border-violet-100 dark:border-violet-900/40 self-start sm:self-auto">
            {totalQuizzes} bài kiểm tra
          </span>
        )}
      </div>

      {/* Summary KPI Mini Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-[#fbf9fe] dark:bg-[#252030] border border-[#eceaf3] dark:border-[#352e43]">
          <span className="text-[11px] text-[#635a72] dark:text-[#a9a0b2] block">
            Tổng bài kiểm tra
          </span>
          <div className="text-lg font-bold text-[#1c192c] dark:text-[#f4eeff] mt-0.5">
            {totalQuizzes}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[#fbf9fe] dark:bg-[#252030] border border-[#eceaf3] dark:border-[#352e43]">
          <span className="text-[11px] text-[#635a72] dark:text-[#a9a0b2] block">
            Tổng lượt nộp bài
          </span>
          <div className="text-lg font-bold text-[#1c192c] dark:text-[#f4eeff] mt-0.5">
            {totalSubmissions}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[#fbf9fe] dark:bg-[#252030] border border-[#eceaf3] dark:border-[#352e43]">
          <span className="text-[11px] text-[#635a72] dark:text-[#a9a0b2] block">
            Điểm số trung bình
          </span>
          <div className="text-lg font-bold text-[#7240b8] dark:text-[#a87ffb] mt-0.5">
            {averageScore > 0 ? averageScore.toFixed(1) : '0'}/100
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[#fbf9fe] dark:bg-[#252030] border border-[#eceaf3] dark:border-[#352e43]">
          <span className="text-[11px] text-[#635a72] dark:text-[#a9a0b2] block">
            Tỷ lệ đạt (Pass Rate)
          </span>
          <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
            {passRate}%
          </div>
        </div>
      </div>

      {/* Quizzes Table or Empty State */}
      {items.length === 0 ? (
        <div className="text-center py-10 px-4 border border-dashed border-[#eceaf3] dark:border-[#352e43] rounded-xl">
          <HelpCircle className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
          <p className="text-xs font-semibold text-[#1c192c] dark:text-[#f4eeff]">
            Khóa học chưa có bài kiểm tra trắc nghiệm
          </p>
          <p className="text-xs text-[#635a72] dark:text-[#a9a0b2] mt-1 max-w-sm mx-auto">
            Bạn có thể tạo bài kiểm tra và câu hỏi trắc nghiệm trong phần Giáo trình để đánh giá kiến thức của học viên.
          </p>
          <Link
            href={`/teacher/courses/${encodeURIComponent(courseId)}/curriculum`}
            className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-xl bg-[#7240b8] hover:bg-[#60359d] text-white text-xs font-semibold transition-colors"
          >
            <span>Đến trình soạn giáo trình</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#eceaf3] dark:border-[#352e43]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#fbf9fe] dark:bg-[#252030] text-[#635a72] dark:text-[#a9a0b2] border-b border-[#eceaf3] dark:border-[#352e43]">
              <tr>
                <th className="py-2.5 px-3 font-semibold">Tên bài kiểm tra &amp; Bài học</th>
                <th className="py-2.5 px-3 font-semibold w-24 text-center">Số câu hỏi</th>
                <th className="py-2.5 px-3 font-semibold w-28 text-center">Điểm chuẩn đạt</th>
                <th className="py-2.5 px-3 font-semibold w-28 text-center">Lượt nộp</th>
                <th className="py-2.5 px-3 font-semibold w-32 text-center">Điểm TB</th>
                <th className="py-2.5 px-3 font-semibold w-40">Tỷ lệ đạt (Pass Rate)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eceaf3] dark:divide-[#352e43]">
              {items.map((quiz) => {
                const passColor =
                  quiz.passRate >= 70
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : quiz.passRate >= 40
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-rose-600 dark:text-rose-400';

                const progressBg =
                  quiz.passRate >= 70
                    ? 'bg-emerald-500'
                    : quiz.passRate >= 40
                    ? 'bg-amber-500'
                    : 'bg-rose-500';

                return (
                  <tr
                    key={quiz.quizId}
                    className="hover:bg-violet-50/30 dark:hover:bg-[#252030]/50 transition-colors"
                  >
                    {/* Title */}
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-[#1c192c] dark:text-[#f4eeff]">
                        {quiz.title}
                      </div>
                      <div className="text-[11px] text-[#635a72] dark:text-[#a9a0b2] mt-0.5">
                        Thuộc bài: {quiz.lessonTitle}
                      </div>
                    </td>

                    {/* Questions */}
                    <td className="py-2.5 px-3 text-center">
                      <span className="font-medium text-[#1c192c] dark:text-[#f4eeff]">
                        {quiz.totalQuestions} câu
                      </span>
                    </td>

                    {/* Passing Grade */}
                    <td className="py-2.5 px-3 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {quiz.passingGrade}%
                      </span>
                    </td>

                    {/* Submissions */}
                    <td className="py-2.5 px-3 text-center">
                      <span className="font-bold text-[#1c192c] dark:text-[#f4eeff]">
                        {quiz.submissionsCount}
                      </span>
                      <span className="text-[11px] text-[#635a72] dark:text-[#a9a0b2]"> lượt</span>
                    </td>

                    {/* Average Score */}
                    <td className="py-2.5 px-3 text-center">
                      <span className="font-bold text-[#7240b8] dark:text-[#a87ffb]">
                        {quiz.averageScore > 0 ? quiz.averageScore.toFixed(1) : '0'}/100
                      </span>
                    </td>

                    {/* Pass Rate Bar */}
                    <td className="py-2.5 px-3">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className={`font-bold ${passColor}`}>
                            {quiz.passRate}%
                          </span>
                          <span className="text-[#635a72] dark:text-[#a9a0b2]">
                            ({quiz.passCount}/{quiz.submissionsCount} đạt)
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${progressBg}`}
                            style={{ width: `${Math.min(100, Math.max(0, quiz.passRate))}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
