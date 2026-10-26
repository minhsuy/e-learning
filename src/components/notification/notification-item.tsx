'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ApiNotification } from '@/types/notification';
import { useNotifications } from '@/hooks/use-notifications';
import { useAuth } from '@/hooks/use-auth';
import {
  formatNotificationTime,
  getNotificationTypeMeta,
  getNotificationTargetUrl,
} from '@/lib/notification-utils';

interface NotificationItemProps {
  notification: ApiNotification;
  onItemClick?: () => void;
  compact?: boolean;
}

export function NotificationItem({
  notification,
  onItemClick,
  compact = false,
}: NotificationItemProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { markAsRead, isMarkingRead } = useNotifications();

  const id = notification.id || notification._id || '';
  const isUnread = !notification.isRead && !notification.read;
  const isMarking = isMarkingRead(id);
  const typeMeta = getNotificationTypeMeta(notification.type);
  const isTeacher = user?.role === 'teacher';
  const targetUrl = getNotificationTargetUrl(notification, undefined, undefined, { isTeacher });
  const timeString = formatNotificationTime(notification.createdAt);

  const handleClick = async () => {
    if (isUnread && id) {
      void markAsRead(id);
    }
    onItemClick?.();
    if (targetUrl) {
      router.push(targetUrl);
    }
  };

  const handleMarkAsReadOnly = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isUnread && id && !isMarking) {
      await markAsRead(id);
    }
  };

  const senderName = notification.sender?.username || 'Hệ thống';
  const senderAvatar = notification.sender?.avatar;

  return (
    <div
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          void handleClick();
        }
      }}
      className={`group relative flex items-start gap-3 transition-colors cursor-pointer select-none border-b border-[#f7f1ff] dark:border-[#2b2438] last:border-b-0 ${
        compact ? 'p-3 text-xs' : 'p-4 text-sm'
      } ${
        isUnread
          ? 'bg-[#fbf9ff] dark:bg-[#231b31]/50 hover:bg-[#f5eeff] dark:hover:bg-[#2c223e]'
          : 'bg-white dark:bg-[#1a1622] hover:bg-[#faf8fd] dark:hover:bg-[#221c2c]'
      }`}
    >
      {/* Sender Avatar or Type Icon */}
      <div className="relative shrink-0 mt-0.5">
        {senderAvatar ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={senderAvatar}
            alt={senderName}
            className={`${compact ? 'w-8 h-8' : 'w-10 h-10'} rounded-full object-cover border border-[#ede4f9] dark:border-[#352b47]`}
          />
        ) : (
          <div
            className={`${compact ? 'w-8 h-8' : 'w-10 h-10'} rounded-full ${typeMeta.bgClass} flex items-center justify-center shrink-0 shadow-2xs`}
          >
            <span
              className={`material-symbols-outlined ${typeMeta.colorClass} ${
                compact ? 'text-[18px]' : 'text-[22px]'
              }`}
            >
              {typeMeta.icon}
            </span>
          </div>
        )}

        {/* Small corner badge if has sender avatar */}
        {senderAvatar && (
          <span
            className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full ${typeMeta.bgClass} ${typeMeta.colorClass} flex items-center justify-center text-[10px] ring-2 ring-white dark:ring-[#17141f]`}
          >
            <span className="material-symbols-outlined text-[10px]">{typeMeta.icon}</span>
          </span>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 min-w-0 pr-6">
        <div className="flex items-center gap-2 mb-1">
          <span
            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${typeMeta.bgClass} ${typeMeta.colorClass}`}
          >
            {typeMeta.label}
          </span>
          {timeString && (
            <span className="text-[11px] text-[#8c8296] dark:text-[#a094aa]">
              {timeString}
            </span>
          )}
        </div>

        <p
          className={`leading-snug break-words ${
            isUnread
              ? 'font-medium text-[#1c192c] dark:text-[#f4eeff]'
              : 'text-[#635a72] dark:text-[#cdc3d4]'
          } ${compact ? 'text-xs line-clamp-2' : 'text-sm'}`}
        >
          {notification.message}
        </p>
      </div>

      {/* Right Action: Mark as read / Unread dot */}
      <div className="absolute right-3 top-3.5 flex items-center gap-1">
        {isUnread && (
          <span
            className="w-2.5 h-2.5 rounded-full bg-[#7240b8] dark:bg-[#a87ffb] ring-2 ring-white dark:ring-[#17141f] shrink-0"
            title="Chưa đọc"
          />
        )}

        {isUnread && (
          <button
            type="button"
            disabled={isMarking}
            onClick={handleMarkAsReadOnly}
            aria-label="Đánh dấu thông báo này là đã đọc"
            title="Đánh dấu đã đọc"
            className="opacity-0 group-hover:opacity-100 p-1 rounded-full text-[#8c8296] hover:text-[#7240b8] dark:hover:text-[#a87ffb] hover:bg-[#ede4f9] dark:hover:bg-[#352b47] transition-all cursor-pointer disabled:opacity-50"
          >
            {isMarking ? (
              <span className="material-symbols-outlined text-[16px] animate-spin">
                progress_activity
              </span>
            ) : (
              <span className="material-symbols-outlined text-[16px]">check</span>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
