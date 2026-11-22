'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Eye,
  RefreshCw,
  Search,
  Wallet,
} from 'lucide-react';
import { EarningsTimelineChart } from '@/components/commission/earnings-timeline-chart';
import {
  extractCommissionApiError,
  formatCommissionDateTime,
  isValidUuid,
  NormalizedCommissionError,
  validateCommissionCustomRange,
} from '@/lib/commission-earnings';
import { formatBpsPercent, formatVnd } from '@/lib/vndCurrency';
import { adminCommissionService } from '@/services/admin-commission.service';
import {
  AdminEarningsListData,
  AdminEarningsPeriod,
  AdminEarningsStatsData,
  CommissionTimezone,
  EarningSortBy,
  EarningStatus,
  SortOrder,
} from '@/types/commission-earnings';
import { AdminEarningDetailModal } from './admin-earning-detail-modal';
import { AdminTeacherWalletModal } from './admin-teacher-wallet-modal';

export function AdminEarningsExplorer() {
  // Stats filters
  const [period, setPeriod] = useState<AdminEarningsPeriod>('30days');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [timezone, setTimezone] = useState<CommissionTimezone>('Asia/Ho_Chi_Minh');
  const [teacherIdInput, setTeacherIdInput] = useState('');
  const [courseIdInput, setCourseIdInput] = useState('');
  const [filterValidationError, setFilterValidationError] = useState<string | null>(null);

  // Table filters
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<'' | EarningStatus>('');
  const [sortBy, setSortBy] = useState<EarningSortBy>('recognizedAt');
  const [order, setOrder] = useState<SortOrder>('desc');

  // Data states
  const [stats, setStats] = useState<AdminEarningsStatsData | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<NormalizedCommissionError | null>(null);

  const [listData, setListData] = useState<AdminEarningsListData | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<NormalizedCommissionError | null>(null);

  // Modals & Quick teacher inspect
  const [selectedEarningId, setSelectedEarningId] = useState<string | null>(null);
  const [inspectedTeacherId, setInspectedTeacherId] = useState<string | null>(null);
  const [quickTeacherUuid, setQuickTeacherUuid] = useState('');
  const [quickInspectError, setQuickInspectError] = useState<string | null>(null);

  const validTeacherId = teacherIdInput.trim()
    ? isValidUuid(teacherIdInput.trim())
      ? teacherIdInput.trim()
      : null
    : '';
  const validCourseId = courseIdInput.trim()
    ? isValidUuid(courseIdInput.trim())
      ? courseIdInput.trim()
      : null
    : '';

  const fetchStats = useCallback(
    async (signal?: AbortSignal) => {
      if (validTeacherId === null) {
        setFilterValidationError('Teacher ID phải là định dạng UUID hợp lệ.');
        return;
      }
      if (validCourseId === null) {
        setFilterValidationError('Course ID phải là định dạng UUID hợp lệ.');
        return;
      }
      const rangeCheck = validateCommissionCustomRange(period, startDate, endDate);
      if (!rangeCheck.valid) {
        setFilterValidationError(rangeCheck.error || 'Khoảng ngày không hợp lệ.');
        return;
      }
      setFilterValidationError(null);
      setStatsLoading(true);
      setStatsError(null);

      try {
        const res = await adminCommissionService.getEarningsStatistics(
          {
            period,
            startDate: period === 'custom' ? startDate : undefined,
            endDate: period === 'custom' ? endDate : undefined,
            timezone,
            teacherId: validTeacherId || undefined,
            courseId: validCourseId || undefined,
          },
          { signal }
        );
        setStats(res.data);
      } catch (err) {
        if ((err as { name?: string })?.name === 'AbortError') return;
        setStatsError(extractCommissionApiError(err, 'Không thể tải thống kê hoa hồng toàn nền tảng.'));
      } finally {
        if (!signal?.aborted) setStatsLoading(false);
      }
    },
    [period, startDate, endDate, timezone, validTeacherId, validCourseId]
  );

  const fetchList = useCallback(
    async (signal?: AbortSignal) => {
      if (validTeacherId === null || validCourseId === null) return;
      setListLoading(true);
      setListError(null);
      try {
        const res = await adminCommissionService.getEarnings(
          {
            page,
            limit: 10,
            status: status || undefined,
            teacherId: validTeacherId || undefined,
            courseId: validCourseId || undefined,
            from: period === 'custom' && startDate ? startDate : undefined,
            to: period === 'custom' && endDate ? endDate : undefined,
            timezone,
            sortBy,
            order,
          },
          { signal }
        );
        setListData(res.data);
      } catch (err) {
        if ((err as { name?: string })?.name === 'AbortError') return;
        setListError(extractCommissionApiError(err, 'Không thể tải danh sách thu nhập toàn hệ thống.'));
      } finally {
        if (!signal?.aborted) setListLoading(false);
      }
    },
    [page, status, validTeacherId, validCourseId, period, startDate, endDate, timezone, sortBy, order]
  );

  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(() => {
      if (!controller.signal.aborted) void fetchStats(controller.signal);
    });
    return () => controller.abort();
  }, [fetchStats]);

  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(() => {
      if (!controller.signal.aborted) void fetchList(controller.signal);
    });
    return () => controller.abort();
  }, [fetchList]);

  const handleQuickTeacherInspect = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = quickTeacherUuid.trim();
    if (!isValidUuid(trimmed)) {
      setQuickInspectError('Vui lòng nhập đúng Teacher UUID hợp lệ.');
      return;
    }
    setQuickInspectError(null);
    setInspectedTeacherId(trimmed);
  };

  const totalPages = listData?.pagination.totalPages || 0;

  return (
    <div className="space-y-6">
      {/* Global Filter Bar + Quick Teacher Wallet Lookup */}
      <div className="rounded-2xl bg-white dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] p-4 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#635a72] dark:text-[#a9a0b2] mb-1">
              Chu kỳ thống kê
            </label>
            <select
              value={period}
              onChange={(e) => {
                setPeriod(e.target.value as AdminEarningsPeriod);
                setPage(1);
              }}
              className="w-full h-9 px-2.5 rounded-xl border border-[#e5daf7] dark:border-[#342c44] bg-[#fdfbff] dark:bg-[#1f1b29] text-xs font-medium"
            >
              <option value="all">Toàn thời gian</option>
              <option value="7days">7 ngày gần nhất</option>
              <option value="30days">30 ngày gần nhất</option>
              <option value="12months">12 tháng gần nhất</option>
              <option value="custom">Tùy chỉnh khoảng ngày</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#635a72] dark:text-[#a9a0b2] mb-1">
              Múi giờ
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value as CommissionTimezone)}
              className="w-full h-9 px-2.5 rounded-xl border border-[#e5daf7] dark:border-[#342c44] bg-[#fdfbff] dark:bg-[#1f1b29] text-xs font-medium"
            >
              <option value="Asia/Ho_Chi_Minh">Asia/Ho_Chi_Minh</option>
              <option value="UTC">UTC</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#635a72] dark:text-[#a9a0b2] mb-1">
              Lọc Teacher UUID
            </label>
            <input
              type="text"
              value={teacherIdInput}
              onChange={(e) => {
                setTeacherIdInput(e.target.value);
                setPage(1);
              }}
              placeholder="UUID giảng viên..."
              className="w-full h-9 px-2.5 rounded-xl border border-[#e5daf7] dark:border-[#342c44] bg-[#fdfbff] dark:bg-[#1f1b29] text-xs font-mono"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#635a72] dark:text-[#a9a0b2] mb-1">
              Lọc Course UUID
            </label>
            <input
              type="text"
              value={courseIdInput}
              onChange={(e) => {
                setCourseIdInput(e.target.value);
                setPage(1);
              }}
              placeholder="UUID khóa học..."
              className="w-full h-9 px-2.5 rounded-xl border border-[#e5daf7] dark:border-[#342c44] bg-[#fdfbff] dark:bg-[#1f1b29] text-xs font-mono"
            />
          </div>

          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={() => {
                setPeriod('30days');
                setStartDate('');
                setEndDate('');
                setTeacherIdInput('');
                setCourseIdInput('');
                setStatus('');
                setPage(1);
              }}
              className="flex-1 h-9 px-3 rounded-xl border border-[#e5daf7] dark:border-[#342c44] text-xs font-semibold text-[#635a72] dark:text-[#cdc3d4] cursor-pointer"
            >
              Đặt lại
            </button>
            <button
              type="button"
              onClick={() => {
                fetchStats();
                fetchList();
              }}
              aria-label="Làm mới dữ liệu"
              className="h-9 px-3 rounded-xl bg-[#7240b8] hover:bg-[#5e3299] text-white cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {period === 'custom' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#f7f1ff] dark:border-[#2b2438]">
            <div>
              <label className="block text-[11px] font-semibold text-[#635a72] mb-1">
                Từ ngày (YYYY-MM-DD)
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full h-9 px-3 rounded-xl border border-[#e5daf7] dark:border-[#342c44] bg-[#fdfbff] dark:bg-[#1f1b29] text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#635a72] mb-1">
                Đến ngày (YYYY-MM-DD)
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full h-9 px-3 rounded-xl border border-[#e5daf7] dark:border-[#342c44] bg-[#fdfbff] dark:bg-[#1f1b29] text-xs"
              />
            </div>
          </div>
        )}

        {filterValidationError && (
          <p className="text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 rounded-xl px-3 py-2">
            {filterValidationError}
          </p>
        )}
      </div>

      {statsError && (
        <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 p-4 flex items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <p className="text-xs text-rose-800 dark:text-rose-200">{statsError.message}</p>
          </div>
          <button
            type="button"
            onClick={() => fetchStats()}
            className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Period Summary + Platform Outstanding Liabilities & Settled Disbursements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Period Summary */}
        <div className="rounded-2xl bg-white dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#1c192c] dark:text-[#f4eeff]">
              Tổng hợp hoa hồng trong kỳ
            </h3>
            <span className="text-[11px] text-[#7c7483] tabular-nums">
              {stats ? `${stats.periodSummary.earningCount} khoản` : '—'}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl bg-[#fdfbff] dark:bg-[#1f1b29] border border-[#f1ebff] dark:border-[#2b2438] p-3">
              <p className="text-[11px] text-[#7c7483]">Cơ sở tính (Base)</p>
              <p className="text-base font-extrabold text-[#1c192c] dark:text-[#f4eeff] tabular-nums mt-1">
                {statsLoading ? '...' : stats ? formatVnd(stats.periodSummary.totalCommissionBase) : '—'}
              </p>
            </div>
            <div className="rounded-xl bg-[#fdfbff] dark:bg-[#1f1b29] border border-[#f1ebff] dark:border-[#2b2438] p-3">
              <p className="text-[11px] text-[#7c7483]">Phân bổ Giảng viên</p>
              <p className="text-base font-extrabold text-[#7240b8] dark:text-[#c4a6ff] tabular-nums mt-1">
                {statsLoading ? '...' : stats ? formatVnd(stats.periodSummary.totalTeacherEarnings) : '—'}
              </p>
            </div>
            <div className="rounded-xl bg-[#fdfbff] dark:bg-[#1f1b29] border border-[#f1ebff] dark:border-[#2b2438] p-3">
              <p className="text-[11px] text-[#7c7483]">Doanh thu Nền tảng</p>
              <p className="text-base font-extrabold text-sky-600 dark:text-sky-400 tabular-nums mt-1">
                {statsLoading ? '...' : stats ? formatVnd(stats.periodSummary.totalPlatformShare) : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Outstanding Liabilities & Settled Disbursements */}
        <div className="rounded-2xl bg-white dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-[#1c192c] dark:text-[#f4eeff]">
              Nghĩa vụ công nợ Giảng viên (Sổ cái toàn sàn)
            </h3>
            <span className="text-[11px] text-[#7c7483] tabular-nums">
              {stats ? formatCommissionDateTime(stats.balanceAsOf) : '—'}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="rounded-xl bg-[#f7f1ff] dark:bg-[#2b2438] p-3">
              <p className="text-[10px] font-bold uppercase text-[#7240b8] dark:text-[#c4a6ff]">
                Tổng công nợ
              </p>
              <p className="text-sm font-extrabold text-[#1c192c] dark:text-[#f4eeff] tabular-nums mt-1">
                {statsLoading ? '...' : stats ? formatVnd(stats.outstandingLiabilities.totalOutstanding) : '—'}
              </p>
            </div>
            <div className="rounded-xl bg-[#fdfbff] dark:bg-[#1f1b29] border border-[#f1ebff] dark:border-[#2b2438] p-3">
              <p className="text-[10px] font-semibold text-[#7c7483]">Pending</p>
              <p className="text-sm font-bold text-amber-700 dark:text-amber-300 tabular-nums mt-1">
                {statsLoading ? '...' : stats ? formatVnd(stats.outstandingLiabilities.pendingBalance) : '—'}
              </p>
            </div>
            <div className="rounded-xl bg-[#fdfbff] dark:bg-[#1f1b29] border border-[#f1ebff] dark:border-[#2b2438] p-3">
              <p className="text-[10px] font-semibold text-[#7c7483]">Available</p>
              <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400 tabular-nums mt-1">
                {statsLoading ? '...' : stats ? formatVnd(stats.outstandingLiabilities.availableBalance) : '—'}
              </p>
            </div>
            <div className="rounded-xl bg-[#fdfbff] dark:bg-[#1f1b29] border border-[#f1ebff] dark:border-[#2b2438] p-3">
              <p className="text-[10px] font-semibold text-[#7c7483]">Paid Out / Res.</p>
              <p className="text-sm font-bold text-[#4b4452] dark:text-[#cdc3d4] tabular-nums mt-1">
                {statsLoading ? '...' : stats ? formatVnd(stats.settledDisbursements.paidOutBalance) : '—'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Platform Timeline Chart */}
      <EarningsTimelineChart
        timeline={stats?.timeline || []}
        loading={statsLoading}
        title="Biểu đồ hoa hồng toàn nền tảng theo thời gian"
        subtitle={`Ghi nhận theo recognizedAt • Múi giờ ${timezone}`}
      />

      {/* Quick Teacher Wallet Inspector Bar */}
      <form
        onSubmit={handleQuickTeacherInspect}
        className="rounded-2xl bg-[#fdfbff] dark:bg-[#1c1826] border border-[#e5daf7] dark:border-[#2b2438] p-4 flex flex-col sm:flex-row sm:items-center gap-3"
      >
        <div className="flex items-center gap-2 text-xs font-bold text-[#1c192c] dark:text-[#f4eeff] shrink-0">
          <Wallet className="w-4 h-4 text-[#7240b8] dark:text-[#a87ffb]" />
          <span>Tra cứu ví Giảng viên theo UUID (kể cả INACTIVE):</span>
        </div>
        <div className="flex-1 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-[#7c7483] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={quickTeacherUuid}
              onChange={(e) => {
                setQuickTeacherUuid(e.target.value);
                setQuickInspectError(null);
              }}
              placeholder="Dán Teacher UUID để xem số dư ví & lịch sử thu nhập..."
              className="w-full h-9 pl-8 pr-3 rounded-xl border border-[#e5daf7] dark:border-[#342c44] bg-white dark:bg-[#17141f] text-xs font-mono"
            />
          </div>
          <button
            type="submit"
            className="h-9 px-4 rounded-xl bg-[#7240b8] hover:bg-[#5e3299] text-white text-xs font-bold shrink-0 cursor-pointer"
          >
            Kiểm tra ví
          </button>
        </div>
        {quickInspectError && (
          <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{quickInspectError}</p>
        )}
      </form>

      {/* Platform Earnings Explorer Table */}
      <div className="rounded-2xl bg-white dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] shadow-2xs overflow-hidden">
        <div className="px-5 py-4 border-b border-[#f1ebff] dark:border-[#2b2438] flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-[#1c192c] dark:text-[#f4eeff]">
              Danh sách khoản thu nhập toàn hệ thống
            </h3>
            <p className="text-[11px] text-[#7c7483]">
              Nhấn vào dòng để xem bằng chứng thanh toán, bản chụp chính sách và bút toán sổ cái
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as '' | EarningStatus);
                setPage(1);
              }}
              className="h-8 px-2.5 rounded-lg border border-[#e5daf7] dark:border-[#342c44] bg-[#fdfbff] dark:bg-[#1f1b29] text-xs"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="pending">PENDING</option>
              <option value="available">AVAILABLE</option>
            </select>
            <select
              value={`${sortBy}:${order}`}
              onChange={(e) => {
                const [s, o] = e.target.value.split(':') as [EarningSortBy, SortOrder];
                setSortBy(s);
                setOrder(o);
                setPage(1);
              }}
              className="h-8 px-2.5 rounded-lg border border-[#e5daf7] dark:border-[#342c44] bg-[#fdfbff] dark:bg-[#1f1b29] text-xs"
            >
              <option value="recognizedAt:desc">Mới ghi nhận nhất</option>
              <option value="availableAt:asc">Mở khóa sớm nhất</option>
              <option value="teacherAmount:desc">Thu nhập GV cao nhất</option>
            </select>
          </div>
        </div>

        {listError && (
          <div className="m-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 p-3 text-xs text-rose-800 dark:text-rose-200">
            {listError.message}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#f1ebff] dark:border-[#2b2438] bg-[#fdfbff] dark:bg-[#1c1826] text-[11px] font-bold uppercase tracking-wider text-[#635a72] dark:text-[#a9a0b2]">
                <th className="py-3 px-4">Giảng viên</th>
                <th className="py-3 px-3">Khóa học / Mã đơn</th>
                <th className="py-3 px-3 text-right">Cơ sở</th>
                <th className="py-3 px-3 text-right">GV nhận / Nền tảng</th>
                <th className="py-3 px-3 text-center">Trạng thái</th>
                <th className="py-3 px-3">Ghi nhận</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f7f1ff] dark:divide-[#2b2438]">
              {listLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td colSpan={7} className="py-4 px-4">
                      <div className="h-5 w-full rounded bg-[#f7f1ff] dark:bg-[#221d2d]" />
                    </td>
                  </tr>
                ))
              ) : !listData || listData.earnings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-[#7c7483]">
                    Chưa có bản ghi thu nhập nào phù hợp bộ lọc.
                  </td>
                </tr>
              ) : (
                listData.earnings.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedEarningId(item.id)}
                    className="hover:bg-[#fdfbff] dark:hover:bg-[#1f1b29] cursor-pointer"
                  >
                    <td className="py-3 px-4 max-w-[180px]">
                      <p className="font-semibold text-[#1c192c] dark:text-[#f4eeff] truncate">
                        {item.teacher?.username || item.teacherId.slice(0, 8)}
                      </p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setInspectedTeacherId(item.teacherId);
                        }}
                        className="text-[11px] text-[#7240b8] dark:text-[#c4a6ff] hover:underline cursor-pointer"
                      >
                        Xem ví GV
                      </button>
                    </td>
                    <td className="py-3 px-3 max-w-[220px]">
                      <p className="font-semibold text-[#1c192c] dark:text-[#f4eeff] truncate">
                        {item.courseTitle}
                      </p>
                      <p className="text-[11px] font-mono text-[#7c7483]">
                        {item.orderCode || item.orderId.slice(0, 8)}
                      </p>
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums">
                      <p className="font-semibold text-[#1c192c] dark:text-[#f4eeff]">
                        {formatVnd(item.commissionBase)}
                      </p>
                      <p className="text-[11px] text-[#7c7483]">
                        {formatBpsPercent(item.teacherRateBps)} ({item.holdingPeriodDays}d)
                      </p>
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums">
                      <p className="font-extrabold text-emerald-700 dark:text-emerald-400">
                        {formatVnd(item.teacherAmount)}
                      </p>
                      <p className="text-[11px] text-sky-600 dark:text-sky-400">
                        {formatVnd(item.platformAmount)}
                      </p>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                          item.status === 'available'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-[11px] tabular-nums whitespace-nowrap text-[#635a72]">
                      {formatCommissionDateTime(item.recognizedAt)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEarningId(item.id);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#f7f1ff] dark:bg-[#2b2438] text-[#7240b8] dark:text-[#c4a6ff] text-[11px] font-semibold cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t border-[#f1ebff] dark:border-[#2b2438] flex items-center justify-between text-xs text-[#635a72]">
          <span>Tổng: {listData?.pagination.total || 0} khoản thu nhập</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1 || listLoading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-[#e5daf7] dark:border-[#342c44] disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="tabular-nums font-semibold">
              Trang {totalPages === 0 ? 0 : page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages || listLoading}
              onClick={() => setPage((p) => p + 1)}
              className="p-1.5 rounded-lg border border-[#e5daf7] dark:border-[#342c44] disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <AdminEarningDetailModal
        earningId={selectedEarningId}
        onClose={() => setSelectedEarningId(null)}
        onInspectTeacher={(tid) => {
          setSelectedEarningId(null);
          setInspectedTeacherId(tid);
        }}
      />

      <AdminTeacherWalletModal
        key={inspectedTeacherId || 'none'}
        teacherId={inspectedTeacherId}
        onClose={() => setInspectedTeacherId(null)}
        onSelectEarning={(eid) => {
          setInspectedTeacherId(null);
          setSelectedEarningId(eid);
        }}
      />
    </div>
  );
}
