'use client';

import { useAuthContext } from '@/contexts/auth-context';

/**
 * Custom hook to access authentication state and operations.
 */
export function useAuth() {
  return useAuthContext();
}
