import type { Metadata } from 'next';
import { AdminOrdersView } from '@/components/admin/orders/admin-orders-view';

export const metadata: Metadata = {
  title: 'Quản Lý Đơn Hàng | TMdemy Admin',
  description: 'Giám sát và đối soát toàn bộ giao dịch thanh toán đơn hàng trên hệ thống TMdemy.',
};

export default function AdminOrdersPage() {
  return <AdminOrdersView />;
}
