# Báo cáo Tiến độ: F7.2-D — Favorite Courses & Bookmarks

**Thời gian thực hiện:** 13/10/2026  
**Dự án:** TMdemy Frontend (`d:/e-learning`)  
**Mục tiêu:** Triển khai chức năng Quản lý Khóa học Yêu thích (Favorite Courses & Bookmarks), đồng bộ hóa tương tác Favorite trên Course Card, Course Detail, trang Favorites chuyên biệt và liên kết từ Profile cá nhân theo chuẩn kiến trúc và API contract `api/FAVORITE_API.md`.

---

## 1. Danh sách Files đã Tạo & Chỉnh sửa

### Files tạo mới:
1. `src/types/favorite.ts`: Định nghĩa TypeScript types cho danh sách yêu thích (`FavoriteItem`, `FavoriteCourseData`, `GetFavoritesParams`, `GetFavoritesResponse`, `AddFavoriteResponse`, `RemoveFavoriteResponse`).
2. `src/services/favorite.service.ts`: Service giao tiếp với backend API cho các thao tác danh sách yêu thích (`getFavorites`, `addFavorite`, `removeFavorite`).
3. `src/contexts/favorite-context.tsx`: Context quản lý trạng thái yêu thích tập trung, xử lý optimistic update, rollback khi lỗi, chống duplicate request, đồng bộ hóa toàn cục và phân quyền đăng nhập.
4. `src/hooks/use-favorites.ts`: Custom hook tái sử dụng để truy cập context và thao tác yêu thích (`useFavorites`).
5. `src/app/favorites/page.tsx`: Giao diện chuyên biệt Quản lý Khóa học Yêu thích (`/favorites`) với đầy đủ 6 trạng thái UX (Loading skeleton, Error & retry, Empty state, Populated grid/list, Search, Sort và Pagination).
6. `docs/progress/F7_2_D_FAVORITE_COURSES.md`: Báo cáo tiến độ chi tiết của task F7.2-D.

### Files chỉnh sửa:
1. `src/components/providers.tsx`: Bọc `FavoriteProvider` vào cây providers bên trong `AuthProvider`.
2. `src/components/course/course-card.tsx`: Tích hợp `useFavorites`, hỗ trợ hiển thị icon yêu thích theo trạng thái thực tế, xử lý optimistic update, chống click trùng lặp (`loadingToggle`), chuyển hướng đăng nhập đối với khách.
3. `src/app/courses/[slug]/page.tsx`: Kết nối nút Favorite trên trang chi tiết khóa học vào `useFavorites` cho tất cả các loại khóa học (miễn phí, trả phí, đã ghi danh, chờ duyệt).
4. `src/app/profile/page.tsx`: Bổ sung nút truy cập nhanh "Khóa học yêu thích" ở phần CTA thông tin cá nhân và thẻ điều hướng "Khóa học yêu thích" ở cột hoạt động học tập mà không làm ảnh hưởng đến các chức năng F7.2-A, F7.2-B, F7.2-C.

---

## 2. API Endpoints Thực tế Sử dụng

Dựa trên Source of Truth trong `api/FAVORITE_API.md`:

| Endpoint | Method | Header / Auth | Chức năng | Ánh xạ Service |
| :--- | :---: | :---: | :--- | :--- |
| `/api/favorites/` | `GET` | `Bearer JWT required` | Lấy danh sách khóa học yêu thích có phân trang (`page`, `limit`) | `favoriteService.getFavorites({ page, limit })` |
| `/api/favorites/:id` | `POST` | `Bearer JWT required` | Thêm khóa học vào danh sách yêu thích theo `courseId` | `favoriteService.addFavorite(courseId)` |
| `/api/favorites/:id` | `DELETE` | `Bearer JWT required` | Xóa khóa học khỏi danh sách yêu thích theo `courseId` | `favoriteService.removeFavorite(courseId)` |

---

## 3. Chiến lược Đồng bộ Hóa Yêu thích (Favorite Synchronization Strategy)

* **Không thêm thư viện State Management mới:** Sử dụng React Context (`FavoriteContext`) và Custom Hook (`useFavorites`) sẵn có của React.
* **Bộ nhớ đệm ID toàn cục (`favoriteIds: Set<string>`):** 
  - Khi người dùng đăng nhập, `FavoriteProvider` nạp danh sách `courseId` của người dùng.
  - Mọi `CourseCard` và `CourseDetailPage` đều kiểm tra `isFavorite(courseId)` từ Set này, đảm bảo tính nhất quán trên toàn bộ ứng dụng.
