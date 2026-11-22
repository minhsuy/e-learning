'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, BookOpen, Check, Landmark, ShieldCheck, TicketPercent } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/auth-context';
import { courseService } from '@/services/course.service';
import { couponService } from '@/services/coupon.service';
import { enrollmentService } from '@/services/enrollment.service';
import { createPaymentCheckout } from '@/services/payment.service';
import { describeCheckoutFailure, formatVnd, hasLearningEnrollment, rememberCheckout, type CheckoutFailure } from '@/lib/payment';
import { toast } from '@/lib/toast';
import { AppApiError } from '@/types/api';
import type { ApiCourseDetail } from '@/types/course';
import type { CheckCouponData } from '@/types/coupon';

function CheckoutContent({ slug }: { slug: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const [course, setCourse] = useState<ApiCourseDetail | null>(null);
  const [owned, setOwned] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkoutFailure, setCheckoutFailure] = useState<CheckoutFailure | null>(null);
  const [authError, setAuthError] = useState(false);
  const [reload, setReload] = useState(0);
  const [code, setCode] = useState('');
  const [coupon, setCoupon] = useState<CheckCouponData | null>(null);
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const lock = useRef(false);
  useEffect(() => {
    const controller = new AbortController();
    const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]);
    async function load() {
      setLoading(true);
      setCheckoutFailure(null);
      try {
        const [details, enrollments] = await Promise.all([
          courseService.getCourseBySlug(slug, { signal }),
          enrollmentService.getMyEnrollments({ signal }),
        ]);
        if (controller.signal.aborted) return;
        if (!enrollments.success) throw new Error('Không thể xác minh quyền học hiện tại.');
        const id = details.data.id || details.data._id;
        setCourse(details.data);
        setOwned(Boolean(id && hasLearningEnrollment(enrollments.data, id, slug)));
        setError(null);
        setAuthError(false);
      } catch (error) {
        if (!controller.signal.aborted) {
          setError(error instanceof Error ? error.message : 'Không thể tải thông tin thanh toán.');
          setAuthError(error instanceof AppApiError && error.statusCode === 401);
        }
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }
    void load();
    return () => controller.abort();
  }, [slug, reload]);

  async function applyCoupon(event: React.FormEvent) {
    event.preventDefault();
    if (!course || !code.trim() || checking || lock.current) return;
    setChecking(true);
    setError(null);
    setCheckoutFailure(null);
    try {
      const response = await couponService.checkCoupon(
        { courseId: course.id || course._id || '', code: code.trim() },
        { signal: AbortSignal.timeout(15000) },
      );
      if (!response.success || !response.data) throw new Error('Không thể xác minh mã giảm giá.');
      setCoupon(response.data);
      toast.success('Đã áp dụng mã giảm giá.');
    } catch (error) {
      setCoupon(null);
      setError(error instanceof Error ? error.message : 'Mã giảm giá không hợp lệ.');
    } finally { setChecking(false); }
  }
  async function checkout() {
    if (!course || !user || lock.current || owned || checking) return;
    const courseId = course.id || course._id;
    if (!courseId) { setError('Thiếu mã khóa học.'); return; }
    lock.current = true;
    setSubmitting(true);
    setError(null);
    setCheckoutFailure(null);
    try {
      const response = await createPaymentCheckout(courseId, coupon?.coupon.code);
      if (!response.success || !response.data) throw new Error('Không nhận được đơn hàng. Hãy kiểm tra lịch sử đơn trước khi thử lại.');
      rememberCheckout(user.id, { ...response.data, order: { ...response.data.order, course: { title: course.title, slug: course.slug, image: course.image } } });
      router.push(`/payment/${encodeURIComponent(response.data.order.id)}`);
    } catch (error) {
      const failure = describeCheckoutFailure(error);
      setError(failure.message);
      setCheckoutFailure(failure);
      setAuthError(error instanceof AppApiError && error.statusCode === 401);
      lock.current = false;
      setSubmitting(false);
    }
  }
  if (loading) return <div role="status" aria-label="Đang tải đơn hàng" className="grid gap-6 lg:grid-cols-2">{[0, 1].map(i => <div key={i} className="h-80 rounded-2xl bg-muted motion-safe:animate-pulse" />)}</div>;
  return <div className="space-y-6">
    {error && <div role="alert" className="space-y-3 rounded-xl border border-destructive/40 bg-destructive/5 p-4"><p>{error}</p>{authError ? <Link className="underline" href={`/login?redirect=${encodeURIComponent(`/checkout?course=${slug}`)}`}>Đăng nhập lại</Link> : !course && <Button variant="outline" onClick={() => setReload(value => value + 1)}>Thử tải lại</Button>}<Link href="/orders" className="block text-sm underline">Kiểm tra lịch sử đơn hàng</Link></div>}
    {process.env.NODE_ENV === 'development' && checkoutFailure && <details className="rounded-xl border p-3 text-sm">
      <summary className="cursor-pointer font-semibold">Chẩn đoán checkout (development)</summary>
      <dl className="mt-2 space-y-1">
        <div><dt className="inline font-semibold">Request: </dt><dd className="inline">POST /api/payments/checkout</dd></div>
        <div><dt className="inline font-semibold">HTTP: </dt><dd className="inline">{checkoutFailure.httpStatus ?? 'Chưa nhận được phản hồi HTTP'}</dd></div>
        <div><dt className="inline font-semibold">Phân loại: </dt><dd className="inline">{checkoutFailure.category}</dd></div>
        {checkoutFailure.safeServerMessage && <div><dt className="inline font-semibold">Thông báo máy chủ: </dt><dd className="inline">{checkoutFailure.safeServerMessage}</dd></div>}
      </dl>
    </details>}
    {course && <div className="grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-10">
      <section className="min-w-0 space-y-4 rounded-2xl border border-border/70 bg-card p-5 text-card-foreground sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Khóa học bạn đã chọn</p>
        {course.image ? <div className="aspect-video overflow-hidden rounded-xl bg-muted"><Image unoptimized width={960} height={540} src={course.image} alt="" className="h-full w-full object-cover" /></div> : <div className="flex aspect-[2.6/1] items-center justify-center rounded-xl bg-primary/5 text-primary"><BookOpen aria-hidden="true" className="size-10 stroke-[1.25]" /></div>}
        <h2 className="text-xl font-semibold leading-snug tracking-tight">{course.title}</h2>
        {course.author?.username && <p className="text-sm text-muted-foreground">Giảng viên: {course.author.username}</p>}
        <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground"><Check aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-primary" /> Quyền học được mở sau khi thanh toán được xác nhận.</p>
        <Link href={`/courses/${encodeURIComponent(course.slug)}`} className="inline-flex min-h-11 items-center gap-2 rounded text-sm font-medium text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"><ArrowLeft aria-hidden="true" className="size-4" /> Quay lại khóa học</Link>
      </section>
      <section className="min-w-0 space-y-6 rounded-[20px] border border-border/70 bg-card p-5 text-card-foreground shadow-[0_4px_24px_rgb(0_0_0/0.025)] sm:p-7">
        {owned ? <><p>Bạn đã có quyền học khóa học này.</p><Link href={`/learn/${encodeURIComponent(course.slug)}`} className="inline-flex min-h-11 items-center rounded-xl bg-primary px-5 font-semibold text-primary-foreground">Vào học ngay</Link></> : <>
          <div><h2 className="text-lg font-semibold tracking-tight">Thông tin thanh toán</h2><p className="mt-1 text-xs leading-relaxed text-muted-foreground">Kiểm tra khóa học và ưu đãi trước khi tiếp tục.</p></div>
          <div className="flex items-center gap-3 rounded-xl border border-primary/25 bg-primary/5 p-4"><Landmark aria-hidden="true" className="size-5 shrink-0 text-primary" /><div className="min-w-0 flex-1"><p className="text-sm font-semibold">Chuyển khoản VietQR</p><p className="mt-1 text-xs text-muted-foreground">Quét mã từ ứng dụng ngân hàng của bạn</p></div><span className="flex size-4 shrink-0 items-center justify-center rounded-full border-[5px] border-primary bg-white" /></div>
          <form onSubmit={applyCoupon} className="space-y-3"><label htmlFor="payment-coupon" className="flex items-center gap-2 text-xs font-medium text-muted-foreground"><TicketPercent aria-hidden="true" className="size-4" /> Mã giảm giá</label><div className="flex min-w-0 gap-2"><Input id="payment-coupon" placeholder="Nhập mã ưu đãi" className="h-11 min-w-0 rounded-xl" value={code} disabled={submitting || checking} onChange={event => { setCode(event.target.value); setCoupon(null); }} /><Button variant="outline" className="min-h-11 rounded-xl px-4" disabled={!code.trim() || checking || submitting} type="submit">{checking ? 'Đang kiểm tra…' : 'Áp dụng'}</Button></div></form>
          {coupon && <div className="flex items-center justify-between gap-3 text-sm"><span>Mã: {coupon.coupon.code}</span><Button variant="ghost" disabled={submitting} onClick={() => { setCoupon(null); setCode(''); }}>Bỏ mã</Button></div>}
          <dl className="space-y-3 text-sm"><div className="flex justify-between gap-2"><dt className="text-muted-foreground">Giá khóa học</dt><dd className="font-medium tabular-nums">{formatVnd(course.price)}</dd></div><div className="flex justify-between gap-2"><dt className="text-muted-foreground">Giảm giá dự kiến</dt><dd className="tabular-nums">{formatVnd(coupon?.discount ?? 0)}</dd></div><div className="flex flex-wrap items-baseline justify-between gap-2 border-t border-border/70 pt-5"><dt className="font-medium">Tổng dự kiến</dt><dd className="text-3xl font-semibold tracking-tight tabular-nums">{formatVnd(coupon?.finalPrice ?? course.price)}</dd></div></dl>
          <p className="text-xs leading-relaxed text-muted-foreground">Số tiền chính thức và mã QR sẽ hiển thị ở bước tiếp theo sau khi đơn hàng được xác nhận.</p>
          <Button className="min-h-12 w-full gap-2 rounded-xl px-3" disabled={submitting || checking || authError} onClick={() => void checkout()}>{submitting ? 'Đang tạo thanh toán…' : course.price === 0 ? 'Đăng ký miễn phí' : 'Tiếp tục thanh toán VietQR'}<ArrowRight aria-hidden="true" className="size-4" /></Button>
          <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground"><ShieldCheck aria-hidden="true" className="size-3.5" /> Không mở quyền học trước khi xác nhận thanh toán</p>
        </>}
      </section>
    </div>}
  </div>;
}

export function CheckoutForm() {
  const params = useSearchParams();
  const slug = params.get('course') || params.get('slug');
  const { user, status, isAuthenticated } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (status !== 'loading' && !isAuthenticated) router.replace(`/login?redirect=${encodeURIComponent(`/checkout?course=${slug || ''}`)}`);
  }, [status, isAuthenticated, router, slug]);
  return <AppShell><div className="mx-auto max-w-[1120px] space-y-7 px-4 py-7 sm:px-7 sm:py-10 lg:px-8"><header><p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">TMdemy / Thanh toán</p><h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Xác nhận đơn hàng</h1><p className="mt-2 text-sm text-muted-foreground">Khóa học tiếp theo trên hành trình của bạn.</p></header>
    {!slug ? <p>Chưa chọn khóa học. <Link className="underline" href="/courses">Khám phá khóa học</Link></p> : status === 'loading' ? <div className="h-64 animate-pulse rounded-xl bg-muted" role="status" aria-label="Đang xác thực" /> : isAuthenticated && user ? <CheckoutContent key={`${user.id}:${slug}`} slug={slug} /> : <p>Đang chuyển đến trang đăng nhập…</p>}
  </div></AppShell>;
}
