'use client';

import { useEffect, useState } from 'react';
import { Check, Clock3, Copy, ImageOff, ScanLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/lib/toast';
import { formatPaymentTime, formatVnd, isPaymentInstructions, remainingPaymentSeconds } from '@/lib/payment';
import type { PaymentInstructions as Instructions } from '@/types/payment';

export function PaymentCountdown({ expiresAt, onDeadline }: { expiresAt: string | null; onDeadline: () => void }) {
  const [remaining, setRemaining] = useState<number | null>(null);
  useEffect(() => {
    let notified = false;
    const tick = () => {
      const value = remainingPaymentSeconds(expiresAt);
      setRemaining(value);
      if (value === 0 && !notified) { notified = true; onDeadline(); }
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [expiresAt, onDeadline]);
  return <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-xl bg-muted/60 px-3 py-3 text-xs text-muted-foreground">
    <Clock3 aria-hidden="true" className="size-3.5" />
    <span>{remaining === 0 ? 'Đang đối chiếu thời hạn với máy chủ' : 'Đơn hàng hết hạn sau'}</span>
    <span className={`font-semibold tabular-nums ${remaining !== null && remaining < 120 ? 'text-amber-700 dark:text-amber-400' : 'text-foreground'}`}>{formatPaymentTime(remaining)}</span>
    {remaining === 0 && <p className="w-full text-center">Chưa chuyển thêm tiền trong lúc chờ xác nhận.</p>}
  </div>;
}

export function PaymentInstructions({ payment }: { payment: Instructions }) {
  const [qrState, setQrState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [attempt, setAttempt] = useState(0);
  const [slow, setSlow] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), 12000);
    return () => clearTimeout(timer);
  }, [attempt]);
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(null), 2000);
    return () => clearTimeout(timer);
  }, [copied]);
  async function copy(value: string, label: string) {
    try { await navigator.clipboard.writeText(value); setCopied(label); toast.success(`Đã sao chép ${label}`); }
    catch { setCopied(null); toast.error('Không thể sao chép. Vui lòng chọn và sao chép thông tin bên dưới.'); }
  }
  if (!isPaymentInstructions(payment)) return <p role="alert" className="rounded-xl bg-amber-50 p-4 text-sm leading-relaxed text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">Thông tin chuyển khoản từ máy chủ chưa hợp lệ. Vui lòng kiểm tra trạng thái hoặc liên hệ hỗ trợ với mã đơn; không tự tạo nội dung chuyển khoản hay chuyển thêm tiền.</p>;
  const fields = [
    { label: 'Ngân hàng', value: payment.bankAccount.bankName },
    { label: 'Số tài khoản', value: payment.bankAccount.accountNumber, copyValue: payment.bankAccount.accountNumber, copyLabel: 'số tài khoản' },
    { label: 'Chủ tài khoản', value: payment.bankAccount.accountName },
    { label: 'Nội dung chuyển khoản', value: payment.transferContent, copyValue: payment.transferContent, copyLabel: 'nội dung chuyển khoản' },
    { label: 'Số tiền', value: formatVnd(payment.amount), copyValue: payment.amount, copyLabel: 'số tiền' },
  ];
  return <div className="space-y-6">
    <div className="rounded-2xl border border-border/60 bg-muted/25 px-3 pb-4 pt-5 sm:px-6">
      <p className="mb-4 flex items-center justify-center gap-2 text-xs font-medium text-muted-foreground"><ScanLine aria-hidden="true" className="size-4" /> Quét bằng ứng dụng ngân hàng</p>
      <div className="relative mx-auto aspect-square w-full max-w-[272px] overflow-hidden rounded-xl bg-white p-3 text-center text-slate-600 shadow-[0_2px_12px_rgb(0_0_0/0.04)] sm:p-4">
        {qrState === 'error' ? <div className="flex h-full flex-col items-center justify-center gap-3 text-sm"><ImageOff aria-hidden="true" className="size-7 text-slate-400" /><p>Không thể tải mã QR.</p><p className="text-xs">Bạn có thể dùng thông tin chuyển khoản bên dưới.</p><Button variant="outline" className="min-h-11" onClick={() => { setQrState('loading'); setSlow(false); setAttempt(value => value + 1); }}>Tải lại QR</Button></div> : <>
          {qrState === 'loading' && <div aria-label="Đang tải mã QR" role="status" className="absolute inset-4 rounded-lg bg-slate-100 motion-safe:animate-pulse" />}
          {/* The exact server-provided SVG stays outside the Next image optimizer. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img key={attempt} src={payment.qrUrl} alt="VietQR thanh toán đơn hàng" referrerPolicy="no-referrer" className={`relative h-full w-full object-contain ${qrState === 'loading' ? 'opacity-0' : 'opacity-100'}`} onLoad={() => setQrState('ready')} onError={() => setQrState('error')} />
        </>}
      </div>
      {slow && qrState === 'loading' && <p role="status" className="mt-3 text-center text-xs text-muted-foreground">QR tải chậm. Hãy dùng thông tin chuyển khoản bên dưới.</p>}
      <p className="mt-4 text-center text-[11px] font-medium tracking-[0.18em] text-muted-foreground">VIETQR · CHUYỂN KHOẢN NGÂN HÀNG</p>
    </div>
    <dl className="divide-y divide-border/60">{fields.map(({ label, value, copyValue, copyLabel }) => <div key={label} className="flex min-w-0 items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
      <div className="min-w-0"><dt className="text-xs text-muted-foreground">{label}</dt><dd className={`mt-1 select-text break-all text-sm font-semibold ${copyLabel === 'nội dung chuyển khoản' ? 'font-mono text-base tracking-wide text-primary' : 'text-foreground'}`}>{value}</dd></div>
      {copyValue !== undefined && copyLabel && <Button variant="ghost" className="min-h-11 min-w-11 shrink-0 rounded-xl text-muted-foreground hover:bg-primary/5 hover:text-primary" aria-label={`Sao chép ${copyLabel}`} onClick={() => void copy(copyValue, copyLabel)}>{copied === copyLabel ? <Check aria-hidden="true" className="size-4 text-emerald-600" /> : <Copy aria-hidden="true" className="size-4" />}</Button>}
    </div>)}</dl>
    <p className="rounded-xl bg-primary/5 px-4 py-3 text-xs leading-relaxed text-primary">Giữ nguyên nội dung chuyển khoản để hệ thống nhận diện tự động. Vui lòng chuyển đúng số tiền hiển thị.</p>
    <span role="status" aria-live="polite" className="sr-only">{copied ? `Đã sao chép ${copied}` : ''}</span>
  </div>;
}
