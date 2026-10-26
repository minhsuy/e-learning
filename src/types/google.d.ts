/**
 * Type declarations for Google Identity Services (GIS)
 * https://developers.google.com/identity/gsi/web/reference/js-reference
 */

export interface GoogleCredentialResponse {
  credential: string;
  select_by?: 'auto' | 'user' | 'user_1tap' | 'user_2tap' | 'btn' | 'btn_confirm' | 'btn_add_session' | 'user_cancel';
  clientId?: string;
}

export interface GoogleCodeResponse {
  code?: string;
  scope?: string;
  state?: string;
  error?: string;
  error_description?: string;
  error_uri?: string;
}

export interface GoogleTokenResponse {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  scope?: string;
  error?: string;
  error_description?: string;
  error_uri?: string;
}

export interface GoogleIdConfiguration {
  client_id: string;
  callback: (response: GoogleCredentialResponse) => void;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
  context?: 'signin' | 'signup' | 'use';
  prompt_parent_id?: string;
  state_cookie_domain?: string;
  ux_mode?: 'popup' | 'redirect';
  login_uri?: string;
  use_fedcm_for_prompt?: boolean;
}

export interface GoogleGsiButtonConfiguration {
  type?: 'standard' | 'icon';
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  size?: 'large' | 'medium' | 'small';
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  shape?: 'rectangular' | 'pill' | 'circle' | 'square';
  logo_alignment?: 'left' | 'center';
  width?: number;
  locale?: string;
}

export interface GoogleCodeClientConfig {
  client_id: string;
  scope: string;
  ux_mode?: 'popup' | 'redirect';
  redirect_uri?: string;
  state?: string;
  callback?: (response: GoogleCodeResponse) => void;
  error_callback?: (nonOAuthError: unknown) => void;
}

export interface GoogleCodeClient {
  requestCode: () => void;
}

export interface GoogleTokenClientConfig {
  client_id: string;
  scope: string;
  callback?: (response: GoogleTokenResponse) => void;
  error_callback?: (nonOAuthError: unknown) => void;
  prompt?: string;
}

export interface GoogleTokenClient {
  requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
}

export interface GooglePromptMomentNotification {
  isDisplayMoment: () => boolean;
  isDisplayed: () => boolean;
  isNotDisplayed: () => boolean;
  getNotDisplayedReason: () => string;
  isSkippedMoment: () => boolean;
  getSkippedReason: () => string;
  isDismissedMoment: () => boolean;
  getDismissedReason: () => string;
  getMomentType: () => string;
}

export interface GoogleAccounts {
  id: {
    initialize: (config: GoogleIdConfiguration) => void;
    prompt: (notification?: (notification: GooglePromptMomentNotification) => void) => void;
    renderButton: (parent: HTMLElement, options: GoogleGsiButtonConfiguration) => void;
    cancel: () => void;
    revoke?: (hint: string, callback: (response: { successful: boolean; error: string }) => void) => void;
  };
  oauth2: {
    initCodeClient: (config: GoogleCodeClientConfig) => GoogleCodeClient;
    initTokenClient: (config: GoogleTokenClientConfig) => GoogleTokenClient;
    revoke?: (accessToken: string, done: () => void) => void;
  };
}

declare global {
  interface Window {
    google?: {
      accounts: GoogleAccounts;
    };
  }
}
