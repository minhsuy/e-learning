import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Landmark, ReceiptText } from 'lucide-react';
import { formatVnd } from '@/lib/payment';
import type { PaymentOrderSummary } from '@/types/payment';

export function PaymentOrderSummaryView({ order, paymentMethod }: { order: PaymentOrderSummary; paymentMethod?: string | null }) {
  return <aside aria-label="Tóm tắt đơn hàng" className="min-w-0 rounded-2xl border border-border/70 bg-card p-5 text-card-foreground sm:p-6">
    <div className="mb-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground"><ReceiptText aria-hidden="true" className="size-4" /> Đơn hàng của bạn</div>
    {order.course?.image ? <Image unoptimized width={640} height={360} src={order.course.image} alt="" className="mb-5 aspect-video w-full rounded-xl object-cover" /> : <div className="mb-5 flex aspect-[2.6/1] items-center justify-center rounded-xl bg-primary/5 text-primary"><BookOpen aria-hidden="true" className="size-9 stroke-[1.25]" /></div>}
    <h2 className="text-lg font-semibold leading-snug tracking-tight">{order.course?.title || 'Khóa học đã chọn'}</h2>
    <p className="mt-2 text-xs text-muted-foreground">Quyền truy cập được mở sau khi xác nhận thanh toán.</p>
    <dl className="mt-6 space-y-3 text-sm">
      <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Giá khóa học</dt><dd className="font-medium tabular-nums">{formatVnd(order.amount)}</dd></div>
      {order.discount > 0 && <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Giảm giá</dt><dd className="font-medium tabular-nums text-emerald-700 dark:text-emerald-400">−{formatVnd(order.discount)}</dd></div>}
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-t border-border/70 pt-4"><dt className="font-medium">Tổng thanh toán</dt><dd className="text-2xl font-semibold tracking-tight tabular-nums">{formatVnd(order.total)}</dd></div>
    </dl>
    <div className="mt-6 space-y-3 border-t border-border/70 pt-5 text-xs">
      <p className="flex items-center gap-2 text-muted-foreground"><Landmark aria-hidden="true" className="size-4 shrink-0" />{paymentMethod === 'free' ? 'Đăng ký miễn phí' : paymentMethod === 'manual_bank_transfer' ? 'Chuyển khoản thủ công' : 'Chuyển khoản ngân hàng / VietQR'}</p>
      <p className="break-all text-muted-foreground">Mã đơn <span className="ml-1 font-medium text-foreground">{order.code || order.id}</span></p>
    </div>
    <Link className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-medium text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring" href={order.course?.slug ? `/courses/${encodeURIComponent(order.course.slug)}` : '/courses'}><ArrowLeft aria-hidden="true" className="size-4" /> Quay lại khóa học</Link>
  </aside>;
}

export function PaymentSkeleton() {
  return <div role="status" aria-label="Đang tải thông tin thanh toán" className="space-y-6 p-6 sm:p-8">
    <div className="space-y-3 motion-safe:animate-pulse"><div className="h-4 w-28 rounded bg-muted" /><div className="h-9 w-44 rounded bg-muted" /></div>
    <div className="mx-auto aspect-square w-full max-w-64 rounded-2xl bg-muted motion-safe:animate-pulse" />
    <div className="space-y-4 motion-safe:animate-pulse">{[0, 1, 2].map(i => <div key={i} className="h-12 rounded-xl bg-muted" />)}</div>
    <span className="sr-only">Đang tải thông tin thanh toán từ máy chủ.</span>
  </div>;
}
