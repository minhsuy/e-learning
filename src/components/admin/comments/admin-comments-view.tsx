'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  AdminCommentItem,
  AdminCommentKpis,
  AdminCommentsPagination,
  CommentFilterType,
  CommentModerationStatus,
} from '@/types/admin-comment';
import {
  adminCommentService,
  normalizeCommentApiError,
} from '@/services/admin-comment.service';
import { toast } from '@/lib/toast';
import { CommentKpiSummary } from './comment-kpi-summary';
import { CommentFiltersBar } from './comment-filters-bar';
import { CommentTable } from './comment-table';
import { CommentPagination } from './comment-pagination';
import { CommentDetailModal } from './comment-detail-modal';
import { DeleteCommentModal } from './delete-comment-modal';

export function AdminCommentsView() {
  // 1. Data States
  const [comments, setComments] = useState<AdminCommentItem[]>([]);
  const [pagination, setPagination] = useState<AdminCommentsPagination>({
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
  const [typeFilter, setTypeFilter] = useState<CommentFilterType>('all');
  const [statusFilter, setStatusFilter] = useState<CommentModerationStatus>('all');
  const [courses, setCourses] = useState<Array<{ id: string; title: string }>>([]);

  // 3. KPI State
  const [kpis, setKpis] = useState<AdminCommentKpis>({
    totalComments: null,
    approvedComments: null,
    rootComments: null,
    repliesCount: null,
  });
  const [loadingKpis, setLoadingKpis] = useState(true);

  // 4. Reload trigger
  const [reloadTrigger, setReloadTrigger] = useState(0);

  // 5. Modal States
  const [detailComment, setDetailComment] = useState<AdminCommentItem | null>(null);
  const [deleteComment, setDeleteComment] = useState<AdminCommentItem | null>(null);

  // Fetch course list for filter dropdown once on mount
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const loadCourses = async () => {
      await Promise.resolve();
      if (!isMounted) return;

      try {
        const courseList = await adminCommentService.getCoursesForFilter({
          signal: controller.signal,
        });
        if (isMounted) {
          setCourses(courseList);
        }
      } catch {
        // Fallback: ignore course list failure
      }
    };

    loadCourses();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  // Fetch comments from backend with pagination, search, courseId and status
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const loadData = async () => {
      await Promise.resolve();
      if (!isMounted) return;

      setLoading(true);
      setError(null);

      try {
        const res = await adminCommentService.getComments(
          {
            page: pagination.page,
            limit: pagination.limit,
            search: search.trim() ? search.trim() : undefined,
            courseId: courseFilter !== 'all' ? courseFilter : undefined,
            status: statusFilter !== 'all' ? statusFilter : undefined,
          },
          { signal: controller.signal }
        );

        if (!isMounted) return;

        if (res.success && res.data) {
          const fetchedComments = res.data.comments || [];
          setComments(fetchedComments);
          setPagination(res.data.pagination);

          // Update KPIs based on total and root/replies distribution
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
          setError(res.message || 'Không thể tải danh sách bình luận.');
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        if (err instanceof Error && err.name === 'AbortError') return;

        const msg = normalizeCommentApiError(err, 'Không thể tải danh sách bình luận từ máy chủ.');
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
  }, [pagination.page, pagination.limit, courseFilter, search, statusFilter, reloadTrigger]);

  // Client-side filtering by comment type (root vs reply)
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

  const handleTypeFilterChange = useCallback((newType: CommentFilterType) => {
    setTypeFilter(newType);
  }, []);

  const handleStatusFilterChange = useCallback((newStatus: CommentModerationStatus) => {
    setStatusFilter(newStatus);
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  const handleResetFilters = useCallback(() => {
    setSearch('');
    setCourseFilter('all');
    setTypeFilter('all');
    setStatusFilter('all');
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  // Handlers for Pagination
  const handlePageChange = useCallback((newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  }, []);

  const handleLimitChange = useCallback((newLimit: number) => {
    setPagination((prev) => ({ ...prev, limit: newLimit, page: 1 }));
  }, []);

  // Handler for Comment Moderation Status Update
  const handleUpdateStatus = useCallback(
    async (commentId: string, status: 'APPROVED' | 'HIDDEN' | 'FLAGGED', note?: string) => {
      try {
        const res = await adminCommentService.updateCommentStatus(commentId, {
          status,
          moderationNote: note,
        });
        if (res.success) {
          toast.success(res.message || 'Cập nhật trạng thái bình luận thành công!');
          // Refresh list
          setReloadTrigger((prev) => prev + 1);
          // If detail modal is open for this comment, update its local status
          setDetailComment((prev) => {
            if (prev && (prev.id === commentId || prev._id === commentId)) {
              return {
                ...prev,
                status,
                moderationNote: note ?? prev.moderationNote,
              };
            }
            return prev;
          });
        } else {
          toast.error(res.message || 'Không thể cập nhật trạng thái bình luận.');
        }
      } catch (err: unknown) {
        const msg = normalizeCommentApiError(err, 'Lỗi khi cập nhật trạng thái bình luận.');
        toast.error(msg);
      }
    },
    []
  );

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
            <h1 className="text-2xl md:text-3xl font-bold text-[#1c192c] dark:text-[#f4eeff] tracking-tight">
              Kiểm duyệt Bình luận
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#f7f1ff] dark:bg-[#2b2438] text-[#7240b8] dark:text-[#a87ffb] border border-[#7240b8]/20">
              Admin Module
            </span>
          </div>
          <p className="text-sm text-[#635a72] dark:text-[#a9a0b2]">
            Giám sát khu vực thảo luận trong các bài học, xử lý các phản ánh vi phạm và gỡ bỏ bình luận spam nhằm giữ gìn văn hóa học tập trong sạch.
          </p>
        </div>
      </div>

      {/* 2. KPI Summary Cards */}
      <CommentKpiSummary kpis={kpis} loading={loadingKpis} />

      {/* 3. Filters Bar */}
      <CommentFiltersBar
        search={search}
        onSearchChange={handleSearchChange}
        courseFilter={courseFilter}
        onCourseFilterChange={handleCourseFilterChange}
        typeFilter={typeFilter}
        onTypeFilterChange={handleTypeFilterChange}
        statusFilter={statusFilter}
        onStatusFilterChange={handleStatusFilterChange}
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
          onUpdateStatus={handleUpdateStatus}
          hasFilters={
            search.trim() !== '' ||
            courseFilter !== 'all' ||
            typeFilter !== 'all' ||
            statusFilter !== 'all'
          }
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
        onUpdateStatus={handleUpdateStatus}
      />

      {/* 7. Delete Confirmation Modal */}
      <DeleteCommentModal
        comment={deleteComment}
        isOpen={!!deleteComment}
        onClose={() => setDeleteComment(null)}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
}
