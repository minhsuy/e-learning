'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { adminUserService } from '@/services/admin-user.service';
import {
  AdminUserItem,
  AdminUserKpis,
  AdminUsersPagination,
} from '@/types/admin-user';
import { UserKpiSummary } from './user-kpi-summary';
import { UserFiltersBar } from './user-filters-bar';
import { UserTable } from './user-table';
import { UserPagination } from './user-pagination';
import { UserDetailModal } from './user-detail-modal';
import { ChangeRoleModal } from './change-role-modal';
import { LockUserModal } from './lock-user-modal';
import { cn } from '@/lib/utils';

const INITIAL_KPIS: AdminUserKpis = {
  totalUsers: null,
  totalStudents: null,
  totalTeachers: null,
  totalAdmins: null,
  activeAccounts: null,
  inactiveAccounts: null,
};

export function AdminUsersView() {
  const { user: currentAdmin } = useAuth();

  // 1. Data list states
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [pagination, setPagination] = useState<AdminUsersPagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 2. Filter states
  const [search, setSearch] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [role, setRole] = useState<string>('all');
  const [status, setStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);

  // 3. KPI states
  const [kpis, setKpis] = useState<AdminUserKpis>(INITIAL_KPIS);
  const [kpiLoading, setKpiLoading] = useState<boolean>(true);
  const [kpiError, setKpiError] = useState<string | null>(null);

  // 4. Reload triggers
  const [reloadKey, setReloadKey] = useState<number>(0);
  const [kpiReloadKey, setKpiReloadKey] = useState<number>(0);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // 5. Modal states
  const [selectedDetailUser, setSelectedDetailUser] = useState<AdminUserItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);

  const [selectedRoleUser, setSelectedRoleUser] = useState<AdminUserItem | null>(null);
  const [isRoleOpen, setIsRoleOpen] = useState<boolean>(false);

  const [selectedLockUser, setSelectedLockUser] = useState<AdminUserItem | null>(null);
  const [isLockOpen, setIsLockOpen] = useState<boolean>(false);

  // Debounce search input (500ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to page 1 on search change
    }, 500);

    return () => clearTimeout(handler);
  }, [search]);

  // Fetch KPI Summary
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchKpis = async () => {
      setKpiLoading(true);
      setKpiError(null);
      try {
        const stats = await adminUserService.getUserKpis({ signal: controller.signal });
        if (isMounted) {
          setKpis(stats);
        }
      } catch (err: unknown) {
        if (!controller.signal.aborted && isMounted) {
          const msg = err instanceof Error ? err.message : 'Không thể tải chỉ số KPI';
          setKpiError(msg);
        }
      } finally {
        if (isMounted && !controller.signal.aborted) {
          setKpiLoading(false);
        }
      }
    };

    fetchKpis();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [kpiReloadKey]);

  // Fetch Users List
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchUsers = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await adminUserService.getUsers(
          {
            page,
            limit,
            role,
            status,
            search: debouncedSearch,
            sortBy,
          },
          { signal: controller.signal }
        );

        if (isMounted && res.data) {
          setUsers(res.data.users || []);
          if (res.data.pagination) {
            setPagination(res.data.pagination);
          }
        }
      } catch (err: unknown) {
        if (!controller.signal.aborted && isMounted) {
          const msg = err instanceof Error ? err.message : 'Không thể tải danh sách người dùng';
          setError(msg);
        }
      } finally {
        if (isMounted && !controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchUsers();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [page, limit, role, status, debouncedSearch, sortBy, reloadKey]);

  // Master refresh
  const handleMasterRefresh = useCallback(() => {
    setRefreshing(true);
    setReloadKey((prev) => prev + 1);
    setKpiReloadKey((prev) => prev + 1);
    setTimeout(() => {
      setRefreshing(false);
    }, 600);
  }, []);

  // Filter resets
  const handleResetFilters = useCallback(() => {
    setSearch('');
    setDebouncedSearch('');
    setRole('all');
    setStatus('all');
    setSortBy('createdAt');
    setPage(1);
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#f1ebff] dark:border-[#2b2438]">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-2xl md:text-3xl font-bold text-[#1c192c] dark:text-[#f4eeff] tracking-tight">
              Quản lý người dùng
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#f7f1ff] dark:bg-[#2b2438] text-[#7240b8] dark:text-[#a87ffb] border border-[#7240b8]/20">
              Admin Portal
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#635a72] dark:text-[#a9a0b2]">
            Quản lý tài khoản và quyền truy cập của người dùng trên hệ thống TMdemy.
          </p>
        </div>

        <button
          onClick={handleMasterRefresh}
          disabled={refreshing || loading}
          className={cn(
            'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-[#1d1926] border border-[#f1ebff] dark:border-[#2b2438] text-[#1c192c] dark:text-[#f4eeff] hover:bg-[#fdf8ff] dark:hover:bg-[#252031] transition-all shadow-xs self-start sm:self-auto',
            (refreshing || loading) && 'opacity-60 cursor-not-allowed'
          )}
          title="Làm mới dữ liệu người dùng"
        >
          <RefreshCw
            className={cn(
              'w-3.5 h-3.5 text-[#7240b8] dark:text-[#a87ffb]',
              refreshing && 'animate-spin'
            )}
          />
          <span>{refreshing ? 'Đang tải lại...' : 'Làm mới'}</span>
        </button>
      </div>

      {/* 2. KPI Summary */}
      <section aria-label="Tổng quan người dùng">
        <UserKpiSummary
          kpis={kpis}
          loading={kpiLoading}
          error={kpiError}
          onRetry={() => setKpiReloadKey((prev) => prev + 1)}
        />
      </section>

      {/* 3. Search and Filters */}
      <section aria-label="Tìm kiếm và bộ lọc">
        <UserFiltersBar
          search={search}
          onSearchChange={setSearch}
          role={role}
          onRoleChange={(newRole) => {
            setRole(newRole);
            setPage(1);
          }}
          status={status}
          onStatusChange={(newStatus) => {
            setStatus(newStatus);
            setPage(1);
          }}
          sortBy={sortBy}
          onSortByChange={(newSort) => {
            setSortBy(newSort);
            setPage(1);
          }}
          onReset={handleResetFilters}
          totalFiltered={pagination.total}
          loading={loading}
        />
      </section>

      {/* 4. Users Table & Pagination */}
      <section aria-label="Danh sách tài khoản người dùng" className="space-y-4">
        <UserTable
          users={users}
          loading={loading}
          error={error}
          onRetry={() => setReloadKey((prev) => prev + 1)}
          onViewDetail={(targetUser) => {
            setSelectedDetailUser(targetUser);
            setIsDetailOpen(true);
          }}
          onChangeRole={(targetUser) => {
            setSelectedRoleUser(targetUser);
            setIsRoleOpen(true);
          }}
          onToggleStatus={(targetUser) => {
            setSelectedLockUser(targetUser);
            setIsLockOpen(true);
          }}
          onResetFilters={handleResetFilters}
          isFiltered={Boolean(
            search.trim() || role !== 'all' || status !== 'all' || sortBy !== 'createdAt'
          )}
          currentUserId={currentAdmin?.id}
        />

        {/* Pagination */}
        <UserPagination
          page={page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            setPage(1);
          }}
          loading={loading}
        />
      </section>

      {/* 5. Modals */}
      {/* User Detail Modal */}
      <UserDetailModal
        key={selectedDetailUser?.id || 'detail-modal'}
        user={selectedDetailUser}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedDetailUser(null);
        }}
        onChangeRole={(targetUser) => {
          setSelectedRoleUser(targetUser);
          setIsRoleOpen(true);
        }}
        onToggleStatus={(targetUser) => {
          setSelectedLockUser(targetUser);
          setIsLockOpen(true);
        }}
        currentUserId={currentAdmin?.id}
      />

      {/* Change Role Modal */}
      <ChangeRoleModal
        key={selectedRoleUser?.id || 'role-modal'}
        user={selectedRoleUser}
        isOpen={isRoleOpen}
        onClose={() => {
          setIsRoleOpen(false);
          setSelectedRoleUser(null);
        }}
        onSuccess={() => {
          setReloadKey((prev) => prev + 1);
          setKpiReloadKey((prev) => prev + 1);
        }}
        currentUserId={currentAdmin?.id}
      />

      {/* Lock/Unlock User Modal */}
      <LockUserModal
        key={selectedLockUser?.id || 'lock-modal'}
        user={selectedLockUser}
        isOpen={isLockOpen}
        onClose={() => {
          setIsLockOpen(false);
          setSelectedLockUser(null);
        }}
        onSuccess={() => {
          setReloadKey((prev) => prev + 1);
          setKpiReloadKey((prev) => prev + 1);
        }}
        currentUserId={currentAdmin?.id}
      />
    </div>
  );
}
