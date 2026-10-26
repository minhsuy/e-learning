import type { Metadata } from 'next';
import { AdminCategoriesView } from '@/components/admin/categories/admin-categories-view';

export const metadata: Metadata = {
  title: 'Quản Lý Danh Mục Khóa Học | TMdemy Admin',
  description: 'Quản lý cây danh mục và chuyên ngành đào tạo trên nền tảng TMdemy.',
};

export default function AdminCategoriesPage() {
  return <AdminCategoriesView />;
}
