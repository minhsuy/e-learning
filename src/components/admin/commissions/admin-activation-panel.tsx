'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Power,
  AlertTriangle,
  RefreshCw,
  History,
  CheckCircle2,
  X,
} from 'lucide-react';
import {
  extractCommissionApiError,
  formatCommissionDateTime,
  NormalizedCommissionError,
} from '@/lib/commission-earnings';
import { toast } from '@/lib/toast';
import { adminCommissionService } from '@/services/admin-commission.service';
import { AdminCommissionActivationData } from '@/types/commission-earnings';

export function AdminActivationPanel() {
  const [data, setData] = useState<AdminCommissionActivationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<NormalizedCommissionError | null>(null);

  // Modal state
  const [targetEnabled, setTargetEnabled] = useState<boolean | null>(null);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [mutationError, setMutationError] = useState<NormalizedCommissionError | null>(null);

  const loadActivation = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminCommissionService.getActivation({ signal });
      setData(res.data);
    } catch (err) {
      if ((err as { name?: string })?.name === 'AbortError') return;
      setError(extractCommissionApiError(err, 'Không thể tải trạng thái kích hoạt hoa hồng.'));
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(() => {
      if (!controller.signal.aborted) void loadActivation(controller.signal);
    });
    return () => controller.abort();
  }, [loadActivation]);

  const handleConfirmToggle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (targetEnabled === null) return;
    if (!reason.trim()) {
      setMutationError({ statusCode: 400, message: 'Vui lòng nhập lý do thay đổi trạng thái (bắt buộc cho nhật ký kiểm toán).' });
      return;
    }

    setSubmitting(true);
    setMutationError(null);
    try {
      await adminCommissionService.setActivation({
        enabled: targetEnabled,
        reason: reason.trim(),
      });
      toast.success(
        targetEnabled
          ? 'Đã bật tính năng ghi nhận hoa hồng thành công!'
          : 'Đã tạm tắt tính năng ghi nhận hoa hồng!'
      );
      setTargetEnabled(null);
      setReason('');
      await loadActivation();
    } catch (err) {
      const normalized = extractCommissionApiError(
        err,
        'Không thể cập nhật trạng thái kích hoạt hoa hồng.'
      );
      setMutationError(normalized);
      toast.error(normalized.message);
    } finally {
      setSubmitting(false);
    }
  };

  const isEnabled = Boolean(data?.currentState.enabled);

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
            onClick={() => loadActivation()}
            className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Current Activation State Card */}
      <div className="rounded-2xl bg-white dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] p-5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div
              className={`p-3 rounded-2xl shrink-0 ${
                isEnabled
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              <Power className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-extrabold text-[#1c192c] dark:text-[#f4eeff]">
                  Trạng thái ghi nhận hoa hồng hệ thống
                </h2>
                {!loading && (
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase border ${
                      isEnabled
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/50'
                        : 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/50'
                    }`}
                  >
                    {isEnabled ? 'ĐANG BẬT (ENABLED)' : 'ĐANG TẮT (DISABLED)'}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#635a72] dark:text-[#a9a0b2] mt-1">
                {loading
                  ? 'Đang tải trạng thái cửa sổ kích hoạt...'
                  : isEnabled
                  ? `Đang tự động ghi nhận hoa hồng cho đơn hàng SePay hợp lệ từ ${formatCommissionDateTime(
                      data?.currentState.effectiveFrom
                    )}.`
                  : data?.currentState.effectiveFrom
                  ? `Đang tắt từ ${formatCommissionDateTime(data.currentState.effectiveFrom)}. Các khoản thu nhập lịch sử vẫn được giữ nguyên trên sổ cái.`
                  : 'Hệ thống hoa hồng chưa từng được bật. Yêu cầu có chính sách ACTIVE và 0 đơn SePay pending không tương thích trước khi bật.'}
              </p>
              {data?.currentState.reason && (
                <p className="text-xs text-[#4b4452] dark:text-[#cdc3d4] mt-1.5">
                  Lý do gần nhất: <span className="font-semibold">{data.currentState.reason}</span>
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => loadActivation()}
              aria-label="Làm mới trạng thái"
              className="p-2.5 rounded-xl border border-[#e5daf7] dark:border-[#342c44] text-[#635a72] dark:text-[#cdc3d4] hover:bg-[#f7f1ff] dark:hover:bg-[#221d2d] cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setMutationError(null);
                setReason('');
                setTargetEnabled(!isEnabled);
              }}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold text-white transition-colors cursor-pointer disabled:opacity-50 ${
                isEnabled
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {isEnabled ? 'Tạm tắt tính năng hoa hồng' : 'Bật tính năng hoa hồng'}
            </button>
          </div>
        </div>
      </div>

      {/* Audit History Table */}
      <div className="rounded-2xl bg-white dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] shadow-2xs overflow-hidden">
        <div className="px-5 py-4 border-b border-[#f1ebff] dark:border-[#2b2438] flex items-center gap-2">
          <History className="w-4 h-4 text-[#7240b8] dark:text-[#a87ffb]" />
          <h3 className="text-sm font-bold text-[#1c192c] dark:text-[#f4eeff]">
            Nhật ký cửa sổ kích hoạt (CommissionActivationWindow — {data?.history.length || 0})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#f1ebff] dark:border-[#2b2438] bg-[#fdfbff] dark:bg-[#1c1826] text-[11px] font-bold uppercase tracking-wider text-[#635a72] dark:text-[#a9a0b2]">
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-3">Hiệu lực từ</th>
                <th className="py-3 px-3">Kết thúc lúc</th>
                <th className="py-3 px-3">Lý do kiểm toán</th>
                <th className="py-3 px-4">Người thao tác (Admin ID)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f7f1ff] dark:divide-[#2b2438]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#7c7483]">
                    Đang tải lịch sử kích hoạt...
                  </td>
                </tr>
              ) : !data || data.history.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-[#7c7483] dark:text-[#968e9e]">
                    Chưa có lịch sử thay đổi trạng thái kích hoạt nào.
                  </td>
                </tr>
              ) : (
                data.history.map((win) => (
                  <tr key={win.id} className="hover:bg-[#fdfbff] dark:hover:bg-[#1f1b29]">
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                          win.enabled
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/50'
                            : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                        }`}
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        {win.enabled ? 'ENABLED' : 'DISABLED'}
                      </span>
                    </td>
                    <td className="py-3 px-3 tabular-nums whitespace-nowrap text-[#1c192c] dark:text-[#f4eeff]">
                      {formatCommissionDateTime(win.effectiveFrom)}
                    </td>
                    <td className="py-3 px-3 tabular-nums whitespace-nowrap text-[#635a72] dark:text-[#a9a0b2]">
                      {win.effectiveUntil ? formatCommissionDateTime(win.effectiveUntil) : 'Đang mở'}
                    </td>
                    <td className="py-3 px-3 text-[#1c192c] dark:text-[#f4eeff] max-w-[300px]">
                      {win.reason}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-[#7c7483] dark:text-[#968e9e]">
                      {win.changedById}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Toggle Modal */}
      {targetEnabled !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Xác nhận thay đổi trạng thái tính năng hoa hồng"
          onClick={() => !submitting && setTargetEnabled(null)}
        >
          <form
            onSubmit={handleConfirmToggle}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] shadow-2xl overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-[#f1ebff] dark:border-[#2b2438] flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#1c192c] dark:text-[#f4eeff]">
                {targetEnabled
                  ? 'Xác nhận BẬT tính năng ghi nhận hoa hồng'
                  : 'Xác nhận TẠM TẮT tính năng ghi nhận hoa hồng'}
              </h3>
              <button
                type="button"
                disabled={submitting}
                onClick={() => setTargetEnabled(null)}
                className="p-1.5 rounded-lg text-[#635a72] hover:bg-[#f7f1ff] dark:hover:bg-[#221d2d] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-xs text-[#635a72] dark:text-[#a9a0b2]">
                {targetEnabled
                  ? 'Hệ thống sẽ chạy kiểm tra an toàn (preflight) trong giao dịch SERIALIZABLE: bắt buộc có chính sách ACTIVE và 0 đơn SePay pending không tương thích.'
                  : 'Khi tắt, các đơn hàng hoàn tất mới sẽ không ghi nhận hoa hồng. Dữ liệu lịch sử và số dư hiện có vẫn được bảo toàn tuyệt đối.'}
              </p>

              {mutationError && (
                <div className="rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 p-3.5 text-xs text-rose-800 dark:text-rose-200 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                  <div>
                    <p className="font-bold">
                      {mutationError.errorCode
                        ? `Từ chối thao tác (${mutationError.errorCode})`
                        : 'Không thể cập nhật trạng thái'}
                    </p>
                    <p className="mt-0.5">{mutationError.message}</p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#1c192c] dark:text-[#f4eeff] mb-1">
                  Lý do thay đổi (Bắt buộc) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  maxLength={2000}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Nhập lý do cụ thể cho nhật ký kiểm toán..."
                  className="w-full p-3 rounded-xl border border-[#e5daf7] dark:border-[#342c44] bg-[#fdfbff] dark:bg-[#1f1b29] text-xs text-[#1c192c] dark:text-[#f4eeff]"
                />
              </div>
            </div>

            <div className="px-5 py-3.5 border-t border-[#f1ebff] dark:border-[#2b2438] flex items-center justify-end gap-2.5 bg-[#fdfbff] dark:bg-[#1c1826]">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setTargetEnabled(null)}
                className="px-4 py-2 rounded-xl border border-[#e5daf7] dark:border-[#342c44] text-xs font-semibold text-[#635a72] dark:text-[#cdc3d4] cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={submitting}
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white cursor-pointer disabled:opacity-50 ${
                  targetEnabled
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {submitting
                  ? 'Đang xử lý...'
                  : targetEnabled
                  ? 'Xác nhận Bật'
                  : 'Xác nhận Tắt'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
