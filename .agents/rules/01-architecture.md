# Rule 01: Frontend Architecture Specification

> **Scope**: Cấu trúc ứng dụng, quy chuẩn rendering và phân tầng trách nhiệm cho TMdemy Frontend.  
> **Ưu tiên**: Bắt buộc tuân thủ khi tạo mới hoặc sửa đổi code trong `src/`.

---

## 1. Nền Tảng Công Nghệ & Paradigm (Framework & Paradigm)

- **Framework**: Next.js App Router (sử dụng thư mục `src/app/`).
- **Ngôn ngữ**: TypeScript ở chế độ Strict Mode (`strict: true` trong `tsconfig.json`).
- **Styling**: Tailwind CSS kết hợp cấu trúc token của shadcn/ui.
- **Ranh giới**: Kiến trúc Single-Repo Frontend độc lập, giao tiếp với backend qua HTTP/REST và WebSocket/Socket.IO. Không chứa server-side database drivers.

---

## 2. Quy Chuẩn Rendering: Server-First by Default

- **Mặc định sử dụng React Server Components (RSC)** cho:
  - Layouts (`layout.tsx`) và Pages (`page.tsx`) tĩnh hoặc đọc dữ liệu công khai ban đầu.
  - SEO Metadata (Title, Description, Open Graph tags).
  - Vỏ khung cấu trúc trang và các thành phần không tương tác.
- **Chỉ sử dụng Client Components (`"use client"`) khi thực sự cần thiết**:
  - Có trạng thái giao diện nội bộ (`useState`, `useReducer`).
  - Có hiệu ứng vòng đời hoặc lắng nghe sự kiện trình duyệt (`useEffect`, event listeners, `window`/`document`/`localStorage`).
  - Xử lý tương tác người dùng (Forms, Buttons có handler click phức tạp, Drag & Drop).
  - Kết nối Socket.IO thời gian thực (Chat, Thông báo).
  - Sử dụng Context Providers của React.
- **Nguyên tắc "Đẩy Client Component xuống lá cây" (Push Client Components to the Leaves)**:
  - Không bọc `"use client"` ở toàn bộ page hoặc layout nếu chỉ có một nút bấm hay dropdown bên trong cần interactivity.
  - Tách phần tương tác thành client component nhỏ và nhúng vào RSC cha.

---

## 3. Phân Tách Rõ Ràng Các Tầng Trách Nhiệm (Separation of Concerns)

Codebase phải duy trì sự phân tách rõ rệt giữa 4 tầng:

```text
[ Presentation Layer ]  ──>  src/app/, src/components/, src/features/
         │
[ State & Hook Layer ]  ──>  src/hooks/, src/context/ (Local UI, Auth, Socket)
         │
[ Service & API Layer]  ──>  src/services/, src/lib/api/ (Endpoints, Axios/Fetch Client)
         │
[ Utility & Type Layer] ──>  src/lib/utils.ts, src/types/ (Helpers, Data Contracts)
```

1. **Presentation Layer (Giao diện)**:
   - Chỉ chịu trách nhiệm hiển thị dữ liệu và tiếp nhận tương tác.
   - Không nhúng logic gọi API trực tiếp với `fetch` URL hardcode trong JSX/Component.
2. **Service Layer (Dịch vụ mạng)**:
   - Đóng gói logic gọi REST API trong các file dịch vụ chuyên biệt (`*.service.ts`).
   - Sử dụng Centralized API Client (`src/lib/api/client.ts`) để tận dụng auto-attach token và interceptor xử lý lỗi.
3. **State Management Layer (Trạng thái)**:
   - Phân biệt rõ giữa Server State (dữ liệu từ API), Auth State (user identity), và Local State (modal toggle, tab active).
   - Không lạm dụng global state cho những tương tác cục bộ của từng component.
4. **Types & Utilities Layer**:
   - Mọi cấu trúc dữ liệu trao đổi qua API phải có kiểu dữ liệu TypeScript tương ứng trong `src/types/`.
   - Các hàm định dạng tiền tệ, ngày tháng, helper xử lý chuỗi phải tập trung tại `src/lib/`.

---

## 4. Tái Sử Dụng Patterns và Components (Reuse Existing Assets)

- Trước khi viết mới, phải khảo sát:
  - `src/components/ui/` (shadcn primitives: button, dialog, dropdown, input, table,...).
  - `src/components/common/` (Header, Footer, Navbar, Logo,...).
  - `src/components/feedback/` (EmptyState, ErrorState, LoadingSkeleton,...).
- Mở rộng (extend) hoặc composition từ component có sẵn thay vì copy-paste hoặc viết lại từ đầu.

---

## 5. Ranh Giới Bất Biến Về Kiến Trúc (Architectural Invariants)

- **Tuyệt đối KHÔNG**:
  - Đổi từ App Router sang Pages Router.
  - Tự ý thay thế Tailwind CSS bằng CSS-in-JS (styled-components, emotion) hoặc Tailwind phiên bản không tương thích.
  - Cài đặt thêm các giải pháp state management cồng kềnh (Redux, MobX) khi chưa được phê duyệt.
  - Tạo trực tiếp các kết nối cơ sở dữ liệu (`pg`, `prisma`, `mongoose`) trong thư mục `src/app/api/` hoặc Server Actions. Frontend chỉ đóng vai trò Consumer của Backend TMDEMY.
