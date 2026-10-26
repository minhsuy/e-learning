'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, ShoppingBag, AlertTriangle, RefreshCw, Receipt, User, BookOpen } from 'lucide-react';
import { AdminOrderSummary } from '@/types/admin-dashboard';

interface PendingOrdersCardProps {
  orders: AdminOrderSummary[];
  loading: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export function PendingOrdersCard({
  orders,
  loading,
  error,
  onRetry,
}: PendingOrdersCardProps) {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const formatPrice = (price?: number) => {
    if (price === undefined || price === null) return '—';
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
  };

  return (
    <div className="bg-white dark:bg-[#1d1926] rounded-2xl border border-[#f1ebff] dark:border-[#2b2438] p-5 md:p-6 shadow-xs flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#f1ebff] dark:border-[#2b2438]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#1c192c] dark:text-[#f4eeff]">
              Đơn hàng cần xử lý
            </h2>
            <p className="text-xs text-[#635a72] dark:text-[#a9a0b2]">
              Các giao dịch đăng ký đang ở trạng thái Pending
            </p>
          </div>
        </div>

        <Link
          href="/admin/orders"
          className="text-xs font-semibold text-[#7240b8] dark:text-[#a87ffb] hover:text-[#5a3294] dark:hover:text-[#c4a5ff] inline-flex items-center gap-1 transition-colors"
        >
          <span>Xem tất cả</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Content Area */}
      <div className="my-3 min-h-[260px] flex flex-col justify-center">
        {loading ? (
          <div className="space-y-3 py-1">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] animate-pulse"
              >
                <div className="w-10 h-10 rounded-lg bg-[#f1ebff] dark:bg-[#2b2438] shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-[#f1ebff] dark:bg-[#2b2438] rounded w-2/3" />
                  <div className="h-3 bg-[#f1ebff] dark:bg-[#2b2438] rounded w-1/2" />
                </div>
                <div className="h-5 w-16 bg-[#f1ebff] dark:bg-[#2b2438] rounded-full shrink-0" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#1c192c] dark:text-[#f4eeff]">
                Không thể tải danh sách đơn hàng cần xử lý
              </p>
              <p className="text-xs text-[#635a72] dark:text-[#a9a0b2] mt-0.5">
                {error}
              </p>
            </div>
            {onRetry && (
              <button
                onClick={onRetry}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#7240b8] text-white hover:bg-[#5f339d] transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Thử lại</span>
              </button>
            )}
          </div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center space-y-2.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <Receipt className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-[#1c192c] dark:text-[#f4eeff]">
              Không có đơn hàng nào cần xử lý
            </p>
            <p className="text-xs text-[#635a72] dark:text-[#a9a0b2]">
              Tất cả các giao dịch thanh toán đã được cập nhật thành công.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {orders.slice(0, 5).map((order) => {
              const orderCode =
                order.code ||
                `#${(order.id || order._id || '').slice(0, 8).toUpperCase()}`;

              return (
                <div
                  key={order.id || order._id}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[#fdf8ff] dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] hover:border-[#7240b8]/30 dark:hover:border-[#a87ffb]/30 transition-colors"
                >
                  {/* Order Details */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-[#f7f1ff] dark:bg-[#2b2438] text-[#7240b8] dark:text-[#a87ffb] shrink-0 flex items-center justify-center font-mono font-bold text-xs border border-[#f1ebff] dark:border-[#2b2438]">
                      <Receipt className="w-4 h-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Link
                          href="/admin/orders"
                          className="text-xs font-bold text-[#1c192c] dark:text-[#f4eeff] hover:text-[#7240b8] dark:hover:text-[#a87ffb] transition-colors"
                        >
                          {orderCode}
                        </Link>
                        {order.course?.title && (
                          <span
                            className="text-xs text-[#635a72] dark:text-[#a9a0b2] truncate max-w-[150px] inline-flex items-center gap-1"
                            title={order.course.title}
                          >
                            <BookOpen className="w-3 h-3 text-muted-foreground shrink-0" />
                            {order.course.title}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#635a72] dark:text-[#a9a0b2]">
                        <span className="inline-flex items-center gap-1 truncate max-w-[140px]">
                          <User className="w-3 h-3 text-[#7240b8] dark:text-[#a87ffb]" />
                          <span>{order.user?.username || order.user?.email || 'Khách hàng'}</span>
                        </span>
                        <span>•</span>
                        <span>{formatDate(order.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Amount & Status Badge */}
                  <div className="flex flex-col items-end shrink-0 gap-1 pl-2">
                    <span className="text-xs font-bold text-[#7240b8] dark:text-[#a87ffb]">
                      {formatPrice(order.total ?? order.amount)}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40">
                      Chờ xử lý
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="pt-3 border-t border-[#f1ebff] dark:border-[#2b2438] flex items-center justify-between text-xs text-[#635a72] dark:text-[#a9a0b2]">
        <span>Hiển thị tối đa 5 đơn hàng mới nhất</span>
        <Link
          href="/admin/orders"
          className="font-medium hover:text-[#7240b8] dark:hover:text-[#a87ffb] underline-offset-2 hover:underline"
        >
          Xử lý đơn hàng
        </Link>
      </div>
    </div>
  );
}
