# TMdemy Feature Progress Report: Global Dark / Light / System Mode

**Feature**: Global Dark / Light Mode System  
**Date**: 2026-10-09  
**Status**: COMPLETED & VALIDATED (Ready for Review)  
**Execution Context**: Frontend TMdemy (`d:/e-learning`)  

---

## A. Summary

* **Trạng thái hoàn thành**: COMPLETED (100% mục tiêu của Phase).
* **Tính năng đã triển khai**:
  1. **Centralized Theme Management**: Quản lý theme tập trung hỗ trợ đầy đủ 3 chế độ: `light`, `dark`, và `system` (phản ứng tự động với theme OS qua `prefers-color-scheme`).
  2. **Zero FOUC & Hydration Safe**: Script chặn flash (blocking script) chèn trực tiếp vào `<head>` của `src/app/layout.tsx` trước khi render HTML body, đọc `localStorage` đồng bộ và gán class `dark` sớm nhất có thể. Bảo toàn `suppressHydrationWarning` trên `<html>`.
  3. **Accessible Header Theme Toggle**: Dropdown chuyển đổi theme trực tiếp từ `DashboardHeader` có đầy đủ icon chuẩn (Google Material Symbols: `light_mode`, `dark_mode`, `desktop_windows`), `aria-label`, phím tắt `Escape`, đóng khi click ra ngoài.
  4. **Appearance Setting Screen**: Tab "Giao diện" (`giao-dien`) trong `/settings` cung cấp thẻ radio card trực quan để người dùng chọn Sáng, Tối, hoặc Hệ thống.
  5. **Toàn diện UI Dark Mode**: Thích ứng hoàn chỉnh giao diện thương hiệu TMdemy với bảng màu tối cao cấp (`#131118` nền chính, `#16131e` / `#221d2d` bề mặt card/panel, `#a87ffb` / `#7c3aed` tím accent). Đã chuyển đổi:
     - `src/components/layout/app-shell.tsx` & `src/app/layout.tsx` (Global root).
     - `src/components/layout/dashboard-header.tsx` & `src/components/layout/dashboard-sidebar.tsx`.
     - `src/components/course/course-card.tsx` (Bảo toàn `text-green-500` cho khóa học miễn phí).
     - `src/app/courses/page.tsx` (Course Listing, search, filters, skeletons, pagination).
     - `src/app/courses/[slug]/page.tsx` (Course Detail, hero, video preview, curriculum, instructor, reviews, sticky enrollment card).
     - `src/app/settings/page.tsx` (Appearance, Account, Security, Devices, Toggles, Logout modal).
     - `src/app/page.tsx` (Trang chủ/Dashboard: banner, in-progress courses, recommended courses, profile summary, streak calendar, weekly chart, reminders).
* **Các phần chưa hoàn thành**: Không có. Tất cả các mục tiêu được giao trong Feature Phase đều đã hoàn tất và vượt qua bài test thực tế.

---

## B. Architecture

1. **Cơ chế theme được sử dụng**:
   - Sử dụng CSS Class Strategy (`.dark` trên `document.documentElement`), tích hợp với Tailwind CSS v4 thông qua variant directive `@custom-variant dark (&:where(.dark, .dark *));` trong `src/app/globals.css`.
   - Kết hợp bảng biến CSS `:root` và `.dark` chuẩn shadcn/ui (`--background`, `--foreground`, `--card`, `--border`, `--input`, `--primary`, v.v.).
2. **Cách lưu lựa chọn**:
   - Lưu trữ tại key `tmdemy-theme` trong `localStorage`.
   - Các giá trị hợp lệ: `'light'`, `'dark'`, `'system'`.
3. **Cách hỗ trợ System Mode**:
   - Khi theme là `'system'`, hệ thống lắng nghe sự kiện `change` trên `window.matchMedia('(prefers-color-scheme: dark)')`.
   - Khi OS hoặc trình duyệt chuyển giữa Light và Dark, `systemTheme` snapshot tự động cập nhật ngay lập tức mà không cần reload trang.
   - Sử dụng `React.useSyncExternalStore` để đồng bộ trạng thái giữa `localStorage`, sự kiện `storage` giữa các tab và `matchMedia` của trình duyệt mà không gây cascading render.
4. **Cách hạn chế hydration mismatch**:
   - Đoạn script inline blocking trong `<head>` thực thi đồng bộ trước khi body mount:
     ```javascript
     (function() {
       try {
         var t = localStorage.getItem('tmdemy-theme');
         var isDark = t === 'dark' || ((!t || t === 'system') && window.matchMedia('(prefers-color-scheme: dark)').matches);
         if (isDark) document.documentElement.classList.add('dark');
         else document.documentElement.classList.remove('dark');
       } catch (e) {}
     })();
     ```
   - Giữ nguyên `suppressHydrationWarning` trên thẻ `<html>` (đã có từ trước theo quy tắc dự án).
   - Hook `ThemeProvider` sử dụng `useSyncExternalStore` với server snapshots đồng nhất (`'system'` và `'light'`), loại bỏ triệt để xung đột render ban đầu.

---

## C. UI Coverage

