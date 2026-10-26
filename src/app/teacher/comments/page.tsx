import type { Metadata } from 'next';
import { TeacherCommentsView } from '@/components/teacher/comments/teacher-comments-view';

export const metadata: Metadata = {
  title: 'Quản Lý Bình Luận | TMdemy Teacher',
  description: 'Theo dõi, phản hồi thắc mắc và quản lý các bình luận của học viên trong các khóa học do bạn phụ trách trên TMdemy.',
};

export default function TeacherCommentsPage() {
  return <TeacherCommentsView />;
}
