import { ApiCourseItem } from './course';

/**
 * TMDEMY — Favorite Course Types (Phase F7.2-D)
 * Strict TypeScript types for Favorite Courses according to api/FAVORITE_API.md
 */

export interface FavoriteCourseData extends Omit<ApiCourseItem, 'slug'> {
  id?: string;
  _id?: string;
  title: string;
  slug?: string;
  price: number;
  image?: string;
  old_price?: number;
  oldPrice?: number;
  view?: number;
  sold?: number;
}

export interface FavoriteItem {
  id: string;
  _id?: string;
  userId: string;
  courseId: string;
  course: FavoriteCourseData;
  createdAt: string;
}

export interface FavoritePagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface GetFavoritesParams {
  page?: number;
  limit?: number;
}

export interface GetFavoritesResponse {
  success: boolean;
  message?: string;
  data: {
    favorites: FavoriteItem[];
    pagination: FavoritePagination;
  };
}

export interface AddFavoriteResponse {
  success: boolean;
  message?: string;
  data?: {
    id: string;
    _id?: string;
    userId: string;
    courseId: string;
    createdAt: string;
  };
}

export interface RemoveFavoriteResponse {
  success: boolean;
  message?: string;
}
