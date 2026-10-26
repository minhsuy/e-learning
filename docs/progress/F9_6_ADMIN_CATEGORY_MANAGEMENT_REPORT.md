# TMdemy — Phase F9.6 Progress Report
## Admin Category Management

**Report Date:** 2026-10-19  
**Branch / Phase:** `phase-f9.6-admin-category-management`  
**Route:** `/admin/categories`  
**Target Repository:** `D:\e-learning` (Frontend only)  
**Status:** **COMPLETED & VERIFIED**

---

## 1. Summary

Phase F9.6 đã hoàn thành triển khai toàn diện module **Admin Category Management** (Quản lý Danh mục khóa học) dành cho Quản trị viên (Admin) trên nền tảng TMdemy tại route `/admin/categories`.

Trang được xây dựng hoàn toàn dựa trên API contract thực tế (`api/CATEGORY_API.md` và `api/ADMIN_API.md`), tuân thủ chặt chẽ ranh giới Frontend - Backend, kiến trúc Next.js App Router, hệ màu thương hiệu **Modern Academic Violet** (`#7240b8`, `#a87ffb`), và hệ thống shadcn/ui.

Module hỗ trợ đầy đủ các tính năng:
- **Category Listing**: Danh sách danh mục dạng bảng trên Desktop và card linh hoạt trên Mobile/Tablet.
- **KPI Summary Cards**: Thống kê tổng số danh mục, số danh mục hoạt động, tổng số khóa học toàn sàn, và tỷ lệ chuẩn hóa SEO slug.
- **Real-time Course Association Count**: Truy vấn số lượng khóa học thực tế liên kết với từng danh mục (`GET /api/admin/courses?category=:id&limit=1`).
- **Debounced Search**: Tìm kiếm tức thì với debounce 500ms, hủy request cũ khi người dùng tiếp tục gõ bằng `AbortController`, có nút reset nhanh.
- **Server-side Pagination**: Phân trang chuẩn với bộ chọn số bản ghi/trang (`10`, `20`, `50`), hiển thị khoảng bản ghi (`startRecord - endRecord`) đồng nhất với F9.4 (Users) và F9.5 (Courses).
- **Category Detail Modal**: Xem chi tiết siêu dữ liệu (Name, Slug, Mô tả, Ngày tạo, Cập nhật) cùng danh sách 5 khóa học tiêu biểu thuộc danh mục.
- **Create Category Modal**: Form tạo mới với tính năng tự động chuyển đổi tiếng Việt có dấu thành URL Slug theo thời gian thực (Live Slug Preview), kiểm tra lỗi trùng lặp (409 Conflict).
- **Edit Category Modal**: Cập nhật thông tin danh mục với prefill dữ liệu, nút hỗ trợ sinh lại slug theo tên mới.
- **Delete Category Modal**: Hộp thoại xác nhận xóa mềm (`isDestroyed = true`) an toàn, cảnh báo số lượng khóa học liên kết bị ảnh hưởng trước khi thực hiện.
- **Full UX State Handling**: Loading skeletons, Empty states (phân biệt chưa có dữ liệu và không tìm thấy theo tìm kiếm), Error states có nút thử lại (Retry).

---

## 2. Existing Implementation Audit

Trước khi code, đã tiến hành khảo sát các thành phần Admin hiện có:
- `src/app/admin/categories/page.tsx`: Trước đó chỉ là Placeholder Card từ Phase F9.2. Đã được nâng cấp thành trang quản lý hoàn chỉnh.
- `src/app/admin/layout.tsx`: Admin Layout Shell và Sidebar Navigation (F9.2) đã tích hợp sẵn route `/admin/categories` với breadcrumb tương ứng.
- `src/services/category.service.ts`: Chứa phương thức public `getCategories`. Được giữ nguyên cho client ngoài.
- `src/types/category.ts`: Chứa type cơ bản `ApiCategoryItem`.
- `src/components/admin/courses/` & `src/components/admin/users/`: Khảo sát kỹ lưỡng layout chuẩn, style Modern Academic Violet, cấu trúc Pagination `w-8 h-8`, filter bar debounce, và dialog modals.

