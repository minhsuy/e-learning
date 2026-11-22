'use client';

import React from 'react';
import {
  Wallet,
  Clock,
  TrendingUp,
  ShieldCheck,
  Info,
  AlertTriangle,
  RefreshCw,
  Lock,
} from 'lucide-react';
import { formatCommissionDateTime, NormalizedCommissionError } from '@/lib/commission-earnings';
import { formatBpsPercent, formatVnd } from '@/lib/vndCurrency';
import { TeacherEarningsOverviewData } from '@/types/commission-earnings';

interface TeacherWalletOverviewProps {
  data: TeacherEarningsOverviewData | null;
  loading: boolean;
  error: NormalizedCommissionError | null;
  onRetry: () => void;
}

export function TeacherWalletOverview({
  data,
  loading,
  error,
  onRetry,
}: TeacherWalletOverviewProps) {
  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((k) => (
            <div
              key={k}
              className="h-32 rounded-2xl bg-white dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438]"
            />
          ))}
        </div>
        <div className="h-24 rounded-2xl bg-white dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-rose-800 dark:text-rose-200">
              Không thể tải số dư Ví & Thu nhập hoa hồng
              {error.statusCode ? ` (HTTP ${error.statusCode})` : ''}
            </p>
            <p className="text-xs text-rose-700 dark:text-rose-300 mt-1">{error.message}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shrink-0 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Thử lại
        </button>
      </div>
    );
  }

  if (!data) return null;

  const { currentBalances, counts, activePolicy, balanceAsOf } = data;

  return (
    <div className="space-y-4">
      {/* Primary Authoritative Balances */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Available Balance */}
        <div className="rounded-2xl bg-gradient-to-br from-[#7240b8] to-[#562b93] text-white p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-100">
              Số dư khả dụng
            </span>
            <span className="p-2 rounded-xl bg-white/15">
              <Wallet className="w-4 h-4 text-white" />
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold tabular-nums tracking-tight">
            {formatVnd(currentBalances.availableBalance)}
          </p>
          <p className="text-xs text-purple-100/90 mt-2">
            {counts.availableEarnings} khoản thu nhập đã hết thời gian tạm giữ
          </p>
        </div>

        {/* Pending Balance */}
        <div className="rounded-2xl bg-white dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#635a72] dark:text-[#a9a0b2]">
              Số dư đang tạm giữ
            </span>
            <span className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-[#1c192c] dark:text-[#f4eeff] tabular-nums tracking-tight">
            {formatVnd(currentBalances.pendingBalance)}
          </p>
          <p className="text-xs text-[#635a72] dark:text-[#a9a0b2] mt-2">
            {counts.pendingEarnings} khoản đang chờ mở khóa tự động theo chu kỳ đối soát
          </p>
        </div>

        {/* Lifetime Recognized */}
        <div className="rounded-2xl bg-white dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#635a72] dark:text-[#a9a0b2]">
              Tổng thu nhập đã ghi nhận
            </span>
            <span className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-[#1c192c] dark:text-[#f4eeff] tabular-nums tracking-tight">
            {formatVnd(currentBalances.lifetimeRecognized)}
          </p>
          <p className="text-xs text-[#635a72] dark:text-[#a9a0b2] mt-2">
            Tổng cộng {counts.totalEarnings} khoản thu nhập hoa hồng hợp lệ
          </p>
        </div>
      </div>

      {/* Secondary Ledger Info & STEP 10 Payout Informational Strip (NO fake payout form) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Active Commission Policy Card */}
        <div className="lg:col-span-7 rounded-2xl bg-white dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="p-2 rounded-xl bg-[#f7f1ff] dark:bg-[#2b2438] text-[#7240b8] dark:text-[#a87ffb] shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </span>
              <div>
                <h2 className="text-sm font-bold text-[#1c192c] dark:text-[#f4eeff]">
                  Chính sách chia sẻ hoa hồng hiện hành
                </h2>
                {activePolicy ? (
                  <div className="mt-1.5 space-y-1">
                    <p className="text-xs font-semibold text-[#4b4452] dark:text-[#cdc3d4]">
                      {activePolicy.name}{' '}
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[11px] font-bold bg-[#f7f1ff] dark:bg-[#2b2438] text-[#7240b8] dark:text-[#a87ffb] ml-1">
                        v{activePolicy.version}
                      </span>
                    </p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#635a72] dark:text-[#a9a0b2]">
                      <span>
                        Giảng viên:{' '}
                        <strong className="text-emerald-700 dark:text-emerald-400">
                          {formatBpsPercent(activePolicy.teacherRateBps)}
                        </strong>
                      </span>
                      <span>
                        Nền tảng:{' '}
                        <strong className="text-[#1c192c] dark:text-[#f4eeff]">
                          {formatBpsPercent(activePolicy.platformRateBps)}
                        </strong>
                      </span>
                      <span>
                        Thời gian tạm giữ:{' '}
                        <strong className="text-[#1c192c] dark:text-[#f4eeff]">
                          {activePolicy.holdingPeriodDays} ngày
                        </strong>
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                    Hiện chưa có chính sách hoa hồng đang hoạt động (tính năng hoa hồng có thể đang tạm tắt).
                    Các khoản thu nhập đã ghi nhận trước đó vẫn được bảo toàn nguyên vẹn trên sổ cái.
                  </p>
                )}
              </div>
            </div>
          </div>
          <p className="text-[11px] text-[#7c7483] dark:text-[#968e9e] mt-3 pt-2.5 border-t border-[#f7f1ff] dark:border-[#2b2438]">
            Dữ liệu số dư chuẩn sổ cái (read-only snapshot) tính đến:{' '}
            <strong className="text-[#4b4452] dark:text-[#cdc3d4] tabular-nums">
              {formatCommissionDateTime(balanceAsOf)}
            </strong>
          </p>
        </div>

        {/* Reserved / Paid Out + STEP 10 Informational Note */}
        <div className="lg:col-span-5 rounded-2xl bg-[#fdfbff] dark:bg-[#1c1826] border border-[#e9defa] dark:border-[#2b2438] p-4 sm:p-5 flex flex-col justify-between gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-white dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] p-3">
              <p className="text-[11px] font-medium text-[#635a72] dark:text-[#a9a0b2]">
                Đang giữ chờ rút (Reserved)
              </p>
              <p className="text-sm font-bold text-[#1c192c] dark:text-[#f4eeff] tabular-nums mt-1">
                {formatVnd(currentBalances.reservedBalance)}
              </p>
            </div>
            <div className="rounded-xl bg-white dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] p-3">
              <p className="text-[11px] font-medium text-[#635a72] dark:text-[#a9a0b2]">
                Đã chi trả (Paid Out)
              </p>
              <p className="text-sm font-bold text-[#1c192c] dark:text-[#f4eeff] tabular-nums mt-1">
                {formatVnd(currentBalances.paidOutBalance)}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="flex items-start gap-2 text-[11px] text-[#635a72] dark:text-[#a9a0b2]">
              <Info className="w-3.5 h-3.5 text-[#7240b8] dark:text-[#a87ffb] shrink-0 mt-0.5" />
              <span>
                Tính năng yêu cầu rút tiền & giải ngân (Payout) sẽ ra mắt ở giai đoạn tiếp theo (STEP 10).
              </span>
            </div>
            <button
              type="button"
              disabled
              title="Tính năng rút tiền sẽ khả dụng ở STEP 10"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#2b2438] text-slate-400 dark:text-slate-500 text-xs font-semibold cursor-not-allowed shrink-0"
            >
              <Lock className="w-3.5 h-3.5" />
              Rút tiền (Sắp ra mắt)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
