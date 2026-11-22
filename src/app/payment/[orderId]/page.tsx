import type { Metadata } from 'next';
import { PaymentCheckout } from '@/components/payment/payment-checkout';

export const metadata: Metadata = { title: 'Thanh toán khóa học | TMdemy', robots: { index: false, follow: false } };

export default async function PaymentPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  return <PaymentCheckout orderId={orderId} />;
}
