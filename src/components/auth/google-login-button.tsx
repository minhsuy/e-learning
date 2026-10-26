'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { getDefaultRolePath } from '@/components/auth/route-guard';
import { getGoogleClientId, loadGoogleGsiScript } from '@/lib/google-auth';
import { toast } from '@/lib/toast';
import { AppApiError } from '@/types/api';
import { UserProfile } from '@/types/auth';
import { Loader2 } from 'lucide-react';

export interface GoogleLoginButtonProps {
  /** Optional text to display on button */
  buttonText?: string;
  /** 'signin' or 'signup' */
  mode?: 'signin' | 'signup';
  /** URL to redirect to after successful authentication */
  redirectUrl?: string | null;
  /** Whether to initialize Google One Tap on mount (defaults to false to prevent FedCM conflicts) */
  enableOneTap?: boolean;
  /** Custom class name */
  className?: string;
  /** External disabled state */
  disabled?: boolean;
  /** Callback on authentication success */
  onSuccess?: (user: UserProfile) => void;
  /** Callback on authentication error */
  onError?: (errorMessage: string) => void;
}

export function GoogleLoginButton({
  buttonText = 'Tiếp tục với tài khoản Google',
  mode = 'signin',
  redirectUrl,
  enableOneTap = false,
  className = '',
  disabled = false,
  onSuccess,
  onError,
}: GoogleLoginButtonProps) {
  const router = useRouter();
  const { loginWithGoogle } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [isRendered, setIsRendered] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(true);
  const hasInitializedRef = useRef(false);

  // Keep latest callbacks in ref without mutating during render
  const callbacksRef = useRef({ onSuccess, onError, redirectUrl });
  useEffect(() => {
    callbacksRef.current = { onSuccess, onError, redirectUrl };
  }, [onSuccess, onError, redirectUrl]);

  const handleAuthSuccess = async (credential: string) => {
    if (!isMountedRef.current) return;
    setIsLoading(true);

    try {
      const user = await loginWithGoogle({
        idToken: credential,
      });

      const successMsg =
        mode === 'signup'
          ? 'Đăng ký tài khoản Google thành công!'
          : 'Đăng nhập Google thành công! Chào mừng bạn trở lại.';
      toast.success(successMsg);

      if (callbacksRef.current.onSuccess) {
        callbacksRef.current.onSuccess(user);
      } else {
        const target = callbacksRef.current.redirectUrl || getDefaultRolePath(user.role);
        router.push(target);
      }
    } catch (err) {
      let msg = 'Đăng nhập Google không thành công. Vui lòng thử lại sau.';
      if (err instanceof AppApiError) {
        msg = err.message;
      } else if (err instanceof Error) {
        msg = err.message;
      }
      toast.error(msg);
      callbacksRef.current.onError?.(msg);
    } finally {
      if (isMountedRef.current) setIsLoading(false);
    }
  };

  // Initialize GIS and render official Google button once
  useEffect(() => {
    isMountedRef.current = true;
    const clientId = getGoogleClientId();

    if (!clientId || hasInitializedRef.current) {
      return;
    }
    hasInitializedRef.current = true;

    void loadGoogleGsiScript().then((loaded) => {
      if (!isMountedRef.current || !loaded || !window.google?.accounts?.id) return;

      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (credentialResponse) => {
            if (credentialResponse.credential) {
              void handleAuthSuccess(credentialResponse.credential);
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
          use_fedcm_for_prompt: false, // Disables FedCM to prevent NotAllowedError and AbortError
          context: mode === 'signup' ? 'signup' : 'signin',
        });

        // Render official Google button into container
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
          window.google.accounts.id.renderButton(containerRef.current, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text: mode === 'signup' ? 'signup_with' : 'continue_with',
            shape: 'rectangular',
            logo_alignment: 'left',
            width: 380,
            locale: 'vi',
          });
          setIsRendered(true);
        }

        // Optional One Tap prompt (only if explicitly enabled)
        if (enableOneTap) {
          window.google.accounts.id.prompt();
        }
      } catch (e) {
        console.warn('Google GSI button initialization error:', e);
      }
    });

    return () => {
      isMountedRef.current = false;
      try {
        window.google?.accounts?.id?.cancel();
      } catch {
        // Safe cleanup
      }
    };
  }, [mode, enableOneTap]);

  // Fallback custom button click handler (using OAuth2 Code Flow)
  const handleCustomClick = async () => {
    if (isLoading || disabled) return;

    const clientId = getGoogleClientId();
    if (!clientId) {
      const err = 'Chưa cấu hình Google Client ID (NEXT_PUBLIC_GOOGLE_CLIENT_ID).';
      toast.error(err);
      callbacksRef.current.onError?.(err);
      return;
    }

    setIsLoading(true);

    try {
      // Cancel any active One Tap prompt before opening popup to prevent credential locks
      try {
        window.google?.accounts?.id?.cancel();
      } catch {
        // Safe ignore
      }

      const loaded = await loadGoogleGsiScript();
      if (!loaded || !window.google?.accounts?.oauth2) {
        throw new Error('Không thể tải Google Identity Services. Vui lòng kiểm tra kết nối mạng.');
      }

      // Initialize OAuth2 popup code client
      const codeClient = window.google.accounts.oauth2.initCodeClient({
        client_id: clientId,
        scope: 'openid email profile',
        ux_mode: 'popup',
        callback: async (response) => {
          if (response.error) {
            // Gracefully ignore user closing the popup window
            if (
              response.error === 'popup_closed_by_user' ||
              response.error === 'user_cancelled'
            ) {
              if (isMountedRef.current) setIsLoading(false);
              return;
            }

            const errorMsg =
              response.error_description ||
              'Đăng nhập Google bị hủy hoặc không thành công.';
            toast.error(errorMsg);
            callbacksRef.current.onError?.(errorMsg);
            if (isMountedRef.current) setIsLoading(false);
            return;
          }

          if (!response.code) {
            if (isMountedRef.current) setIsLoading(false);
            return;
          }

          try {
            const user = await loginWithGoogle({
              code: response.code,
              redirectUri: 'postmessage',
            });

            const successMsg =
              mode === 'signup'
                ? 'Đăng ký tài khoản Google thành công!'
                : 'Đăng nhập Google thành công! Chào mừng bạn trở lại.';
            toast.success(successMsg);

            if (callbacksRef.current.onSuccess) {
              callbacksRef.current.onSuccess(user);
            } else {
              const target = callbacksRef.current.redirectUrl || getDefaultRolePath(user.role);
              router.push(target);
            }
          } catch (err) {
            let msg = 'Đăng nhập Google không thành công. Vui lòng thử lại sau.';
            if (err instanceof AppApiError) {
              msg = err.message;
            } else if (err instanceof Error) {
              msg = err.message;
            }
            toast.error(msg);
            callbacksRef.current.onError?.(msg);
          } finally {
            if (isMountedRef.current) setIsLoading(false);
          }
        },
        error_callback: () => {
          if (isMountedRef.current) setIsLoading(false);
        },
      });

      codeClient.requestCode();
    } catch (err) {
      let msg = 'Không thể khởi động đăng nhập Google.';
      if (err instanceof Error) {
        msg = err.message;
      }
      toast.error(msg);
      callbacksRef.current.onError?.(msg);
      if (isMountedRef.current) setIsLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-center my-1 relative min-h-[44px]">
      {/* Official Google Identity Services button container */}
      <div
        ref={containerRef}
        className={`w-full flex justify-center ${isRendered && !isLoading ? 'block' : 'hidden'}`}
        style={{ minHeight: '44px' }}
      />

      {/* Fallback button matching TMdemy styling while loading or when custom clicked */}
      {(!isRendered || isLoading) && (
        <button
          type="button"
          onClick={handleCustomClick}
          disabled={disabled || isLoading}
          className={
            className ||
            'w-full h-11 rounded-lg bg-[#f7f1ff] hover:bg-[#f1ebff] active:scale-[0.99] text-[#1c192c] text-xs sm:text-sm font-semibold flex items-center justify-center gap-3 transition-all shadow-sm border border-[#e6dffa] disabled:opacity-60 disabled:cursor-not-allowed'
          }
          aria-label={buttonText}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin text-[#7240b8]" />
              <span>Đang kết nối Google...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  fill="#EA4335"
                />
              </svg>
              <span>{buttonText}</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
