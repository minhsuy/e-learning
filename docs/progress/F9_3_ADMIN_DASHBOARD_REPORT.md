# Báo Cáo Triển Khai: Phase F9.3 — Admin Dashboard (Overview & Quick Actions)

> **Dự án**: TMdemy — E-learning Platform Frontend  
> **Repository**: `D:\e-learning`  
> **Phân hệ**: Admin Portal  
> **Trạng thái**: **COMPLETED (Hoàn thành)**  
> **Ngày thực hiện**: 19/10/2026  

---

## 1. Status

Phase **F9.3 — Admin Dashboard (Overview & Quick Actions)** đã hoàn thành toàn diện 100% mục tiêu:
- Tích hợp **100% dữ liệu thật từ Backend API** (không sử dụng mock data hay hardcode số liệu).
- Triển khai đầy đủ **6 KPI Cards** với dữ liệu tổng toàn hệ thống chính xác (`pagination.total`).
- Triển khai **Khóa học chờ phê duyệt** với thumbnail, tiêu đề, giảng viên, giá, ngày tạo và huy hiệu trạng thái.
- Triển khai **Đơn hàng cần xử lý** với mã đơn, tên khóa học, khách hàng, tổng tiền VND và huy hiệu trạng thái.
- Triển khai **Người dùng mới đăng ký** với avatar, tên, email, ngày đăng ký và role badge.
- Triển khai **Thao tác nhanh (Quick Actions)** điều hướng đến 6 phân hệ cốt lõi của Admin Portal.
- Hỗ trợ đầy đủ **6 UX States**: Loading Skeletons, Empty States, Error States với nút Retry độc lập từng phần, Success State, Refresh State, và Route Guard Unauthorized.
- Kiểm thử tự động: `tsc --noEmit` PASS (0 errors), `npm run lint` PASS (0 errors), `npm run build` PASS (0 errors).
- Kiểm thử thực tế bằng subagent trên trình duyệt thật (Desktop & Mobile) đạt 100% tiêu chí.

---

## 2. Scope

### Những gì ĐÃ triển khai trong Phase F9.3:
1. **Kiến trúc dữ liệu & Types**: `src/types/admin-dashboard.ts` định nghĩa chặt chẽ DTOs cho Khóa học, Người dùng, Đơn hàng và trạng thái KPI Dashboard.
2. **Tầng dịch vụ API**: `src/services/admin-dashboard.service.ts` kết nối trực tiếp với backend endpoints (`/api/admin/users`, `/api/admin/courses`, `/api/orders/`), hỗ trợ phân trang và hủy request bằng `AbortSignal`.
3. **Component Grid KPI**: `src/components/admin/dashboard/kpi-card.tsx` và `kpi-grid.tsx` render 6 thẻ chỉ số với skeleton pulse và nút retry lỗi riêng biệt.
4. **Component Danh sách vận hành**:
   - `pending-courses-card.tsx`: Danh sách 5 khóa học chờ duyệt mới nhất.
   - `pending-orders-card.tsx`: Danh sách 5 đơn hàng chờ xử lý mới nhất.
   - `recent-users-card.tsx`: Danh sách 5 người dùng mới đăng ký gần nhất.
5. **Component Quick Actions**: `quick-actions-card.tsx` cung cấp 6 liên kết điều hướng trực quan đến các trang quản trị.
6. **Điều phối Dashboard & Header**: `dashboard-header.tsx` và `admin-dashboard-view.tsx` quản lý vòng đời dữ liệu, đồng bộ thời gian và làm mới thủ công.
7. **Trang Dashboard**: Cập nhật `src/app/admin/dashboard/page.tsx` chuẩn Next.js Server Component metadata và render view Client.

### Những gì NGOÀI scope (Tuân thủ Scope Control):
- Không thực hiện thao tác duyệt/từ chối khóa học (thuộc phase F9.5).
- Không thực hiện CRUD Người dùng (thuộc phase F9.4).
- Không thực hiện CRUD Danh mục/Mã giảm giá/Bình luận (thuộc các phase sau).
- Không sửa đổi hay đọc code bên trong repository backend `D:\e-learning_server`.

---

## 3. Dashboard UI Overview

