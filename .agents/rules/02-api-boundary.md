# Rule 02: Backend & API Boundary

> **Scope**: Ranh giới giao tiếp giữa TMdemy Frontend và Backend Server (`e-learning_server`).  
> **Mức độ nghiêm ngặt**: TUYỆT ĐỐI KHÔNG VI PHẠM. Đây là ranh giới kiến trúc cốt lõi của hệ thống.

---

## 1. Kênh Giao Tiếp Hợp Pháp Duy Nhất (Permitted Channels)

Frontend TMdemy (`d:/e-learning`) chỉ được phép tương tác với Backend (`d:/e-learning_server`) thông qua đúng 2 kênh chuẩn hóa:
1. **REST API**: Giao thức HTTP/HTTPS với dữ liệu JSON (chuẩn endpoint `http://localhost:3002/api/...`).
2. **Socket.IO**: Kênh kết nối thời gian thực WebSocket (cho Chat và Notifications).

---

## 2. Các Hành Vi Nghiêm Cấm Tuyệt Đối (Strictly Prohibited Actions)

Để đảm bảo tính độc lập hoàn toàn của Frontend, AI **TUYỆT ĐỐI KHÔNG**:
- ❌ Import bất kỳ file mã nguồn nào từ thư mục backend (`d:/e-learning_server`).
- ❌ Cài đặt hoặc import `@prisma/client`, Prisma CLI, hoặc schema Prisma vào frontend.
- ❌ Cài đặt hoặc import `mongoose`, MongoDB driver, hay `pg` (node-postgres) vào frontend.
- ❌ Kết nối hoặc thực thi bất kỳ truy vấn cơ sở dữ liệu trực tiếp nào (SQL, MongoDB query) từ frontend.
- ❌ Tự ý can thiệp, sửa đổi controller, service, repository, middleware, route hoặc schema bên backend để "tiện" cho frontend.
- ❌ Tự chế hoặc tự thay đổi quy ước endpoint (đổi URL, đổi HTTP method từ `POST` sang `PUT`, đổi status code mong đợi) khác với tài liệu quy định.

---

## 3. Nguồn Chân Lý API (API Source of Truth)

- Toàn bộ hành vi, endpoint, query parameters, request body, header, và response payload **BẮT BUỘC** phải tuân theo tài liệu đặc tả tại:
  👉 **Thư mục tài liệu API**: [`api/`](file:///d:/e-learning/api/)  
  👉 **Mục lục 102 Endpoints**: [`api/API_INDEX.md`](file:///d:/e-learning/api/API_INDEX.md)  
  👉 **Bảng giá trị Enums chuẩn**: [`api/API_ENUM_REFERENCE.md`](file:///d:/e-learning/api/API_ENUM_REFERENCE.md)  
  👉 **Chu trình Xác thực JWT Dual-Token**: [`api/AUTH_FLOW.md`](file:///d:/e-learning/api/AUTH_FLOW.md)
- Không được tự ý thêm các trường (fields) không có trong contract hoặc tự đổi tên trường (ví dụ: `course_id` vs `courseId`, `user` vs `student`). Luôn kiểm tra `api/` trước khi viết DTO hay Interface.

---

## 4. Xử Lý Khi Thiếu API: Báo Cáo [BACKEND GAP]

- Khi một tính năng UI cần dữ liệu hoặc thao tác nhưng:
  - Chưa có endpoint trong `api/API_INDEX.md`.
  - Endpoint hiện tại thiếu trường thông tin cần thiết.
  - Phân quyền (role) hoặc logic backend chưa hỗ trợ luồng này.
- **Hành động bắt buộc**:
  1. DỪNG việc giả lập thành công.
  2. Báo cáo rõ ràng theo khuôn mẫu:
     ```markdown
     [BACKEND GAP]
     - Năng lực cần thiết (Required Capability): ...
     - Endpoint / Sự kiện mong đợi (Expected Endpoint/Event): ...
     - Lý do Frontend cần (Reason): ...
     - Đề xuất giải pháp tạm thời ở UI (UI Fallback Strategy): ...
     ```
  3. Ở tầng UI: Hiển thị trạng thái rõ ràng (thông báo tính năng đang phát triển, disabled nút, hoặc UI mock có chú thích minh bạch), **TUYỆT ĐỐI KHÔNG MOCK DATA LÉN LÚT RỒI TUYÊN BỐ TÍNH NĂNG ĐÃ HOẠT ĐỘNG HOÀN TOÀN (FULLY FUNCTIONAL)**.

---

## 5. Ranh Giới Token & Định Danh Người Dùng

- Tuyệt đối không gửi giả lập `userId` trong body của các request mà backend đã xác thực thông qua `req.user` từ JWT token.
- Luôn gửi token qua header chuẩn:
  ```http
  Authorization: Bearer <access_token>
  ```
- Tuân thủ cơ chế tự động làm mới token qua endpoint `POST /api/users/access_token` với Refresh Token khi nhận mã lỗi `401 Unauthorized`.
