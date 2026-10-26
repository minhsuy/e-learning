# TMdemy — Báo Cáo Triển Khai Phase F7.5-C: Learning Gamification (Frontend)

- **Giai đoạn (Phase)**: F7.5-C — Learning Gamification & Leaderboard Experience
- **Ngày hoàn thành**: 15/10/2026
- **Trạng thái**: **COMPLETED**
- **Kỹ sư phụ trách**: Frontend Engineer (Antigravity)
- **Quy chuẩn tuân thủ**: `AGENTS.md`, `00-core.md`, `01-architecture.md`, `02-api-boundary.md`, `03-ui-ux.md`, `04-code-quality.md`, `05-validation.md`
- **Hợp đồng dữ liệu (Source of Truth)**: `api/GAMIFICATION_LEADERBOARD_API.md`

---

## 1. Tổng Quan & Mục Tiêu

Phase **F7.5-C** triển khai trải nghiệm Gamification học tập toàn diện cho TMdemy Frontend, kết nối trực tiếp với hệ thống tính điểm kinh nghiệm (XP), cấp bậc danh hiệu động (Dynamic Rank Derivation), chuỗi ngày học chuyên cần (Learning Streak) và bảng xếp hạng thi đấu tiêu chuẩn (Standard Competition Ranking 1224) của backend.

Hệ thống loại bỏ hoàn toàn dữ liệu giả (`mockLeaderboardData`), tích hợp dữ liệu thực từ PostgreSQL Window Functions, hỗ trợ đầy đủ 6 trạng thái UX cho cả khách vãng lai (Guest) và học viên đã đăng nhập (Authenticated Student).

---

## 2. Các Chức Năng Đã Triển Khai (Implemented Features)

### 2.1. Bảng Xếp Hạng Toàn Hệ Thống (`/leaderboard`)
- **Top 3 Podium Hero (Bục vinh danh)**:
  - **Quán quân (Hạng 1 - Vàng)**: Vương miện vàng, avatar viền vàng nổi bật, tên học viên, cấp bậc, tổng điểm XP và chuỗi streak liên tiếp.
  - **Á quân 1 (Hạng 2 - Bạc)**: Bục bạc bên trái, avatar viền bạc, thứ hạng 2, tổng XP và streak.
  - **Á quân 2 (Hạng 3 - Đồng)**: Bục đồng bên phải, avatar viền đồng, thứ hạng 3, tổng XP và streak.
- **Thẻ Vị Trí Cá Nhân (Current User Rank Hero Card)**:
  - **Khi đã đăng nhập**: Hiển thị avatar học viên, huy hiệu thứ hạng (`#rank`), tên học viên, danh hiệu cấp bậc (`rankName` + `rankLevel`), tổng XP, chuỗi ngày streak và thanh tiến độ phần trăm thăng hạng kế tiếp (kèm số XP còn thiếu). Nút CTA *"Vào học tích lũy XP"* điều hướng nhanh vào khóa học.
  - **Khi chưa đăng nhập (Khách)**: Hiển thị Banner nhắc nhở thân thiện kèm nút CTA *"Đăng nhập ngay"* (chuyển hướng `/login?redirect=/leaderboard`).
- **Bảng Xếp Hạng Chi Tiết (Rankings Table)**:
  - Hiển thị danh sách từ hạng 4 trở đi (trang 1) hoặc toàn bộ trang hiện tại.
  - Cột dữ liệu: Hạng thi đấu, Thông tin học viên (Avatar + Username), Huy hiệu danh hiệu (Beginner, Explorer, Learner, Skilled, Advanced, Expert, Master), Tổng điểm XP, Chuỗi ngày Streak.
  - Nhận diện và làm nổi bật dòng của chính người dùng (highlight nền tím + huy hiệu *"Bạn"*).
  - Phân trang chuẩn (`page`, `limit: 20`, `total`, `totalPages`) với nút *"Trang trước"* / *"Trang sau"*.