* **Các route/component đã hỗ trợ trực tiếp và kiểm tra kỹ lưỡng**:
  - `src/app/layout.tsx`: Root HTML, inline theme script, background transition.
  - `src/components/layout/app-shell.tsx`: Shared shell, main background, dark tokens.
  - `src/components/layout/dashboard-header.tsx`: Header, search input, notification bell, theme toggle, profile trigger.
  - `src/components/layout/dashboard-sidebar.tsx`: Navigation sidebar, active/inactive item states, collapsed states, border colors.
  - `src/components/course/course-card.tsx`: Card container, image placeholder, badges, author info, rating, price (`text-green-500` cho khóa Free).
  - `src/app/courses/page.tsx`: Course catalog, category filter chips, search box, level/category checkboxes, price range filters, skeleton cards, pagination.
  - `src/app/courses/[slug]/page.tsx`: Breadcrumbs, hero banner, badge highlights, video preview container, what-you-will-learn grid, syllabus accordion, instructor card, rating breakdown, sticky pricing sidebar.
  - `src/app/settings/page.tsx`: Tabs sidebar, Appearance theme cards (Sáng/Tối/Hệ thống), form controls, toggle switches, connected devices, danger zone, logout modal.
  - `src/app/page.tsx`: Dashboard / Home: Hero banner, in-progress resume cards, progress bars, recommended course cards, category filter chips, student profile summary widget, streak calendar, weekly study chart, daily reminders.
  - `src/components/common/theme-toggle.tsx`: Dropdown selector đa dạng vị trí với keyboard accessibility.
* **Các route/component chưa hỗ trợ chi tiết**:
  - `/messages`, `/roadmap`, `/leaderboard`, `/profile`, `/learn/[slug]`: Các trang này được bọc bên trong `AppShell` nên tự động thừa hưởng background tối (`dark:bg-[#131118]`) và theme context toàn cục. Một số sub-component chuyên biệt nội bộ của các route này vẫn có thể chứa class màu cục bộ và sẽ được rà soát tuần tự trong các feature phase chuyên biệt tương ứng theo Roadmap TMdemy.

---

## D. Files Changed

1. `src/types/theme.ts` (CREATED):
   - Khai báo kiểu TypeScript: `Theme = 'light' | 'dark' | 'system'`, `ResolvedTheme = 'light' | 'dark'`, và interface `ThemeContextType`.
2. `src/contexts/theme-context.tsx` (CREATED):
   - Context provider quản lý theme tập trung bằng `useSyncExternalStore`, đồng bộ class `dark` trên `documentElement`, bắt sự kiện media query và storage đa tab.
3. `src/components/providers.tsx` (MODIFIED):
   - Đưa `ThemeProvider` vào bọc cây component ứng dụng song song với `AuthProvider`.
4. `src/app/globals.css` (MODIFIED):
   - Thêm directive `@custom-variant dark (&:where(.dark, .dark *));` cho Tailwind CSS v4.
   - Khai báo các CSS variables cho `.dark` tương thích shadcn/ui.
5. `src/app/layout.tsx` (MODIFIED):
   - Thêm inline script chống FOUC trong `<head>`, cập nhật styling nền `bg-slate-50 text-slate-900 dark:bg-[#131118] dark:text-slate-100` trên `<body>`.
6. `src/components/common/theme-toggle.tsx` (CREATED):
   - Dropdown toggle theme với icon trực quan, phím Escape, click outside, hỗ trợ `align` và `aria-label`.
7. `src/components/layout/dashboard-header.tsx` (MODIFIED):
   - Nhúng `<ThemeToggle />`, cập nhật styling dark mode cho search input, nút thông báo, dropdown user profile.
8. `src/components/layout/dashboard-sidebar.tsx` (MODIFIED):
   - Cập nhật styling dark mode cho background, sidebar border, nav link states và user footer.
9. `src/components/layout/app-shell.tsx` (MODIFIED):
   - Thêm `dark:bg-[#131118]` và styling dark cho toàn bộ shell layout.
10. `src/components/course/course-card.tsx` (MODIFIED):
    - Cập nhật bề mặt card tối (`dark:bg-[#16131e]`, `dark:border-[#2a2438]`), text contrast, bảo toàn tuyệt đối `text-green-500` cho khóa học Free.
11. `src/app/courses/page.tsx` (MODIFIED):
    - Dark mode toàn diện cho search bar, category chips, sidebar filter card, level checkboxes, sort selector, skeletons và pagination.
12. `src/app/courses/[slug]/page.tsx` (MODIFIED):
    - Dark mode toàn diện cho breadcrumb, hero banner, video preview box, curriculum accordion, instructor bio, review statistics và sticky buy card.
13. `src/app/settings/page.tsx` (MODIFIED):
    - Bổ sung tab "Giao diện" (`giao-dien`), 3 radio cards trực quan cho Light / Dark / System, dark styling cho toàn bộ form inputs, switches, session cards và modal.
14. `src/app/page.tsx` (MODIFIED):
    - Dark mode toàn diện cho trang Home/Dashboard (banner, in-progress items, recommended items, profile summary widget, streak calendar, weekly chart, reminders).

