# F7.5-B.1 — Realtime Notifications Frontend Integration & Fix Report

**Project:** TMdemy E-learning Frontend  
**Phase:** F7.5-B.1 — Realtime Notifications Frontend Integration & Fix  
**Status:** COMPLETED (Ready for Review)  
**Date:** 2026-10-14  

---

## 1. Status

- **Status:** COMPLETED.
- Đã kiểm tra và cô lập toàn bộ các nguyên nhân ở tầng Frontend khiến học viên không nhận được hoặc không hiển thị thông báo khi giáo viên tạo bài học (`LESSON`).
- Đã khắc phục triệt để các vấn đề:
  1. **Socket Token Lifecycle & Auto-recovery:** Chuyển `auth` sang dynamic callback `cb({ token: getAccessToken() })` và xử lý tự động refresh access token khi gặp `connect_error` thay vì ngắt kết nối vĩnh viễn.
  2. **Token Change Event Sync:** Thêm sự kiện `tmdemy:token-change` để đồng bộ token tức thời giữa `apiRequest` và `SocketProvider`.
  3. **Multi-Event & Alias Listening:** Lắng nghe đồng thời `new_notification`, `notification`, và `newNotification` với deduplication an toàn.
  4. **Robust Recipient Checking:** Xử lý linh hoạt `receiverId` (string, UUID, object `{ id, _id }`, array of recipient IDs, case-insensitive comparison) tránh việc vô tình loại bỏ thông báo hợp lệ của học viên.
  5. **Notification Type Normalization:** Chuẩn hóa toàn bộ `type` về chữ hoa (`LESSON`) cả trong `notification-utils`, `notification-context`, và `/notifications` page để tương thích với cả database enum (`lesson`) lẫn application enum (`LESSON`).
  6. **Lesson Target URL Fallback:** Cập nhật `getNotificationTargetUrl` hỗ trợ `relatedId` cho bài học khi `metadata` vắng mặt trước khi fallback về `/my-courses`.
- Toàn bộ validation tự động (`tsc`, `lint`, `build`) đều đạt **PASS (0 errors)**.

---

## 2. Root Cause theo góc nhìn Frontend

Qua phân tích mã nguồn và tài liệu `api/LESSON_API.md`, `api/NOTIFICATION_API.md`, `api/MESSAGE_API.md`, `api/API_ENUM_REFERENCE.md`, phát hiện các rào cản tiềm ẩn ở Frontend:

1. **Rào cản 1 (Nghiêm trọng nhất — Socket chết sau khi token hết hạn):**
   Trong `src/contexts/socket-context.tsx`, `auth` trước đây là static object `{ token: token }`. Đồng thời khi gặp `connect_error` do token hết hạn (`jwt expired` hoặc `Authentication error`), hàm xử lý gọi `newSocket.disconnect()` và dừng lại. Khi học viên mở tab học tập lâu hơn thời hạn của access token (15 phút), socket bị disconnect và không bao giờ kết nối lại. Khi giáo viên tạo lesson sau đó, socket đã offline nên học viên không nhận được thông báo.
2. **Rào cản 2 (Lọc `receiverId` quá cứng nhắc):**
   Trong `notification-context.tsx`, logic trước đây: `if (data.receiverId && currentUserId && data.receiverId !== currentUserId) return;`. Nếu backend serialize `receiverId` dưới dạng object `{ id: '...', username: '...' }` (như thường gặp trong Mongoose/Prisma relations) hoặc array danh sách học viên nhận tin, biểu thức so sánh chuỗi trực tiếp sẽ trả về `true` (khác nhau) và drop notification.
3. **Rào cản 3 (Bất đối xứng chữ hoa/chữ thường của Enum `ENotificationType`):**
   Trong `api/API_ENUM_REFERENCE.md`, database enum PostgreSQL lưu dạng chữ thường (`lesson`, `course`), trong khi application code thường serialize chữ hoa (`LESSON`). Nếu socket payload trả về `type: 'lesson'`, frontend kiểm tra `case 'LESSON':` sẽ không khớp:
   - Icon và label hiển thị thành `Hệ thống` thay vì `Bài học`.
   - `getNotificationTargetUrl` trả về `null` thay vì route tới bài học trong Classroom.
   - Trang `/notifications` với bộ lọc thể loại `Bài học` không nhận diện được để hiển thị thông báo.
