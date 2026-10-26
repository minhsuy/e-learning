# TMDEMY — ADMIN MANAGEMENT API SPECIFICATION (ADMIN_API.MD)

Tài liệu đặc tả toàn bộ 13 API thuộc quyền Quản trị viên (`ADMIN`) quản lý người dùng, khóa học, duyệt khóa học giảng viên và danh mục hệ thống.

Base URL: `{{BASE_URL}}` (Mặc định: `http://localhost:3002`)

Tất cả các endpoint trong tài liệu này **BẮT BUỘC có header `Authorization: Bearer <ADMIN_ACCESS_TOKEN>`** và tài khoản phải có `role = admin`.

---

## 1. USER MANAGEMENT

### 1.1. GET /api/admin/users
* **Method**: `GET`
* **Endpoint**: `/api/admin/users`
* **Purpose**: Lấy danh sách toàn bộ người dùng trong hệ thống (Học viên, Giảng viên, Quản trị viên) có lọc theo vai trò, trạng thái, tìm kiếm và phân trang.
* **Authentication**: `Bearer JWT required`
* **Roles**: `ADMIN`
* **Query Parameters**:
  | Parameter | Type | Required | Default | Description |
  | :--- | :---: | :---: | :---: | :--- |
  | `page` | number | No | `1` | Số trang (>= 1) |
  | `limit` | number | No | `10` | Số lượng người dùng mỗi trang (1-100) |
  | `role` | string | No | `undefined` | Lọc theo role: `admin`, `teacher`, `user` |
  | `status` | string | No | `undefined` | Lọc theo trạng thái: `active`, `inactive` |
  | `search` | string | No | `undefined` | Tìm kiếm theo username hoặc email |
  | `sortBy` | string | No | `"createdAt"`| Sắp xếp theo: `createdAt`, `username`, `email` |
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Fetched users successfully !",
    "data": {
      "users": [
        {
          "id": "1b089c16-0be6-444f-9e7f-f7dcfbc3e9b1",
          "_id": "1b089c16-0be6-444f-9e7f-f7dcfbc3e9b1",
          "username": "hoang_teacher",
          "email": "teacher@tmdemy.vn",
          "role": "teacher",
          "status": "active",
          "avatar": "",
          "phone": "0987654321",
          "bio": "Senior Instructor",
          "socialLinks": { "facebook": "", "instagram": "", "github": "" },
          "createdAt": "2026-02-10T08:00:00.000Z"
        }
      ],
      "pagination": { "page": 1, "limit": 10, "total": 45, "totalPages": 5 }
    }
  }
  ```
* **Raw HTTP Request**:
  ```http
  GET {{BASE_URL}}/api/admin/users?page=1&limit=10&role=teacher
  Authorization: Bearer <ADMIN_ACCESS_TOKEN>
  ```

---

### 1.2. GET /api/admin/users/:id
* **Method**: `GET`
* **Endpoint**: `/api/admin/users/:id`
* **Purpose**: Xem chi tiết thông tin tài khoản người dùng theo UUID.
* **Authentication**: `Bearer JWT required`
* **Roles**: `ADMIN`
* **Path Parameters**:
  | Parameter | Type | Required | Description |
  | :--- | :---: | :---: | :--- |
  | `id` | UUID | Yes | ID của người dùng cần xem |
* **Success Response (200 OK)**: Trả về object user đầy đủ thông tin an toàn kèm `socialLinks`.
* **Error Responses**:
  * 400 Bad Request: ID không phải UUID.
  * 403 Forbidden: Người dùng không phải role Admin.
  * 404 Not Found: Người dùng không tồn tại.
* **Raw HTTP Request**:
  ```http
  GET {{BASE_URL}}/api/admin/users/1b089c16-0be6-444f-9e7f-f7dcfbc3e9b1
  Authorization: Bearer <ADMIN_ACCESS_TOKEN>
  ```

---

### 1.3. PUT /api/admin/users/:id
* **Method**: `PUT`
* **Endpoint**: `/api/admin/users/:id`
* **Purpose**: Cập nhật thông tin, vai trò (`role`) hoặc trạng thái (`status`: ACTIVE/INACTIVE) của người dùng.
* **Authentication**: `Bearer JWT required`
* **Roles**: `ADMIN`
* **Request Body**:
  ```json
  {
    "username": "hoang_updated",
    "role": "teacher",
    "status": "active",
    "phone": "0912345678",
    "bio": "Updated bio description",
    "socialLinks": {
      "facebook": "https://facebook.com/newlink"
    }
  }
  ```
* **Validation Rules**:
  * Cấm cập nhật trực tiếp `email`, `password`, `refresh_token`, `reset_password_token`.
  * Phải gửi ít nhất một trường được phép cập nhật.
* **Error Responses**:
  * 400 Bad Request: Gửi field cấm hoặc input không hợp lệ.
  * 409 Conflict: Trùng `username` với tài khoản khác (`USERNAME_CONFLICT`).
* **Raw HTTP Request**:
  ```http
  PUT {{BASE_URL}}/api/admin/users/1b089c16-0be6-444f-9e7f-f7dcfbc3e9b1
  Authorization: Bearer <ADMIN_ACCESS_TOKEN>
  Content-Type: application/json

  {
    "status": "inactive"
  }
  ```

---

### 1.4. DELETE /api/admin/users/:id
* **Method**: `DELETE`
* **Endpoint**: `/api/admin/users/:id`
* **Purpose**: Xóa vĩnh viễn tài khoản người dùng khỏi hệ thống.
* **Authentication**: `Bearer JWT required`
* **Roles**: `ADMIN`
* **Business Rules**:
  * **Chống tự xóa tài khoản**: Admin không được phép tự xóa tài khoản của chính mình (`SELF_DELETE_BLOCKED`, trả 400 Bad Request).
  * **Bảo vệ Admin cuối cùng**: Không thể xóa tài khoản Admin cuối cùng trong hệ thống (`LAST_ADMIN`, trả 409 Conflict).
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "User deleted successfully"
  }
  ```
