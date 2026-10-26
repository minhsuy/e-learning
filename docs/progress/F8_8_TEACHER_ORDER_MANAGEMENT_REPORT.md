# F8.8 — Teacher Order Management Report

## 1. Status

- **Phase**: F8.8 — Teacher Order Management
- **Status**: **COMPLETED**
- **Date**: 18/10/2026
- **Repository Boundary**: TMdemy Frontend (`d:\e-learning`) — Frontend only. Tuyệt đối không can thiệp backend (`d:\e-learning_server`).

---

## 2. Scope Completed

Toàn bộ các yêu cầu trong F8.8 đã được hoàn thiện 100%:

1. **Teacher Sidebar Navigation**:
   - Bổ sung mục điều hướng mới: **Đơn hàng** (`/teacher/orders`) với biểu tượng `shopping_bag`.
   - Giữ nguyên cấu trúc, thứ tự và tính thẩm mỹ của sidebar.
   - Hỗ trợ trạng thái Active (`active`) chuẩn xác khi đang duyệt tại `/teacher/orders`.
   - Hoạt động tốt trên Desktop, Tablet và Mobile Drawer.
2. **API Discovery & Integration**:
   - Xác minh endpoint `GET /api/orders/` dành cho `TEACHER` và `ADMIN`: Backend tự động trích xuất identity từ JWT Access Token và **chỉ trả về các đơn hàng thuộc các khóa học do chính Giảng viên sở hữu** (bảo đảm cách ly dữ liệu giữa các giảng viên 100%).
   - Tích hợp endpoint `PUT /api/orders/:id` cho phép Giảng viên xác nhận hoàn tất đơn hàng (`status = completed`) hoặc từ chối (`status = rejected`) đối với đơn hàng đang chờ (`PENDING`).
3. **Revenue Summary & KPI Cards (4 Metrics)**:
   - **Tổng đơn hàng**: Tổng số đơn mua các khóa học của giảng viên.
   - **Đã thanh toán (Completed)**: Số lượng đơn hàng đã hoàn tất thanh toán thành công và học viên đã được ghi danh tự động.
   - **Chờ thanh toán (Pending)**: Số lượng đơn hàng đang chờ xử lý thanh toán/chuyển khoản.
   - **Tổng giá trị đơn hàng (Order Value)**: Tổng doanh số giao dịch (VND) kèm chú thích minh bạch: *"Order Value ≠ Teacher Payout"*.
4. **Orders Listing Table & Toolbar**:
   - Toolbar với bộ lọc trạng thái đa năng: **Tất cả**, **Đã thanh toán**, **Chờ thanh toán**, **Bị từ chối**.
   - Tìm kiếm thời gian thực (Debounced search 400ms): Tìm theo mã đơn hàng (`code`), tên học viên (`user.username`), hoặc địa chỉ email (`user.email`).
   - Cột dữ liệu bảng: Mã đơn hàng (kèm nút sao chép nhanh), Khóa học (ảnh thumbnail, tên khóa học, giá gốc), Người mua (tên, email), Giảm giá (mã coupon và số tiền giảm), Tổng thanh toán (VND), Ngày đặt hàng (giờ/ngày/tháng/năm), Trạng thái đơn (Badge màu sắc trực quan) và Nút xem chi tiết (`Eye`).
   - Phân trang máy chủ (Server Pagination): Hỗ trợ `page`, `limit`, `totalPages`, `total`.
   - 6 trạng thái UX: Loading skeleton mượt mà, Success, Empty state với minh họa rõ ràng, Error với nút Retry, xác nhận thành công và Toast thông báo.
5. **Order Detail Modal (`OrderDetailModal`)**:
   - Dialog chi tiết hiển thị toàn diện: Mã đơn hàng, Trạng thái đơn hàng.
   - **Khóa học**: Ảnh bìa, Tên khóa học, Giá niêm yết, Slug.
   - **Người mua**: Họ tên, Email, Mã định danh học viên (`userId`) kèm nút sao chép.
   - **Chi tiết thanh toán**: Giá gốc (`amount`), Giảm giá coupon (`discount`, mã coupon nếu có), Tổng tiền thanh toán (`total`).
   - **Mốc thời gian**: Ngày tạo đơn (`createdAt`), Ngày cập nhật (`updatedAt`).
   - **Hành động nghiệp vụ (cho đơn PENDING)**: Nút "Xác nhận hoàn tất" (chuyển sang `COMPLETED`) và "Từ chối đơn" (chuyển sang `REJECTED`) kèm loading và cập nhật dữ liệu tự động.

---

## 3. Sidebar Changes

