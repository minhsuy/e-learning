---
name: api-integration
description: Kết nối TMdemy Frontend với Backend REST API dựa trên Source of Truth trong api/, sử dụng API Client tập trung và xử lý triệt để loading/error states.
---

# Skill: API Integration

## 1. Khi Nào Sử Dụng (When to Use)

- Khi cần gọi REST API từ Backend TMdemy để lấy dữ liệu (query) hoặc thực hiện thay đổi dữ liệu (mutation).
- Khi tạo mới hoặc cập nhật service layer (`src/services/`) và types dữ liệu (`src/types/`).

---

## 2. Quy Trình Thực Thi (Step-by-Step Workflow)

```text
Read api/ Contract (Source of Truth)
       ↓
Identify Endpoint & Capabilities
       ↓
Verify Method / Auth / Request / Response
       ↓
Identify or Create Frontend TypeScript Types
       ↓
Use Existing API Client & Service Layer
       ↓
Implement Component Integration / Hooks
       ↓
Handle Loading, Error & Empty States
       ↓
Validate Against Contract
```

### Bước 1: Đọc Hợp Đồng API (Read `api/` Contract)
- Mở và tra cứu file đặc tả tương ứng trong thư mục `api/` (tham chiếu mục lục tại `api/API_INDEX.md`).
- **Nghiêm cấm đoán mò**: URL endpoint, HTTP method, header và query parameter phải khớp 100% với tài liệu.

### Bước 2: Xác Định Năng Lực & Ranh Giới (Identify Endpoint)
- Kiểm tra tính xác thực:
  - Endpoint có yêu cầu Bearer JWT Token không?
  - Quyền hạn (Roles) yêu cầu là gì: Public, `user`, `teacher`, hay `admin`?
- **Nếu endpoint chưa tồn tại hoặc tài liệu thiếu sót nghiêm trọng**:
  - DỪNG LẠI và kích hoạt giao thức:
    ```markdown
    [BACKEND GAP]
    - Năng lực cần thiết: ...
    - Endpoint / Phương thức mong đợi: ...
    - Lý do Frontend cần: ...
    - Giải pháp hiển thị tạm thời ở UI: ...
    ```
  - **Tuyệt đối không tự bịa đặt endpoint và không mock dữ liệu để giả vờ feature đã hoàn chỉnh**.

### Bước 3: Định Nghĩa Kiểu Dữ Liệu TypeScript (TypeScript Types)
- Kiểm tra các file types trong `src/types/`. Nếu chưa có, tạo interface/type mô tả chính xác:
  - Request DTO (Body hoặc Query Params).
  - Response Data: Bọc trong cấu trúc chuẩn của backend `ApiResponse<T>` (`{ success: boolean, data: T, message?: string }`).
- Tuyệt đối không dùng `any`. Sử dụng kiểu dữ liệu rõ ràng, khớp với các Enum trong `api/API_ENUM_REFERENCE.md`.

### Bước 4: Tận Dụng API Client Tập Trung (Use Centralized API Client)
- Không gọi `fetch()` hay `axios()` rời rạc trong component.
- Đóng gói logic trong file dịch vụ tương ứng tại `src/services/` (ví dụ: `course.service.ts`, `auth.service.ts`).
- Sử dụng API client chung (`src/lib/api/client.ts`) để được hưởng:
  - Tự động gắn token `Authorization: Bearer <token>`.
  - Tự động bắt lỗi 401 và kích hoạt luồng làm mới Access Token bằng Refresh Token.
  - Chuẩn hóa thông báo lỗi trả về.

### Bước 5: Tích Hợp Vào UI / Hooks (Implement Integration)
- Tích hợp gọi service thông qua React custom hooks hoặc useEffect/Server Actions phù hợp.
- Quản lý trạng thái:
  - Trạng thái đang tải: `isLoading = true`.
  - Trạng thái lỗi: `error` (bắt từ `response.data.message` hoặc network error).
  - Trạng thái thành công: Cập nhật state hoặc invalidate cache.

### Bước 6: Xử Lý Đầy Đủ Các Trạng Thái Phản Hồi (Handle States)
- **Loading**: Hiển thị Skeleton loading, disable nút submit để tránh click đúp.
- **Error**: Hiển thị thông báo lỗi thân thiện (Toast hoặc Alert Banner), hỗ trợ nút "Thử lại".
- **Empty**: Hiển thị Empty state nếu mảng kết quả trả về `[]`.
- **Success**: Kích hoạt thông báo thành công và chuyển hướng hoặc cập nhật giao diện ngay lập tức.

### Bước 7: Xác Thực Thực Tế (Validate Integration)
- Kiểm tra lại network request:
  - Đúng URL (bao gồm prefix `/api/...`).
  - Đúng method (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`).
  - Đúng Content-Type (`application/json` hoặc `multipart/form-data`).

---

## 3. Ranh Giới & Điều Cấm (Boundaries & Constraints)

- ❌ **Không can thiệp Backend**: Không mở file hay sửa code trong `d:/e-learning_server`.
- ❌ **Không truy cập DB trực tiếp**: Không import Prisma, Mongoose, PostgreSQL driver.
- ❌ **Không mock để giả vờ hoạt động**: Nếu không có API, giữ trạng thái thông báo rõ ràng cho người dùng thay vì dùng mock data vĩnh viễn.

---

## 4. Kết Hợp Kỹ Năng (Composition)

- `page-implementation` + **`api-integration`**: Khi một trang cần fetch và hiển thị dữ liệu từ máy chủ.
- `auth-integration` + **`api-integration`**: Khi gọi các endpoint nhạy cảm yêu cầu bảo vệ phân quyền và quản lý token.
