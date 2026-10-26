# TMdemy — Phase F9.7 Progress Report
## Admin Coupon Management

**Report Date:** 2026-10-20  
**Phase:** `Phase F9.7 — Admin Coupon Management`  
**Route:** `/admin/coupons`  
**Target Repository:** `D:\e-learning` (Frontend only)  
**Status:** **COMPLETED & VERIFIED**

---

## 1. Summary

Phase F9.7 đã hoàn thành triển khai toàn diện module **Admin Coupon Management** (Quản lý Mã giảm giá & Ưu đãi) dành cho Quản trị viên (Admin) trên nền tảng TMdemy tại route `/admin/coupons`.

Module được xây dựng dựa trên API Contract thực tế (`api/COUPON_API.md`, `api/ADMIN_API.md`, `api/ORDER_API.md`), tuân thủ ranh giới Frontend - Backend tuyệt đối, kiến trúc Next.js App Router (Server Component wrapper + Client leaf components), hệ màu **Modern Academic Violet** (`#7240b8`, `#a87ffb`), và hệ thống shadcn/ui.

Module hỗ trợ đầy đủ các tính năng:
- **Coupon Listing**: Danh sách mã giảm giá dạng bảng trên Desktop và card view thích ứng trên Mobile/Tablet.
- **KPI Summary Cards**: Thống kê 4 chỉ số theo thời gian thực (Tổng số mã giảm giá, Đang kích hoạt, Đã vô hiệu hóa, và Tổng lượt đã sử dụng).
- **Debounced Search**: Tìm kiếm tức thì theo mã code hoặc tiêu đề ưu đãi với debounce 400ms, chống race condition bằng `AbortController`, có nút reset nhanh.
- **Multi-criteria Filters**: Lọc theo trạng thái (`active`/`inactive`), loại chiết khấu (`percentage`/`number`), phạm vi áp dụng (`Toàn sàn`/`Khóa học chỉ định`), và thời hạn hiệu lực (`Đang hiệu lực`, `Sắp diễn ra`, `Đã hết hạn`, `Hết lượt`).
- **Server-Side Pagination**: Bộ phân trang chuẩn đồng nhất với User/Course/Category management (`w-8 h-8`, bộ chọn 10/20/50 bản ghi/trang, hiển thị khoảng bản ghi `startRecord - endRecord`).
- **Coupon Detail Modal**: Xem chi tiết siêu dữ liệu (Mã, Tiêu đề, Mức giảm, Lượt dùng/Giới hạn kèm thanh tiến độ, Ngày bắt đầu/kết thúc, Thông tin người tạo, và danh sách các khóa học áp dụng kèm liên kết).
- **Create Coupon Modal**: Form tạo mã với chức năng sinh mã ngẫu nhiên (`TMDEMY2026_XYZ`), chọn loại phần trăm (%) hoặc số tiền cố định (VNĐ), chọn phạm vi toàn sàn (`courses: []`) hoặc chọn khóa học chỉ định từ API khóa học của hệ thống, chọn thời hạn bằng các nút preset (7 ngày, 14 ngày, 30 ngày, 3 tháng, vô thời hạn).
- **Edit Coupon Modal**: Prefill toàn bộ thông tin mã giảm giá, kiểm tra chênh lệch dữ liệu (diff check), cảnh báo khi mã đã có lượt dùng, cập nhật an toàn.
- **Delete Coupon Modal**: Hộp thoại xác nhận xóa vĩnh viễn an toàn, hiển thị cảnh báo nghiệp vụ nếu mã đã có lượt sử dụng trong các đơn hàng trước đây.
- **Quick Status Toggle**: Công tắc bật/tắt kích hoạt (`active = true/false`) trực tiếp trên bảng dữ liệu kèm spinner và phản hồi toast.
- **Full 6 UX States**: Loading skeletons, Empty states (phân biệt chưa có dữ liệu và không tìm thấy theo bộ lọc), Error states có nút thử lại (Retry), Disabled states khi đang gửi mutation, Success toast feedback.

