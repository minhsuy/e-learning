'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  ShieldCheck,
  Plus,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  History,
} from 'lucide-react';
import {
  extractCommissionApiError,
  formatCommissionDateTime,
  NormalizedCommissionError,
} from '@/lib/commission-earnings';
import { toast } from '@/lib/toast';
import { formatBpsPercent, percentToBps } from '@/lib/vndCurrency';
import { adminCommissionService } from '@/services/admin-commission.service';
import { AdminCommissionPoliciesData } from '@/types/commission-earnings';

export function AdminPolicyPanel() {
  const [data, setData] = useState<AdminCommissionPoliciesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<NormalizedCommissionError | null>(null);

  // Create-and-activate form state
  const [name, setName] = useState('');
  const [teacherPercentInput, setTeacherPercentInput] = useState('70');
  const [holdingPeriodDays, setHoldingPeriodDays] = useState('7');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<NormalizedCommissionError | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadPolicies = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminCommissionService.getPolicies({ signal });
      setData(res.data);
    } catch (err) {
      if ((err as { name?: string })?.name === 'AbortError') return;
      setError(extractCommissionApiError(err, 'Không thể tải danh sách chính sách hoa hồng.'));
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(() => {
      if (!controller.signal.aborted) void loadPolicies(controller.signal);
    });
    return () => controller.abort();
  }, [loadPolicies]);

  const parsedTeacherBps = percentToBps(teacherPercentInput);
  const parsedPlatformBps = parsedTeacherBps !== null ? 10000 - parsedTeacherBps : null;
  const parsedHolding = Number(holdingPeriodDays);
  const holdingValid =
    holdingPeriodDays.trim() !== '' &&
    Number.isInteger(parsedHolding) &&
    parsedHolding >= 0 &&
    parsedHolding <= 30;

  // Match backend optimistic version check: currentActive?.version ?? latestVersion ?? 0
  const expectedCurrentVersion =
    data?.activePolicy?.version ??
    (data?.policies?.length ? Math.max(...data.policies.map((p) => p.version)) : 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMsg(null);

    if (!name.trim()) {
      setFormError({ statusCode: 400, message: 'Vui lòng nhập tên chính sách hoa hồng.' });
      return;
    }
    if (parsedTeacherBps === null || parsedPlatformBps === null) {
      setFormError({
        statusCode: 400,
        message: 'Tỷ lệ hoa hồng Giảng viên phải nằm trong khoảng 0% – 100% (tối đa 2 chữ số thập phân).',
      });
      return;
    }
    if (!holdingValid) {
      setFormError({
        statusCode: 400,
        message: 'Số ngày tạm giữ (holdingPeriodDays) phải là số nguyên từ 0 đến 30.',
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await adminCommissionService.createPolicy({
        name: name.trim(),
        teacherRateBps: parsedTeacherBps,
        platformRateBps: parsedPlatformBps,
        holdingPeriodDays: parsedHolding,
        expectedCurrentVersion,
        notes: notes.trim() ? notes.trim() : null,
      });

      const created = res.data.policy;
      setSuccessMsg(
        `Đã tạo và kích hoạt chính sách "${created.name}" (v${created.version}) thành công.`
      );
      toast.success(`Đã kích hoạt chính sách hoa hồng v${created.version}`);
      setName('');
      setNotes('');
      await loadPolicies();
    } catch (err) {
      const normalized = extractCommissionApiError(err, 'Không thể tạo chính sách hoa hồng mới.');
      setFormError(normalized);
      toast.error(normalized.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 p-4 flex items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <p className="text-xs text-rose-800 dark:text-rose-200">{error.message}</p>
          </div>
          <button
            type="button"
            onClick={() => loadPolicies()}
            className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Current Active Policy */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl bg-white dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] p-5 shadow-2xs">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#7240b8] dark:text-[#a87ffb]" />
                <h2 className="text-sm font-bold text-[#1c192c] dark:text-[#f4eeff]">
                  Chính sách đang có hiệu lực
                </h2>
              </div>
              <button
                type="button"
                onClick={() => loadPolicies()}
                aria-label="Tải lại chính sách"
                className="p-1.5 rounded-lg text-[#635a72] dark:text-[#a9a0b2] hover:bg-[#f7f1ff] dark:hover:bg-[#221d2d] cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {loading ? (
              <div className="space-y-2.5 animate-pulse">
                <div className="h-6 w-48 rounded bg-[#f7f1ff] dark:bg-[#221d2d]" />
                <div className="h-16 w-full rounded-xl bg-[#f7f1ff] dark:bg-[#221d2d]" />
              </div>
            ) : data?.activePolicy ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-base font-extrabold text-[#1c192c] dark:text-[#f4eeff]">
                    {data.activePolicy.name}
                  </p>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
                    ACTIVE • v{data.activePolicy.version}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <div className="rounded-xl bg-[#fdfbff] dark:bg-[#1f1b29] border border-[#f1ebff] dark:border-[#2b2438] p-3">
                    <p className="text-[11px] text-[#7c7483] dark:text-[#968e9e]">Giảng viên</p>
                    <p className="text-lg font-extrabold text-[#7240b8] dark:text-[#c4a6ff] tabular-nums">
                      {formatBpsPercent(data.activePolicy.teacherRateBps)}
                    </p>
                    <p className="text-[10px] font-mono text-[#7c7483]">
                      {data.activePolicy.teacherRateBps} bps
                    </p>
                  </div>
                  <div className="rounded-xl bg-[#fdfbff] dark:bg-[#1f1b29] border border-[#f1ebff] dark:border-[#2b2438] p-3">
                    <p className="text-[11px] text-[#7c7483] dark:text-[#968e9e]">Nền tảng</p>
                    <p className="text-lg font-extrabold text-sky-600 dark:text-sky-400 tabular-nums">
                      {formatBpsPercent(data.activePolicy.platformRateBps)}
                    </p>
                    <p className="text-[10px] font-mono text-[#7c7483]">
                      {data.activePolicy.platformRateBps} bps
                    </p>
                  </div>
                  <div className="rounded-xl bg-[#fdfbff] dark:bg-[#1f1b29] border border-[#f1ebff] dark:border-[#2b2438] p-3">
                    <p className="text-[11px] text-[#7c7483] dark:text-[#968e9e]">Tạm giữ</p>
                    <p className="text-lg font-extrabold text-[#1c192c] dark:text-[#f4eeff] tabular-nums">
                      {data.activePolicy.holdingPeriodDays}d
                    </p>
                    <p className="text-[10px] text-[#7c7483]">ngày</p>
                  </div>
                </div>

                <div className="text-xs text-[#635a72] dark:text-[#a9a0b2] space-y-1 pt-2 border-t border-[#f7f1ff] dark:border-[#2b2438]">
                  <p>
                    Hiệu lực từ:{' '}
                    <strong className="text-[#1c192c] dark:text-[#f4eeff] tabular-nums">
                      {formatCommissionDateTime(data.activePolicy.effectiveFrom)}
                    </strong>
                  </p>
                  {data.activePolicy.notes && (
                    <p className="italic">Ghi chú: {data.activePolicy.notes}</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 p-4 text-xs text-amber-800 dark:text-amber-300">
                Chưa có chính sách hoa hồng nào đang hoạt động. Bạn cần tạo và kích hoạt chính sách đầu tiên trước khi bật tính năng hoa hồng.
              </div>
            )}
          </div>
        </div>

        {/* Create & Activate New Policy Form */}
        <div className="lg:col-span-7">
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl bg-white dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] p-5 shadow-2xs space-y-4"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#7240b8] dark:text-[#a87ffb]" />
                <div>
                  <h2 className="text-sm font-bold text-[#1c192c] dark:text-[#f4eeff]">
                    Tạo & Kích hoạt Chính sách mới
                  </h2>
                  <p className="text-[11px] text-[#635a72] dark:text-[#a9a0b2]">
                    Phiên bản mới sẽ tự động thay thế phiên bản hiện hành (v{expectedCurrentVersion}) và không ảnh hưởng các khoản thu nhập lịch sử.
                  </p>
                </div>
              </div>
            </div>

            {formError && (
              <div className="rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 p-3.5 text-xs text-rose-800 dark:text-rose-200 space-y-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                  <div>
                    <p className="font-bold">
                      {formError.errorCode ? `[${formError.errorCode}] ` : ''}
                      Không thể lưu chính sách
                    </p>
                    <p className="mt-0.5">{formError.message}</p>
                  </div>
                </div>
                {formError.statusCode === 409 && (
                  <button
                    type="button"
                    onClick={() => {
                      setFormError(null);
                      loadPolicies();
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Tải lại phiên bản mới nhất
                  </button>
                )}
              </div>
            )}

            {successMsg && (
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 p-3 text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#1c192c] dark:text-[#f4eeff] mb-1">
                  Tên chính sách <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={120}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ví dụ: Standard 75/25 Policy Q4"
                  className="w-full h-10 px-3 rounded-xl border border-[#e5daf7] dark:border-[#342c44] bg-[#fdfbff] dark:bg-[#1f1b29] text-xs text-[#1c192c] dark:text-[#f4eeff]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1c192c] dark:text-[#f4eeff] mb-1">
                  Tỷ lệ Giảng viên (%) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  max={100}
                  required
                  value={teacherPercentInput}
                  onChange={(e) => setTeacherPercentInput(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-[#e5daf7] dark:border-[#342c44] bg-[#fdfbff] dark:bg-[#1f1b29] text-xs font-semibold tabular-nums text-[#1c192c] dark:text-[#f4eeff]"
                />
                <p className="text-[11px] text-[#7c7483] dark:text-[#968e9e] mt-1 tabular-nums">
                  {parsedTeacherBps !== null
                    ? `GV: ${parsedTeacherBps} bps (${formatBpsPercent(parsedTeacherBps)}) • Nền tảng: ${parsedPlatformBps} bps (${formatBpsPercent(parsedPlatformBps!)})`
                    : 'Nhập số từ 0 đến 100 (tối đa 2 chữ số thập phân)'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1c192c] dark:text-[#f4eeff] mb-1">
                  Số ngày tạm giữ (0 – 30 ngày) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step={1}
                  min={0}
                  max={30}
                  required
                  value={holdingPeriodDays}
                  onChange={(e) => setHoldingPeriodDays(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-[#e5daf7] dark:border-[#342c44] bg-[#fdfbff] dark:bg-[#1f1b29] text-xs font-semibold tabular-nums text-[#1c192c] dark:text-[#f4eeff]"
                />
                <p className="text-[11px] text-[#7c7483] dark:text-[#968e9e] mt-1">
                  0 ngày = mở khóa ngay khi đủ điều kiện
                </p>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#1c192c] dark:text-[#f4eeff] mb-1">
                  Ghi chú thay đổi (tuỳ chọn)
                </label>
                <textarea
                  rows={2}
                  maxLength={2000}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Lý do điều chỉnh tỷ lệ hoặc chu kỳ tạm giữ..."
                  className="w-full p-3 rounded-xl border border-[#e5daf7] dark:border-[#342c44] bg-[#fdfbff] dark:bg-[#1f1b29] text-xs text-[#1c192c] dark:text-[#f4eeff]"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#f7f1ff] dark:border-[#2b2438]">
              <span className="text-[11px] font-mono text-[#7c7483] dark:text-[#968e9e]">
                expectedCurrentVersion = {expectedCurrentVersion}
              </span>
              <button
                type="submit"
                disabled={submitting || loading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#7240b8] hover:bg-[#5e3299] disabled:opacity-50 text-white text-xs font-bold transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                {submitting ? 'Đang kích hoạt...' : 'Tạo & Kích hoạt Chính sách mới'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Immutable Version History Table */}
      <div className="rounded-2xl bg-white dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] shadow-2xs overflow-hidden">
        <div className="px-5 py-4 border-b border-[#f1ebff] dark:border-[#2b2438] flex items-center gap-2">
          <History className="w-4 h-4 text-[#7240b8] dark:text-[#a87ffb]" />
          <h3 className="text-sm font-bold text-[#1c192c] dark:text-[#f4eeff]">
            Lịch sử phiên bản chính sách bất biến ({data?.policies.length || 0})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#f1ebff] dark:border-[#2b2438] bg-[#fdfbff] dark:bg-[#1c1826] text-[11px] font-bold uppercase tracking-wider text-[#635a72] dark:text-[#a9a0b2]">
                <th className="py-3 px-4">Phiên bản</th>
                <th className="py-3 px-3">Tên chính sách</th>
                <th className="py-3 px-3 text-center">Tỷ lệ GV / Nền tảng</th>
                <th className="py-3 px-3 text-center">Tạm giữ</th>
                <th className="py-3 px-3 text-center">Trạng thái</th>
                <th className="py-3 px-3">Khoảng hiệu lực</th>
                <th className="py-3 px-4">Ghi chú</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f7f1ff] dark:divide-[#2b2438]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#7c7483]">
                    Đang tải lịch sử chính sách...
                  </td>
                </tr>
              ) : !data || data.policies.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-[#7c7483] dark:text-[#968e9e]">
                    Chưa có phiên bản chính sách nào được tạo.
                  </td>
                </tr>
              ) : (
                data.policies.map((pol) => (
                  <tr key={pol.id} className="hover:bg-[#fdfbff] dark:hover:bg-[#1f1b29]">
                    <td className="py-3 px-4 font-bold text-[#7240b8] dark:text-[#c4a6ff]">
                      v{pol.version}
                    </td>
                    <td className="py-3 px-3 font-semibold text-[#1c192c] dark:text-[#f4eeff]">
                      {pol.name}
                    </td>
                    <td className="py-3 px-3 text-center tabular-nums">
                      <span className="font-bold text-emerald-700 dark:text-emerald-400">
                        {formatBpsPercent(pol.teacherRateBps)}
                      </span>{' '}
                      /{' '}
                      <span className="font-semibold text-sky-600 dark:text-sky-400">
                        {formatBpsPercent(pol.platformRateBps)}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center tabular-nums">
                      {pol.holdingPeriodDays} ngày
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                          pol.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/50'
                            : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                        }`}
                      >
                        {pol.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-[11px] text-[#635a72] dark:text-[#a9a0b2] tabular-nums whitespace-nowrap">
                      <div>Từ: {formatCommissionDateTime(pol.effectiveFrom)}</div>
                      <div>Đến: {pol.effectiveUntil ? formatCommissionDateTime(pol.effectiveUntil) : 'Hiện tại'}</div>
                    </td>
                    <td className="py-3 px-4 text-[#635a72] dark:text-[#a9a0b2] max-w-[220px] truncate">
                      {pol.notes || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
