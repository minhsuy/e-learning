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
  * **Chống tự khóa / tự đổi quyền (BE-F9.11-008)**: Admin KHÔNG THỂ tự khóa tài khoản của chính mình (`status: "inactive"` hoặc `locked: true`) hoặc tự giáng cấp vai trò của chính mình (`role != "admin"`). Vi phạm sẽ nhận `400 Bad Request` kèm message `"Không thể tự khóa hoặc thay đổi vai trò của chính tài khoản quản trị đang đăng nhập"` và `errorCode: "SELF_LOCK_BLOCKED"` / `"SELF_DEMOTE_BLOCKED"`.
* **Error Responses**:
  * 400 Bad Request: Gửi field cấm, input không hợp lệ, hoặc tự khóa/đổi vai trò tài khoản chính mình.
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

### 1.4. PATCH /api/users/admin/lock/:id & PATCH /api/users/admin/role/:id
* **Method**: `PATCH`
* **Endpoints**:
  * Khóa/Mở khóa: `/api/users/admin/lock/:id` (Body: `{ "isLocked": boolean }` hoặc `{ "status": "active" | "inactive" }`)
  * Đổi vai trò: `/api/users/admin/role/:id` (Body: `{ "role": "admin" | "teacher" | "user" }`)
* **Purpose**: Endpoint chuyên biệt cho giao diện Admin User Management thao tác nhanh khóa hoặc đổi vai trò người dùng.
* **Security Guard (BE-F9.11-008)**: Backend chặn toàn diện thao tác tự khóa hoặc tự tước quyền admin với `400 Bad Request`.

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
* **Purpose**: Phê duyệt (`approved`) hoặc Từ chối (`rejected`) khóa học của Giảng viên. Bắt buộc lưu vết `rejectionReason` khi từ chối. Hệ thống tự động gửi Push Notification đến giảng viên kèm lý do từ chối.
* **Authentication**: `Bearer JWT required`
* **Roles**: `ADMIN`
* **Request Body**:
  ```json
  {
    "status": "rejected",
    "rejectionReason": "Chất lượng âm thanh bài học 3 và 4 quá rè, thiếu tài liệu đính kèm theo quy định."
  }
  ```
