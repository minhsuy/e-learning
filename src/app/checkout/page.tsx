import { Suspense } from 'react';
import type { Metadata } from 'next';
import { CheckoutForm } from '@/components/payment/checkout-form';

export const metadata: Metadata = { title: 'Xác nhận đơn hàng | TMdemy', robots: { index: false, follow: false } };

export default function CheckoutPage() {
  return <Suspense fallback={<div role="status" className="mx-auto my-12 h-80 max-w-4xl animate-pulse rounded-2xl bg-muted" aria-label="Đang tải thanh toán" />}><CheckoutForm /></Suspense>;
}
