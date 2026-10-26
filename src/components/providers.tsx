'use client';

import React from 'react';
import { AuthProvider } from '@/contexts/auth-context';
import { FavoriteProvider } from '@/contexts/favorite-context';
import { NotificationProvider } from '@/contexts/notification-context';
import { SocketProvider } from '@/contexts/socket-context';
import { ThemeProvider } from '@/contexts/theme-context';
import { AccountLockedModal } from '@/components/auth/account-locked-modal';
import { ToastContainer } from '@/components/ui/toast-container';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <NotificationProvider>
            <FavoriteProvider>
              {children}
              <AccountLockedModal />
              <ToastContainer />
            </FavoriteProvider>
          </NotificationProvider>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

