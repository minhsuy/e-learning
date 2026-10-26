'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { useAuth } from '@/contexts/auth-context';
import { orderService } from '@/services/order.service';
import { ApiOrderItem } from '@/types/order';
import { ApiPagination } from '@/types/api';
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  Calendar,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Filter,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

type FilterStatus = 'ALL' | 'PENDING' | 'COMPLETED';

function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return dateStr;
  }
}

function OrdersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialStatus = (searchParams.get('status')?.toUpperCase() as FilterStatus) || 'ALL';

  const { isAuthenticated, status: authStatus } = useAuth();

  // State Management
  const [orders, setOrders] = useState<ApiOrderItem[]>([]);
  const [pagination, setPagination] = useState<ApiPagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [currentFilter, setCurrentFilter] = useState<FilterStatus>(initialStatus);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 1. Auth Guard
  useEffect(() => {
    if (authStatus !== 'loading' && !isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent('/orders')}`);
    }
  }, [authStatus, isAuthenticated, router]);

  const [refreshIndex, setRefreshIndex] = useState(0);

  // 2. Fetch Orders
  useEffect(() => {
    if (!isAuthenticated) return;

    let isCurrent = true;
    const controller = new AbortController();

    async function loadOrders() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const res = await orderService.getMyOrders(
          {
            page: currentPage,
            limit: 10,
            status: currentFilter === 'ALL' ? undefined : currentFilter,
          },
          { signal: controller.signal }
        );

        if (!isCurrent) return;

        if (res.success && res.data) {
          setOrders(res.data.orders || []);
          if (res.data.pagination) {
            setPagination(res.data.pagination);
          }
        } else {
          setOrders([]);
        }
      } catch (err: unknown) {
        if (!isCurrent) return;
        if (err instanceof Error && err.name === 'AbortError') return;
        setErrorMessage('Không thể tải lịch sử đơn hàng. Vui lòng thử lại sau.');
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    }

    loadOrders();

    // Stale-revalidation when switching back to tab/window
    const handleRevalidate = () => {
      if (document.visibilityState === 'visible' && isAuthenticated) {
        setRefreshIndex((prev) => prev + 1);
      }
    };
    document.addEventListener('visibilitychange', handleRevalidate);
    window.addEventListener('focus', handleRevalidate);

    return () => {
      isCurrent = false;
      controller.abort();
      document.removeEventListener('visibilitychange', handleRevalidate);
      window.removeEventListener('focus', handleRevalidate);
    };
  }, [isAuthenticated, currentPage, currentFilter, refreshIndex]);

  const handleRefresh = () => {
    setRefreshIndex((prev) => prev + 1);
  };

  const handleFilterChange = (newFilter: FilterStatus) => {
    setCurrentFilter(newFilter);
    setCurrentPage(1);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (authStatus === 'loading') {
    return (
      <AppShell>
        <div className="max-w-5xl mx-auto px-4 py-12">
          <div className="w-48 h-8 bg-[#f1ebff] dark:bg-[#2b2438] rounded-xl animate-pulse mb-8" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-[#f1ebff] dark:bg-[#2b2438] rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-4 py-8 lg:py-12">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-[#1c192c] dark:text-[#f4eeff] tracking-tight flex items-center gap-2.5">
              <ShoppingBag className="w-7 h-7 text-[#7240b8] dark:text-[#a87ffb]" />
              <span>Đơn hàng của tôi</span>
            </h1>
            <p className="text-xs lg:text-sm text-[#635a72] dark:text-[#a9a0b2] mt-1">
              Theo dõi lịch sử đơn hàng và tiến độ phê duyệt khóa học của bạn.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={isLoading}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#f7f1ff] dark:bg-[#282136] hover:bg-[#ebe5ff] text-[#7240b8] dark:text-[#a87ffb] text-xs font-semibold transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 border-b border-[#f1ebff] dark:border-[#2b2438]">
          <div className="flex items-center gap-1.5 text-xs text-[#635a72] dark:text-[#a9a0b2] pr-2 shrink-0">
            <Filter className="w-3.5 h-3.5" />
            <span>Lọc:</span>
          </div>

          <button
            type="button"
            onClick={() => handleFilterChange('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              currentFilter === 'ALL'
                ? 'bg-[#7240b8] text-white shadow-xs'
                : 'bg-[#f7f1ff] dark:bg-[#221d2d] text-[#635a72] dark:text-[#a9a0b2] hover:bg-[#ebe5ff]'
            }`}
          >
            Tất cả đơn hàng
          </button>

          <button
            type="button"
            onClick={() => handleFilterChange('PENDING')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
              currentFilter === 'PENDING'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-[#f7f1ff] dark:bg-[#221d2d] text-[#635a72] dark:text-[#a9a0b2] hover:bg-[#ebe5ff]'
            }`}
          >
            <Clock className="w-3 h-3" />
            <span>Đang chờ duyệt</span>
          </button>

          <button
            type="button"
            onClick={() => handleFilterChange('COMPLETED')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
              currentFilter === 'COMPLETED'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-[#f7f1ff] dark:bg-[#221d2d] text-[#635a72] dark:text-[#a9a0b2] hover:bg-[#ebe5ff]'
            }`}
          >
            <CheckCircle2 className="w-3 h-3" />
            <span>Đã hoàn thành</span>
          </button>
        </div>

        {/* Content Area */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-[#f1ebff] dark:bg-[#2b2438] rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : errorMessage ? (
          <div className="p-8 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-center">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-red-700 dark:text-red-400 mb-4">{errorMessage}</p>
            <button
              type="button"
              onClick={handleRefresh}
              className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors"
            >
              Thử lại
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 rounded-2xl bg-white dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#f7f1ff] dark:bg-[#221d2d] text-[#7240b8] dark:text-[#a87ffb] mx-auto flex items-center justify-center mb-4">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-[#1c192c] dark:text-[#f4eeff] mb-1">
              Chưa có đơn hàng nào
            </h3>
            <p className="text-xs text-[#635a72] dark:text-[#a9a0b2] max-w-sm mx-auto mb-6">
              {currentFilter === 'ALL'
                ? 'Bạn chưa đăng ký mua khóa học nào trên TMdemy.'
                : currentFilter === 'PENDING'
                ? 'Bạn hiện không có đơn hàng nào đang chờ phê duyệt.'
                : 'Bạn chưa có đơn hàng nào đã hoàn tất.'}
            </p>
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#7240b8] hover:bg-[#8349d3] text-white text-xs font-bold shadow-md shadow-[#7240b8]/20 transition-all"
            >
              <span>Khám phá các khóa học ngay</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const isCompleted = order.status?.toUpperCase() === 'COMPLETED';
              const courseTitle = order.course?.title || 'Khóa học TMdemy';
              const courseSlug = order.course?.slug;

              return (
                <div
                  key={order.id || order._id}
                  className="p-5 rounded-2xl bg-white dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] shadow-xs hover:border-[#d7baff] dark:hover:border-[#4d3c67] transition-all flex flex-col md:flex-row md:items-center justify-between gap-5"
                >
                  {/* Left Column: Course details & Code */}
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="w-20 h-16 rounded-xl bg-[#f1ebff] dark:bg-[#2b2438] shrink-0 overflow-hidden border border-[#f1ebff] dark:border-[#2b2438]">
                      {order.course?.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={order.course.image}
                          alt={courseTitle}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-[#a9a0b2]">
                          TMdemy
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-mono text-[11px] font-bold text-[#7240b8] dark:text-[#a87ffb] bg-[#f7f1ff] dark:bg-[#221d2d] px-2 py-0.5 rounded-md">
                          {order.code || order.id}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-[#635a72] dark:text-[#a9a0b2]">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(order.createdAt)}</span>
                        </span>
                      </div>

                      <h2 className="text-sm font-bold text-[#1c192c] dark:text-[#f4eeff] truncate mb-1">
                        {courseSlug ? (
                          <Link
                            href={`/courses/${courseSlug}`}
                            className="hover:text-[#7240b8] dark:hover:text-[#a87ffb] transition-colors"
                          >
                            {courseTitle}
                          </Link>
                        ) : (
                          courseTitle
                        )}
                      </h2>

                      {order.coupon && (
                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                          Áp dụng mã ưu đãi: {order.coupon.code}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Middle Column: Price & Status */}
                  <div className="flex items-center justify-between md:flex-col md:items-end gap-2 shrink-0 md:min-w-[140px] border-t md:border-t-0 pt-3 md:pt-0 border-[#f7f1ff] dark:border-[#2b2438]">
                    <div className="text-left md:text-right">
                      <span className="text-base font-extrabold text-[#1c192c] dark:text-[#f4eeff]">
                        {order.total === 0 ? 'Miễn phí' : `${order.total.toLocaleString('vi-VN')} đ`}
                      </span>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        isCompleted
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {isCompleted ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          <span>ĐÃ HOÀN THÀNH</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3" />
                          <span>ĐANG CHỜ DUYỆT</span>
                        </>
                      )}
                    </span>
                  </div>

                  {/* Right Column: Actions */}
                  <div className="flex items-center justify-end shrink-0">
                    {isCompleted ? (
                      courseSlug ? (
                        <Link
                          href={`/learn/${courseSlug}`}
                          className="w-full md:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>Vào học ngay</span>
                        </Link>
                      ) : null
                    ) : (
                      courseSlug ? (
                        <Link
                          href={`/courses/${courseSlug}`}
                          className="w-full md:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#f7f1ff] dark:bg-[#282136] hover:bg-[#ebe5ff] text-[#7240b8] dark:text-[#a87ffb] text-xs font-semibold transition-colors"
                        >
                          <span>Chi tiết khóa học</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      ) : null
                    )}
                  </div>
                </div>
              );
            })}

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between pt-6 border-t border-[#f1ebff] dark:border-[#2b2438]">
                <p className="text-xs text-[#635a72] dark:text-[#a9a0b2]">
                  Hiển thị trang <strong>{pagination.page}</strong> / <strong>{pagination.totalPages}</strong> ({pagination.total} đơn hàng)
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1 || isLoading}
                    className="p-2 rounded-xl bg-[#f7f1ff] dark:bg-[#282136] hover:bg-[#ebe5ff] disabled:opacity-40 disabled:cursor-not-allowed text-[#1c192c] dark:text-[#f4eeff] transition-colors cursor-pointer"
                    aria-label="Trang trước"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= pagination.totalPages || isLoading}
                    className="p-2 rounded-xl bg-[#f7f1ff] dark:bg-[#282136] hover:bg-[#ebe5ff] disabled:opacity-40 disabled:cursor-not-allowed text-[#1c192c] dark:text-[#f4eeff] transition-colors cursor-pointer"
                    aria-label="Trang sau"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default function OrdersPage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <div className="max-w-5xl mx-auto px-4 py-16 text-center text-sm text-[#635a72] dark:text-[#a9a0b2]">
            Đang tải dữ liệu đơn hàng...
          </div>
        </AppShell>
      }
    >
      <OrdersContent />
    </Suspense>
  );
}
