# TMDEMY FRONTEND — BÁO CÁO TIẾN ĐỘ GIAI ĐOẠN F4: UI LEARNING EXPERIENCE

## 1. Status

```text
COMPLETED
```

---

## 2. Environment

- **Workspace**: `d:/e-learning`
- **Framework**: Next.js 16.3.8 (Turbopack, App Router)
- **Library**: React 19.2.0
- **Language**: TypeScript 5.7 (Strict Mode)
- **Styling**: Tailwind CSS v4, Material Symbols Outlined, Lucide React

---

## 3. Route Migration

> [!IMPORTANT]
> **Previous**: Dashboard → `/dashboard`  
> **New**: Dashboard/Home → `/`  
> `/dashboard` is no longer the primary Home route.

### Migration Details:
1. **Primary Home (`/`)**: Route `/` hiện là TMdemy Home và render toàn bộ Dashboard UI hoàn chỉnh với AppShell, banner chào mừng học viên, thẻ "Tiếp tục học", khóa học đề xuất, bảng thống kê học tập, chuỗi streak chuyên cần, biểu đồ học tập tuần và nhắc nhở hạn chót.
2. **Legacy Redirect (`/dashboard`)**: Route `/dashboard` sử dụng hàm `redirect('/')` từ `next/navigation` để chuyển hướng vĩnh viễn mọi lượt truy cập cũ về `/`.
3. **Navigation Updates**:
   - `DashboardSidebar`: Link **"Tổng quan"** chuyển sang `/` (active khi `pathname === '/'`).
   - `DashboardSidebar`: Cập nhật liên kết **"Lộ trình"** (`/roadmap`), **"Chứng chỉ"** (`/certificates`), **"Bảng xếp hạng"** (`/leaderboard`), và **"Khóa học của tôi"** (`/learn/react-nextjs-14`).
   - `DashboardHeader`: Logo TMdemy và profile avatar link chuyển sang `/`.
   - `RouteGuard`: Cập nhật `getDefaultRolePath('user')` trả về `/` thay vì `/dashboard`. Trang đăng nhập (`/login`) tự động điều hướng học viên về `/` sau khi xác thực thành công.

---

## 4. Implemented Screens (Stitch Canonical Screens)

| Screen | Stitch Screen ID | Route | Status | Ghi chú thiết kế |
| :--- | :--- | :--- | :--- | :--- |
| **Dashboard / Home** | `4a6b385f44c243ba937bfc396c9b0912` | `/` | **COMPLETED** | Trang chủ TMdemy chính, kế thừa đầy đủ 100% UI Dashboard từ F3 |
| **Classroom** | `9d741fb3bb414d2691c907601bfdcc5a` | `/learn/[slug]` | **COMPLETED** | Trình phát video bài học, thanh tiến độ sticky, cây bài học accordion, tabs workspace Q&A và Ghi chú |
| **LearningRoadmap** | `88545ce5d79944d38e9ff1b436ff3c94` | `/roadmap` | **COMPLETED** | 5 cards thống kê, banner lộ trình Fullstack, timeline 6 giai đoạn liên tục, thẻ khóa học đề xuất |
| **Leaderboard** | `9808f99266bf46f89abb6879f7cdeb25` | `/leaderboard` | **COMPLETED** | Bục vinh danh Top 3 Podium (Vàng - Bạc - Đồng), thẻ hạng cá nhân, bảng xếp hạng chi tiết 15 học viên |
| **Certificates** | `866e5a3899714a54adacdd60c7c451a9` | `/certificates` | **COMPLETED** | 4 thẻ thành tích, văn bằng canvas họa tiết Guilloche, con dấu xác thực, định danh Blockchain hash |

---

## 5. Components Architecture

