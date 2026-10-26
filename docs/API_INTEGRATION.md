# TMDEMY — API INTEGRATION SPECIFICATION

> **Tài liệu hướng dẫn tích hợp REST API và Socket.IO cho Frontend TMDEMY.**  
> *Được biên soạn dựa trên 96 REST endpoints và hệ thống sự kiện thời gian thực đã hoạt động trong Backend.*

---

## 1. Nguồn Dữ liệu Chuẩn (Source of Truth)

Toàn bộ thông tin chi tiết về từng Endpoint, Tham số (Parameters), Body, Headers và Ví dụ phản hồi (Responses) đều được lưu trữ đầy đủ tại thư mục gốc:

👉 **Thư mục tài liệu API Backend**: [`api/`](file:///d:/e-learning/api/)  
👉 **Mục lục toàn diện 96 Endpoints**: [`api/API_INDEX.md`](file:///d:/e-learning/api/API_INDEX.md)  
👉 **Bảng quy chuẩn Danh mục Enum**: [`api/API_ENUM_REFERENCE.md`](file:///d:/e-learning/api/API_ENUM_REFERENCE.md)  
👉 **Quy trình Xác thực & Phân quyền**: [`api/AUTH_FLOW.md`](file:///d:/e-learning/api/AUTH_FLOW.md)

> [!CAUTION]
> **Nguyên tắc bất biến**: Frontend KHÔNG được tự ý suy đoán endpoint hay thay đổi HTTP method. Phải đối chiếu trực tiếp với các file trong thư mục `api/`.

---

## 2. Cấu hình Môi trường & Base URL

Tất cả các lời gọi mạng được định tuyến qua biến môi trường của Next.js:

```env
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3002
NEXT_PUBLIC_SOCKET_URL=http://localhost:3002
```

- **Base URL mặc định**: `http://localhost:3002`
- **Tiền tố API**: Các API đều có tiền tố `/api/...` (Ví dụ: `/api/users/login`, `/api/courses/`, `/api/teacher/courses/`).

---

## 3. Cấu trúc Tầng Gọi API (API Service Architecture)

Thay vì gọi trực tiếp `fetch()` hoặc `axios()` trong component, ứng dụng sử dụng cấu trúc phân tầng:

```text
UI Component / Hook
       │
       ▼
Service Layer (src/services/*.service.ts)
  - auth.service.ts
  - course.service.ts
  - teacher-stats.service.ts
       │
       ▼
Centralized API Client (src/lib/api/client.ts)
  - Interceptors: Gắn Bearer Token
  - Auto Refresh: Tự động gọi /api/users/access_token khi 401
  - Normalization: Chuẩn hóa error message
       │
       ▼
Backend Express Server (http://localhost:3002)
```

---

## 4. Định dạng Header & Xác thực (Authentication Header)

Mọi request yêu cầu xác thực bắt buộc phải truyền Access Token qua header `Authorization`:

```http
Authorization: Bearer <ACCESS_TOKEN>
Content-Type: application/json
```

---

## 5. Quy chuẩn Phản hồi & Xử lý Lỗi (Response & Error Handling)

### 5.1. Cấu trúc Phản hồi Thành công (Success Response)
Hầu hết các endpoint của Backend trả về định dạng JSON theo khuôn mẫu:
```typescript
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}
```

*Lưu ý*: Một số endpoint đặc thù trả về trực tiếp thuộc tính dữ liệu ở cấp gốc (Root level), ví dụ:
- Đăng nhập: `{ success: true, access_token: "...", refresh_token: "...", message: "..." }`
- Lấy danh sách khóa học: `{ success: true, courses: [...], totalCourses: 20 }`

### 5.2. Cấu trúc Phản hồi Lỗi (Error Response)
Backend trả về lỗi theo một trong 3 định dạng sau:
1. **Lỗi dạng thông điệp chuỗi**:
   ```json
   { "success": false, "error": "Access Token is missing!" }
   ```
2. **Lỗi dạng tin nhắn message**:
   ```json
   { "success": false, "message": "Incorrect password" }
   ```
3. **Lỗi kiểm tra tính hợp lệ dữ liệu (Validation Errors)**:
   ```json
   {
     "errors": {
       "email": "Email không tồn tại",
       "password": "Mật khẩu phải từ 6 ký tự"
     }
   }
   ```

### 5.3. Bộ Chuẩn hóa Lỗi Tập trung (Error Normalizer)
Trong `src/lib/api/client.ts`, mọi lỗi trả về từ API đều được đóng gói lại thành `AppApiError`:
```typescript
export interface AppApiError {
  statusCode: number;
  message: string;
  validationErrors?: Record<string, string>;
}
```
Giúp UI chỉ cần kiểm tra `err.message` hoặc `err.validationErrors` một cách đồng bộ.

---

## 6. Cơ chế Tự động Làm mới Token (Auto-Refresh on 401)

Khi token hết hạn, backend trả về `401 Unauthorized` với mã thông báo `jwt expired`. Interceptor của Frontend sẽ tự động thực hiện:

```text
HTTP Request ───> 401 (jwt expired)
                      │
                      ▼
         Đưa request vào Queue chờ
                      │
                      ▼
        POST /api/users/access_token
        Body: { refresh_token: "<REFRESH_TOKEN>" }
                      │
          ┌───────────┴───────────┐
          ▼                       ▼
       Thành công               Thất bại
          │                       │
Cập nhật new Access Token         Xóa sạch Token
Thực thi lại các request trong    Đăng xuất (Logout)
Queue với Token mới               Chuyển hướng về /login
```

> [!NOTE]
> Sử dụng Mutex / Cờ `isRefreshing` để đảm bảo khi có nhiều request đồng thời bị lỗi 401, hệ thống chỉ gửi **DUY NHẤT MỘT** request refresh token lên backend.

---

## 7. Quy chuẩn Phân trang & Tìm kiếm (Pagination & Query Params)

Các API danh sách hỗ trợ tham số phân trang chuẩn:
- `page`: Số trang hiện tại (bắt đầu từ `1`).
- `limit`: Số bản ghi trên mỗi trang (mặc định: `10` hoặc `20`).
- `search`: Từ khóa tìm kiếm theo tên hoặc mô tả.
- `category`: Lọc theo danh mục.
- `level`: Lọc theo trình độ (`beginner`, `intermediate`, `advanced`).
- `type`: Lọc theo loại khóa học (`paid`, `free`).

---

## 8. Tích hợp Realtime với Socket.IO

Backend sử dụng thư viện Socket.IO để phục vụ tính năng Chat và Thông báo tức thời.

### 8.1. Khởi tạo Kết nối
```typescript
import { io, Socket } from 'socket.io-client';

const socket: Socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3002', {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  auth: {
    token: accessToken // Truyền Access Token khi kết nối
  }
});
```

### 8.2. Các Sự kiện Realtime Chính
| Phân hệ | Event Name | Chiều tương tác | Dữ liệu / Mô tả |
| :--- | :--- | :---: | :--- |
| **Chat** | `sendMessage` | Client -> Server | Gửi tin nhắn mới tới cuộc hội thoại |
| **Chat** | `newMessage` | Server -> Client | Lắng nghe tin nhắn mới nhận được |
| **Chat** | `messageRead` | Server <-> Client | Cập nhật trạng thái đã đọc tin nhắn |
| **Notification** | `notification` | Server -> Client | Nhận thông báo hệ thống mới tức thời |

---

## 9. Quy trình Xử lý Khoảng trống Backend (Backend Gap Policy)

Nếu trong quá trình phát triển Frontend phát sinh nhu cầu giao diện mà Backend hiện tại chưa hỗ trợ API phù hợp:

1. **Tuyệt đối KHÔNG tự ý chỉnh sửa mã nguồn Backend** (vì backend đã cố định và đang chạy độc lập).
2. **Tuyệt đối KHÔNG tự tạo API giả lập (mock data cứng) vĩnh viễn** che giấu vấn đề.
3. **Lập biên bản BACKEND GAP** với mẫu định dạng:
   ```markdown
   ### [BACKEND GAP] Tiêu đề yêu cầu
   - **Màn hình cần dùng**: (Ví dụ: Trang Lịch sử làm Quiz của Học viên)
   - **Yêu cầu UI**: Cần lấy danh sách các lần nộp bài quiz của học viên hiện tại.
   - **Hạn chế của API hiện tại**: API `GET /api/quiz-submissions/user` chưa hỗ trợ lọc theo khóa học.
   - **Đề xuất điều chỉnh Backend**: Thêm query param `?courseId=...` vào endpoint.
   - **Hành động tức thời**: Tạm dừng màn hình hoặc sử dụng fallback tối thiểu đã được người dùng đồng thuận.
   ```
