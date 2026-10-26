'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useSocket } from '@/hooks/use-socket';
import { notificationService } from '@/services/notification.service';
import {
  ApiNotification,
  GetNotificationsParams,
  NotificationType,
} from '@/types/notification';
import { ApiPagination } from '@/types/api';
import { toast } from '@/lib/toast';
import { playNotificationSound } from '@/lib/sound';

export interface NotificationContextType {
  notifications: ApiNotification[];
  unreadCount: number;
  pagination: ApiPagination | null;
  isLoading: boolean;
  error: string | null;
  latestRealtimeNotification: ApiNotification | null;
  isMarkingRead: (id: string) => boolean;
  fetchNotifications: (params?: GetNotificationsParams) => Promise<void>;
  markAsRead: (id: string) => Promise<boolean>;
  refresh: () => Promise<void>;
  addRealtimeNotification: (notification: ApiNotification) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const { socket } = useSocket();

  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [pagination, setPagination] = useState<ApiPagination | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [markingIds, setMarkingIds] = useState<Set<string>>(new Set());
  const [latestRealtimeNotification, setLatestRealtimeNotification] =
    useState<ApiNotification | null>(null);

  // Store user ID reference to enforce strict account isolation
  const activeUserIdRef = useRef<string | null>(null);
  // Track notified IDs to avoid duplicate toasts
  const notifiedIdsRef = useRef<Set<string>>(new Set());

