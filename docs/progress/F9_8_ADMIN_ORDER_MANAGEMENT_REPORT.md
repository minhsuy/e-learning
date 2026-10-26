# Báo Cáo Tiến Độ Phase F9.8 — Admin Order Management

## 1. Tóm Tắt (Summary)

Phase **F9.8 — Admin Order Management** hoàn thiện hệ thống quản lý đơn hàng dành cho Quản trị viên (Admin) tại route `/admin/orders` trên nền tảng TMdemy.

Giao diện cung cấp khả năng kiểm tra, đối soát toàn bộ dòng tiền mua khóa học, tra cứu giao dịch bằng mã đơn (`DH-...`) hoặc thông tin học viên, lọc theo trạng thái đơn hàng (`PENDING`, `COMPLETED`, `REJECTED`), phân trang từ server, xem chi tiết cấu trúc đơn hàng (học viên, khóa học, chiết khấu coupon, tổng thanh toán thực thu) và thực thi quy trình phê duyệt (`completed`) hoặc từ chối (`rejected`) đơn hàng chờ xử lý một cách an toàn.

Tuân thủ nghiêm ngặt **Frontend Boundary Policy**: 100% mã nguồn được phát triển trên frontend repository (`d:/e-learning`), không chỉnh sửa hay can thiệp vào backend repository (`d:/e-learning_server`), không gọi sai contract và báo cáo trung thực các backend gap.

---

## 2. Kiểm Tra Triển Khai Hiện Tại (Existing Implementation Audit)

1. **Order Page Trước F9.8**: Route `src/app/admin/orders/page.tsx` chỉ là placeholder card tạo từ Phase F9.2 Shell.
2. **Order Types**: Chưa có types chuyên biệt cho Admin Orders; đã bổ sung `src/types/admin-order.ts` định nghĩa rõ `AdminOrderItem`, `AdminOrdersPagination`, `AdminOrderKpis`, `UpdateAdminOrderStatusPayload`.
3. **Order Service**: Đã tạo mới `src/services/admin-order.service.ts` tái sử dụng `apiClient` từ `@/lib/api/client`, cung cấp error normalizer `normalizeOrderApiError`, định dạng tiền tệ `formatVND` và chuẩn hóa trạng thái `normalizeOrderStatus`.
4. **Hỗ trợ Pagination & Search Backend**: `GET /api/orders/` hỗ trợ `page`, `limit`, `search` (tìm cả theo `code` đơn và username/email) và `status`.
5. **Endpoint Order Detail**: Backend không có `GET /api/orders/:id` (trả về 404). Tuy nhiên, endpoint listing `GET /api/orders/` đã tự động populate đầy đủ `course` (title, image, slug, price), `user` (id, username, email, phone) và `coupon` (code, title, value, type). Do đó modal chi tiết hiển thị dữ liệu trực tiếp mà không cần gọi API riêng.
6. **Thống kê Doanh thu & Đơn hàng**: Backend chưa có route `/api/admin/statistics` hay analytics endpoint tổng hợp doanh thu toàn sàn. Đã ghi nhận `[BACKEND GAP]`. Số lượng đơn hàng được tính toán chính xác 100% từ `pagination.total` của backend theo từng status query; doanh thu tính từ các đơn hoàn tất thực tế.
7. **Refund & Payment Gateway**: Backend chưa hỗ trợ API Refund hay cột chi tiết cổng thanh toán (Stripe/VNPAY). Đã ghi nhận `[BACKEND GAP]`; không giả lập nút hoàn tiền.

---

## 3. Bảng Mapping API Contract (Order API Mapping)