---

## 3. API Contract Mapping

| Feature | API Method & Endpoint | Contract Reference | Status | Notes |
|---|---|---|---|---|
| Category List | `GET /api/categories/` | `api/CATEGORY_API.md` (Sec 1) | **Verified** | Hỗ trợ `page`, `limit`, `search`, `sortBy` |
| Category Detail | `GET /api/categories/:slug` | `api/CATEGORY_API.md` (Sec 2) | **Verified** | Trả về `id`, `name`, `slug`, `description`, `createdAt`, `updatedAt` |
| Create Category | `POST /api/admin/categories/` | `api/ADMIN_API.md` (Sec 3.1) | **Verified** | Body: `{ name, description }`. 201 Created hoặc 409 Conflict |
| Update Category | `PUT /api/admin/categories/:id` | `api/ADMIN_API.md` (Sec 3.2) | **Verified** | Body: `{ name, slug, description }`. Bearer JWT |
| Delete Category | `DELETE /api/admin/categories/:id` | `api/ADMIN_API.md` (Sec 3.3) | **Verified** | Soft-delete (`isDestroyed = true`). Bearer JWT |
| Associated Courses | `GET /api/admin/courses?category=:id` | `api/ADMIN_API.md` & `api/COURSE_API.md` | **Verified** | Lấy số lượng khóa học liên kết (`pagination.total`) và danh sách khóa học mẫu |

---

## 4. Category Listing

- Đường dẫn: `/admin/categories`.
- Hiển thị đầy đủ thông tin:
  - **Tên danh mục & Đường dẫn Slug**: Đi kèm icon `FolderTree`, slug hiển thị font mono với tiền tố `/`.
  - **Mô tả**: Hiển thị tóm tắt, tối đa 2 dòng kèm chú thích nếu chưa có mô tả.
  - **Khóa học liên kết**: Badge hiển thị số lượng khóa học (`X khóa`), tải bất đồng bộ song song cho từng danh mục.
  - **Trạng thái**: Badge màu xanh lá (`Hoạt động`) hoặc màu đỏ (`Đã xóa mềm`).
  - **Ngày tạo**: Định dạng ngày chuẩn `dd/mm/yyyy` theo múi giờ Việt Nam.
  - **Cột Thao tác**: 3 nút thao tác nhanh:
    - Xem chi tiết (`Eye` icon).
    - Chỉnh sửa (`Edit2` icon).
    - Xóa danh mục (`Trash2` icon).

---

## 5. Search Behavior

- **Debounce**: 500ms tự động làm sạch timer khi người dùng tiếp tục nhập, chống spam API requests.
- **Race Condition Prevention**: Sử dụng `AbortController` để hủy bỏ request trước đó nếu người dùng thay đổi từ khóa tìm kiếm.
- **Reset Pagination**: Tự động đưa về `page: 1` khi thay đổi từ khóa.
- **Search Feedback**: Hiển thị thanh thông báo kết quả tìm kiếm với số lượng bản ghi tương ứng và nút xóa nhanh (`X`).
- **Empty Filter State**: Khi không tìm thấy danh mục nào phù hợp, hiển thị thông điệp gợi ý rõ ràng và nút "Đặt lại bộ lọc".

---

## 6. Server-Side Pagination Behavior

- Sử dụng component `CategoryPagination` đồng nhất tuyệt đối với `UserPagination` và `CoursePagination`.
- Bộ chọn bản ghi trên trang: `/ trang` (10, 20, 50 bản ghi/trang).
- Hiển thị rõ ràng: `Hiển thị X - Y trong tổng số Z danh mục`.
- Điều hướng: Trang đầu (`ChevronsLeft`), Trang trước (`ChevronLeft`), Badge chỉ số trang hiện tại (`Trang A / B`), Trang sau (`ChevronRight`), Trang cuối (`ChevronsRight`).
- Nút bấm vô hiệu hóa (`disabled`) chính xác khi đang tải dữ liệu hoặc khi đang ở trang đầu/trang cuối.

