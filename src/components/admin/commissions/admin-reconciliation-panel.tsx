'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import {
  extractCommissionApiError,
  formatCommissionDateTime,
  getClassificationLabel,
  NormalizedCommissionError,
  validateReconciliationDateSpan,
} from '@/lib/commission-earnings';
import { formatVnd, isZeroVnd } from '@/lib/vndCurrency';
import { adminCommissionService } from '@/services/admin-commission.service';
import {
  AdminReconciliationData,
  HistoricalOrderClassification,
  ReconciliationSeverity,
  ReconciliationStatus,
} from '@/types/commission-earnings';

const CLASSIFICATION_KEYS: HistoricalOrderClassification[] = [
  'RECOGNIZED_VALID',
  'CONFIRMED_MISSING_EARNING',
  'INVALID_EARNING',
  'INSUFFICIENT_HISTORICAL_EVIDENCE',
  'INTENTIONALLY_EXCLUDED_FEATURE_DISABLED',
  'CONFIRMED_INELIGIBLE',
];

function getStatusBadge(status: ReconciliationStatus) {
  switch (status) {
    case 'CONSISTENT':
      return {
        label: 'CONSISTENT — Nhất quán toàn vẹn',
        cls: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/50',
        Icon: CheckCircle2,
      };
    case 'INCONSISTENT':
      return {
        label: 'INCONSISTENT — Phát hiện sai lệch',
        cls: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800/50',
        Icon: ShieldAlert,
      };
    case 'INCOMPLETE':
    default:
      return {
        label: 'INCOMPLETE — Quét bị cắt giới hạn (truncated)',
        cls: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/50',
        Icon: AlertTriangle,
      };
  }
}

function getSeverityBadgeClass(severity: ReconciliationSeverity): string {
  switch (severity) {
    case 'CRITICAL':
      return 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300';
    case 'HIGH':
      return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950/60 dark:text-orange-300';
    case 'MEDIUM':
    case 'WARNING':
      return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300';
    case 'INFO':
    default:
      return 'bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300';
  }
}

