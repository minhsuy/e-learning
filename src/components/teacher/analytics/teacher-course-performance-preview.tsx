'use client';

import React from 'react';
import Link from 'next/link';
import {
  Target,
  ExternalLink,
  AlertCircle,
  ShieldAlert,
  RotateCcw,
  Star,
  Award,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';
import { TeacherCoursePerformanceData } from '@/types/teacher-statistics';
import { formatTeacherVND } from '@/lib/teacher-analytics';
import { TeacherCourseOption } from './teacher-analytics-filter-bar';

interface TeacherCoursePerformancePreviewProps {
  courses: TeacherCourseOption[];
  selectedCourseId: string;
  onSelectCourse: (courseId: string) => void;
  data: TeacherCoursePerformanceData | null;
  loading: boolean;
  error: { statusCode: number | null; message: string } | null;
  onRetry: () => void;
}

function fmt(n: number | undefined): string {
  return new Intl.NumberFormat('vi-VN').format(n ?? 0);
}

export function TeacherCoursePerformancePreview({
  courses,
  selectedCourseId,
  onSelectCourse,
  data,
  loading,
  error,
  onRetry,
}: TeacherCoursePerformancePreviewProps) {
  return (
    <div className="bg-white dark:bg-[#1d1926] rounded-2xl border border-[#f1ebff] dark:border-[#2b2438] p-5 sm:p-6 shadow-xs space-y-4">
      {/* Header & Course Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#f1ebff] dark:border-[#2b2438]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#f7f1ff] dark:bg-[#2b2438] text-[#7240b8] dark:text-[#a87ffb] flex items-center justify-center shrink-0">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#1c192c] dark:text-[#f4eeff]">
              Tóm tắt hiệu suất chi tiết theo khóa học
            </h2>
            <p className="text-xs text-[#635a72] dark:text-[#a9a0b2]">
              Kết nối trực tiếp <code className="font-mono text-[11px]">GET /api/teacher/statistics/course-performance/:courseId</code>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Chọn khóa học để xem hiệu suất"
            value={selectedCourseId}
            onChange={(e) => onSelectCourse(e.target.value)}
            disabled={loading || courses.length === 0}
            className="h-9 max-w-xs px-3 rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] text-xs font-medium text-[#1c192c] dark:text-[#f4eeff] cursor-pointer"
          >
            <option value="">Chọn khóa học để kiểm tra...</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>

          {selectedCourseId && (
            <Link
              href={`/teacher/courses/${selectedCourseId}/performance`}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-[#7240b8] hover:bg-[#5e3299] text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <span>Mở phân tích chuyên sâu</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>

      {!selectedCourseId ? (
        <div className="p-8 rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-dashed border-[#e6dffa] dark:border-[#2b2438] text-center space-y-2">
          <BookOpen className="w-7 h-7 text-[#cdc3d4] dark:text-[#4b4359] mx-auto" />
          <p className="text-xs sm:text-sm font-semibold text-[#1c192c] dark:text-[#f4eeff]">
            Chọn một khóa học của bạn ở trên hoặc nhấn &ldquo;Xem nhanh&rdquo; trên bảng xếp hạng
          </p>
          <p className="text-xs text-[#635a72] dark:text-[#a9a0b2] max-w-md mx-auto">
            Xem nhanh doanh thu, tỷ lệ hoàn thành, đánh giá và bài kiểm tra, hoặc mở trang phân tích chuyên sâu đầy đủ biểu đồ phễu bài học (Lesson Funnel).
          </p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-center space-y-2.5">
          {error.statusCode === 403 ? (
            <ShieldAlert className="w-6 h-6 text-amber-600 dark:text-amber-400 mx-auto" />
          ) : (
            <AlertCircle className="w-6 h-6 text-rose-600 dark:text-rose-400 mx-auto" />
          )}
          <p className="text-xs font-semibold text-[#1c192c] dark:text-[#f4eeff]">
            {error.statusCode === 403
              ? 'Không có quyền truy cập khóa học này (403)'
              : error.statusCode === 404
              ? 'Không tìm thấy khóa học (404)'
              : 'Không thể tải dữ liệu hiệu suất khóa học'}
          </p>
          <p className="text-xs text-[#635a72] dark:text-[#a9a0b2] max-w-md mx-auto">
            {error.message}
          </p>
          {error.statusCode !== 403 && error.statusCode !== 404 && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#7240b8] hover:bg-[#5e3299] text-white text-xs font-semibold cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Thử lại</span>
            </button>
          )}
        </div>
      ) : loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-[#f7f1ff] dark:bg-[#221d2d]" />
          ))}
        </div>
      ) : data ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438]">
            <div>
              <p className="text-sm font-bold text-[#1c192c] dark:text-[#f4eeff]">
                {data.course.title}
              </p>
              <p className="text-[11px] text-[#635a72] dark:text-[#a9a0b2]">
                {data.curriculum.totalChapters} chương • {data.curriculum.totalLessons} bài học •{' '}
                {data.quizzes.summary.totalQuizzes} bài kiểm tra
              </p>
            </div>
            <span className="text-xs font-bold text-[#7240b8] dark:text-[#a87ffb]">
              Giá hiện tại: {formatTeacherVND(data.course.price)}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] space-y-1">
              <p className="text-[11px] text-[#635a72] dark:text-[#a9a0b2]">Doanh thu khóa học</p>
              <p className="text-base font-bold text-[#7240b8] dark:text-[#a87ffb]">
                {formatTeacherVND(data.overview.revenue.totalRevenue)}
              </p>
              <p className="text-[11px] text-[#8e849e]">
                {data.overview.revenue.paidOrders !== undefined &&
                data.overview.revenue.freeOrders !== undefined
                  ? `${fmt(data.overview.revenue.paidOrders)} trả phí • ${fmt(data.overview.revenue.freeOrders)} miễn phí`
                  : `${fmt(data.overview.revenue.completedOrders)} đơn hoàn tất`}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] space-y-1">
              <p className="text-[11px] text-[#635a72] dark:text-[#a9a0b2]">Học viên &amp; Hoàn thành</p>
              <p className="text-base font-bold text-[#1c192c] dark:text-[#f4eeff]">
                {fmt(data.overview.students.totalStudents)} học viên
              </p>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>
                  Tiến độ TB {data.overview.students.averageProgress}% • Hoàn thành {data.overview.students.completionRate}%
                </span>
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] space-y-1">
              <p className="text-[11px] text-[#635a72] dark:text-[#a9a0b2]">Đánh giá &amp; Chứng chỉ</p>
              <p className="text-base font-bold text-amber-600 dark:text-amber-400 inline-flex items-center gap-1">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>
                  {data.overview.engagement.totalReviews > 0
                    ? `${data.overview.engagement.averageRating.toFixed(1)} / 5`
                    : 'Chưa có'}
                </span>
              </p>
              <p className="text-[11px] text-[#8e849e]">
                {fmt(data.overview.engagement.totalReviews)} đánh giá •{' '}
                {fmt(data.overview.engagement.certificatesIssued)} chứng chỉ
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] space-y-1">
              <p className="text-[11px] text-[#635a72] dark:text-[#a9a0b2]">Kết quả bài kiểm tra (Quiz)</p>
              <p className="text-base font-bold text-[#1c192c] dark:text-[#f4eeff] inline-flex items-center gap-1">
                <Award className="w-4 h-4 text-[#7240b8] dark:text-[#a87ffb]" />
                <span>{fmt(data.quizzes.summary.totalSubmissions)} lượt nộp</span>
              </p>
              <p className="text-[11px] text-[#8e849e]">
                Đạt {data.quizzes.summary.passRate}% • Điểm TB {data.quizzes.summary.averageScore}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
