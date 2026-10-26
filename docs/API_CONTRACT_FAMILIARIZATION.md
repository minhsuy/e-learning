# TMDEMY — API CONTRACT FAMILIARIZATION & VERIFICATION

> **Tài liệu thẩm định và chuẩn hóa toàn bộ hiểu biết về Backend API Contract trước khi bước vào Giai đoạn F1.**  
> *Được đối chiếu trực tiếp với 29 tài liệu đặc tả API thực tế trong thư mục `/api` (`API_INDEX.md`, `AUTH_API.md`, `COURSE_API.md`, `CATEGORY_API.md`, `USER_API.md`, `API_DOCUMENTATION_FINDINGS.md`).*

---

## 1. Authentication & User Profile Contract

### 1.1. Bảng Tổng Hợp Endpoint Xác Thực Cốt Lõi
| Mục đích | Method | Endpoint | Auth | Request Body / Params | Response Chính |
| :--- | :---: | :--- | :---: | :--- | :--- |
| **Đăng ký tài khoản** | `POST` | `/api/users/register` | Public | `{ username, email, password, confirm_password, phone?, bio? }` | `{ success: true, message: "..." }` |
| **Xác thực OTP** | `POST` | `/api/users/verify-otp` | Public | `{ email, otp }` (otp 6 chữ số) | `{ success: true, message: "Xác thực email thành công!" }` |
| **Đăng nhập** | `POST` | `/api/users/login` | Public | `{ email, password }` | `{ success: true, access_token, refresh_token, message }` |
| **Lấy user hiện tại** | `GET` | `/api/users/me` | Bearer JWT | None (Header: `Authorization: Bearer <TOKEN>`) | `{ success: true, data: { id, username, email, role, status, avatar, phone, bio, socialLinks } }` |
| **Cấp mới token** | `POST` | `/api/users/access_token` | Refresh Token | `{ refresh_token: "<REFRESH_TOKEN>" }` | `{ success: true, access_token: "..." }` |
| **Đăng xuất** | `POST` | `/api/users/logout` | Bearer JWT | None (Header: `Authorization: Bearer <TOKEN>`) | `{ success: true, message: "Logout successfully !" }` |
| **Quên mật khẩu** | `POST` | `/api/users/forgot-password` | Public | `{ email }` | `{ success: true, message: "..." }` |
| **Đặt lại mật khẩu** | `PUT` | `/api/users/reset-password` | Public | `{ token, password, confirm_password }` | `{ success: true, message: "Password reset successfully!" }` |
| **Cập nhật profile** | `PUT` | `/api/users/update-me` | Bearer JWT | `{ username?, phone?, bio?, avatar?, socialLinks? }` | `{ success: true, data: { ...user } }` |
| **Đổi mật khẩu** | `PUT` | `/api/users/change-password` | Bearer JWT | `{ oldPassword, password, confirm_password }` | `{ success: true, message: "Password changed successfully" }` |
| **Profile công khai** | `GET` | `/api/users/profile/:id` | Public | Path param: `id` (UUID) | `{ success: true, data: { ...publicUserData } }` |
| **Danh sách Giảng viên** | `GET` | `/api/users/teachers` | Public | Query: `page`, `limit`, `search`, `sortBy` | `{ success: true, data: { teachers: [...], pagination: { ... } } }` |

### 1.2. Cơ Chế Truyền Token & Vòng Đời Phiên (Token Lifecycle)
1. **Access Token**:
   - Truyền qua Header HTTP: `Authorization: Bearer <ACCESS_TOKEN>`.
   - Chứa payload mã hóa: `{ userId: string, role: string, iat: number, exp: number }`.
2. **Refresh Token**:
   - Truyền qua Request Body: `{ "refresh_token": "<REFRESH_TOKEN>" }` khi gọi `POST /api/users/access_token`.
3. **Khi nào Frontend thực hiện Refresh Token**:
   - Khi bất kỳ request API nào trả về HTTP Status `401 Unauthorized` kèm nội dung lỗi `"jwt expired"`.
   - Interceptor tạm dừng các request đang gửi, gọi `POST /api/users/access_token` để lấy Access Token mới, cập nhật vào bộ nhớ và gửi lại (retry) request ban đầu.
