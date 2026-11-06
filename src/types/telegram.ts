/**
 * TMDEMY — TELEGRAM TEACHER BOT TYPES (TG-02B)
 *
 * Strict TypeScript types for Telegram teacher account linking,
 * status checks, token generation, and deep-link lifecycle.
 * Source of Truth: docs/telegram/tg02_account_linking_api.md
 */

export interface TelegramAccount {
  id: string;
  userId: string;
  telegramUserId: string;
  telegramChatId: string;
  telegramUsername?: string | null;
  telegramFirstName?: string | null;
  linkedAt: string;
  updatedAt: string;
}

export interface TeacherTelegramStatusData {
  isLinked: boolean;
  account: TelegramAccount | null;
}

export interface TeacherTelegramStatusResponse {
  success: boolean;
  statusCode: number;
  data: TeacherTelegramStatusData;
  message?: string;
}

export interface TeacherTelegramLinkTokenData {
  token: string;
  deepLink: string;
  expiresAt: string;
  expiresInMinutes: number;
}

export interface TeacherTelegramLinkTokenResponse {
  success: boolean;
  statusCode: number;
  data: TeacherTelegramLinkTokenData;
  message?: string;
}

export interface TeacherTelegramUnlinkResponse {
  success: boolean;
  statusCode: number;
  message: string;
}

// TG-05 Automated Report Scheduling Types
export * from './telegram-schedule';


