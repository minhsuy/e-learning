/**
 * TMDEMY — Token Storage Helper
 * Provides SSR-safe access to access and refresh tokens.
 */

const ACCESS_TOKEN_KEY = 'tmdemy_access_token';
const REFRESH_TOKEN_KEY = 'tmdemy_refresh_token';

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

export function getAccessToken(): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken?: string): void {
  if (!isBrowser()) return;
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
  window.dispatchEvent(
    new CustomEvent('tmdemy:token-change', {
      detail: { accessToken, refreshToken },
    })
  );
}

export function clearTokens(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  window.dispatchEvent(
    new CustomEvent('tmdemy:token-change', {
      detail: { accessToken: null, refreshToken: null },
    })
  );
}