---

## 7. Category Detail

- Mở bằng `CategoryDetailModal`.
- Thông tin cơ bản:
  - Tên danh mục, Slug URL, Trạng thái hoạt động (`Hoạt động` / `Đã xóa mềm`).
  - Lưới thông số (Cards): Tổng số khóa học, Ngày tạo, Ngày cập nhật lần cuối.
  - Khung nội dung mô tả chi tiết chuyên ngành.
  - Danh sách 5 khóa học liên kết thực tế: Thumbnail, Tên khóa học, Giảng viên phụ trách, Cấp độ (`level`), và trạng thái kiểm duyệt (`status`).
  - Nút bấm liên kết trực tiếp: "Chỉnh sửa" và "Xóa danh mục".

---

## 8. Create Category

- Mở bằng nút "+ Thêm danh mục" trên thanh công cụ.
- Các trường nhập liệu:
  - **Tên danh mục** (bắt buộc, 2 - 100 ký tự).
  - **Slug tự động tạo (Live Slug Preview)**: Bộ sinh slug tự động loại bỏ dấu tiếng Việt, chuyển sang chữ thường không dấu, nối bằng dấu gạch ngang theo thời gian thực (`slugifyVietnamese`).
  - **Mô tả chi tiết** (tùy chọn, textarea 3 dòng).
- **Validation**: Kiểm tra rỗng, độ dài tối thiểu, độ dài tối đa trước khi gửi request.
- **Conflict Handling**: Bắt mã lỗi HTTP 409 (`NAME_CONFLICT` / `SLUG_CONFLICT`) từ backend và hiển thị banner thông báo thân thiện.
- **Double-Submit Prevention**: Khóa nút submit và hiển thị spinner `Loader2` trong khi request đang xử lý.
- Giữ nguyên dữ liệu form nếu backend trả về lỗi để người dùng sửa đổi.

---

## 9. Update Category

- Mở bằng nút Chỉnh sửa trên dòng danh mục hoặc từ Modal chi tiết.
- Tự động nạp dữ liệu hiện tại (prefill) thông qua React key mount pattern.
- Cho phép chỉnh sửa:
  - Tên danh mục.
  - Đường dẫn URL (Slug): Hỗ trợ nút "Tạo lại theo tên" để sinh lại slug tức thời khi thay đổi tên.
  - Mô tả chuyên ngành.
- Gửi payload `{ name, slug, description }` qua `PUT /api/admin/categories/:id`.
- Tự động reload danh sách và cập nhật KPIs sau khi lưu thành công.

---

## 10. Delete Category

- **Rủi ro dữ liệu**: Được đánh giá là thao tác có độ nhạy cảm cao nhất trong F9.6.
- **Cơ chế Soft-Delete**: Backend thực hiện xóa mềm đặt `isDestroyed = true`.
- **Cảnh báo liên kết khóa học**:
  - Hộp thoại `DeleteCategoryModal` chủ động kiểm tra số lượng khóa học đang gán vào danh mục này.
  - Nếu số khóa học > 0: Hiển thị banner cảnh báo màu vàng nổi bật: *"Hiện có X khóa học đang thuộc danh mục này. Việc xóa mềm danh mục sẽ đưa trạng thái danh mục về ẩn khỏi bộ lọc công khai."*
  - Nếu số khóa học = 0: Thông báo danh mục an toàn để ẩn.
- **Safety Testing**: Trong quá trình browser test, không thực hiện xóa các danh mục thật của hệ thống; các thao tác hủy bỏ được kiểm tra an toàn.

---

## 11. Category Image Handling

- **Khảo sát API Contract**: Backend schema hiện tại (`CATEGORY_API.md` & `ADMIN_API.md`) không có trường `image` và không có endpoint upload ảnh danh mục.
- **Xử lý UI**: Giao diện sử dụng icon hiện đại `FolderTree` trong khung badge màu tím học thuật `Modern Academic Violet` kết hợp viền tinh tế, đảm bảo tính thẩm mỹ cao mà không phát sinh dữ liệu giả.
- **Ghi nhận**: Xem mục `[BACKEND GAP]` nếu sau này sản phẩm có nhu cầu hiển thị banner/thumbnail ảnh cho chuyên ngành.

