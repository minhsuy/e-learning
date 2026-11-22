import Link from 'next/link';
import { ArrowRight, Check, CircleDashed, Clock3, SearchCheck, ShieldAlert, X } from 'lucide-react';
import { formatVnd, paymentAccessReady } from '@/lib/payment';
import type { OrderPaymentStatus, PaymentOrderSummary } from '@/types/payment';

export function PaymentStatusView({ status, courseSlug, order }: { status: OrderPaymentStatus; courseSlug?: string; order?: PaymentOrderSummary | null }) {
  const ready = paymentAccessReady(status);
  if (status.paymentState === 'pending') return <div role="status" aria-live="polite" className="flex items-center gap-3 rounded-xl bg-primary/5 px-4 py-3">
    <CircleDashed aria-hidden="true" className="size-5 shrink-0 text-primary motion-safe:animate-spin motion-reduce:animate-none [animation-duration:5s]" />
    <div><p className="text-xs font-semibold text-foreground">Đang chờ ngân hàng xác nhận thanh toán...</p><p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">Hệ thống sẽ tự động cập nhật khi nhận được giao dịch.</p></div>
  </div>;
  const content = {
    completed: ready ? ['Thanh toán thành công', 'Mọi thứ đã sẵn sàng. Chúc bạn có những giờ học thật hiệu quả!'] : ['Đơn đã hoàn tất, quyền học chưa sẵn sàng', 'Chưa thể vào học. Vui lòng kiểm tra lại trạng thái hoặc liên hệ hỗ trợ để kiểm tra quyền truy cập.'],
    rejected: ['Đơn thanh toán bị từ chối', 'Nếu đã chuyển tiền, vui lòng liên hệ hỗ trợ trước khi tạo đơn khác.'],
    expired: ['Đơn hàng đã hết hạn', 'Không tiếp tục dùng mã QR hoặc nội dung chuyển khoản cũ. Nếu bạn đã chuyển khoản, hãy liên hệ hỗ trợ để kiểm tra giao dịch trước khi tạo đơn mới.'],
    manual_review: ['Thanh toán đang được kiểm tra', 'Giao dịch cần được xác minh thêm. Vui lòng kiểm tra lại trạng thái hoặc liên hệ hỗ trợ với mã đơn. Không chuyển khoản lại.'],
  }[status.paymentState];
  const Icon = ready ? Check : status.paymentState === 'expired' ? Clock3 : status.paymentState === 'manual_review' ? SearchCheck : status.paymentState === 'rejected' ? X : ShieldAlert;
  const color = ready ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' : status.paymentState === 'rejected' ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400' : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400';
  return <section aria-live="polite" className="flex flex-col items-center px-1 py-6 text-center sm:py-10">
    <div className={`mb-6 flex size-16 items-center justify-center rounded-full ${color}`}><Icon aria-hidden="true" className="size-8 stroke-[1.5]" /></div>
    <h2 className="max-w-sm text-2xl font-semibold leading-tight tracking-tight">{content?.[0] ?? 'Không nhận diện được trạng thái thanh toán'}</h2>
    <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">{content?.[1] ?? 'Vui lòng kiểm tra lại hoặc liên hệ hỗ trợ.'}</p>
    {order && <div className="my-6 w-full rounded-xl bg-muted/50 p-4 text-left"><p className="text-sm font-medium">{order.course?.title || 'Khóa học đã chọn'}</p><p className="mt-2 text-xl font-semibold tabular-nums">{formatVnd(order.total)}</p><p className="mt-2 break-all text-xs text-muted-foreground">Mã đơn: {order.code || order.id}</p></div>}
    {status.paidAt && <p className="mb-5 text-xs text-muted-foreground">Thời điểm thanh toán: {new Date(status.paidAt).toLocaleString('vi-VN')}</p>}
    {ready && <div className="mt-3 flex w-full flex-col gap-2">
      {courseSlug && <Link className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground outline-none transition-colors hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" href={`/learn/${encodeURIComponent(courseSlug)}`}>Bắt đầu học <ArrowRight aria-hidden="true" className="size-4" /></Link>}
      <Link className="inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-sm font-medium text-muted-foreground outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring" href="/my-courses">Khóa học của tôi</Link>
    </div>}
    {(status.paymentState === 'expired' || status.paymentState === 'rejected') && courseSlug && <div className="mt-4 w-full space-y-2"><p className="text-xs leading-relaxed text-muted-foreground">Chỉ tạo đơn khác nếu bạn chưa chuyển tiền cho đơn này.</p><Link href={`/checkout?course=${encodeURIComponent(courseSlug)}`} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-border px-4 text-sm font-medium outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring">Quay lại checkout <ArrowRight aria-hidden="true" className="size-4" /></Link></div>}
  </section>;
}
