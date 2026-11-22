'use client';

import React from 'react';
import {
  Banknote,
  TrendingUp,
  Tag,
  CheckCircle2,
  CreditCard,
  Gift,
  Calculator,
  Info,
} from 'lucide-react';
import { AdminFinancialStatsData } from '@/types/admin-order';
import { formatVND } from '@/services/admin-order.service';
import { cn } from '@/lib/utils';

interface AnalyticsKpiGridProps {
  data: AdminFinancialStatsData | null;
  loading: boolean;
  periodLabel: string;
}

function formatNumber(n: number | null | undefined): string {
  if (n === null || n === undefined || isNaN(n)) return '—';
  return new Intl.NumberFormat('vi-VN').format(n);
}

export function AnalyticsKpiGrid({ data, loading, periodLabel }: AnalyticsKpiGridProps) {
  const netRevenue = data ? data.netRevenue : null;
  const grossRevenue = data ? data.grossRevenue : null;
  const totalDiscount = data
    ? data.totalDiscount ?? Math.max(0, (data.grossRevenue || 0) - (data.netRevenue || 0))
    : null;
  const completedOrders = data ? data.completedOrders : null;
  const paidOrders = data?.paidOrders ?? null;
  const freeOrders = data?.freeOrders ?? null;
  const averageOrderValue = data ? data.averageOrderValue : null;

  const cards = [
    {
      id: 'netRevenue',
      label: 'Tổng doanh thu đã ghi nhận',
      value: netRevenue !== null ? formatVND(netRevenue) : '—',
      subtext: `${periodLabel} • Đơn hoàn tất`,
      badge: 'Doanh thu ròng',
      badgeClass: 'bg-[#f7f1ff] dark:bg-[#2b2438] text-[#7240b8] dark:text-[#a87ffb]',
      icon: Banknote,
      iconClass: 'bg-[#f7f1ff] dark:bg-[#2b2438] text-[#7240b8] dark:text-[#a87ffb]',
      highlight: true,
    },
    {
      id: 'grossRevenue',
      label: 'Doanh thu trước giảm giá',
      value: grossRevenue !== null ? formatVND(grossRevenue) : '—',
      subtext: 'Tổng giá trị niêm yết của đơn hoàn tất',
      badge: 'Gross',
      badgeClass: 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300',
      icon: TrendingUp,
      iconClass: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400',
    },
    {
      id: 'totalDiscount',
      label: 'Tổng tiền giảm giá',
      value: totalDiscount !== null ? formatVND(totalDiscount) : '—',
      subtext: 'Tổng chiết khấu coupon trên đơn hoàn tất',
      badge: 'Chiết khấu',
      badgeClass: 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300',
      icon: Tag,
      iconClass: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400',
    },
    {
      id: 'averageOrderValue',
      label: 'Giá trị đơn trung bình',
      value: averageOrderValue !== null ? formatVND(averageOrderValue) : '—',
      subtext: 'Trung bình doanh thu / đơn hoàn tất',
      badge: 'AOV',
      badgeClass: 'bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300',
      icon: Calculator,
      iconClass: 'bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400',
    },
    {
      id: 'completedOrders',
      label: 'Đơn đã hoàn tất',
      value: formatNumber(completedOrders),
      subtext:
        paidOrders !== null && freeOrders !== null
          ? `${formatNumber(paidOrders)} trả phí • ${formatNumber(freeOrders)} miễn phí`
          : 'Tổng đơn COMPLETED trong chu kỳ',
      badge: 'COMPLETED',
      badgeClass: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300',
      icon: CheckCircle2,
      iconClass: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400',
    },
    {
      id: 'paidOrders',
      label: 'Đơn trả phí',
      value: formatNumber(paidOrders),
      subtext: 'Đơn hoàn tất có tổng tiền > 0 ₫',
      badge: 'Có phí',
      badgeClass: 'bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300',
      icon: CreditCard,
      iconClass: 'bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400',
    },
    {
      id: 'freeOrders',
      label: 'Đơn miễn phí',
      value: formatNumber(freeOrders),
      subtext: 'Đóng góp 0 ₫ vào doanh thu tiền tệ',
      badge: '0 ₫',
      badgeClass: 'bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300',
      icon: Gift,
      iconClass: 'bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400',
    },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              className={cn(
                'p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#1d1926] border shadow-xs transition-all',
                card.highlight
                  ? 'border-[#7240b8]/35 dark:border-[#a87ffb]/40 ring-1 ring-[#7240b8]/10'
                  : 'border-[#f1ebff] dark:border-[#2b2438]'
              )}
            >
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', card.iconClass)}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full', card.badgeClass)}>
                  {card.badge}
                </span>
              </div>

              <p className="text-xs font-medium text-[#635a72] dark:text-[#a9a0b2]">{card.label}</p>
              {loading ? (
                <div className="h-7 w-28 bg-[#f1ebff] dark:bg-[#2b2438] animate-pulse rounded-md mt-1.5" />
              ) : (
                <p className="text-xl sm:text-2xl font-bold text-[#1c192c] dark:text-[#f4eeff] tracking-tight mt-1">
                  {card.value}
                </p>
              )}
              <p className="text-[11px] text-[#8e849e] dark:text-[#8d8299] mt-1.5 leading-snug">
                {card.subtext}
              </p>
            </div>
          );
        })}
      </div>

      {/* Financial Accounting Scope Notice */}
      <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-[#f7f1ff]/70 dark:bg-[#1d1926] border border-[#e6dffa] dark:border-[#2b2438] text-xs text-[#635a72] dark:text-[#a9a0b2]">
        <Info className="w-4 h-4 text-[#7240b8] dark:text-[#a87ffb] shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-[#1c192c] dark:text-[#f4eeff]">Lưu ý kế toán:</strong>{' '}
          Doanh thu khóa học đã ghi nhận được tổng hợp từ <code className="font-mono text-[11px]">SUM(Order.total)</code> của các đơn hàng{' '}
          <strong>COMPLETED</strong> (không cộng dồn từ <code className="font-mono text-[11px]">PaymentTransaction</code> hay webhook trùng lặp).
          Chỉ tiêu này phản ánh <strong>doanh số bán khóa học đã ghi nhận</strong> — không đồng nhất với tiền thực nhận tại tài khoản ngân hàng hay số tiền chi trả cho giảng viên.
        </p>
      </div>
    </div>
  );
}