---

## 12. Loading / Empty / Error States

- **Loading States**:
  - Shimmer pulse skeleton trên toàn bộ bảng danh mục (5 hàng tải mẫu).
  - Shimmer pulse trên thẻ KPI summary.
  - Spinner xoay tròn trên nút làm mới và nút submit form.
- **Empty States**:
  - Khi chưa có danh mục: Icon `FolderTree`, thông điệp hướng dẫn tạo mới.
  - Khi tìm kiếm không có kết quả: Thông điệp giải thích từ khóa và nút bấm "Đặt lại bộ lọc" một chạm.
- **Error States**:
  - Banner cảnh báo lỗi màu đỏ nhạt với thông báo lỗi cụ thể và nút "Thử lại" (Retry).
  - Thông báo lỗi toast `toast.error(msg)`.

---

## 13. Responsive Behavior

- **Desktop (>= 1024px)**: Bảng dữ liệu rộng rãi, bo tròn viền 16px, căn chỉnh chuẩn các cột, hiển thị đầy đủ thông tin slug, khóa học và ngày tạo.
- **Tablet (768px - 1023px)**: Layout co giãn mượt mà, bộ lọc linh hoạt 2 hàng, hỗ trợ cuộn bảng hoặc chuyển card.
- **Mobile (< 768px)**:
  - Tự động chuyển đổi sang Card layout riêng biệt cho từng danh mục.
  - Các nút hành động to, dễ chạm, không bị tràn khung ngang (no horizontal overflow).
  - Modals sử dụng `max-h-[90vh]` với thanh cuộn bên trong, đảm bảo hiển thị trọn vẹn trên màn hình nhỏ.

---

## 14. Files Created

