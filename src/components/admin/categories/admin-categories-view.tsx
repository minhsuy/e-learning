'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  AdminCategoriesPagination,
  AdminCategoryItem,
  AdminCategoryKpis,
} from '@/types/admin-category';
import { adminCategoryService } from '@/services/admin-category.service';
import { CategoryKpiSummary } from './category-kpi-summary';
import { CategoryFiltersBar } from './category-filters-bar';
import { CategoryTable } from './category-table';
import { CategoryPagination } from './category-pagination';
import { CategoryDetailModal } from './category-detail-modal';
import { CreateCategoryModal } from './create-category-modal';
import { EditCategoryModal } from './edit-category-modal';
import { DeleteCategoryModal } from './delete-category-modal';
import { toast } from '@/lib/toast';

export function AdminCategoriesView() {
  // 1. Data States
  const [categories, setCategories] = useState<AdminCategoryItem[]>([]);
  const [courseCounts, setCourseCounts] = useState<Record<string, number | undefined>>({});
  const [pagination, setPagination] = useState<AdminCategoriesPagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 2. Filter State
  const [search, setSearch] = useState('');

  // 3. KPI State
  const [kpis, setKpis] = useState<AdminCategoryKpis>({
    totalCategories: null,
    activeCategories: null,
    totalCoursesAttached: null,
  });
  const [loadingKpis, setLoadingKpis] = useState(true);

  // 4. Reload trigger
  const [reloadTrigger, setReloadTrigger] = useState(0);

  // 5. Modal States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [detailCategory, setDetailCategory] = useState<AdminCategoryItem | null>(null);
  const [categoryToEdit, setCategoryToEdit] = useState<AdminCategoryItem | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<AdminCategoryItem | null>(null);

  // Fetch counts of courses attached to loaded categories
  const fetchCourseCounts = useCallback(
    async (cats: AdminCategoryItem[], signal?: AbortSignal) => {
      const promises = cats.map(async (cat) => {
        const id = cat.id || cat._id;
        if (!id) return { id: '', count: 0 };
        const count = await adminCategoryService.getCategoryCourseCount(id, { signal });
        return { id, count };
      });

      try {
        const results = await Promise.allSettled(promises);
        const newCounts: Record<string, number> = {};
        results.forEach((r) => {
          if (r.status === 'fulfilled' && r.value.id) {
            newCounts[r.value.id] = r.value.count;
          }
        });
        setCourseCounts((prev) => ({ ...prev, ...newCounts }));
      } catch {
        // Ignore count fetch errors
      }
    },
    []
  );

  // Fetch categories with search and pagination
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const loadData = async () => {
      await Promise.resolve();
      if (!isMounted) return;

      setLoading(true);
      setError(null);

      try {
        const res = await adminCategoryService.getCategories(
          {
            page: pagination.page,
            limit: pagination.limit,
            search,
          },
          { signal: controller.signal }
        );

        if (isMounted) {
          const fetchedCategories = res.data.categories || [];
          setCategories(fetchedCategories);
          setPagination((prev) => ({
            ...prev,
            ...res.data.pagination,
          }));

          // Tận dụng courseCount trực tiếp từ backend (BE-F9.11-004) loại bỏ hoàn toàn N+1 queries
          const directCounts: Record<string, number> = {};
          let needsAsyncFetch = false;
          fetchedCategories.forEach((cat) => {
            const id = cat.id || cat._id;
            if (id) {
              if (typeof cat.courseCount === 'number') {
                directCounts[id] = cat.courseCount;
              } else {
                needsAsyncFetch = true;
              }
            }
          });
          setCourseCounts((prev) => ({ ...prev, ...directCounts }));

          if (needsAsyncFetch) {
            void fetchCourseCounts(fetchedCategories, controller.signal);
          }
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return;
        if (isMounted) {
          const msg =
            err instanceof Error ? err.message : 'Không thể tải danh sách danh mục';
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
  }, [pagination.page, pagination.limit, search, reloadTrigger, fetchCourseCounts]);

  // Load KPI data
  useEffect(() => {
    let isMounted = true;

    const loadKpis = async () => {
      await Promise.resolve();
      if (!isMounted) return;

      setLoadingKpis(true);
      try {
        const data = await adminCategoryService.getCategoryKpis();
        if (isMounted) setKpis(data);
      } catch {
        // Fallback silently
      } finally {
        if (isMounted) setLoadingKpis(false);
      }
    };

    void loadKpis();

    return () => {
      isMounted = false;
    };
  }, [reloadTrigger]);

  // Handlers
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  const handleResetFilters = useCallback(() => {
    setSearch('');
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  }, []);

  const handleLimitChange = useCallback((newLimit: number) => {
    setPagination((prev) => ({ ...prev, limit: newLimit, page: 1 }));
  }, []);

  const handleRefresh = useCallback(() => {
    setReloadTrigger((prev) => prev + 1);
  }, []);

  const handleCreateSuccess = useCallback(() => {
    setReloadTrigger((prev) => prev + 1);
  }, []);

  const handleEditSuccess = useCallback(
    (updatedCategory?: Partial<AdminCategoryItem>) => {
      if (
        detailCategory &&
        updatedCategory &&
        categoryToEdit &&
        (detailCategory.id === categoryToEdit.id || detailCategory._id === categoryToEdit._id)
      ) {
        setDetailCategory((prev) => (prev ? { ...prev, ...updatedCategory } : null));
      }
      setReloadTrigger((prev) => prev + 1);
    },
    [detailCategory, categoryToEdit]
  );

  const handleDeleteSuccess = useCallback(
    (deletedId: string) => {
      // Pagination edge case: If the only category on page > 1 was deleted, go back to previous page
      if (categories.length === 1 && pagination.page > 1) {
        setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }));
      }
      // Close detail modal if currently viewing deleted category
      if (
        detailCategory &&
        (detailCategory.id === deletedId || detailCategory._id === deletedId)
      ) {
        setDetailCategory(null);
      }
      setReloadTrigger((prev) => prev + 1);
    },
    [categories.length, pagination.page, detailCategory]
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* 1. Header Row */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-[#f1ebff] dark:border-[#2b2438]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl md:text-3xl font-bold text-[#1c192c] dark:text-[#f4eeff] tracking-tight">
              Quản lý Danh mục
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#f7f1ff] dark:bg-[#2b2438] text-[#7240b8] dark:text-[#a87ffb] border border-[#7240b8]/20">
              Admin Portal
            </span>
          </div>
          <p className="text-sm text-[#635a72] dark:text-[#a9a0b2]">
            Tạo mới, chuẩn hóa tên danh mục, đường dẫn slug và phân loại hệ thống chuyên ngành đào tạo.
          </p>
        </div>
      </div>

      {/* 2. KPI Summary Cards */}
      <CategoryKpiSummary kpis={kpis} loading={loadingKpis} />

      {/* 3. Filters & Action Bar */}
      <CategoryFiltersBar
        search={search}
        onSearchChange={handleSearchChange}
        onResetFilters={handleResetFilters}
        onRefresh={handleRefresh}
        onOpenCreate={() => setIsCreateOpen(true)}
        isFiltered={Boolean(search)}
        totalFiltered={pagination.total}
        loading={loading}
      />

      {/* 4. Table & Mobile Cards */}
      <CategoryTable
        categories={categories}
        courseCounts={courseCounts}
        loading={loading}
        error={error}
        onRetry={handleRefresh}
        onViewDetail={(cat) => setDetailCategory(cat)}
        onEdit={(cat) => setCategoryToEdit(cat)}
        onDelete={(cat) => setCategoryToDelete(cat)}
        onResetFilters={handleResetFilters}
        isFiltered={Boolean(search)}
      />

      {/* 5. Pagination */}
      <CategoryPagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        total={pagination.total}
        limit={pagination.limit}
        onPageChange={handlePageChange}
        onLimitChange={handleLimitChange}
        loading={loading}
      />

      {/* 6. Modals */}
      {/* Detail Modal */}
      <CategoryDetailModal
        category={detailCategory}
        courseCount={detailCategory ? courseCounts[detailCategory.id || detailCategory._id || ''] : 0}
        isOpen={Boolean(detailCategory)}
        onClose={() => setDetailCategory(null)}
        onEdit={(cat) => setCategoryToEdit(cat)}
        onDelete={(cat) => setCategoryToDelete(cat)}
      />

      {/* Create Modal */}
      <CreateCategoryModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      {/* Edit Modal */}
      <EditCategoryModal
        category={categoryToEdit}
        isOpen={Boolean(categoryToEdit)}
        onClose={() => setCategoryToEdit(null)}
        onSuccess={handleEditSuccess}
      />

      {/* Delete Modal */}
      <DeleteCategoryModal
        category={categoryToDelete}
        courseCount={categoryToDelete ? (courseCounts[categoryToDelete.id || categoryToDelete._id || ''] ?? 0) : 0}
        isOpen={Boolean(categoryToDelete)}
        onClose={() => setCategoryToDelete(null)}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
}