* **Optimistic Update & Rollback:**
  - Khi bấm nút Favorite, UI lập tức cập nhật trạng thái icon (đầy/rỗng) và bật cờ loading (`togglingIds`).
  - Gửi request `addFavorite` hoặc `removeFavorite` đến API.
  - Nếu API thành công: hiển thị Toast thông báo ("Đã thêm khóa học vào danh sách yêu thích" / "Đã xóa khóa học khỏi danh sách yêu thích").
  - Nếu API thất bại: tự động Rollback lại trạng thái ban đầu và hiển thị thông báo lỗi chi tiết từ máy chủ.
* **Chặn Duplicate Requests:**
  - Kiểm tra `isToggling(courseId)`. Nếu thao tác đang diễn ra, nút bấm chuyển sang disabled/spinner và chặn các click tiếp theo cho đến khi hoàn tất.
* **Xử lý Khách chưa Đăng nhập:**
  - Nếu người dùng chưa đăng nhập bấm vào nút Favorite, hệ thống tự động điều hướng sang `/login?redirect=...` để bảo toàn luồng người dùng.

---

## 4. Kiểm thử & Đánh giá Chất lượng (Validation Results)

### A. Kiểm tra Mã nguồn Tĩnh
1. **TypeScript Type Check:**
   ```bash
   npx tsc --noEmit
   ```
   * **Kết quả:** `PASS` (0 errors).
2. **ESLint Linter:**
   ```bash
   npm run lint
   ```
   * **Kết quả:** `PASS` (0 errors, 30 warnings liên quan đến thẻ img cũ và font config bên ngoài).

### B. Kiểm thử Chức năng & User Flow (Scenarios)

| Kịch bản | Trạng thái | Ghi chú kiểm thử |
| :--- | :---: | :--- |
| **Route Guard & Unauthenticated Access** | `PASS` | Truy cập `/favorites` khi chưa đăng nhập tự động chuyển hướng về `/login?redirect=%2Ffavorites`. |
| **Favorite Action for Guests** | `PASS` | Nhấn icon Favorite trên Course Card khi chưa đăng nhập tự động chuyển hướng về `/login?redirect=%2Fcourses`. |
| **Empty State UI** | `PASS` | Hiển thị giao diện thân thiện với icon trái tim, thông báo chưa có khóa học và nút CTA dẫn tới `/courses`. |
| **Populated Grid & List Views** | `PASS` | Hỗ trợ chuyển đổi mượt mà giữa Chế độ lưới (Grid) và Danh sách (List), tích hợp thanh tìm kiếm và sắp xếp. |
| **Loading Skeleton** | `PASS` | Skeleton dạng pulse khớp với layout Grid/List trong khi đang nạp dữ liệu. |
| **Error Handling & Retry** | `PASS` | Banner thông báo lỗi kết nối kèm nút "Thử lại ngay". |
| **Pagination Navigation** | `PASS` | Hiển thị nút phân trang (Trước, số trang, Sau) khi `totalPages > 1`. |
| **Duplicate Request Prevention** | `PASS` | Bật spinner loading trên nút icon và vô hiệu hóa click lặp lại trong suốt thời gian gửi request. |
| **Course Detail Integration** | `PASS` | Tích hợp nút Favorite cho cả khóa học miễn phí, khóa học trả phí và khóa học đã ghi danh. |
| **Profile Quick Access** | `PASS` | Tích hợp nút truy cập nhanh trong Header CTA và Khối điều hướng Shortcut tại Profile mà không ảnh hưởng F7.2-A, B, C. |
| **Kiểm thử E2E với tài khoản đã seed thực tế** | `NOT RUN` | Cần tài khoản học viên có sẵn dữ liệu yêu thích từ backend để test luồng xóa động qua API. |

---

## 5. Ranh giới Kiến trúc & Backend Gaps

* **Tuân thủ ranh giới:** Không truy cập trực tiếp Prisma/database, không sửa backend `d:/e-learning_server`.
* **Backend Gaps:** Không có gap nào cản trở. API contract trong `api/FAVORITE_API.md` đã hỗ trợ đầy đủ `GET /api/favorites/`, `POST /api/favorites/:id`, và `DELETE /api/favorites/:id`.

---

## 6. Kết luận & Bước tiếp theo

Task **F7.2-D — Favorite Courses & Bookmarks** đã hoàn thành đầy đủ các tiêu chí thiết kế, trải nghiệm UX, types và tích hợp API.  
Hệ thống sẵn sàng để người dùng review. Không tự động chuyển sang F7.2-E.
