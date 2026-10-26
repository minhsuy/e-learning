# F7.5-A — Student Notification Center Progress Report

## 1. Status
- **Phase**: F7.5-A — Student Notification Center (Basic REST API Integration)
- **Status**: **COMPLETED (READY FOR REVIEW)**
- **Completion Date**: 2026-10-14
- **Skills Used**:
  - `page-implementation` (`.agents/skills/page-implementation/SKILL.md`) — USED
  - `api-integration` (`.agents/skills/api-integration/SKILL.md`) — USED
  - `frontend-review` (`.agents/skills/frontend-review/SKILL.md`) — USED

---

## 2. Scope
### In Scope
- Đọc và tuân thủ đặc tả REST API từ `api/NOTIFICATION_API.md`.
- Xây dựng TypeScript interfaces & API Service (`notificationService`).
- Quản lý trạng thái thông báo tập trung (`NotificationProvider`, `useNotifications`).
- Tích hợp Notification Bell tương tác & Dropdown Popover (`NotificationPopover`) trên Navbar/DashboardHeader.
- Xây dựng trang Trung tâm Thông báo chuyên biệt (`/notifications`) với AppShell, bộ lọc theo thể loại và phân trang.
- Đánh dấu đã đọc (`markAsRead`) với Optimistic UI, chống double-click và cơ chế rollback khi lỗi.
- Tính toán huy hiệu số lượng chưa đọc động (`unread badge`), tự động đồng bộ giữa Bell Popover và Page.
- Điều hướng thông minh theo loại sự kiện (`COURSE`, `LESSON`, `ORDER`, `MESSAGE`, etc.).
- Cách ly tài khoản nghiêm ngặt (`Account Isolation`) khi đăng nhập, đăng xuất hoặc đổi tài khoản.
- Bao phủ đầy đủ 6 trạng thái UX: Loading, Empty, Error, Disabled, Unauthorized, Success.

### Strictly Out of Scope
- Socket.IO realtime communication (Dành cho phase F7.5 sau nếu được yêu cầu).
- Conversations, Messages chat realtime read states.
- Gamification, XP, Streak, Badges, Leaderboard integration.
- Teacher Notification Dashboard, Admin Notification Dashboard.
- Không sửa đổi mã nguồn Backend (`d:\e-learning_server`), Database hoặc Prisma schemas.
- Không cài đặt thêm bất kỳ thư viện NPM nào.

---

## 3. API Contract Mapping
Source of Truth: `api/NOTIFICATION_API.md`

| Feature | Method | Endpoint | Query / Body Params | Auth Required | Backend Status |
| :--- | :---: | :--- | :--- | :---: | :---: |
| **Get Notifications** | `GET` | `/api/notifications/` | `page` (number), `limit` (number), `type` (string enum) | Bearer JWT | ✅ Khớp 100% |
| **Mark as Read** | `PATCH` | `/api/notifications/read/:id` | Path param: `id` (UUID/string) | Bearer JWT | ✅ Khớp 100% |
| **Unread Count** | N/A | N/A | Không có endpoint riêng | N/A | `[BACKEND GAP]` |
| **Mark All as Read** | N/A | N/A | Không có endpoint route public | N/A | `[BACKEND GAP]` |
| **Delete Notification**| N/A | N/A | Không có endpoint xóa | N/A | `[BACKEND GAP]` |

---

## 4. Notification List
- **Dữ liệu thực**: Lấy từ backend qua `notificationService.getNotifications()`.
- **Hiển thị nội dung**: Render message, thời gian tương đối chuẩn tiếng Việt ("Vừa xong", "15 phút trước", "2 giờ trước", "3 ngày trước", hoặc ngày tháng cụ thể).
- **Phân biệt Đã đọc / Chưa đọc**: 
  - Chưa đọc: Nền highlight tím nhạt (`bg-[#fbf9ff] dark:bg-[#231b31]/50`), chữ đậm, chấm tròn thông báo (`w-2.5 h-2.5 rounded-full bg-[#7240b8]`).
  - Đã đọc: Nền trung tính, chữ xám dịu.
