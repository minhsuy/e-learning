'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Landmark, RefreshCw, ShieldCheck, WifiOff } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { RouteGuard } from '@/components/auth/route-guard';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { enrollmentService } from '@/services/enrollment.service';
import { getOrderPaymentInstructions } from '@/services/payment.service';
import { usePaymentStatus } from '@/hooks/use-payment-status';
import { formatVnd, isPaymentInstructions, paymentAccessReady, recallCheckout } from '@/lib/payment';
import { PaymentCountdown, PaymentInstructions } from './payment-instructions';
import { PaymentStatusView } from './payment-status-view';
import { PaymentOrderSummaryView, PaymentSkeleton } from './payment-order-summary';
import { AppApiError } from '@/types/api';
import type { PaymentInstructionsData } from '@/types/payment';

function PaymentContent({ orderId }: { orderId: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const handoff = user ? recallCheckout(user.id, orderId) : null;
  const { status, error, busy, paused, refresh } = usePaymentStatus(orderId);
  const [recovery, setRecovery] = useState<PaymentInstructionsData | null>(null);
  const [recoveryError, setRecoveryError] = useState<Error | null>(null);
  const [retry, setRetry] = useState(0);
  const [deadlineReached, setDeadlineReached] = useState(false);
  const [enrollmentWarning, setEnrollmentWarning] = useState(false);
  const order = recovery?.order ?? (handoff ? { ...handoff.order, course: handoff.order.course ?? null } : null);
  const currentStatus = status ?? recovery?.status ?? null;
  const accessReady = paymentAccessReady(currentStatus);
  const onDeadline = useCallback(() => { setDeadlineReached(true); refresh(); }, [refresh]);

  useEffect(() => {
    const controller = new AbortController();
    const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]);
    async function recover() {
      try {
        const response = await getOrderPaymentInstructions(orderId, signal);
        if (!response.success || response.data?.order.id !== orderId || response.data.status.orderId !== orderId) throw new Error('Invalid payment recovery');
        if (!controller.signal.aborted) { setRecovery(response.data); setRecoveryError(null); }
      } catch (failure) {
        if (!controller.signal.aborted) setRecoveryError(failure instanceof Error ? failure : new Error('Payment recovery unavailable'));
      }
    }
    void recover();
    return () => controller.abort();
  }, [orderId, retry]);

  useEffect(() => {
    if (!accessReady) return;
    const controller = new AbortController();
    const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]);
    void enrollmentService.getMyEnrollments({ signal }).catch(() => {
      if (!controller.signal.aborted) setEnrollmentWarning(true);
    });
    router.refresh();
    return () => controller.abort();
  }, [accessReady, router]);

  const failure = [error, recoveryError].find(item => item instanceof AppApiError && [401, 403, 404].includes(item.statusCode));
  const forbidden = failure instanceof AppApiError ? failure.statusCode : null;
  const payment = recovery?.payment;
  const canPay = currentStatus?.paymentState === 'pending' && currentStatus.status === 'pending' &&
    currentStatus.paymentMethod === 'sepay_bank_transfer' && !error && !recoveryError && !deadlineReached &&
    isPaymentInstructions(payment) && payment.paymentCode === currentStatus.paymentCode && payment.expiresAt === currentStatus.expiresAt;
  const retryAll = () => { setRetry(value => value + 1); refresh(); };
  return <div className="mx-auto max-w-[1120px] px-4 py-6 sm:px-7 sm:py-8 lg:px-8 lg:py-10">
    <header className="mb-7 sm:mb-9">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link href={order?.course?.slug && !forbidden ? `/courses/${encodeURIComponent(order.course.slug)}` : '/courses'} className="inline-flex min-h-11 items-center gap-2 rounded-lg text-xs font-medium text-muted-foreground outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"><ArrowLeft aria-hidden="true" className="size-4" /> Quay lại khóa học</Link>
        <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><ShieldCheck aria-hidden="true" className="size-3.5 text-primary" /> Xác nhận thanh toán tự động</span>
      </div>
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">TMdemy / Thanh toán</p>
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Thanh toán khóa học</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Hoàn tất một bước nhỏ. Bắt đầu hành trình học của bạn.</p>
    </header>
    {forbidden ? <section role="alert" className="mx-auto max-w-lg rounded-2xl border border-border/70 bg-card p-6 text-center sm:p-10">
      <ShieldCheck aria-hidden="true" className="mx-auto mb-4 size-9 text-muted-foreground" />
      <h2 className="text-xl font-semibold">{forbidden === 401 ? 'Vui lòng đăng nhập lại' : forbidden === 403 ? 'Bạn không có quyền xem đơn này' : 'Không tìm thấy đơn thanh toán'}</h2>
      <p className="mt-3 text-sm text-muted-foreground">Thông tin đơn hàng chỉ dành cho tài khoản được cấp quyền.</p>
      <Link className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground" href={forbidden === 401 ? `/login?redirect=${encodeURIComponent(`/payment/${orderId}`)}` : '/orders'}>{forbidden === 401 ? 'Đăng nhập lại' : 'Xem đơn hàng của tôi'}</Link>
    </section> : <div className="grid min-w-0 items-start gap-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-7">
      <div className="order-2 min-w-0 lg:order-1">
        {order ? <PaymentOrderSummaryView order={order} paymentMethod={currentStatus?.paymentMethod} /> : <div className="rounded-2xl border border-border/70 bg-card"><PaymentSkeleton /></div>}
        <div className="mt-5 px-1"><h2 className="text-xs font-semibold">Thanh toán trong 3 bước</h2><ol className="mt-3 space-y-3 text-xs leading-relaxed text-muted-foreground">{['Mở ứng dụng ngân hàng của bạn.', 'Quét mã QR, kiểm tra người nhận và số tiền.', 'Hoàn tất chuyển khoản, chờ xác nhận tự động.'].map((text, i) => <li key={text} className="flex gap-3"><span className="flex size-5 shrink-0 items-center justify-center rounded-full border border-border text-[10px] font-semibold">{i + 1}</span><span>{text}</span></li>)}</ol></div>
      </div>
      <div className="order-1 min-w-0 lg:order-2">
        <section aria-label="Thanh toán VietQR" className="overflow-hidden rounded-[20px] border border-border/70 bg-card text-card-foreground shadow-[0_4px_24px_rgb(0_0_0/0.025)]">
          {!currentStatus && !error && !recoveryError ? <PaymentSkeleton /> : <div className="space-y-5 p-5 sm:p-7">
            {(error || recoveryError) && <div role="alert" className="rounded-xl border border-amber-200/60 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
              <div className="flex gap-3"><WifiOff aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-amber-700 dark:text-amber-400" /><div><p className="text-sm font-medium">Không thể cập nhật trạng thái lúc này.</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">Đây là lỗi kết nối, chưa phải kết quả thanh toán. {paused ? 'Bạn có thể thử lại bên dưới.' : 'Hệ thống sẽ thử kết nối lại khi có thể.'}</p>{currentStatus && <p className="mt-2 text-xs text-muted-foreground">Trạng thái gần nhất: {currentStatus.paymentState === 'pending' ? 'Chờ thanh toán' : currentStatus.paymentState === 'completed' ? 'Đơn đã hoàn tất' : 'Cần kiểm tra lại'}. Trạng thái hiện tại chưa được xác nhận lại.</p>}</div></div>
            </div>}
            {currentStatus?.paymentState === 'pending' && !error && !recoveryError && <>
              <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs text-muted-foreground">Số tiền thanh toán</p><p className="mt-1 text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl">{order ? formatVnd(order.total) : '—'}</p></div><span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-primary/5 px-3 py-1.5 text-[11px] font-medium text-primary"><Landmark aria-hidden="true" className="size-3.5" /> VietQR</span></div>
              <PaymentCountdown expiresAt={currentStatus.expiresAt} onDeadline={onDeadline} />
              {canPay && payment ? <PaymentInstructions key={payment.paymentCode} payment={payment} /> : !recovery ? <PaymentSkeleton /> : <p role="status" className="rounded-xl bg-muted p-4 text-sm leading-relaxed">{deadlineReached ? 'Đang kiểm tra kết quả tại thời điểm hết hạn. Không sử dụng tiếp hướng dẫn chuyển khoản cũ.' : 'Đơn này hiện không có hướng dẫn chuyển khoản khả dụng. Vui lòng kiểm tra lại trạng thái hoặc liên hệ hỗ trợ trước khi chuyển tiền.'}</p>}
            </>}
            {currentStatus && !error && !recoveryError && <PaymentStatusView status={currentStatus} courseSlug={order?.course?.slug} order={order} />}
            {paused && <p role="status" className="text-center text-xs text-muted-foreground">Đã tạm dừng kiểm tra tự động. Dùng nút bên dưới để kết nối lại.</p>}
            {enrollmentWarning && <p role="status" className="text-xs text-muted-foreground">Quyền học đã xác nhận nhưng chưa tải lại được danh sách khóa học. Vui lòng tải lại trang khóa học.</p>}
            <Button variant="ghost" className="min-h-11 w-full gap-2 text-xs text-muted-foreground" disabled={busy} onClick={retryAll}><RefreshCw aria-hidden="true" className={`size-3.5 ${busy ? 'motion-safe:animate-spin' : ''}`} />{busy ? 'Đang kiểm tra…' : 'Kiểm tra trạng thái thanh toán'}</Button>
          </div>}
        </section>
        <p className="mt-4 flex flex-wrap items-center justify-center gap-1 px-2 text-center text-[11px] text-muted-foreground">Cần kiểm tra giao dịch? <Link href="/orders" className="inline-flex min-h-11 items-center gap-1 rounded text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring">Xem đơn hàng <ArrowRight aria-hidden="true" className="size-3" /></Link></p>
      </div>
    </div>}
  </div>;
}

export function PaymentCheckout({ orderId }: { orderId: string }) {
  const { user } = useAuth();
  return <AppShell><RouteGuard requireAuth allowedRoles={['user', 'teacher', 'admin']}><PaymentContent key={`${user?.id}:${orderId}`} orderId={orderId} /></RouteGuard></AppShell>;
}
