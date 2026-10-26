# TMDEMY PROGRESS REPORT — PHASE F7.1.0: COMMERCE BUSINESS LOGIC AUDIT

> **Ngày thực hiện**: 12/10/2026  
> **Người thực hiện**: Frontend AI Assistant (Antigravity)  
> **Phạm vi kiểm toán**: Nghiệp vụ Thương mại & Đặt hàng (`Order`, `Coupon`, `Payment`, `Enrollment`, `Access Control`)  
> **Backend Root**: `d:/e-learning_server` — *Audit trực tiếp source code, router, controller, service, Prisma schema*  
> **Frontend Root**: `d:/e-learning` — *Audit App Router, Services, Components, UX States*  
> **Chế độ**: **AUDIT ONLY** — *Không sửa source code, không cài package, không can thiệp database*

---

## 1. Executive Summary

Cuộc kiểm toán này làm rõ toàn diện kiến trúc nghiệp vụ và luồng dữ liệu mua khóa học trong hệ thống TMdemy giữa Backend và Frontend:

1. **Backend Order & Enrollment Architecture**:
   - Backend đã triển khai đầy đủ các endpoint: `POST /api/orders/`, `GET /api/orders/my`, `PUT /api/orders/:id`, `GET /api/orders/`, và `POST /api/coupons/use`.
   - Hệ thống áp dụng mô hình **1 khóa học / 1 đơn hàng (Single Course per Order)**. Trong cơ sở dữ liệu **hoàn toàn không có bảng `Cart`** (giỏ hàng).
   - Đơn hàng khóa học miễn phí (`total === 0`) hoặc đơn hàng áp dụng mã giảm giá 100% được backend tự động chuyển sang trạng thái **`COMPLETED` ngay lập tức** trong một giao dịch nguyên tử (`prisma.$transaction`), tự động tạo bản ghi **`Enrollment`**, thêm học viên vào nhóm chat của khóa học và tăng số lượng đã bán (`sold + 1`).
2. **Hiện trạng Cổng thanh toán (Payment Gateway)**:
   - **Backend CHƯA TÍCH HỢP bất kỳ cổng thanh toán tự động bên thứ ba nào** (chưa có VNPay, MoMo, Stripe, PayOS, hoặc Webhook).
   - Đơn hàng có phí (`total > 0`) khi được tạo sẽ có trạng thái ban đầu là **`PENDING`**. Việc chuyển sang `COMPLETED` hiện phụ thuộc vào Giảng viên sở hữu khóa học (`TEACHER`) hoặc Quản trị viên (`ADMIN`) gọi qua `PUT /api/orders/:id` sau khi xác nhận chuyển khoản ngân hàng thủ công.
3. **Lỗ hổng cốt lõi trên Frontend hiện tại**:
   - Khóa học miễn phí tại Course Detail hiện chỉ có thẻ Link trỏ trực tiếp sang `/learn/[slug]` mà **không gọi `POST /api/orders`**, dẫn đến việc không có bản ghi `Enrollment` trên cơ sở dữ liệu. Học viên vào học sẽ không lưu được tiến độ (`POST /api/progress/complete` trả về 403 Forbidden) và khóa học không xuất hiện trong `/my-courses`.
   - Khóa học trả phí tại Course Detail có nút *"Mua khóa học ngay"* đang trỏ tới `/checkout?course=slug` nhưng route `/checkout` chưa hề tồn tại (dẫn tới trang 404). Nút *"Thêm vào giỏ hàng"* không có logic xử lý.
   - Frontend chưa có `orderService`, chưa có `couponService` và chưa có trang lịch sử đơn hàng `/orders`.

---

## 2. Backend Order Flow