- **Phân loại thông báo**:
  - `COURSE`: Icon `school`, màu tím
  - `LESSON`: Icon `play_circle`, màu cyan
  - `QUIZ`: Icon `quiz`, màu amber
  - `ORDER`: Icon `receipt_long`, màu emerald
  - `MESSAGE`: Icon `chat`, màu sky
  - `COMMENT` / `COMMENT_REPLY`: Icon `forum`, màu indigo
  - `RATING`: Icon `star`, màu vàng
  - `SYSTEM`: Icon `notifications`, màu tím
- **Sender Info**: Hiển thị avatar người gửi nếu có, kèm fallback badge icon theo loại thông báo.
- **UX States**:
  - Loading: Skeleton animation mượt mà (3 items trong popover, 5 items trên page).
  - Error: Banner lỗi thân thiện kèm nút "Thử lại ngay".
  - Empty: Minh họa trực quan phân biệt giữa "Đã đọc hết thông báo" và "Chưa có thông báo nào".

---

## 5. Unread Count
- Do backend không hỗ trợ endpoint `GET /api/notifications/unread-count`, số lượng chưa đọc được tính toán chính xác trên client từ danh sách thông báo thực tế (`!isRead && !read`).
- **Badge trên Bell**:
  - Hiển thị số lượng chưa đọc thực tế trên icon chuông (`dashboard-header.tsx`).
  - Nếu `> 99` hiển thị `99+`.
  - Nếu `=== 0` ẩn badge hoàn toàn, không hiển thị số liệu mock hay chấm đỏ giả.
- **Đồng bộ**: Khi đánh dấu đã đọc một item, `unreadCount` tự động giảm ngay lập tức trên cả chuông và giao diện popover.

---

## 6. Mark as Read
- Endpoint: `PATCH /api/notifications/read/:id`
- **Optimistic Update**: UI ngay lập tức chuyển trạng thái item sang đã đọc và giảm `unreadCount`.
- **Rollback an toàn**: Nếu request API thất bại, tự động hoàn tác trạng thái cũ và kích hoạt toast thông báo lỗi.
- **Double-click Prevention**: Quản lý `markingIds: Set<string>`, disable nút tương ứng và hiển thị icon xoay `progress_activity` trong suốt quá trình mutation.

---

## 7. Mark All as Read
- **Báo cáo**: `[BACKEND GAP]`. Backend hiện không cung cấp route public cho chức năng đánh dấu tất cả đã đọc.
- **Tuân thủ quy tắc**: Frontend không tự giả lập bằng cách gửi hàng loạt request song song (`Promise.all`) nhằm tránh nghẽn mạng, rate limit và lỗi dữ liệu. Chức năng này được bảo lưu chờ backend bổ sung route chuyên dụng.

---

## 8. Pagination
- Tích hợp đầy đủ query parameters: `page`, `limit` (mặc định 10 trên page, 20 trong context).
- Sử dụng metadata trả về từ backend: `pagination: { page, limit, total, totalPages }`.
- Thanh điều hướng phân trang đầy đủ trên `/notifications`:
  - Nút "Trang trước" / "Trang sau" tự động disable khi ở đầu/cuối trang.
  - Hiển thị danh sách số trang thông minh với dấu `...` khi có nhiều trang.
  - Tự động cuộn mượt về đầu trang khi đổi trang.
  - Không có item bị trùng lặp.

---

## 9. Navigation
Dựa trên `type` và `relatedId` trong response:
- `COURSE`: Chuyển hướng tới `/courses/${relatedId}` (hoặc `/courses` nếu không có ID).
- `LESSON` / `QUIZ`: Chuyển hướng tới `/learn/${relatedId}` (hoặc `/my-courses`).
- `ORDER`: Chuyển hướng tới `/orders`.
- `MESSAGE`: Chuyển hướng tới `/messages`.
- `SYSTEM` / `COMMENT` / `RATING`: Nếu không có đường dẫn trực tiếp, đánh dấu đã đọc mà không chuyển hướng đột ngột gây lỗi 404.