---

## 2. Existing Implementation Audit

Trước khi code, đã tiến hành khảo sát các thành phần hiện có:
- `src/app/admin/coupons/page.tsx`: Trước đó chỉ là Placeholder Card từ Phase F9.2. Đã được nâng cấp thành trang Server Component chuẩn.
- `src/types/coupon.ts`: Đã có các types cơ bản từ module Teacher/Order.
- `src/services/coupon.service.ts`: Đã có các hàm REST API cơ bản.
- `src/components/teacher/coupons/`: Đã có giao diện mã giảm giá dành cho Giảng viên (giới hạn trong các khóa học do chính giảng viên sở hữu).
- `src/components/admin/categories/` & `src/components/admin/courses/`: Mẫu thiết kế chuẩn của Admin shell, tông màu Modern Academic Violet, cấu trúc modal, pagination, và error normalizer.

**Bảng trả lời 10 câu hỏi khảo sát:**
1. *Coupon page đã có gì?* Placeholder card với icon Ticket từ F9.2.
2. *Coupon API service đã có gì?* Các phương thức CRUD cơ bản trong `coupon.service.ts`.
3. *CRUD operations đã có hay chưa?* Backend hỗ trợ đầy đủ `GET /api/coupons/`, `GET /api/coupons/:id`, `POST /api/coupons/`, `PUT /api/coupons/:id`, `DELETE /api/coupons/:id`.
4. *Các loại giảm giá backend hỗ trợ?* `percentage` (phần trăm) và `number` (số tiền cố định VNĐ). Backend trả về enum dạng case-insensitive (`PERCENTAGE` / `NUMBER`).
5. *Các trường cấu hình thực tế?* `title`, `code`, `type`, `value`, `limit`, `used`, `startDate`, `endDate`, `active`, `courses`, `author`, `createdAt`, `updatedAt`.
6. *Coupon có thể áp dụng toàn bộ khóa học hay chỉ khóa học cụ thể?* Cả hai: Admin có thể tạo coupon Toàn sàn (`courses: []`) hoặc Khóa học cụ thể (`courses: [uuid1, uuid2]`).
7. *Coupon có giới hạn lượt sử dụng không?* Có: trường `limit` (tổng số lượt sử dụng tối đa) và `used` (số lượt đã dùng).
8. *Coupon có giới hạn mỗi User không?* Không có trường per-user limit trong backend contract hiện tại (chỉ có limit tổng).
9. *Coupon có thời gian bắt đầu và kết thúc không?* Có: `startDate` và `endDate` (ISO 8601 strings).
10. *Backend quản lý trạng thái active/expired/disabled như thế nào?* Cờ `active: boolean` kết hợp với kiểm tra thời gian thực `startDate <= now <= endDate` và `used < limit`.

---

## 3. Coupon API Contract Mapping

| Chức năng | API Method & Endpoint | Contract Reference | Status | Ghi chú |
|---|---|---|---|---|
| Lấy danh sách Coupon | `GET /api/coupons/` | `api/COUPON_API.md` (Sec 3) | **VERIFIED** | Hỗ trợ `page`, `limit`, `search`, `active`. Admin xem toàn bộ mã. |
| Chi tiết Coupon | `GET /api/coupons/:id` | `api/COUPON_API.md` (Sec 4) | **VERIFIED** | Trả về thông tin chi tiết kèm `courses` và `author`. |
| Tạo Coupon mới | `POST /api/coupons/` | `api/COUPON_API.md` (Sec 1) | **VERIFIED** | Body: `{ title, code, type, value, limit, startDate, endDate, active, courses }`. Hỗ trợ `courses: []` cho Admin. |
| Cập nhật Coupon | `PUT /api/coupons/:id` | `api/COUPON_API.md` (Sec 5) | **VERIFIED** | Hỗ trợ cập nhật tiêu đề, code, giá trị, hạn mức, thời gian, trạng thái, danh sách khóa học. |
| Xóa Coupon | `DELETE /api/coupons/:id` | `api/COUPON_API.md` (Sec 6) | **VERIFIED** | Hard-delete khỏi DB. Trả về `{ success: true, message: "Coupon deleted successfully" }`. |
| Khóa học cho Picker | `GET /api/admin/courses` | `api/ADMIN_API.md` (Sec 2.1) | **VERIFIED** | Lấy danh sách khóa học đã duyệt để Admin gắn mã ưu đãi chỉ định. |