### 2.1 Điểm vào Endpoint: `POST /api/orders/`
- **File Router**: `d:/e-learning_server/src/routes/order.route.ts:14`
- **Controller**: `d:/e-learning_server/src/controller/order.controller.ts:9`
- **Service xử lý chính**: `d:/e-learning_server/src/services/order.service.ts:107` (`createOrderService`)
- **Yêu cầu Xác thực**: Bắt buộc Bearer JWT token (`verifyAccessToken`).
- **Tham số nhận vào (Body)**:
  ```json
  {
    "courseId": "uuid-v4",
    "couponCode": "SUMMER2026" // Tùy chọn
  }
  ```

### 2.2 Quy trình xác thực và kiểm tra nghiệp vụ (Validation Pipeline)
1. **Kiểm tra người dùng & khóa học**:
   - `isValidUUID(userId)` & `isValidUUID(courseId)`.
   - Khóa học phải tồn tại trong DB (`findCourseById`).
   - Khóa học không bị xóa mềm (`!course.isDestroyed`).
   - Khóa học đã được phê duyệt (`course.status !== 'PENDING'`).
   - Không cho phép người tạo tự mua khóa học của chính mình (`course.authorId !== userId`).
2. **Chống mua trùng lặp (Duplicate Prevention)**:
   - `checkExistingCompletedOrder(userId, courseId)`: Nếu học viên đã có đơn hàng `COMPLETED`, trả về `400 Bad Request` (*"You already enrolled in this course"*).
   - `checkExistingPendingOrder(userId, courseId)`: Nếu học viên đang có đơn hàng `PENDING` chưa xử lý cho khóa học này, trả về `400 Bad Request` (*"You already have a pending order for this course"*), đồng thời trả về thông tin đơn hàng pending đang chờ duyệt.
3. **Tính toán giá trị đơn hàng (Server-side Pricing Integrity)**:
   - Server lấy trực tiếp giá từ DB: `coursePrice = Number(course.price)`.
   - Server **không tin bất kỳ giá tiền nào từ frontend**.
   - Nếu có `couponCode`: Server gọi xác thực lại toàn bộ điều kiện coupon (hạn dùng, trạng thái kích hoạt, số lượt dùng, danh sách khóa áp dụng) và tính số tiền giảm:
     $$\text{total} = \max(\text{coursePrice} - \text{discount}, 0)$$
4. **Phân nhánh trạng thái đơn hàng**:
   - Nếu $\text{total} === 0$: Trạng thái đơn hàng là **`COMPLETED`**.
   - Nếu $\text{total} > 0$: Trạng thái đơn hàng là **`PENDING`**.

---

## 3. Backend Coupon Flow

### 3.1 Endpoint Kiểm tra trước mã giảm giá: `POST /api/coupons/use`
- **File Router**: `d:/e-learning_server/src/routes/coupon.route.ts`
- **Service xử lý**: `d:/e-learning_server/src/services/coupon.service.ts:285` (`checkCouponService`)
- **Tham số nhận vào**: `{ "code": "SUMMER2026", "courseId": "uuid" }`
- **Luật kiểm tra (Business Rules)**:
  1. `coupon.active === true`.
  2. Thời gian: $\text{startDate} \le \text{now} \le \text{endDate}$.
  3. Lượt sử dụng: $\text{used} < \text{limit}$ (nếu có giới hạn `limit`).
  4. Khóa học áp dụng:
     - Nếu `coupon.courses.length > 0`: Khóa học `courseId` bắt buộc phải nằm trong danh sách được chỉ định.
     - Nếu `coupon.courses.length === 0`: Coupon áp dụng cho tất cả các khóa học trên sàn.
  5. Tính toán giảm giá:
     - Nếu `type === 'PERCENTAGE'`: $\text{discount} = (\text{coursePrice} \times \text{value}) / 100$.
     - Nếu `type === 'NUMBER'`: $\text{discount} = \text{value}$.
  6. Kết quả trả về: `{ courseId, coursePrice, discount, finalPrice, coupon: { id, title, code, type, value } }`.

### 3.2 Tái kiểm tra khi tạo đơn hàng (Re-verification Guard)
Khi `POST /api/orders` được gọi, `order.service.ts` **kiểm tra lại 100% điều kiện coupon** từ cơ sở dữ liệu (`findCouponWithCoursesByCode`), ngăn chặn hoàn toàn việc frontend dùng lại mã đã hết hạn hoặc tự ý sửa đổi số tiền.