4. **Rào cản 4 (Tên sự kiện Socket.IO):**
   Backend có thể phát `new_notification`, `notification` hoặc `newNotification` tùy thuộc service khởi tạo.

---

## 3. API Documentation Đã Sử Dụng

- `api/LESSON_API.md`: Đặc tả API tạo bài học `POST /api/lessons/`, rule gửi thông báo tự động đến toàn bộ học viên ghi danh `ACTIVE`.
- `api/NOTIFICATION_API.md`: Đặc tả cấu trúc `ApiNotification`, phân trang, query parameter `type`, và quyền sở hữu thông báo `receiverId === req.user.userId`.
- `api/MESSAGE_API.md`: Đặc tả kết nối Socket.IO tại `http://localhost:3002`, handshake bắt buộc qua `auth: { token }`, và tự động gia nhập phòng `socket.join(String(userId))`.
- `api/AUTH_FLOW.md` & `api/AUTH_API.md`: Đặc tả cơ chế Dual-Token, thời hạn token, quy trình `POST /api/users/access_token` và cấu trúc `UserProfile`.
- `api/API_ENUM_REFERENCE.md`: Đối chiếu giá trị database enum (`lesson`) và application enum (`LESSON`).

---

## 4. Teacher Lesson Notification Flow (Frontend Perspective)

```text
Giáo viên tạo Lesson mới (qua API hoặc Teacher Portal)
        ↓
Backend lưu Notification cho học viên ghi danh vào DB
        ↓
Backend emit Socket.IO event tới phòng riêng học viên
        ↓
Frontend Socket.IO client nhận event (new_notification / notification / newNotification)
        ↓
Trích xuất & chuẩn hóa:
  - type: 'LESSON'
  - receiverId: so sánh an toàn với active student ID
        ↓
NotificationContext:
  - addRealtimeNotification (dedupe theo ID)
  - setLatestRealtimeNotification
  - unreadCount tăng tức thời (+1)
  - toast.info: "Có bài học mới trong khóa học bạn đã đăng ký!"
        ↓
Cập nhật UI không reload:
  - NotificationPopover (Header Bell) hiển thị bài học mới + icon play_circle
  - Trang /notifications hiển thị bài học mới ở đầu trang 1
        ↓
Học viên click vào thông báo:
  - Điều hướng tới /learn/[courseSlug]?lesson=[lessonId] (hoặc /learn/[courseId])
  - Đánh dấu đã đọc qua PATCH /api/notifications/read/:id
```

---

## 5. Socket Authentication

- **Dynamic Token Handshake:**
  ```ts
  auth: (cb: (data: { token: string | null }) => void) => {
    cb({ token: getAccessToken() });
  }
  ```
- **Auto-Recovery on Expired Token:** Khi gặp lỗi `connect_error` liên quan đến xác thực (`Authentication error`, `token`, `jwt`), `SocketProvider` tự động gọi `refreshAccessToken()` từ `@/lib/api/client`. Nếu cấp lại access token thành công, cập nhật `socket.auth` và gọi `socket.connect()`.
- **Event-driven Token Synchronization:** Hàm `setTokens()` và `clearTokens()` trong `src/lib/api/token.ts` phát sự kiện `tmdemy:token-change`. `SocketProvider` lắng nghe và đồng bộ token ngay lập tức khi người dùng đăng nhập hoặc khi token được làm mới ngầm.

---

## 6. Frontend Event Reception

- Lắng nghe đồng thời 3 event aliases:
  - `new_notification`
  - `notification`
  - `newNotification`
- **Clean Listener Teardown:** Sử dụng `socket.off(...)` cho cả 3 events trong hàm cleanup của `useEffect`.

---

## 7. NotificationContext Synchronization

- Nhận notification và cập nhật mảng `notifications` ở đầu danh sách.
- Set `latestRealtimeNotification` để các màn hình con (như `/notifications`) tự động bắt được dữ liệu mới.
- Khôi phục dữ liệu qua `refresh()` khi socket reconnect sau khi mất kết nối mạng.

---