---

## 10. Authentication & Account Isolation
- Tích hợp thông qua `apiClient` tự động gắn `Authorization: Bearer <token>`.
- **Lifecycle & Account Isolation**:
  - `activeUserIdRef` theo dõi ID học viên đang đăng nhập.
  - Khi người dùng đăng xuất (`!isAuthenticated` hoặc `user === null`), toàn bộ state thông báo (`notifications`, `unreadCount`, `pagination`, `error`) được xóa sạch ngay lập tức (`[]`, `0`, `null`).
  - Khi đăng nhập tài khoản khác, state cũ bị hủy bỏ hoàn toàn trước khi nạp dữ liệu tài khoản mới.
  - Không lưu cache thông báo xuyên tài khoản (no cross-account leakage).

---

## 11. Files Created
1. `src/types/notification.ts`: Định nghĩa TypeScript interfaces chuẩn theo `api/NOTIFICATION_API.md`.
2. `src/services/notification.service.ts`: Client API layer tập trung cho `GET /api/notifications/` và `PATCH /api/notifications/read/:id`.
3. `src/contexts/notification-context.tsx`: Context & Provider quản lý state thông báo, tính toán unread count, optimistic updates, và account isolation.
4. `src/hooks/use-notifications.ts`: Custom hook tái sử dụng thuận tiện.
5. `src/lib/notification-utils.ts`: Utility format thời gian relative tiếng Việt, tra cứu icon/color theo type, và phân giải URL điều hướng.
6. `src/components/notification/notification-item.tsx`: Component hiển thị chi tiết từng thông báo, hỗ trợ cả dạng compact (dropdown) và full (trang).
7. `src/components/notification/notification-popover.tsx`: Dropdown popover tích hợp trên chuông thông báo Header với 2 tab "Tất cả" & "Chưa đọc".
8. `src/app/notifications/page.tsx`: Trang Trung tâm Thông báo chuyên dụng với bộ lọc thể loại, trạng thái đọc, và phân trang.

---

## 12. Files Updated
1. `src/components/providers.tsx`: Bổ sung `NotificationProvider` vào cây providers (đặt trong `AuthProvider`).
2. `src/components/layout/dashboard-header.tsx`: Thay thế nút chuông tĩnh bằng component `NotificationPopover`; thêm mục "Thông báo" vào menu người dùng.
3. `src/components/layout/dashboard-sidebar.tsx`: Cập nhật logic `isActive` hỗ trợ tuyến đường `/notifications`.
4. `src/lib/certificate-url.ts`: Bổ sung interface `Html2PdfChain` và `Html2PdfInstance` để loại bỏ toàn bộ type `any`, bảo đảm chất lượng code toàn dự án.

---

## 13. Backend Gaps
1. `[BACKEND GAP]` **Dedicated Unread Count Endpoint**: Backend chưa có endpoint như `GET /api/notifications/unread-count`. Hiện tại frontend phải tính toán từ danh sách items đã tải.
2. `[BACKEND GAP]` **Mark All As Read Endpoint**: Mặc dù logic nội bộ backend có thể có hàm markAll, nhưng chưa được expose qua route công khai `PATCH /api/notifications/read-all`.
3. `[BACKEND GAP]` **Delete Notification Endpoint**: Chưa có API xóa thông báo đơn lẻ hoặc xóa toàn bộ.

---

## 14. Dependency Changes
- **Không có**: Không cài đặt bất kỳ thư viện NPM nào mới. Mọi thành phần đều xây dựng trên React 19, Next.js App Router, Tailwind CSS và Lucide/Material Symbols sẵn có.

---