---

## 4. Backend Payment Flow

### 4.1 Hiện trạng Cổng thanh toán (Payment Gateway Verification)
- **Kết quả rà soát toàn bộ source code backend (`src/`)**:
  - Không có module tích hợp VNPay, MoMo, ZaloPay, PayOS, Stripe hay PayPal.
  - Không có webhook endpoint để nhận IPN (Instant Payment Notification).
- **Cơ chế thanh toán hiện có**:
  - Đơn hàng có phí được tạo với trạng thái `PENDING`.
  - Giảng viên (`TEACHER`) hoặc Quản trị viên (`ADMIN`) xác nhận thanh toán thủ công thông qua endpoint:
    `PUT /api/orders/:id` với body `{ "status": "completed" }` (`d:/e-learning_server/src/services/order.service.ts:320`).
  - Khi chuyển sang `COMPLETED`, backend thực hiện trong `prisma.$transaction`:
    1. Tăng số lượng đã bán của khóa học: `sold = sold + 1`.
    2. Tạo/cập nhật bản ghi ghi danh: `upsertEnrollment(userId, courseId, { progress: 0, status: 'ACTIVE' })`.
    3. Tăng số lượt dùng của coupon: `incrementCouponUsed(couponId, 1)` (nếu có dùng coupon).
    4. Cập nhật trạng thái đơn hàng sang `COMPLETED`.
    5. Tự động thêm học viên vào cuộc trò chuyện nhóm của khóa học (`Conversation`).
    6. Bắn thông báo (`pushNotificationService`) cho học viên: *"Đơn hàng 'DH-...' của bạn đã được hoàn tất!"*.

---

## 5. Free Course Flow (Quy trình Khóa học Miễn phí)

### 5.1 Luồng chuẩn từ Backend Source
```
[Course Detail] (price === 0)
       ↓
[Checkout / One-Click Enroll]
       ↓
POST /api/orders/ { courseId }
       ↓
Backend kiểm tra duplicate (completed/pending order)
       ↓
Backend tính total = 0
       ↓
prisma.$transaction()
  ├── Tạo Order (status = COMPLETED, total = 0)
  ├── Tăng course.sold = sold + 1
  └── Tạo Enrollment (status = ACTIVE, progress = 0)
       ↓
Trả về { success: true, statusCode: 201, data: { status: "completed" } }
       ↓
Frontend điều hướng trực tiếp sang Classroom /learn/[slug]
```

### 5.2 Lỗi nghiêm trọng tại Frontend hiện tại
- Tại `src/app/courses/[slug]/page.tsx:1034`, nút *"Đăng ký học miễn phí"* đang gắn trực tiếp thẻ `<Link href={'/learn/' + course.slug}>`.
- **Hậu quả**:
  - Không có request nào được gửi đến `/api/orders`.
  - Không có bản ghi `Order` và không có bản ghi `Enrollment` nào được tạo trong DB.
  - Khi học viên bấm học xong một bài trong Classroom, hàm `markLessonCompleteService` gọi `findEnrollmentByUserAndCourse(userId, courseId)` và ném lỗi **403 Forbidden: "You are not enrolled in this course"**.
  - Khóa học không bao giờ xuất hiện trong trang `/my-courses`.

---

## 6. Enrollment Flow & Lifecycle

1. **Khởi tạo Enrollment**:
   - Được tạo duy nhất thông qua `order.service.ts` khi đơn hàng đạt trạng thái `COMPLETED` (hoặc thông qua đơn hàng miễn phí ngay lúc tạo, hoặc khi Admin/Teacher duyệt đơn hàng có phí).
2. **Khóa composite duy nhất (Integrity Key)**:
   - Trong `prisma/schema.prisma:143`: `@@unique([userId, courseId])`.
   - Một học viên chỉ có thể có duy nhất 1 bản ghi `Enrollment` cho 1 khóa học.