Giao diện Admin Dashboard tuân thủ triệt để ngôn ngữ thiết kế **Modern Academic Violet** của TMdemy:
- **Tone màu chủ đạo**: `#7240b8` (Tím học thuật), `#1c192c` (Dark slate/text), `#fdf8ff` / `#17141f` (Nền thẻ nhẹ nhàng).
- **Hệ thống thẻ**: Bo góc mềm mại `rounded-2xl`, viền tinh tế `border-[#f1ebff] dark:border-[#2b2438]`, đổ bóng nhẹ `shadow-xs`.
- **Bố cục trực quan**:
  - **Hàng 1**: Header thông tin hệ thống, trạng thái sẵn sàng, thời gian cập nhật gần nhất và nút **Làm mới**.
  - **Hàng 2**: Lưới 6 thẻ KPI tổng thể (responsive từ 1 cột trên mobile đến 6 cột trên màn hình rộng).
  - **Hàng 3**: 2 cột chính gồm *Khóa học chờ phê duyệt* (trái) và *Đơn hàng cần xử lý* (phải).
  - **Hàng 4**: *Người dùng mới đăng ký* (5 phần) và *Thao tác nhanh* (7 phần).

---

## 4. 6 KPI Mapping

Tất cả các số liệu KPI đều được trích xuất từ trường tổng số bản ghi của backend (`pagination.total`) khi lọc điều kiện thích hợp:

| Stt | Tên KPI | Ý nghĩa | Endpoint Backend | Query Filter | Giá trị thực tế đã xác minh |
|---|---|---|---|---|---|
| 1 | **Tổng người dùng** | Toàn bộ tài khoản người dùng trong hệ thống | `GET /api/admin/users` | `limit=1` | **90** |
| 2 | **Tổng giảng viên** | Số tài khoản có vai trò giảng viên | `GET /api/admin/users` | `limit=1&role=teacher` | **3** |
| 3 | **Tổng khóa học** | Toàn bộ khóa học hiện có trên sàn | `GET /api/admin/courses` | `limit=1` | **370** |
| 4 | **Chờ phê duyệt** | Số khóa học đang ở trạng thái `pending` | `GET /api/admin/courses` | `limit=1&status=pending` | **24** |
| 5 | **Tổng đơn hàng** | Toàn bộ đơn hàng ghi nhận trong hệ thống | `GET /api/orders/` | `limit=1` | **29** |
| 6 | **Đơn hàng chờ xử lý** | Số lượng đơn hàng ở trạng thái `pending` | `GET /api/orders/` | `limit=1&status=pending` | **9** |

*Nguyên tắc Data Integrity*: Không lấy số lượng phần tử trả về trong trang mà lấy trực tiếp `res.data.pagination.total`. Không hiển thị số `0` khi đang tải hoặc gặp lỗi.

---

## 5. Pending Course Approval (Khóa học chờ phê duyệt)

- **Endpoint**: `GET /api/admin/courses?limit=5&status=pending&sortBy=createdAt`
- **Dữ liệu hiển thị**:
  - Thumbnail khóa học (tối ưu hóa hiển thị, có fallback placeholder khi thiếu ảnh).
  - Tiêu đề khóa học.
  - Thông tin giảng viên (`author.username`).
  - Ngày khởi tạo (`createdAt`).
  - Giá khóa học định dạng VND (`price` hoặc "Miễn phí" nếu 0).
  - Huy hiệu trạng thái "Chờ duyệt" (Amber badge).
- **Hành động**: Nút "Xem tất cả" và liên kết điều hướng sang `/admin/courses`.

---

## 6. New Users (Người dùng mới đăng ký)

- **Endpoint**: `GET /api/admin/users?limit=5&sortBy=createdAt`
- **Dữ liệu hiển thị**:
  - Avatar người dùng (hoặc icon định danh mặc định).
  - Username & Email.
  - Role Badge (Admin: Đỏ/Hồng, Giảng viên: Tím, Học viên: Indigo).
  - Ngày đăng ký tài khoản (`createdAt`).
  - Điểm chấm xanh thể hiện tài khoản đang hoạt động (`active`).
- **Hành động**: Nút "Xem tất cả" điều hướng sang `/admin/users`.

---

## 7. Pending Orders (Đơn hàng cần xử lý)

