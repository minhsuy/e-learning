'use client';

import React, { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import {
  AdminCourseItem,
  AdminCourseKpis,
  AdminCoursesPagination,
} from '@/types/admin-course';
import { adminCourseService } from '@/services/admin-course.service';
import { CourseKpiSummary } from './course-kpi-summary';
import { CourseFiltersBar } from './course-filters-bar';
import { CourseTable } from './course-table';
import { CoursePagination } from './course-pagination';
import { CourseDetailModal } from './course-detail-modal';
import { ApproveCourseModal } from './approve-course-modal';
import { RejectCourseModal } from './reject-course-modal';
import { DeleteCourseModal } from './delete-course-modal';
import { toast } from '@/lib/toast';

export function AdminCoursesView() {
  // 1. Data States
  const [courses, setCourses] = useState<AdminCourseItem[]>([]);
  const [pagination, setPagination] = useState<AdminCoursesPagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 2. Filter States
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [category, setCategory] = useState('all');
  const [author, setAuthor] = useState('all');

  // 3. KPI State
  const [kpis, setKpis] = useState<AdminCourseKpis>({
    totalCourses: null,
    pendingCourses: null,
    approvedCourses: null,
    rejectedCourses: null,
  });
  const [loadingKpis, setLoadingKpis] = useState(true);

  // 4. Reload trigger
  const [reloadTrigger, setReloadTrigger] = useState(0);

  // 5. Modal States
  const [detailCourse, setDetailCourse] = useState<AdminCourseItem | null>(null);
  const [courseToApprove, setCourseToApprove] = useState<AdminCourseItem | null>(null);
  const [courseToReject, setCourseToReject] = useState<AdminCourseItem | null>(null);
  const [courseToDelete, setCourseToDelete] = useState<AdminCourseItem | null>(null);

  // Fetch course list with active filters and pagination
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const loadData = async () => {
      await Promise.resolve();
      if (!isMounted) return;

      setLoading(true);
      setError(null);

      try {
        const res = await adminCourseService.getCourses(
          {
            page: pagination.page,
            limit: pagination.limit,
            status,
            search,
            category,
            author,
          },
          { signal: controller.signal }
        );

        if (isMounted) {
          setCourses(res.data.courses || []);
          setPagination((prev) => ({ ...prev, ...res.data.pagination }));
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return;
        if (isMounted) {
          const msg = err instanceof Error ? err.message : 'Không thể tải danh sách khóa học';
          setError(msg);
          toast.error(msg);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [pagination.page, pagination.limit, status, search, category, author, reloadTrigger]);

  // Load KPI Summary
  useEffect(() => {
    let isMounted = true;

    const loadKpiData = async () => {
      await Promise.resolve();
      if (!isMounted) return;

      setLoadingKpis(true);
      try {
        const data = await adminCourseService.getCourseKpis();
        if (isMounted) setKpis(data);
      } catch {
        // Ignored
      } finally {
        if (isMounted) setLoadingKpis(false);
      }
    };

    void loadKpiData();

    return () => {
      isMounted = false;
    };
  }, [reloadTrigger]);

  // Handlers for filters
  const handleSearchChange = (newSearch: string) => {
    setSearch(newSearch);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleAuthorChange = (newAuthor: string) => {
    setAuthor(newAuthor);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatus('all');
    setCategory('all');
    setAuthor('all');
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleLimitChange = (newLimit: number) => {
    setPagination((prev) => ({ ...prev, limit: newLimit, page: 1 }));
  };

  const handleMutationSuccess = () => {
    setReloadTrigger((k) => k + 1);
    if (detailCourse) {
      setDetailCourse(null);
    }
    if (courseToDelete) {
      setCourseToDelete(null);
    }
  };

  const isFiltered = Boolean(search || status !== 'all' || category !== 'all' || author !== 'all');

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-[#f1ebff] dark:border-[#2b2438]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl md:text-3xl font-bold text-[#1c192c] dark:text-[#f4eeff] tracking-tight">
              Quản lý & Phê duyệt Khóa học
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#f7f1ff] dark:bg-[#2b2438] text-[#7240b8] dark:text-[#a87ffb] border border-[#7240b8]/20">
              Admin Portal
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#635a72] dark:text-[#a9a0b2]">
            Theo dõi, tìm kiếm, lọc danh mục, thẩm định giáo trình và phê duyệt phát hành các khóa học của Giảng viên.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setReloadTrigger((k) => k + 1);
              toast.info('Đang làm mới dữ liệu khóa học...');
            }}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-[#1d1926] border border-[#f1ebff] dark:border-[#2b2438] text-[#635a72] dark:text-[#a9a0b2] hover:bg-[#f7f1ff] dark:hover:bg-[#2b2438] transition-colors shadow-xs"
            title="Làm mới danh sách"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Summary Cards */}
      <CourseKpiSummary
        kpis={kpis}
        loading={loadingKpis}
        selectedStatus={status}
        onSelectStatus={handleStatusChange}
      />

      {/* Filters & Search Toolbar */}
      <CourseFiltersBar
        search={search}
        onSearchChange={handleSearchChange}
        status={status}
        onStatusChange={handleStatusChange}
        category={category}
        onCategoryChange={handleCategoryChange}
        author={author}
        onAuthorChange={handleAuthorChange}
        onResetFilters={handleResetFilters}
        isFiltered={isFiltered}
        totalFiltered={pagination.total}
      />

      {/* Course Data Table / Mobile Cards & Pagination */}
      <section aria-label="Danh sách khóa học và phân trang" className="space-y-4">
        <CourseTable
          courses={courses}
          loading={loading}
          error={error}
          onRetry={() => setReloadTrigger((k) => k + 1)}
          onViewDetail={(c) => setDetailCourse(c)}
          onApprove={(c) => setCourseToApprove(c)}
          onReject={(c) => setCourseToReject(c)}
          onDelete={(c) => setCourseToDelete(c)}
          onResetFilters={handleResetFilters}
          isFiltered={isFiltered}
        />

        {/* Pagination Controls */}
        {!loading && !error && courses.length > 0 && (
          <CoursePagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            limit={pagination.limit}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
            loading={loading}
          />
        )}
      </section>

      {/* Modals */}
      {/* 1. Detail Inspection Modal */}
      <CourseDetailModal
        course={detailCourse}
        isOpen={Boolean(detailCourse)}
        onClose={() => setDetailCourse(null)}
        onApprove={(c) => {
          setDetailCourse(null);
          setCourseToApprove(c);
        }}
        onReject={(c) => {
          setDetailCourse(null);
          setCourseToReject(c);
        }}
        onDelete={(c) => {
          setDetailCourse(null);
          setCourseToDelete(c);
        }}
      />

      {/* 2. Approve Confirmation Modal */}
      <ApproveCourseModal
        course={courseToApprove}
        isOpen={Boolean(courseToApprove)}
        onClose={() => setCourseToApprove(null)}
        onSuccess={handleMutationSuccess}
      />

      {/* 3. Reject Confirmation Modal */}
      <RejectCourseModal
        course={courseToReject}
        isOpen={Boolean(courseToReject)}
        onClose={() => setCourseToReject(null)}
        onSuccess={handleMutationSuccess}
      />

      {/* 4. Delete Confirmation Modal (Admin soft-delete) */}
      <DeleteCourseModal
        course={courseToDelete}
        isOpen={Boolean(courseToDelete)}
        onClose={() => setCourseToDelete(null)}
        onSuccess={handleMutationSuccess}
      />
    </div>
  );
}