---

## 4. Coupon Listing

- Đường dẫn: `/admin/coupons`.
- Giao diện hai tầng:
  - **Desktop ($\ge 1024px$)**: Bảng dữ liệu toàn diện với 7 cột:
    - *Mã & Tiêu đề*: Badge font mono, nút copy mã nhanh, tác giả tạo mã, tiêu đề chiến dịch.
    - *Mức giảm*: Số tiền VNĐ hoặc phần trăm (%) kèm nhãn loại.
    - *Phạm vi*: Badge "Toàn sàn" (icon Globe) hoặc "X khóa học" (icon BookOpen).
    - *Lượt dùng*: Tỷ lệ `used / limit` kèm thanh tiến độ phân màu trực quan.
    - *Thời hạn*: Ngày kết thúc và badge trạng thái hiệu lực (Đang hiệu lực / Sắp diễn ra / Hết hạn / Hết lượt).
    - *Trạng thái*: Switch toggle bật/tắt kích hoạt tức thì.
    - *Thao tác*: Nút Xem chi tiết (`Eye`), Chỉnh sửa (`Edit2`), Xóa (`Trash2`).
  - **Mobile / Tablet ($< 1024px$)**: Card view phân cấp rõ ràng, dễ chạm cảm ứng ($\ge 44px$), tối ưu hiển thị trên màn hình nhỏ.

---

## 5. Search, Filter & Pagination

- **Search**: Debounce 400ms, tự động reset về page 1 khi từ khóa thay đổi, chống race condition bằng `AbortController`.
- **Filters**:
  - Trạng thái: Tất cả / Đang kích hoạt / Đã vô hiệu hóa (server-side query `active=true/false`).
  - Loại chiết khấu: Tất cả / Phần trăm (%) / Số tiền cố định (VNĐ).
  - Phạm vi áp dụng: Tất cả / Toàn sàn / Khóa học chỉ định.
  - Thời hạn hiệu lực: Tất cả / Đang hiệu lực / Sắp diễn ra / Đã hết hạn / Hết lượt dùng.
  - Nút "Đặt lại bộ lọc" xuất hiện khi có bất kỳ điều kiện lọc nào đang kích hoạt.
- **Pagination**: Phân trang chuẩn với bộ chọn 10, 20, 50 bản ghi/trang, hiển thị khoảng bản ghi `startRecord - endRecord` trên tổng số.

---

## 6. Create Coupon

- Mở bằng modal `CreateCouponModal` với thiết kế 4 phân đoạn trực quan:
  1. *Thông tin cơ bản*: Tiêu đề, Mã code (auto uppercase, regex `^[A-Z0-9_-]+$`), nút "Sinh mã" tự động (`TMDEMY2026_XYZ`).
  2. *Mức chiết khấu*: Chuyển đổi giữa % (1-100%) và VNĐ ($\ge 1,000$đ).
  3. *Phạm vi áp dụng*: Chọn Toàn sàn (`courses: []`) hoặc Khóa học chỉ định với bộ chọn khóa học đa năng (tìm kiếm, chọn nhiều, hiển thị giá).
  4. *Hạn mức & Thời hạn*: Tùy chọn Không giới hạn lượt dùng hoặc nhập số lượng tối đa; chọn ngày bắt đầu / kết thúc với các nút preset tiện lợi (7 ngày, 14 ngày, 30 ngày, 3 tháng, vô thời hạn).
