'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CourseCard } from '@/components/course/course-card';
import { CourseCardSkeleton } from '@/components/course/course-card-skeleton';
import { useAuth } from '@/hooks/use-auth';
import { usePersonalizedRecommendations } from '@/hooks/use-recommendations';

interface PersonalizedRecommendationsSectionProps {
  limit?: number;
  columns?: 2 | 3 | 4;
  className?: string;
}

interface CategoryFilterOption {
  label: string;
  value?: string;
}

const CATEGORY_FILTERS: CategoryFilterOption[] = [
  { label: 'Tất cả', value: undefined },
  { label: 'Lập trình web', value: 'Lập trình web' },
  { label: 'Trí tuệ nhân tạo (AI)', value: 'Trí tuệ nhân tạo (AI)' },
  { label: 'Khoa học dữ liệu', value: 'Khoa học dữ liệu' },
  { label: 'Thiết kế UI/UX', value: 'Thiết kế UI/UX & Sản phẩm số' },
];

export function PersonalizedRecommendationsSection({
  limit = 8,
  columns = 2,
  className = '',
}: PersonalizedRecommendationsSectionProps) {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [selectedCategoryValue, setSelectedCategoryValue] = useState<string | undefined>(undefined);

  const preferredCategory = isAuthenticated ? selectedCategoryValue : undefined;

  const { courses, isLoading, error, refetch } = usePersonalizedRecommendations({
    limit,
    enable_diversity: true,
    filter_completed: true,
    filter_enrolled: true,
    preferred_category_names: preferredCategory,
  });

  const gridClass =
    columns === 4
      ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5'
      : columns === 3
      ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5'
      : 'grid-cols-1 sm:grid-cols-2 gap-4';

  return (
    <section aria-label="Đề xuất dành cho bạn" className={`flex flex-col gap-5 ${className}`}>
      {/* Section Header with Title & Category Chips */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-[#ede5fb] dark:bg-[#2e2345] flex items-center justify-center text-[#7240b8] dark:text-[#a87ffb] shadow-2xs">
            <span className="material-symbols-outlined text-[22px]">auto_awesome</span>
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-bold text-[#1c192c] dark:text-[#f4eeff]">
              Đề xuất dành cho bạn
            </h2>
            <p className="text-xs md:text-sm text-[#635a72] dark:text-[#b4a9c7] mt-0.5">
              Dựa trên lộ trình học tập, lịch sử tương tác và sở thích chuyên ngành của bạn
            </p>
          </div>
        </div>

        {/* Filter Chips (Only displayed for authenticated learners) */}
        {isAuthenticated && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {CATEGORY_FILTERS.map((filter) => {
              const isSelected = preferredCategory === filter.value;
              return (
                <button
                  key={filter.label}
                  type="button"
                  onClick={() => setSelectedCategoryValue(filter.value)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#7240b8] dark:bg-[#a87ffb] text-white dark:text-[#1c192c] shadow-xs'
                      : 'bg-[#ebe5ff] dark:bg-[#282136] text-[#1c192c] dark:text-[#f4eeff] hover:bg-[#e6dffa] dark:hover:bg-[#342a47]'
                  }`}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Auth Loading State */}
      {isAuthLoading ? (
        <div className={`grid ${gridClass}`}>
          <CourseCardSkeleton count={limit > 4 ? 4 : limit} />
        </div>
      ) : !isAuthenticated ? (
        /* Unauthenticated Banner State: No protected requests sent */
        <div className="bg-gradient-to-r from-[#f8f5ff] to-[#f0ebff] dark:from-[#211a2f] dark:to-[#1c1729] rounded-2xl p-6 md:p-8 border border-[#e5d9fb] dark:border-[#352a4e] flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xs">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white dark:bg-[#2c2242] text-[#7240b8] dark:text-[#a87ffb] flex items-center justify-center shrink-0 shadow-xs">
              <span className="material-symbols-outlined text-[28px]">psychology</span>
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-base font-bold text-[#1c192c] dark:text-[#f4eeff]">
                Cá nhân hóa lộ trình học tập của bạn
              </h3>
              <p className="text-xs md:text-sm text-[#635a72] dark:text-[#b4a9c7] max-w-xl">
                Đăng nhập tài khoản TMdemy để thuật toán AI phân tích sở thích, tiến độ và gợi ý các khóa học phù hợp nhất với mục tiêu nghề nghiệp của bạn.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto">
            <Link
              href="/login"
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-[#7240b8] hover:bg-[#8b5ad3] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">login</span>
              <span>Đăng nhập ngay</span>
            </Link>
            <Link
              href="/courses"
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-white dark:bg-[#2c2242] hover:bg-[#f7f1ff] dark:hover:bg-[#342a4e] text-[#7240b8] dark:text-[#a87ffb] text-xs font-bold transition-colors border border-[#e5d9fb] dark:border-[#3d2f5a] flex items-center justify-center gap-1"
            >
              <span>Xem tất cả</span>
              <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
            </Link>
          </div>
        </div>
      ) : error ? (
        /* Error State with Graceful Non-blocking Retry */
        <div className="bg-white dark:bg-[#1d1926] rounded-2xl p-6 border border-[#f1ebff] dark:border-[#2f2742] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-amber-500 text-[24px]">
              info
            </span>
            <div>
              <p className="text-sm font-semibold text-[#1c192c] dark:text-[#f4eeff]">
                Hệ thống đề xuất đang bận
              </p>
              <p className="text-xs text-[#635a72] dark:text-[#b4a9c7]">
                {error || 'Không thể tải danh sách đề xuất. Vui lòng bấm thử lại.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            className="px-4 py-2 rounded-lg bg-[#7240b8] text-white text-xs font-semibold hover:bg-[#8b5ad3] transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <span className="material-symbols-outlined text-[16px]">refresh</span>
            <span>Thử lại</span>
          </button>
        </div>
      ) : isLoading ? (
        /* Loading Skeletons */
        <div className={`grid ${gridClass}`}>
          <CourseCardSkeleton count={limit > 4 ? 4 : limit} />
        </div>
      ) : courses.length === 0 ? (
        /* Empty State */
        <div className="bg-white dark:bg-[#1d1926] rounded-2xl p-8 border border-[#f1ebff] dark:border-[#2f2742] text-center flex flex-col items-center justify-center gap-3 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-[#f7f1ff] dark:bg-[#282136] text-[#7240b8] dark:text-[#a87ffb] flex items-center justify-center">
            <span className="material-symbols-outlined text-[28px]">search_off</span>
          </div>
          <div className="flex flex-col gap-1 max-w-md">
            <h3 className="text-sm font-bold text-[#1c192c] dark:text-[#f4eeff]">
              Chưa có đề xuất phù hợp
            </h3>
            <p className="text-xs text-[#635a72] dark:text-[#b4a9c7]">
              Hãy khám phá thêm các khóa học trong danh mục để hệ thống ghi nhận sở thích và xây dựng lộ trình gợi ý chính xác hơn cho bạn.
            </p>
          </div>
          <Link
            href="/courses"
            className="mt-2 px-4 py-2 rounded-lg bg-[#7240b8] hover:bg-[#8b5ad3] text-white text-xs font-semibold transition-colors"
          >
            Khám phá danh mục khóa học
          </Link>
        </div>
      ) : (
        /* Success State: Course Cards preserving ranking order */
        <div className={`grid ${gridClass}`}>
          {courses.slice(0, limit).map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </section>
  );
}
