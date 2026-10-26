import { AppApiError } from '@/types/api';
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from './token';

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
  skipAuth?: boolean;
  skipRefresh?: boolean;
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

let isRefreshing = false;
let refreshSubscribers: Array<(token: string | null) => void> = [];

function subscribeTokenRefresh(cb: (token: string | null) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token: string | null) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

const ERROR_TRANSLATIONS: Record<string, string> = {
  'Incorrect password': 'Mật khẩu không chính xác. Vui lòng kiểm tra lại.',
  'Email already in use': 'Địa chỉ email này đã tồn tại trong hệ thống.',
  'Passwords do not match': 'Mật khẩu xác nhận không khớp.',
  'User not found': 'Không tìm thấy thông tin tài khoản người dùng.',
  'jwt expired': 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
  'Access Token is missing!': 'Phiên làm việc không hợp lệ hoặc thiếu mã truy cập.',
  'Invalid token': 'Mã xác thực không hợp lệ hoặc đã hết hạn.',
  'Email is required': 'Vui lòng cung cấp địa chỉ email.',
  'Password is required': 'Vui lòng nhập mật khẩu.',
  'Account is not verified': 'Tài khoản chưa được kích hoạt. Vui lòng xác thực email trước.',
  'Account is inactive': 'Tài khoản của bạn đã bị khóa bởi Quản trị viên.',
  'User is inactive': 'Tài khoản của bạn đã bị khóa bởi Quản trị viên.',
  'Account has been blocked': 'Tài khoản của bạn đã bị khóa bởi Quản trị viên.',
  'Account is locked': 'Tài khoản của bạn đã bị khóa bởi Quản trị viên.',
};

function normalizeErrorMessage(msg: string): string {
  const trimmed = msg.trim();
  return ERROR_TRANSLATIONS[trimmed] || trimmed;
}

/**
 * Extracts a normalized error message from any Backend TMDEMY error response format.
 */
function extractErrorMessage(data: unknown, status: number): { message: string; validationErrors?: Record<string, string> } {
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;

    // Case 1: express-validator format -> { errors: { field: "message" } }
    if (record.errors && typeof record.errors === 'object' && !Array.isArray(record.errors)) {
      const validationErrors = record.errors as Record<string, string>;
      const firstMsg = Object.values(validationErrors)[0] || 'Dữ liệu không hợp lệ';
      return { message: normalizeErrorMessage(firstMsg), validationErrors };
    }

    // Case 2: middleware format -> { error: "jwt expired" | "Access Token is missing!" }
    if (typeof record.error === 'string' && record.error.trim()) {
      return { message: normalizeErrorMessage(record.error) };
    }

    // Case 3: controller format -> { message: "Incorrect password" | "User not found" }
    if (typeof record.message === 'string' && record.message.trim()) {
      return { message: normalizeErrorMessage(record.message) };
    }
  }

  return { message: `Yêu cầu thất bại với mã lỗi HTTP ${status}` };
}

/**
 * Executes a token refresh call to POST /api/users/access_token
 */
export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    clearTokens();
    return null;
  }

  try {
    const res = await fetch(`${BASE_URL}/api/users/access_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!res.ok) {
      clearTokens();
      return null;
    }

    const data = (await res.json()) as { success?: boolean; access_token?: string };
    if (data.success && data.access_token) {
      setTokens(data.access_token);
      return data.access_token;
    }

    clearTokens();
    return null;
  } catch {
    clearTokens();
    return null;
  }
}

/**
 * Central API Request Function
 */
export async function apiRequest<T = unknown>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { params, body, skipAuth = false, skipRefresh = false, headers: customHeaders, ...fetchOptions } = options;

  // Build URL with query parameters
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = new URL(`${BASE_URL}${normalizedEndpoint}`);

  if (params) {
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        url.searchParams.append(key, String(val));
      }
    });
  }

  // Setup headers
  const headers = new Headers(customHeaders);
  if (!headers.has('Content-Type') && body !== undefined && !(body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (!skipAuth) {
    const token = getAccessToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  // Prepare body
  let serializedBody: BodyInit | undefined;
  if (body !== undefined) {
    if (body instanceof FormData) {
      serializedBody = body;
    } else if (typeof body === 'string') {
      serializedBody = body;
    } else {
      serializedBody = JSON.stringify(body);
    }
  }

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      ...fetchOptions,
      headers,
      body: serializedBody,
    });
  } catch (networkError) {
    if (
      (networkError instanceof Error && networkError.name === 'AbortError') ||
      (networkError as { name?: string })?.name === 'AbortError' ||
      fetchOptions.signal?.aborted
    ) {
      throw networkError;
    }
    throw new AppApiError({
      statusCode: 0,
      message: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng hoặc thử lại sau.',
      raw: networkError,
    });
  }

  // Parse response body safely
  let responseData: unknown = null;
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      responseData = await res.json();
    } catch {
      responseData = null;
    }
  } else {
    try {
      responseData = await res.text();
    } catch {
      responseData = null;
    }
  }

  // Handle 401 Unauthorized with token refresh mechanism
  if (res.status === 401 && !skipRefresh && !skipAuth) {
    const { message } = extractErrorMessage(responseData, 401);

    if (message.includes('jwt expired')) {
      if (!isRefreshing) {
        isRefreshing = true;
        const newToken = await refreshAccessToken();
        isRefreshing = false;
        onRefreshed(newToken);

        if (newToken) {
          // Retry original request with newly acquired access token
          return apiRequest<T>(endpoint, {
            ...options,
            skipRefresh: true, // Avoid infinite loop
          });
        }
      } else {
        // Wait for active refresh to complete
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh((newToken) => {
            if (newToken) {
              resolve(
                apiRequest<T>(endpoint, {
                  ...options,
                  skipRefresh: true,
                })
              );
            } else {
              reject(
                new AppApiError({
                  statusCode: 401,
                  message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
                  raw: responseData,
                })
              );
            }
          });
        });
      }
    }
  }

  // Handle HTTP errors
  if (!res.ok) {
    const { message, validationErrors } = extractErrorMessage(responseData, res.status);
    throw new AppApiError({
      statusCode: res.status,
      message,
      validationErrors,
      raw: responseData,
    });
  }

  return responseData as T;
}

/**
 * Convenient API Client methods
 */
export const apiClient = {
  get<T = unknown>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
    return apiRequest<T>(endpoint, { ...options, method: 'GET' });
  },

  post<T = unknown>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
    return apiRequest<T>(endpoint, { ...options, method: 'POST', body });
  },

  put<T = unknown>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
    return apiRequest<T>(endpoint, { ...options, method: 'PUT', body });
  },

  patch<T = unknown>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
    return apiRequest<T>(endpoint, { ...options, method: 'PATCH', body });
  },

  delete<T = unknown>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
    return apiRequest<T>(endpoint, { ...options, method: 'DELETE' });
  },
};