* **Raw HTTP Request**:
  ```http
  DELETE {{BASE_URL}}/api/admin/users/1b089c16-0be6-444f-9e7f-f7dcfbc3e9b1
  Authorization: Bearer <ADMIN_ACCESS_TOKEN>
  ```

---

### 1.5. POST /api/admin/users (Create Teacher)
* **Method**: `POST`
* **Endpoint**: `/api/admin/users`
* **Purpose**: Admin tạo trực tiếp tài khoản Giảng viên (Teacher) đã được kích hoạt sẵn (`isVerified = true`).
* **Authentication**: `Bearer JWT required`
* **Roles**: `ADMIN`
* **Request Body**:
  ```json
  {
    "username": "teacher_nam",
    "email": "nam.teacher@tmdemy.vn",
    "password": "Password123",
    "confirm_password": "Password123",
    "phone": "0988776655",
    "bio": "Chuyên gia React & TypeScript",
    "socialLinks": {
      "github": "https://github.com/namteacher"
    }
  }
  ```
* **Validation Rules**:
  * Trường `role` không được gửi (endpoint này mặc định gán role `teacher`).
  * `password` và `confirm_password` tối thiểu 8 ký tự và phải trùng khớp.
* **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Teacher created successfully",
    "data": {
      "id": "f4c9a8b1-1234-4567-89ab-cdef01234567",
      "username": "teacher_nam",
      "email": "nam.teacher@tmdemy.vn",
      "role": "teacher",
      "status": "active"
    }
  }
  ```
* **Error Responses**:
  * 409 Conflict: Trùng email (`EMAIL_CONFLICT`) hoặc trùng username (`USERNAME_CONFLICT`).
* **Raw HTTP Request**:
  ```http
  POST {{BASE_URL}}/api/admin/users
  Authorization: Bearer <ADMIN_ACCESS_TOKEN>
  Content-Type: application/json

  {
    "username": "teacher_nam",
    "email": "nam.teacher@tmdemy.vn",
    "password": "Password123",
    "confirm_password": "Password123"
  }
  ```

---

## 2. COURSE MANAGEMENT

### 2.1. GET /api/admin/courses
* **Method**: `GET`
* **Endpoint**: `/api/admin/courses`
* **Purpose**: Lấy danh sách toàn bộ khóa học để quản lý, hỗ trợ lọc theo trạng thái (`approved`, `pending`, `rejected`), tác giả (`author`) và cờ xóa mềm (`_destroy`).
* **Authentication**: `Bearer JWT required`
* **Roles**: `ADMIN`
* **Query Parameters**:
  | Parameter | Type | Required | Description |
  | :--- | :---: | :---: | :--- |
  | `page` | number | No | Số trang (mặc định 1) |
  | `limit` | number | No | Số lượng mỗi trang (mặc định 10) |
  | `status` | string | No | `approved`, `pending`, `rejected` |
  | `author` | UUID | No | Lọc theo ID giảng viên |
  | `_destroy` | boolean | No | `true` (xem khóa học đã xóa mềm), `false` |
  | `search` | string | No | Tìm kiếm theo tiêu đề |
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Fetched all courses successfully!",
    "data": {
      "courses": [
        {
          "id": "3c4d5e6f-7a8b-9c0d-1e2f-3a4b5c6d7e8f",
          "_id": "3c4d5e6f-7a8b-9c0d-1e2f-3a4b5c6d7e8f",
          "title": "Node.js Microservices Architecture",
          "slug": "nodejs-microservices-architecture",
          "price": 799000,
          "status": "approved",
          "author": { "id": "uuid", "username": "hoang_teacher" },
          "category": { "id": "uuid", "name": "Backend Development" },
          "_destroy": false
        }
      ],
      "pagination": { "page": 1, "limit": 10, "total": 24, "totalPages": 3 }
    }
  }
  ```

---