  // Compute unread count from current notifications list
  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead && !n.read).length;
  }, [notifications]);

  // Fetch notifications implementation
  const fetchNotifications = useCallback(
    async (params?: GetNotificationsParams) => {
      if (!isAuthenticated || !user) {
        setNotifications([]);
        setPagination(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await notificationService.getNotifications(params);
        if (response.success && response.data) {
          let rawList: ApiNotification[] = [];
          let resPagination: ApiPagination | null = null;

          if (Array.isArray(response.data)) {
            rawList = response.data;
          } else if (response.data && typeof response.data === 'object') {
            const dataObj = response.data as {
              notifications?: ApiNotification[];
              items?: ApiNotification[];
              pagination?: ApiPagination;
            };
            if (Array.isArray(dataObj.notifications)) {
              rawList = dataObj.notifications;
            } else if (Array.isArray(dataObj.items)) {
              rawList = dataObj.items;
            }
            if (dataObj.pagination) {
              resPagination = dataObj.pagination;
            }
          }

          const normalizedList: ApiNotification[] = rawList.map((item) => ({
            ...item,
            type: String(item.type || '').toUpperCase() as NotificationType,
            isRead: item.isRead ?? item.read ?? false,
          }));

          setNotifications(normalizedList);
          setPagination(resPagination);
        } else {
          setNotifications([]);
          setPagination(null);
        }
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : 'Không thể tải danh sách thông báo';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated, user]
  );

  // Mark single notification as read with optimistic UI update and rollback
  const markAsRead = useCallback(
    async (id: string): Promise<boolean> => {
      const target = notifications.find((n) => n.id === id || n._id === id);
      if (!target || target.isRead || target.read) {
        return true;
      }

      // Prevent concurrent double-clicks on the same notification
      if (markingIds.has(id)) {
        return false;
      }

      setMarkingIds((prev) => new Set(prev).add(id));

      // Optimistic Update
      const previousNotifications = notifications;
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === id || item._id === id
            ? { ...item, isRead: true, read: true }
            : item
        )
      );

      try {
        const res = await notificationService.markAsRead(id);
        if (res.success) {
          return true;
        } else {
          throw new Error(res.message || 'Cập nhật trạng thái thất bại');
        }
      } catch (err: unknown) {
        // Rollback on failure
        setNotifications(previousNotifications);
        const errorMsg =
          err instanceof Error
            ? err.message
            : 'Lỗi khi đánh dấu đã đọc. Vui lòng thử lại.';
        toast.error(errorMsg);
        return false;
      } finally {
        setMarkingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    },
    [notifications, markingIds]
  );

  const refresh = useCallback(async () => {
    await fetchNotifications({ page: 1, limit: 20 });
  }, [fetchNotifications]);

  const isMarkingRead = useCallback(
    (id: string) => markingIds.has(id),
    [markingIds]
  );

  // Account Isolation & Session Lifecycle
  const currentUserId =
    user?.id ||
    (user as { _id?: string })?._id ||
    (user as { userId?: string })?.userId ||
    null;

  useEffect(() => {
    let isCancelled = false;

    const syncNotifications = async () => {
      await Promise.resolve();
      if (isCancelled) return;

      if (!isAuthenticated || !currentUserId) {
        // User logged out: strictly reset all notification state
        activeUserIdRef.current = null;
        notifiedIdsRef.current.clear();
        setLatestRealtimeNotification(null);
        setNotifications([]);
        setPagination(null);
        setError(null);
        setIsLoading(false);
        return;
      }

      if (activeUserIdRef.current !== currentUserId) {
        // Switched account or freshly logged in
        activeUserIdRef.current = currentUserId;
        notifiedIdsRef.current.clear();
        setLatestRealtimeNotification(null);
        setNotifications([]);
        setPagination(null);
        setError(null);
        await fetchNotifications({ page: 1, limit: 20 });
      }
    };

    void syncNotifications();

    return () => {
      isCancelled = true;
    };
  }, [isAuthenticated, currentUserId, fetchNotifications]);

  const addRealtimeNotification = useCallback((newNotif: ApiNotification) => {
    setNotifications((prev) => {
      const newId = newNotif.id || newNotif._id;
      const exists = prev.some((n) => (n.id || n._id) === newId);
      if (exists) return prev;
      return [newNotif, ...prev];
    });
  }, []);

  // Realtime Socket.IO Listener: new_notification, notification, newNotification
  useEffect(() => {
    if (!socket || !isAuthenticated) return;

    const extractId = (val: unknown): string | null => {
      if (!val) return null;
      if (typeof val === 'string') return val.trim();
      if (typeof val === 'number') return String(val);
      if (typeof val === 'object') {
        const obj = val as {
          id?: string | number;
          _id?: string | number;
          userId?: string | number;
        };
        if (obj.id) return String(obj.id).trim();
        if (obj._id) return String(obj._id).trim();
        if (obj.userId) return String(obj.userId).trim();
      }
      return null;
    };

    const handleIncomingNotification = (data: ApiNotification) => {
      if (!data) return;

      const currentUserId =
        user?.id ||
        (user as { _id?: string })?._id ||
        (user as { userId?: string })?.userId;

      // Verify recipient matches current active user if receiverId is provided
      if (currentUserId && data.receiverId) {
        if (Array.isArray(data.receiverId)) {
          const ids = (data.receiverId as unknown[])
            .map(extractId)
            .filter(Boolean)
            .map((s) => s!.toLowerCase());
          if (
            ids.length > 0 &&
            !ids.includes(String(currentUserId).toLowerCase())
          ) {
            return;
          }
        } else {
          const targetReceiverId = extractId(data.receiverId);
          if (
            targetReceiverId &&
            targetReceiverId.toLowerCase() !== String(currentUserId).toLowerCase()
          ) {
            return;
          }
        }
      }

      // Normalize notification object & uppercase type
      const rawType = (data.type || '').toString();
      const normalizedType = rawType.toUpperCase() as NotificationType;
      const normalizedNotification: ApiNotification = {
        ...data,
        type: normalizedType,
        isRead: data.isRead ?? data.read ?? false,
      };

      const notifId =
        normalizedNotification.id ||
        normalizedNotification._id ||
        `${normalizedType}-${normalizedNotification.createdAt}-${normalizedNotification.message}`;

      if (notifiedIdsRef.current.has(notifId)) {
        return;
      }
      notifiedIdsRef.current.add(notifId);

      // Play short gentle chime for new incoming realtime notification
      playNotificationSound({ id: notifId, source: 'notification' });

      addRealtimeNotification(normalizedNotification);
      setLatestRealtimeNotification(normalizedNotification);

      // Customized toast for LESSON vs other types
      if (normalizedType === 'LESSON') {
        toast.info(
          normalizedNotification.message ||
            'Có bài học mới trong khóa học bạn đã đăng ký!'
        );
      } else {
        toast.info(
          normalizedNotification.message || 'Bạn có thông báo mới'
        );
      }
    };

    // Listen to standard and alias events for maximum backend compatibility
    socket.on('new_notification', handleIncomingNotification);
    socket.on('notification', handleIncomingNotification);
    socket.on('newNotification', handleIncomingNotification);

    return () => {
      socket.off('new_notification', handleIncomingNotification);
      socket.off('notification', handleIncomingNotification);
      socket.off('newNotification', handleIncomingNotification);
    };
  }, [socket, isAuthenticated, user, addRealtimeNotification]);

  // Reconnection Sync: Revalidate with REST API upon reconnect
  useEffect(() => {
    if (!socket || !isAuthenticated) return;

    let hasConnectedOnce = socket.connected;

    const handleConnect = () => {
      if (hasConnectedOnce) {
        // Socket reconnected after a disconnect: sync missed notifications
        void refresh();
      } else {
        hasConnectedOnce = true;
      }
    };

    socket.on('connect', handleConnect);

    return () => {
      socket.off('connect', handleConnect);
    };
  }, [socket, isAuthenticated, refresh]);

  const contextValue = useMemo(
    () => ({
      notifications,
      unreadCount,
      pagination,
      isLoading,
      error,
      latestRealtimeNotification,
      isMarkingRead,
      fetchNotifications,
      markAsRead,
      refresh,
      addRealtimeNotification,
    }),
    [
      notifications,
      unreadCount,
      pagination,
      isLoading,
      error,
      latestRealtimeNotification,
      isMarkingRead,
      fetchNotifications,
      markAsRead,
      refresh,
      addRealtimeNotification,
    ]
  );

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationContextType {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
