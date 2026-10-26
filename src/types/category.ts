/**
 * TMDEMY — Category Types
 * Strictly reflects api/CATEGORY_API.md
 */

export interface ApiCategoryItem {
  id: string;
  _id?: string;
  name: string;
  slug: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type Category = ApiCategoryItem;

export interface GetCategoriesParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
}

export interface GetCategoriesResponse {
  success: boolean;
  message?: string;
  data: {
    categories: ApiCategoryItem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}