## 8. Deduplication Strategy

- Sử dụng khóa định danh duy nhất:
  `const notifId = notification.id || notification._id || `${type}-${createdAt}-${message}`;`
- `notifiedIdsRef` lưu trữ các ID đã thông báo toast để không gây phiền người dùng.
- `addRealtimeNotification` kiểm tra `prev.some(n => (n.id || n._id) === notifId)` để ngăn chặn bản ghi trùng lặp trong bộ nhớ.

---

## 9. Unread Count

- `unreadCount` được tính toán phản ứng (`useMemo`) từ danh sách thông báo.
- Khi nhận thông báo `LESSON` mới có `isRead === false`, `unreadCount` tự động tăng 1.
- Khi học viên click vào thông báo, `markAsRead` cập nhật optimistic update: `isRead = true`, ngay lập tức giảm badge.

---

## 10. Reconnection

- Socket client có cấu hình exponential backoff:
  `reconnectionAttempts: 10, reconnectionDelay: 1000, reconnectionDelayMax: 5000`.
- Khi kết nối lại thành công (`socket.on('connect')`), tự động gọi `refresh()` để đồng bộ các thông báo đã phát sinh trong thời gian offline từ REST API.

---

## 11. Logout / Account Switching

- Khi `logout()`:
  - `clearTokens()` phát event `tmdemy:token-change` với `accessToken: null`.
  - Socket disconnect ngay lập tức, xóa toàn bộ listeners.
  - Xóa sạch state `notifications: []`, `unreadCount: 0`, `notifiedIdsRef.clear()`.
- Khi đổi tài khoản:
  - `activeUserIdRef` phát hiện thay đổi ID người dùng.
  - Khởi tạo socket mới với token của tài khoản mới.
  - Tải lại danh sách thông báo độc lập của tài khoản mới.

---

## 12. Navigation

- Với thông báo `LESSON`:
  - Ưu tiên: `metadata.courseSlug` hoặc `metadata.courseId` kết hợp `metadata.lessonId` ➔ `/learn/[courseKey]?lesson=[lessonId]`.
  - Nếu thiếu `lessonId`: ➔ `/learn/[courseKey]`.
  - Nếu thiếu `metadata` nhưng có `relatedId`: ➔ `/learn/[relatedId]`.
  - Fallback an toàn: ➔ `/my-courses`.

---

## 13. Files Created

- Không tạo file mã nguồn mới (tái sử dụng kiến trúc đã thiết lập ở F7.5-B).
- `docs/progress/F7_5_B1_NOTIFICATION_FRONTEND_FIX_REPORT.md` (Báo cáo này).

---

## 14. Files Updated

1. `src/lib/api/token.ts`: Thêm dispatch event `tmdemy:token-change` trên `setTokens` và `clearTokens`.
2. `src/lib/api/client.ts`: Export hàm `refreshAccessToken` phục vụ auto-recovery cho Socket.
3. `src/contexts/socket-context.tsx`: Nâng cấp dynamic auth callback, auto-refresh recovery khi token hết hạn, và lắng nghe `tmdemy:token-change`.
4. `src/contexts/notification-context.tsx`: Chuẩn hóa type chữ hoa, hỗ trợ multi-event aliases (`new_notification`, `notification`, `newNotification`), làm mềm bộ lọc `receiverId`, và thông báo toast bài học mới.
5. `src/lib/notification-utils.ts`: Chuẩn hóa uppercase type và bổ sung fallback an toàn cho `LESSON` target URL.
6. `src/app/notifications/page.tsx`: Chuẩn hóa so sánh type không phân biệt chữ hoa/thường khi nhận realtime notification.

---

## 15. Dependency Changes

- Không cài đặt thêm bất kỳ dependency nào.

---

## 16. Validation Results

| Lệnh | Kết quả | Chi tiết |
|---|---|---|
| `npx tsc --noEmit` | **PASS (0 errors)** | Toàn bộ type definitions trong project hợp lệ. |
| `npm run lint` | **PASS (0 errors)** | ESLint kiểm tra mã nguồn thành công với 0 lỗi. |
| `npm run build` | **PASS (24/24 routes)** | Next.js Turbopack biên dịch thành công toàn bộ static và dynamic routes. |