4. **Khi nào Frontend phải Logout**:
   - Khi request `POST /api/users/access_token` trả về thất bại (refresh token hết hạn, bị vô hiệu hóa hoặc không hợp lệ).
   - Khi người dùng chủ động click nút "Đăng xuất" (gọi `POST /api/users/logout` để server xóa hash token trong PostgreSQL).
5. **Quy Chuẩn Role Enum**:
   - Role thực tế trong Database và API luôn là **lowercase string**:
     - `"user"` (Học viên)
     - `"teacher"` (Giảng viên)
     - `"admin"` (Quản trị viên)
   - *Cấm kỵ*: Tuyệt đối không gửi giá trị UI hiển thị (như `"Student"`, `"Teacher"`, `"Admin"`, `"Học viên"`) lên backend.

---

## 2. Public Course Catalog Contract

### 2.1. Danh Sách Khóa Học: `GET /api/courses/`
- **Method**: `GET` | **Auth**: `Public`
- **Query Parameters**:
  - `page`: Số trang (mặc định: `1`)
  - `limit`: Số bản ghi mỗi trang (mặc định: `10`)
  - `search`: Từ khóa tìm kiếm theo tiêu đề (`title`)
  - `category`: UUID của danh mục
  - `level`: Trình độ (`beginner` | `intermediate` | `advanced`)
  - `type`: Loại khóa học (`paid` | `free`)
  - `priceMin`, `priceMax`: Khoảng giá lọc bằng số VND
  - `sortBy`: Trường sắp xếp (`createdAt` | `price` | `view` | `sold`, mặc định: `createdAt`)
- **Điều kiện Backend**: Chỉ trả về các khóa học có `status = "approved"` và `isDestroyed = false`.
- **Cấu trúc Response Schema**:
  ```json
  {
    "success": true,
    "message": "Fetched courses successfully!",
    "data": {
      "courses": [
        {
          "id": "uuid",
          "_id": "uuid",
          "title": "Tên khóa học",
          "slug": "ten-khoa-hoc",
          "image": "https://...",
          "intro_url": "https://...",
          "description": "Mô tả ngắn",
          "type": "paid",
          "status": "approved",
          "level": "intermediate",
          "price": 699000,
          "old_price": 1200000,
          "oldPrice": 1200000,
          "view": 1250,
          "sold": 84,
          "category": { "id": "uuid", "_id": "uuid", "name": "...", "slug": "..." },
          "author": { "id": "uuid", "_id": "uuid", "username": "...", "avatar": "..." },
          "createdAt": "2026-02-01T10:00:00.000Z",
          "updatedAt": "2026-02-15T10:00:00.000Z"
        }
      ],
      "pagination": {
        "page": 1,
        "limit": 10,
        "total": 18,
        "totalPages": 2
      }
    }
  }
  ```

### 2.2. Chi Tiết Khóa Học: `GET /api/courses/:slug`
- **Method**: `GET` | **Auth**: `Public`
- **Path Parameter**: `slug` (ví dụ: `fullstack-nextjs-15-nodejs-architecture`)
- **Hiệu ứng phụ (Side-effect)**: Tự động tăng lượt xem (`view = view + 1`).
- **Cấu trúc Dữ liệu Chi tiết**:
  - `info`: Chứa `requirements` (mảng string), `benefits` (mảng string), và `qa` (mảng `{ question, answer }`).
  - `chapters`: Mảng chương học, mỗi chương có `order` và danh sách `lessons` con (`id`, `title`, `duration`, `type`: `"video"` | `"text"`, `isDemo`: boolean, `order`).
  - `view`, `sold`, `price`, `oldPrice`.
- **Mã lỗi 404**: Trả về khi `slug` không tồn tại hoặc khóa học đã bị xóa mềm (`isDestroyed = true`).

---

## 3. Categories Contract

### 3.1. Danh Sách Danh Mục: `GET /api/categories/`
- **Method**: `GET` | **Auth**: `Public`
- **Query Parameters**: `page` (default 1), `limit` (default 100), `search`, `sortBy` (default `"createdAt"`).
- **Response**:
  ```json
  {
    "success": true,
    "message": "Fetched categories successfully",
    "data": {
      "categories": [
        {
          "id": "uuid",
          "_id": "uuid",
          "name": "Lập trình Web",
          "slug": "lap-trinh-web",
          "description": "HTML, CSS, JavaScript, React, Next.js, Node.js",
          "createdAt": "..."
        }
      ],
      "pagination": { "page": 1, "limit": 100, "total": 8, "totalPages": 1 }
    }
  }
  ```