1. [src/types/admin-category.ts](file:///d:/e-learning/src/types/admin-category.ts): Định nghĩa kiểu TypeScript cho Category Item, DTO Create/Update, Pagination, KPIs, và API Responses.
2. [src/services/admin-category.service.ts](file:///d:/e-learning/src/services/admin-category.service.ts): Service tầng API Client giao tiếp với các endpoints category của Backend, hàm tiện ích `slugifyVietnamese`.
3. [src/components/admin/categories/category-kpi-summary.tsx](file:///d:/e-learning/src/components/admin/categories/category-kpi-summary.tsx): 4 thẻ KPI tóm tắt số liệu danh mục và khóa học.
4. [src/components/admin/categories/category-filters-bar.tsx](file:///d:/e-learning/src/components/admin/categories/category-filters-bar.tsx): Thanh công cụ tìm kiếm debounce 500ms, nút đặt lại, làm mới và nút thêm danh mục.
5. [src/components/admin/categories/category-table.tsx](file:///d:/e-learning/src/components/admin/categories/category-table.tsx): Bảng dữ liệu Desktop & Cards Mobile với đầy đủ skeleton, empty và error states.
6. [src/components/admin/categories/category-pagination.tsx](file:///d:/e-learning/src/components/admin/categories/category-pagination.tsx): Phân trang chuẩn với bộ chọn `/ trang`.
7. [src/components/admin/categories/category-detail-modal.tsx](file:///d:/e-learning/src/components/admin/categories/category-detail-modal.tsx): Hộp thoại chi tiết danh mục và danh sách khóa học liên kết.
8. [src/components/admin/categories/create-category-modal.tsx](file:///d:/e-learning/src/components/admin/categories/create-category-modal.tsx): Hộp thoại tạo mới danh mục với live slug preview.
9. [src/components/admin/categories/edit-category-modal.tsx](file:///d:/e-learning/src/components/admin/categories/edit-category-modal.tsx): Hộp thoại chỉnh sửa danh mục và tái tạo slug.
10. [src/components/admin/categories/delete-category-modal.tsx](file:///d:/e-learning/src/components/admin/categories/delete-category-modal.tsx): Hộp thoại xác nhận xóa mềm kèm cảnh báo khóa học liên kết.
11. [src/components/admin/categories/admin-categories-view.tsx](file:///d:/e-learning/src/components/admin/categories/admin-categories-view.tsx): Root stateful component điều phối toàn bộ luồng dữ liệu, tìm kiếm, phân trang và modals.
12. [docs/progress/F9_6_ADMIN_CATEGORY_MANAGEMENT_REPORT.md](file:///d:/e-learning/docs/progress/F9_6_ADMIN_CATEGORY_MANAGEMENT_REPORT.md): Báo cáo tiến độ hoàn thành Phase F9.6.

---

## 15. Files Modified

1. [src/app/admin/categories/page.tsx](file:///d:/e-learning/src/app/admin/categories/page.tsx): Thay thế placeholder card F9.2 bằng component `<AdminCategoriesView />`.

---

## 16. API Integration

Tích hợp thành công thông qua `apiClient` tập trung và chuẩn REST API:
- `GET /api/categories/?page=X&limit=Y&search=Z`: Lấy danh sách danh mục phân trang & tìm kiếm.
- `GET /api/categories/:slug`: Lấy chi tiết danh mục theo slug.
- `POST /api/admin/categories/`: Tạo danh mục mới (Admin JWT).
- `PUT /api/admin/categories/:id`: Cập nhật danh mục theo ID (Admin JWT).
- `DELETE /api/admin/categories/:id`: Xóa mềm danh mục (Admin JWT).
- `GET /api/admin/courses?category=:id&limit=1`: Đếm số lượng khóa học đang gán vào danh mục.
- `GET /api/admin/courses?category=:id&limit=5`: Lấy 5 khóa học tiêu biểu hiển thị trong Modal chi tiết.

---

## 17. Backend Gaps

1. `[BACKEND GAP]` **Category Thumbnail/Image**:
   - Hiện tại backend schema cho Category chỉ bao gồm `name`, `slug`, `description`, `isDestroyed`, `createdAt`, `updatedAt`.
   - Backend chưa hỗ trợ lưu trữ trường `image` hoặc endpoint upload icon/ảnh đại diện cho danh mục.
   - Frontend hiện xử lý bằng hệ thống icon `FolderTree` đồng bộ trong thiết kế Modern Academic Violet. Nếu sau này cần ảnh minh họa cho trang chủ, Backend cần bổ sung trường `image` vào schema Category.

---

## 18. Dependency Changes

- **Không có package mới nào được cài đặt** (`0 dependencies added`).
- Hoàn toàn tái sử dụng các thư viện sẵn có: `lucide-react`, `@base-ui/react`, Next.js 16.3.8, Tailwind CSS v4, và `apiClient`.

---

## 19. Validation Results

| Test / Check | Command | Result | Notes |
|---|---|---|---|
| TypeScript Typecheck | `cmd /c npx tsc --noEmit` | **PASS** | Exit code 0, không có lỗi kiểu |
| ESLint Linting | `cmd /c npx eslint src/components/admin/categories/ ...` | **PASS** | Exit code 0, 0 errors, 0 warnings |
| Next.js Production Build | `cmd /c npm run build` | **PASS** | Exit code 0, compiled static route `○ /admin/categories` |

---

## 20. Browser Testing Results

Đã thực hiện phiên kiểm thử tương tác tự động bằng **Browser Subagent**:
- **Authentication**: Xác thực thành công với tài khoản Admin `thaiminh0612@gmail.com`.
- **Navigation**: Truy cập route `http://localhost:3000/admin/categories`.
- **Header & KPIs**: Render đầy đủ tiêu đề, breadcrumb, 4 thẻ KPIs (Tổng số: 4, Hoạt động: 4, Khóa học: 369, Chuẩn hóa: 100%).
- **Search Test**:
  - Nhập `"Web"` vào ô tìm kiếm -> Debounce 500ms kích hoạt -> Danh sách cập nhật tức thời còn 2 danh mục phù hợp (`Lập trình web` và `Lập trình`).
  - Thanh thông báo hiển thị đúng: "Tìm thấy 2 danh mục phù hợp với từ khóa 'Web'".
  - Nhấn nút "Đặt lại" -> Danh sách trở lại đầy đủ 4 danh mục ngay lập tức.
- **Create Modal Test**:
  - Nhấn nút "Thêm danh mục" -> Modal hiển thị mượt mà.
  - Nhập tên danh mục thử nghiệm -> Ô xem trước slug tự động sinh đường dẫn `/kiem-thu-category-f96`.
  - Nhấn nút "Hủy" -> Modal đóng an toàn, không tạo rác dữ liệu vào cơ sở dữ liệu.
- **Detail Modal Test**:
  - Mở chi tiết danh mục `Lập trình web` -> Hiển thị đầy đủ thông số ngày tạo, ngày cập nhật và số khóa học liên kết. Đóng modal bằng phím Escape hoặc nút đóng.
- **Responsive Layout**: Kiểm tra ở chế độ Desktop và Mobile, layout co giãn chuẩn xác, không bị vỡ giao diện.

---

## 21. Execution Trace

### Workflow Used
- `feature-development.md` — **USED**

### Skills Used
- `page-implementation` — **USED**
  - Đã xây dựng trang App Router `/admin/categories` với cấu trúc component rõ ràng, tách biệt Server/Client boundary và bố cục chuẩn Admin Portal.
- `api-integration` — **USED**
  - Đã tích hợp API endpoints từ `api/CATEGORY_API.md` và `api/ADMIN_API.md` thông qua `adminCategoryService`.
  - Xử lý đầy đủ race condition (`AbortController`), debounce search 500ms, và bắt lỗi HTTP 409 Conflict.
- `stitch-ui` — **USED**
  - Tuân thủ thiết kế Modern Academic Violet (`#7240b8`, `#a87ffb`), duy trì tính nhất quán thị giác với các trang F9.3 (Dashboard), F9.4 (Users), và F9.5 (Courses).
- `frontend-review` — **USED**
  - Rà soát toàn diện type safety, loại bỏ synchronous `setState` in effect, dọn dẹp unused imports, đảm bảo `tsc` và `eslint` vượt qua 100%.

### Workflow Gates
- **Context Gate**: **PASS** (Đã đọc kỹ `AGENTS.md`, các rules, `CATEGORY_API.md`, `ADMIN_API.md`, và code hiện có trước khi viết).
- **Scope Gate**: **PASS** (Tập trung tuyệt đối vào Admin Category Management, không đụng chạm tới các module ngoài phạm vi).
- **API/Backend Boundary Gate**: **PASS** (Chỉ làm việc trên Frontend repository `D:\e-learning`, không sửa backend).
- **Dependency Gate**: **PASS** (Không cài bất kỳ npm dependency mới nào).
- **Data Safety Gate**: **PASS** (Không tự ý xóa dữ liệu thật trên database; modal xóa có cảnh báo số lượng khóa học liên kết).
- **Validation Gate**: **PASS** (`tsc --noEmit`: PASS, `eslint`: PASS, `npm run build`: PASS, `browser_subagent`: PASS).

---

## 22. Known Limitations

- Backend hiện chưa hỗ trợ trường ảnh đại diện (`image`) cho Category. Đang hiển thị icon `FolderTree` đồng bộ.
- Số lượng khóa học liên kết được đếm thông qua API query `GET /api/admin/courses?category=:id&limit=1` thay vì trường nhúng sẵn trong response của `GET /api/categories/`.

---

## 23. Recommended Next Phase

- **Phase F9.7 — Admin Coupon Management** (Quản lý mã giảm giá toàn hệ thống và mã giảm giá của giảng viên).
- Dừng lại tại đây theo đúng hướng dẫn (FINAL STOP) và chờ người dùng review xác nhận trước khi tiếp tục.