- Validation: Kiểm tra bắt buộc, format mã, giới hạn phần trăm $\le 100$, ngày kết thúc $\ge$ ngày bắt đầu, chống trùng lặp mã (bắt mã lỗi 400 từ backend).
- Anti-double submit: Vô hiệu hóa nút và hiển thị spinner trong khi gửi request.

---

## 7. Update Coupon

- Mở bằng modal `EditCouponModal`.
- Prefill toàn bộ dữ liệu hiện tại của coupon khi mở modal.
- Diff check: Cảnh báo và không gửi request thừa nếu người dùng không thay đổi bất kỳ trường nào.
- Cảnh báo nghiệp vụ: Khi coupon đã có `used > 0`, hiển thị banner lưu ý và ngăn người dùng đặt `limit < used`.
- Sau khi cập nhật thành công: Đóng modal, hiển thị toast thông báo, cập nhật state cục bộ và tải lại KPI.

---

## 8. Delete Coupon

- Mở bằng hộp thoại xác nhận `DeleteCouponModal`.
- Hiển thị đầy đủ thông tin: Mã code, Tiêu đề, Mức giảm, Số lượt đã sử dụng.
- **Safe Data Policy**: Nếu mã đã có `used > 0`, hiển thị cảnh báo rủi ro về lịch sử đơn hàng và khuyến nghị Vô hiệu hóa thay vì xóa vĩnh viễn.
- Xóa vĩnh viễn thông qua `DELETE /api/coupons/:id`.
- Tự động điều chỉnh trang (`page`) nếu xóa item cuối cùng của trang hiện tại.

---

## 9. Coupon Business Rules

Frontend tuân thủ triệt để các quy tắc nghiệp vụ định nghĩa trong contract:
1. `type`: `percentage` (1-100%) hoặc `number` ($\ge 1,000$đ).
2. `code`: Duy nhất trên toàn hệ thống (bắt lỗi duplicate code trả về 400).
3. `active`: Cờ kiểm soát khả năng sử dụng của học viên.
4. Thời hạn hiệu lực: Tự động phân loại `active`, `upcoming`, `expired`, `exhausted`, `disabled`.
5. Phạm vi Admin: Cho phép tạo mã toàn sàn (`courses: []`) không giới hạn bởi quyền sở hữu khóa học của giảng viên.

---

## 10. Error Handling

Tuân thủ bảng xử lý mã lỗi HTTP chuẩn qua `normalizeCouponApiError`:
- **400 Bad Request**: Bắt các lỗi nghiệp vụ cụ thể ("Coupon code already exists", lỗi khoảng ngày, hạn mức âm).
- **401 Unauthorized**: Tự động xử lý qua auth interceptor / refresh token.
- **403 Forbidden**: Thông báo người dùng không đủ quyền Quản trị viên.
- **404 Not Found**: Thông báo mã giảm giá không tồn tại hoặc đã bị xóa.
- **409 Conflict**: Thông báo xung đột dữ liệu mã giảm giá.
- **422 Unprocessable Entity**: Lỗi ràng buộc dữ liệu.
- **500 Server Error**: Thông báo sự cố máy chủ nội bộ.
- **Network / Timeout Error**: Bắt lỗi mất kết nối hoặc quá thời gian chờ.

---

## 11. State Consistency

Luồng đồng bộ trạng thái sau các thao tác mutation:
```text
Thao tác (Create / Edit / Delete / Toggle)
        ↓
Gửi request qua adminCouponService
        ↓
Nhận phản hồi thành công từ Backend
        ↓
Hiển thị Toast thông báo
        ↓
Đóng Modal
        ↓
Cập nhật Local State & Reload Table Listing
        ↓
Tải lại số liệu KPI (fetchKpis)
```

---

## 12. UI/UX & Stitch Compliance

