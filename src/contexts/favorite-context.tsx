'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { favoriteService } from '@/services/favorite.service';
import { toast } from '@/lib/toast';
import { AppApiError } from '@/types/api';

export interface FavoriteContextType {
  favoriteIds: Set<string>;
  isLoading: boolean;
  isFavorite: (courseId: string) => boolean;
  isToggling: (courseId: string) => boolean;
  toggleFavorite: (courseId: string) => Promise<boolean>;
  refreshFavorites: () => Promise<void>;
  favoritesCount: number;
}

const FavoriteContext = createContext<FavoriteContextType | undefined>(undefined);

export function FavoriteProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Fetch all favorite course IDs when authenticated
  const refreshFavorites = useCallback(async () => {
    if (!isAuthenticated) {
      setFavoriteIds(new Set());
      return;
    }

    try {
      setIsLoading(true);
      // Fetch up to 100 favorites for ID sync map
      const res = await favoriteService.getFavorites({ limit: 100, page: 1 });
      if (res.success && res.data?.favorites) {
        const idSet = new Set<string>();
        res.data.favorites.forEach((fav) => {
          if (fav.courseId) idSet.add(fav.courseId);
          if (fav.course?.id) idSet.add(fav.course.id);
          if (fav.course?._id) idSet.add(fav.course._id);
          if (fav.course?.slug) idSet.add(fav.course.slug);
        });
        setFavoriteIds(idSet);
      }
    } catch {
      // Non-blocking sync error
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    let isCancelled = false;

    const syncFavorites = async () => {
      await Promise.resolve();
      if (isCancelled) return;

      if (isAuthenticated) {
        await refreshFavorites();
      } else {
        setFavoriteIds(new Set());
      }
    };

    void syncFavorites();

    return () => {
      isCancelled = true;
    };
  }, [isAuthenticated, refreshFavorites]);

  const isFavorite = useCallback(
    (courseId: string): boolean => {
      if (!courseId) return false;
      return favoriteIds.has(courseId);
    },
    [favoriteIds]
  );

  const isToggling = useCallback(
    (courseId: string): boolean => {
      if (!courseId) return false;
      return togglingIds.has(courseId);
    },
    [togglingIds]
  );

  const toggleFavorite = useCallback(
    async (courseId: string): Promise<boolean> => {
      if (!courseId) return false;

      // Guest check: Prompt login
      if (!isAuthenticated) {
        const redirectUrl = pathname ? `/login?redirect=${encodeURIComponent(pathname)}` : '/login';
        router.push(redirectUrl);
        return false;
      }

      // Guard against duplicate in-flight requests
      if (togglingIds.has(courseId)) {
        return favoriteIds.has(courseId);
      }

      const wasFavorited = favoriteIds.has(courseId);
      const willBeFavorited = !wasFavorited;

      // 1. Mark as in-flight
      setTogglingIds((prev) => {
        const next = new Set(prev);
        next.add(courseId);
        return next;
      });

      // 2. Optimistic update
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (willBeFavorited) {
          next.add(courseId);
        } else {
          next.delete(courseId);
        }
        return next;
      });

      try {
        if (willBeFavorited) {
          await favoriteService.addFavorite(courseId);
          toast.success('Đã thêm khóa học vào danh sách yêu thích.');
        } else {
          await favoriteService.removeFavorite(courseId);
          toast.info('Đã xóa khóa học khỏi danh sách yêu thích.');
        }
        return willBeFavorited;
      } catch (err: unknown) {
        // 3. Rollback on failure
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          if (wasFavorited) {
            next.add(courseId);
          } else {
            next.delete(courseId);
          }
          return next;
        });

        const errorMsg =
          err instanceof AppApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : 'Thao tác không thành công. Vui lòng thử lại.';
        toast.error(errorMsg);
        return wasFavorited;
      } finally {
        // 4. Release in-flight flag
        setTogglingIds((prev) => {
          const next = new Set(prev);
          next.delete(courseId);
          return next;
        });
      }
    },
    [isAuthenticated, pathname, router, togglingIds, favoriteIds]
  );

  const value = useMemo<FavoriteContextType>(
    () => ({
      favoriteIds,
      isLoading,
      isFavorite,
      isToggling,
      toggleFavorite,
      refreshFavorites,
      favoritesCount: favoriteIds.size,
    }),
    [
      favoriteIds,
      isLoading,
      isFavorite,
      isToggling,
      toggleFavorite,
      refreshFavorites,
    ]
  );

  return <FavoriteContext.Provider value={value}>{children}</FavoriteContext.Provider>;
}

export function useFavorites(): FavoriteContextType {
  const context = useContext(FavoriteContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoriteProvider');
  }
  return context;
}