| Endpoint | Method | Vai trò | Request Params / Body | Phản hồi thực tế | Trạng thái |
|---|---|---|---|---|---|
| `/api/orders/` | `GET` | Lấy danh sách đơn hàng toàn sàn phân trang | `page`, `limit`, `status`, `search` | `{ success: true, data: { orders: [...], pagination: { page, limit, total, totalPages } } }` | **TÍCH HỢP ĐẦY ĐỦ** |
| `/api/orders/:id` | `PUT` | Phê duyệt hoặc từ chối đơn hàng đang chờ | `{ status: "completed" \| "rejected" }` | `{ success: true, message: "Order approved successfully!" \| "Order rejected and deleted successfully!" }` | **TÍCH HỢP ĐẦY ĐỦ** |
| `/api/orders/:id` | `GET` | Xem chi tiết 1 đơn hàng | N/A | HTTP 404 Not Found (Backend không có endpoint này, listing đã trả về populated object) | **HANDLED (REUSE POPULATED)** |
| `/api/orders/refund` | `POST` | Hoàn tiền giao dịch | N/A | Không tồn tại trong backend | **[BACKEND GAP]** |
| `/api/admin/statistics` | `GET` | Báo cáo doanh thu & đơn hàng toàn sàn | N/A | HTTP 404 Not Found | **[BACKEND GAP]** |

---

## 4. F9.8-A — Admin Order Listing

- **Giao diện**:
  - Tiêu đề "Quản lý Đơn hàng", phụ đề giải thích chức năng đối soát.
  - 4 thẻ KPI tóm tắt tình trạng đơn hàng toàn hệ thống.
  - Thanh công cụ tìm kiếm và lọc trạng thái.
  - Bảng dữ liệu tương thích Desktop (>= 1024px) và Card view tương thích Mobile/Tablet (< 1024px).
  - Phân trang server-side chuẩn `w-8 h-8`.
- **Cột hiển thị bảng**:
  1. *Mã đơn hàng*: Hiển thị mã `DH-XXXXXXX`, nút sao chép nhanh có toast feedback, thời gian tạo đơn.
  2. *Học viên*: Username, email học viên.
  3. *Khóa học đăng ký*: Thumbnail khóa học, tên khóa học, mã ID rút gọn.
  4. *Số tiền & Chiết khấu*: Tổng thanh toán thực thu, chiết khấu coupon (nếu có), giá gốc.
  5. *Trạng thái đơn*: Badge Hoàn tất (Emerald), Chờ duyệt (Amber), Đã từ chối (Rose).
  6. *Thanh toán*: Đã thanh toán / Chờ thanh toán / Đã hủy.
  7. *Thao tác*: Xem chi tiết (Eye icon), nút Duyệt nhanh (CheckCircle2), nút Từ chối nhanh (XCircle) cho đơn `PENDING`.

---

## 5. Tìm Kiếm, Lọc & Phân Trang (Search, Filters & Pagination)

- **Search**:
  - Hỗ trợ tìm kiếm theo mã đơn (`DH-...`), họ tên học viên, hoặc địa chỉ email.
  - Sử dụng cơ chế debounce 400ms, tự động reset `page` về 1 khi từ khóa thay đổi, không spam keystroke lên backend.
  - Nút X xóa nhanh từ khóa tìm kiếm.
- **Filters**:
  - Hỗ trợ các tab trạng thái: `Tất cả`, `Đã hoàn tất` (`completed`), `Chờ duyệt / thanh toán` (`pending`), `Đã từ chối` (`rejected`).
  - Nút "Đặt lại bộ lọc" xuất hiện khi có bất kỳ điều kiện lọc nào đang hoạt động.
- **Pagination**:
  - Server-side pagination theo `page` và `limit` (hỗ trợ các mức: 10, 20, 50 đơn/trang).
  - Hiển thị dải bản ghi: `Hiển thị X - Y trong tổng số Z đơn hàng`.
  - Các nút điều hướng Trang đầu, Trang trước, Trang X/Y, Trang sau, Trang cuối có xử lý vô hiệu hóa khi ở biên hoặc đang tải dữ liệu.

---

## 6. F9.8-B — Order Detail (Chi Tiết Đơn Hàng)