- **Endpoint**: `GET /api/orders/?limit=5&status=pending&sortBy=createdAt`
- **Dữ liệu hiển thị**:
  - Mã đơn hàng (ví dụ: `DH-3201776`).
  - Tiêu đề khóa học được mua.
  - Tên/Email khách hàng đặt mua.
  - Tổng tiền đơn hàng (`total` hoặc `amount`) định dạng tiền Việt Nam Đồng (VND).
  - Ngày tạo giao dịch.
  - Huy hiệu "Chờ xử lý" (Rose badge).
- **Hành động**: Nút "Xem tất cả" và liên kết điều hướng sang `/admin/orders`.

---

## 8. Quick Actions (Thao tác nhanh)

Cung cấp 6 ô truy cập nhanh tới toàn bộ các chức năng quản trị:
1. **Quản lý người dùng**: `/admin/users` (Icon: Users)
2. **Quản lý khóa học**: `/admin/courses` (Icon: BookOpen)
3. **Quản lý danh mục**: `/admin/categories` (Icon: FolderTree)
4. **Quản lý mã giảm giá**: `/admin/coupons` (Icon: Ticket)
5. **Quản lý đơn hàng**: `/admin/orders` (Icon: ShoppingBag)
6. **Kiểm duyệt bình luận**: `/admin/comments` (Icon: MessageSquare)

Mỗi ô có hiệu ứng hover mượt mà, chuyển động mũi tên và liên kết chuẩn Next.js Link.

---

## 9. API Endpoints Used

| Endpoint | Method | Vai trò | Headers / Auth |
|---|---|---|---|
| `/api/admin/users` | `GET` | Lấy danh sách & đếm tổng người dùng / giảng viên | `Authorization: Bearer <token>` |
| `/api/admin/courses` | `GET` | Lấy danh sách & đếm khóa học / khóa học chờ duyệt | `Authorization: Bearer <token>` |
| `/api/orders/` | `GET` | Lấy danh sách & đếm tổng đơn hàng / đơn hàng chờ duyệt | `Authorization: Bearer <token>` |

Tất cả các API được gọi qua `apiClient` từ `@/lib/api/client`, tự động gắn JWT Bearer token và hỗ trợ cơ chế auto-refresh token khi nhận mã lỗi 401 `jwt expired`.

---

## 10. API Response Mapping

```typescript
// KPI Totals Mapping:
res.data.pagination.total -> number | null

// Course Mapping:
res.data.courses[] -> {
  id: string,
  title: string,
  slug: string,
  image?: string,
  thumbnail?: string,
  price?: number,
  status: string,
  author: { username: string, email: string, avatar?: string },
  createdAt: string
}

// User Mapping:
res.data.users[] -> {
  id: string,
  username: string,
  email: string,
  role: string,
  status: string,
  avatar?: string,
  createdAt: string
}

// Order Mapping:
res.data.orders[] -> {
  id: string,
  code?: string,
  amount: number,
  discount: number,
  total: number,
  status: string,
  course?: { id: string, title: string, image?: string, price?: number },
  user?: { id: string, username: string, email: string },
  createdAt: string
}
```

---

## 11. Service and Type Changes

### Files tạo mới:
1. `src/types/admin-dashboard.ts`: Chứa các interface DTO chuẩn hóa cho màn hình Admin Dashboard.
2. `src/services/admin-dashboard.service.ts`: Chứa các phương thức tương tác API cho Admin Dashboard (`getUsers`, `getCourses`, `getOrders`, `getAllKpiTotals`, `getPendingCourses`, `getRecentUsers`, `getPendingOrders`).
3. `src/components/admin/dashboard/kpi-card.tsx`: Card KPI hiển thị icon, giá trị, nhãn và trạng thái tải/lỗi.
4. `src/components/admin/dashboard/kpi-grid.tsx`: Lưới 6 thẻ KPI tích hợp.
5. `src/components/admin/dashboard/pending-courses-card.tsx`: Khối khóa học chờ duyệt.
6. `src/components/admin/dashboard/recent-users-card.tsx`: Khối người dùng mới đăng ký.
7. `src/components/admin/dashboard/pending-orders-card.tsx`: Khối đơn hàng cần xử lý.
8. `src/components/admin/dashboard/quick-actions-card.tsx`: Khối thao tác nhanh.
9. `src/components/admin/dashboard/dashboard-header.tsx`: Header đồng hồ, trạng thái và nút làm mới.
10. `src/components/admin/dashboard/admin-dashboard-view.tsx`: Client coordinator quản trị toàn bộ trạng thái dữ liệu Dashboard.

