'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { useAuth } from '@/contexts/auth-context';
import { courseService } from '@/services/course.service';
import { couponService } from '@/services/coupon.service';
import { orderService } from '@/services/order.service';
import { enrollmentService } from '@/services/enrollment.service';
import { ApiCourseDetail } from '@/types/course';
import { CheckCouponData } from '@/types/coupon';
import { ApiOrderItem } from '@/types/order';
import { AppApiError } from '@/types/api';
import { toast } from '@/lib/toast';
import {
  ShoppingBag,
  Tag,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  Trash2,
  BookOpen,
  RefreshCw,
} from 'lucide-react';

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseSlug = searchParams.get('course') || searchParams.get('slug');

  const { isAuthenticated, status } = useAuth();

  // Data States
  const [course, setCourse] = useState<ApiCourseDetail | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [hasPendingOrder, setHasPendingOrder] = useState<ApiOrderItem | null>(null);

  // UX States
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Coupon States
  const [couponInput, setCouponInput] = useState('');
  const [isCheckingCoupon, setIsCheckingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<CheckCouponData | null>(null);

  // Order Submission & Enrollment Sync States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<ApiOrderItem | null>(null);
  const [enrollmentSyncStatus, setEnrollmentSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [isRetryingSync, setIsRetryingSync] = useState(false);

  // 1. Auth Guard: Redirect unauthenticated users
  useEffect(() => {
    if (status !== 'loading' && !isAuthenticated) {
      const redirectUrl = courseSlug ? `/checkout?course=${encodeURIComponent(courseSlug)}` : '/courses';
      router.push(`/login?redirect=${encodeURIComponent(redirectUrl)}`);
    }
  }, [status, isAuthenticated, courseSlug, router]);

  // 2. Fetch Course, Enrollment & Pending Order info
  useEffect(() => {
    const targetSlug = courseSlug;
    if (!targetSlug || !isAuthenticated) return;

    let isCurrent = true;
    const controller = new AbortController();

    async function loadCheckoutData(slugToFetch: string) {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const courseRes = await courseService.getCourseBySlug(slugToFetch, { signal: controller.signal });
        if (!isCurrent) return;

        const courseData = courseRes.data;
        setCourse(courseData);

        const courseId = courseData.id || courseData._id;

        // Check if already enrolled or completed order exists
        try {
          const [enrollRes, completedOrdersRes] = await Promise.all([
            enrollmentService.getMyEnrollments({ signal: controller.signal }).catch(() => null),
            orderService.getMyOrders({ status: 'COMPLETED', limit: 100 }, { signal: controller.signal }).catch(() => null),
          ]);

          if (isCurrent) {
            const enrolledViaEnrollment = enrollRes?.data && Array.isArray(enrollRes.data)
              ? enrollRes.data.some(
                  (e) => (courseId && (e.courseId === courseId || e.course?.id === courseId)) || e.course?.slug === targetSlug
                )
              : false;

            const enrolledViaCompletedOrder = completedOrdersRes?.data?.orders && Array.isArray(completedOrdersRes.data.orders)
              ? completedOrdersRes.data.orders.some(
                  (o) =>
                    (o.status === 'COMPLETED' || o.status === 'completed') &&
                    ((courseId && (o.courseId === courseId || o.course?.id === courseId)) || o.course?.slug === targetSlug)
                )
              : false;

            const enrolled = Boolean(enrolledViaEnrollment || enrolledViaCompletedOrder);
            setIsEnrolled(enrolled);

            // If not enrolled, check if user already has a pending order (limit 100)
            if (!enrolled) {
              const ordersRes = await orderService.getMyOrders(
                { status: 'PENDING', limit: 100 },
                { signal: controller.signal }
              );
              if (isCurrent && ordersRes.data?.orders && Array.isArray(ordersRes.data.orders)) {
                const pending = ordersRes.data.orders.find(
                  (o) =>
                    (o.status === 'PENDING' || o.status === 'pending') &&
                    ((courseId && (o.courseId === courseId || o.course?.id === courseId)) || o.course?.slug === targetSlug)
                );
                if (pending) {
                  setHasPendingOrder(pending);
                }
              }
            }
          }
        } catch {
          // Non-blocking background checks
        }

        if (isCurrent) {
          setIsLoading(false);
        }
      } catch (err: unknown) {
        if (!isCurrent) return;
        if (err instanceof Error && err.name === 'AbortError') return;

        const msg =
          err instanceof AppApiError
            ? err.message
            : 'Không thể tải thông tin khóa học. Vui lòng thử lại sau.';
        setErrorMessage(msg);
        setIsLoading(false);
      }
    }

    loadCheckoutData(targetSlug);

    // Stale-revalidation when switching back to tab/window
    const handleRevalidate = () => {
      if (document.visibilityState === 'visible' && isAuthenticated && targetSlug) {
        loadCheckoutData(targetSlug);
      }
    };
    document.addEventListener('visibilitychange', handleRevalidate);
    window.addEventListener('focus', handleRevalidate);

    return () => {
      isCurrent = false;
      controller.abort();
      document.removeEventListener('visibilitychange', handleRevalidate);
      window.removeEventListener('focus', handleRevalidate);
    };
  }, [courseSlug, isAuthenticated]);

  // 3. Handle Coupon Verification
  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = couponInput.trim();
    if (!cleanCode) {
      toast.warning('Vui lòng nhập mã giảm giá.');
      return;
    }

    if (!course) return;
    const courseId = course.id || course._id;
    if (!courseId) return;

    setIsCheckingCoupon(true);
    try {
      const res = await couponService.checkCoupon({ code: cleanCode, courseId });
      if (res.success && res.data) {
        setAppliedCoupon(res.data);
        toast.success(`Áp dụng mã giảm giá "${cleanCode}" thành công!`);
      }
    } catch (err: unknown) {
      const msg = err instanceof AppApiError ? err.message : 'Mã giảm giá không hợp lệ hoặc đã hết hạn.';
      toast.error(msg);
      setAppliedCoupon(null);
    } finally {
      setIsCheckingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    toast.info('Đã hủy áp dụng mã giảm giá.');
  };

  // 4. Handle Order Submission (POST /api/orders)
  const handleConfirmOrder = async () => {
    if (!course) return;
    const courseId = course.id || course._id;
    if (!courseId) {
      toast.error('Thiếu thông tin khóa học.');
      return;
    }

    if (isEnrolled) {
      toast.info('Bạn đã ghi danh khóa học này rồi.');
      router.push(`/learn/${course.slug}`);
      return;
    }

    if (hasPendingOrder) {
      toast.warning('Bạn đang có đơn hàng chờ duyệt cho khóa học này.');
      router.push('/orders');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        courseId,
        couponCode: appliedCoupon?.coupon?.code,
      };

      const res = await orderService.createOrder(payload);
      const orderData = res.data;

      if (!orderData) {
        throw new Error('Không nhận được dữ liệu đơn hàng từ máy chủ.');
      }

      setCompletedOrder(orderData);

      const statusUpper = orderData.status?.toUpperCase();

      if (statusUpper === 'COMPLETED') {
        setIsEnrolled(true);
        setEnrollmentSyncStatus('synced');
        toast.success('Đăng ký khóa học thành công! Quyền học tập đã sẵn sàng.');
      } else {
        toast.success('Đơn hàng đã được tạo thành công! Đang chờ duyệt.');
      }
    } catch (err: unknown) {
      const msg =
        err instanceof AppApiError ? err.message : 'Không thể tạo đơn hàng. Vui lòng thử lại sau.';
      if (err instanceof AppApiError && err.statusCode === 400 && msg.toLowerCase().includes('already enrolled')) {
        setIsEnrolled(true);
        toast.info('Bạn đã sở hữu khóa học này rồi.');
      } else if (err instanceof AppApiError && err.statusCode === 400 && msg.toLowerCase().includes('pending')) {
        setHasPendingOrder({
          courseId,
          status: 'PENDING',
          total: course.price || 0,
          amount: course.price || 0,
          discount: 0,
          userId: '',
        } as ApiOrderItem);
        toast.warning('Bạn đang có đơn hàng chờ duyệt cho khóa học này.');
      } else {
        toast.error(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4b. Retry Sync Enrollment Handler
  const handleRetrySyncEnrollment = async () => {
    if (!course) return;
    const courseId = course.id || course._id;
    setIsRetryingSync(true);
    try {
      const [enrollRes, completedOrdersRes] = await Promise.all([
        enrollmentService.getMyEnrollments().catch(() => null),
        orderService.getMyOrders({ status: 'COMPLETED', limit: 100 }).catch(() => null),
      ]);
      const isConfirmed =
        (Array.isArray(enrollRes?.data) &&
          enrollRes.data.some(
            (e) => (courseId && (e.courseId === courseId || e.course?.id === courseId)) || e.course?.slug === courseSlug
          )) ||
        (Array.isArray(completedOrdersRes?.data?.orders) &&
          completedOrdersRes.data.orders.some(
            (o) =>
              (o.status === 'COMPLETED' || o.status === 'completed') &&
              ((courseId && (o.courseId === courseId || o.course?.id === courseId)) || o.course?.slug === courseSlug)
          ));
      if (isConfirmed) {
        setIsEnrolled(true);
        setEnrollmentSyncStatus('synced');
        toast.success('Đồng bộ quyền học tập thành công! Bạn có thể vào học ngay.');
      } else {
        toast.warning('Chưa tìm thấy bản ghi ghi danh trên máy chủ. Vui lòng thử lại sau.');
      }
    } catch {
      toast.error('Lỗi kết nối khi đồng bộ quyền ghi danh.');
    } finally {
      setIsRetryingSync(false);
    }
  };

  // 5. Render Loading State
  if (status === 'loading' || isLoading) {
    return (
      <AppShell>
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 rounded-lg bg-[#f1ebff] dark:bg-[#2b2438] animate-pulse" />
            <div className="w-48 h-6 bg-[#f1ebff] dark:bg-[#2b2438] rounded-md animate-pulse" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-44 bg-[#f1ebff] dark:bg-[#2b2438] rounded-2xl animate-pulse" />
              <div className="h-32 bg-[#f1ebff] dark:bg-[#2b2438] rounded-2xl animate-pulse" />
            </div>
            <div className="h-64 bg-[#f1ebff] dark:bg-[#2b2438] rounded-2xl animate-pulse" />
          </div>
        </div>
      </AppShell>
    );
  }

  // 6. Render Error / Missing Slug State
  if (!courseSlug || errorMessage || !course) {
    return (
      <AppShell>
        <div className="max-w-xl mx-auto px-4 py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 mx-auto flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-[#1c192c] dark:text-[#f4eeff] mb-2">
            Không tìm thấy thông tin thanh toán
          </h2>
          <p className="text-sm text-[#635a72] dark:text-[#a9a0b2] mb-6">
            {errorMessage || 'Đường dẫn thanh toán không hợp lệ hoặc khóa học không tồn tại.'}
          </p>
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#7240b8] text-white text-sm font-semibold hover:bg-[#8349d3] transition-colors"
          >
            <span>Khám phá các khóa học khác</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </AppShell>
    );
  }

  // 7. Render Already Enrolled State
  if (isEnrolled) {
    return (
      <AppShell>
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-[#1c192c] dark:text-[#f4eeff] mb-2">
            Bạn đã sở hữu khóa học này
          </h2>
          <p className="text-sm text-[#635a72] dark:text-[#a9a0b2] mb-6">
            Khóa học <strong>&ldquo;{course.title}&rdquo;</strong> đã được kích hoạt trong tài khoản của bạn.
            Bạn có thể bắt đầu học tập bất kỳ lúc nào.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href={`/learn/${course.slug}`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-lg shadow-emerald-600/25 transition-all"
            >
              <BookOpen className="w-4 h-4" />
              <span>Vào học ngay</span>
            </Link>
            <Link
              href="/my-courses"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#f7f1ff] dark:bg-[#282136] hover:bg-[#ebe5ff] text-[#7240b8] dark:text-[#a87ffb] text-sm font-semibold transition-colors"
            >
              <span>Xem Khóa học của tôi</span>
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  // 8. Render Pending Order Banner State
  if (hasPendingOrder && !completedOrder) {
    return (
      <AppShell>
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center mb-4">
            <Clock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-[#1c192c] dark:text-[#f4eeff] mb-2">
            Đơn hàng đang chờ phê duyệt
          </h2>
          <p className="text-sm text-[#635a72] dark:text-[#a9a0b2] mb-4">
            Bạn đã tạo đơn hàng cho khóa học <strong>&ldquo;{course.title}&rdquo;</strong> với mã đơn:{' '}
            <span className="font-mono font-bold text-[#7240b8] dark:text-[#a87ffb]">
              {hasPendingOrder.code || hasPendingOrder.id}
            </span>
          </p>
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 text-xs text-amber-800 dark:text-amber-300 text-left max-w-lg mx-auto mb-6">
            Đơn hàng đang ở trạng thái <strong>CHỜ DUYỆT (PENDING)</strong>. Giảng viên hoặc Quản trị viên sẽ kiểm tra và kích hoạt quyền học tập cho bạn. Bạn không cần đặt thêm đơn mới.
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/orders"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#7240b8] hover:bg-[#8349d3] text-white text-sm font-bold shadow-lg shadow-[#7240b8]/25 transition-all"
            >
              <span>Xem Đơn hàng của tôi</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href={`/courses/${course.slug}`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#f7f1ff] dark:bg-[#282136] hover:bg-[#ebe5ff] text-[#4b4452] dark:text-[#b4a9c7] text-sm font-semibold transition-colors"
            >
              <span>Quay lại chi tiết khóa học</span>
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  // 9. Render Order Created Successfully Screen
  if (completedOrder) {
    const isCompleted = completedOrder.status?.toUpperCase() === 'COMPLETED';

    return (
      <AppShell>
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div
            className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4 ${
              isCompleted
                ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                : 'bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
            }`}
          >
            {isCompleted ? <CheckCircle2 className="w-8 h-8" /> : <Clock className="w-8 h-8" />}
          </div>
          <h2 className="text-2xl font-bold text-[#1c192c] dark:text-[#f4eeff] mb-2">
            {isCompleted ? 'Đăng ký khóa học thành công!' : 'Đơn hàng đã được tạo thành công!'}
          </h2>
          <p className="text-sm text-[#635a72] dark:text-[#a9a0b2] mb-6">
            Mã đơn hàng:{' '}
            <span className="font-mono font-bold text-[#7240b8] dark:text-[#a87ffb]">
              {completedOrder.code || completedOrder.id}
            </span>
          </p>

          <div className="p-5 rounded-2xl bg-[#f7f1ff] dark:bg-[#1f192b] border border-[#f1ebff] dark:border-[#2b2438] text-left max-w-md mx-auto mb-8 space-y-3">
            <div className="flex justify-between text-xs text-[#635a72] dark:text-[#a9a0b2]">
              <span>Khóa học:</span>
              <span className="font-semibold text-[#1c192c] dark:text-[#f4eeff] text-right line-clamp-1 max-w-[200px]">
                {course.title}
              </span>
            </div>
            <div className="flex justify-between text-xs text-[#635a72] dark:text-[#a9a0b2]">
              <span>Tổng thanh toán:</span>
              <span className="font-bold text-[#7240b8] dark:text-[#a87ffb]">
                {completedOrder.total === 0 ? 'Miễn phí' : `${completedOrder.total.toLocaleString('vi-VN')} đ`}
              </span>
            </div>
            <div className="flex justify-between text-xs text-[#635a72] dark:text-[#a9a0b2] items-center">
              <span>Trạng thái:</span>
              <span
                className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                  isCompleted
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                    : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                }`}
              >
                {isCompleted ? 'ĐÃ HOÀN TẤT' : 'CHỜ PHÊ DUYỆT (PENDING)'}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {isCompleted ? (
              enrollmentSyncStatus === 'synced' ? (
                <Link
                  href={`/learn/${course.slug}`}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-lg shadow-emerald-600/25 transition-all"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Vào học ngay</span>
                </Link>
              ) : enrollmentSyncStatus === 'syncing' ? (
                <div className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-sm font-bold">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Đang xác nhận quyền ghi danh...</span>
                </div>
              ) : (
                <button
                  onClick={handleRetrySyncEnrollment}
                  disabled={isRetryingSync}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#7240b8] hover:bg-[#8349d3] text-white text-sm font-bold shadow-lg shadow-[#7240b8]/25 transition-all cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${isRetryingSync ? 'animate-spin' : ''}`} />
                  <span>{isRetryingSync ? 'Đang đồng bộ...' : 'Thử đồng bộ lại'}</span>
                </button>
              )
            ) : (
              <Link
                href="/orders"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#7240b8] hover:bg-[#8349d3] text-white text-sm font-bold shadow-lg shadow-[#7240b8]/25 transition-all"
              >
                <span>Xem Đơn hàng của tôi</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
            <Link
              href="/courses"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#f7f1ff] dark:bg-[#282136] hover:bg-[#ebe5ff] text-[#4b4452] dark:text-[#b4a9c7] text-sm font-semibold transition-colors"
            >
              <span>Xem các khóa học khác</span>
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  // 10. Calculations for Display
  const basePrice = course.price ?? 0;
  const discountAmount = appliedCoupon?.discount ?? 0;
  const finalPrice = appliedCoupon ? appliedCoupon.finalPrice : basePrice;

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-4 py-8 lg:py-12">
        {/* Header Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs text-[#635a72] dark:text-[#a9a0b2] mb-6">
          <Link href="/courses" className="hover:text-[#7240b8] dark:hover:text-[#a87ffb] transition-colors">
            Khóa học
          </Link>
          <span>/</span>
          <Link
            href={`/courses/${course.slug}`}
            className="hover:text-[#7240b8] dark:hover:text-[#a87ffb] transition-colors truncate max-w-[200px]"
          >
            {course.title}
          </Link>
          <span>/</span>
          <span className="font-semibold text-[#1c192c] dark:text-[#f4eeff]">Thanh toán</span>
        </div>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-[#1c192c] dark:text-[#f4eeff] tracking-tight">
              Xác nhận đăng ký khóa học
            </h1>
            <p className="text-xs lg:text-sm text-[#635a72] dark:text-[#a9a0b2] mt-1">
              Kiểm tra thông tin chi tiết và áp dụng ưu đãi trước khi hoàn tất đăng ký.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* CỘT TRÁI (7 cột): Thông tin khóa học & Hướng dẫn duyệt đơn */}
          <div className="lg:col-span-7 space-y-6">
            {/* Card Khóa học được chọn */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] shadow-xs">
              <h2 className="text-sm font-bold text-[#1c192c] dark:text-[#f4eeff] mb-4 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-[#7240b8] dark:text-[#a87ffb]" />
                <span>Khóa học đã chọn</span>
              </h2>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="w-full sm:w-40 h-24 rounded-xl overflow-hidden bg-[#f1ebff] dark:bg-[#2b2438] shrink-0 border border-[#f1ebff] dark:border-[#2b2438]">
                  {course.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={course.image}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-[#a9a0b2]">
                      TMdemy
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-bold text-[#1c192c] dark:text-[#f4eeff] line-clamp-2 leading-snug">
                      {course.title}
                    </h3>
                    {course.author && (
                      <p className="text-xs text-[#635a72] dark:text-[#a9a0b2] mt-1">
                        Giảng viên: <span className="font-medium text-[#1c192c] dark:text-[#f4eeff]">{course.author.username}</span>
                      </p>
                    )}
                  </div>

                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-base font-bold text-[#7240b8] dark:text-[#a87ffb]">
                      {basePrice === 0 ? 'Miễn phí' : `${basePrice.toLocaleString('vi-VN')} đ`}
                    </span>
                    {course.oldPrice && course.oldPrice > basePrice && (
                      <span className="text-xs text-[#635a72] dark:text-[#a9a0b2] line-through">
                        {course.oldPrice.toLocaleString('vi-VN')} đ
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Khối quy trình xác nhận thủ công */}
            <div className="p-6 rounded-2xl bg-[#f7f1ff] dark:bg-[#1f192b] border border-[#ebe5ff] dark:border-[#2b2438] space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#7240b8] dark:text-[#a87ffb] flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4" />
                <span>Quy trình xử lý đơn hàng</span>
              </h2>
              <p className="text-xs text-[#635a72] dark:text-[#a9a0b2] leading-relaxed">
                Sau khi bấm <strong>&ldquo;Xác nhận đặt hàng&rdquo;</strong>, đơn hàng sẽ được ghi nhận ở trạng thái <strong>CHỜ DUYỆT (PENDING)</strong>. Giảng viên hoặc Quản trị viên phụ trách sẽ kiểm tra thông tin và kích hoạt quyền vào học cho bạn.
              </p>
              <div className="flex items-center gap-2 pt-1 text-xs text-[#1c192c] dark:text-[#f4eeff] font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Quyền lợi học viên và dữ liệu tiến độ được bảo vệ trọn vẹn theo TMdemy Standard.</span>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI (5 cột): Mã giảm giá & Tóm tắt chi phí */}
          <div className="lg:col-span-5 space-y-6">
            {/* Khối Mã Giảm Giá */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] shadow-xs">
              <h2 className="text-sm font-bold text-[#1c192c] dark:text-[#f4eeff] mb-3 flex items-center gap-2">
                <Tag className="w-4 h-4 text-[#7240b8] dark:text-[#a87ffb]" />
                <span>Mã giảm giá (Coupon)</span>
              </h2>

              {appliedCoupon ? (
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300 truncate">
                      {appliedCoupon.coupon.title || appliedCoupon.coupon.code}
                    </p>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                      Tiết kiệm: -{appliedCoupon.discount.toLocaleString('vi-VN')} đ
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                    title="Gỡ mã giảm giá"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    placeholder="Nhập mã ưu đãi..."
                    disabled={isCheckingCoupon}
                    className="flex-1 h-10 px-3.5 bg-[#f7f1ff] dark:bg-[#221d2d] rounded-xl text-xs font-medium text-[#1c192c] dark:text-[#f4eeff] placeholder:text-[#7c7483] dark:placeholder:text-[#968e9e] focus:outline-none focus:ring-1 focus:ring-[#7240b8] dark:focus:ring-[#a87ffb] border border-transparent dark:border-[#352e43] uppercase tracking-wider"
                  />
                  <button
                    type="submit"
                    disabled={isCheckingCoupon || !couponInput.trim()}
                    className="px-4 h-10 rounded-xl bg-[#7240b8] hover:bg-[#8349d3] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold transition-all shrink-0 cursor-pointer"
                  >
                    {isCheckingCoupon ? 'Kiểm tra...' : 'Áp dụng'}
                  </button>
                </form>
              )}
            </div>

            {/* Khối Tóm tắt thanh toán */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#17141f] border border-[#f1ebff] dark:border-[#2b2438] shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-[#1c192c] dark:text-[#f4eeff]">
                Tóm tắt đơn hàng
              </h2>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between text-[#635a72] dark:text-[#a9a0b2]">
                  <span>Giá gốc khóa học:</span>
                  <span className="font-medium text-[#1c192c] dark:text-[#f4eeff]">
                    {basePrice === 0 ? 'Miễn phí' : `${basePrice.toLocaleString('vi-VN')} đ`}
                  </span>
                </div>

                {appliedCoupon && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                    <span>Mã giảm giá ({appliedCoupon.coupon.code}):</span>
                    <span className="font-bold">
                      -{discountAmount.toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                )}

                <div className="w-full h-px bg-[#f1ebff] dark:bg-[#282136] my-2" />

                <div className="flex justify-between items-baseline pt-1">
                  <span className="text-sm font-bold text-[#1c192c] dark:text-[#f4eeff]">
                    Tổng thanh toán:
                  </span>
                  <span className="text-xl font-extrabold text-[#7240b8] dark:text-[#a87ffb]">
                    {finalPrice === 0 ? 'Miễn phí' : `${finalPrice.toLocaleString('vi-VN')} đ`}
                  </span>
                </div>
              </div>

              {/* Nút Đặt hàng */}
              <button
                type="button"
                onClick={handleConfirmOrder}
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 rounded-xl bg-[#7240b8] hover:bg-[#8349d3] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100 text-white text-sm font-bold shadow-lg shadow-[#7240b8]/25 transition-all flex items-center justify-center gap-2 cursor-pointer mt-4"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang xử lý đơn hàng...</span>
                  </>
                ) : (
                  <>
                    <span>Xác nhận đặt hàng</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <p className="text-[11px] text-center text-[#635a72] dark:text-[#a9a0b2] pt-1">
                Bằng việc nhấn đặt hàng, bạn đồng ý với Điều khoản dịch vụ và Chính sách học viên của TMdemy.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <div className="max-w-4xl mx-auto px-4 py-16 text-center text-sm text-[#635a72] dark:text-[#a9a0b2]">
            Đang tải dữ liệu thanh toán...
          </div>
        </AppShell>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
