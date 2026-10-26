# BÁO CÁO BUGFIX F6.3 — MY COURSES LOADING & CLASSROOM FIRST-ENTRY FAILURE

**Dự án:** TMdemy E-learning  
**Phase:** BUGFIX F6.3  
**Thời gian hoàn thành:** 2026-10-09  
**Người thực hiện:** Frontend AI Engineer  

---

## 1. Hai lỗi ban đầu và cách tái hiện

### Bug A — Trang "Khóa học của tôi" không hiển thị đúng khóa học đã tham gia
- **Hiện tượng:** Người dùng đã tham gia/ghi danh khóa học nhưng vào mục "Khóa học của tôi" thì danh sách không tải được hoặc dẫn tới lỗi.
- **Cách tái hiện:**
  1. Người dùng bấm vào mục "Khóa học của tôi" trên thanh Sidebar (`DashboardSidebar`) hoặc trong menu Avatar người dùng (`DashboardHeader`).
  2. Đường dẫn thực tế bị trỏ cứng vào `/learn/react-nextjs-14` (mock slug không tồn tại trong database).
  3. Ngoài ra, trên trang chủ Dashboard (`/`), mục "Tiếp tục học" chỉ đọc danh sách giả lập `mockDashboardData.inProgressCourses` thay vì kết nối API enrollment thực tế của học viên.

### Bug B — Lỗi kết nối phòng học khi truy cập lần đầu
- **Hiện tượng:** Khi người dùng điều hướng từ trang khác (ví dụ: Course Detail hoặc My Courses) vào Classroom (`/learn/[slug]`), màn hình hiển thị:
  > *"Lỗi kết nối phòng học. Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng hoặc thử lại sau."*
  Tuy nhiên, khi nhấn **F5 / Reload** trang thì lại tải bình thường và vào học được.
- **Cách tái hiện:** 
  1. Người dùng đang ở một trang bất kỳ, bấm thẻ khóa học để điều hướng bằng Next.js Client-Side Navigation (`<Link href="/learn/:slug">`).
  2. Luồng mount kích hoạt request `GET /api/courses/:slug`.
  3. Cùng thời điểm đó, `useAuth()` khởi tạo và cập nhật trạng thái `user` / `isAuthenticated`.
  4. Sự thay đổi của `user` kích hoạt effect cleanup, gửi tín hiệu hủy `controller.abort()`.
  5. Request bị abort nhưng bị hệ thống client bắt nhầm thành lỗi sập mạng máy chủ, hiển thị ngay màn hình lỗi kết nối.

---

## 2. Root Cause (Nguyên nhân gốc rễ có bằng chứng)

### Root Cause Bug A
1. **Thiếu Route Trang Riêng:** Dự án trước đó chưa có trang canonical `/my-courses`. Cả `dashboard-sidebar.tsx` (dòng 19) và `dashboard-header.tsx` (dòng 103) đều gắn cứng đường dẫn:
   ```tsx
   { label: 'Khóa học của tôi', path: '/learn/react-nextjs-14', icon: 'school' }
   ```
   Do đó người dùng bấm "Khóa học của tôi" thì bị bay thẳng vào một bài học mock slug `react-nextjs-14` không tồn tại trong backend.