3. **Cập nhật Tiến độ**:
   - Mỗi lần hoàn thành/hủy hoàn thành bài học qua `/api/progress/complete` hoặc `/uncomplete`, backend tính lại tổng số bài và cập nhật trường `progress` (0 - 100) trên bản ghi `Enrollment`.
   - Khi `progress === 100`: Trạng thái Enrollment tự động chuyển sang `status = COMPLETED` và gán `completedAt = now()`.
4. **Hủy ghi danh (Rollback & Kick)**:
   - Khi đơn hàng bị Admin/Teacher từ chối `PUT /api/orders/:id` với status `REJECTED`: Backend tự động xóa bản ghi `Enrollment`, giảm `sold = max(0, sold - 1)` và hoàn lại lượt dùng coupon.
   - Khi giảng viên xóa học viên khỏi khóa qua `DELETE /api/enrollments/course/:id/:userId`: Backend xóa bản ghi `Enrollment` và xóa cả bản ghi `Order` liên quan.

---

## 7. Access Control (Kiểm soát Quyền Truy cập)

Học viên được phép truy cập nội dung bài giảng trong Classroom khi thỏa mãn một trong các điều kiện sau:

| Đối tượng / Trường hợp | Quyền truy cập bài giảng | Quyền ghi nhận tiến độ (`Progress`) | Ghi chú |
| :--- | :---: | :---: | :--- |
| **Đã Enrollment hợp lệ (`ACTIVE`/`COMPLETED`)** | **Toàn quyền** xem tất cả bài học | **Có** | Học viên chính thức của khóa học. |
| **Bài học Demo (`isDemo = true`)** | Xem trước bài học được mở demo | **Không** (Trả 403 nếu chưa có Enrollment) | Học viên dùng thử trước khi mua. |
| **Tác giả khóa học (`authorId === userId`)** | **Toàn quyền** | Không cần | Giảng viên kiểm tra khóa học của mình. |
| **Quản trị viên (`role === 'ADMIN'`)** | **Toàn quyền** | Không cần | Kiểm duyệt nội dung. |
| **Khóa học miễn phí (`price === 0`)** | **Cần kích hoạt Enrollment** | **Có** (Sau khi tạo đơn hàng miễn phí) | Bắt buộc phải qua bước tạo Order miễn phí để sinh Enrollment. |
| **Chưa mua khóa học có phí** | **Bị khóa** (Chỉ xem bài Demo) | **Không** | Hiển thị thông báo yêu cầu mua khóa học. |

---

## 8. Transaction & Data Integrity

1. **Giao dịch cơ sở dữ liệu (`prisma.$transaction`)**:
   - Cả hai luồng hoàn thành đơn hàng (tự động cho đơn 0đ và thủ công qua PUT cho đơn có phí) đều bọc toàn bộ thao tác trong `prisma.$transaction`.
   - Đảm bảo nếu tạo Enrollment thất bại thì Order không bị đánh dấu COMPLETED, bảo đảm không có tình trạng "thu tiền/tạo đơn nhưng không được vào học".
2. **Khóa chống gửi request trùng lặp (Idempotency)**:
   - `checkExistingCompletedOrder`: Ngăn chặn việc bấm mua 2 lần cho cùng một khóa học đã sở hữu.
   - `checkExistingPendingOrder`: Nếu học viên đã bấm đặt hàng và đơn đang chờ duyệt, bấm lại sẽ nhận thông báo đơn đang chờ duyệt kèm data đơn hàng cũ, không tạo thêm bản ghi rác trong DB.
3. **Mã đơn hàng độc nhất (`order.code`)**:
   - Được sinh tự động theo quy tắc `DH-${Date.now().toString().slice(6)}` và có ràng buộc `@unique` trên PostgreSQL.

---

## 9. Frontend Current State (Hiện trạng Frontend)

