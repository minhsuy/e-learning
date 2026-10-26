/**
 * TMDEMY — Admin Category Types
 * Reflects api/CATEGORY_API.md and api/ADMIN_API.md
 */

export interface AdminCategoryItem {
  id: string;
  _id?: string;
  name: string;
  slug: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  isDestroyed?: boolean;
  courseCount?: number;
}

export interface GetAdminCategoriesParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
}

export interface CreateCategoryDto {
  name: string;
  description?: string;
  slug?: string;
}

export interface UpdateCategoryDto {
  name?: string;
  slug?: string;
  description?: string;
}

export interface AdminCategoriesPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AdminCategoriesListResponse {
  success: boolean;
  message?: string;
  data: {
    categories: AdminCategoryItem[];
    pagination: AdminCategoriesPagination;
  };
}

export interface AdminCategoryDetailResponse {
  success: boolean;
  message?: string;
  data: AdminCategoryItem;
}

export interface AdminCategoryMutationResponse {
  success: boolean;
  message: string;
  data?: {
    id?: string;
    name?: string;
    slug?: string;
  };
}

export interface AdminCategoryKpis {
  totalCategories: number | null;
  activeCategories: number | null;
  totalCoursesAttached: number | null;
}
