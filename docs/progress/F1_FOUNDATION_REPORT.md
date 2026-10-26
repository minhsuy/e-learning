# F1 — Project Foundation Report

## Status

COMPLETED

## Project

TMDEMY Frontend

## Workspace

d:/e-learning

## Framework

Next.js 16.3.8 (App Router)

## React

React 19.2.8 / React DOM 19.2.8

## TypeScript

TypeScript 5.x (Strict mode enabled)

## Installed Dependencies

### Production Dependencies
- `next`: 16.3.8
- `react`: 19.2.8
- `react-dom`: 19.2.8
- `@base-ui/react`: ^1.8.0
- `class-variance-authority`: ^0.7.1
- `clsx`: (via `cn` ^0.4.0)
- `lucide-react`: ^1.52.0
- `tw-animate-css`: ^1.4.0

### Development Dependencies
- `tailwindcss`: ^4.0.0
- `@tailwindcss/postcss`: ^4.0.0
- `typescript`: ^5.0.0
- `eslint`: ^9.0.0
- `eslint-config-next`: 16.3.8
- `@types/node`: ^20.0.0
- `@types/react`: ^19.0.0
- `@types/react-dom`: ^19.0.0

## Project Structure

```text
d:/e-learning/
├── .agents/                               # Workspace agent rules & configuration
├── api/                                   # 29 API Contract Source of Truth files
├── docs/                                  # Project Brain Architecture & Guides
│   └── progress/
│       └── F1_FOUNDATION_REPORT.md        # Báo cáo tiến độ F1
├── public/                                # Static assets
├── src/
│   ├── app/
│   │   ├── globals.css                    # Tailwind v4 & shadcn theme tokens
│   │   ├── layout.tsx                     # Root Layout với font Inter & TMDEMY metadata
│   │   └── page.tsx                       # Root Page hiển thị trạng thái khởi tạo F1
│   ├── components/
│   │   └── ui/
│   │       └── button.tsx                 # Button component từ shadcn/ui
│   ├── lib/
│   │   ├── api/
│   │   │   ├── client.ts                  # Central API Client (Native fetch, 401 refresh, error normalization)
│   │   │   └── token.ts                   # SSR-safe Token Storage Helper
│   │   └── utils.ts                       # Helper cn() từ shadcn
│   └── types/
│       └── api.ts                         # Core API types (ApiResponse, AppApiError, UserRole)
├── .env.example                           # Mẫu cấu hình môi trường
├── .env.local                             # Cấu hình môi trường cục bộ
├── .gitignore
├── AGENTS.md                              # AI Coding Agent Rules cốt lõi
├── components.json                        # Cấu hình shadcn/ui
├── eslint.config.mjs                      # Cấu hình ESLint 9 flat config
├── next.config.ts                         # Cấu hình Next.js
├── package.json                           # Khai báo dependencies & scripts
├── postcss.config.mjs                     # Cấu hình PostCSS với @tailwindcss/postcss
└── tsconfig.json                          # Cấu hình TypeScript Strict
```

## Environment

Đã thiết lập biến môi trường trỏ tới Backend TMDEMY:
- `.env.local`: `NEXT_PUBLIC_API_URL=http://localhost:3002`
- `.env.example`: `NEXT_PUBLIC_API_URL=http://localhost:3002`
- Không commit secret, không cấu hình `DATABASE_URL` hay Prisma trong frontend.

## API Client

Đã xây dựng tại `src/lib/api/client.ts` sử dụng native `fetch`:
- **Base URL**: Tự động lấy từ `process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'`.
- **Tự động gắn Authorization**: Tự động đính kèm `Authorization: Bearer <TOKEN>` từ `getAccessToken()`.
- **Chuẩn hóa lỗi tập trung (Error Normalization)**:
  - Bắt trọn 3 định dạng lỗi của backend (`{ error: string }`, `{ message: string }`, `{ errors: Record<string, string> }`).
  - Đóng gói thành class `AppApiError` thống nhất.
- **Cơ chế xử lý 401 & Auto-refresh**:
  - Tự động bắt lỗi 401 có chuỗi `"jwt expired"`.
  - Có mutex lock (`isRefreshing`) và hàng đợi request (`refreshSubscribers`) để chống spam nhiều request refresh cùng lúc.
  - Tự động gọi `POST /api/users/access_token` với body `{ refresh_token }`.
  - Cập nhật access token mới và retry request ban đầu.
- **API Methods**: `apiClient.get()`, `apiClient.post()`, `apiClient.put()`, `apiClient.patch()`, `apiClient.delete()`.

