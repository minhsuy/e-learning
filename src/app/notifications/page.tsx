'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { useAuth } from '@/hooks/use-auth';
import { useNotifications } from '@/hooks/use-notifications';
import { notificationService } from '@/services/notification.service';
import { ApiNotification, NotificationType } from '@/types/notification';
import { ApiPagination } from '@/types/api';
import { NotificationItem } from '@/components/notification/notification-item';
import {
  Bell,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCheck,
} from 'lucide-react';

type ReadFilter = 'ALL' | 'UNREAD';

interface TypeFilterOption {
  label: string;
  value?: NotificationType;
}

const TYPE_FILTER_OPTIONS: TypeFilterOption[] = [
  { label: 'Tất cả thể loại', value: undefined },
  { label: 'Khóa học', value: 'COURSE' },
  { label: 'Bài học', value: 'LESSON' },
  { label: 'Bài kiểm tra', value: 'QUIZ' },
  { label: 'Đơn hàng', value: 'ORDER' },
  { label: 'Thảo luận', value: 'COMMENT' },
  { label: 'Tin nhắn', value: 'MESSAGE' },
  { label: 'Hệ thống', value: 'SYSTEM' },
];

function NotificationsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { isAuthenticated, status: authStatus } = useAuth();
  const {
    markAsRead: contextMarkAsRead,
    refresh: refreshGlobalContext,
    latestRealtimeNotification,
  } = useNotifications();

  // URL query params
  const initialPage = parseInt(searchParams.get('page') || '1', 10);
  const rawTypeParam = searchParams.get('type');
  const initialType = rawTypeParam
    ? (rawTypeParam.toUpperCase() as NotificationType)
    : undefined;

  // Local State
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [pagination, setPagination] = useState<ApiPagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [currentPage, setCurrentPage] = useState<number>(initialPage > 0 ? initialPage : 1);
  const [selectedType, setSelectedType] = useState<NotificationType | undefined>(initialType);
  const [readFilter, setReadFilter] = useState<ReadFilter>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch page notifications from backend
  const fetchPageData = useCallback(async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await notificationService.getNotifications({
        page: currentPage,
        limit: 10,
        type: selectedType,
      });

      if (response.success && response.data) {
        let rawList: ApiNotification[] = [];
        let pagePagination: ApiPagination = {
          page: currentPage,
          limit: 10,
          total: 0,
          totalPages: 1,
        };

        if (Array.isArray(response.data)) {
          rawList = response.data;
          pagePagination.total = rawList.length;
        } else if (response.data && typeof response.data === 'object') {
          const dataObj = response.data as {
            notifications?: ApiNotification[];
            items?: ApiNotification[];
            pagination?: ApiPagination;
          };
          if (Array.isArray(dataObj.notifications)) {
            rawList = dataObj.notifications;
          } else if (Array.isArray(dataObj.items)) {
            rawList = dataObj.items;
          }
          if (dataObj.pagination) {
            pagePagination = dataObj.pagination;
          }
        }

        const normalizedList: ApiNotification[] = rawList.map((item) => ({
          ...item,
          type: String(item.type || '').toUpperCase() as NotificationType,
          isRead: item.isRead ?? item.read ?? false,
        }));

        setNotifications(normalizedList);
        setPagination(pagePagination);
      } else {
        setNotifications([]);
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Không thể tải danh sách thông báo';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, currentPage, selectedType]);

  useEffect(() => {
    let isCancelled = false;

    const initPage = async () => {
      await Promise.resolve();
      if (isCancelled) return;

      if (authStatus === 'unauthenticated') {
        router.push('/login');
        return;
      }
      if (isAuthenticated) {
        await fetchPageData();
      }
    };

    void initPage();

    return () => {
      isCancelled = true;
    };
  }, [authStatus, isAuthenticated, fetchPageData, router]);

  // Synchronize incoming realtime notifications if on Page 1
  useEffect(() => {
    let isCancelled = false;

    const syncRealtime = async () => {
      await Promise.resolve();
      if (isCancelled || !latestRealtimeNotification) return;

      const id = latestRealtimeNotification.id || latestRealtimeNotification._id;
      if (!id) return;

      // If we are on page 1 and the type matches (or no type filter active)
      const notifType = String(latestRealtimeNotification.type || '').toUpperCase();
      const selType = selectedType ? String(selectedType).toUpperCase() : undefined;

      if (currentPage === 1 && (!selType || selType === notifType)) {
        setNotifications((prev) => {
          if (prev.some((n) => (n.id || n._id) === id)) return prev;
          return [latestRealtimeNotification, ...prev];
        });
        setPagination((prev) => ({
          ...prev,
          total: prev.total + 1,
        }));
      }
    };

    void syncRealtime();

    return () => {
      isCancelled = true;
    };
  }, [latestRealtimeNotification, currentPage, selectedType]);

  // Handle Mark as Read in Page
  const handleMarkItemAsRead = async (id: string) => {
    const success = await contextMarkAsRead(id);
    if (success) {
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id || n._id === id ? { ...n, isRead: true, read: true } : n
        )
      );
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages || newPage === currentPage) return;
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTypeChange = (typeVal?: NotificationType) => {
    setSelectedType(typeVal);
    setCurrentPage(1);
  };

  // Filter in memory for Unread tab
  const displayedNotifications =
    readFilter === 'UNREAD'
      ? notifications.filter((n) => !n.isRead && !n.read)
      : notifications;

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 md:py-8 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#ede4f9] dark:bg-[#2b2438] text-[#7240b8] dark:text-[#a87ffb] flex items-center justify-center">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-[#1c192c] dark:text-[#f4eeff]">
                  Trung tâm thông báo
                </h1>
                <p className="text-xs sm:text-sm text-[#635a72] dark:text-[#a9a0b2]">
                  Theo dõi cập nhật bài học, đơn hàng và hoạt động học tập của bạn
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => {
                void fetchPageData();
                void refreshGlobalContext();
              }}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#ece4f8] dark:border-[#352b47] hover:bg-[#f7f1ff] dark:hover:bg-[#221d2d] text-xs font-semibold text-[#4b4452] dark:text-[#cdc3d4] transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Làm mới</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-white dark:bg-[#1a1622] rounded-2xl p-4 border border-[#ece4f8] dark:border-[#2f273d] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Read / Unread Tabs */}
          <div className="flex items-center gap-2 bg-[#fbf9ff] dark:bg-[#221c2d] p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setReadFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                readFilter === 'ALL'
                  ? 'bg-white dark:bg-[#2e263d] text-[#7240b8] dark:text-[#a87ffb] shadow-2xs'
                  : 'text-[#635a72] dark:text-[#cdc3d4] hover:text-[#1c192c] dark:hover:text-[#f4eeff]'
              }`}
            >
              Tất cả
            </button>
            <button
              type="button"
              onClick={() => setReadFilter('UNREAD')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                readFilter === 'UNREAD'
                  ? 'bg-white dark:bg-[#2e263d] text-[#7240b8] dark:text-[#a87ffb] shadow-2xs'
                  : 'text-[#635a72] dark:text-[#cdc3d4] hover:text-[#1c192c] dark:hover:text-[#f4eeff]'
              }`}
            >
              Chưa đọc
            </button>
          </div>

          {/* Type Filter Dropdown / Buttons */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <Filter className="w-4 h-4 text-[#8c8296] dark:text-[#a094aa] shrink-0 hidden sm:block" />
            {TYPE_FILTER_OPTIONS.map((opt) => {
              const isSelected = selectedType === opt.value;
              return (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => handleTypeChange(opt.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#7240b8] text-white dark:bg-[#a87ffb] dark:text-[#17141f] shadow-2xs font-semibold'
                      : 'bg-[#f7f1ff] dark:bg-[#221d2d] text-[#635a72] dark:text-[#cdc3d4] hover:bg-[#ede4f9] dark:hover:bg-[#2d253c]'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Notifications List Container */}
        <div className="bg-white dark:bg-[#1a1622] rounded-2xl border border-[#ece4f8] dark:border-[#2f273d] shadow-xs overflow-hidden">
          {/* Loading Skeleton */}
          {isLoading && (
            <div className="divide-y divide-[#f7f1ff] dark:divide-[#2b2438]">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="p-4 flex items-start gap-4 animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-[#f1ebff] dark:bg-[#2b2438] shrink-0" />
                  <div className="flex-1 space-y-2.5">
                    <div className="h-3.5 bg-[#f1ebff] dark:bg-[#2b2438] rounded-xs w-1/4" />
                    <div className="h-4 bg-[#f1ebff] dark:bg-[#2b2438] rounded-xs w-3/4" />
                    <div className="h-3 bg-[#f1ebff] dark:bg-[#2b2438] rounded-xs w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {!isLoading && error && (
            <div className="p-12 text-center">
              <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center">
                <AlertCircle className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-[#1c192c] dark:text-[#f4eeff] mb-1">
                Không thể tải thông báo
              </h3>
              <p className="text-xs sm:text-sm text-[#8c8296] dark:text-[#a094aa] mb-4 max-w-md mx-auto">
                {error}
              </p>
              <button
                type="button"
                onClick={() => void fetchPageData()}
                className="px-4 py-2 rounded-xl bg-[#7240b8] text-white dark:bg-[#a87ffb] dark:text-[#17141f] text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
              >
                Thử lại ngay
              </button>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && displayedNotifications.length === 0 && (
            <div className="py-16 px-4 text-center">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-[#ede4f9] dark:bg-[#2b2438] flex items-center justify-center text-[#7240b8] dark:text-[#a87ffb]">
                {readFilter === 'UNREAD' ? (
                  <CheckCheck className="w-8 h-8" />
                ) : (
                  <Bell className="w-8 h-8 opacity-60" />
                )}
              </div>
              <h3 className="text-base font-bold text-[#1c192c] dark:text-[#f4eeff]">
                {readFilter === 'UNREAD'
                  ? 'Tuyệt vời! Bạn không có thông báo chưa đọc'
                  : 'Chưa có thông báo nào'}
              </h3>
              <p className="text-xs sm:text-sm text-[#8c8296] dark:text-[#a094aa] mt-1 max-w-sm mx-auto">
                {readFilter === 'UNREAD'
                  ? 'Bạn đã xem toàn bộ thông báo gần đây. Khi có tin mới, hệ thống sẽ hiển thị tại đây.'
                  : selectedType
                  ? 'Không tìm thấy thông báo nào thuộc thể loại này.'
                  : 'Các thông báo về khóa học, bài học và hoạt động tài khoản sẽ hiển thị ở đây.'}
              </p>
              {selectedType && (
                <button
                  type="button"
                  onClick={() => handleTypeChange(undefined)}
                  className="mt-4 px-3 py-1.5 rounded-lg border border-[#ece4f8] dark:border-[#352b47] text-xs font-medium text-[#7240b8] dark:text-[#a87ffb] hover:bg-[#f7f1ff] dark:hover:bg-[#221d2d] transition-colors cursor-pointer"
                >
                  Xóa bộ lọc thể loại
                </button>
              )}
            </div>
          )}

          {/* Notifications List */}
          {!isLoading && !error && displayedNotifications.length > 0 && (
            <div className="divide-y divide-[#f7f1ff] dark:divide-[#2b2438]">
              {displayedNotifications.map((notif) => (
                <NotificationItem
                  key={notif.id || notif._id}
                  notification={notif}
                  compact={false}
                  onItemClick={() => {
                    const id = notif.id || notif._id;
                    if (id) {
                      void handleMarkItemAsRead(id);
                    }
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Pagination Bar */}
        {!isLoading && !error && pagination.totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
            <p className="text-xs text-[#8c8296] dark:text-[#a094aa]">
              Hiển thị trang <span className="font-semibold">{pagination.page}</span> /{' '}
              <span className="font-semibold">{pagination.totalPages}</span> (Tổng cộng{' '}
              {pagination.total} thông báo)
            </p>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1 || isLoading}
                aria-label="Trang trước"
                className="p-2 rounded-xl bg-white dark:bg-[#1a1622] border border-[#ece4f8] dark:border-[#2f273d] hover:bg-[#f7f1ff] dark:hover:bg-[#221d2d] disabled:opacity-40 disabled:cursor-not-allowed text-[#1c192c] dark:text-[#f4eeff] transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Page Number Chips */}
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                .filter((p) => {
                  return (
                    p === 1 ||
                    p === pagination.totalPages ||
                    Math.abs(p - currentPage) <= 1
                  );
                })
                .map((p, idx, arr) => {
                  const prev = arr[idx - 1];
                  const hasGap = prev && p - prev > 1;

                  return (
                    <React.Fragment key={p}>
                      {hasGap && (
                        <span className="px-1 text-xs text-[#8c8296] dark:text-[#a094aa]">
                          ...
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handlePageChange(p)}
                        className={`w-8 h-8 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          currentPage === p
                            ? 'bg-[#7240b8] text-white dark:bg-[#a87ffb] dark:text-[#17141f] shadow-2xs'
                            : 'bg-white dark:bg-[#1a1622] border border-[#ece4f8] dark:border-[#2f273d] text-[#635a72] dark:text-[#cdc3d4] hover:bg-[#f7f1ff] dark:hover:bg-[#221d2d]'
                        }`}
                      >
                        {p}
                      </button>
                    </React.Fragment>
                  );
                })}

              <button
                type="button"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= pagination.totalPages || isLoading}
                aria-label="Trang sau"
                className="p-2 rounded-xl bg-white dark:bg-[#1a1622] border border-[#ece4f8] dark:border-[#2f273d] hover:bg-[#f7f1ff] dark:hover:bg-[#221d2d] disabled:opacity-40 disabled:cursor-not-allowed text-[#1c192c] dark:text-[#f4eeff] transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default function NotificationsPage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <div className="max-w-5xl mx-auto px-4 py-16 text-center text-sm text-[#635a72] dark:text-[#a9a0b2]">
            Đang tải trung tâm thông báo...
          </div>
        </AppShell>
      }
    >
      <NotificationsContent />
    </Suspense>
  );
}