### Files cập nhật:
1. `src/app/admin/dashboard/page.tsx`: Chuyển từ placeholder sang trang hoàn chỉnh tích hợp `<AdminDashboardView />`.

---

## 12. Loading / Empty / Error / Success States

- **Loading State**: Sử dụng skeleton loaders có kích thước tương đồng với card thật, ngăn chặn tình trạng giật layout (Layout Shift) khi tải.
- **Empty State**: Thiết kế riêng biệt với icon minh họa và thông điệp rõ ràng cho từng danh mục khi không có khóa học, người dùng hay đơn hàng chờ xử lý.
- **Error State**: Cô lập lỗi theo từng khu vực độc lập. Nếu một API gặp sự cố (ví dụ: orders bị ngắt kết nối), 5 KPI còn lại và danh mục khóa học/người dùng vẫn hiển thị bình thường. Mỗi khối lỗi đều có nút **Thử lại** cục bộ.
- **Success State**: Hiển thị dữ liệu trực quan với font số to rõ, phân cách hàng nghìn tiếng Việt (`vi-VN`), định dạng tiền tệ và ngày tháng chuẩn.
- **Refresh State**: Icon quay đồng bộ khi người dùng click nút "Làm mới", hiển thị timestamp "Cập nhật lúc HH:mm:ss".

---

## 13. Security and Authorization

- Trang `/admin/dashboard` được bao bọc bởi `AdminShell` và `RouteGuard` yêu cầu `allowedRoles={['admin']}`.
- Khi người dùng chưa đăng nhập hoặc có vai trò `student` / `teacher`, hệ thống tự động ngăn chặn hiển thị và điều hướng an toàn về `/login` hoặc trang không có quyền.
- Thông tin token JWT được quản lý an toàn trong bộ nhớ/cookie qua `src/lib/api/token.ts`, không ghi log token hay credentials ra console/report.

---

## 14. Backend Gaps

- **Không có backend gap đối với 6 KPI**: Cả 6 chỉ số đều có endpoint tương ứng cung cấp `pagination.total` chính xác:
  - Tổng người dùng: `GET /api/admin/users?limit=1`
  - Tổng giảng viên: `GET /api/admin/users?limit=1&role=teacher`
  - Tổng khóa học: `GET /api/admin/courses?limit=1`
  - Khóa học chờ duyệt: `GET /api/admin/courses?limit=1&status=pending`
  - Tổng đơn hàng: `GET /api/orders/?limit=1`
  - Đơn hàng chờ xử lý: `GET /api/orders/?limit=1&status=pending`
- **Không có backend gap đối với danh sách**: Cả 3 danh sách đều trả về đầy đủ các trường thiết yếu để render card trên frontend.

---

## 15. Files Created

- `src/types/admin-dashboard.ts`
- `src/services/admin-dashboard.service.ts`
- `src/components/admin/dashboard/kpi-card.tsx`
- `src/components/admin/dashboard/kpi-grid.tsx`
- `src/components/admin/dashboard/pending-courses-card.tsx`
- `src/components/admin/dashboard/recent-users-card.tsx`
- `src/components/admin/dashboard/pending-orders-card.tsx`
- `src/components/admin/dashboard/quick-actions-card.tsx`
- `src/components/admin/dashboard/dashboard-header.tsx`
- `src/components/admin/dashboard/admin-dashboard-view.tsx`
- `docs/progress/F9_3_ADMIN_DASHBOARD_REPORT.md`

---

## 16. Files Updated

- `src/app/admin/dashboard/page.tsx`

---

## 17. Dependency Changes

- **Không cài thêm bất kỳ npm dependency nào**. Toàn bộ triển khai sử dụng các thư viện sẵn có của project (`lucide-react`, Tailwind CSS, shadcn/ui primitives).

---

## 18. Validation Results

| Lệnh kiểm tra | Kết quả | Chi tiết |
|---|---|---|
| `npx tsc --noEmit` | **PASS (Code 0)** | 0 TypeScript errors |
| `npm run lint` | **PASS (Code 0)** | 0 errors trong toàn bộ các file mới và dự án |
| `npm run build` | **PASS (Code 0)** | Biên dịch Next.js thành công, 39 static routes được tạo tối ưu |

---

## 19. Browser Verification

