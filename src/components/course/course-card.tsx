'use client';

import React from 'react';
import Link from 'next/link';
import { Course } from '@/types/course';
import { useFavorites } from '@/hooks/use-favorites';

interface CourseCardProps {
  course: Course;
  viewMode?: 'grid' | 'list';
  isFavorited?: boolean;
  onToggleFavorite?: (courseId: string, nextFavorited: boolean) => Promise<boolean | void> | void;
}

export function CourseCard({
  course,
  viewMode = 'grid',
  isFavorited: isFavoritedProp,
  onToggleFavorite,
}: CourseCardProps) {
  const { isFavorite, toggleFavorite, isToggling } = useFavorites();

  const isCurrentFavorited =
    isFavoritedProp !== undefined ? isFavoritedProp : isFavorite(course.id);
  const loadingToggle = isToggling(course.id);

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (loadingToggle) return;

    if (onToggleFavorite) {
      await onToggleFavorite(course.id, !isCurrentFavorited);
    } else {
      await toggleFavorite(course.id);
    }
  };

  const formatPrice = (amount: number) => {
    if (amount === 0) return 'Miễn phí';
    return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
  };

  const getBadgeStyle = (badge?: string) => {
    switch (badge) {
      case 'Bán chạy nhất':
      case 'Bán chạy':
        return 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300';
      case 'Nổi bật':
        return 'bg-[#eddcff] dark:bg-[#3b146e] text-[#7240b8] dark:text-[#d7baff]';
      case 'Đánh giá cao':
        return 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300';
      case 'Xu hướng':
        return 'bg-purple-100 dark:bg-purple-950/50 text-purple-800 dark:text-purple-300';
      case 'Mới':
        return 'bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300';
      default:
        return 'bg-[#f1ebff] dark:bg-[#2b2438] text-[#7240b8] dark:text-[#a87ffb]';
    }
  };

  if (viewMode === 'list') {
    return (
      <article className="flex flex-col sm:flex-row bg-white dark:bg-[#1d1926] rounded-xl shadow-xs hover:shadow-md transition-all duration-200 group overflow-hidden border border-[#f1ebff] dark:border-[#352e43]">
        {/* Thumbnail Frame */}
        <div className="relative w-full sm:w-72 aspect-[16/9] sm:aspect-auto overflow-hidden bg-[#f7f1ff] dark:bg-[#221d2d] shrink-0">
          <img
            src={course.thumbnail}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {course.badge && course.badge !== 'Bán chạy nhất' && course.badge !== 'Nổi bật' && (
            <span
              className={`absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold shadow-xs ${getBadgeStyle(
                course.badge
              )}`}
            >
              {course.badge}
            </span>
          )}
          <button
            onClick={handleFavoriteClick}
            disabled={loadingToggle}
            aria-label={isCurrentFavorited ? 'Bỏ yêu thích' : 'Lưu vào yêu thích'}
            title={isCurrentFavorited ? 'Bỏ yêu thích' : 'Lưu vào yêu thích'}
            className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/80 dark:bg-[#1d1926]/80 backdrop-blur-xs text-[#635a72] dark:text-[#cdc3d4] hover:text-[#ba1a1a] hover:bg-white dark:hover:bg-[#2b2438] flex items-center justify-center transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shadow-xs"
          >
            {loadingToggle ? (
              <span className="w-4 h-4 border-2 border-[#ba1a1a] border-t-transparent rounded-full animate-spin" />
            ) : (
              <span
                className="material-symbols-outlined text-[18px] transition-transform active:scale-125"
                style={{
                  fontVariationSettings: isCurrentFavorited ? "'FILL' 1" : "'FILL' 0",
                  color: isCurrentFavorited ? '#ba1a1a' : undefined,
                }}
              >
                favorite
              </span>
            )}
          </button>
        </div>

        {/* Card Body */}
        <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between gap-3">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-xs text-[#635a72] dark:text-[#cdc3d4]">
              <span className="flex items-center gap-1 bg-[#f7f1ff] dark:bg-[#221d2d] px-2 py-0.5 rounded">
                <span className="material-symbols-outlined text-[14px] text-[#7240b8] dark:text-[#a87ffb]">
                  schedule
                </span>
                {course.formattedDuration || (course.durationHours > 0 ? `${course.durationHours} giờ` : 'Chưa có bài học')}
              </span>
              <span className="flex items-center gap-1 bg-[#f7f1ff] dark:bg-[#221d2d] px-2 py-0.5 rounded">
                <span className="material-symbols-outlined text-[14px] text-[#7240b8] dark:text-[#a87ffb]">
                  stairs
                </span>
                {course.levelLabel}
              </span>
            </div>

            <Link href={`/courses/${course.slug}`}>
              <h2 className="text-base font-bold text-[#1c192c] dark:text-[#f4eeff] line-clamp-2 group-hover:text-[#7240b8] dark:group-hover:text-[#a87ffb] transition-colors mt-0.5">
                {course.title}
              </h2>
            </Link>

            <div className="flex items-center gap-2 mt-0.5">
              <div className="w-6 h-6 rounded-full bg-[#7240b8]/15 dark:bg-[#a87ffb]/20 text-[#7240b8] dark:text-[#a87ffb] flex items-center justify-center font-bold text-[10px]">
                {course.instructor.initials || 'GV'}
              </div>
              <span className="text-xs text-[#635a72] dark:text-[#cdc3d4] truncate">
                {course.instructor.name}
              </span>
            </div>

            <div className="flex items-center gap-1.5 mt-0.5">
              {course.reviewCount > 0 ? (
                <>
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                    {course.rating.toFixed(1)}
                  </span>
                  <div className="flex items-center text-amber-500">
                    <span
                      className="material-symbols-outlined text-[11px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      star
                    </span>
                  </div>
                  <span className="text-xs text-[#7c7483] dark:text-[#968e9e]">
                    ({course.reviewCount} đánh giá)
                  </span>
                </>
              ) : (
                <span className="text-xs text-[#8c8296] dark:text-[#a094aa] italic flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px] text-amber-400/60">star_outline</span>
                  Chưa có đánh giá
                </span>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-[#f7f1ff] dark:border-[#2b2438] flex items-center justify-between">
            <div className="flex flex-col">
              <span
                className={`font-bold ${course.price === 0
                  ? 'text-sm text-green-500'
                  : 'text-base text-[#7240b8] dark:text-[#a87ffb]'
                  }`}
              >
                {formatPrice(course.price)}
              </span>
              {course.originalPrice && (
                <span className="text-xs text-[#7c7483] dark:text-[#968e9e] line-through">
                  {formatPrice(course.originalPrice)}
                </span>
              )}
            </div>
            <Link
              href={`/courses/${course.slug}`}
              className="px-4 py-2 rounded-lg bg-[#7240b8] hover:bg-[#8b5ad3] dark:bg-[#a87ffb] dark:hover:bg-[#b996ff] text-white dark:text-[#1c192c] text-xs font-semibold transition-all shadow-xs"
            >
              Xem khóa học
            </Link>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="flex flex-col bg-white dark:bg-[#1d1926] rounded-xl shadow-xs hover:shadow-md transition-all duration-200 group overflow-hidden border border-[#f1ebff] dark:border-[#352e43]">
      {/* Thumbnail Frame */}
      <div className="relative w-full aspect-[16/9] overflow-hidden bg-[#f7f1ff] dark:bg-[#221d2d]">
        <img
          src={course.thumbnail}
          alt={course.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {course.badge && course.badge !== 'Bán chạy nhất' && course.badge !== 'Nổi bật' && (
          <span
            className={`absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold shadow-xs ${getBadgeStyle(
              course.badge
            )}`}
          >
            {course.badge}
          </span>
        )}
        <button
          onClick={handleFavoriteClick}
          disabled={loadingToggle}
          aria-label={isCurrentFavorited ? 'Bỏ yêu thích' : 'Lưu vào yêu thích'}
          title={isCurrentFavorited ? 'Bỏ yêu thích' : 'Lưu vào yêu thích'}
          className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/80 dark:bg-[#1d1926]/80 backdrop-blur-xs text-[#635a72] dark:text-[#cdc3d4] hover:text-[#ba1a1a] hover:bg-white dark:hover:bg-[#2b2438] flex items-center justify-center transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shadow-xs"
        >
          {loadingToggle ? (
            <span className="w-4 h-4 border-2 border-[#ba1a1a] border-t-transparent rounded-full animate-spin" />
          ) : (
            <span
              className="material-symbols-outlined text-[18px] transition-transform active:scale-125"
              style={{
                fontVariationSettings: isCurrentFavorited ? "'FILL' 1" : "'FILL' 0",
                color: isCurrentFavorited ? '#ba1a1a' : undefined,
              }}
            >
              favorite
            </span>
          )}
        </button>
      </div>

      {/* Card Body */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          {/* Meta stats row */}
          <div className="flex items-center justify-between text-xs text-[#635a72] dark:text-[#cdc3d4]">
            <span className="flex items-center gap-1 bg-[#f7f1ff] dark:bg-[#221d2d] px-2 py-0.5 rounded">
              <span className="material-symbols-outlined text-[14px] text-[#7240b8] dark:text-[#a87ffb]">
                schedule
              </span>
              {course.formattedDuration || (course.durationHours > 0 ? `${course.durationHours} giờ` : 'Chưa có bài học')}
            </span>
            <span className="flex items-center gap-1 bg-[#f7f1ff] dark:bg-[#221d2d] px-2 py-0.5 rounded">
              <span className="material-symbols-outlined text-[14px] text-[#7240b8] dark:text-[#a87ffb]">
                stairs
              </span>
              {course.levelLabel}
            </span>
          </div>

          {/* Title */}
          <Link href={`/courses/${course.slug}`}>
            <h2 className="text-sm font-bold text-[#1c192c] dark:text-[#f4eeff] line-clamp-2 group-hover:text-[#7240b8] dark:group-hover:text-[#a87ffb] transition-colors mt-1">
              {course.title}
            </h2>
          </Link>

          {/* Instructor */}
          <div className="flex items-center gap-2 mt-1">
            <div className="w-6 h-6 rounded-full bg-[#7240b8]/15 dark:bg-[#a87ffb]/20 text-[#7240b8] dark:text-[#a87ffb] flex items-center justify-center font-bold text-[10px]">
              {course.instructor.initials || 'GV'}
            </div>
            <span className="text-xs text-[#635a72] dark:text-[#cdc3d4] truncate">
              {course.instructor.name}
            </span>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1.5 mt-1">
            {course.reviewCount > 0 ? (
              <>
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                  {course.rating.toFixed(1)}
                </span>
                <div className="flex items-center text-amber-500">
                  <span
                    className="material-symbols-outlined text-[11px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    star
                  </span>
                </div>
                <span className="text-xs text-[#7c7483] dark:text-[#968e9e]">
                  ({course.reviewCount} đánh giá)
                </span>
              </>
            ) : (
              <span className="text-xs text-[#8c8296] dark:text-[#a094aa] italic flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px] text-amber-400/60">star_outline</span>
                Chưa có đánh giá
              </span>
            )}
          </div>
        </div>

        {/* Price & CTA */}
        <div className="pt-3 border-t border-[#f7f1ff] dark:border-[#2b2438] flex items-center justify-between">
          <div className="flex flex-col">
            <span
              className={`font-bold ${course.price === 0
                ? 'text-sm text-green-500'
                : 'text-base text-[#7240b8] dark:text-[#a87ffb]'
                }`}
            >
              {formatPrice(course.price)}
            </span>
            {Boolean(course.originalPrice && course.originalPrice > course.price) && (
              <span className="text-xs text-[#7c7483] dark:text-[#968e9e] line-through">
                {formatPrice(course.originalPrice!)}
              </span>
            )}
          </div>
          <Link
            href={`/courses/${course.slug}`}
            className="px-4 py-2 rounded-lg bg-[#7240b8] hover:bg-[#8b5ad3] dark:bg-[#a87ffb] dark:hover:bg-[#b996ff] text-white dark:text-[#1c192c] text-xs font-semibold transition-all shadow-xs"
          >
            Xem khóa học
          </Link>
        </div>
      </div>
    </article>
  );
}
