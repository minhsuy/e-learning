'use client';

import React, { useState } from 'react';
import {
  Layers,
  Video,
  FileText,
  HelpCircle,
  TrendingDown,
  Info,
  ArrowDownRight,
  Filter,
} from 'lucide-react';
import { TeacherCoursePerformanceLessonFunnelItem } from '@/types/teacher-statistics';

interface PerformanceLessonFunnelProps {
  funnel?: TeacherCoursePerformanceLessonFunnelItem[];
  totalStudents: number;
  isLoading?: boolean;
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export function PerformanceLessonFunnel({
  funnel = [],
  totalStudents,
  isLoading = false,
}: PerformanceLessonFunnelProps) {
  const [filterLowCompletionOnly, setFilterLowCompletionOnly] = useState(false);

  if (isLoading) {
    return (
      <div className="rounded-2xl bg-white dark:bg-[#1d1926] border border-[#eceaf3] dark:border-[#352e43] p-5 shadow-xs space-y-4 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-5 w-48 bg-slate-100 dark:bg-slate-800 rounded" />
          <div className="h-8 w-28 bg-slate-100 dark:bg-slate-800 rounded-xl" />
        </div>
        <div className="h-64 bg-slate-50 dark:bg-slate-850 rounded-xl" />
      </div>
    );
  }

  const displayedLessons = filterLowCompletionOnly
    ? funnel.filter((item) => item.completionRate < 50)
    : funnel;

  // Find biggest drop-off
  const highestDropOff = funnel.reduce(
    (max, item) => (item.dropOffFromPrevious > max.dropOffFromPrevious ? item : max),
    funnel[0] || null
  );

  return (
    <div className="rounded-2xl bg-white dark:bg-[#1d1926] border border-[#eceaf3] dark:border-[#352e43] p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#eceaf3] dark:border-[#352e43]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-[#7240b8] dark:text-[#a87ffb]">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#1c192c] dark:text-[#f4eeff]">
              Phễu Hoàn thành Từng Bài học (Lesson Funnel)
            </h3>
            <p className="text-xs text-[#635a72] dark:text-[#a9a0b2]">
              Theo dõi tỷ lệ hoàn thành theo trình tự bài giảng và phát hiện điểm học viên thường dừng lại
            </p>
          </div>
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterLowCompletionOnly(!filterLowCompletionOnly)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              filterLowCompletionOnly
                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/40'
                : 'bg-white dark:bg-[#252030] text-[#635a72] dark:text-[#a9a0b2] border-[#eceaf3] dark:border-[#352e43] hover:text-[#1c192c] dark:hover:text-[#f4eeff]'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Chỉ xem bài &lt; 50%</span>
          </button>
        </div>
      </div>

      {/* Funnel Highlight Banner */}
      {funnel.length > 0 && highestDropOff && highestDropOff.dropOffFromPrevious > 0 && (
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/30 text-xs text-amber-800 dark:text-amber-300">
          <TrendingDown className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <div>
            Điểm dừng lớn nhất được ghi nhận tại bài{' '}
            <strong className="font-semibold underline">
              {highestDropOff.lessonTitle}
            </strong>{' '}
            (giảm {highestDropOff.dropOffFromPrevious}% học viên hoàn thành so với bài trước). Bạn có thể xem xét cập nhật nội dung hoặc bổ sung bài tập gợi mở tại đây.
          </div>
        </div>
      )}

      {/* Funnel Table */}
      {displayedLessons.length === 0 ? (
        <div className="text-center py-10 px-4 border border-dashed border-[#eceaf3] dark:border-[#352e43] rounded-xl">
          <p className="text-xs text-[#635a72] dark:text-[#a9a0b2]">
            {filterLowCompletionOnly
              ? 'Tuyệt vời! Không có bài học nào có tỷ lệ hoàn thành dưới 50%.'
              : 'Khóa học chưa có bài học nào trong hệ thống.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#eceaf3] dark:border-[#352e43]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#fbf9fe] dark:bg-[#252030] text-[#635a72] dark:text-[#a9a0b2] border-b border-[#eceaf3] dark:border-[#352e43]">
              <tr>
                <th className="py-2.5 px-3 font-semibold w-12 text-center">#</th>
                <th className="py-2.5 px-3 font-semibold">Tên bài học &amp; Chương</th>
                <th className="py-2.5 px-3 font-semibold w-24 text-center">Loại</th>
                <th className="py-2.5 px-3 font-semibold w-32 text-center">Đã hoàn thành</th>
                <th className="py-2.5 px-3 font-semibold w-48">Tỷ lệ hoàn thành</th>
                <th className="py-2.5 px-3 font-semibold w-28 text-center">Độ giảm từ bài trước</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eceaf3] dark:divide-[#352e43]">
              {displayedLessons.map((item, index) => {
                const isVideo = item.type === 'video';
                // Color coding for completion rate
                const rateColor =
                  item.completionRate >= 70
                    ? 'bg-emerald-500'
                    : item.completionRate >= 40
                    ? 'bg-[#7240b8] dark:bg-[#a87ffb]'
                    : 'bg-amber-500';

                return (
                  <tr
                    key={item.lessonId}
                    className="hover:bg-violet-50/30 dark:hover:bg-[#252030]/50 transition-colors"
                  >
                    {/* Index */}
                    <td className="py-2.5 px-3 text-center font-medium text-[#635a72] dark:text-[#a9a0b2]">
                      {item.order}
                    </td>

                    {/* Lesson and Chapter Title */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#1c192c] dark:text-[#f4eeff]">
                          {item.lessonTitle}
                        </span>
                        {item.isDemo && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                            Demo
                          </span>
                        )}
                        {item.hasQuiz && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-violet-100 dark:bg-violet-900/40 text-[#7240b8] dark:text-[#a87ffb]">
                            <HelpCircle className="w-2.5 h-2.5" /> Quiz
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#635a72] dark:text-[#a9a0b2] mt-0.5">
                        {item.chapter?.title ? `Chương: ${item.chapter.title}` : 'Bài học'}
                        {item.duration > 0 && ` • ${formatDuration(item.duration)}`}
                      </div>
                    </td>

                    {/* Type */}
                    <td className="py-2.5 px-3 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {isVideo ? (
                          <>
                            <Video className="w-3 h-3 text-blue-500" />
                            <span>Video</span>
                          </>
                        ) : (
                          <>
                            <FileText className="w-3 h-3 text-slate-500" />
                            <span>Văn bản</span>
                          </>
                        )}
                      </span>
                    </td>

                    {/* Completed Count */}
                    <td className="py-2.5 px-3 text-center">
                      <span className="font-bold text-[#1c192c] dark:text-[#f4eeff]">
                        {item.completedStudents}
                      </span>
                      <span className="text-[#635a72] dark:text-[#a9a0b2] text-[11px]">
                        {' '}/ {totalStudents}
                      </span>
                    </td>

                    {/* Completion Rate Bar */}
                    <td className="py-2.5 px-3">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-[#1c192c] dark:text-[#f4eeff]">
                            {item.completionRate}%
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${rateColor}`}
                            style={{ width: `${Math.min(100, Math.max(0, item.completionRate))}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Drop Off From Previous */}
                    <td className="py-2.5 px-3 text-center">
                      {index === 0 || item.dropOffFromPrevious === 0 ? (
                        <span className="text-[#635a72] dark:text-[#a9a0b2] text-[11px]">
                          —
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30">
                          <ArrowDownRight className="w-3 h-3" />
                          -{item.dropOffFromPrevious}%
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Telemetry Disclaimer Box (Mandatory per Section 7 of prompt) */}
      <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-50 dark:bg-[#252030] border border-[#eceaf3] dark:border-[#352e43] text-xs text-[#635a72] dark:text-[#a9a0b2]">
        <Info className="w-4 h-4 text-[#7240b8] dark:text-[#a87ffb] shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong>Minh bạch dữ liệu:</strong> Chỉ số hoàn thành và độ rơi rớt được tính toán dựa trên trạng thái xác nhận hoàn tất bài giảng (<code className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-[11px]">Progress.completed = true</code>) trong hệ số ghi danh của học viên. Hệ thống không đại diện cho thời lượng phát video liên tục từng giây (continuous video player telemetry).
        </div>
      </div>
    </div>
  );
}