2. **Dashboard Home chưa kết nối dữ liệu thật:** Phần "Tiếp tục học" tại [src/app/page.tsx](file:///d:/e-learning/src/app/page.tsx) chỉ map mảng tĩnh `mockDashboardData.inProgressCourses` thay vì gọi `enrollmentService.getMyEnrollments()`.

### Root Cause Bug B
1. **`apiRequest` nuốt `AbortError` biến thành Network Error:**
   Tại [src/lib/api/client.ts](file:///d:/e-learning/src/lib/api/client.ts) (dòng 144):
   ```typescript
   try {
     res = await fetch(...);
   } catch (networkError) {
     throw new AppApiError({
       statusCode: 0,
       message: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng hoặc thử lại sau.',
       raw: networkError,
     });
   }
   ```
   Khi một request bị hủy bởi `AbortController.abort()`, `fetch` ném ra `AbortError`. Khối catch này đã bắt lấy `AbortError` và gói lại thành `AppApiError` với `statusCode: 0` và message `"Không thể kết nối đến máy chủ..."`.
2. **Race condition giữa khởi tạo Auth và nạp Classroom Data:**
   Tại [src/app/learn/[slug]/page.tsx](file:///d:/e-learning/src/app/learn/[slug]/page.tsx):
   `loadClassroomData` trước đây đặt `[slug, initialLessonParam, isAuthenticated, user]` làm dependencies.
   - Khi vừa vào trang lần đầu, component mount với `user = null` (AuthContext đang hydrate từ token).
   - Ngay sau đó, AuthContext hoàn tất load user, kích hoạt re-render.
   - Do `user` thay đổi, `useEffect` cleanup của render đầu tiên chạy: `controller.abort()` hủy bỏ request `GET /api/courses/:slug` đang chạy ngầm.
   - `apiRequest` biến `AbortError` thành `AppApiError(0)` ➔ `loadClassroomData` catch được và gán `errorMessage = "Không thể kết nối đến máy chủ..."`, dừng loading và hiện màn hình lỗi.
   - Khi người dùng **Reload (F5)**, quá trình render diễn ra đồng bộ sau khi state token đã sẵn sàng nên request không bị abort giữa chừng, dẫn đến việc reload thì học được.

---

## 3. Những file đã sửa và lý do

1. **[src/lib/api/client.ts](file:///d:/e-learning/src/lib/api/client.ts):**
   - *Lý do:* Kiểm tra nếu `networkError.name === 'AbortError'` thì re-throw trực tiếp nguyên trạng `networkError` thay vì bọc thành lỗi sập mạng. Giúp các hàm gọi API phân biệt chuẩn xác giữa "request bị hủy do component unmount/re-render" và "lỗi kết nối mạng thật sự".
2. **[src/app/learn/[slug]/page.tsx](file:///d:/e-learning/src/app/learn/[slug]/page.tsx):**
   - *Lý do:* Tách rời (`decouple`) hoàn toàn việc tải giáo trình công khai (Khóa học, chương, bài học) ra khỏi trạng thái xác thực (`user`/`isAuthenticated`). Giáo trình công khai chỉ phụ thuộc vào `slug`. Nạp tiến độ học và trạng thái ghi danh trong effect thứ hai độc lập, non-blocking. Thêm chốt chặn an toàn `if (signal?.aborted) return;`.
3. **[src/app/my-courses/page.tsx](file:///d:/e-learning/src/app/my-courses/page.tsx) (TẠO MỚI):**
   - *Lý do:* Xây dựng trang "Khóa học của tôi" chuẩn mực theo Stitch design, kết nối API thực `GET /api/enrollments/my`, hỗ trợ bộ lọc tab ("Tất cả", "Đang học", "Đã hoàn thành"), tìm kiếm theo tên khóa, thanh tiến độ %, badge trạng thái và nút "Vào học ngay" điều hướng trực tiếp tới `/learn/[slug]`.
4. **[src/components/layout/dashboard-sidebar.tsx](file:///d:/e-learning/src/components/layout/dashboard-sidebar.tsx):**
   - *Lý do:* Cập nhật link điều hướng của mục "Khóa học của tôi" từ mock link `/learn/react-nextjs-14` sang canonical route `/my-courses`.
5. **[src/components/layout/dashboard-header.tsx](file:///d:/e-learning/src/components/layout/dashboard-header.tsx):**
   - *Lý do:* Cập nhật link "Khóa học của tôi" trong avatar menu sang `/my-courses`.
6. **[src/app/page.tsx](file:///d:/e-learning/src/app/page.tsx):**
   - *Lý do:* Kết nối mục "Tiếp tục học" trên Dashboard Home với API `enrollmentService.getMyEnrollments()`. Nếu người dùng đã ghi danh các khóa học thật, hiển thị các khóa học thật với thanh tiến độ thật thay vì 3 khóa học mock cũ.

---

## 4. API Contract & Response Shape thực tế

### Endpoint: `GET /api/enrollments/my`
- **Method:** `GET`
- **Authentication:** `Bearer <ACCESS_TOKEN>`
- **Response Status:** `200 OK`
- **JSON Schema thực tế từ backend:**
  ```json
  {
    "success": true,
    "message": "Fetched enrolled courses successfully",
    "data": [
      {
        "id": "enrollment-uuid",
        "_id": "enrollment-uuid",
        "userId": "user-uuid",
        "courseId": "course-uuid",
        "progress": 45,
        "status": "ACTIVE",
        "enrolledAt": "2026-10-07T11:27:50.086Z",
        "completedAt": null,
        "course": {
          "id": "course-uuid",
          "_id": "course-uuid",
          "title": "Triển Khai Mô Hình AI Với NVIDIA Triton Inference Server",
          "slug": "trien-khai-mo-hinh-ai-nvidia-triton-inference-server",
          "image": "https://images.unsplash.com/...",
          "price": 0,
          "level": "BEGINNER",
          "type": "FREE",
          "sold": 10,
          "view": 120
        }
      }
    ]
  }
  ```
- **Xử lý mapping phía frontend:**
  - `response.data` là một mảng `ApiEnrollmentItem[]`.
  - Frontend kiểm tra `item && item.course && (item.course.slug || item.course.id || item.course._id)`.
  - Tiến độ tính bằng `Math.min(100, Math.max(0, item.progress ?? 0))`.
  - Khóa học hoàn thành nếu `item.status === 'COMPLETED'` hoặc `item.progress >= 100`.

---

## 5. Kết quả Validation

### TypeScript Check
```bash
npx tsc --noEmit
```
- **Exit Code:** `0` (PASS, không có bất kỳ lỗi kiểu dữ liệu nào).

### ESLint Check
```bash
npm run lint
```
- **Exit Code:** `0` (PASS, 0 errors, 30 warnings là khuyến nghị tối ưu `next/image` thông thường).

### Next.js Production Build
```bash
npm run build
```
- **Exit Code:** `0` (PASS, toàn bộ 18 routes biên dịch thành công, bao gồm dynamic route `ƒ /learn/[slug]` và static route `○ /my-courses`).

### HTTP Endpoint Checks
- `curl.exe -I http://localhost:3000/my-courses` ➔ `HTTP/1.1 200 OK`
- `curl.exe -I http://localhost:3000/learn/trien-khai-mo-hinh-ai-nvidia-triton-inference-server` ➔ `HTTP/1.1 200 OK`

---

## 6. Xác nhận tính toàn vẹn hệ thống & Backend Boundary

- **Không chỉnh sửa Backend:** Thư mục `d:/e-learning_server` được giữ nguyên 100% (chỉ đọc backend code để xác minh logic controller/repository).
- **Không dùng mock data để giả mạo thành công:** Trang `/my-courses` và Dashboard đều gọi `enrollmentService.getMyEnrollments()`. Khi không có enrollment, giao diện hiển thị trạng thái rỗng thân thiện (Empty State) kèm nút khám phá khóa học.
- **Không có dependency mới:** Không cài thêm bất kỳ thư viện npm nào.

---

## 7. Rủi ro & Khuyến nghị tiếp theo

- Khi người dùng đăng ký thêm một khóa học mới từ trang Checkout, cache hoặc state enrollment sẽ tự động được làm mới khi điều hướng về `/my-courses` do hàm fetch được chạy trong `useEffect` mỗi lần mount trang.
- Đã sẵn sàng để người phụ trách kiểm tra và nghiệm thu bugfix trước khi chuyển sang các giai đoạn tiếp theo.
