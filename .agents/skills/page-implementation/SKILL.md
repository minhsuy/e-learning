---
name: page-implementation
description: Xây dựng hoặc hoàn thiện một trang/route trong Next.js App Router cho TMdemy Frontend, kết hợp cấu trúc Server/Client Component và tái sử dụng components sẵn có.
---

# Skill: Page Implementation

## 1. Khi Nào Sử Dụng (When to Use)

- Khi được giao xây dựng trang mới hoặc hoàn thiện một trang/route hiện có trong thư mục `src/app/`.
- Khi cần lắp ráp các components giao diện, tích hợp layout và kết nối luồng dữ liệu cho một tuyến đường cụ thể.

---

## 2. Quy Trình Thực Thi (Step-by-Step Workflow)

```text
Clarify Requirements & Target Route
       ↓
Inspect Existing Route & Layout Hierarchy
       ↓
Inspect Related Components & Features
       ↓
Inspect Stitch Reference (if applicable)
       ↓
Identify API Requirements & Data Flow
       ↓
Implement Page (Server / Client Structure)
       ↓
Apply Responsive Layout
       ↓
Implement 6 UX States
       ↓
Validate Route & Experience
```

### Bước 1: Làm Rõ Yêu Cầu & Tuyến Đường (Requirements & Route)
- Xác định route đích trong App Router (ví dụ: `src/app/(public)/courses/[slug]/page.tsx`, `src/app/(student)/my-courses/page.tsx`).
- Xác định đối tượng người dùng: Public, Học viên, Giảng viên, hay Admin.

### Bước 2: Khảo Sát Bố Cục Hiện Có (Inspect Existing Route & Layout)
- Kiểm tra file `layout.tsx` của nhóm route tương ứng xem đã cung cấp Header, Sidebar, hay Provider nào.
- Tránh render trùng lặp Header/Footer nếu Layout cha đã bao bọc.

### Bước 3: Khảo Sát & Tái Sử Dụng Components (Inspect Components)
- Khảo sát các components liên quan trong `src/components/` và `src/features/`.
- Tận dụng tối đa các thành phần đã xây dựng thay vì viết lại từ đầu.

### Bước 4: Khảo Sát Mẫu Thiết Kế Stitch (Stitch Reference)
- Nếu trang có trong thiết kế Stitch, tham khảo màn hình tương ứng để đảm bảo tính đồng nhất về visual language và bố cục.

### Bước 5: Xác Định Yêu Cầu API (Identify API Requirements)
- Rà soát các endpoint cần thiết trong `api/API_INDEX.md`.
- Nếu trang cần dữ liệu chưa có API: Khai báo `[BACKEND GAP]` và chuẩn bị giao diện fallback rõ ràng.

### Bước 6: Triển Khai Mã Nguồn Trang (Implement Page)
- **Cấu trúc Server / Client Component**:
  - Giữ `page.tsx` là Server Component (RSC) nếu có thể để xử lý SEO metadata và khung tĩnh.
  - Tách các khối giao diện có state/event thành Client Components con trong `src/features/<domain>/` hoặc `src/components/`.
- Áp dụng SEO metadata chuẩn (`title`, `description`) cho trang.

### Bước 7: Tối Ưu Thích Ứng (Responsive Layout)
- Đảm bảo trang hiển thị mượt mà trên Mobile ($< 768px$), Tablet ($768px - 1023px$), và Desktop ($\ge 1024px$).

### Bước 8: Bao Quát 6 Trạng Thái UX (UX States)
- Cung cấp file `loading.tsx` hoặc Skeleton loader trong trang.
- Xử lý các tình huống rỗng (Empty), lỗi mạng (Error), và phản hồi sau khi tương tác.

### Bước 9: Xác Thực Tuyến Đường (Validation)
- Kiểm tra điều hướng: Link qua lại giữa các trang hoạt động chính xác.
- Đảm bảo không xảy ra hiện tượng layout shift (CLS) đột ngột.

---

## 3. Ranh Giới & Điều Cấm (Boundaries & Constraints)

- ❌ **Không tự ý refactor trang khác**: Chỉ tập trung vào trang được phân công, không tiện tay sửa các page/layout không liên quan.
- ❌ **Không phá vỡ cấu trúc Route Groups**: Tôn trọng các nhóm route `(auth)`, `(public)`, `(student)`, `(teacher)`, `(admin)`.
- ❌ **Không bỏ qua xử lý lỗi và loading**: Mọi trang đều phải có phương án dự phòng khi dữ liệu chưa tải xong hoặc gặp lỗi mạng.

---

## 4. Kết Hợp Kỹ Năng (Composition)

- **`page-implementation`** + `stitch-ui`: Cắt và ráp giao diện trang theo thiết kế Stitch.
- **`page-implementation`** + `api-integration`: Kết nối dữ liệu REST API thực tế vào trang.
- **`page-implementation`** + `auth-integration`: Bảo vệ tuyến đường theo trạng thái đăng nhập và vai trò người dùng.