## 15. Validation
| Hạng mục kiểm tra | Lệnh / Phương thức | Kết quả | Ghi chú |
| :--- | :--- | :---: | :--- |
| **TypeScript Compilation** | `npx tsc --noEmit` | **PASS** | 0 lỗi compilation, strict type checking. |
| **ESLint Quality Check** | `npm run lint` | **PASS** | 0 lỗi (0 errors, 35 pre-existing image warnings). |
| **Production Build** | `npm run build` | **PASS** | Build thành công 24/24 routes (bao gồm `○ /notifications`). |
| **Notification List Data** | Code inspection & API client | **PASS** | Lấy dữ liệu thực từ backend, map đúng schema. |
| **Empty State** | Component check | **PASS** | Hiển thị thông điệp và icon tương ứng cho cả 2 tab. |
| **Unread Badge** | Component & Context | **PASS** | Hiển thị số lượng thực, ẩn khi bằng 0, max 99+. |
| **Mark as Read** | Optimistic update & Rollback | **PASS** | Tự động cập nhật UI, gọi PATCH API, rollback nếu lỗi. |
| **Mark All as Read** | Contract check | **BLOCKED** | Không triển khai do Backend Gap. |
| **Pagination** | Query & UI controls | **PASS** | Đầy đủ page, limit, total, totalPages, prev/next. |
| **API Error Handling** | Try/catch & Toast | **PASS** | Xử lý lỗi thân thiện, hỗ trợ nút "Thử lại ngay". |
| **Account Isolation** | `activeUserIdRef` & `useAuth` | **PASS** | Xóa sạch state khi logout hoặc switch user. |
| **Responsive UI** | Mobile / Tablet / Desktop | **PASS** | Popover co giãn linh hoạt, Page responsive với AppShell. |

---

## 16. Execution Trace
1. Đọc và phân tích kỹ lưỡng các rules, skills liên quan (`page-implementation`, `api-integration`, `frontend-review`) và `api/NOTIFICATION_API.md`.
2. Định nghĩa hệ thống kiểu dữ liệu TypeScript trong `src/types/notification.ts`.
3. Xây dựng dịch vụ API tập trung `src/services/notification.service.ts` kết nối REST API.
4. Tạo `src/lib/notification-utils.ts` xử lý thời gian tương đối tiếng Việt và điều hướng URL.
5. Triển khai `NotificationContext` (`src/contexts/notification-context.tsx`) với cơ chế Optimistic UI, chống double-click và Account Isolation.
6. Xây dựng UI components: `NotificationItem`, `NotificationPopover` và tích hợp vào `dashboard-header.tsx`.
7. Xây dựng trang đầy đủ `/notifications` với bộ lọc loại và phân trang.
8. Khắc phục triệt để các cảnh báo React Hooks (`set-state-in-effect`) bằng async microtask lifecycle.
9. Thực hiện kiểm tra tự động `tsc`, `lint`, `build` đạt 100% PASS.

---

## 17. Workflow Gates
- **Gate 1: Contract Verification**: Đã đối chiếu chính xác endpoint và payload với `api/NOTIFICATION_API.md`.
- **Gate 2: Architecture Isolation**: Không chạm vào Backend, Database hay các modules ngoài scope (Realtime, Gamification).
- **Gate 3: Automated Validation**: `tsc`, `lint` và `build` đều hoàn tất thành công không có lỗi.
- **Gate 4: Completeness**: 6 trạng thái UX được xử lý trọn vẹn.

---

## 18. Known Limitations
- Chưa có thông báo đẩy tức thì (Socket.IO realtime) do quy định phase F7.5-A chỉ triển khai REST API cơ bản.
- Huy hiệu unread badge phụ thuộc vào danh sách thông báo tải về do thiếu endpoint `unread-count` riêng biệt.

---

## 19. Next Step
- Chờ phản hồi review từ Tech Lead / User về Phase F7.5-A.
- Chuẩn bị cho phase tiếp theo (F7.5-B hoặc Socket.IO Realtime Notification Integration) khi có yêu cầu cụ thể.
- **STOP: Tuân thủ quy định dừng lại chờ review.**