### Phân biệt trạng thái kiểm chứng

- **Code Inspection & Type Checking:** **VERIFIED (PASS)**.
- **Unit Logic & Error State Recovery:** **VERIFIED (PASS)**.
- **End-to-End Live Event:** **NOT VERIFIED** (Vì Backend là external service và không được quyền trigger trực tiếp từ phiên làm việc này; cần giáo viên tạo bài học thực tế trên môi trường chạy để kiểm chứng E2E).

---

## 17. Execution Trace

### Workflow Used
- `feature-development` (`.agents/workflows/feature-development.md`): Sử dụng đầy đủ các bước rà soát, cô lập nguyên nhân, cải tiến tối thiểu và kiểm thử tự động.

### Skills Used
- `api-integration`: **USED** (Tích hợp handshake động, xử lý refresh token cho Socket.IO, mapping enum `LESSON`, và đa dạng hóa event listeners).
- `frontend-review`: **USED** (Thẩm định code quality, memory leak, listener cleanup, và chạy `tsc`, `lint`, `build`).
- `stitch-ui`: **NOT USED** (Không có yêu cầu chỉnh sửa giao diện ngoài design system hiện có).
- `bug-investigation`: **NOT USED** (Thực hiện theo workflow feature integration & hardening).

### Skill Evidence
- `api-integration`: Sửa `socket-context.tsx`, `token.ts`, `client.ts`, `notification-context.tsx` tuân thủ nghiêm ngặt `api/LESSON_API.md` và `api/MESSAGE_API.md`.
- `frontend-review`: Xác nhận `0 errors` qua cả 3 lệnh validation.

---

## 18. Workflow Gates

- **Context Gate:** **PASS** (Đã rà soát toàn bộ tài liệu trong `api/` và source code Socket/Notification hiện tại).
- **Scope Gate:** **PASS** (Chỉ can thiệp vào các file kết nối socket, token sync, và notification context).
- **Frontend/API Boundary Gate:** **PASS** (Không truy cập, mở hoặc sửa đổi bất kỳ file nào trong backend repository `d:\e-learning_server`).
- **Authentication Gate:** **PASS** (Xác thực Socket sử dụng đúng JWT Access Token và cơ chế Refresh Token hiện có).
- **Account Isolation Gate:** **PASS** (Đảm bảo dọn dẹp kết nối và dữ liệu thông báo triệt để khi logout và chuyển tài khoản).
- **Dependency Gate:** **PASS** (Không cài đặt thêm npm package).
- **Validation Gate:** **PASS** (`tsc`, `lint`, `build` đều thành công 100%).

---

## 19. Backend Gaps & Lưu ý Vận Hành

Theo đặc tả `api/LESSON_API.md` line 45:
> *"Thông báo cho học viên: Sau khi tạo bài học mới, hệ thống tự động gửi Notification đến toàn bộ học viên đang ghi danh (`ACTIVE`) trong khóa học để báo có bài học mới."*

Lưu ý nghiệp vụ backend:
1. **Điều kiện ghi danh (`ACTIVE`):** Học viên chỉ nhận được thông báo khi đã mua hoặc ghi danh khóa học đó với trạng thái `ACTIVE`. Nếu học viên chưa ghi danh khóa học của giảng viên, backend sẽ không tạo notification.
2. **Backend Emit Room:** Backend bắt buộc phải emit sự kiện tới phòng riêng của học viên `io.to(String(studentId)).emit('new_notification', ...)` như quy định trong `api/MESSAGE_API.md`.

---

## 20. API Contract Issues

- Không có xung đột hợp đồng nghiêm trọng. Lưu ý duy nhất là sự bất đối xứng chữ hoa/chữ thường giữa PostgreSQL enum (`lesson`) và TypeScript application enum (`LESSON`), đã được Frontend chuẩn hóa triệt để qua hàm `.toUpperCase()`.

---

## 21. Next Phase

- **Next Phase:** Chờ User review kết quả F7.5-B.1 và xác nhận kết quả kiểm tra với giáo viên tạo bài học thực tế.
- **STOP:** Dừng lại theo chỉ dẫn, không tự ý chuyển sang F7.5-C.