- Tông màu: **Modern Academic Violet** (`#7240b8`, hover `#5d3299`, light `#f7f1ff`, dark text `#a87ffb`).
- Nền trang: `bg-[#fdf8ff]` (dark: `dark:bg-[#131118]`).
- Khung thẻ & Bảng: `bg-white` (dark: `dark:bg-[#1d1926]`), viền `border-[#f1ebff]` (dark: `dark:border-[#2b2438]`).
- Bố cục responsive: Đã tối ưu cho Desktop ($\ge 1024px$), Tablet ($768px - 1023px$) và Mobile ($< 768px$).
- Trợ năng (a11y): Các nút bấm có `aria-label`, modal có `role="dialog"`, hỗ trợ phím Escape đóng modal.

---

## 13. Files Created & Modified

### Files Created:
1. `src/types/admin-coupon.ts`: Định nghĩa types và DTOs cho Admin Coupon.
2. `src/services/admin-coupon.service.ts`: Service giao tiếp API, chuẩn hóa lỗi và truy vấn KPI.
3. `src/components/admin/coupons/admin-coupons-view.tsx`: Root client view điều phối module.
4. `src/components/admin/coupons/coupon-kpi-summary.tsx`: 4 thẻ thống kê KPI tổng quan.
5. `src/components/admin/coupons/coupon-filters-bar.tsx`: Thanh tìm kiếm debounced và bộ lọc đa điều kiện.
6. `src/components/admin/coupons/coupon-table.tsx`: Bảng dữ liệu Desktop và danh sách Card Mobile.
7. `src/components/admin/coupons/coupon-pagination.tsx`: Bộ phân trang chuẩn.
8. `src/components/admin/coupons/coupon-detail-modal.tsx`: Modal xem chi tiết mã và khóa học áp dụng.
9. `src/components/admin/coupons/create-coupon-modal.tsx`: Modal tạo mã giảm giá mới.
10. `src/components/admin/coupons/edit-coupon-modal.tsx`: Modal chỉnh sửa mã giảm giá.
11. `src/components/admin/coupons/delete-coupon-modal.tsx`: Hộp thoại xác nhận xóa an toàn.

### Files Modified:
1. `src/app/admin/coupons/page.tsx`: Thay thế placeholder card bằng Server Component render `<AdminCouponsView />` với SEO metadata hoàn chỉnh.

### Dependency Changes:
- **Không có package npm mới nào được cài đặt** (Tuân thủ tuyệt đối Rule 00 & Rule 04).

---

## 14. Validation Results

| Lệnh kiểm tra | Kết quả | Chi tiết |
|---|---|---|
| `npx tsc --noEmit` | **PASS** | 0 lỗi kiểu dữ liệu TypeScript |
| `npm run lint` | **PASS** | 0 lỗi ESLint trên toàn bộ dự án |
| `npm run build` | **PASS** | Biên dịch Next.js thành công 39/39 routes (bao gồm `/admin/coupons`) |

---

## 15. Testing Results

### 1. Code Review (`frontend-review`): **PASS**
- Không có `any`, không có `@ts-ignore`.
- Server Component / Client Component phân tách đúng ranh giới.
- Bao phủ đầy đủ 6 trạng thái UX.

### 2. API Integration Test: **PASS**
- Kiểm tra trực tiếp các endpoint với token quản trị viên:
  - `GET /api/coupons/` -> Status 200, phân trang và tìm kiếm hoạt động chuẩn xác.
  - `GET /api/coupons/:id` -> Status 200, nạp đầy đủ thông tin khóa học và tác giả.
  - `POST /api/coupons/` -> Status 201, tạo mã toàn sàn và theo khóa học thành công.
  - `PUT /api/coupons/:id` -> Status 200, cập nhật thành công.
  - `DELETE /api/coupons/:id` -> Status 200, xóa thành công.

