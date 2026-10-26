'use client';

import { useFavorites as useFavoritesContext } from '@/contexts/favorite-context';

/**
 * Custom hook to access synchronized favorite state and actions.
 */
export function useFavorites() {
  return useFavoritesContext();
}
