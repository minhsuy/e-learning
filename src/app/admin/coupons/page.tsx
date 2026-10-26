import type { Metadata } from 'next';
import { AdminCouponsView } from '@/components/admin/coupons/admin-coupons-view';

export const metadata: Metadata = {
  title: 'Quản Lý Mã Giảm Giá | TMdemy Admin',
  description: 'Quản lý toàn bộ chiến dịch ưu đãi, mã giảm giá và chiết khấu trên nền tảng TMdemy.',
};

export default function AdminCouponsPage() {
  return <AdminCouponsView />;
}
