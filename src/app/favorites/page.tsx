'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { RouteGuard } from '@/components/auth/route-guard';
import { CourseCard } from '@/components/course/course-card';
import { favoriteService } from '@/services/favorite.service';
import { useFavorites } from '@/hooks/use-favorites';
import { FavoriteItem } from '@/types/favorite';
import { Course, ApiCourseItem, mapApiCourseToCourse } from '@/types/course';
import { AppApiError } from '@/types/api';

type SortMode = 'recent' | 'price-low' | 'price-high' | 'title-az';

function mapFavoriteToCourse(fav: FavoriteItem): Course {
  const c = fav.course || ({} as FavoriteItem['course']);
  const courseItem: ApiCourseItem = {
    ...c,
    id: c.id || c._id || fav.courseId,
    slug: c.slug || c.id || c._id || fav.courseId,
    title: c.title || 'Khóa học',
    price: typeof c.price === 'number' ? c.price : 0,
    image: c.image,
  };
  return mapApiCourseToCourse(courseItem);
}

export default function FavoritesPage() {
  const { toggleFavorite } = useFavorites();

  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [reloadKey, setReloadKey] = useState<number>(0);

  // Filter, Search, Sort & View Modes
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('recent');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const pageSize = 9;

  useEffect(() => {
    let isCurrent = true;
    const controller = new AbortController();

    const fetchFavorites = async () => {
      try {
        const res = await favoriteService.getFavorites(
          { page: currentPage, limit: pageSize },
          { signal: controller.signal }
        );

        if (!isCurrent) return;

        if (res.success && res.data) {
          setFavorites(res.data.favorites || []);
          if (res.data.pagination) {
            setTotalPages(res.data.pagination.totalPages || 1);
            setTotalCount(res.data.pagination.total || 0);
          }
        } else {
          setFavorites([]);
          setTotalPages(1);
          setTotalCount(0);
        }
      } catch (err: unknown) {
        if (!isCurrent || controller.signal.aborted) return;
        const msg =
          err instanceof AppApiError
            ? err.message
            : 'Không thể tải danh sách khóa học yêu thích. Vui lòng kiểm tra lại kết nối.';
        setErrorMessage(msg);
        setFavorites([]);
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    };

    void fetchFavorites();

    return () => {
      isCurrent = false;
      controller.abort();
    };
  }, [currentPage, reloadKey]);

  const handleRetry = () => {
    setIsLoading(true);
    setErrorMessage(null);
    setReloadKey((k) => k + 1);
  };

  const handlePageChange = (newPage: number) => {
    setIsLoading(true);
    setCurrentPage(newPage);
  };

  // Handle removing course from favorites
  const handleRemoveFavorite = async (courseId: string) => {
    // 1. Optimistically remove from local favorites list
    const previousFavorites = [...favorites];
    const previousTotal = totalCount;

    setFavorites((prev) =>
      prev.filter((item) => {
        const id = item.courseId || item.course?.id || item.course?._id;
        return id !== courseId;
      })
    );
    setTotalCount((prev) => Math.max(0, prev - 1));

    try {
      const success = await toggleFavorite(courseId);
      if (!success) {
        // Rollback if toggle failed
        setFavorites(previousFavorites);
        setTotalCount(previousTotal);
      } else {
        // If current page becomes empty and we're not on page 1, go to previous page
        if (favorites.length <= 1 && currentPage > 1) {
          setCurrentPage((p) => p - 1);
        }
      }
    } catch {
      setFavorites(previousFavorites);
      setTotalCount(previousTotal);
    }
  };

  // Filtered & Sorted items
  const processedCourses = useMemo(() => {
    const filtered = favorites.filter((fav) => {
      const title = fav.course?.title || '';
      return title.toLowerCase().includes(searchQuery.trim().toLowerCase());
    });

    filtered.sort((a, b) => {
      const priceA = a.course?.price || 0;
      const priceB = b.course?.price || 0;
      const titleA = a.course?.title || '';
      const titleB = b.course?.title || '';

      if (sortMode === 'price-low') return priceA - priceB;
      if (sortMode === 'price-high') return priceB - priceA;
      if (sortMode === 'title-az') return titleA.localeCompare(titleB);

      // Default 'recent'
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      return timeB - timeA;
    });

    return filtered;
  }, [favorites, searchQuery, sortMode]);

  return (
    <RouteGuard requireAuth>
      <AppShell>
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
          {/* 1. BREADCRUMBS & PAGE HEADING */}
          <section className="flex flex-col gap-2">
            <nav className="flex items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
              <Link
                href="/"
                className="hover:text-primary transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">home</span>
                <span>Trang chủ</span>
              </Link>
              <span className="text-zinc-300 dark:text-zinc-600">/</span>
              <span className="text-zinc-900 dark:text-zinc-100 font-semibold">Khóa học yêu thích</span>
            </nav>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-1">
              <div>
                <h1 className="font-heading font-extrabold text-2xl lg:text-3xl text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[32px] text-[#ba1a1a]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    favorite
                  </span>
                  <span>Khóa học yêu thích</span>
                </h1>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
                  Danh sách những khóa học bạn đã đánh dấu để học tập hoặc theo dõi.
                </p>
              </div>

              {/* Status Pill */}
              <div className="inline-flex items-center gap-2 self-start sm:self-auto px-4 py-2 rounded-full bg-white dark:bg-[#1d1926] border border-zinc-200/80 dark:border-[#2f2742] shadow-2xs text-xs font-medium text-zinc-700 dark:text-zinc-300">
                <span className="w-2 h-2 rounded-full bg-[#ba1a1a] animate-pulse" />
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {totalCount} khóa học đã lưu
                </span>
              </div>
            </div>
          </section>

          {/* 2. FILTER & TOOLBAR */}
          <section className="bg-white dark:bg-[#1d1926] rounded-2xl p-3 lg:p-4 border border-zinc-200/80 dark:border-[#2f2742] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 sm:max-w-xs">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-zinc-400 pointer-events-none">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm trong khóa học yêu thích..."
                className="w-full pl-9 pr-3 py-1.5 bg-zinc-50 dark:bg-[#171420] border border-zinc-200 dark:border-[#2f2742] rounded-xl text-xs text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:bg-white dark:focus:bg-[#1d1926] focus:border-primary/50 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              )}
            </div>

            {/* Right Controls: Sort & View Mode */}
            <div className="flex items-center gap-2 justify-end">
              {/* Sort Dropdown */}
              <div className="relative">
                <select
                  value={sortMode}
                  onChange={(e) => setSortMode(e.target.value as SortMode)}
                  className="appearance-none bg-zinc-50 dark:bg-[#171420] border border-zinc-200 dark:border-[#2f2742] text-zinc-700 dark:text-zinc-300 pl-3 pr-8 py-1.5 rounded-xl text-xs font-medium cursor-pointer focus:outline-none focus:bg-white dark:focus:bg-[#1d1926] focus:border-primary/50 transition-all"
                >
                  <option value="recent">Mới thêm gần đây</option>
                  <option value="price-low">Giá: Thấp đến Cao</option>
                  <option value="price-high">Giá: Cao đến Thấp</option>
                  <option value="title-az">Tên khóa học (A-Z)</option>
                </select>
                <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-[18px] text-zinc-400 pointer-events-none">
                  arrow_drop_down
                </span>
              </div>

              {/* Grid / List View Toggle */}
              <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  title="Chế độ lưới"
                  className={`p-1 rounded-lg transition-all cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-[#1d1926] text-primary shadow-2xs'
                      : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">grid_view</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  title="Chế độ danh sách"
                  className={`p-1 rounded-lg transition-all cursor-pointer ${
                    viewMode === 'list'
                      ? 'bg-white dark:bg-[#1d1926] text-primary shadow-2xs'
                      : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">view_agenda</span>
                </button>
              </div>
            </div>
          </section>

          {/* 3. LOADING SKELETON */}
          {isLoading && (
            <div
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse'
                  : 'flex flex-col gap-4 animate-pulse'
              }
            >
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div
                  key={n}
                  className="bg-white dark:bg-[#1d1926] rounded-2xl p-4 border border-zinc-200/60 dark:border-[#2f2742] flex flex-col gap-3"
                >
                  <div className="w-full aspect-video bg-zinc-200 dark:bg-[#282136] rounded-xl" />
                  <div className="h-3 bg-zinc-200 dark:bg-[#282136] rounded w-1/3 mt-1" />
                  <div className="h-5 bg-zinc-200 dark:bg-[#282136] rounded w-4/5" />
                  <div className="h-3 bg-zinc-200 dark:bg-[#282136] rounded w-2/5" />
                  <div className="h-9 bg-zinc-200 dark:bg-[#282136] rounded-xl w-full mt-2" />
                </div>
              ))}
            </div>
          )}

          {/* 4. ERROR & RETRY STATE */}
          {!isLoading && errorMessage && (
            <div className="rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/70 dark:border-rose-900/40 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-400 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[24px]">wifi_off</span>
                </div>
                <div>
                  <h3 className="font-heading font-bold text-sm text-zinc-900 dark:text-zinc-100">
                    Không thể tải danh sách khóa học yêu thích
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {errorMessage}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRetry}
                className="px-4 py-2 rounded-xl bg-white dark:bg-[#1d1926] border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 text-xs font-semibold shadow-2xs flex items-center gap-1.5 shrink-0 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">refresh</span>
                <span>Thử lại ngay</span>
              </button>
            </div>
          )}

          {/* 5. EMPTY STATE */}
          {!isLoading && !errorMessage && processedCourses.length === 0 && (
            <div className="rounded-2xl bg-white dark:bg-[#1d1926] border border-dashed border-zinc-200 dark:border-[#2f2742] p-12 flex flex-col items-center justify-center text-center max-w-xl mx-auto w-full">
              <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-[#2b1820] border border-rose-100 dark:border-rose-900/40 flex items-center justify-center text-[#ba1a1a] mb-3">
                <span className="material-symbols-outlined text-[32px]">favorite_border</span>
              </div>
              <h3 className="font-heading font-bold text-base text-zinc-900 dark:text-zinc-100">
                {searchQuery
                  ? 'Không tìm thấy khóa học phù hợp'
                  : 'Chưa có khóa học yêu thích nào'}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mt-1 mb-5 leading-relaxed">
                {searchQuery
                  ? 'Thử thay đổi từ khóa tìm kiếm để hiển thị các khóa học đã lưu.'
                  : 'Hãy khám phá các khóa học hấp dẫn tại TMdemy và nhấn nút Trái tim để lưu lại theo dõi!'}
              </p>

              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="px-4 py-2 rounded-xl bg-primary hover:bg-[#8b5ad3] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-primary/20 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                  <span>Xóa từ khóa</span>
                </button>
              ) : (
                <Link
                  href="/courses"
                  className="px-5 py-2.5 rounded-xl bg-[#7240b8] hover:bg-[#8b5ad3] text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-[#7240b8]/20 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">explore</span>
                  <span>Khám phá khóa học ngay</span>
                </Link>
              )}
            </div>
          )}

          {/* 6. POPULATED GRID / LIST OF FAVORITES */}
          {!isLoading && !errorMessage && processedCourses.length > 0 && (
            <section
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                  : 'flex flex-col gap-4'
              }
            >
              {processedCourses.map((fav) => {
                const courseData = mapFavoriteToCourse(fav);
                const courseId = fav.courseId || fav.course?.id || fav.course?._id || '';

                return (
                  <div key={fav.id || fav._id || courseId} className="relative group">
                    <CourseCard
                      course={courseData}
                      viewMode={viewMode}
                      isFavorited={true}
                      onToggleFavorite={() => {
                        if (courseId) {
                          void handleRemoveFavorite(courseId);
                        }
                      }}
                    />
                  </div>
                );
              })}
            </section>
          )}

          {/* 7. PAGINATION (If totalPages > 1) */}
          {!isLoading && !errorMessage && totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                type="button"
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage <= 1}
                className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-[#1d1926] border border-zinc-200 dark:border-[#2f2742] text-xs font-semibold text-zinc-700 dark:text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                <span>Trước</span>
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => handlePageChange(pageNum)}
                  className={`w-8 h-8 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    currentPage === pageNum
                      ? 'bg-primary text-white shadow-xs'
                      : 'bg-white dark:bg-[#1d1926] border border-zinc-200 dark:border-[#2f2742] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                  }`}
                >
                  {pageNum}
                </button>
              ))}

              <button
                type="button"
                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage >= totalPages}
                className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-[#1d1926] border border-zinc-200 dark:border-[#2f2742] text-xs font-semibold text-zinc-700 dark:text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>Sau</span>
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </button>
            </div>
          )}
        </div>
      </AppShell>
    </RouteGuard>
  );
}