| Hạng mục | Vị trí code / File | Hiện trạng thực tế | Đánh giá |
| :--- | :--- | :--- | :---: |
| **Nút Mua tại Course Detail** | `src/app/courses/[slug]/page.tsx:1044` | Trỏ tới `/checkout?course=${slug}` | **Dead Link (404)** |
| **Nút Học miễn phí tại Course Detail** | `src/app/courses/[slug]/page.tsx:1034` | Trỏ thẳng sang `/learn/${slug}` | **Lỗi nghiệp vụ (Không tạo Enrollment)** |
| **Nút Giỏ hàng tại Course Detail** | `src/app/courses/[slug]/page.tsx:1052` | Nút bấm không có sự kiện `onClick` | **Chưa hỗ trợ (Backend không có giỏ hàng)** |
| **Nút Yêu thích tại Course Detail** | `src/app/courses/[slug]/page.tsx:1058` | Chỉ đổi state local `isFavorited` | **Chưa tích hợp API** |
| **Route `/checkout`** | `src/app/checkout/` | Chưa tồn tại thư mục và file `page.tsx` | **Cần xây mới** |
| **Order Service** | `src/services/order.service.ts` | Chưa tồn tại | **Cần xây mới** |
| **Coupon Service** | `src/services/coupon.service.ts` | Chưa tồn tại | **Cần xây mới** |
| **Trang Lịch sử đơn hàng** | `src/app/orders/` | Chưa tồn tại | **Cần xây mới** |
| **Xác thực Token** | `src/lib/api/client.ts` | Sẵn sàng gửi Bearer token và silent refresh | **Tái sử dụng 100%** |
| **AuthContext** | `src/contexts/auth-context.tsx` | Đầy đủ trạng thái đăng nhập, user profile | **Tái sử dụng 100%** |
| **Toastify** | `src/lib/toast.ts` | Hoạt động ổn định không phụ thuộc thư viện ngoài | **Tái sử dụng 100%** |

---

## 10. API Contract vs Actual Implementation

| Endpoint | Đặc tả trong `api/ORDER_API.md` | Triển khai thực tế trong Backend | Khớp Contract |
| :--- | :--- | :--- | :---: |
| `POST /api/orders/` | `{ courseId, couponCode? }` | `createOrderService` kiểm tra duplicate, coupon, free order transaction | **100% KHỚP** |
| `GET /api/orders/my` | Phân trang `page`, `limit`, `status` | `getMyOrdersService` trả về danh sách đơn hàng của user | **100% KHỚP** |
| `PUT /api/orders/:id` | Cập nhật status `completed`/`rejected` | `updateOrderStatusService` rollback/upsert enrollment, check quyền giáo viên/admin | **100% KHỚP** |
| `GET /api/orders/` | Danh sách toàn sàn cho Teacher/Admin | `getOrdersService` cách ly dữ liệu giữa các giáo viên | **100% KHỚP** |
| `POST /api/coupons/use`| `{ code, courseId }` | `checkCouponService` trả về `discount`, `finalPrice` | **100% KHỚP** |

---

## 11. Backend Gaps (Ghi nhận)

1. **Thiếu Cổng thanh toán Tự động (Payment Gateway)**:
   - Backend hiện tại chưa có tích hợp VNPay, MoMo hay PayOS. Đơn hàng trả phí phải chờ Giảng viên hoặc Admin duyệt thủ công sang `completed`.
2. **Không có Khái niệm Giỏ hàng (Cart)**:
   - Backend chỉ hỗ trợ thanh toán từng khóa học đơn lẻ (`courseId` trong model `Order`). Nếu frontend muốn hỗ trợ mua nhiều khóa cùng lúc, frontend sẽ cần thực hiện tuần tự hoặc backend phải nâng cấp hỗ trợ `orderItems`.
3. **Thiếu Giới hạn Coupon trên từng người dùng (`perUserLimit`)**:
   - Model `Coupon` chỉ có trường `limit` (tổng số lần toàn sàn) và `used`, chưa có bảng `UserCoupon` để giới hạn mỗi học viên chỉ được dùng mã một lần.

