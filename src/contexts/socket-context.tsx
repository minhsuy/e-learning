'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
} from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/hooks/use-auth';
import { getAccessToken } from '@/lib/api/token';
import { refreshAccessToken } from '@/lib/api/client';

export interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  socketId: string | null;
  reconnect: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:3002';

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [socketId, setSocketId] = useState<string | null>(null);

  // Track active user ID to ensure strict account isolation
  const activeUserIdRef = useRef<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const isRefreshingSocketAuthRef = useRef<boolean>(false);

  const cleanupSocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setSocket(null);
    setIsConnected(false);
    setSocketId(null);
  }, []);

  const initSocket = useCallback(() => {
    const token = getAccessToken();
    if (!token) {
      cleanupSocket();
      return;
    }

    // Disconnect any existing socket before creating new connection
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
    }

    const newSocket: Socket = io(SOCKET_URL, {
      path: '/socket.io/',
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      auth: (cb: (data: { token: string | null }) => void) => {
        cb({ token: getAccessToken() });
      },
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
      setSocketId(newSocket.id || null);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      setSocketId(null);
    });

    newSocket.on('connect_error', async (error) => {
      setIsConnected(false);
      const isAuthError =
        error.message?.includes('Authentication error') ||
        error.message?.includes('token') ||
        error.message?.includes('jwt');

      if (isAuthError && !isRefreshingSocketAuthRef.current) {
        isRefreshingSocketAuthRef.current = true;
        try {
          const newToken = await refreshAccessToken();
          if (newToken && socketRef.current) {
            socketRef.current.auth = { token: newToken };
            socketRef.current.connect();
          } else {
            cleanupSocket();
          }
        } catch {
          cleanupSocket();
        } finally {
          isRefreshingSocketAuthRef.current = false;
        }
      }
    });
  }, [cleanupSocket]);

  // Account Isolation & Connection Lifecycle
  useEffect(() => {
    let isCancelled = false;

    const syncSocketConnection = async () => {
      await Promise.resolve();
      if (isCancelled) return;

      const currentUserId = user?.id || (user as { _id?: string })?._id || null;

      // Unauthenticated or Logged out: disconnect immediately
      if (!isAuthenticated || !currentUserId) {
        activeUserIdRef.current = null;
        cleanupSocket();
        return;
      }

      // Switched account or first time authenticated
      if (activeUserIdRef.current !== currentUserId || !socketRef.current) {
        activeUserIdRef.current = currentUserId;
        initSocket();
      }
    };

    void syncSocketConnection();

    return () => {
      isCancelled = true;
    };
  }, [isAuthenticated, user, initSocket, cleanupSocket]);

  // Token Change Synchronization
  useEffect(() => {
    const handleTokenChange = (e: Event) => {
      const detail = (e as CustomEvent<{ accessToken: string | null }>).detail;
      if (!detail?.accessToken) {
        cleanupSocket();
      } else if (socketRef.current) {
        socketRef.current.auth = { token: detail.accessToken };
        if (!socketRef.current.connected) {
          socketRef.current.connect();
        }
      } else if (isAuthenticated && user) {
        initSocket();
      }
    };

    window.addEventListener('tmdemy:token-change', handleTokenChange);
    return () => {
      window.removeEventListener('tmdemy:token-change', handleTokenChange);
    };
  }, [cleanupSocket, initSocket, isAuthenticated, user]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupSocket();
    };
  }, [cleanupSocket]);

  const reconnect = useCallback(() => {
    if (isAuthenticated && user) {
      initSocket();
    }
  }, [isAuthenticated, user, initSocket]);

  const contextValue = useMemo<SocketContextType>(
    () => ({
      socket,
      isConnected,
      socketId,
      reconnect,
    }),
    [socket, isConnected, socketId, reconnect]
  );

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket(): SocketContextType {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