Modal `OrderDetailModal` cung cấp cái nhìn 360 độ về đơn hàng:
- **Thông tin cơ bản**: Mã đơn hàng, ID định danh, trạng thái đơn, trạng thái thanh toán, ngày tạo và ngày cập nhật.
- **Thông tin khách hàng**: Tên học viên, email, số điện thoại (nếu có), User ID.
- **Khóa học đặt mua**: Thumbnail, tên khóa học, đường link trực tiếp đến trang khóa học trên sàn.
- **Mã ưu đãi (Coupon)**: Badge mã giảm giá, số tiền chiết khấu thực tế được trừ vào đơn hàng.
- **Bảng đối soát tài chính**:
  - Giá gốc khóa học: `formatVND(order.amount)`
  - Chiết khấu coupon: `- formatVND(order.discount)`
  - Tổng thanh toán thực thu: `formatVND(order.total)`
- **Thao tác nhanh**: Cho phép Admin duyệt hoặc từ chối đơn hàng trực tiếp ngay từ chân trang modal nếu đơn đang ở trạng thái `PENDING`.

---

## 7. F9.8-C — Quản Lý Trạng Thái Đơn Hàng (Order Status Management)

- **Xác nhận hoàn tất (Approve - `completed`)**:
  - Mở modal xác nhận an toàn `OrderStatusModal`.
  - Cảnh báo rõ hành động: Hệ thống ghi nhận học phí đã thanh toán và **tự động kích hoạt quyền ghi danh học viên (Enrollment) vào khóa học ngay lập tức**.
  - Ngăn chặn double submission qua cờ `loading` và vô hiệu hóa nút bấm.
  - Hiển thị toast thông báo thành công và cập nhật lại danh sách, KPI tự động.
- **Từ chối và hủy đơn (Reject - `rejected`)**:
  - Mở modal cảnh báo rõ: Đơn hàng bị hủy bỏ, quyền truy cập sẽ không được cấp; lượt sử dụng coupon (nếu có) được hoàn trả lại; backend sẽ xóa bản ghi đơn hàng bị từ chối khỏi cơ sở dữ liệu.
  - Không sử dụng `alert()` hay `confirm()` native của trình duyệt.

---

## 8. F9.8-D — Trạng Thái Thanh Toán & Hoàn Tiền (Payment Status & Refund)

- **Phân định rõ ràng**:
  - *Trạng thái đơn hàng (Order Status)*: Phản ánh tiến trình nghiệp vụ (`PENDING`, `COMPLETED`, `REJECTED`).
  - *Trạng thái thanh toán (Payment Status)*: Phản ánh dòng tiền (`Đã thanh toán (Paid)`, `Chờ thanh toán (Pending Payment)`, `Đã hủy giao dịch (Cancelled / Void)`).
- **Refund Policy**:
  - Backend hiện tại chưa hỗ trợ API Refund hoàn tiền.
  - Đã ghi nhận `[BACKEND GAP]`. Tuyệt đối không tạo nút hoàn tiền giả lập hoặc đổi trạng thái bằng client-side.

---

## 9. F9.8-E — Thống Kê & Chỉ Số Đơn Hàng (KPI & Analytics)

Bảng KPI Summary hiển thị 4 chỉ số:
1. **Tổng số đơn hàng**: Tổng hợp chính xác qua phân trang backend (`total` = 30).
2. **Đã hoàn tất**: Số lượng đơn đã kích hoạt thành công (`completed` = 21).
3. **Chờ đối soát / duyệt**: Số lượng đơn đang chờ thanh toán / duyệt (`pending` = 9).
4. **Doanh thu hệ thống**: Tính toán từ các đơn hàng hoàn tất thực tế (`1.577.050 ₫`).
- Không tính tổng doanh thu bằng cách chỉ cộng các đơn hàng hiển thị trên trang hiện tại.

---

## 10. Xử Lý Lỗi & Trạng Thái UX (Error Handling & UX States)