* **Validation Rules**: `status` bắt buộc phải là một trong: `approved`, `pending`, `rejected`. `rejectionReason` (hoặc alias `reason`) tùy chọn kiểu string.
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Course updated successfully (by teacher/admin)!",
    "data": {
      "id": "uuid",
      "status": "rejected",
      "rejectionReason": "Chất lượng âm thanh bài học 3 và 4 quá rè, thiếu tài liệu đính kèm theo quy định.",
      "updatedAt": "2026-10-20T19:30:00.000Z"
    }
  }
  ```
* **Raw HTTP Request**:
  ```http
  PATCH {{BASE_URL}}/api/admin/courses/teacher/3c4d5e6f-7a8b-9c0d-1e2f-3a4b5c6d7e8f
  Authorization: Bearer <ADMIN_ACCESS_TOKEN>
  Content-Type: application/json

  {
    "status": "rejected",
    "rejectionReason": "Chất lượng âm thanh bài học 3 và 4 quá rè, thiếu tài liệu đính kèm theo quy định."
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

---

## 4. ADMIN STATISTICS & DASHBOARD (IMPROVEMENT BE-F9.11 & STEP 08.2)

> [!IMPORTANT]
> **Security & Caching Policy (STEP 08.2)**:
> * Tất cả endpoint thống kê tài chính xác thực **tài khoản ADMIN còn hoạt động (`status = ACTIVE`) và vai trò `ADMIN` được lưu trong PostgreSQL** (không chỉ tin cậy JWT claim). Token giả mạo role hoặc tài khoản bị vô hiệu hóa nhận `403 Forbidden`.
> * Tất cả phản hồi thống kê trả header `Cache-Control: no-store`.
> * **Ngữ nghĩa doanh thu**: Doanh thu ghi nhận (`netRevenue` / `totalRevenue`) tổng hợp `SUM(Order.total)` trên các đơn `COMPLETED` (không cộng gộp `PaymentTransaction` để chống trùng webhook/nộp thừa). Đơn hàng miễn phí (`total = 0`) đóng góp `0 VND` doanh thu tiền tệ nhưng vẫn được đếm trong `completedOrders` và tách riêng ở `freeOrders` vs `paidOrders`. Múi giờ báo cáo mặc định là `Asia/Ho_Chi_Minh` (`UTC+07:00`).

### 4.1. GET /api/admin/statistics/financial (BE-F9.11-001 + STEP 08.2)
* **Method**: `GET`
* **Endpoint**: `/api/admin/statistics/financial`
* **Purpose**: Thống kê tài chính & doanh thu toàn sàn cho Quản trị viên bằng DB-level aggregate, hỗ trợ phân tách phương thức thanh toán, cơ sở thời gian ghi nhận doanh thu và chuỗi thời gian lấp đầy khoảng trống (zero-filled).
* **Authentication**: `Bearer JWT required` (Persisted `ACTIVE` `ADMIN`)
* **Roles**: `ADMIN`
* **Response Headers**: `Cache-Control: no-store`
* **Query Parameters**:
  | Parameter | Type | Required | Default | Description |
  | :--- | :---: | :---: | :---: | :--- |
  | `timeRange` | string | No | `"all"` | `"7days"`, `"30days"`, `"1year"`, `"12months"`, `"custom"`, `"all"` |
  | `startDate` | string | Chỉ khi `custom` | `undefined` | Ngày bắt đầu `YYYY-MM-DD` hoặc ISO-8601. Không được lớn hơn `endDate`, tối đa 5 năm (1826 ngày). |
  | `endDate` | string | Chỉ khi `custom` | `undefined` | Ngày kết thúc `YYYY-MM-DD` (bao gồm trọn ngày theo `timezone`) hoặc mốc thời gian ISO-8601 chính xác. |
  | `timeBasis` | string | No | `"createdAt"` | `"createdAt"` (ngày tạo đơn, tương thích ngược), `"recognizedAt"` (`COALESCE(paidAt, createdAt)` kèm số lượng ước lượng legacy), `"paidAt"` (chỉ đơn có `paidAt`, báo cáo riêng `undatedLegacyOrders`). |
  | `timezone` | string | No | `"Asia/Ho_Chi_Minh"` | Múi giờ gom nhóm ngày/tháng: `"Asia/Ho_Chi_Minh"` hoặc `"UTC"`. |
  | `paymentMethod` | string | No | `"all"` | `"all"`, `"sepay_bank_transfer"`, `"manual_bank_transfer"`, `"free"`, `"legacy_unknown"` (SQL `NULL`). |
  | `granularity` | string | No | Auto | `"day"` hoặc `"month"`. |
  | `teacherId` | UUID | No | `undefined` | Lọc doanh số theo giảng viên sở hữu khóa học. |
  | `courseId` | UUID | No | `undefined` | Lọc doanh số theo 1 khóa học cụ thể. |
* **Success Response (200 OK)** *(giữ nguyên 100% trường cũ, chỉ bổ sung trường mở rộng)*:
  ```json
  {
    "success": true,
    "message": "Lấy thống kê tài chính thành công",
    "data": {
      "grossRevenue": 1740000,
      "netRevenue": 1390000,
      "totalOrders": 13,
      "completedOrders": 10,
      "pendingOrders": 2,
      "rejectedOrders": 1,
      "averageOrderValue": 139000,
      "revenueByMonth": [
        { "month": "2026-10", "revenue": 450000, "orderCount": 3 },
        { "month": "2026-11", "revenue": 940000, "orderCount": 7 }
      ],
      "paidOrders": 8,
      "freeOrders": 2,
      "totalDiscount": 350000,
      "reporting": {
        "timeBasis": "recognizedAt",
        "timezone": "Asia/Ho_Chi_Minh",
        "startDate": "2026-10-19T17:00:00.000Z",
        "endDate": "2026-11-18T17:00:00.000Z",
        "granularity": "day",
        "legacyEstimatedOrders": 2,
        "undatedLegacyOrders": 0
      },
      "methodBreakdown": [
        { "paymentMethod": "sepay_bank_transfer", "completedOrders": 5, "revenue": 980000 },
        { "paymentMethod": "manual_bank_transfer", "completedOrders": 1, "revenue": 200000 },
        { "paymentMethod": "free", "completedOrders": 2, "revenue": 0 },
        { "paymentMethod": "legacy_unknown", "completedOrders": 2, "revenue": 210000 }
      ],
      "revenueTimeline": [
        { "date": "2026-11-17", "revenue": 210000, "orderCount": 2, "ordersCount": 2 },
        { "date": "2026-11-18", "revenue": 750000, "orderCount": 5, "ordersCount": 5 }
      ]
    }
  }
  ```
* **Error Responses**: `400 Bad Request` (ngày không hợp lệ như `2026-02-31`, `startDate > endDate`, span > 5 năm, UUID sai), `401 Unauthorized`, `403 Forbidden` (không phải ADMIN đang ACTIVE).

---

### 4.2. GET /api/admin/statistics/sales (NEW — STEP 08.2)
* **Method**: `GET`
* **Endpoint**: `/api/admin/statistics/sales`
* **Purpose**: Báo cáo phân rã doanh số toàn sàn theo **khóa học** (`groupBy=course`) hoặc **giảng viên** (`groupBy=teacher`), có phân trang ổn định và hỗ trợ lọc theo khoảng thời gian, cơ sở thời gian và phương thức thanh toán. Doanh số giảng viên là **doanh số bán khóa học (sales attribution)**, KHÔNG phải hoa hồng hay số dư chi trả (commission/payout).
* **Authentication**: `Bearer JWT required` (Persisted `ACTIVE` `ADMIN`)
* **Roles**: `ADMIN`
* **Response Headers**: `Cache-Control: no-store`
* **Query Parameters**:
  | Parameter | Type | Required | Default | Description |
  | :--- | :---: | :---: | :---: | :--- |
  | `groupBy` | string | No | `"course"` | `"course"` hoặc `"teacher"` |
  | `timeRange` | string | No | `"all"` | `"7days"`, `"30days"`, `"1year"`, `"12months"`, `"custom"`, `"all"` |
  | `startDate` | string | Chỉ khi `custom` | `undefined` | `YYYY-MM-DD` hoặc ISO-8601 |
  | `endDate` | string | Chỉ khi `custom` | `undefined` | `YYYY-MM-DD` hoặc ISO-8601 |
  | `timeBasis` | string | No | `"createdAt"` | `"createdAt"`, `"recognizedAt"`, `"paidAt"` |
  | `timezone` | string | No | `"Asia/Ho_Chi_Minh"` | `"Asia/Ho_Chi_Minh"`, `"UTC"` |
  | `paymentMethod` | string | No | `"all"` | `"all"`, `"sepay_bank_transfer"`, `"manual_bank_transfer"`, `"free"`, `"legacy_unknown"` |
  | `page` | number | No | `1` | Trang (>= 1) |
  | `limit` | number | No | `10` | Số dòng mỗi trang (1-100) |
  | `sortBy` | string | No | `"revenue"` | `"revenue"`, `"completedOrders"`, `"grossSales"` (có tie-breaker `"id" ASC NULLS LAST`) |
  | `order` | string | No | `"desc"` | `"asc"` hoặc `"desc"` |
* **Success Response (200 OK — `groupBy=course`)**:
  ```json
  {
    "success": true,
    "message": "Lấy thống kê doanh số thành công",
    "data": {
      "reporting": {
        "groupBy": "course",
        "timeBasis": "createdAt",
        "timezone": "Asia/Ho_Chi_Minh",
        "startDate": null,
        "endDate": null
      },
      "rows": [
        {
          "id": "course-uuid-1",
          "label": "Course A1 TypeScript",
          "revenue": 1050000,
          "grossSales": 1400000,
          "discount": 350000,
          "completedOrders": 7,
          "paidOrders": 5,
          "freeOrders": 2,
          "teacher": { "id": "teacher-uuid-1", "name": "TeacherA" }
        },
        {
          "id": null,
          "label": "(Đơn hàng không gắn khóa học)",
          "revenue": 90000,
          "grossSales": 90000,
          "discount": 0,
          "completedOrders": 1,
          "paidOrders": 1,
          "freeOrders": 0,
          "teacher": null
        }
      ],
      "pagination": { "page": 1, "limit": 10, "total": 2, "totalPages": 1 }
    }
  }
  ```

---

### 4.3. GET /api/admin/dashboard/summary (BE-F9.11-007 + STEP 08.2)
* **Method**: `GET`
* **Endpoint**: `/api/admin/dashboard/summary`
* **Purpose**: API All-in-one tổng hợp số liệu Admin Dashboard trong 1 payload. Tách rõ đơn chờ duyệt thủ công (`manualPendingOrders`) với đơn chờ SePay tự động (`sepayPendingOrders`) và bổ sung bộ đếm tác vụ thanh toán (`paymentTasks`).
* **Authentication**: `Bearer JWT required` (Persisted `ACTIVE` `ADMIN`)
* **Roles**: `ADMIN`
* **Response Headers**: `Cache-Control: no-store`
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Lấy dữ liệu tổng quan admin dashboard thành công",
    "data": {
      "counts": {
        "totalUsers": 90,
        "totalStudents": 86,
        "totalTeachers": 3,
        "totalAdmins": 1,
        "totalCourses": 369,
        "pendingCourses": 23,
        "approvedCourses": 338,
        "rejectedCourses": 8,
        "totalOrders": 30,
        "pendingOrders": 9,
        "completedOrders": 21,
        "rejectedOrders": 0,
        "totalComments": 15,
        "manualPendingOrders": 6,
        "sepayPendingOrders": 3
      },
      "financials": {
        "totalRevenue": 154500000,
        "conversionRate": 70.0
      },
      "pendingTasks": [
        { "type": "course_approval", "count": 23, "actionUrl": "/admin/courses?status=pending" },
        { "type": "order_fulfillment", "count": 6, "actionUrl": "/admin/orders?status=pending" },
        { "type": "payment_review", "count": 2, "actionUrl": "/admin/orders?status=manual_review" }
      ],
      "paymentTasks": {
        "reviewCount": 2,
        "retryExhaustedCount": 1
      },
      "recentUsers": [
        { "id": "u_1", "fullName": "Nguyen Van A", "email": "a@gmail.com", "role": "user", "avatar": "", "createdAt": "2026-10-20T10:00:00Z" }
      ]
    }
  }
  ```

---

### 4.4. GET /api/coupons/admin/statistics & /api/admin/coupons/statistics (BE-F9.11-005)
* **Method**: `GET`
* **Endpoints**:
  * Chuẩn: `/api/coupons/admin/statistics`
  * Alias: `/api/admin/coupons/statistics`
* **Purpose**: Thống kê số lượng, trạng thái hoạt động, lượt sử dụng và tổng giá trị chiết khấu coupon toàn sàn trên các đơn `COMPLETED`.
* **Authentication**: `Bearer JWT required` (Persisted `ACTIVE` `ADMIN`)
* **Roles**: `ADMIN`
* **Response Headers**: `Cache-Control: no-store`
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Lấy thống kê coupon toàn sàn thành công",
    "data": {
      "totalCoupons": 45,
      "activeCoupons": 28,
      "expiredCoupons": 12,
      "disabledCoupons": 5,
      "totalUsageCount": 1850,
      "totalDiscountAmount": 92500000
    }
  }
  ```