Browser Subagent đã thực thi kiểm thử tự động trên trình duyệt thật tại `http://localhost:3000/admin/dashboard`:

| Hạng mục kiểm tra | Kết quả | Bằng chứng / Chi tiết |
|---|---|---|
| Truy cập Dashboard với vai trò Admin | **PASS** | Đăng nhập với admin `thaiminh0612@gmail.com` |
| 6 KPI Cards hiển thị dữ liệu thật | **PASS** | Người dùng: **90**, Giảng viên: **3**, Khóa học: **370**, Chờ duyệt: **24**, Đơn hàng: **29**, Cần xử lý: **9** |
| Khóa học chờ duyệt | **PASS** | Tải danh sách khóa học với thumbnail, giảng viên (`giaovientrungquoc`), giá và huy hiệu "Chờ duyệt" |
| Đơn hàng cần xử lý | **PASS** | Tải danh sách đơn hàng với mã `DH-3201776`, khách hàng `Thái Quang Minh`, số tiền `499.000đ` |
| Người dùng mới đăng ký | **PASS** | Tải danh sách tài khoản mới (`Instructor Pro`, `Giang Vien Test`,...), email và role badge |
| Thao tác nhanh (Quick Actions) | **PASS** | Đủ 6 cards liên kết chính xác tới `/admin/users`, `/admin/courses`, `/admin/categories`, `/admin/coupons`, `/admin/orders`, `/admin/comments` |
| Nút Làm mới (Refresh) | **PASS** | Click nút làm mới, icon xoay và timestamp cập nhật thành công (`Cập nhật lúc 18:51:55`) |
| Responsive Mobile (390x844) | **PASS** | Bố cục tự động co giãn về dạng 1 cột, các card xếp chồng tự nhiên không vỡ giao diện |

### Ảnh chụp màn hình và video kiểm chứng:
- **Desktop Dashboard**: `admin_dashboard_desktop_1792410721767.png`
- **Mobile Responsive Dashboard**: `admin_dashboard_mobile_1792410729388.png`
- **Video phiên tương tác**: `admin_dashboard_f93_1792410692845.webp`

---

## 20. Execution Trace

- **Workflow được sử dụng**: `feature-development` (`.agents/workflows/feature-development.md`)
- **Skills được kích hoạt & áp dụng**:
  - `page-implementation`: Xây dựng cấu trúc route App Router, phân tách Server Component metadata và Client Component logic.
  - `api-integration`: Kết nối các endpoint chuẩn theo API contract, xử lý phân trang, triệt tiêu race condition với `AbortController`, cách ly lỗi từng phần.
  - `stitch-ui`: Tuân thủ design token `Modern Academic Violet`, tỷ lệ thẻ KPI, spacing, typography và dark mode.
  - `frontend-review`: Kiểm toán toàn diện chất lượng code, type safety, accessibility và không có cascading renders trong React hooks.

---

## 21. Workflow Gates

- **Context Gate**: **PASS** (Đã đọc đầy đủ AGENTS.md, rules, API contract, layout shell F9.2 trước khi code).
- **Scope Gate**: **PASS** (Chỉ tập trung vào Admin Dashboard overview và quick actions, không làm lan sang CRUD).
- **API/Backend Boundary Gate**: **PASS** (Không chạm vào backend, chỉ giao tiếp qua REST API, 100% dữ liệu thật).
- **Dependency Gate**: **PASS** (Không cài thêm bất kỳ npm package nào).
- **Validation Gate**: **PASS** (TypeScript, Linter, Build và Browser Subagent đều PASS 100%).

---

## 22. Known Limitations

- Thao tác phê duyệt/từ chối trực tiếp khóa học chưa được kích hoạt tại Dashboard do quy trình xét duyệt chi tiết được thiết kế nằm trong Phase F9.5 (Course Approval & Management). Nút xem chi tiết hiện điều hướng tới `/admin/courses`.
- Thao tác xử lý trực tiếp đơn hàng (duyệt/hủy) được điều hướng về `/admin/orders`.

---

## 23. Next Phase

- **Phase tiếp theo khuyến nghị**: **F9.4 — Admin User Management** (Quản lý người dùng: lọc, phân trang, gán quyền, khóa tài khoản).
- **Quy tắc dừng**: Dừng lại ở đây để người dùng kiểm tra và review trước khi tiến hành phase tiếp theo.
