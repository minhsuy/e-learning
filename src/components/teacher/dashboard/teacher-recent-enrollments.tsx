'use client';

import React from 'react';
import { CourseStudentItem } from '@/types/enrollment';

interface TeacherRecentEnrollmentsProps {
  students?: CourseStudentItem[];
  isLoading?: boolean;
}

function getInitials(name?: string): string {
  if (!name) return 'HV';
  const clean = name.trim();
  const parts = clean.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
}

function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return 'Gần đây';
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Vừa mới đây';
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays === 1) return 'Hôm qua';
    if (diffDays < 30) return `${diffDays} ngày trước`;
    return d.toLocaleDateString('vi-VN');
  } catch {
    return 'Gần đây';
  }
}

export function TeacherRecentEnrollments({
  students = [],
  isLoading,
}: TeacherRecentEnrollmentsProps) {
  return (
    <div className="rounded-2xl bg-white dark:bg-[#1d1926] border border-[#ECEAF3] dark:border-[#352e43] p-5 sm:p-6 space-y-5 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-[#f1ebff] dark:border-[#2b2438]">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[#1c192c] dark:text-[#f4eeff]">
            Học viên ghi danh gần đây
          </h2>
          <p className="text-xs text-[#635a72] dark:text-[#a9a0b2] mt-0.5">
            Lượt đăng ký và tiến độ học tập mới nhất
          </p>
        </div>
        <div className="w-8 h-8 rounded-lg bg-[#f7f1ff] dark:bg-[#2b2438] text-[#7240b8] dark:text-[#a87ffb] flex items-center justify-center">
          <span className="material-symbols-outlined text-lg">person_search</span>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-[#f7f1ff]/50 dark:bg-[#2b2438]/40 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#e6dffa] dark:bg-[#352e43]" />
                <div className="space-y-1.5">
                  <div className="w-28 h-3.5 bg-[#e6dffa] dark:bg-[#352e43] rounded" />
                  <div className="w-20 h-2.5 bg-[#e6dffa] dark:bg-[#352e43] rounded" />
                </div>
              </div>
              <div className="w-16 h-5 bg-[#e6dffa] dark:bg-[#352e43] rounded-full" />
            </div>
          ))}
        </div>
      ) : students.length === 0 ? (
        <div className="py-8 text-center text-[#635a72] dark:text-[#a9a0b2] space-y-2">
          <div className="w-12 h-12 rounded-xl bg-[#f7f1ff] dark:bg-[#2b2438] text-[#7240b8] dark:text-[#a87ffb] mx-auto flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">school</span>
          </div>
          <p className="text-sm font-semibold text-[#1c192c] dark:text-[#f4eeff]">
            Chưa có học viên mới
          </p>
          <p className="text-xs text-[#7c7483] dark:text-[#968e9e] max-w-xs mx-auto">
            Khi có học viên đăng ký tham gia khóa học của bạn, danh sách tiến độ sẽ được cập nhật tại đây.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {students.map((item, idx) => {
            const studentUser = item.user;
            const studentId = item.id || item._id || `${item.userId}-${idx}`;
            const progress = item.progress !== undefined ? item.progress : 0;

            return (
              <div
                key={studentId}
                className="flex items-center justify-between p-3 rounded-xl bg-[#f7f1ff]/60 dark:bg-[#221d2d]/60 hover:bg-[#f7f1ff] dark:hover:bg-[#221d2d] transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {studentUser?.avatar ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={studentUser.avatar}
                      alt={studentUser.username}
                      className="w-10 h-10 rounded-full object-cover shrink-0 ring-1 ring-[#e6dffa] dark:ring-[#352e43]"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#7240b8] text-white flex items-center justify-center font-bold text-xs shrink-0">
                      {getInitials(studentUser?.username)}
                    </div>
                  )}

                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-[#1c192c] dark:text-[#f4eeff] truncate">
                      {studentUser?.username || 'Học viên'}
                    </h4>
                    <p className="text-[11px] text-[#635a72] dark:text-[#a9a0b2] truncate">
                      {studentUser?.email}
                    </p>
                    <span className="text-[10px] text-[#7c7483] dark:text-[#968e9e]">
                      {formatRelativeTime(item.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0 pl-2">
                  <span
                    className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-full ${
                      progress >= 80
                        ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800'
                        : progress >= 30
                        ? 'text-[#7240b8] dark:text-[#a87ffb] bg-[#f7f1ff] dark:bg-[#2b2438] border border-[#7240b8]/20'
                        : 'text-[#635a72] dark:text-[#cdc3d4] bg-[#f1ebff] dark:bg-[#2e263d]'
                    }`}
                  >
                    {progress}% tiến độ
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