Đáp ứng đầy đủ 6 trạng thái UX:
1. **Loading State**: Hiệu ứng Skeleton animation dạng hàng trên Desktop và dạng thẻ trên Mobile.
2. **Empty State**: Hiển thị icon biên nhận, thông điệp rõ ràng và nút "Đặt lại bộ lọc" khi không có dữ liệu phù hợp.
3. **Error State**: Bắt lỗi qua `normalizeOrderApiError` (xử lý 400, 401, 403, 404, 409, 422, 500, Network, Timeout), hiển thị nút "Thử lại".
4. **Interactive State**: Sao chép mã đơn hàng nhanh bằng Clipboard API với toast thông báo và icon check.
5. **Mutation In-flight**: Spinner loading, vô hiệu hóa nút bấm chống click đúp.
6. **Success State**: Toast thông báo thành công từ `@/lib/toast`.

---

## 11. Tính Nhất Quán Dữ Liệu (State Consistency)

- Sau khi duyệt/từ chối đơn hàng thành công, kích hoạt `reloadTrigger` để:
  - Tải lại dữ liệu danh sách đơn hàng từ backend.
  - Tải lại các số liệu KPI tổng quan.
  - Cập nhật đồng bộ modal chi tiết nếu đang mở cho đơn hàng tương ứng.
- Sử dụng `AbortController` hủy bỏ request cũ khi người dùng chuyển trang hoặc thay đổi điều kiện lọc, triệt tiêu race-condition.

---

## 12. Giao Diện & Tương Thích Thiết Bị (UI/UX & Responsive)

- **Design System**: Sử dụng Modern Academic Violet (`#7240b8`, hover `#5d3299`, light `#f7f1ff`, border `#f1ebff`, dark border `#2b2438`).
- **Desktop (>= 1024px)**: Bảng dữ liệu đầy đủ 7 cột, căn chỉnh gọn gàng, hỗ trợ hover row.
- **Mobile (< 1024px)**: Tự động chuyển đổi sang Card layout, ưu tiên mã đơn hàng, học viên, tổng tiền và các nút thao tác nhanh.

---

## 13. Danh Sách Tệp Đã Tạo (Files Created)