### 2.2. Nhật Ký Biến Động Điểm Thưởng XP (`XpHistoryList`)
- Tab tích hợp trực tiếp trên trang `/leaderboard`:
  - Bộ lọc sự kiện: `Tất cả biến động`, `Bài học (+70 XP)`, `Bài kiểm tra (+100 XP)`, `Chuyên cần (+20 XP)`.
  - Hiển thị từng giao dịch điểm kinh nghiệm: Icon loại sự kiện, tiêu đề, mô tả, thời gian ghi nhận (định dạng chuẩn `Asia/Ho_Chi_Minh`), số điểm cộng xanh lá (`+70 XP`, `+100 XP`, `+20 XP`).
  - Xử lý trạng thái khi chưa đăng nhập (yêu cầu login) và trạng thái rỗng khi chưa có giao dịch.

### 2.3. Cẩm Nang Cấp Bậc & Quy Chế Điểm Thưởng (`RankSystemGuide`)
- Tab hướng dẫn trực quan:
  - **Quy chuẩn 3 loại điểm thưởng**: Hoàn thành bài học (+70 XP, Idempotent), Vượt qua Quiz (+100 XP), Thưởng Streak ngày mới (+20 XP).
  - **7 Cấp bậc danh hiệu học viên**: Beginner (0 - 499 XP), Explorer (500 - 1.499 XP), Learner (1.500 - 2.999 XP), Skilled (3.000 - 5.999 XP), Advanced (6.000 - 9.999 XP), Expert (10.000 - 19.999 XP), Master (≥ 20.000 XP).
  - **Giải thích thuật toán thi đấu tiêu chuẩn**: Standard Competition Ranking (`RANK()` 1224) khi đồng điểm XP.

### 2.4. Tích Hợp Streak & XP Trên Header (`DashboardHeader`)
- **Badge Ngọn Lửa Streak (Dynamic Streak Badge)**:
  - Hiển thị trực quan `{streak} ngày Streak` kèm icon ngọn lửa `local_fire_department`.
  - Hiệu ứng phát sáng & đổi màu nổi bật khi học viên đã hoàn thành hoạt động học trong ngày hôm nay (`hasStudiedToday = true`).
  - Nhấp vào badge chuyển hướng trực tiếp đến `/leaderboard`.
- **Thanh Tóm Tắt XP trong Dropdown Avatar**:
  - Khi học viên bấm vào avatar góc phải, menu dropdown hiển thị thanh mini-gamification với số điểm `⭐ {xpTotal} XP` và danh hiệu cấp bậc.
  - Bổ sung mục menu *"Bảng xếp hạng"* dẫn tới `/leaderboard`.

### 2.5. Tích Hợp Gamification Trên Trang Chủ / Dashboard (`src/app/page.tsx`)
- Thay thế hoàn toàn dữ liệu tĩnh trong Right Sidebar:
  - **Thẻ Hồ Sơ Học Viên**: Hiển thị tên thật, avatar thật, danh hiệu động kèm cấp độ (ví dụ: `Beginner • Cấp 1`), tổng điểm XP thật.
  - **Thanh Tiến Độ Lên Cấp (Next Rank Progress Bar)**: Tự động tính toán % tiến độ và khoảng cách điểm cần đạt để thăng hạng tiếp theo.
  - **Khối 3 Chỉ Số Đo Lường**:
    - `Ngày Streak`: Chuỗi ngày học liên tục thật (kèm nhãn *"Đã học ✓"* khi hoàn thành hôm nay).
    - `Toàn trường`: Thứ hạng chính xác trên bảng xếp hạng toàn cầu (`#{rank}`), có link dẫn tới `/leaderboard`.
    - `Cấp bậc`: Cấp độ hiện tại (`Lv.1` đến `Lv.7`).
  - **Chuỗi Chuyên Cần Tuần**: Hiển thị trạng thái hoàn thành học tập hôm nay dựa trên so sánh múi giờ `Asia/Ho_Chi_Minh`.

---

## 3. Danh Sách API Đã Tích Hợp (API Integration Matrix)

Toàn bộ các endpoint đều tuân thủ hợp đồng tại `api/GAMIFICATION_LEADERBOARD_API.md`:

