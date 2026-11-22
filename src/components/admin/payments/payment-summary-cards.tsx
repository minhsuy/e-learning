'use client';

import React from 'react';
import {
  QrCode,
  Clock,
  ShieldAlert,
  AlertOctagon,
  CheckCircle2,
} from 'lucide-react';
import { AdminDashboardSummaryData } from '@/types/admin-dashboard';
import { AdminFinancialStatsData } from '@/types/admin-order';
import { PaymentDiagnosticsData } from '@/types/payment';
import { cn } from '@/lib/utils';

interface PaymentSummaryCardsProps {
  summary: AdminDashboardSummaryData | null;
  financial: AdminFinancialStatsData | null;
  diagnostics: PaymentDiagnosticsData | null;
  loading: boolean;
}

function fmt(n: number | null | undefined): string {
  if (n === null || n === undefined || isNaN(n)) return '—';
  return new Intl.NumberFormat('vi-VN').format(n);
}

export function PaymentSummaryCards({
  summary,
  financial,
  diagnostics,
  loading,
}: PaymentSummaryCardsProps) {
  const sepayPending = summary?.counts.sepayPendingOrders ?? null;
  const manualPending = summary?.counts.manualPendingOrders ?? null;
  const manualReviewCount =
    diagnostics?.manualReviewTransactions ?? summary?.paymentTasks?.reviewCount ?? null;
  const failedWebhooks =
    diagnostics?.inbox.retryExhausted ?? summary?.paymentTasks?.retryExhaustedCount ?? null;
  const completedPaidOrders = financial?.paidOrders ?? null;

  const cards = [
    {
      id: 'sepay-pending',
      label: 'Đơn SePay chờ thanh toán',
      value: fmt(sepayPending),
      badge: 'Tự động',
      badgeClass: 'bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300',
      icon: QrCode,
      iconClass: 'bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400',
      subtext: 'Chờ webhook SePay tự động xác nhận (không duyệt tay)',
      alert: false,
    },
    {
      id: 'manual-pending',
      label: 'Đơn thủ công chờ duyệt',
      value: fmt(manualPending),
      badge: 'Cần duyệt',
      badgeClass: 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300',
      icon: Clock,
      iconClass: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400',
      subtext: 'Chuyển khoản thủ công / đơn cũ chờ Admin xử lý',
      alert: (manualPending ?? 0) > 0,
    },
    {
      id: 'manual-review',
      label: 'Giao dịch cần rà soát thủ công',
      value: fmt(manualReviewCount),
      badge: 'Manual Review',
      badgeClass:
        (manualReviewCount ?? 0) > 0
          ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300',
      icon: ShieldAlert,
      iconClass: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400',
      subtext: 'Giao dịch PENDING_MANUAL_REVIEW (lệch tiền / chưa khớp)',
      alert: (manualReviewCount ?? 0) > 0,
    },
    {
      id: 'failed-webhooks',
      label: 'Webhook hết lượt thử lại',
      value: fmt(failedWebhooks),
      badge: 'Inbox Failed',
      badgeClass:
        (failedWebhooks ?? 0) > 0
          ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
          : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300',
      icon: AlertOctagon,
      iconClass: 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400',
      subtext: 'Sự kiện PaymentWebhookEvent thất bại vĩnh viễn',
      alert: (failedWebhooks ?? 0) > 0,
    },
    {
      id: 'completed-paid',
      label: 'Đơn trả phí đã hoàn tất',
      value: fmt(completedPaidOrders),
      badge: 'Paid Orders',
      badgeClass: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300',
      icon: CheckCircle2,
      iconClass: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400',
      subtext: 'Toàn thời gian • Đơn hoàn tất có giá trị > 0 ₫',
      alert: false,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            className={cn(
              'p-4 rounded-2xl bg-white dark:bg-[#1d1926] border shadow-xs transition-all',
              card.alert
                ? 'border-amber-300/80 dark:border-amber-800/60'
                : 'border-[#f1ebff] dark:border-[#2b2438]'
            )}
          >
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', card.iconClass)}>
                <Icon className="w-4 h-4" />
              </div>
              <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap', card.badgeClass)}>
                {card.badge}
              </span>
            </div>

            <p className="text-xs font-medium text-[#635a72] dark:text-[#a9a0b2] leading-snug">
              {card.label}
            </p>
            {loading ? (
              <div className="h-7 w-16 bg-[#f1ebff] dark:bg-[#2b2438] animate-pulse rounded-md mt-1.5" />
            ) : (
              <p className="text-2xl font-bold text-[#1c192c] dark:text-[#f4eeff] tracking-tight mt-1">
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
  );
}