### 3. Browser & End-to-End Test: **PASS**
- Thực hiện tự động bằng `browser_subagent` trên trình duyệt Chromium thực tế:
  - Đăng nhập tài khoản Admin: `thaiminh0612@gmail.com` / `quangminh2004`.
  - Điều hướng tới `/admin/coupons`.
  - Xác minh hiển thị giao diện: Header, 4 thẻ KPI, thanh tìm kiếm, bộ lọc và bảng dữ liệu.
  - Tạo mã giảm giá mới `E2E_AUTO_TEST` (25%, phạm vi toàn sàn, hạn mức 30) -> Thành công, xuất hiện ngay trên bảng.
  - Mở modal xem chi tiết (`Xem chi tiết`) -> Hiển thị chính xác thông tin.
  - Mở modal chỉnh sửa (`Chỉnh sửa`), đổi tiêu đề -> Cập nhật thành công.
  - Mở modal xóa (`Xóa mã`), xác nhận xóa -> Xóa an toàn thành công, mã biến mất khỏi bảng và KPI tự động cập nhật.
- Video ghi hình phiên kiểm thử:
  - File: `C:\Users\MINH\.gemini\antigravity-ide\brain\79470128-1734-4760-9035-e7c10cb1312e\admin_coupons_e2e_1792492260241.webp`

---

## 16. Backend Gaps & Limitations

### [BACKEND GAP]
1. **Per-user Usage Limit**: Backend chỉ hỗ trợ tổng số lượt dùng (`limit`), chưa có trường giới hạn số lần sử dụng trên từng học viên (`usageLimitPerUser`). Frontend đã ghi chú rõ trong form và không tự ý gửi trường ảo.
2. **Server-side Filter for Scope & Validity**: `GET /api/coupons/` chỉ hỗ trợ query params `page`, `limit`, `search`, `active`. Bộ lọc theo loại chiết khấu, phạm vi (toàn sàn vs khóa học), và trạng thái hết hạn được frontend xử lý bổ sung linh hoạt ở client-side trên tập dữ liệu đã tải.

---

## 17. Execution Trace

### Workflow Used
- `feature-development.md` — **USED** (Thực thi chuẩn chỉnh qua 6 bước và 5 Cổng kiểm soát).

### Skills Used
- `page-implementation` — **USED** (Tái cấu trúc `/admin/coupons` thành RSC và leaf Client Components).
- `api-integration` — **USED** (Tích hợp `adminCouponService` dựa trên `api/COUPON_API.md` và `api/ADMIN_API.md`).
- `stitch-ui` — **USED** (Bảo toàn ngôn ngữ thiết kế Modern Academic Violet, bảng dữ liệu, cards, và modals).
- `frontend-review` — **USED** (Rà soát 10 khía cạnh chất lượng, khắc phục dứt điểm warning/lint).

### Workflow Gates
- **Context Gate**: **PASS** (Đặc tả nghiệp vụ rõ ràng, đối chiếu đầy đủ tài liệu API).
- **Scope Gate**: **PASS** (Chỉ làm việc trong module `/admin/coupons`, không can thiệp backend, không sửa ngoài lề).
- **API Boundary Gate**: **PASS** (Tuân thủ ranh giới REST API, không import backend code).
- **Dependency Gate**: **PASS** (Không cài đặt thêm package npm mới).
- **Validation Gate**: **PASS** (`tsc`, `lint`, `build` đều đạt 0 lỗi).
- **Testing Gate**: **PASS** (E2E browser test hoàn thành trọn vẹn chu trình CRUD).

---

## 18. Next Recommended Phase

- Dừng lại tại đây theo đúng nguyên tắc **Rule 00 & Rule 01**.
- Chờ Quản trị viên duyệt nghiệm thu Phase F9.7.
- Phase tiếp theo khuyến nghị: **Phase F9.8 — Admin Order Management** (Quản lý đơn hàng, doanh thu và giao dịch thanh toán toàn hệ thống).