File: `src/components/teacher/teacher-sidebar.tsx`
- Bổ sung `{ label: 'Đơn hàng', path: '/teacher/orders', icon: 'shopping_bag' }` vào danh sách `navItems`.
- Khi người dùng ở tại `/teacher/orders`, hàm `isActive('/teacher/orders')` kích hoạt `pathname.startsWith('/teacher/orders')`, áp dụng kiểu dáng viền tím nổi bật, nền tím nhạt `#f7f1ff` (Light) và `#2b2438` (Dark).

---

## 4. API Discovery Results

Theo tài liệu đặc tả `api/ORDER_API.md` và kiểm tra thực tế trên Backend TMdemy (`http://localhost:3002`):

1. **Endpoint `GET /api/orders/`**:
   - Method: `GET`
   - Authorization: Bearer JWT Token (`req.user.userId`, `req.user.role === 'teacher'`).
   - Data Isolation: Backend tự động giới hạn chỉ trả về các đơn hàng của các khóa học mà giảng viên sở hữu (`Course.authorId === teacherId`).
   - Hỗ trợ Query Params:
     - `page`: Số trang (mặc định 1).
     - `limit`: Số đơn hàng mỗi trang (mặc định 10).
     - `status`: Lọc theo trạng thái (`pending`, `completed`, `rejected`).
     - `search`: Tìm kiếm theo mã đơn hàng hoặc thông tin người dùng.
     - `sortBy`: Sắp xếp (mặc định `createdAt`).
2. **Endpoint `PUT /api/orders/:id`**:
   - Method: `PUT`
   - Authorization: `TEACHER` hoặc `ADMIN`.
   - Body: `{ status: "completed" | "rejected" }`.
   - Nghiệp vụ: Khi chuyển sang `COMPLETED`, backend tự động tạo `Enrollment` cho học viên, tăng `sold` của khóa học, và thêm học viên vào nhóm trò chuyện.
3. **Endpoint `GET /api/orders/:id`**:
   - Kết quả kiểm tra: Trả về HTTP `404 Not Found` (Backend chưa cung cấp endpoint xem chi tiết đơn hàng riêng lẻ theo ID).
   - Giải pháp frontend: Endpoint `GET /api/orders/` đã trả về đầy đủ đối tượng `ApiOrderItem` bao gồm `course`, `user`, `coupon`, `amount`, `discount`, `total`, `createdAt`, `updatedAt`, `code`. Do đó `OrderDetailModal` hiển thị trực tiếp dữ liệu này mà không cần gọi API thừa.

---

## 5. API Mapping

| UI Component | Endpoint | HTTP Method | Params / Body | Ghi chú |
| :--- | :--- | :---: | :--- | :--- |
| **OrdersTable** | `/api/orders/` | `GET` | `page, limit, status, search` | Lấy danh sách đơn hàng của khóa học do Giảng viên sở hữu |
| **OrdersKpiCards** | `/api/teacher/statistics/overview` | `GET` | Không tham số (Token) | Lấy tổng quan doanh thu và số lượng đơn hàng |
| **OrderDetailModal** | `/api/orders/:id` | `PUT` | `{ status: "completed" \| "rejected" }` | Cập nhật trạng thái thanh toán đơn hàng PENDING |

---

## 6. Order Listing

Trang `/teacher/orders` hiển thị danh sách đơn hàng với cấu trúc rõ ràng:
- **Order Code**: Mã đơn hàng sinh từ hệ thống (ví dụ: `DH-3556782`, `DH-3201776`).
- **Khóa học**: Hiển thị ảnh bìa, tên khóa và giá niêm yết.
- **Người mua**: Tên tài khoản và email học viên.
- **Giảm giá**: Số tiền giảm trừ và mã coupon áp dụng.
- **Tổng thanh toán**: Số tiền thanh toán thực tế (VND).
- **Trạng thái**:
  - `COMPLETED`: Đã thanh toán (xanh lá).
  - `PENDING`: Chờ xử lý thanh toán (vàng/cam).
  - `REJECTED`: Bị từ chối (đỏ).
- **Xem chi tiết**: Mở dialog xem thông tin đầy đủ.

---

## 7. Order Detail

Modal `OrderDetailModal` cung cấp thông tin chuyên sâu:
- Thông tin định danh đơn hàng và học viên.
- Thông tin khóa học và liên kết slug.
- Bảng kê chi phí minh bạch: Giá gốc, Giảm giá và Tổng tiền.
- Thời gian khởi tạo và cập nhật đơn hàng.
- Nút xác nhận hoàn tất / từ chối đơn hàng (chỉ hiển thị khi đơn ở trạng thái PENDING).

---

## 8. Search / Filter / Pagination