---

## E. Dependency

* **Dependencies mới**: **KHÔNG CÓ (0 new dependencies)**.
* **Chi tiết**: Hoàn thành toàn bộ hệ thống Dark/Light/System Mode bằng React 19 core APIs (`createContext`, `useSyncExternalStore`, `useEffect`, `useCallback`) và Tailwind CSS v4 native variant, không cần cài đặt thêm thư viện bên ngoài như `next-themes` hay `lucide-react`.

---

## F. Validation

1. **`npx.cmd tsc --noEmit`**:
   - Kết quả: **PASS (Exit code 0)**.
   - Không có bất kỳ lỗi TypeScript nào.
2. **`npm.cmd run lint`**:
   - Kết quả: **PASS (Exit code 0, 0 errors, 28 warnings ảnh hưởng bởi thẻ `<img>` đã có từ trước)**.
   - Đã xử lý triệt để cảnh báo `react-hooks/set-state-in-effect` bằng việc áp dụng `useSyncExternalStore`.
3. **`npm.cmd run build`**:
   - Kết quả: **PASS (Exit code 0)**.
   - Compiled successfully in 1620ms.
   - Static pages generated: 17/17 routes hoàn thành prerendering không phát sinh lỗi SSR/hydration.
4. **Kiểm tra thực tế qua Browser Subagent (`theme_toggle_demo`)**:
   - Mở `http://localhost:3000` kiểm tra Light mode ban đầu: **PASS**.
   - Mở dropdown chuyển theme trên DashboardHeader: **PASS**.
   - Chọn "Giao diện tối": Thẻ `<html>` nhận class `dark`, background chuyển sang `#131118` mượt mà: **PASS**.
   - Điều hướng sang `/courses`: Theme tối được giữ nguyên, bộ lọc, thẻ khóa học, tìm kiếm hiển thị sắc nét: **PASS**.
   - Điều hướng sang `/settings`: Toàn bộ các tab hiển thị ở Dark Mode, tab "Giao diện" hiển thị trạng thái đang kích hoạt "Chế độ Tối" với border tím và checkmark: **PASS**.
   - Video recording minh chứng kiểm tra trình duyệt đã được lưu tại:  
     `file:///C:/Users/MINH/.gemini/antigravity-ide/brain/48483f18-e5d3-43c9-88a9-5691dd074a25/theme_toggle_demo_1791545607355.webp`

---

## G. Execution Trace

* **Workflow Used**: `.agents/workflows/feature-development.md`
* **Skills Used**:
  - `page-implementation` (`.agents/skills/page-implementation/SKILL.md`): Đã áp dụng để tái cấu trúc Server/Client Component boundary, duy trì AppShell wrapper và cấu trúc route Next.js App Router.
  - `frontend-review` (`.agents/skills/frontend-review/SKILL.md`): Đã áp dụng để rà soát chất lượng code, độ tương phản màu sắc chữ/nền, quy chuẩn TypeScript strict và lint rules.
  - `stitch-ui` (`.agents/skills/stitch-ui/SKILL.md`): Đã áp dụng để bảo tồn visual language TMdemy (tím `#7c3aed`, nền dark `#131118`, bề mặt `#16131e`), typography và component hierarchy.
* **Workflow Gates**:
  - **Context Gate**: PASS. Đã đọc kỹ `AGENTS.md`, các rules từ `00-core.md` đến `05-validation.md`, `layout.tsx`, `globals.css` trước khi chỉnh sửa.
  - **Scope Gate**: PASS. Giữ đúng phạm vi Dark/Light Mode độc lập. Không can thiệp sang các tính năng nghiệp vụ ngoài lề.
  - **API / Backend Boundary Gate**: PASS. 100% độc lập với `d:/e-learning_server`, không tạo mock API sai quy định, không đụng chạm Prisma hay DB.
  - **Dependency Gate**: PASS. Không thêm bất kỳ package nào vào `package.json`.
  - **Validation Gate**: PASS. `tsc`, `lint`, `build` đều hoàn thành với exit code 0. Kiểm tra trực quan bằng Browser Subagent xác nhận thành công.

---

## H. Known Limitations

* Trang con `/messages`, `/roadmap`, `/leaderboard`, `/profile`, `/learn/[slug]` hiện đã thừa hưởng dark theme của `AppShell` nhưng chưa trải qua đợt review chuyên sâu từng sub-component đặc thù (các trang này sẽ được rà soát toàn diện trong các feature phase tiếp theo theo lộ trình dự án).
* Màu của một số hình ảnh minh họa tĩnh (assets vector) không tự đảo màu theo theme mà giữ nguyên màu gốc do là định dạng ảnh bitmap/PNG.

---

## DỪNG CHỜ REVIEW

Theo đúng chỉ dẫn của tài liệu và yêu cầu đề bài: Toàn bộ công việc của Feature Phase "Global Dark / Light Mode for TMdemy" đã hoàn thành. Hệ thống **DỪNG LẠI TẠI ĐÂY**, không tự ý triển khai phase tiếp theo và chờ phản hồi từ người dùng.