| STT | Phương thức | Endpoint | Service Function | Trạng thái tích hợp | Mục đích sử dụng |
| :---: | :---: | :--- | :--- | :---: | :--- |
| 1 | `GET` | `/api/leaderboard` | `gamificationService.getLeaderboard` | **FULL (100%)** | Lấy danh sách bảng xếp hạng toàn cầu theo điểm XP (`RANK()` 1224), hỗ trợ phân trang `page`, `limit` và `includeMe=true`. |
| 2 | `GET` | `/api/leaderboard/me` | `gamificationService.getUserLeaderboardPosition` | **FULL (100%)** | Lấy thứ hạng của học viên hiện tại phục vụ Widget Toàn trường và Profile summary. |
| 3 | `GET` | `/api/users/me/xp-summary` | `gamificationService.getXpSummary` | **FULL (100%)** | Lấy tổng quan điểm XP, cấp bậc hiện tại, cấp bậc kế tiếp, số điểm cần thăng hạng và thời điểm hoạt động cuối. |
| 4 | `GET` | `/api/users/me/streak` | `gamificationService.getStreak` | **FULL (100%)** | Lấy chuỗi ngày học liên tiếp (`currentStreak`), kỷ lục (`longestStreak`) và múi giờ `Asia/Ho_Chi_Minh`. |
| 5 | `GET` | `/api/users/me/xp-history` | `gamificationService.getXpHistory` | **FULL (100%)** | Lấy nhật ký các giao dịch cộng điểm XP có phân trang và lọc theo loại sự kiện (`LESSON_COMPLETED`, `QUIZ_COMPLETED`, `DAILY_STREAK`). |

---

## 4. Danh Sách Tệp Đã Tạo Mới & Cập Nhật (Files Created/Updated)

