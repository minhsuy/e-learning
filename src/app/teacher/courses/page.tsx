'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  BookOpen,
  Plus,
  Search,
  CheckCircle2,
  Hourglass,
  DollarSign,
  Edit,
  MenuSquare,
  Trash2,
  Users,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  BarChart3,
} from 'lucide-react';
import { TeacherCourseItem } from '@/types/course';
import { courseService } from '@/services/course.service';
import { teacherStatisticsService } from '@/services/teacher-statistics.service';
import { TeacherOverviewData } from '@/types/teacher-statistics';
import { CourseStatusBadge } from '@/components/teacher/courses/course-status-badge';
import { CourseDeleteModal } from '@/components/teacher/courses/course-delete-modal';
import { toast } from '@/lib/toast';

export default function TeacherCoursesPage() {
  const searchParams = useSearchParams();

  // State from URL or defaults
  const pageParam = Number(searchParams.get('page')) || 1;
  const statusParam = searchParams.get('status') || 'all';
  const searchQueryParam = searchParams.get('search') || '';

  const [courses, setCourses] = useState<TeacherCourseItem[]>([]);
  const [pagination, setPagination] = useState({
    page: pageParam,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const [statusFilter, setStatusFilter] = useState<string>(statusParam);
  const [searchInput, setSearchInput] = useState<string>(searchQueryParam);
  const [activeSearch, setActiveSearch] = useState<string>(searchQueryParam);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [reloadTrigger, setReloadTrigger] = useState<number>(0);
  const [overviewStats, setOverviewStats] = useState<TeacherOverviewData | null>(null);

  // Course deletion state
  const [deletingCourse, setDeletingCourse] = useState<TeacherCourseItem | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);

  // Statistics calculation for the 4-metric overview bar
  // Priority: Real statistics aggregated from backend API (teacherStatisticsService), fallback to current page calculation
  const totalCourses = overviewStats?.courses?.total ?? (pagination.total || courses.length);
  const approvedCount =
    overviewStats?.courses?.approved ??
    courses.filter((c) => (c.status || '').toLowerCase() === 'approved').length;
  const pendingCount =
    overviewStats?.courses?.pending ??
    courses.filter((c) => (c.status || '').toLowerCase() === 'pending').length;
  const totalRevenue =
    overviewStats?.revenue?.totalRevenue ??
    courses.reduce((sum, c) => {
      const sold = typeof c.sold === 'number' ? c.sold : 0;
      const price = typeof c.price === 'number' ? c.price : 0;
      return sum + sold * price;
    }, 0);

  // Fetch Teacher Overview KPIs
  useEffect(() => {
    let isMounted = true;
    const loadOverview = async () => {
      try {
        const res = await teacherStatisticsService.getOverview();
        if (isMounted && res.data) {
          setOverviewStats(res.data);
        }
      } catch (err: unknown) {
        console.warn('Failed to load teacher overview statistics:', err);
      }
    };

    loadOverview();

    return () => {
      isMounted = false;
    };
  }, [reloadTrigger]);

  // Fetch courses from API
  useEffect(() => {
    let isMounted = true;

    const loadCourses = async () => {
      try {
        const res = await courseService.getTeacherCourses({
          page: pagination.page,
          limit: pagination.limit,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          search: activeSearch.trim() || undefined,
        });

        if (!isMounted) return;

        if (res.data) {
          setCourses(res.data.courses || []);
          if (res.data.pagination) {
            setPagination(res.data.pagination);
          }
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        setIsError(true);
        const msg = err instanceof Error ? err.message : 'Không thể tải danh sách khóa học.';
        setErrorMessage(msg);
        toast.error(msg);
      } finally {
        if (!isMounted) return;
        setIsLoading(false);
      }
    };

    loadCourses();

    return () => {
      isMounted = false;
    };
  }, [pagination.page, pagination.limit, statusFilter, activeSearch, reloadTrigger]);

  // Handle Search Submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setActiveSearch(searchInput);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Handle Status Filter Change
  const handleStatusFilterChange = (status: string) => {
    setIsLoading(true);
    setStatusFilter(status);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Handle Page Change
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setIsLoading(true);
      setPagination((prev) => ({ ...prev, page: newPage }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Open Delete Modal
  const openDeleteModal = (course: TeacherCourseItem) => {
    setDeletingCourse(course);
    setIsDeleteModalOpen(true);
  };

  // On successful delete callback
  const handleCourseDeleted = (deletedId: string) => {
    setCourses((prev) => prev.filter((c) => c.id !== deletedId && c._id !== deletedId));

    // Xử lý pagination: nếu trang hiện tại không còn dữ liệu và đang ở trang > 1, quay về trang trước
    if (courses.length <= 1 && pagination.page > 1) {
      setIsLoading(true);
      setPagination((prev) => ({
        ...prev,
        page: prev.page - 1,
        total: Math.max(0, prev.total - 1),
      }));
    } else {
      // Đồng bộ lại danh sách và phân trang từ máy chủ
      setReloadTrigger((prev) => prev + 1);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      {/* Page Title & Action Bar */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#1c192c] dark:text-[#f4eeff]">
              Quản lý khóa học
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#f7f1ff] dark:bg-[#282234] text-[#7240b8] dark:text-[#a87ffb] border border-[#eceaf3] dark:border-[#352e43]">
              {totalCourses} Khóa học
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#635a72] dark:text-[#a9a0b2] mt-1">
            Tạo mới, chỉnh sửa nội dung giáo trình và theo dõi trạng thái phê duyệt các khóa học của bạn.
          </p>
        </div>

        <Link
          href="/teacher/courses/new"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#7240b8] hover:bg-[#5e3299] text-white text-xs sm:text-sm font-semibold shadow-sm shadow-[#7240b8]/20 transition-all active:scale-[0.98] self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo khóa học mới</span>
        </Link>
      </section>

      {/* Metric Stat Cards (Compact 4-Column Grid matching Stitch) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tổng khóa học */}
        <div className="bg-white dark:bg-[#1d1926] border border-[#eceaf3] dark:border-[#352e43] rounded-2xl p-4 shadow-xs flex items-center gap-4 hover:shadow-sm transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-[#f7f1ff] dark:bg-[#282234] flex items-center justify-center text-[#7240b8] dark:text-[#a87ffb] flex-shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-[#635a72] dark:text-[#a9a0b2]">Tổng khóa học</p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-bold text-[#1c192c] dark:text-[#f4eeff]">
                {totalCourses}
              </span>
              <span className="text-xs text-[#635a72] dark:text-[#a9a0b2]">khóa</span>
            </div>
          </div>
        </div>

        {/* Card 2: Đang hoạt động (Approved) */}
        <div className="bg-white dark:bg-[#1d1926] border border-[#eceaf3] dark:border-[#352e43] rounded-2xl p-4 shadow-xs flex items-center gap-4 hover:shadow-sm transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-[#635a72] dark:text-[#a9a0b2]">Đang hoạt động</p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                {approvedCount}
              </span>
              <span className="text-xs text-emerald-600 dark:text-emerald-500 font-medium">đã duyệt</span>
            </div>
          </div>
        </div>

        {/* Card 3: Chờ phê duyệt (Pending) */}
        <div className="bg-white dark:bg-[#1d1926] border border-[#eceaf3] dark:border-[#352e43] rounded-2xl p-4 shadow-xs flex items-center gap-4 hover:shadow-sm transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
            <Hourglass className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-[#635a72] dark:text-[#a9a0b2]">Chờ phê duyệt</p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                {pendingCount}
              </span>
              <span className="text-xs text-amber-600 dark:text-amber-500 font-medium">khóa học</span>
            </div>
          </div>
        </div>

        {/* Card 4: Tổng doanh thu */}
        <div className="bg-white dark:bg-[#1d1926] border border-[#eceaf3] dark:border-[#352e43] rounded-2xl p-4 shadow-xs flex items-center gap-4 hover:shadow-sm transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-[#f7f1ff] dark:bg-[#282234] text-[#7240b8] dark:text-[#a87ffb] flex items-center justify-center flex-shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-[#635a72] dark:text-[#a9a0b2]">Tổng doanh thu</p>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl sm:text-2xl font-bold text-[#1c192c] dark:text-[#f4eeff]">
                {Math.round(totalRevenue).toLocaleString('vi-VN')}
              </span>
              <span className="text-xs text-[#635a72] dark:text-[#a9a0b2] font-semibold">đ</span>
            </div>
            {overviewStats?.revenue?.completedOrders !== undefined && (
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                {overviewStats.revenue.completedOrders} đơn hàng thành công
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Filter & Search Control Bar */}
      <section className="bg-white dark:bg-[#1d1926] rounded-2xl border border-[#eceaf3] dark:border-[#352e43] p-4 flex flex-wrap justify-between items-center gap-4 shadow-xs">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleStatusFilterChange('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              statusFilter === 'all'
                ? 'bg-[#7240b8] text-white shadow-xs'
                : 'text-[#635a72] dark:text-[#a9a0b2] hover:bg-[#f7f1ff] dark:hover:bg-[#282234]'
            }`}
          >
            Tất cả ({totalCourses})
          </button>

          <button
            type="button"
            onClick={() => handleStatusFilterChange('approved')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 border ${
              statusFilter === 'approved'
                ? 'bg-emerald-500 text-white border-emerald-500 shadow-xs'
                : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                statusFilter === 'approved' ? 'bg-white' : 'bg-emerald-500'
              }`}
            />
            <span>Đã duyệt ({approvedCount})</span>
          </button>

          <button
            type="button"
            onClick={() => handleStatusFilterChange('pending')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 border ${
              statusFilter === 'pending'
                ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800 hover:bg-amber-100'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                statusFilter === 'pending' ? 'bg-white' : 'bg-amber-500'
              }`}
            />
            <span>Chờ duyệt ({pendingCount})</span>
          </button>

          <button
            type="button"
            onClick={() => handleStatusFilterChange('rejected')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
              statusFilter === 'rejected'
                ? 'bg-rose-500 text-white border-rose-500 shadow-xs'
                : 'text-[#635a72] dark:text-[#a9a0b2] border-transparent hover:bg-slate-100 dark:hover:bg-[#282234]'
            }`}
          >
            Bị từ chối
          </button>
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full lg:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm kiếm theo tên khóa học..."
              className="w-full h-9 pl-9 pr-3 rounded-xl border border-[#e2e0ea] dark:border-[#3d364b] text-xs text-[#1c192c] dark:text-[#f4eeff] bg-[#fdf8ff] dark:bg-[#252030] focus:outline-none focus:ring-2 focus:ring-[#7240b8]"
            />
          </div>
          <button
            type="submit"
            className="px-3.5 py-2 rounded-xl bg-[#f7f1ff] dark:bg-[#282234] hover:bg-[#ede5fa] dark:hover:bg-[#352c48] text-[#7240b8] dark:text-[#a87ffb] text-xs font-semibold transition-colors flex-shrink-0"
          >
            Tìm
          </button>
        </form>
      </section>

      {/* Main Content Area */}
      {isLoading ? (
        // Loading Skeleton
        <div className="bg-white dark:bg-[#1d1926] rounded-2xl border border-[#eceaf3] dark:border-[#352e43] p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#eceaf3] dark:border-[#352e43]">
            <div className="h-4 w-40 bg-slate-200 dark:bg-slate-800 rounded-md animate-pulse" />
            <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded-md animate-pulse" />
          </div>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-4 py-3 animate-pulse">
              <div className="w-20 h-12 bg-slate-200 dark:bg-slate-800 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-3/4" />
                <div className="h-3 bg-slate-100 dark:bg-slate-900 rounded-md w-1/3" />
              </div>
              <div className="w-24 h-6 bg-slate-200 dark:bg-slate-800 rounded-full" />
              <div className="w-20 h-8 bg-slate-200 dark:bg-slate-800 rounded-lg" />
            </div>
          ))}
        </div>
      ) : isError ? (
        // Error State
        <div className="bg-white dark:bg-[#1d1926] rounded-2xl border border-rose-200 dark:border-rose-900 p-8 text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 mx-auto flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-[#1c192c] dark:text-[#f4eeff]">
            Không thể tải danh sách khóa học
          </h2>
          <p className="text-xs sm:text-sm text-[#635a72] dark:text-[#a9a0b2] max-w-md mx-auto">
            {errorMessage || 'Đã có lỗi xảy ra trong quá trình kết nối đến máy chủ TMdemy.'}
          </p>
          <button
            type="button"
            onClick={() => {
              setIsLoading(true);
              setReloadTrigger((prev) => prev + 1);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#7240b8] hover:bg-[#5e3299] text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Thử lại</span>
          </button>
        </div>
      ) : courses.length === 0 ? (
        // Empty State
        <div className="bg-white dark:bg-[#1d1926] rounded-2xl border border-[#eceaf3] dark:border-[#352e43] p-10 text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-[#f7f1ff] dark:bg-[#282234] text-[#7240b8] dark:text-[#a87ffb] mx-auto flex items-center justify-center">
            <BookOpen className="w-7 h-7" />
          </div>
          <h2 className="text-base sm:text-lg font-bold text-[#1c192c] dark:text-[#f4eeff]">
            {activeSearch || statusFilter !== 'all'
              ? 'Không tìm thấy khóa học phù hợp với bộ lọc'
              : 'Bạn chưa tạo khóa học nào'}
          </h2>
          <p className="text-xs sm:text-sm text-[#635a72] dark:text-[#a9a0b2] max-w-md mx-auto">
            {activeSearch || statusFilter !== 'all'
              ? 'Vui lòng thử điều chỉnh lại từ khóa tìm kiếm hoặc chọn bộ lọc trạng thái khác.'
              : 'Bắt đầu xây dựng khóa học đầu tiên để chia sẻ kiến thức và tạo nguồn thu nhập từ TMdemy.'}
          </p>
          <div className="pt-2">
            {activeSearch || statusFilter !== 'all' ? (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  setActiveSearch('');
                  setStatusFilter('all');
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#f7f1ff] dark:bg-[#282234] text-[#7240b8] dark:text-[#a87ffb] text-xs font-semibold hover:bg-[#ede5fa] transition-colors"
              >
                <span>Xóa bộ lọc</span>
              </button>
            ) : (
              <Link
                href="/teacher/courses/new"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#7240b8] hover:bg-[#5e3299] text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Tạo khóa học ngay</span>
              </Link>
            )}
          </div>
        </div>
      ) : (
        // Course Catalog Table (Matching Stitch `f69a87521aff49e09067aaaab91a0f18`)
        <section className="bg-white dark:bg-[#1d1926] rounded-2xl border border-[#eceaf3] dark:border-[#352e43] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f7f1ff]/60 dark:bg-[#282234]/60 border-b border-[#eceaf3] dark:border-[#352e43] text-xs font-semibold text-[#635a72] dark:text-[#a9a0b2]">
                  <th className="py-3.5 px-4">Khóa học</th>
                  <th className="py-3.5 px-4">Danh mục &amp; Cấp độ</th>
                  <th className="py-3.5 px-4">Giá bán</th>
                  <th className="py-3.5 px-4">Học viên</th>
                  <th className="py-3.5 px-4">Doanh thu</th>
                  <th className="py-3.5 px-4 text-center">Trạng thái duyệt</th>
                  <th className="py-3.5 px-4 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eceaf3] dark:divide-[#352e43] text-xs">
                {courses.map((course) => {
                  const courseId = course.id || course._id;
                  const isPending = (course.status || '').toLowerCase() === 'pending';
                  const sold = typeof course.sold === 'number' ? course.sold : 0;
                  const price = typeof course.price === 'number' ? course.price : 0;
                  const revenue = sold * price;
                  const categoryName = course.category?.name || 'Chung';

                  const levelLabels: Record<string, string> = {
                    beginner: 'Mới bắt đầu',
                    intermediate: 'Trung cấp',
                    advanced: 'Nâng cao',
                  };
                  const normalizedLevel = (course.level || '').toLowerCase();
                  const levelLabel = levelLabels[normalizedLevel] || 'Cơ bản';

                  return (
                    <tr
                      key={courseId || course.slug}
                      className="hover:bg-[#f7f1ff]/40 dark:hover:bg-[#252030] transition-colors group"
                    >
                      {/* Column 1: Course Info */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3.5 min-w-[240px]">
                          <div className="relative w-20 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-[#f7f1ff] dark:bg-[#282234] border border-[#eceaf3] dark:border-[#3d364b]">
                            {course.image ? (
                              <img
                                src={course.image}
                                alt={course.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-400">
                                <BookOpen className="w-5 h-5 text-[#7240b8]" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/teacher/courses/${courseId}/edit`}
                              className="text-xs sm:text-sm font-bold text-[#1c192c] dark:text-[#f4eeff] hover:text-[#7240b8] dark:hover:text-[#a87ffb] transition-colors line-clamp-1"
                            >
                              {course.title}
                            </Link>
                            <p className="text-[11px] text-slate-400 font-mono truncate mt-0.5">
                              {course.slug}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Column 2: Category & Level */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1 items-start">
                          <span className="font-semibold text-[#1c192c] dark:text-[#f4eeff]">
                            {categoryName}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#f7f1ff] dark:bg-[#282234] text-[#7240b8] dark:text-[#a87ffb]">
                            {levelLabel}
                          </span>
                        </div>
                      </td>

                      {/* Column 3: Price */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-bold text-[#1c192c] dark:text-[#f4eeff]">
                            {price === 0 ? 'Miễn phí' : `${price.toLocaleString('vi-VN')} đ`}
                          </span>
                          {course.oldPrice && course.oldPrice > price && (
                            <span className="line-through text-slate-400 text-[10px]">
                              {course.oldPrice.toLocaleString('vi-VN')} đ
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Column 4: Students */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <Link
                          href={`/teacher/courses/${courseId}/students`}
                          className="inline-flex items-center gap-1.5 text-[#635a72] dark:text-[#a9a0b2] hover:text-[#7240b8] dark:hover:text-[#a87ffb] transition-colors group/students"
                          title="Xem danh sách học viên"
                        >
                          <Users className="w-3.5 h-3.5 text-slate-400 group-hover/students:text-[#7240b8]" />
                          <span className="font-medium">{sold} học viên</span>
                        </Link>
                      </td>

                      {/* Column 5: Revenue */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          {revenue.toLocaleString('vi-VN')} đ
                        </span>
                      </td>

                      {/* Column 6: Status */}
                      <td className="py-4 px-4 whitespace-nowrap text-center">
                        <CourseStatusBadge status={course.status} />
                      </td>

                      {/* Column 7: Actions */}
                      <td className="py-4 px-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Chỉnh sửa */}
                          <Link
                            href={`/teacher/courses/${courseId}/edit`}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-[#7240b8] hover:bg-[#f7f1ff] dark:hover:bg-[#282234] transition-colors"
                            title="Chỉnh sửa khóa học"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>

                          {/* Soạn giáo trình */}
                          <Link
                            href={`/teacher/courses/${courseId}/curriculum`}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-[#7240b8] hover:bg-[#f7f1ff] dark:hover:bg-[#282234] transition-colors"
                            title="Soạn giáo trình (Curriculum)"
                          >
                            <MenuSquare className="w-4 h-4" />
                          </Link>

                          {/* Danh sách học viên */}
                          <Link
                            href={`/teacher/courses/${courseId}/students`}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-[#7240b8] hover:bg-[#f7f1ff] dark:hover:bg-[#282234] transition-colors"
                            title="Danh sách học viên (Student Roster)"
                          >
                            <Users className="w-4 h-4" />
                          </Link>

                          {/* Hiệu suất & Phân tích */}
                          <Link
                            href={`/teacher/courses/${courseId}/performance`}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-[#7240b8] hover:bg-[#f7f1ff] dark:hover:bg-[#282234] transition-colors"
                            title="Hiệu suất & Phân tích (Performance Analytics)"
                          >
                            <BarChart3 className="w-4 h-4" />
                          </Link>

                          {/* Xóa khóa học: Luôn cho phép bấm mở modal (xóa với pending, giải thích chính sách với approved) */}
                          <button
                            type="button"
                            onClick={() => openDeleteModal(course)}
                            data-testid={`teacher-delete-course-btn-${courseId}`}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isPending
                                ? 'text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                                : 'text-rose-400/80 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                            }`}
                            title={
                              isPending
                                ? 'Xóa khóa học (chờ duyệt)'
                                : 'Xem thông tin & chính sách xóa khóa học'
                            }
                            aria-label={`Xóa khóa học ${course.title}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {pagination.totalPages > 1 && (
            <div className="p-4 border-t border-[#eceaf3] dark:border-[#352e43] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#635a72] dark:text-[#a9a0b2]">
              <div>
                Trang <span className="font-semibold">{pagination.page}</span> /{' '}
                <span className="font-semibold">{pagination.totalPages}</span> (Tổng cộng{' '}
                <span className="font-semibold">{pagination.total}</span> khóa học)
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="p-1.5 rounded-lg border border-[#e2e0ea] dark:border-[#3d364b] hover:bg-slate-50 dark:hover:bg-[#282234] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: pagination.totalPages }).map((_, idx) => {
                  const p = idx + 1;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => handlePageChange(p)}
                      className={`w-7 h-7 rounded-lg text-xs font-semibold transition-colors ${
                        p === pagination.page
                          ? 'bg-[#7240b8] text-white'
                          : 'hover:bg-slate-100 dark:hover:bg-[#282234]'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="p-1.5 rounded-lg border border-[#e2e0ea] dark:border-[#3d364b] hover:bg-slate-50 dark:hover:bg-[#282234] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Delete Confirmation Modal */}
      <CourseDeleteModal
        course={deletingCourse}
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingCourse(null);
        }}
        onDeleted={handleCourseDeleted}
      />
    </div>
  );
}