---

## 12. Frontend Gaps (Ghi nhận)

1. **Thiếu màn hình `/checkout`**:
   - Cần xây dựng màn hình thanh toán tiếp nhận param `?course=[slug]`, hiển thị tóm tắt khóa học, giá gốc, ô nhập mã coupon, giá sau giảm và các phương thức thanh toán.
2. **Thiếu xử lý Một Chạm cho Khóa học Miễn phí (One-Click Free Enroll)**:
   - Tại Course Detail hoặc Checkout, nếu khóa học có giá 0đ, cần có modal/nút gọi `POST /api/orders` ngay để kích hoạt `Enrollment` và chuyển thẳng học viên vào Classroom mà không bắt đi qua các bước thanh toán rườm rà.
3. **Thiếu Service gọi API**:
   - Cần tạo `src/services/order.service.ts` và `src/services/coupon.service.ts`.
4. **Thiếu Màn hình Lịch sử Đơn hàng (`/orders`)**:
   - Học viên cần xem lại mã đơn hàng, trạng thái (Đang chờ xử lý / Đã hoàn tất) và thông tin chuyển khoản.

---

## 13. Đề Xuất Kiến Trúc Màn Hình Checkout (Checkout UI Architecture)

Dựa trên thiết kế Stitch và nguyên tắc TMdemy Design System, màn hình `/checkout` được kiến trúc theo bố cục 2 cột (Desktop) và 1 cột (Mobile):

```
┌────────────────────────────────────────────────────────────────────────┐
│                        TMdemy Navigation Header                        │
├────────────────────────────────────────┬───────────────────────────────┤
│ CỘT TRÁI (7 CỘT): PHƯƠNG THỨC THANH TOÁN │ CỘT PHẢI (5 CỘT): TÓM TẮT ĐƠN │
├────────────────────────────────────────┼───────────────────────────────┤
│ 1. Thông tin học viên (Tên, Email)    │ 1. Card thông tin khóa học    │
│ 2. Lựa chọn phương thức thanh toán:    │    (Thumbnail, Tiêu đề, GV)   │
│    - Chuyển khoản Ngân hàng (QR Code)  │ 2. Ô nhập Mã giảm giá (Coupon)│
│    - Thẻ ATM / Internet Banking        │    + Nút "Áp dụng" (Real API) │
│    - (Tự động 0đ nếu là khóa miễn phí) │ 3. Bảng phân tích chi phí:    │
│ 3. Hướng dẫn chuyển khoản:             │    - Giá gốc: 699.000 đ       │
│    - Ngân hàng, Số TK, Tên chủ TK      │    - Giảm giá: -100.000 đ     │
│    - Nội dung: Mã đơn hàng (DH-xxxxx)  │    - TỔNG THANH TOÁN: 599.000đ│
│ 4. Nút bấm: "Xác nhận đặt hàng"        │ 4. Cam kết & Bảo mật hoàn tiền│
└────────────────────────────────────────┴───────────────────────────────┘
```

### Quy trình Điều hướng (Navigation Flow):
1. **Nếu chưa đăng nhập**: Chuyển hướng tới `/login?redirect=/checkout?course=[slug]`.
2. **Nếu đã sở hữu khóa học (`isEnrolled`)**: Hiển thị thông báo *"Bạn đã sở hữu khóa học này"* kèm nút chuyển thẳng sang `/learn/[slug]`.
3. **Nếu khóa học Miễn phí (`price === 0`)**:
   - Hiển thị giao diện kích hoạt ghi danh miễn phí 1-click.
   - Bấm nút -> gọi `POST /api/orders` -> nhận `status: COMPLETED` -> toast thành công -> chuyển sang Classroom.
4. **Nếu khóa học Có phí (`price > 0`)**:
   - Bấm nút đặt hàng -> gọi `POST /api/orders` -> nhận `status: PENDING` và mã đơn `DH-xxxxx`.
   - Hiển thị màn hình xác nhận đơn hàng thành công kèm hướng dẫn chuyển khoản ngân hàng và mã QR thanh toán.