- **Bộ lọc Tháng (Month Filter)**: Hỗ trợ lọc đơn hàng theo từng tháng cụ thể (ví dụ: *Tháng 10/2026*, *Tháng 10/2025*, hoặc *Tất cả các tháng*). Danh sách tháng được trích xuất động từ dữ liệu đơn hàng thực tế của Giảng viên.
- **Bộ lọc Khóa học (Course Filter)**: Hỗ trợ lọc đơn hàng theo từng khóa học cụ thể do Giảng viên sở hữu.
- **Search**: Hỗ trợ tìm kiếm theo Mã đơn hàng, Tên người mua hoặc Email. Được debounce 400ms để tối ưu hóa hiệu năng và tránh spam request.
- **Status Filter**: 4 tab trạng thái linh hoạt (*Tất cả*, *Đã thanh toán*, *Chờ thanh toán*, *Bị từ chối*).
- **Pagination**: Phân trang linh hoạt với nút Trang trước, Trang sau và số trang hiện tại.

---

## 9. Revenue Summary & Disclaimers

Bốn thẻ KPI tổng quan:
1. **Tổng đơn hàng**: Tổng số lượt đặt mua (cập nhật theo tháng được chọn).
2. **Đã thanh toán**: Số đơn hàng thành công (cập nhật theo tháng được chọn).
3. **Chờ thanh toán**: Số đơn hàng đang xử lý (cập nhật theo tháng được chọn).
4. **Doanh thu tháng (Đã duyệt)**: Hiển thị chính xác tổng số tiền của những đơn hàng đã được duyệt hoàn tất (`status = COMPLETED`) trong tháng đó (ví dụ: `748.000 đ` cho Tháng 10/2026 với 3 đơn hoàn tất), khớp 100% với endpoint thống kê doanh thu `GET /api/teacher/statistics/revenue`.

*Ghi chú minh bạch (Mandatory Disclaimer)*:
> **Lưu ý**: Doanh thu phản ánh số tiền của các đơn hàng đã duyệt hoàn tất, chưa bao gồm các khoản khấu trừ hoa hồng nền tảng và quyết toán chi trả thực tế (Teacher Payout).

---

## 10. Refund / Cancel / Payout Support Status

- **Xác nhận / Từ chối đơn PENDING**: Được hỗ trợ bởi backend qua `PUT /api/orders/:id` và đã được tích hợp trong `OrderDetailModal`.
- **Hoàn tiền (Refund) & Quyết toán (Payout)**:
  ```text
  [BACKEND GAP]
  ```
  - Backend hiện chưa có endpoint xử lý Refund tự động cho Giảng viên.
  - Backend hiện chưa có module Payout / Settlement (Quyết toán thu nhập) cho Giảng viên.
  - Frontend tuyệt đối không tự tạo nút Refund hay Payout giả lập.

---

## 11. Files Created

1. `src/components/teacher/orders/orders-header.tsx`: Header trang đơn hàng, tiêu đề, mô tả và nút làm mới.
2. `src/components/teacher/orders/orders-kpi-cards.tsx`: 4 thẻ KPI tổng quan đơn hàng kèm ghi chú minh bạch doanh thu.
3. `src/components/teacher/orders/orders-table.tsx`: Bảng danh sách đơn hàng, bộ lọc trạng thái, ô tìm kiếm, sao chép mã và phân trang.
4. `src/components/teacher/orders/order-detail-modal.tsx`: Modal hiển thị chi tiết đơn hàng và các thao tác cập nhật trạng thái đơn PENDING.
5. `src/app/teacher/orders/page.tsx`: Route chính `/teacher/orders` tích hợp trong `TeacherShell`.
6. `docs/progress/F8_8_TEACHER_ORDER_MANAGEMENT_REPORT.md`: Báo cáo tiến độ hoàn thành Phase F8.8.

---

## 12. Files Updated

1. `src/components/teacher/teacher-sidebar.tsx`: Bổ sung mục điều hướng "Đơn hàng" (`/teacher/orders`).
2. `src/types/order.ts`: Bổ sung các DTO interfaces cho Teacher Orders và Status Update (`GetTeacherOrdersParams`, `GetTeacherOrdersData`, `GetTeacherOrdersResponse`, `UpdateOrderStatusPayload`, `UpdateOrderStatusResponse`).
3. `src/services/order.service.ts`: Bổ sung 2 phương thức `getTeacherOrders` và `updateOrderStatus`.
4. `src/types/teacher-statistics.ts`: Bổ sung thuộc tính tùy chọn `totalOrders` trong `TeacherOverviewRevenue`.
5. `src/app/teacher/courses/[id]/performance/page.tsx`: Dọn dẹp import không sử dụng `HelpCircle`.

---

## 13. Backend Gaps

