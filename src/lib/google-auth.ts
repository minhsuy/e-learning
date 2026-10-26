/**
 * TMDEMY — Google Identity Services (GIS) Utility
 * Manages dynamic script loading and GIS client lifecycle safely.
 */

const GOOGLE_GSI_SRC = 'https://accounts.google.com/gsi/client';

let scriptLoadingPromise: Promise<boolean> | null = null;

/**
 * Ensures Google Identity Services SDK is loaded in the browser.
 */
export function loadGoogleGsiScript(): Promise<boolean> {
  if (typeof window === 'undefined') {
    return Promise.resolve(false);
  }

  if (window.google?.accounts) {
    return Promise.resolve(true);
  }

  if (scriptLoadingPromise) {
    return scriptLoadingPromise;
  }

  scriptLoadingPromise = new Promise<boolean>((resolve) => {
    // Check if script is already present in DOM
    const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${GOOGLE_GSI_SRC}"]`);
    if (existingScript) {
      if (window.google?.accounts) {
        resolve(true);
        return;
      }
      const handleLoad = () => resolve(true);
      const handleError = () => resolve(false);
      existingScript.addEventListener('load', handleLoad, { once: true });
      existingScript.addEventListener('error', handleError, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = GOOGLE_GSI_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(true);
    script.onerror = (e) => {
      console.error('Không thể tải Google Identity Services SDK:', e);
      resolve(false);
    };
    document.head.appendChild(script);
  });

  return scriptLoadingPromise;
}

/**
 * Returns configured Google Client ID from environment variables.
 */
export function getGoogleClientId(): string {
  return process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
}