### Shared & Reused Components:
- [`AppShell`](file:///d:/e-learning/src/components/layout/app-shell.tsx): Cung cấp layout thống nhất cho toàn bộ 5 màn hình học viên.
- [`DashboardSidebar`](file:///d:/e-learning/src/components/layout/dashboard-sidebar.tsx): Thanh điều hướng mở rộng đầy đủ các route F4 (`/`, `/courses`, `/roadmap`, `/certificates`, `/leaderboard`, `/learn/react-nextjs-14`).
- [`DashboardHeader`](file:///d:/e-learning/src/components/layout/dashboard-header.tsx): Tái sử dụng thanh header có thanh tìm kiếm, streak counter và avatar học viên.
- [`RouteGuard`](file:///d:/e-learning/src/components/auth/route-guard.tsx): Cập nhật đường dẫn vai trò mặc định cho học viên sang `/`.

### Screen Pages Implemented:
- [`src/app/page.tsx`](file:///d:/e-learning/src/app/page.tsx): TMdemy Home Dashboard UI.
- [`src/app/dashboard/page.tsx`](file:///d:/e-learning/src/app/dashboard/page.tsx): Legacy redirect về `/`.
- [`src/app/learn/[slug]/page.tsx`](file:///d:/e-learning/src/app/learn/[slug]/page.tsx): Classroom video player & interactive curriculum workspace.
- [`src/app/roadmap/page.tsx`](file:///d:/e-learning/src/app/roadmap/page.tsx): Learning Roadmap 6-stage timeline.
- [`src/app/leaderboard/page.tsx`](file:///d:/e-learning/src/app/leaderboard/page.tsx): Podium Top 3 và bảng xếp hạng thi đua.
- [`src/app/certificates/page.tsx`](file:///d:/e-learning/src/app/certificates/page.tsx): Thư viện chứng chỉ và định danh Blockchain.

### Mock Data Files:
- [`src/data/mock-classroom.ts`](file:///d:/e-learning/src/data/mock-classroom.ts): Dữ liệu cây 5 chương, 40 bài giảng, bài giảng hiện tại (useMemo & useCallback), tài nguyên đính kèm.
- [`src/data/mock-roadmap.ts`](file:///d:/e-learning/src/data/mock-roadmap.ts): Dữ liệu 6 giai đoạn phát triển Fullstack Web Developer và chỉ số tổng quan.
- [`src/data/mock-leaderboard.ts`](file:///d:/e-learning/src/data/mock-leaderboard.ts): Dữ liệu Top 3 vinh danh và danh sách xếp hạng 15 học viên.
- [`src/data/mock-certificates.ts`](file:///d:/e-learning/src/data/mock-certificates.ts): Dữ liệu 3 chứng chỉ đã cấp với Blockchain hash và 1 chứng chỉ đang theo học.

---

## 6. Data & Boundaries

- **Business API Integration**: `NOT IMPLEMENTED` (Tuân thủ nghiêm ngặt nguyên tắc UI-First của phase F4).
- **Database Integration**: `NOT IMPLEMENTED` (Không can thiệp DB, không tạo Prisma Client hay DB drivers).
- **Static Placeholder Data**: `USED FOR UI ONLY` (Toàn bộ dữ liệu UI được định nghĩa rõ ràng qua TypeScript interface trong `src/data/`).
- **Fake API Routes**: `NONE` (Không tạo bất kỳ mock API hay route `/api/mock/*` nào).

---

## 7. Validation & Verification

### Static Checks:
```bash
npx tsc --noEmit     # PASS (0 errors)
npm run lint         # PASS (0 errors)
npm run build        # PASS (Tất cả 14 routes statically prerendered thành công)
```

### Visual Browser Validation:
Browser Subagent đã kiểm tra toàn diện và ghi lại hình ảnh trực quan tại port `3000`:
- `/`: Home Dashboard UI hiển thị chuẩn xác với hero banner và thống kê chuyên cần.
- `/dashboard`: Tự động chuyển hướng URL về `/`.
- `/learn/react-nextjs-14`: Khung video cinema, các nút điều khiển tùy biến, danh sách chương bài học tương tác, tabs Q&A và Ghi chú hoạt động mượt mà.
- `/roadmap`: Hiển thị rõ nét timeline 6 giai đoạn có trạng thái Đã hoàn thành (xanh lá), Đang học (tím), và Khóa (xám).
- `/leaderboard`: Bục vinh danh Podium 3 bậc có vương miện, huy chương, thẻ hạng cá nhân (#12), bảng xếp hạng chi tiết.
- `/certificates`: Thẻ văn bằng với hoa văn bảo mật, con dấu TMdemy Academy và nút sao chép mã băm Blockchain.

---

## 8. Backend & Contract Boundaries

- **Backend Changes**: `NONE` (Thư mục backend hoàn toàn không bị can thiệp).
- **API Contract Changes**: `NONE` (Đặc tả API trong `/api` giữ nguyên 100%).
- **Database Changes**: `NONE`.

---

## 9. F2 & F3 Preservation

- **Authentication Architecture (F2)**: `PRESERVED 100%` (`AuthProvider`, `useAuth`, `RouteGuard`, dual-token JWT storage không bị suy suyển).
- **Core UI Screens (F3)**: `PRESERVED 100%` (`/courses`, `/courses/[slug]`, và Dashboard UI ban đầu đều được giữ nguyên vẹn và tích hợp hài hòa).

---

## 10. Known Issues

- Không có lỗi runtime hay lỗi giao diện nào tồn tại.
- Các tính năng tương tác học tập (đánh dấu bài học, tạo câu hỏi Q&A, lưu ghi chú cá nhân, tải file tài liệu) đang hoạt động ở tầng UI state phục vụ trải nghiệm xem trước giao diện và sẽ được kết nối REST API / WebSocket ở giai đoạn tích hợp sau.

---

## 11. Ready for F5

```text
YES
```
Tất cả các màn hình khu vực học viên theo đặc tả thiết kế Stitch đã hoàn tất 100%, sẵn sàng cho giai đoạn tiếp theo theo lộ trình.
