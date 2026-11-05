import React from 'react';

interface CourseCardSkeletonProps {
  viewMode?: 'grid' | 'list';
  count?: number;
}

export function CourseCardSkeleton({ viewMode = 'grid', count = 1 }: CourseCardSkeletonProps) {
  const items = Array.from({ length: Math.max(1, count) });

  return (
    <>
      {items.map((_, idx) => (
        <div
          key={idx}
          role="status"
          aria-label="Đang tải khóa học..."
          className={`bg-white dark:bg-[#1d1926] rounded-xl overflow-hidden border border-[#f1ebff] dark:border-[#352e43] animate-pulse shadow-xs ${
            viewMode === 'list' ? 'flex flex-col sm:flex-row' : 'flex flex-col'
          }`}
        >
          {/* Thumbnail Skeleton */}
          <div
            className={`bg-[#f0ebf8] dark:bg-[#2b2438] ${
              viewMode === 'list' ? 'w-full sm:w-72 h-44 shrink-0' : 'w-full aspect-[16/9]'
            }`}
          />

          {/* Body Skeleton */}
          <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-3">
            <div className="flex flex-col gap-2.5">
              {/* Meta pills row */}
              <div className="flex items-center gap-2">
                <div className="h-4 bg-[#f0ebf8] dark:bg-[#2b2438] rounded-md w-20" />
                <div className="h-4 bg-[#f0ebf8] dark:bg-[#2b2438] rounded-md w-24" />
              </div>

              {/* Title lines */}
              <div className="space-y-1.5 mt-1">
                <div className="h-4 bg-[#f0ebf8] dark:bg-[#2b2438] rounded w-11/12" />
                <div className="h-4 bg-[#f0ebf8] dark:bg-[#2b2438] rounded w-3/5" />
              </div>

              {/* Instructor avatar + name */}
              <div className="flex items-center gap-2 mt-1">
                <div className="w-6 h-6 rounded-full bg-[#f0ebf8] dark:bg-[#2b2438] shrink-0" />
                <div className="h-3.5 bg-[#f0ebf8] dark:bg-[#2b2438] rounded w-28" />
              </div>

              {/* Rating stars */}
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="h-3.5 bg-[#f0ebf8] dark:bg-[#2b2438] rounded w-16" />
                <div className="h-3 bg-[#f0ebf8] dark:bg-[#2b2438] rounded w-20" />
              </div>
            </div>

            {/* Price & CTA Button */}
            <div className="pt-3 border-t border-[#f7f1ff] dark:border-[#2b2438] flex justify-between items-center">
              <div className="flex flex-col gap-1">
                <div className="h-5 bg-[#f0ebf8] dark:bg-[#2b2438] rounded w-24" />
                <div className="h-3 bg-[#f0ebf8] dark:bg-[#2b2438] rounded w-16" />
              </div>
              <div className="h-8 bg-[#f0ebf8] dark:bg-[#2b2438] rounded-lg w-28" />
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

