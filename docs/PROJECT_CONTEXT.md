# TMDEMY — PROJECT CONTEXT

> **Tài liệu nguồn gốc dự án (Master Context) dành cho AI Coding Agents và Đội ngũ Phát triển Frontend.**  
> *Đọc tài liệu này đầu tiên trước khi thực hiện bất kỳ tác vụ nào trong codebase.*

---

## 1. Tổng quan Dự án (Project Identity)

- **Tên dự án**: **TMDEMY**
- **Bản chất hệ thống**: E-Learning Platform & Online Course Marketplace (Nền tảng học trực tuyến và sàn giao dịch khóa học chất lượng cao).
- **Mục đích**: Đồ án tốt nghiệp đại học (Graduation Thesis).
- **Tiêu chuẩn chất lượng**: Không đơn thuần là sản phẩm "chạy được" (MVP cơ bản), mà phải đạt tiêu chuẩn thẩm mỹ cao, UX mượt mà, kiến trúc code chuẩn mực, TypeScript chặt chẽ, phân quyền chính xác và có chiều sâu phân tích số liệu học tập.

---

## 2. Phạm vi & Ranh giới Frontend (Frontend Scope & Boundaries)

### 2.1. Kiến trúc Độc lập Tuyệt đối
- Đây là **Frontend Project riêng biệt** viết bằng **Next.js (App Router)**.
- Source code của Frontend **hoàn toàn tách biệt** với Backend repository (`e-learning_server`).

### 2.2. Không Giả định Truy cập Backend Trực tiếp
Tuyệt đối **KHÔNG ĐƯỢC PHÉP**:
1. Giả định frontend có quyền truy cập trực tiếp vào cơ sở dữ liệu (PostgreSQL).
2. Sử dụng hoặc import Prisma Client / schema (`@prisma/client`).
3. Import model, controller, service, hay utilities từ repository backend.
4. Tự tạo mock API hay giả lập identity bằng cách truyền tùy tiện `userId` qua request body nếu API không yêu cầu.

### 2.3. Kênh Giao tiếp Duy nhất
Frontend chỉ tương tác với Backend qua 2 kênh:
1. **REST API**: 96 endpoints có sẵn qua HTTP/JSON (`http://localhost:3002`).
2. **Realtime WebSocket**: Socket.IO server (`http://localhost:3002`) cho phân hệ Chat và Thông báo (Notifications).

---

## 3. Bối cảnh Backend (Backend Context)

Backend TMDEMY đã được thiết kế và triển khai hoàn chỉnh với thông số kỹ thuật:
- **Ngôn ngữ & Runtime**: Node.js, Express.js, TypeScript.
- **Cơ sở dữ liệu**: PostgreSQL (đã loại bỏ hoàn toàn MongoDB/Mongoose khỏi runtime).
- **ORM**: Prisma ORM.
- **Xác thực**: JWT Dual-Token (Access Token ngắn hạn gửi qua Authorization header; Refresh Token gửi qua body để cấp mới Access Token).
- **Tài liệu API**: Đầy đủ 29 file tài liệu đặc tả tại thư mục `/api` (`API_INDEX.md`, `AUTH_API.md`, `AUTH_FLOW.md`, `API_ENUM_REFERENCE.md`,...).

---

## 4. Các Vai trò Người dùng (User Roles)

Hệ thống hỗ trợ 3 vai trò người dùng chính thức trong Database và API:

| API / Backend Role | Tên hiển thị UI Frontend | Mô tả vai trò |
| :--- | :--- | :--- |
| `user` | **Học viên (Student)** | Tìm kiếm, xem khóa học, đặt mua, học bài (video/text), làm bài kiểm tra (quiz), nhận chứng chỉ (certificate), đánh giá khóa học, bình luận, chat realtime với giảng viên, nhận thông báo. |
| `teacher` | **Giảng viên (Teacher / Expert)** | Quản lý khóa học, xây dựng giáo trình (chương, bài học), tạo ngân hàng câu hỏi và bài trắc nghiệm, theo dõi danh sách học viên, doanh thu, phân tích chuyên sâu hiệu quả khóa học (Course Performance & Funnels). |
| `admin` | **Quản trị viên (Administrator)** | Quản lý tài khoản người dùng, tạo tài khoản giảng viên, duyệt/từ chối khóa học, quản lý danh mục, tạo và kiểm soát mã giảm giá (coupon), kiểm duyệt bình luận, xem doanh thu toàn hệ thống. |

> [!IMPORTANT]
> **Quy tắc Role Enum**: Trong UI có thể hiển thị thân thiện là "Student", "Teacher", "Admin" hoặc tiếng Việt, nhưng khi gửi request hoặc kiểm tra dữ liệu từ backend trả về, giá trị luôn phải là chữ thường: `"user"`, `"teacher"`, `"admin"`.

---

## 5. Năng lực Sản phẩm (Core Capabilities)

