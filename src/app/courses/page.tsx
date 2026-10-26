'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { CourseCard } from '@/components/course/course-card';
import { Course, mapApiCourseToCourse, GetCoursesParams } from '@/types/course';
import { courseService } from '@/services/course.service';
import { categoryService } from '@/services/category.service';

interface CategoryPill {
  id: string;
  label: string;
}

export default function CourseListingPage() {
  // Course State
  const [courses, setCourses] = useState<Course[]>([]);
  const [totalCourses, setTotalCourses] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Categories State
  const [categories, setCategories] = useState<CategoryPill[]>([
    { id: 'all', label: 'Tất cả khóa học' },
  ]);
  const [, startTransition] = useTransition();

  // Filter States
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedPriceType, setSelectedPriceType] = useState<string>('all');
  const [selectedRating, setSelectedRating] = useState<number | 'all'>('all');
  const [selectedDurationRange, setSelectedDurationRange] = useState<string>('all');
  const [sortBy, setSortBy] = useState('popular');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 9;

  /**
   * Fetch categories from backend API on mount
   * GET /api/categories/
   */
  useEffect(() => {
    let isMounted = true;
    async function loadCategories() {
      try {
        const response = await categoryService.getCategories({ limit: 100 });
        if (isMounted && response.success && response.data?.categories) {
          const apiCats: CategoryPill[] = response.data.categories.map((c) => ({
            id: c.id || c._id || c.slug,
            label: c.name,
          }));
          setCategories([{ id: 'all', label: 'Tất cả khóa học' }, ...apiCats]);
        }
      } catch {
        // Fallback to static category labels if category fetch fails
      }
    }
    loadCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * Debounce search input by ~700ms:
   * When user types, wait ~700ms after the last keystroke before sending API request.
   * If user continues typing within 700ms, timer is reset.
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = searchInput.trim();
      if (trimmed !== searchTerm) {
        setIsLoading(true);
        setCurrentPage(1);
        setSearchTerm(trimmed);
      }
    }, 700);

    return () => {
      clearTimeout(timer);
    };
  }, [searchInput, searchTerm]);

  /**
   * Fetch courses from backend API whenever query parameters change
   * Includes AbortController and isCurrent check to eliminate race conditions
   * GET /api/courses/
   */
  useEffect(() => {
    let isCurrent = true;
    const abortController = new AbortController();

    async function loadCourses() {
      try {
        const params: GetCoursesParams = {
          page: currentPage,
          limit: pageSize,
        };

        if (searchTerm.trim()) {
          params.search = searchTerm.trim();
        }

        if (selectedCategory && selectedCategory !== 'all') {
          params.category = selectedCategory;
        }

        if (selectedLevel && selectedLevel !== 'all') {
          params.level = selectedLevel as 'beginner' | 'intermediate' | 'advanced';
        }

        if (selectedPriceType === 'paid') {
          params.type = 'paid';
        } else if (selectedPriceType === 'free') {
          params.type = 'free';
        }

        if (selectedRating !== 'all') {
          params.minRating = selectedRating;
        }

        if (selectedDurationRange !== 'all') {
          params.durationRange = selectedDurationRange;
          if (selectedDurationRange === 'lt-5') {
            params.durationMin = 1;
          }
        }

        // Map UI sort option to backend API contract sortBy
        if (sortBy === 'popular') {
          params.sortBy = 'sold';
        } else if (sortBy === 'view') {
          params.sortBy = 'view';
        } else if (sortBy === 'newest') {
          params.sortBy = 'createdAt';
        } else if (sortBy === 'price-asc') {
          params.sortBy = 'price';
        } else if (sortBy === 'rating') {
          params.sortBy = 'rating';
        }

        const response = await courseService.getCourses(params, { signal: abortController.signal });

        if (isCurrent) {
          if (response.success && response.data) {
            const items = response.data.courses || [];
            const mapped = items.map(mapApiCourseToCourse);
            setCourses(mapped);
            setTotalCourses(response.data.pagination?.total || mapped.length);
            setTotalPages(Math.max(1, response.data.pagination?.totalPages || 1));
          } else {
            setCourses([]);
            setTotalCourses(0);
            setTotalPages(1);
          }
          setIsLoading(false);
        }
      } catch (err: unknown) {
        if (!isCurrent) return;
        // Ignore AbortError caused by cancellation of older request
        if (err instanceof Error && err.name === 'AbortError') return;

        const message =
          err instanceof Error ? err.message : 'Không thể tải danh sách khóa học. Vui lòng thử lại sau.';
        setError(message);
        setCourses([]);
        setIsLoading(false);
      }
    }

    loadCourses();

    return () => {
      isCurrent = false;
      abortController.abort();
    };
  }, [
    currentPage,
    pageSize,
    searchTerm,
    selectedCategory,
    selectedLevel,
    selectedPriceType,
    selectedRating,
    selectedDurationRange,
    sortBy,
  ]);

  // Handlers
  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = searchInput.trim();
    if (trimmed !== searchTerm) {
      setIsLoading(true);
      setCurrentPage(1);
      setSearchTerm(trimmed);
    }
  };

  const handleClearSearch = () => {
    setIsLoading(true);
    setSearchInput('');
    setSearchTerm('');
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setIsLoading(true);
    setSearchInput('');
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedLevel('all');
    setSelectedPriceType('all');
    setSelectedRating('all');
    setSelectedDurationRange('all');
    setSortBy('popular');
    setCurrentPage(1);
  };

  const handleCategorySelect = (catId: string) => {
    startTransition(() => {
      setIsLoading(true);
      setSelectedCategory(catId);
      setCurrentPage(1);
    });
  };

  const handleLevelSelect = (level: string) => {
    setIsLoading(true);
    setSelectedLevel((prev) => (prev === level ? 'all' : level));
    setCurrentPage(1);
  };

  const handlePriceTypeSelect = (type: string) => {
    setIsLoading(true);
    setSelectedPriceType((prev) => (prev === type ? 'all' : type));
    setCurrentPage(1);
  };

  const handleRatingSelect = (rateVal: number) => {
    setIsLoading(true);
    setSelectedRating((prev) => (prev === rateVal ? 'all' : rateVal));
    setCurrentPage(1);
  };

  const handleDurationRangeSelect = (rangeId: string) => {
    setIsLoading(true);
    setSelectedDurationRange((prev) => (prev === rangeId ? 'all' : rangeId));
    setCurrentPage(1);
  };

  const handleSortChange = (newSort: string) => {
    setIsLoading(true);
    setSortBy(newSort);
    setCurrentPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setIsLoading(true);
    setCurrentPage(newPage);
  };

  const handleRetry = () => {
    setIsLoading(true);
    setError(null);
    setCurrentPage((prev) => prev);
  };

  // Calculate results range display
  const startItem = totalCourses === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalCourses);

  return (
    <AppShell>
      <div className="max-w-[1440px] w-full mx-auto px-4 md:px-6 py-6 flex flex-col gap-6">
        {/* 1. Header & Exploration Hero Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#ebe5ff] via-[#f7f1ff] to-[#f1ebff] dark:from-[#1d1926] dark:via-[#221d2d] dark:to-[#17141f] p-6 md:p-8 shadow-xs border border-[#f1ebff] dark:border-[#352e43]">
          <div className="absolute -right-12 -top-12 w-96 h-96 rounded-full bg-[#7240b8]/10 dark:bg-[#a87ffb]/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[#7240b8]/15 dark:bg-[#a87ffb]/20 text-[#7240b8] dark:text-[#a87ffb] text-[11px] font-bold tracking-wide uppercase">
                  Hệ sinh thái TMdemy
                </span>
                <span className="text-[#635a72] dark:text-[#a9a0b2] text-xs">• Cập nhật trực tiếp từ hệ thống</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#1c192c] dark:text-[#f4eeff] tracking-tight">
                Khám phá khóa học
              </h1>
              <p className="text-sm md:text-base text-[#4b4452] dark:text-[#cdc3d4] mt-2 leading-relaxed">
                Nâng cao kỹ năng chuyên môn với hơn{' '}
                <span className="text-[#7240b8] dark:text-[#a87ffb] font-bold">
                  {totalCourses > 0 ? `${totalCourses}+` : '300+'} khóa học chất lượng cao
                </span>{' '}
                được thiết kế bài bản từ các giảng viên đại học và chuyên gia công nghệ hàng đầu.
              </p>
            </div>

            {/* Live Quick Stats Badge */}
            <div className="flex items-center gap-4 bg-white/80 dark:bg-[#1d1926]/90 backdrop-blur-md px-4 py-3 rounded-xl shadow-xs border border-[#f1ebff] dark:border-[#352e43]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#00855b]/20 flex items-center justify-center text-[#006947] dark:text-[#6ffbbe]">
                  <span className="material-symbols-outlined text-[18px]">verified_user</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-[#1c192c] dark:text-[#f4eeff] leading-tight">100%</span>
                  <span className="text-[11px] text-[#635a72] dark:text-[#a9a0b2]">Chứng chỉ chuẩn</span>
                </div>
              </div>

              <div className="h-8 w-px bg-[#cdc3d4]/40 dark:bg-[#352e43]" />

              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#7240b8]/10 dark:bg-[#a87ffb]/20 flex items-center justify-center text-[#7240b8] dark:text-[#a87ffb]">
                  <span className="material-symbols-outlined text-[18px]">menu_book</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-[#1c192c] dark:text-[#f4eeff] leading-tight">
                    {totalCourses}
                  </span>
                  <span className="text-[11px] text-[#635a72] dark:text-[#a9a0b2]">Khóa học sẵn sàng</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Sticky Filter & Search Control Panel */}
        <div className="flex flex-col gap-4 bg-white dark:bg-[#1d1926] p-4 md:p-5 rounded-2xl shadow-xs border border-[#f1ebff] dark:border-[#352e43]">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            {/* Search Bar with Debounce indicator & Clear Button */}
            <form onSubmit={handleSearchSubmit} className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7c7483] dark:text-[#968e9e] text-[20px]">
                search
              </span>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Tìm theo tên khóa học (React, Python, Machine Learning, Web...)"
                className="w-full h-11 pl-11 pr-28 bg-[#f7f1ff] dark:bg-[#221d2d] rounded-lg text-xs md:text-sm text-[#1c192c] dark:text-[#f4eeff] placeholder:text-[#7c7483] dark:placeholder:text-[#968e9e] focus:outline-none focus:bg-white dark:focus:bg-[#1d1926] focus:ring-1 focus:ring-[#7240b8] dark:focus:ring-[#a87ffb] transition-all border border-transparent dark:border-[#352e43] focus:border-[#7240b8]/30"
              />
              {/* Typing Debounce Indicator (Wait ~700ms) */}
              {searchInput.trim() !== searchTerm && (
                <span
                  title="Đang đợi dừng gõ..."
                  className="material-symbols-outlined absolute right-24 top-1/2 -translate-y-1/2 text-[#7240b8] dark:text-[#a87ffb] animate-spin text-[16px] pointer-events-none"
                >
                  progress_activity
                </span>
              )}
              {/* Clear search button when input has text and not actively debouncing */}
              {searchInput && searchInput.trim() === searchTerm && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-24 top-1/2 -translate-y-1/2 p-1 text-[#7c7483] dark:text-[#968e9e] hover:text-[#1c192c] dark:hover:text-[#f4eeff] cursor-pointer"
                  aria-label="Xóa nội dung tìm kiếm"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              )}
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-md bg-[#ebe5ff] dark:bg-[#2b2438] text-[#4b4452] dark:text-[#cdc3d4] hover:text-[#7240b8] dark:hover:text-[#a87ffb] text-xs font-bold transition-colors cursor-pointer"
              >
                Tìm kiếm
              </button>
            </form>

            {/* Sort Dropdown & View Mode Switcher */}
            <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
              <div className="flex items-center gap-2 min-w-[200px]">
                <span className="text-xs font-semibold text-[#635a72] dark:text-[#cdc3d4] whitespace-nowrap">Sắp xếp:</span>
                <div className="relative w-full">
                  <select
                    value={sortBy}
                    onChange={(e) => handleSortChange(e.target.value)}
                    className="w-full h-11 pl-3.5 pr-8 bg-[#f7f1ff] dark:bg-[#221d2d] text-[#1c192c] dark:text-[#f4eeff] text-xs font-medium rounded-lg appearance-none cursor-pointer focus:outline-none focus:bg-white dark:focus:bg-[#1d1926] border border-transparent dark:border-[#352e43] focus:border-[#7240b8]/30"
                  >
                    <option value="popular">Bán chạy nhất (Phổ biến)</option>
                    <option value="rating">Đánh giá cao nhất</option>
                    <option value="view">Lượt xem nhiều nhất</option>
                    <option value="newest">Mới nhất</option>
                    <option value="price-asc">Giá</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-[#635a72] dark:text-[#cdc3d4] pointer-events-none text-[18px]">
                    expand_more
                  </span>
                </div>
              </div>

              {/* View Layout Toggle */}
              <div className="flex items-center bg-[#f7f1ff] dark:bg-[#221d2d] p-1 rounded-lg">
                <button
                  onClick={() => setViewMode('grid')}
                  aria-label="Xem dạng lưới"
                  className={`p-2 rounded transition-all cursor-pointer ${viewMode === 'grid'
                    ? 'bg-white dark:bg-[#2b2438] text-[#7240b8] dark:text-[#a87ffb] shadow-2xs font-bold'
                    : 'text-[#635a72] dark:text-[#cdc3d4] hover:text-[#1c192c] dark:hover:text-[#f4eeff]'
                    }`}
                >
                  <span className="material-symbols-outlined text-[18px] block">grid_view</span>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  aria-label="Xem dạng danh sách"
                  className={`p-2 rounded transition-all cursor-pointer ${viewMode === 'list'
                    ? 'bg-white dark:bg-[#2b2438] text-[#7240b8] dark:text-[#a87ffb] shadow-2xs font-bold'
                    : 'text-[#635a72] dark:text-[#cdc3d4] hover:text-[#1c192c] dark:hover:text-[#f4eeff]'
                    }`}
                >
                  <span className="material-symbols-outlined text-[18px] block">view_list</span>
                </button>
              </div>
            </div>
          </div>

          {/* Category Filter Pills Carousel */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar text-nowrap">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat.id)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${isActive
                    ? 'bg-[#7240b8] dark:bg-[#a87ffb] text-white dark:text-[#1c192c] shadow-2xs scale-[1.02]'
                    : 'bg-[#f7f1ff] dark:bg-[#221d2d] hover:bg-[#ebe5ff] dark:hover:bg-[#2b2438] text-[#4b4452] dark:text-[#cdc3d4] hover:text-[#7240b8] dark:hover:text-[#a87ffb]'
                    }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Main Workspace: Sidebar Filters + Course Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Filter Sidebar (3 cols) */}
          <aside className="lg:col-span-3 w-full bg-white dark:bg-[#1d1926] p-5 rounded-2xl shadow-xs border border-[#f1ebff] dark:border-[#352e43] flex flex-col gap-4 sticky top-20">
            <div className="flex items-center justify-between pb-3 border-b border-[#f7f1ff] dark:border-[#2b2438]">
              <div className="flex items-center gap-2 text-[#1c192c] dark:text-[#f4eeff] text-sm font-bold">
                <span className="material-symbols-outlined text-[20px] text-[#7240b8] dark:text-[#a87ffb]">tune</span>
                <span>Bộ lọc nâng cao</span>
              </div>
              <button
                onClick={handleResetFilters}
                className="text-xs text-[#7240b8] dark:text-[#a87ffb] hover:underline font-bold cursor-pointer"
              >
                Đặt lại
              </button>
            </div>

            {/* Filter Section: Level */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-[#1c192c] dark:text-[#f4eeff] uppercase tracking-wider">
                Trình độ
              </span>
              <div className="flex flex-col gap-2 mt-0.5">
                {[
                  { id: 'all', label: 'Tất cả trình độ' },
                  { id: 'beginner', label: 'Mới bắt đầu' },
                  { id: 'intermediate', label: 'Trung cấp' },
                  { id: 'advanced', label: 'Nâng cao' },
                ].map((item) => (
                  <label
                    key={item.id}
                    className="flex items-center justify-between text-xs text-[#4b4452] dark:text-[#cdc3d4] hover:text-[#1c192c] dark:hover:text-[#f4eeff] cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="level-filter"
                        checked={selectedLevel === item.id}
                        onChange={() => handleLevelSelect(item.id)}
                        className="w-4 h-4 text-[#7240b8] focus:ring-0 cursor-pointer accent-[#7240b8]"
                      />
                      <span>{item.label}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="h-px bg-[#f7f1ff] dark:bg-[#2b2438]" />

            {/* Filter Section: Price Type */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-[#1c192c] dark:text-[#f4eeff] uppercase tracking-wider">
                Hình thức giá
              </span>
              <div className="flex flex-col gap-2 mt-0.5">
                {[
                  { id: 'all', label: 'Tất cả' },
                  { id: 'free', label: 'Miễn phí' },
                  { id: 'paid', label: 'Có phí' },
                ].map((item) => (
                  <label
                    key={item.id}
                    className="flex items-center justify-between text-xs text-[#4b4452] dark:text-[#cdc3d4] hover:text-[#1c192c] dark:hover:text-[#f4eeff] cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="price-type-filter"
                        checked={selectedPriceType === item.id}
                        onChange={() => handlePriceTypeSelect(item.id)}
                        className="w-4 h-4 text-[#7240b8] focus:ring-0 cursor-pointer accent-[#7240b8]"
                      />
                      <span>{item.label}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="h-px bg-[#f7f1ff] dark:bg-[#2b2438]" />

            {/* Filter Section: Rating */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#1c192c] dark:text-[#f4eeff] uppercase tracking-wider">
                  Đánh giá
                </span>
                {selectedRating !== 'all' && (
                  <button
                    type="button"
                    onClick={() => handleRatingSelect(selectedRating)}
                    className="text-[11px] text-[#7240b8] dark:text-[#a87ffb] hover:underline cursor-pointer font-medium"
                  >
                    Bỏ chọn
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-2 mt-0.5">
                {[
                  { val: 4.5, label: 'Từ 4.5 sao trở lên' },
                  { val: 4.0, label: 'Từ 4.0 sao trở lên' },
                  { val: 3.0, label: 'Từ 3.0 sao trở lên' },
                ].map((item) => (
                  <label
                    key={item.val}
                    className="flex items-center justify-between text-xs text-[#4b4452] dark:text-[#cdc3d4] hover:text-[#1c192c] dark:hover:text-[#f4eeff] cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="rating-filter"
                        checked={selectedRating === item.val}
                        onChange={() => handleRatingSelect(item.val)}
                        className="w-4 h-4 text-[#7240b8] focus:ring-0 cursor-pointer accent-[#7240b8]"
                      />
                      <div className="flex items-center gap-1 text-amber-500">
                        <span
                          className="material-symbols-outlined text-[15px]"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          star
                        </span>
                        <span className="text-xs text-[#4b4452] dark:text-[#cdc3d4]">{item.label}</span>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="h-px bg-[#f7f1ff] dark:bg-[#2b2438]" />

            {/* Filter Section: Duration */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#1c192c] dark:text-[#f4eeff] uppercase tracking-wider">
                  Thời lượng học
                </span>
                {selectedDurationRange !== 'all' && (
                  <button
                    type="button"
                    onClick={() => handleDurationRangeSelect(selectedDurationRange)}
                    className="text-[11px] text-[#7240b8] dark:text-[#a87ffb] hover:underline cursor-pointer font-medium"
                  >
                    Bỏ chọn
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-2 mt-0.5">
                {[
                  { id: 'lt-5', label: 'Dưới 5 giờ' },
                  { id: '5-15', label: '5 - 15 giờ' },
                  { id: 'gt-15', label: 'Trên 15 giờ' },
                ].map((item) => (
                  <label
                    key={item.id}
                    className="flex items-center justify-between text-xs text-[#4b4452] dark:text-[#cdc3d4] hover:text-[#1c192c] dark:hover:text-[#f4eeff] cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="duration-filter"
                        checked={selectedDurationRange === item.id}
                        onChange={() => handleDurationRangeSelect(item.id)}
                        className="w-4 h-4 text-[#7240b8] focus:ring-0 cursor-pointer accent-[#7240b8]"
                      />
                      <span>{item.label}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="h-px bg-[#f7f1ff] dark:bg-[#2b2438]" />
          </aside>

          {/* Main Course Grid (9 cols) */}
          <section className="lg:col-span-9 flex flex-col gap-6">
            {/* Results summary bar */}
            <div className="flex items-center justify-between px-1 flex-wrap gap-2">
              <span className="text-xs md:text-sm text-[#635a72] dark:text-[#a9a0b2]">
                Hiển thị <span className="font-bold text-[#1c192c] dark:text-[#f4eeff]">{startItem} - {endItem}</span> trong{' '}
                <span className="font-bold text-[#1c192c] dark:text-[#f4eeff]">{totalCourses}</span> khóa học phù hợp
              </span>

              {/* Active Filter Chips */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {searchTerm && (
                  <span className="px-2.5 py-0.5 rounded-md bg-[#ebe5ff] dark:bg-[#2b2438] text-[#1c192c] dark:text-[#f4eeff] text-xs font-medium flex items-center gap-1">
                    <span>Tìm: &ldquo;{searchTerm}&rdquo;</span>
                    <button
                      onClick={handleClearSearch}
                      aria-label="Xóa từ khóa tìm kiếm"
                      className="material-symbols-outlined text-[14px] hover:text-[#ba1a1a] cursor-pointer"
                    >
                      close
                    </button>
                  </span>
                )}
                {selectedCategory !== 'all' && (
                  <span className="px-2.5 py-0.5 rounded-md bg-[#ebe5ff] dark:bg-[#2b2438] text-[#1c192c] dark:text-[#f4eeff] text-xs font-medium flex items-center gap-1">
                    <span>
                      {categories.find((c) => c.id === selectedCategory)?.label || 'Danh mục'}
                    </span>
                    <button
                      onClick={() => setSelectedCategory('all')}
                      aria-label="Xóa bộ lọc danh mục"
                      className="material-symbols-outlined text-[14px] hover:text-[#ba1a1a] cursor-pointer"
                    >
                      close
                    </button>
                  </span>
                )}
                {selectedLevel !== 'all' && (
                  <span className="px-2.5 py-0.5 rounded-md bg-[#ebe5ff] dark:bg-[#2b2438] text-[#1c192c] dark:text-[#f4eeff] text-xs font-medium flex items-center gap-1">
                    <span>
                      {selectedLevel === 'beginner'
                        ? 'Mới bắt đầu'
                        : selectedLevel === 'intermediate'
                          ? 'Trung cấp'
                          : 'Nâng cao'}
                    </span>
                    <button
                      onClick={() => setSelectedLevel('all')}
                      aria-label="Xóa bộ lọc trình độ"
                      className="material-symbols-outlined text-[14px] hover:text-[#ba1a1a] cursor-pointer"
                    >
                      close
                    </button>
                  </span>
                )}
                {selectedPriceType !== 'all' && (
                  <span className="px-2.5 py-0.5 rounded-md bg-[#ebe5ff] dark:bg-[#2b2438] text-[#1c192c] dark:text-[#f4eeff] text-xs font-medium flex items-center gap-1">
                    <span>{selectedPriceType === 'free' ? 'Miễn phí' : 'Có phí'}</span>
                    <button
                      onClick={() => setSelectedPriceType('all')}
                      aria-label="Xóa bộ lọc giá"
                      className="material-symbols-outlined text-[14px] hover:text-[#ba1a1a] cursor-pointer"
                    >
                      close
                    </button>
                  </span>
                )}
                {selectedRating !== 'all' && (
                  <span className="px-2.5 py-0.5 rounded-md bg-[#ebe5ff] dark:bg-[#2b2438] text-[#1c192c] dark:text-[#f4eeff] text-xs font-medium flex items-center gap-1.5">
                    <span className="flex items-center gap-1">
                      <span
                        className="material-symbols-outlined text-[13px] text-amber-500"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        star
                      </span>
                      <span>Từ {selectedRating} sao</span>
                    </span>
                    <button
                      onClick={() => setSelectedRating('all')}
                      aria-label="Xóa bộ lọc đánh giá"
                      className="material-symbols-outlined text-[14px] hover:text-[#ba1a1a] cursor-pointer"
                    >
                      close
                    </button>
                  </span>
                )}
                {selectedDurationRange !== 'all' && (
                  <span className="px-2.5 py-0.5 rounded-md bg-[#ebe5ff] dark:bg-[#2b2438] text-[#1c192c] dark:text-[#f4eeff] text-xs font-medium flex items-center gap-1.5">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px] text-[#7240b8] dark:text-[#a87ffb]">
                        schedule
                      </span>
                      <span>
                        {selectedDurationRange === 'lt-5'
                          ? 'Dưới 5 giờ'
                          : selectedDurationRange === '5-15'
                            ? '5 - 15 giờ'
                            : 'Trên 15 giờ'}
                      </span>
                    </span>
                    <button
                      onClick={() => setSelectedDurationRange('all')}
                      aria-label="Xóa bộ lọc thời lượng"
                      className="material-symbols-outlined text-[14px] hover:text-[#ba1a1a] cursor-pointer"
                    >
                      close
                    </button>
                  </span>
                )}
              </div>
            </div>

            {/* Error State */}
            {!isLoading && error && (
              <div className="w-full flex flex-col items-center justify-center p-12 bg-white dark:bg-[#1d1926] rounded-2xl border border-[#f1ebff] dark:border-[#352e43] text-center shadow-xs">
                <div className="w-16 h-16 rounded-full bg-[#fee2e2] dark:bg-[#ffdad6]/20 text-[#ba1a1a] dark:text-[#ffb4ab] flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-[32px]">error_outline</span>
                </div>
                <h3 className="text-base font-bold text-[#1c192c] dark:text-[#f4eeff] mb-1">
                  Không thể kết nối đến máy chủ
                </h3>
                <p className="text-xs md:text-sm text-[#635a72] dark:text-[#a9a0b2] max-w-md mb-6 leading-relaxed">
                  {error}
                </p>
                <button
                  onClick={handleRetry}
                  className="px-5 py-2.5 rounded-xl bg-[#7240b8] dark:bg-[#a87ffb] text-white dark:text-[#1c192c] text-xs font-bold hover:bg-[#8352ca] dark:hover:bg-[#b996ff] transition-all shadow-xs flex items-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">refresh</span>
                  <span>Thử lại</span>
                </button>
              </div>
            )}

            {/* Loading State: Skeletons */}
            {isLoading && (
              <div
                className={`grid gap-6 ${viewMode === 'grid'
                  ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
                  : 'grid-cols-1'
                  }`}
              >
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div
                    key={idx}
                    className={`bg-white dark:bg-[#1d1926] rounded-xl overflow-hidden border border-[#f1ebff] dark:border-[#352e43] animate-pulse ${viewMode === 'list' ? 'flex flex-col sm:flex-row' : 'flex flex-col'
                      }`}
                  >
                    <div
                      className={`bg-[#f0ebf8] dark:bg-[#2b2438] ${viewMode === 'list'
                        ? 'w-full sm:w-72 h-44 shrink-0'
                        : 'w-full aspect-[16/9]'
                        }`}
                    />
                    <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-3">
                      <div className="flex flex-col gap-2">
                        <div className="h-4 bg-[#f0ebf8] dark:bg-[#2b2438] rounded w-1/4" />
                        <div className="h-5 bg-[#f0ebf8] dark:bg-[#2b2438] rounded w-3/4" />
                        <div className="h-4 bg-[#f0ebf8] dark:bg-[#2b2438] rounded w-1/3" />
                      </div>
                      <div className="pt-3 border-t border-[#f7f1ff] dark:border-[#2b2438] flex justify-between items-center">
                        <div className="h-5 bg-[#f0ebf8] dark:bg-[#2b2438] rounded w-1/4" />
                        <div className="h-8 bg-[#f0ebf8] dark:bg-[#2b2438] rounded w-24" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!isLoading && !error && courses.length === 0 && (
              <div className="w-full flex flex-col items-center justify-center p-12 bg-white dark:bg-[#1d1926] rounded-2xl border border-[#f1ebff] dark:border-[#352e43] text-center shadow-xs">
                <div className="w-16 h-16 rounded-full bg-[#f7f1ff] dark:bg-[#221d2d] text-[#7240b8] dark:text-[#a87ffb] flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-[36px]">search_off</span>
                </div>
                <h3 className="text-base font-bold text-[#1c192c] dark:text-[#f4eeff] mb-1">
                  Không tìm thấy khóa học nào
                </h3>
                <p className="text-xs md:text-sm text-[#635a72] dark:text-[#a9a0b2] max-w-md mb-6 leading-relaxed">
                  Không có khóa học nào khớp với bộ lọc hoặc từ khóa tìm kiếm của bạn. Hãy thử thay đổi tiêu chí hoặc đặt lại bộ lọc.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="px-5 py-2.5 rounded-xl bg-[#7240b8] dark:bg-[#a87ffb] text-white dark:text-[#1c192c] text-xs font-bold hover:bg-[#8352ca] dark:hover:bg-[#b996ff] transition-all shadow-xs flex items-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">restart_alt</span>
                  <span>Đặt lại toàn bộ bộ lọc</span>
                </button>
              </div>
            )}

            {/* Success State: Course Cards */}
            {!isLoading && !error && courses.length > 0 && (
              <div
                className={`grid gap-6 ${viewMode === 'grid'
                  ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
                  : 'grid-cols-1'
                  }`}
              >
                {courses.map((course) => (
                  <CourseCard key={course.id} course={course} viewMode={viewMode} />
                ))}
              </div>
            )}

            {/* Bottom Pagination Bar */}
            {!isLoading && !error && totalPages > 1 && (
              <div className="mt-2 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-[#1d1926] p-4 rounded-xl shadow-xs border border-[#f1ebff] dark:border-[#352e43]">
                <div className="text-xs text-[#635a72] dark:text-[#a9a0b2]">
                  Trang <span className="font-bold text-[#1c192c] dark:text-[#f4eeff]">{currentPage}</span> trên{' '}
                  <span className="font-bold text-[#1c192c] dark:text-[#f4eeff]">{totalPages}</span> trang
                </div>

                <nav aria-label="Phân trang danh mục" className="flex items-center gap-1 select-none">
                  <button
                    aria-label="Trang trước"
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-[#7c7483] dark:text-[#a9a0b2] disabled:opacity-40 disabled:cursor-not-allowed bg-[#f7f1ff] dark:bg-[#221d2d] hover:bg-[#ebe5ff] dark:hover:bg-[#2b2438] transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                  </button>

                  {Array.from({ length: Math.min(5, totalPages) }).map((_, idx) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = idx + 1;
                    } else if (currentPage <= 3) {
                      pageNum = idx + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + idx;
                    } else {
                      pageNum = currentPage - 2 + idx;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold transition-all cursor-pointer ${currentPage === pageNum
                          ? 'bg-[#7240b8] dark:bg-[#a87ffb] text-white dark:text-[#1c192c] shadow-2xs'
                          : 'text-[#1c192c] dark:text-[#f4eeff] hover:bg-[#f7f1ff] dark:hover:bg-[#221d2d]'
                          }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <>
                      <span className="px-2 text-[#7c7483] dark:text-[#968e9e] font-bold text-xs">...</span>
                      <button
                        onClick={() => handlePageChange(totalPages)}
                        className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold transition-all cursor-pointer ${currentPage === totalPages
                          ? 'bg-[#7240b8] dark:bg-[#a87ffb] text-white dark:text-[#1c192c] shadow-2xs'
                          : 'text-[#1c192c] dark:text-[#f4eeff] hover:bg-[#f7f1ff] dark:hover:bg-[#221d2d]'
                          }`}
                      >
                        {totalPages}
                      </button>
                    </>
                  )}

                  <button
                    aria-label="Trang sau"
                    disabled={currentPage === totalPages}
                    onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-[#4b4452] dark:text-[#cdc3d4] disabled:opacity-40 disabled:cursor-not-allowed hover:text-[#7240b8] dark:hover:text-[#a87ffb] hover:bg-[#f7f1ff] dark:hover:bg-[#221d2d] transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                  </button>
                </nav>

                <div className="hidden sm:flex items-center gap-2">
                  <span className="text-xs text-[#635a72] dark:text-[#a9a0b2]">Đến trang:</span>
                  <input
                    type="number"
                    min="1"
                    max={totalPages}
                    value={currentPage}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (val >= 1 && val <= totalPages) handlePageChange(val);
                    }}
                    className="w-12 h-8 text-center bg-[#f7f1ff] dark:bg-[#221d2d] rounded text-xs text-[#1c192c] dark:text-[#f4eeff] focus:outline-none focus:ring-1 focus:ring-[#7240b8] dark:focus:ring-[#a87ffb] border border-transparent dark:border-[#352e43]"
                  />
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </AppShell>
  );
}