export function AdminReconciliationPanel() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [limitInput, setLimitInput] = useState('200');
  const [validationError, setValidationError] = useState<string | null>(null);

  const [data, setData] = useState<AdminReconciliationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<NormalizedCommissionError | null>(null);

  const runReconciliation = useCallback(
    async (signal?: AbortSignal) => {
      const spanCheck = validateReconciliationDateSpan(from, to);
      if (!spanCheck.valid) {
        setValidationError(spanCheck.error || 'Khoảng ngày đối soát không hợp lệ.');
        setLoading(false);
        return;
      }

      const parsedLimit = Number(limitInput);
      if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 200) {
        setValidationError('Giới hạn quét (limit) phải là số nguyên từ 1 đến 200.');
        setLoading(false);
        return;
      }

      setValidationError(null);
      setLoading(true);
      setError(null);

      try {
        const res = await adminCommissionService.getReconciliation(
          {
            from: from || undefined,
            to: to || undefined,
            limit: parsedLimit,
          },
          { signal }
        );
        setData(res.data);
      } catch (err) {
        if ((err as { name?: string })?.name === 'AbortError') return;
        setError(extractCommissionApiError(err, 'Không thể chạy công cụ đối soát tài chính.'));
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [from, to, limitInput]
  );

  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(() => {
      if (!controller.signal.aborted) void runReconciliation(controller.signal);
    });
    return () => controller.abort();
  }, [runReconciliation]);

  const statusMeta = data ? getStatusBadge(data.status) : null;

  return (
    <div className="space-y-6">
      {/* Strictly Read-Only Banner & Filter Form */}
      <div className="rounded-2xl bg-white dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="p-2 rounded-xl bg-[#f7f1ff] dark:bg-[#2b2438] text-[#7240b8] dark:text-[#a87ffb] shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-[#1c192c] dark:text-[#f4eeff]">
                  Công cụ Đối soát Tài chính Hoa hồng (Read-Only)
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-[#2b2438] text-[#4b4452] dark:text-[#cdc3d4] border border-slate-200 dark:border-[#3c334d]">
                  <Eye className="w-3 h-3" />
                  automaticRepair: false
                </span>
              </div>
              <p className="text-xs text-[#635a72] dark:text-[#a9a0b2] mt-0.5">
                Kiểm tra toàn vẹn giữa Đơn hàng SePay, PaymentTransaction, TeacherEarning, Chính sách & Sổ cái trong giao dịch READ ONLY. Khoảng lọc tối đa 31 ngày.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#635a72] dark:text-[#a9a0b2] mb-1">
              Từ ngày (YYYY-MM-DD)
            </label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full h-9 px-3 rounded-xl border border-[#e5daf7] dark:border-[#342c44] bg-[#fdfbff] dark:bg-[#1f1b29] text-xs"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#635a72] dark:text-[#a9a0b2] mb-1">
              Đến ngày (tối đa +31 ngày)
            </label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full h-9 px-3 rounded-xl border border-[#e5daf7] dark:border-[#342c44] bg-[#fdfbff] dark:bg-[#1f1b29] text-xs"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#635a72] dark:text-[#a9a0b2] mb-1">
              Giới hạn quét (1 – 200)
            </label>
            <input
              type="number"
              min={1}
              max={200}
              step={1}
              value={limitInput}
              onChange={(e) => setLimitInput(e.target.value)}
              className="w-full h-9 px-3 rounded-xl border border-[#e5daf7] dark:border-[#342c44] bg-[#fdfbff] dark:bg-[#1f1b29] text-xs tabular-nums"
            />
          </div>

          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={() => {
                setFrom('');
                setTo('');
                setLimitInput('200');
              }}
              className="px-3 h-9 rounded-xl border border-[#e5daf7] dark:border-[#342c44] text-xs font-semibold text-[#635a72] dark:text-[#cdc3d4] cursor-pointer"
            >
              Xóa lọc
            </button>
            <button
              type="button"
              onClick={() => runReconciliation()}
              disabled={loading}
              className="flex-1 h-9 inline-flex items-center justify-center gap-1.5 px-3 rounded-xl bg-[#7240b8] hover:bg-[#5e3299] disabled:opacity-50 text-white text-xs font-bold cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Chạy đối soát
            </button>
          </div>
        </div>

        {validationError && (
          <p className="text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 rounded-xl px-3 py-2">
            {validationError}
          </p>
        )}
      </div>

      {error && (
        <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 p-4 flex items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <p className="text-xs text-rose-800 dark:text-rose-200">{error.message}</p>
          </div>
          <button
            type="button"
            onClick={() => runReconciliation()}
            className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      )}

      {loading && (
        <div className="space-y-4 animate-pulse">
          <div className="h-28 rounded-2xl bg-white dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438]" />
          <div className="h-56 rounded-2xl bg-white dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438]" />
        </div>
      )}

      {!loading && data && statusMeta && (
        <>
          {/* Status + Discrepancy + Scan Completeness */}
          <div className="rounded-2xl bg-white dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] p-5 shadow-2xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-extrabold border ${statusMeta.cls}`}
              >
                <statusMeta.Icon className="w-4 h-4" />
                {statusMeta.label}
              </span>
              <span className="text-xs text-[#635a72] dark:text-[#a9a0b2] tabular-nums">
                Thời điểm chụp đối soát: <strong>{formatCommissionDateTime(data.generatedAt)}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="rounded-xl bg-[#fdfbff] dark:bg-[#1f1b29] border border-[#f1ebff] dark:border-[#2b2438] p-3.5">
                <p className="text-[11px] font-semibold text-[#635a72] dark:text-[#a9a0b2]">
                  Tổng sai lệch tuyệt đối (Absolute)
                </p>
                <p
                  className={`text-lg font-extrabold tabular-nums mt-1 ${
                    isZeroVnd(data.summary.totalAbsoluteDiscrepancyVnd)
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {formatVnd(data.summary.totalAbsoluteDiscrepancyVnd)}
                </p>
                <p className="text-[11px] text-[#7c7483] mt-0.5">
                  {data.summary.discrepancyCount} bất thường phát hiện
                </p>
              </div>

              <div className="rounded-xl bg-[#fdfbff] dark:bg-[#1f1b29] border border-[#f1ebff] dark:border-[#2b2438] p-3.5">
                <p className="text-[11px] font-semibold text-[#635a72] dark:text-[#a9a0b2]">
                  Sai lệch ròng có dấu (Net Signed)
                </p>
                <p
                  className={`text-lg font-extrabold tabular-nums mt-1 ${
                    isZeroVnd(data.summary.netSignedDiscrepancyVnd)
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-amber-700 dark:text-amber-300'
                  }`}
                >
                  {formatVnd(data.summary.netSignedDiscrepancyVnd, { showPlusSign: true })}
                </p>
                <p className="text-[11px] text-[#7c7483] mt-0.5">
                  Ảnh hưởng: {data.summary.affectedTeachers} GV • {data.summary.affectedEarnings} earning • {data.summary.affectedOrders} đơn
                </p>
              </div>

              <div className="rounded-xl bg-[#fdfbff] dark:bg-[#1f1b29] border border-[#f1ebff] dark:border-[#2b2438] p-3.5">
                <p className="text-[11px] font-semibold text-[#635a72] dark:text-[#a9a0b2]">
                  Độ phủ quét (Scan Completeness)
                </p>
                <p className="text-sm font-extrabold text-[#1c192c] dark:text-[#f4eeff] mt-1">
                  {data.scan.complete ? 'Hoàn chỉnh 100%' : 'Bị cắt giới hạn (Truncated)'}
                </p>
                <p className="text-[11px] text-[#7c7483] tabular-nums mt-0.5">
                  Đơn: {data.scan.checkedOrders}/{data.scan.totalOrdersInScope} • Earning: {data.scan.checkedEarnings}/{data.scan.totalEarningsInScope} • Bút toán: {data.scan.checkedLedgerEntries}
                </p>
              </div>

              <div className="rounded-xl bg-[#fdfbff] dark:bg-[#1f1b29] border border-[#f1ebff] dark:border-[#2b2438] p-3.5">
                <p className="text-[11px] font-semibold text-[#635a72] dark:text-[#a9a0b2]">
                  Tổng nghĩa vụ sổ cái
                </p>
                <p className="text-lg font-extrabold text-[#7240b8] dark:text-[#c4a6ff] tabular-nums mt-1">
                  {formatVnd(data.summary.totals.outstandingLiability)}
                </p>
                <p className="text-[11px] text-[#7c7483] tabular-nums mt-0.5">
                  Pending {formatVnd(data.summary.totals.pendingLiability)} • Avail {formatVnd(data.summary.totals.availableLiability)}
                </p>
              </div>
            </div>
          </div>

          {/* Classification Breakdown */}
          <div className="rounded-2xl bg-white dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] p-5 shadow-2xs">
            <h3 className="text-sm font-bold text-[#1c192c] dark:text-[#f4eeff] mb-3">
              Phân loại đơn hàng lịch sử trong phạm vi quét
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {CLASSIFICATION_KEYS.map((key) => {
                const meta = getClassificationLabel(key);
                const count = data.summary.classificationCounts[key] ?? 0;
                const countColor =
                  meta.tone === 'success'
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : meta.tone === 'danger' && count > 0
                    ? 'text-rose-600 dark:text-rose-400'
                    : meta.tone === 'warning' && count > 0
                    ? 'text-amber-700 dark:text-amber-300'
                    : 'text-[#1c192c] dark:text-[#f4eeff]';

                return (
                  <div
                    key={key}
                    className="rounded-xl border border-[#f1ebff] dark:border-[#2b2438] bg-[#fdfbff] dark:bg-[#1f1b29] p-3 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#1c192c] dark:text-[#f4eeff] truncate">
                        {meta.label}
                      </p>
                      <p className="text-[10px] font-mono text-[#7c7483] truncate">{key}</p>
                    </div>
                    <span className={`text-lg font-extrabold tabular-nums ${countColor}`}>
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Anomalies / Findings Table */}
          <div className="rounded-2xl bg-white dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] shadow-2xs overflow-hidden">
            <div className="px-5 py-4 border-b border-[#f1ebff] dark:border-[#2b2438] flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-[#1c192c] dark:text-[#f4eeff]">
                Danh sách bất thường & phát hiện ({data.findings.length})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#f1ebff] dark:border-[#2b2438] bg-[#fdfbff] dark:bg-[#1c1826] text-[11px] font-bold uppercase tracking-wider text-[#635a72] dark:text-[#a9a0b2]">
                    <th className="py-3 px-4">Mức độ</th>
                    <th className="py-3 px-3">Mã bất thường</th>
                    <th className="py-3 px-3">Đối tượng liên quan</th>
                    <th className="py-3 px-3">Kỳ vọng vs Thực tế</th>
                    <th className="py-3 px-4">Chi tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f7f1ff] dark:divide-[#2b2438]">
                  {data.findings.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-emerald-700 dark:text-emerald-400 font-semibold">
                        Không phát hiện bất thường nào trong phạm vi đối soát.
                      </td>
                    </tr>
                  ) : (
                    data.findings.map((finding, idx) => (
                      <tr key={`${finding.code}-${idx}`} className="hover:bg-[#fdfbff] dark:hover:bg-[#1f1b29]">
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getSeverityBadgeClass(
                              finding.severity
                            )}`}
                          >
                            {finding.severity}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-[#1c192c] dark:text-[#f4eeff]">
                          {finding.code}
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] text-[#635a72] dark:text-[#a9a0b2] space-y-0.5">
                          {finding.orderId && <div>Order: {finding.orderId}</div>}
                          {finding.earningId && <div>Earning: {finding.earningId}</div>}
                          {finding.teacherId && <div>Teacher: {finding.teacherId}</div>}
                          {!finding.orderId && !finding.earningId && !finding.teacherId && '—'}
                        </td>
                        <td className="py-3 px-3 text-[11px] tabular-nums">
                          {finding.expected || finding.actual ? (
                            <div className="space-y-0.5">
                              <div>
                                Expected: <strong>{finding.expected ?? '—'}</strong>
                              </div>
                              <div>
                                Actual: <strong className="text-rose-600 dark:text-rose-400">{finding.actual ?? '—'}</strong>
                              </div>
                            </div>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="py-3 px-4 text-[#4b4452] dark:text-[#cdc3d4] max-w-[280px]">
                          {finding.detail || '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
