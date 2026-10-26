/**
 * TMDEMY — Core API Types
 * Strictly reflects the API Contract specifications without any backend dependencies.
 */

export type UserRole = 'user' | 'teacher' | 'admin';

export interface ApiPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  [key: string]: unknown;
}

export interface AppApiErrorPayload {
  statusCode: number;
  message: string;
  validationErrors?: Record<string, string>;
  raw?: unknown;
}

export class AppApiError extends Error {
  public statusCode: number;
  public validationErrors?: Record<string, string>;
  public raw?: unknown;

  constructor(payload: AppApiErrorPayload) {
    super(payload.message);
    this.name = 'AppApiError';
    this.statusCode = payload.statusCode;
    this.validationErrors = payload.validationErrors;
    this.raw = payload.raw;
  }
}