1. [`src/types/admin-order.ts`](file:///d:/e-learning/src/types/admin-order.ts): Định nghĩa kiểu dữ liệu TypeScript cho Order, Course, User, Coupon, Pagination, KPI, Params và Mutation payload.
2. [`src/services/admin-order.service.ts`](file:///d:/e-learning/src/services/admin-order.service.ts): Tầng Service giao tiếp REST API, error normalizer, format VND, normalize status và tính toán KPI.
3. [`src/components/admin/orders/order-kpi-summary.tsx`](file:///d:/e-learning/src/components/admin/orders/order-kpi-summary.tsx): Component hiển thị 4 thẻ KPI tổng quan hệ thống.
4. [`src/components/admin/orders/order-filters-bar.tsx`](file:///d:/e-learning/src/components/admin/orders/order-filters-bar.tsx): Component thanh công cụ tìm kiếm và lọc trạng thái.
5. [`src/components/admin/orders/order-pagination.tsx`](file:///d:/e-learning/src/components/admin/orders/order-pagination.tsx): Component phân trang chuẩn server-side.
6. [`src/components/admin/orders/order-status-modal.tsx`](file:///d:/e-learning/src/components/admin/orders/order-status-modal.tsx): Modal xác nhận duyệt hoàn tất hoặc từ chối đơn hàng.
7. [`src/components/admin/orders/order-detail-modal.tsx`](file:///d:/e-learning/src/components/admin/orders/order-detail-modal.tsx): Modal hiển thị chi tiết toàn diện thông tin đơn hàng.
8. [`src/components/admin/orders/order-table.tsx`](file:///d:/e-learning/src/components/admin/orders/order-table.tsx): Component hiển thị bảng Desktop và danh sách thẻ Mobile với 6 trạng thái UX.
9. [`src/components/admin/orders/admin-orders-view.tsx`](file:///d:/e-learning/src/components/admin/orders/admin-orders-view.tsx): Client view điều phối trạng thái, API, bộ lọc, modal và thông báo.

---

## 14. Danh Sách Tệp Đã Sửa (Files Modified)

1. [`src/app/admin/orders/page.tsx`](file:///d:/e-learning/src/app/admin/orders/page.tsx): Thay thế placeholder card bằng Server Component render `<AdminOrdersView />` kèm metadata SEO tiêu chuẩn.

---

## 15. Thay Đổi Dependency (Dependency Changes)

- Không cài đặt thêm bất kỳ thư viện npm bên ngoài nào (`Zero new packages`).
- Tái sử dụng triệt để: `lucide-react`, `next/image`, `@/lib/api/client`, `@/lib/toast`, `@/lib/utils`.

---

## 16. Kết Quả Kiểm Tra Mã Nguồn (Code Review Results)

- **TypeScript compilation (`npx tsc --noEmit`)**: `PASS` (0 lỗi).
- **ESLint inspection (`npm run lint`)**: `PASS` (0 lỗi, 45 cảnh báo cũ về thẻ img đã tồn tại từ trước trong project). Đã xử lý triệt để cảnh báo `react-hooks/set-state-in-effect`.
- **Next.js Production Build (`npm run build`)**: `PASS` (0 lỗi, route `/admin/orders` được biên dịch thành công dưới dạng Static/Prerendered page).

---

## 17. Kết Quả Kiểm Thử Tích Hợp API (API Integration Test Results)

- `GET /api/orders/`: `PASS` — Lấy danh sách 29 đơn hàng ban đầu, trả về đầy đủ `orders` và `pagination`.
- `GET /api/orders/?status=pending`: `PASS` — Lọc chính xác 10 đơn hàng đang chờ duyệt.
- `GET /api/orders/?search=DH-3472365`: `PASS` — Tìm kiếm chính xác đơn hàng theo mã đơn.
- `PUT /api/orders/:id` (`{ status: "completed" }`): `PASS` — Duyệt thành công đơn hàng test `DH-3472365`, backend tự động cấp enrollment cho học viên.

---

## 18. Kết Quả Kiểm Thử Trình Duyệt (Browser Test Results)

Được thực hiện tự động qua `browser_subagent` ghi hình tại `admin_orders_e2e_1792493485335.webp`:
1. **Dashboard Loading**: `PASS` — Tiêu đề "Quản lý Đơn hàng", 4 thẻ KPI, bảng đơn hàng tải mượt mà.
2. **Search Verification**: `PASS` — Nhập `DH-3472365`, bảng hiển thị chính xác bản ghi đơn hàng test.
3. **Filter Verification**: `PASS` — Lọc theo tab "Chờ duyệt / thanh toán", bảng chỉ hiển thị các đơn hàng Pending.
4. **Order Detail Inspection**: `PASS` — Mở modal chi tiết hiển thị đầy đủ thông tin học viên, khóa học, đối soát thanh toán.
5. **Approval Workflow**: `PASS` — Mở modal duyệt đơn hàng, xác nhận duyệt thành công, toast hiển thị, đơn hàng chuyển sang trạng thái "Hoàn tất" và badge "Đã thanh toán".
6. **Mobile Viewport (390x844)**: `PASS` — Giao diện tự động co giãn sang dạng Card view gọn gàng, không bị tràn ngang.

---

## 19. Kết Quả Kiểm Thử Đầu Cuối (End-to-End Test Results)

- **Safe Test Data Compliance**: Không can thiệp hoặc thay đổi trạng thái của các đơn hàng có sẵn của học viên thật. Tạo đơn hàng thử nghiệm chỉ định (`DH-3472365`) và thực hiện duyệt trên đơn hàng này.
- **Workflow E2E**: `PASS` (Đăng nhập -> Xem danh sách -> Tìm kiếm -> Lọc -> Xem chi tiết -> Duyệt đơn -> Cập nhật danh sách & KPI).

---

## 20. Khoảng Trống Backend (Backend Gaps)

1. **[BACKEND GAP] Thiếu API Thống Kê Tổng Quan (Admin Statistics API)**:
   - Backend hiện tại chưa có endpoint `/api/admin/statistics` để tổng hợp nhanh doanh thu toàn sàn và tỷ lệ đơn hàng theo thời gian.
   - Frontend hiện đang tính số lượng đơn hàng qua `pagination.total` của các query status và ước tính doanh thu qua 100 đơn hoàn tất gần nhất. Cần backend bổ sung endpoint aggregate khi hệ thống mở rộng quy mô.
2. **[BACKEND GAP] Thiếu API Hoàn Tiền (Refund API)**:
   - Backend chưa có cơ chế hoàn tiền cho đơn hàng đã hoàn tất hoặc đơn hàng khiếu nại.
   - Frontend tuân thủ nguyên tắc không tạo nút hoàn tiền giả lập.
3. **[BACKEND GAP] Thiếu Chi Tiết Cổng Thanh Toán (Payment Gateway Metadata)**:
   - Schema Order của backend hiện chưa lưu trữ mã giao dịch cổng thanh toán (`transactionId`, `paymentGateway`: Stripe, VNPAY, MoMo).
   - Frontend hiển thị trạng thái thanh toán được suy diễn từ trạng thái đơn hàng theo đúng Source of Truth của backend.

---

## 21. Giới Hạn Đã Biết & Bản Sửa Sự Cố (Known Limitations & Bug Fixes)

- **Backend Hard Delete on Rejected**: Backend tự động xóa vĩnh viễn (hard delete) bản ghi đơn hàng khi trạng thái chuyển sang `rejected`. Do đó các đơn hàng bị từ chối sẽ không còn lưu trữ trong danh sách đối soát lịch sử.
- **Bug Fix — Null CourseId Safety**: Khắc phục lỗi `TypeError: Cannot read properties of null (reading 'slice')` khi bản ghi đơn hàng trong cơ sở dữ liệu có `courseId` là null/undefined. Đã bổ sung null-check an toàn và fallback trên Desktop, Mobile, Detail Modal và Status Modal.

---

## 22. Nhật Ký Thực Thi (Execution Trace)

### Workflow Used
- `feature-development.md` — **USED** (Thực hiện tuần tự: Phân tích -> Thẩm định contract -> Triển khai UI/Service -> Kiểm thử tự động -> Kiểm thử trình duyệt -> Báo cáo).

### Skills Used
- `page-implementation` — **USED** (Xây dựng Server Component `src/app/admin/orders/page.tsx` và Client Component `admin-orders-view.tsx`).
- `api-integration` — **USED** (Tích hợp chuẩn chỉnh với `GET /api/orders/` và `PUT /api/orders/:id`, chuẩn hóa mã lỗi).
- `stitch-ui` — **USED** (Tái sử dụng design system Modern Academic Violet, badges, cards, modals).
- `frontend-review` — **USED** (Audit toàn diện TypeScript strict mode, ESLint và Next.js production build).

---

## 23. Các Cổng Kiểm Soát (Workflow Gates)

- **Context Gate**: `PASS` (Đọc kỹ `AGENTS.md`, 6 bộ rules và API docs trong `api/`).
- **Scope Gate**: `PASS` (Chỉ tập trung vào module Admin Order Management, không can thiệp backend hay các module khác).
- **API/Backend Boundary Gate**: `PASS` (0 tệp backend bị sửa đổi, giao tiếp hoàn toàn qua REST API client).
- **Dependency Gate**: `PASS` (0 package mới được cài đặt).
- **Validation Gate**: `PASS` (`tsc --noEmit`, `npm run lint`, `npm run build` đều đạt 100%).
- **Testing Gate**: `PASS` (Kiểm thử an toàn với dữ liệu test chỉ định qua `browser_subagent`).

---

## 24. Giai Đoạn Đề Xuất Tiếp Theo (Next Recommended Phase)

- **Dừng tại đây (FINAL STOP)** theo đúng quy định của Phase F9.8.
- Chờ Quản trị viên / Người dùng nghiệm thu trước khi chuyển sang các phase tiếp theo trong module Quản trị hệ thống (Phase F9.9 hoặc các phase Admin tiếp theo).