### Phân hệ Công khai (Public Discovery)
- Trang chủ giới thiệu các khóa học nổi bật, danh mục thịnh hành, đội ngũ giảng viên.
- Bộ lọc và tìm kiếm khóa học nâng cao (theo từ khóa, danh mục, cấp độ, miễn phí/có phí, sắp xếp theo giá/lượt xem).
- Trang chi tiết khóa học: video giới thiệu, lộ trình học, thông tin giảng viên, các đánh giá của học viên.

### Phân hệ Học tập của Học viên (Student Learning)
- Quản lý khóa học đã ghi danh (`Enrollment`).
- Giao diện phòng học (`Classroom / Lesson Player`): phát video bài giảng hoặc đọc nội dung tài liệu văn bản, tự động đánh dấu hoàn thành bài học, thanh tiến độ tổng thể (`Progress`).
- Hệ thống trắc nghiệm (`Quiz`): làm bài kiểm tra, nộp bài, tính điểm tự động, xem giải thích và lịch sử làm bài.
- Cấp chứng chỉ tự động (`Certificate`) khi hoàn thành 100% khóa học.
- Đánh giá khóa học (1 - 5 sao kèm nhận xét), bình luận và phản hồi bình luận theo bài học.
- Chat thời gian thực với giảng viên và nhận thông báo tức thời.

### Phân hệ Thương mại & Thanh toán (Commerce & Orders)
- Mua khóa học trực tiếp hoặc qua giỏ hàng.
- Áp dụng mã giảm giá (`Coupon`) theo phần trăm hoặc số tiền cố định.
- Tự động hoàn tất và kích hoạt khóa học đối với khóa học miễn phí (0 VND).
- Lịch sử đơn hàng cá nhân.

### Phân hệ Giảng viên (Teacher Studio & Analytics)
- Dashboard tổng quan doanh thu, số lượng học viên, số khóa học.
- Studio biên soạn khóa học: tạo chương (`Chapter`), bài học (`Lesson`), trắc nghiệm (`Quiz`), câu hỏi trắc nghiệm / điền khuyết (`Question`).
- Quản lý mã giảm giá riêng của giảng viên.
- **Phân tích số liệu chuyên sâu (Course Performance)**: Tỷ lệ hoàn thành, điểm trung bình bài kiểm tra, phễu bài học (Lesson Funnel) và điểm rơi rớt học viên (Drop-off Rate).

### Phân hệ Quản trị (Admin Portal)
- Quản lý danh sách người dùng (khóa/mở tài khoản, phân quyền, cấp tài khoản giảng viên).
- Phê duyệt / Từ chối khóa học mới của giảng viên.
- Quản lý danh mục khóa học (thêm, sửa, soft-delete).
- Quản lý toàn bộ mã giảm giá trên sàn.
- Kiểm duyệt nội dung bình luận phản cảm hoặc vi phạm.

---

## 6. Định hướng Đồ án Tốt nghiệp & Chiến lược AI (Thesis Direction)

1. **Giai đoạn 1 (Core Focus - Hiện tại)**:
   - Xây dựng hoàn chỉnh kiến trúc Frontend vững chắc, UI hiện đại, UX mượt mà, tích hợp 100% các API cốt lõi của Backend.
   - Hoàn thiện hệ thống phân tích số liệu khóa học (`Course Performance & Funnel`) của Teacher Dashboard làm điểm nhấn học thuật.
   - Đảm bảo Socket.IO realtime cho Chat và Notifications hoạt động ổn định.

2. **Giai đoạn 2 (Future AI Enhancements - KHÔNG triển khai ở giai đoạn này)**:
   - *AI Course Recommendation*: Gợi ý lộ trình khóa học cá nhân hóa.
   - *AI Learning Assistant*: Trợ lý học tập giải đáp thắc mắc trong bài giảng.
   - *AI Course Insight*: Phân tích số liệu Drop-off và đề xuất cải tiến nội dung cho giảng viên.
   - *Automation*: Webhooks và luồng n8n / Telegram alerts.
   - **LƯU Ý**: Không tự ý cài đặt package AI hoặc giả lập AI khi chưa hoàn thành Frontend Core.

---

## 7. Nguyên tắc Phát triển Cốt lõi (Golden Rules)

1. **API Contract là Chân lý (Contract First)**: Không đoán endpoint, không tự ý thay đổi HTTP method hay cấu trúc payload. Thư mục `/api` là tài liệu đối chiếu duy nhất.
2. **Chính sách Backend Gap**: Nếu cần dữ liệu mà API chưa có, ghi nhận vào tài liệu Gap và dừng lại xin ý kiến, tuyệt đối không tự sửa backend hay tự tạo giả lập không thống nhất.
3. **TypeScript Tuyệt đối**: Bật strict mode, không sử dụng `any`, định nghĩa kiểu dữ liệu khớp chính xác với API Schema.
4. **Tái sử dụng (Reuse > Reinvent)**: Sử dụng các component của shadcn/ui, giữ codebase gọn gàng, tránh tạo các abstraction thừa thãi.
