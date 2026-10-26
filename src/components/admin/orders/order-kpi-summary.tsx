'use client';

import React from 'react';
import { ShoppingBag, CheckCircle2, Clock, DollarSign, Info } from 'lucide-react';
import { AdminOrderKpis } from '@/types/admin-order';
import { formatVND } from '@/services/admin-order.service';
import { cn } from '@/lib/utils';

interface OrderKpiSummaryProps {
  kpis: AdminOrderKpis;
  loading: boolean;
}

export function OrderKpiSummary({ kpis, loading }: OrderKpiSummaryProps) {
  const cards = [
    {
      id: 'total',
      label: 'Tổng số đơn hàng',
      value: kpis.totalOrders !== null ? new Intl.NumberFormat('vi-VN').format(kpis.totalOrders) : null,
      icon: ShoppingBag,
      iconBg: 'bg-[#f7f1ff] dark:bg-[#2b2438]',
      iconColor: 'text-[#7240b8] dark:text-[#a87ffb]',
      borderColor: 'hover:border-[#7240b8]/40 dark:hover:border-[#a87ffb]/40',
      badge: 'Toàn sàn',
      badgeColor: 'bg-[#f7f1ff] dark:bg-[#2b2438] text-[#7240b8] dark:text-[#a87ffb]',
      subtext: 'Tất cả trạng thái giao dịch',
    },
    {
      id: 'completed',
      label: 'Đã hoàn tất',
      value: kpis.completedOrders !== null ? new Intl.NumberFormat('vi-VN').format(kpis.completedOrders) : null,
      icon: CheckCircle2,
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/40',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      borderColor: 'hover:border-emerald-300 dark:hover:border-emerald-700/50',
      badge: 'Đã kích hoạt',
      badgeColor: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300',
      subtext: 'Đã ghi danh học viên',
    },
    {
      id: 'pending',
      label: 'Chờ đối soát / duyệt',
      value: kpis.pendingOrders !== null ? new Intl.NumberFormat('vi-VN').format(kpis.pendingOrders) : null,
      icon: Clock,
      iconBg: 'bg-amber-50 dark:bg-amber-950/40',
      iconColor: 'text-amber-600 dark:text-amber-400',
      borderColor: 'hover:border-amber-300 dark:hover:border-amber-700/50',
      badge: 'Cần xử lý',
      badgeColor: 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300',
      subtext: 'Đơn chờ chuyển khoản/duyệt',
    },
    {
      id: 'revenue',
      label: 'Doanh thu hệ thống',
      value: kpis.totalRevenue !== null ? formatVND(kpis.totalRevenue) : null,
      icon: DollarSign,
      iconBg: 'bg-indigo-50 dark:bg-indigo-950/40',
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      borderColor: 'hover:border-indigo-300 dark:hover:border-indigo-700/50',
      badge: 'Thực thu',
      badgeColor: 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300',
      subtext: 'Tổng hợp cơ sở dữ liệu toàn sàn',
      isRevenue: true,
    },
  ];

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.id}
              className={cn(
                'p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#1d1926] border border-[#f1ebff] dark:border-[#2b2438] text-left transition-all duration-200 group relative overflow-hidden shadow-xs',
                card.borderColor
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 duration-200',
                    card.iconBg,
                    card.iconColor
                  )}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span
                  className={cn(
                    'text-[11px] font-semibold px-2 py-0.5 rounded-full tracking-wide',
                    card.badgeColor
                  )}
                >
                  {card.badge}
                </span>
              </div>

              <div>
                <p className="text-xs text-[#635a72] dark:text-[#a9a0b2] font-medium mb-1">
                  {card.label}
                </p>

                {loading ? (
                  <div className="h-7 w-24 bg-[#f1ebff] dark:bg-[#2b2438] animate-pulse rounded-md mt-1" />
                ) : (
                  <p className="text-xl sm:text-2xl font-bold text-[#1c192c] dark:text-[#f4eeff] tracking-tight">
                    {card.value ?? '—'}
                  </p>
                )}

                <p className="text-[11px] text-[#8e849e] dark:text-[#8d8299] mt-1 truncate">
                  {card.subtext}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-1.5 text-[11px] text-[#635a72] dark:text-[#a9a0b2] px-1">
        <Info className="w-3.5 h-3.5 text-[#7240b8] dark:text-[#a87ffb] shrink-0" />
        <span>
          Số lượng đơn hàng phản ánh chính xác 100% dữ liệu toàn sàn qua phân trang backend. Doanh thu tính toán từ các đơn hàng hoàn tất thực tế.
        </span>
      </div>
    </div>
  );
}