### 4.1. Tệp tạo mới
1. [src/types/gamification.ts](file:///d:/e-learning/src/types/gamification.ts):
   - Định nghĩa toàn bộ interfaces cho XP, Rank, Streak, Leaderboard, XPTransaction, Filter params và Response DTOs.
2. [src/services/gamification.service.ts](file:///d:/e-learning/src/services/gamification.service.ts):
   - Đóng gói 5 phương thức gọi REST API sử dụng `apiClient` tập trung, tự động gắn Bearer Token và quản lý refresh token.
3. [src/hooks/use-gamification.ts](file:///d:/e-learning/src/hooks/use-gamification.ts):
   - Custom hook `useGamificationOverview()` quản lý trạng thái, tính toán level progress, xác định học viên đã học hôm nay theo múi giờ `Asia/Ho_Chi_Minh`, và helper `getRankBadgeConfig()`.
4. [src/components/gamification/xp-history-list.tsx](file:///d:/e-learning/src/components/gamification/xp-history-list.tsx):
   - Component hiển thị nhật ký giao dịch XP, bộ lọc loại sự kiện, phân trang, và đầy đủ các trạng thái Loading, Empty, Error, Unauthorized.
5. [src/components/gamification/rank-system-guide.tsx](file:///d:/e-learning/src/components/gamification/rank-system-guide.tsx):
   - Component cẩm nang quy chế cấp điểm thưởng và bảng đối chiếu 7 cấp bậc danh hiệu.

### 4.2. Tệp cập nhật
1. [src/app/leaderboard/page.tsx](file:///d:/e-learning/src/app/leaderboard/page.tsx):
   - Tái cấu trúc hoàn toàn từ mock data sang 100% Real API integration.
   - Thêm hệ thống 3 Tab (Bảng xếp hạng, Lịch sử XP, Quy chế).
   - Tích hợp bục vinh danh Top 3, thẻ vị trí cá nhân và bảng xếp hạng chi tiết.
2. [src/components/layout/dashboard-header.tsx](file:///d:/e-learning/src/components/layout/dashboard-header.tsx):
   - Kết nối Streak Badge trên Header với dữ liệu thực tế, thêm hiệu ứng xung động khi đã hoàn thành bài học hôm nay, dẫn link tới `/leaderboard`.
   - Bổ sung thanh mini XP strip và link *"Bảng xếp hạng"* trong dropdown avatar.
3. [src/app/page.tsx](file:///d:/e-learning/src/app/page.tsx):
   - Kết nối Right Sidebar và Hero Banner với `useGamificationOverview()`.
   - Hiển thị XP thật, Cấp bậc thật, Streak thật, Thứ hạng toàn trường thật và tiến độ lên cấp.

---

## 5. Ranh Giới Backend & Khoảng Trống Ghi Nhận (Backend Gaps)

Tuân thủ nghiêm ngặt **Rule 00**, **Rule 02** và hướng dẫn tại mục 3 của đề bài: Không tự ý tạo API, không sửa backend, không mock số giả để tự nhận hoàn thành. Các khoảng trống backend được ghi nhận chi tiết:

1. **`[BACKEND GAP]` Daily Goal & Phút Học Hôm Nay**:
   - **Năng lực còn thiếu**: Học viên đặt mục tiêu học tập hàng ngày (ví dụ: 30 phút/ngày hoặc hoàn thành 2 bài học/ngày) cùng hệ thống theo dõi phút học thực tế trong ngày.
   - **Endpoint mong đợi**: `GET /api/users/me/daily-goal`, `PUT /api/users/me/daily-goal`.
   - **Xử lý ở Frontend**: Giữ giao diện chỉ số tập trung vào **Chuỗi chuyên cần (Streak)** và **Cấp bậc danh hiệu**, không sinh số phút giả lập.
2. **`[BACKEND GAP]` Achievement / Badges (Huy hiệu học tập)**:
   - **Năng lực còn thiếu**: Danh mục các huy hiệu thành tích đã đạt và chưa đạt (ví dụ: *"Chiến binh 7 ngày Streak"*, *"Chinh phục khóa học đầu tiên"*).
   - **Endpoint mong đợi**: `GET /api/users/me/achievements` hoặc `GET /api/achievements`.
   - **Xử lý ở Frontend**: Không tạo dữ liệu huy hiệu giả. Trải nghiệm gamification tập trung vào **7 Rank Tiers** (Beginner đến Master) và **XP Transaction Log** mà backend đang hỗ trợ mạnh mẽ.
3. **`[BACKEND GAP]` Bộ lọc thời gian (Timeframe) & Phạm vi (Scope) trên Leaderboard**:
   - **Năng lực còn thiếu**: Endpoint `GET /api/leaderboard` hiện chỉ xếp hạng tích lũy toàn thời gian (`RANK() OVER (ORDER BY xp_total DESC)`). Chưa hỗ trợ tham số `timeframe=weekly|monthly` hoặc `scope=course|group`.
   - **Xử lý ở Frontend**: Hiển thị nhãn minh bạch *"Toàn thời gian (Chính thức)"* và gắn nhãn thông tin thân thiện cho người dùng biết các bộ lọc chu kỳ đang được phát triển.
4. **`[BACKEND GAP]` Biến động thứ hạng kỳ trước (Rank Change ▲ / ▼)**:
   - **Năng lực còn thiếu**: Backend tính trực tiếp `RANK()` tại thời điểm truy vấn, không lưu snapshot lịch sử thứ hạng để tính delta tăng giảm.
   - **Xử lý ở Frontend**: Hiển thị thứ hạng thi đấu chuẩn xác, không tự bịa đặt số tăng giảm giả.

---

## 6. Kết Quả Xác Thực Kỹ Thuật (Validation Results)

### 6.1. TypeScript Compiler Check
```bash
cmd /c npx tsc --noEmit
```
- **Kết quả**: **PASS (0 errors)**.
- Toàn bộ các kiểu dữ liệu và props đều chặt chẽ, không sử dụng `any` hay `@ts-ignore`.

### 6.2. ESLint Check
```bash
cmd /c npm run lint
```
- **Kết quả**: **PASS (0 errors, 35 warnings)**.
- 0 lỗi phát sinh. Toàn bộ cảnh báo còn lại là các cảnh báo thẻ `<img>` có sẵn từ các màn hình trước. Lỗi `react-hooks/set-state-in-effect` đã được xử lý triệt để bằng mô hình microtask scheduling.

### 6.3. Production Build Check
```bash
cmd /c npm run build
```
- **Kết quả**: **PASS (0 errors)**.
- Biên dịch thành công toàn bộ 24 routes tĩnh và động, route `/leaderboard` được tối ưu hóa thành Static Page.

### 6.4. Browser Subagent E2E Verification
1. **Kiểm thử Luồng Khách (Guest View)**:
   - Truy cập `http://localhost:3000/leaderboard`.
   - Kết quả: Bục vinh danh Top 3 hiển thị chuẩn xác (Hạng 1: Khang 24.700 XP, Hạng 2: Kiệt 22.740 XP, Hạng 3: Khoa 20.800 XP).
   - Thẻ vị trí học viên hiển thị Banner nhắc đăng nhập thân thiện.
   - Bảng xếp hạng chi tiết hiển thị đúng từ hạng 4 trở đi.
   - Chuyển tab *Cẩm nang Cấp Bậc & Quy Chế* hiển thị đầy đủ 7 cấp bậc và quy tắc điểm thưởng.
   - Chuyển tab *Lịch Sử Điểm XP* hiển thị thông báo yêu cầu đăng nhập.
2. **Kiểm thử Luồng Học Viên Đã Đăng Nhập (Authenticated View)**:
   - Đăng nhập tài khoản `student@example.com` / `Password123`.
   - Kết quả: Header hiển thị Streak Badge với icon ngọn lửa. Dropdown avatar hiển thị thanh XP (`0 XP • Beginner`) và link Bảng xếp hạng.
   - Trang chủ (`/`): Right sidebar hiển thị đúng tên `Student Example`, cấp độ `Beginner • Cấp 1`, điểm XP, thanh tiến độ lên cấp Explorer, và thứ hạng toàn trường `#61`.
   - Trang `/leaderboard`: Current User Hero Card hiển thị chính xác tên `Student Example`, thứ hạng `#61`, cấp độ Beginner (Lv.1), 0 XP, 0 ngày streak và thanh tiến độ lên rank kế tiếp.
   - Tab *Lịch Sử Điểm XP*: Nhận diện phiên đăng nhập thành công, sẵn sàng hiển thị danh sách giao dịch.
- **Bằng chứng ghi hình**: `authenticated_gamification_test_1792063383731.webp`.

---

## 7. Đánh Giá Độ Phủ 6 Trạng Thái UX (UX States Coverage)

| Trạng thái UX | Triển khai tại `/leaderboard` & Gamification Components |
| :--- | :--- |
| **Loading** | Skeleton loaders toàn diện cho Bục vinh danh, Thẻ vị trí cá nhân và Bảng xếp hạng chi tiết. |
| **Empty** | Khung rỗng kèm icon và thông điệp lịch sự khi chưa có dữ liệu xếp hạng hoặc chưa có lịch sử XP. |
| **Error** | Alert banner màu đỏ thân thiện có nút *"Thử lại"* khi gặp sự cố mạng hoặc lỗi máy chủ. |
| **Disabled** | Nút chuyển trang (Trước / Sau) bị disable khi đang tải hoặc khi đã ở trang đầu/trang cuối. |
| **Unauthorized** | Xử lý mượt mà cho khách: xem được bảng xếp hạng công khai, thẻ vị trí cá nhân chuyển thành lời mời đăng nhập dẫn sang `/login?redirect=...`. |
| **Success** | Dữ liệu thời gian thực hiển thị sống động, phân hạng thi đấu chuẩn mực và điều hướng mượt mà. |

---

## 8. Bước Khuyến Nghị Tiếp Theo (Next Steps)

1. **Backend Enhancement**: Bổ sung endpoint `GET /api/users/me/daily-goal` và `GET /api/users/me/achievements` để mở rộng thêm huy hiệu học tập và mục tiêu giờ học hàng ngày.
2. **Leaderboard Filtering**: Bổ sung hỗ trợ query param `timeframe` (tuần/tháng) tại tầng SQL backend để kích hoạt đầy đủ các nút bấm lọc thời gian.
3. **Optimistic Feedback**: Kích hoạt hiệu ứng chúc mừng (Confetti / Toast) khi học viên hoàn thành bài học và được cộng ngay `+70 XP` trong Classroom.