## Authentication Infrastructure

- `src/lib/api/token.ts`: Hỗ trợ lưu trữ và lấy Access Token, Refresh Token an toàn ở phía client (SSR-safe).
- `src/types/api.ts`: Khai báo kiểu `UserRole` (`'user' | 'teacher' | 'admin'`).

## UI Foundation

- Cài đặt Tailwind CSS v4 với `@tailwindcss/postcss`.
- Cấu hình shadcn/ui thông qua `components.json` và CSS variables chuẩn HSL/oklch trong `src/app/globals.css`.
- Đã cài đặt primitive UI component nền tảng: `src/components/ui/button.tsx`.

## Root Layout

- `src/app/layout.tsx`:
  - Metadata: Title `"TMDEMY — Nền Tảng Học Trực Tuyến & Sàn Khóa Học"`, description chuẩn SEO.
  - Font: `Inter` từ `next/font/google` tối ưu hiệu năng.
  - Hỗ trợ ngôn ngữ tiếng Việt (`lang="vi"`).

## Root Page

- `src/app/page.tsx`:
  - Hiển thị thông báo trạng thái "Frontend initialized successfully".
  - Giới thiệu danh tính dự án TMDEMY E-Learning.
  - Sử dụng component `Button` từ shadcn/ui để xác thực hoạt động của theme & UI primitives.

## API Connectivity Test

- **Target Endpoint**: `GET http://localhost:3002/api/categories/`
- **Kết quả**: `BLOCKED`
- **Lý do**: Máy chủ Backend (`http://localhost:3002`) hiện chưa lắng nghe trên cổng 3002 (Connection refused / Fetch failed).
- **Hành động tuân thủ**: Không sửa Backend, không tạo API mock giả, ghi nhận đúng thực trạng.

## Validation

### npm run lint
- **Kết quả**: `PASS` (0 errors, 0 warnings).

### npx tsc --noEmit
- **Kết quả**: `PASS` (TypeScript strict mode, 0 errors).

### npm run build
- **Kết quả**: `PASS` (Build production thành công 100% với Next.js Turbopack).

## Files Created

- `.env.local`
- `.env.example`
- `components.json`
- `src/types/api.ts`
- `src/lib/api/token.ts`
- `src/lib/api/client.ts`
- `src/components/ui/button.tsx`
- `docs/progress/F1_FOUNDATION_REPORT.md`

## Files Modified

- `package.json` (Đổi project name sang `tmdemy-frontend`)
- `src/app/globals.css` (Tích hợp shadcn design tokens)
- `src/app/layout.tsx` (TMDEMY metadata & Inter font)
- `src/app/page.tsx` (F1 Foundation status verification page)

## Packages Added

- `next`: 16.3.8
- `react`: 19.2.8
- `react-dom`: 19.2.8
- `@base-ui/react`: ^1.8.0
- `class-variance-authority`: ^0.7.1
- `cn`: ^0.4.0
- `lucide-react`: ^1.52.0
- `tw-animate-css`: ^1.4.0
- `shadcn`: ^4.21.1
- `tailwindcss`: ^4.0.0
- `@tailwindcss/postcss`: ^4.0.0
- `typescript`: ^5.0.0
- `eslint`: ^9.0.0
- `eslint-config-next`: 16.3.8

## Packages Not Added

- Không cài Axios (sử dụng native `fetch` theo architecture).
- Không cài Redux, Zustand, React Query, SWR, Socket.IO client, Framer Motion, AI SDK (chưa thuộc phạm vi F1).

## Backend Changes

NONE

## API Contract Changes

NONE

## Known Issues

- Backend server chưa chạy trên cổng 3002 tại thời điểm kiểm tra connectivity.

## Unresolved Questions

None.

## Scope Completed

- [x] Khởi tạo Next.js App Router với TypeScript, Tailwind CSS, ESLint.
- [x] Thiết lập shadcn/ui foundation & Button component.
- [x] Thiết lập cấu hình môi trường `.env.local` và `.env.example`.
- [x] Xây dựng Central API Client với native fetch, Bearer token, auto-refresh 401 và error normalizer.
- [x] Xây dựng Root Layout và Root Page tối thiểu.
- [x] Kiểm tra linting, typechecking và production build thành công 100%.

## Scope Not Implemented

- Chưa triển khai các màn hình Authentication UI (Login, Register, OTP,...).
- Chưa triển khai Public Course features (Listing, Detail, Search,...).
- Chưa triển khai Student/Teacher/Admin Dashboards.
- Chưa kết nối Socket.IO realtime.

## Ready for F2

YES