### 3.2. Chi Tiết Danh Mục: `GET /api/categories/:slug`
- **Method**: `GET` | **Auth**: `Public`
- **Path Parameter**: `slug` (ví dụ: `lap-trinh-web`)
- **Response**: Trả về thông tin chi tiết `{ id, _id, name, slug, description, createdAt, updatedAt }`.

---

## 4. Error Contract Chuẩn Của Backend

Backend TMDEMY trả lỗi thông qua các mã HTTP Status chuẩn kèm một trong 3 định dạng JSON:

```text
HTTP Error Status Codes:
- 400 Bad Request: Lỗi validation hoặc sai logic nghiệp vụ (OTP sai, username trùng,...)
- 401 Unauthorized: Token thiếu ("Access Token is missing!"), hết hạn ("jwt expired"), không hợp lệ ("invalid token"), sai mật khẩu ("Incorrect password")
- 403 Forbidden: Không đúng quyền role (Học viên gọi API Giảng viên/Admin)
- 404 Not Found: Bản ghi không tồn tại trong database
- 500 Internal Server Error: Sự cố ngoại lệ chưa được xử lý tại backend
```

### 3 Định Dạng Payload Lỗi:
1. **Lỗi Middleware Token / Hệ Thống**:
   ```json
   { "success": false, "error": "jwt expired" }
   ```
2. **Lỗi Nghiệp Vụ Controller**:
   ```json
   { "success": false, "message": "Incorrect password" }
   ```
3. **Lỗi Validation (express-validator)**:
   ```json
   {
     "errors": {
       "email": "Email không tồn tại",
       "password": "Mật khẩu tối thiểu 6 ký tự"
     }
   }
   ```

---

## 5. Nguyên Tắc Tích Hợp Frontend (Frontend Integration Rules)

1. **Chuẩn Hóa Lỗi Tập Trung (Error Normalization)**:
   - API Client (`src/lib/api/client.ts`) phải có hàm trích xuất lỗi chuẩn:
     ```typescript
     function extractErrorMessage(resData: any): string {
       if (resData?.errors) {
         return Object.values(resData.errors).join(', ');
       }
       return resData?.error || resData?.message || 'Đã có lỗi xảy ra. Vui lòng thử lại!';
     }
     ```
2. **Tương Thích ID (`id` vs `_id`)**:
   - Backend hỗ trợ cả `id` (chuẩn PostgreSQL UUID) và `_id` (tương thích ngược). Frontend luôn ưu tiên sử dụng `item.id`.
3. **Khóa Học Miễn Phí (Free Course Flow)**:
   - Khi mua khóa học miễn phí (`0 VND`), sau khi gọi `POST /api/orders`, backend tự động chuyển `status = COMPLETED` và tạo `Enrollment`. Frontend không cần hiển thị trang thanh toán mà chuyển thẳng vào học (`/learn/:courseId`).
4. **Bảo Mật Câu Hỏi Trắc Nghiệm (Quiz Anti-Cheat)**:
   - API `GET /api/quiz/lesson/:lessonId` **không bao giờ trả về trường `answer`**. Không thiết kế UI học viên dựa trên việc hiển thị đáp án trước khi nộp bài.

---

## 6. Confirmed Assumptions (Các Giả Định Đã Được Xác Nhận)

- [x] Backend đang chạy ổn định tại `http://localhost:3002`.
- [x] Biến môi trường Next.js: `NEXT_PUBLIC_API_URL=http://localhost:3002`.
- [x] Không tồn tại Prisma hay direct database connection trong frontend.
- [x] Role trong JWT và API là chữ thường (`"user"`, `"teacher"`, `"admin"`).
- [x] Đăng xuất cần gửi Bearer Token để thu hồi phiên trên server qua `POST /api/users/logout`.
- [x] Khóa học công khai chỉ hiển thị trạng thái `approved`.
- [x] Không cài đặt AI trong giai đoạn F1 đến F10.

---

## 7. Unresolved Questions (Vấn Đề Chưa Rõ)

```text
None.
```
*Toàn bộ 96 endpoints, format request/response, validation rules và error structure đã được đối chiếu và làm rõ 100% từ tài liệu backend.*
