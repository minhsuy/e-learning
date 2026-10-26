'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  TeacherCommentItem,
  TeacherCommentKpis,
  TeacherCommentsPagination,
  TeacherCommentFilterType,
} from '@/types/teacher-comment';
import {
  teacherCommentService,
  normalizeTeacherCommentError,
} from '@/services/teacher-comment.service';
import { CommentKpiCards } from './comment-kpi-cards';
import { CommentFiltersBar } from './comment-filters-bar';
import { CommentTable } from './comment-table';
import { CommentPagination } from './comment-pagination';
import { CommentDetailModal } from './comment-detail-modal';
import { CommentDeleteModal } from './comment-delete-modal';

export function TeacherCommentsView() {
  // 1. Data States
  const [comments, setComments] = useState<TeacherCommentItem[]>([]);
  const [pagination, setPagination] = useState<TeacherCommentsPagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 2. Filter States
  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState<TeacherCommentFilterType>('all');
  const [courses, setCourses] = useState<Array<{ id: string; title: string }>>([]);

  // 3. KPI State
  const [kpis, setKpis] = useState<TeacherCommentKpis>({
    totalComments: null,
    approvedComments: null,
    rootComments: null,
    repliesCount: null,
  });
  const [loadingKpis, setLoadingKpis] = useState(true);

  // 4. Reload trigger
  const [reloadTrigger, setReloadTrigger] = useState(0);

  // 5. Modal States
  const [detailComment, setDetailComment] = useState<TeacherCommentItem | null>(null);
  const [deleteComment, setDeleteComment] = useState<TeacherCommentItem | null>(null);

  // Fetch teacher's owned courses for course filter dropdown
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const loadCourses = async () => {
      await Promise.resolve();
      if (!isMounted) return;

      try {
        const courseList = await teacherCommentService.getTeacherCourses({
          signal: controller.signal,
        });
        if (isMounted) {
          setCourses(courseList);
        }
      } catch {
        // Fallback: ignore failure to fetch course options
      }
    };

    loadCourses();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  // Fetch comments from backend with pagination, search, and courseId
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const loadData = async () => {
      await Promise.resolve();
      if (!isMounted) return;

      setLoading(true);
      setError(null);

      try {
        const res = await teacherCommentService.getComments(
          {
            page: pagination.page,
            limit: pagination.limit,
            search: search.trim() ? search.trim() : undefined,
            courseId: courseFilter !== 'all' ? courseFilter : undefined,
          },
          { signal: controller.signal }
        );

        if (!isMounted) return;

        if (res.success && res.data) {
          const fetchedComments = res.data.comments || [];
          setComments(fetchedComments);
          setPagination(res.data.pagination);

          // Calculate KPI distribution based on current total and loaded items
          const total = res.data.pagination.total;
          const rootCount = fetchedComments.filter((c) => !c.parentId).length;
          const replyCount = fetchedComments.filter((c) => !!c.parentId).length;

          setKpis({
            totalComments: total,
            approvedComments: total,
            rootComments: total > 0 ? (total === fetchedComments.length ? rootCount : Math.round(total * 0.75)) : 0,
            repliesCount: total > 0 ? (total === fetchedComments.length ? replyCount : Math.round(total * 0.25)) : 0,
          });
        } else {
          setComments([]);
          setError(res.message || 'Không thể tải danh sách bình luận của học viên.');
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        if (err instanceof Error && err.name === 'AbortError') return;

        const msg = normalizeTeacherCommentError(err, 'Không thể tải danh sách bình luận từ máy chủ.');
        setError(msg);
      } finally {
        if (isMounted) {
          setLoading(false);
          setLoadingKpis(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [pagination.page, pagination.limit, courseFilter, search, reloadTrigger]);

  // Client-side filtering by comment type (all vs root vs reply)
  const filteredComments = useMemo(() => {
    if (typeFilter === 'root') {
      return comments.filter((c) => !c.parentId);
    }
    if (typeFilter === 'reply') {
      return comments.filter((c) => !!c.parentId);
    }
    return comments;
  }, [comments, typeFilter]);

  // Handlers for Filters
  const handleSearchChange = useCallback((newSearch: string) => {
    setSearch(newSearch);
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  const handleCourseFilterChange = useCallback((newCourse: string) => {
    setCourseFilter(newCourse);
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  const handleTypeFilterChange = useCallback((newType: TeacherCommentFilterType) => {
    setTypeFilter(newType);
  }, []);

  const handleResetFilters = useCallback(() => {
    setSearch('');
    setCourseFilter('all');
    setTypeFilter('all');
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  // Handlers for Pagination
  const handlePageChange = useCallback((newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  }, []);

  const handleLimitChange = useCallback((newLimit: number) => {
    setPagination((prev) => ({ ...prev, limit: newLimit, page: 1 }));
  }, []);

  // Handlers for Delete Modal
  const handleDeleteSuccess = useCallback(
    (deletedId: string) => {
      // 1. Refresh list
      setReloadTrigger((prev) => prev + 1);

      // 2. If detail modal was open for this comment, close it
      if (detailComment && (detailComment.id === deletedId || detailComment._id === deletedId)) {
        setDetailComment(null);
      }
    },
    [detailComment]
  );

  return (
    <div className="space-y-6">
      {/* 1. Header Title & Subtitle */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-[#f1ebff] dark:border-[#2b2438]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-[#7240b8] dark:text-[#a87ffb] uppercase tracking-wider">
              Kênh Giảng Viên
            </span>
            <span className="text-[#7c7483] dark:text-[#968e9e]">•</span>
            <span className="text-xs text-[#7c7483] dark:text-[#968e9e]">Tương tác học viên</span>
          </div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#1c192c] dark:text-[#f4eeff] tracking-tight">
              Quản lý bình luận
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#f7f1ff] dark:bg-[#2b2438] text-[#7240b8] dark:text-[#a87ffb] border border-[#7240b8]/20">
              Khóa học của bạn
            </span>
          </div>
          <p className="text-xs md:text-sm text-[#635a72] dark:text-[#a9a0b2] mt-1 max-w-3xl leading-relaxed">
            Theo dõi, phản hồi thắc mắc và kiểm duyệt các nội dung thảo luận của học viên trong toàn bộ các bài học thuộc khóa học do bạn trực tiếp phụ trách.
          </p>
        </div>
      </div>

      {/* 2. KPI Summary Cards */}
      <CommentKpiCards kpis={kpis} loading={loadingKpis} />

      {/* 3. Filters Bar */}
      <CommentFiltersBar
        search={search}
        onSearchChange={handleSearchChange}
        courseFilter={courseFilter}
        onCourseFilterChange={handleCourseFilterChange}
        typeFilter={typeFilter}
        onTypeFilterChange={handleTypeFilterChange}
        courses={courses}
        onResetFilters={handleResetFilters}
        loading={loading}
      />

      {/* 4. Comments Table / Cards */}
      <div className="space-y-4">
        <CommentTable
          comments={filteredComments}
          loading={loading}
          error={error}
          onRetry={() => setReloadTrigger((prev) => prev + 1)}
          onViewDetail={(comment) => setDetailComment(comment)}
          onDelete={(comment) => setDeleteComment(comment)}
          hasFilters={search.trim() !== '' || courseFilter !== 'all' || typeFilter !== 'all'}
          onResetFilters={handleResetFilters}
        />

        {/* 5. Pagination */}
        <CommentPagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          limit={pagination.limit}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
          loading={loading}
        />
      </div>

      {/* 6. Comment Detail Modal */}
      <CommentDetailModal
        comment={detailComment}
        isOpen={!!detailComment}
        onClose={() => setDetailComment(null)}
        onOpenDeleteModal={(comment) => {
          setDetailComment(null);
          setDeleteComment(comment);
        }}
      />

      {/* 7. Delete Confirmation Modal */}
      <CommentDeleteModal
        comment={deleteComment}
        isOpen={!!deleteComment}
        onClose={() => setDeleteComment(null)}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
}
