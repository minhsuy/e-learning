import type { Metadata } from 'next';
import { AdminCommentsView } from '@/components/admin/comments/admin-comments-view';

export const metadata: Metadata = {
  title: 'Kiểm Duyệt Bình Luận | TMdemy Admin',
  description: 'Kiểm duyệt và loại bỏ các bình luận tiêu cực, spam hoặc vi phạm quy tắc cộng đồng.',
};

export default function AdminCommentsPage() {
  return <AdminCommentsView />;
}
