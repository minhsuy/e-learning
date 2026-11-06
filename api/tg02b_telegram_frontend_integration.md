# TMdemy Frontend — TG-02B Telegram Teacher Account Linking Integration API

**Document Version:** 1.0.0  
**Status:** Implemented & Verified (`next build` OK)  
**Author:** Senior Frontend Engineer (Pair Programming with TMdemy Team)  
**Target Architecture:** Next.js App Router (TypeScript, React 19, Tailwind CSS, shadcn/ui)  
**Backend Source of Truth:** `docs/telegram/tg02_account_linking_api.md`  

---

## 1. Executive Summary

This document describes the frontend integration contract and implementation details for **TG-02B: Telegram Teacher Account Linking**.

The integration enables authenticated instructors on `http://localhost:3000/teacher/automation` (as well as dedicated teacher management views) to securely link their TMdemy teacher account with the TMdemy Telegram Bot (`@tmdemy_bot`). This enables realtime bot-driven revenue reports, order alerts, and student enrollment statistics.

---

## 2. Consumed REST API Endpoints

All endpoints are hosted on the Node.js backend (`e-learning_server`) under the `/api/teacher/telegram` prefix. Requests are automatically authenticated via Bearer JWT token managed by the centralized `apiClient`.

### 2.1 Get Linking Status
- **Endpoint:** `GET /api/teacher/telegram/status`
- **Auth Required:** `Bearer <accessToken>` (Role: `TEACHER`)
- **Frontend Method:** `telegramTeacherService.getStatus()`
- **Response Format (Linked - 200 OK):**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "isLinked": true,
    "account": {
      "id": "e2f1b4a0-7c9d-4e8a-b123-456789abcdef",
      "userId": "018f3a2b-7c8d-4e9f-a012-3456789abcde",
      "telegramUserId": "123456789",
      "telegramChatId": "123456789",
      "telegramUsername": "prof_alex",
      "telegramFirstName": "Alex Rivers",
      "linkedAt": "2026-11-04T13:30:00.000Z",
      "updatedAt": "2026-11-04T13:30:00.000Z"
    }
  }
}
```
- **Response Format (Unlinked - 200 OK):**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "isLinked": false,
    "account": null
  }
}
```

### 2.2 Generate Linking Token & Deep Link
- **Endpoint:** `POST /api/teacher/telegram/link-token`
- **Auth Required:** `Bearer <accessToken>` (Role: `TEACHER`)
- **Frontend Method:** `telegramTeacherService.generateLinkToken()`
- **Request Body:** `{}` (empty)
- **Response Format (201 Created):**
```json
{
  "success": true,
  "statusCode": 201,
  "data": {
    "token": "4a7f9b2c8e1d5a3f7b0c9e2a4d8f1b6c3e7a9d0f2b4c8e1a5d9f3b7c0e2a4d8f",
    "deepLink": "https://t.me/tmdemy_bot?start=link_4a7f9b2c8e1d5a3f7b0c9e2a4d8f1b6c3e7a9d0f2b4c8e1a5d9f3b7c0e2a4d8f",
    "expiresAt": "2026-11-04T13:45:00.000Z",
    "expiresInMinutes": 15
  }
}
```

### 2.3 Unlink Account
- **Endpoint:** `DELETE /api/teacher/telegram/unlink`
- **Auth Required:** `Bearer <accessToken>` (Role: `TEACHER`)
- **Frontend Method:** `telegramTeacherService.unlinkAccount()`
- **Response Format (200 OK):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Hủy liên kết tài khoản Telegram thành công"
}
```

---

## 3. Strict TypeScript DTOs & Interfaces

Defined in `@/types/telegram` (`src/types/telegram.ts`):

```typescript
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
```

---

## 4. Frontend State & Hook Architecture

Located in `@/hooks/use-teacher-telegram` (`src/hooks/use-teacher-telegram.ts`):

### 4.1 State Machine
- `status`: Cached result of `GET /api/teacher/telegram/status`.
- `isLoadingStatus`: Boolean during initial dashboard mount.
- `isGeneratingToken`: Loading indicator when requesting a new 15-min link token.
- `isUnlinking`: Loading state during account unlinking.
- `linkData`: Ephemeral token + deep link held in component memory. **Never saved to `localStorage` or `sessionStorage`**.
- `isModalOpen`: Visibility of `<TelegramLinkModal />`.
- `isConfirmUnlinkOpen`: Visibility of `<TelegramUnlinkDialog />`.

### 4.2 Polling Algorithm
While `<TelegramLinkModal />` is open:
1. Initializes a 3-second `setInterval`.
2. Evaluates `isPollingRef` to prevent concurrent overlapping requests.
3. Checks `expiresAt` locally. If `Date.now() >= expiresAt`, interval clears immediately and UI transitions to the expired screen.
4. When `GET /api/teacher/telegram/status` returns `data.isLinked === true`:
   - Updates `status` state with user data.
   - Clears interval.
   - Closes the modal.
   - Clears `linkData`.
   - Triggers `toast.success("🎉 Liên kết tài khoản Telegram thành công!")`.

---

## 5. Error Handling Protocol

| Status Code | Cause | Frontend Behavior |
|:---|:---|:---|
| **401 Unauthorized** | Missing/expired JWT | Redirects to login or refreshes token via `apiClient` interceptor. |
| **403 Forbidden** | User not a `TEACHER` | Shows permission error toast. |
| **404 Not Found** | Account unlinked check | Gracefully treated as `{ isLinked: false, account: null }`. |
| **409 Conflict** | Already linked | Shows warning toast: *"Tài khoản Giảng viên đã được liên kết..."* and triggers reload. |
| **429 Too Many Requests** | Rate limit (>10 / 15m) | Shows warning: *"Bạn đã tạo mã quá nhiều lần trong 15 phút. Vui lòng thử lại sau."* |
| **Network / 500** | Backend unavailable | Shows error toast with Vietnamese fallback message. |

---

## 6. Component Usage Guide

### Integration in Dedicated Teacher Automation Center (`/teacher/automation`)
```tsx
import { TeacherTelegramCard } from '@/components/teacher/telegram/teacher-telegram-card';

export default function TeacherAutomationPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6 sm:space-y-8">
      {/* 1. Header Banner & Actions */}
      <section>...</section>

      {/* 2. Automation Overview Summary Cards */}
      <section>...</section>

      {/* 3. Telegram Account Connection Card (TG-02B) */}
      <TeacherTelegramCard />

      {/* 4. Automated Report Schedules (TG-05) */}
      <section>...</section>
    </div>
  );
}
```