---

## 14. Danh Mục Test Cases Bắt Buộc Cho Phase F7.1

| Test ID | Tên kịch bản | Kỳ vọng thực tế |
| :---: | :--- | :--- |
| **CO-01** | Guest bấm Mua khóa học | Chuyển hướng sang `/login?redirect=/checkout?course=[slug]` |
| **CO-02** | User đã mua bấm lại Mua khóa học | Hệ thống nhận diện đã ghi danh, dẫn sang `/learn/[slug]`, không cho mua trùng |
| **CO-03** | Đăng ký Khóa học Miễn phí (0đ) | Gọi `POST /api/orders`, backend tạo Enrollment tự động, chuyển thẳng vào Classroom xem được bài học |
| **CO-04** | Nhập mã Coupon hợp lệ | Gọi `POST /api/coupons/use`, hiển thị đúng số tiền giảm và giá cuối cùng |
| **CO-05** | Nhập mã Coupon không hợp lệ / hết hạn | Hiển thị thông báo lỗi tiếng Việt thân thiện, không trừ tiền sai |
| **CO-06** | Đặt hàng Khóa học Có phí | Gọi `POST /api/orders`, tạo đơn trạng thái `PENDING`, hiển thị mã đơn hàng và hướng dẫn chuyển khoản |
| **CO-07** | Đặt hàng khi đang có đơn PENDING | Backend chặn báo lỗi đã có đơn chờ duyệt, frontend hiển thị thông tin đơn cũ |
| **CO-08** | Lịch sử đơn hàng cá nhân | Hiển thị danh sách các đơn đã đặt qua `GET /api/orders/my` |
| **CO-09** | Responsive Mobile | Màn hình Checkout hiển thị hoàn hảo trên màn hình di động (375px) |

---

## 15. Những Quyết Định Cần Chủ Dự Án Phê Duyệt

Trước khi bắt tay vào triển khai code Phase F7.1 (Checkout UI & Order Integration), các quyết định chiến lược sau cần được thống nhất:

1. **Phương thức thanh toán cho Khóa học Có phí**:
   - Vì backend chưa có cổng thanh toán tự động (VNPay/MoMo), frontend sẽ áp dụng mô hình **Chuyển khoản Ngân hàng (VietQR / Chuyển khoản thủ công)**:
     - Học viên đặt hàng -> Nhận mã đơn hàng `DH-xxxx` và mã QR ngân hàng -> Đơn hàng ở trạng thái `PENDING` -> Chờ Giảng viên/Admin xác nhận.
   - *Chủ dự án có đồng ý với phương án thanh toán chuyển khoản hiển thị QR Code này không?*
2. **Nút "Thêm vào giỏ hàng" tại Course Detail**:
   - Backend hiện tại thiết kế `Order` theo từng khóa học đơn lẻ (không có bảng `Cart`).
   - *Đề xuất*: Ẩn nút "Thêm vào giỏ hàng" hoặc thay thế bằng nút "Mua ngay" và "Yêu thích" để tránh gây hiểu nhầm về tính năng giỏ hàng đa sản phẩm.
3. **Luồng Khóa học Miễn phí (Free Course)**:
   - *Đề xuất*: Khi bấm "Đăng ký học miễn phí" tại Course Detail, hiển thị một modal xác nhận nhỏ "Xác nhận ghi danh miễn phí" rồi gọi ngay `POST /api/orders` để kích hoạt Enrollment và đưa thẳng vào Classroom.

---

> **Trạng thái**: Đã hoàn thành toàn bộ nội dung audit nghiệp vụ thương mại theo yêu cầu. **DỪNG LẠI THEO QUY TẮC ĐỂ CHỜ CHỦ DỰ ÁN PHÊ DUYỆT TRƯỚC KHI TRIỂN KHAI CHECKOUT.**