### 2.2. POST /api/admin/courses
* **Method**: `POST`
* **Endpoint**: `/api/admin/courses`
* **Purpose**: Admin tạo khóa học trực tiếp. Khóa học được gán ngay trạng thái `APPROVED` (không cần qua bước kiểm duyệt).
* **Authentication**: `Bearer JWT required`
* **Roles**: `ADMIN`
* **Request Body**:
  ```json
  {
    "title": "Mastering PostgreSQL & Prisma",
    "description": "Khóa học thực chiến cơ sở dữ liệu quan hệ cho lập trình viên Backend",
    "category": "category-uuid-v4",
    "type": "paid",
    "price": 599000,
    "old_price": 999000,
    "level": "intermediate",
    "image": "https://res.cloudinary.com/tmdemy/image/upload/v1/course.jpg",
    "intro_url": "https://youtube.com/watch?v=sample",
    "info": {
      "requirements": ["Cơ bản về SQL", "Biết TypeScript"],
      "benefits": ["Thành thạo tối ưu hóa truy vấn", "Hiểu sâu Prisma ORM"],
      "qa": [
        { "question": "Khóa học có chứng chỉ không?", "answer": "Có sau khi hoàn thành 70% và đạt bài kiểm tra." }
      ]
    }
  }
  ```
* **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Course created (pending approval)",
    "data": {
      "id": "uuid",
      "status": "approved"
    }
  }
  ```

---

### 2.3. PUT /api/admin/courses/:id
* **Method**: `PUT`
* **Endpoint**: `/api/admin/courses/:id`
* **Purpose**: Admin cập nhật toàn diện thông tin khóa học (tiêu đề, giá, hình ảnh, yêu cầu, trạng thái, cờ `_destroy`).
* **Authentication**: `Bearer JWT required`
* **Roles**: `ADMIN`
* **Success Response (200 OK)**: Trả về khóa học sau khi cập nhật với giá Decimal đã chuyển đổi thành Number.

---

### 2.4. DELETE /api/admin/courses/:id
* **Method**: `DELETE`
* **Endpoint**: `/api/admin/courses/:id`
* **Purpose**: Soft-delete khóa học (đặt `isDestroyed = true`). Khóa học bị ẩn khỏi catalog học viên nhưng vẫn giữ nguyên dữ liệu lịch sử đơn hàng.
* **Authentication**: `Bearer JWT required`
* **Roles**: `ADMIN`
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Course soft-deleted successfully (by admin)!"
  }
  ```

---

### 2.5. PATCH /api/admin/courses/teacher/:id
* **Method**: `PATCH`
* **Endpoint**: `/api/admin/courses/teacher/:id`
* **Purpose**: Phê duyệt (`approved`) hoặc Từ chối (`rejected`) khóa học của Giảng viên. Nếu duyệt thành công, hệ thống tự động bắn Notification đến giảng viên sở hữu khóa học.
* **Authentication**: `Bearer JWT required`
* **Roles**: `ADMIN`
* **Request Body**:
  ```json
  {
    "status": "approved"
  }
  ```
* **Validation Rules**: `status` bắt buộc phải là một trong: `approved`, `pending`, `rejected`.
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Course updated successfully (by teacher/admin)!",
    "data": {
      "id": "uuid",
      "status": "approved"
    }
  }
  ```
* **Raw HTTP Request**:
  ```http
  PATCH {{BASE_URL}}/api/admin/courses/teacher/3c4d5e6f-7a8b-9c0d-1e2f-3a4b5c6d7e8f
  Authorization: Bearer <ADMIN_ACCESS_TOKEN>
  Content-Type: application/json

  {
    "status": "approved"
  }
  ```

---

## 3. CATEGORY MANAGEMENT

### 3.1. POST /api/admin/categories
* **Method**: `POST`
* **Endpoint**: `/api/admin/categories/`
* **Purpose**: Tạo mới một danh mục khóa học.
* **Authentication**: `Bearer JWT required`
* **Roles**: `ADMIN`
* **Request Body**:
  ```json
  {
    "name": "Trí tuệ nhân tạo (AI & Data)",
    "description": "Các khóa học Machine Learning, Deep Learning và GenAI"
  }
  ```
* **Error Responses**:
  * 409 Conflict: Trùng tên danh mục (`NAME_CONFLICT`) hoặc trùng slug (`SLUG_CONFLICT`).
* **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Category created successfully!",
    "data": {
      "id": "uuid",
      "name": "Trí tuệ nhân tạo (AI & Data)",
      "slug": "tri-tue-nhan-tao-ai-data"
    }
  }
  ```

---

### 3.2. PUT /api/admin/categories/:id
* **Method**: `PUT`
* **Endpoint**: `/api/admin/categories/:id`
* **Purpose**: Cập nhật tên, slug, mô tả hoặc khôi phục danh mục đã xóa mềm.
* **Authentication**: `Bearer JWT required`
* **Roles**: `ADMIN`

---

### 3.3. DELETE /api/admin/categories/:id
* **Method**: `DELETE`
* **Endpoint**: `/api/admin/categories/:id`
* **Purpose**: Soft-delete danh mục khóa học (`isDestroyed = true`).
* **Authentication**: `Bearer JWT required`
* **Roles**: `ADMIN`
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Category deleted successfully!"
  }
  ```
