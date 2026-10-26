import { ApiNotification, NotificationMetadata, NotificationType } from '@/types/notification';

/**
 * Format timestamp into human-readable Vietnamese relative time
 */
export function formatNotificationTime(dateString?: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Vừa xong';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} phút trước`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} giờ trước`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} ngày trước`;
  }

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export interface NotificationTypeMeta {
  label: string;
  icon: string;
  colorClass: string;
  bgClass: string;
}

export function getNotificationTypeMeta(type?: NotificationType): NotificationTypeMeta {
  const normalizedType = String(type || '').toUpperCase();
  switch (normalizedType) {
    case 'COURSE':
      return {
        label: 'Khóa học',
        icon: 'school',
        colorClass: 'text-[#7240b8] dark:text-[#a87ffb]',
        bgClass: 'bg-[#ede4f9] dark:bg-[#2b2438]',
      };
    case 'LESSON':
      return {
        label: 'Bài học',
        icon: 'play_circle',
        colorClass: 'text-cyan-600 dark:text-cyan-400',
        bgClass: 'bg-cyan-50 dark:bg-cyan-950/40',
      };
    case 'QUIZ':
      return {
        label: 'Bài kiểm tra',
        icon: 'quiz',
        colorClass: 'text-amber-600 dark:text-amber-400',
        bgClass: 'bg-amber-50 dark:bg-amber-950/40',
      };
    case 'ORDER':
      return {
        label: 'Đơn hàng',
        icon: 'receipt_long',
        colorClass: 'text-emerald-600 dark:text-emerald-400',
        bgClass: 'bg-emerald-50 dark:bg-emerald-950/40',
      };
    case 'MESSAGE':
      return {
        label: 'Tin nhắn',
        icon: 'chat',
        colorClass: 'text-sky-600 dark:text-sky-400',
        bgClass: 'bg-sky-50 dark:bg-sky-950/40',
      };
    case 'COMMENT':
    case 'COMMENT_REPLY':
      return {
        label: 'Thảo luận',
        icon: 'forum',
        colorClass: 'text-indigo-600 dark:text-indigo-400',
        bgClass: 'bg-indigo-50 dark:bg-indigo-950/40',
      };
    case 'RATING':
      return {
        label: 'Đánh giá',
        icon: 'star',
        colorClass: 'text-yellow-600 dark:text-yellow-400',
        bgClass: 'bg-yellow-50 dark:bg-yellow-950/40',
      };
    case 'SYSTEM':
    default:
      return {
        label: 'Hệ thống',
        icon: 'notifications',
        colorClass: 'text-[#7240b8] dark:text-[#a87ffb]',
        bgClass: 'bg-[#ede4f9] dark:bg-[#2b2438]',
      };
  }
}

export interface NotificationUrlOptions {
  isTeacher?: boolean;
}

/**
 * Determine target frontend route based on notification metadata, type, and relatedId.
 * Prioritizes rich contextual metadata for LESSON, COMMENT, COMMENT_REPLY.
 * Returns safe fallbacks for historical notifications without metadata.
 */
export function getNotificationTargetUrl(
  notificationOrType?: ApiNotification | NotificationType,
  legacyRelatedId?: string | null,
  legacyMetadata?: NotificationMetadata | null,
  options?: NotificationUrlOptions
): string | null {
  if (!notificationOrType) return null;

  let type: NotificationType | undefined;
  let relatedId: string | null | undefined;
  let metadata: NotificationMetadata | null | undefined;
  let message = '';

  if (typeof notificationOrType === 'object') {
    type = notificationOrType.type;
    relatedId = notificationOrType.relatedId;
    metadata = notificationOrType.metadata;
    message = notificationOrType.message || '';
  } else {
    type = notificationOrType;
    relatedId = legacyRelatedId;
    metadata = legacyMetadata;
  }

  if (!type) return null;
  const normalizedType = String(type).toUpperCase();

  switch (normalizedType) {
    case 'LESSON': {
      // Priority: metadata -> { courseId, courseSlug, lessonId }
      const courseKey = metadata?.courseSlug?.trim() || metadata?.courseId?.trim();
      const lessonId = metadata?.lessonId?.trim();

      if (courseKey) {
        if (lessonId) {
          return `/learn/${encodeURIComponent(courseKey)}?lesson=${encodeURIComponent(lessonId)}`;
        }
        return `/learn/${encodeURIComponent(courseKey)}`;
      }

      // Safe Fallback for historical notifications: Never assume relatedId is courseId or courseSlug
      return '/my-courses';
    }

    case 'COMMENT': {
      // Priority: metadata -> { courseId, courseSlug, lessonId, commentId }
      const courseKey = metadata?.courseSlug?.trim() || metadata?.courseId?.trim();
      const lessonId = metadata?.lessonId?.trim();
      const commentId = metadata?.commentId?.trim();

      if (courseKey) {
        const queryParams = new URLSearchParams();
        if (lessonId) {
          queryParams.set('lesson', lessonId);
        }
        queryParams.set('tab', 'qa');
        if (commentId) {
          queryParams.set('commentId', commentId);
        }
        return `/learn/${encodeURIComponent(courseKey)}?${queryParams.toString()}`;
      }

      // Safe Fallback
      return '/my-courses';
    }

    case 'COMMENT_REPLY': {
      // Priority: metadata -> { courseId, courseSlug, lessonId, commentId, parentId }
      // Note: commentId is the reply ID, parentId is the root thread ID
      const courseKey = metadata?.courseSlug?.trim() || metadata?.courseId?.trim();
      const lessonId = metadata?.lessonId?.trim();
      const commentId = metadata?.commentId?.trim();
      const parentId = metadata?.parentId?.trim();

      if (courseKey) {
        const queryParams = new URLSearchParams();
        if (lessonId) {
          queryParams.set('lesson', lessonId);
        }
        queryParams.set('tab', 'qa');
        if (commentId) {
          queryParams.set('commentId', commentId);
        }
        if (parentId) {
          queryParams.set('parentId', parentId);
        }
        return `/learn/${encodeURIComponent(courseKey)}?${queryParams.toString()}`;
      }

      // Safe Fallback
      return '/my-courses';
    }

    case 'COURSE': {
      const cleanCourseId = relatedId?.trim();
      return cleanCourseId ? `/courses/${encodeURIComponent(cleanCourseId)}` : '/courses';
    }

    case 'ORDER': {
      const msg = message.toLowerCase();
      const isTeacherRoute =
        typeof window !== 'undefined' && window.location.pathname.startsWith('/teacher');

      // Check if notification is an order alert for a teacher (student purchased or enrolled)
      const isStudentPurchase =
        msg.includes('học viên') ||
        msg.includes('hoc vien') ||
        msg.includes('đăng ký khóa học') ||
        msg.includes('dang ky khoa hoc') ||
        msg.includes('mua khóa học') ||
        msg.includes('mua khoá học') ||
        msg.includes('student');

      if (options?.isTeacher || isTeacherRoute || isStudentPurchase) {
        return '/teacher/orders';
      }

      return '/orders';
    }

    case 'MESSAGE': {
      return '/messages';
    }

    case 'QUIZ': {
      const cleanQuizCourseId = relatedId?.trim();
      return cleanQuizCourseId ? `/learn/${encodeURIComponent(cleanQuizCourseId)}` : '/my-courses';
    }

    case 'RATING': {
      const cleanRatedCourseId = relatedId?.trim();
      return cleanRatedCourseId ? `/courses/${encodeURIComponent(cleanRatedCourseId)}` : null;
    }

    case 'SYSTEM':
    default:
      return null;
  }
}