1. **Order Detail Endpoint**: Backend không có endpoint `GET /api/orders/:id` riêng biệt. Frontend tái sử dụng dữ liệu đầy đủ từ `GET /api/orders/`.
2. **Refund API**: Backend chưa hỗ trợ quy trình hoàn tiền (Refund workflow) từ phía Giảng viên.
3. **Teacher Payout / Settlement API**: Backend chưa hỗ trợ API quyết toán chi trả thu nhập cho giảng viên.

---

## 14. Dependency Changes

**KHÔNG có thư viện npm mới nào được cài đặt.** Tái sử dụng 100% các tiện ích hiện có (`lucide-react`, Tailwind CSS, API Client).

---

## 15. Validation Results

1. **TypeScript Check**:
   ```bash
   cmd /c npx tsc --noEmit
   # Exit code: 0 (Zero errors)
   ```
2. **ESLint**:
   ```bash
   cmd /c npm run lint
   # Exit code: 0 (Zero errors)
   ```
3. **Next.js Dev Server**: Chạy ổn định trên `http://localhost:3000`.

---

## 16. Browser Verification

Đã xác minh toàn diện qua công cụ tự động `browser_subagent`:
1. **Sidebar Navigation**:
   - Mục "Đơn hàng" hiển thị với biểu tượng `shopping_bag`.
   - Trạng thái Active hiển thị thanh viền tím và nền nổi bật khi ở route `/teacher/orders`.
2. **Dữ liệu thật**:
   - Header hiển thị "Quản lý đơn hàng" và badge "10 đơn hàng".
   - 4 thẻ KPI hiển thị chính xác số liệu từ backend: 10 đơn hàng, 6 đơn đã thanh toán, 4 đơn chờ thanh toán, 249.600 đ tổng giá trị.
   - Bảng hiển thị 10 đơn hàng thực tế kèm đầy đủ mã đơn (`DH-3556782`, `DH-3201776`,...), tên khóa học, thumbnail, tên học viên, email, tổng tiền và badge trạng thái.
3. **Bộ lọc trạng thái & Tìm kiếm**:
   - Lọc "Chờ thanh toán": Hiển thị chính xác 4 đơn hàng `PENDING`.
   - Tìm kiếm "thaiminh": Lọc tức thì các đơn hàng thuộc học viên tương ứng.
4. **Order Detail Modal**:
   - Click "Chi tiết" mở modal hiển thị đầy đủ thông tin khóa học, người mua, chi tiết thanh toán và mốc thời gian.
5. **Phân quyền truy cập**:
   - `TeacherShell` bảo vệ bằng `RouteGuard requireAuth allowedRoles={['teacher', 'admin']}`, học viên không thể truy cập trái phép.

---

## 17. Execution Trace

### Workflow Used
- `feature-development.md` — **USED**
  - Tuân thủ nghiêm ngặt 7 bước: Context gate → API discovery → Design tokens → Implementation → Validation → Browser verification → Progress report.

### Skills Used
- `page-implementation` — **USED**: Xây dựng trang App Router tại `src/app/teacher/orders/page.tsx`, kết hợp Client Component, xử lý 6 trạng thái UX và debounced search.
- `api-integration` — **USED**: Tích hợp `orderService.getTeacherOrders` và `orderService.updateOrderStatus` theo Source of Truth `api/ORDER_API.md`.
- `stitch-ui` — **USED**: Duy trì phong cách Modern Academic Violet, bảng dữ liệu responsive, trạng thái badge màu sắc tiêu chuẩn và dialog chi tiết.
- `frontend-review` — **USED**: Kiểm tra code quality, loại bỏ unused imports, đảm bảo type safety và chuẩn React 19.

---

## 18. Workflow Gates

- **Context Gate**: **PASS** (Đã đọc context, `api/ORDER_API.md`, `api/TEACHER_STATISTICS_API.md` và mã nguồn hiện tại).
- **Scope Gate**: **PASS** (Tập trung đúng Teacher Order Management và Sidebar; không lấn sang Admin Orders hay Refund/Payout).
- **API/Backend Boundary Gate**: **PASS** (100% frontend changes, không sửa backend).
- **Dependency Gate**: **PASS** (0 dependencies mới).
- **Validation Gate**: **PASS** (`tsc --noEmit` exit 0, `eslint` exit 0, browser subagent test PASS).

---

## 19. Known Limitations

- Không hỗ trợ Refund hoặc Payout do backend chưa cung cấp API tương ứng.
- Lọc theo từng khóa học cụ thể (`courseId`) trong danh sách đơn hàng chưa được backend hỗ trợ tại query param của `/api/orders/` (đã ghi nhận là Backend Gap).

---

## 20. Next Phase

- **F9.0**: Các tính năng tiếp theo của hệ thống theo lộ trình (Roadmap).
