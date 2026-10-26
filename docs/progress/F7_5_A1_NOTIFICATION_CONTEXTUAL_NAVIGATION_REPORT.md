# F7.5-A.1 — Frontend Notification Contextual Navigation Progress Report

## 1. Status
- **Phase**: F7.5-A.1 — Frontend Notification Contextual Navigation
- **Status**: **COMPLETED (READY FOR REVIEW)**
- **Completion Date**: 2026-10-14
- **Skills Used**:
  - `api-integration` (`.agents/skills/api-integration/SKILL.md`) — USED (Đọc hợp đồng metadata, nâng cấp kiểu dữ liệu TypeScript, tích hợp contextual URL generator).
  - `frontend-review` (`.agents/skills/frontend-review/SKILL.md`) — USED (Thẩm định toàn diện routing, DOM accessibility, UX highlighting, và validation tsc/lint/build).

---

## 2. Current Route Mapping
Trước khi thực hiện, các route đích thực tế của frontend TMdemy đã được khảo sát và xác định:

| Mục tiêu điều hướng | Route Frontend thực tế | Query Parameters hỗ trợ | Thành phần tiếp nhận |
| :--- | :--- | :--- | :--- |
| **Chi tiết khóa học** | `/courses/[slug]` | None | `CourseDetailPage` |
| **Lớp học & Trình phát bài học** | `/learn/[slug]` | `?lesson=<lessonId>` | `ClassroomPage` |
| **Khu vực Thảo luận / Bình luận** | `/learn/[slug]` | `?lesson=<lessonId>&tab=qa` | `ClassroomPage` -> `LessonComments` |
| **Bình luận cụ thể (Root)** | `/learn/[slug]` | `?lesson=<lessonId>&tab=qa&commentId=<commentId>` | `LessonComments` (cuộn & highlight) |
| **Bình luận phản hồi (Reply)** | `/learn/[slug]` | `?lesson=<lessonId>&tab=qa&commentId=<commentId>&parentId=<parentId>` | `LessonComments` (mở rộng parent, cuộn & highlight reply) |
| **Danh sách khóa học của tôi (Fallback)** | `/my-courses` | None | `MyCoursesPage` |
| **Danh sách đơn hàng** | `/orders` | None | `OrdersPage` |
| **Hộp thư tin nhắn** | `/messages` | None | `MessagesPage` |

---

## 3. Notification Type Mapping
Bảng ánh xạ hành vi điều hướng chi tiết theo từng loại thông báo:

| Notification Type | Có Metadata | Không có Metadata (Lịch sử) | Trang đích |
| :--- | :--- | :--- | :--- |
| `LESSON` | Mở đúng khóa học (`courseSlug \|\| courseId`), chọn đúng bài học (`lessonId`). | Fallback an toàn về `/my-courses`. Không đoán `relatedId` là course slug. | Classroom Player |
| `COMMENT` | Mở đúng bài học, chuyển sang tab Q&A (`tab=qa`), cuộn và highlight đúng `commentId`. | Fallback an toàn về `/my-courses`. | Lesson Comments |
| `COMMENT_REPLY` | Mở đúng bài học, chuyển tab Q&A, tự động mở rộng thread cha (`parentId`), cuộn và highlight đúng `commentId` (reply). | Fallback an toàn về `/my-courses`. | Nested Reply Thread |
| `COURSE` | N/A (giữ nguyên logic `relatedId`) | `/courses/${relatedId}` (hoặc `/courses`) | Chi tiết khóa học |
| `ORDER` | N/A | `/orders` | Lịch sử đơn hàng |
| `MESSAGE` | N/A | `/messages` | Tin nhắn |
| `QUIZ` | N/A | `/learn/${relatedId}` (hoặc `/my-courses`) | Bài kiểm tra |
| `RATING` | N/A | `/courses/${relatedId}` (hoặc ở lại) | Đánh giá khóa học |
| `SYSTEM` | N/A | `null` (ở lại notification center, không chuyển hướng bậy) | Popover / Center |

---

## 4. Notification Metadata Types
Đã bổ sung interface `NotificationMetadata` chặt chẽ trong `src/types/notification.ts`:

```typescript
export interface NotificationMetadata {
  courseId?: string;
  courseSlug?: string;
  lessonId?: string;
  commentId?: string;
  parentId?: string;
  [key: string]: unknown;
}

export interface ApiNotification {
  id: string;
  _id?: string;
  senderId?: string;
  receiverId?: string;
  sender?: ApiNotificationSender | null;
  type: NotificationType;
  message: string;
  relatedId?: string | null;
  metadata?: NotificationMetadata | null; // Nullable metadata from backend
  isRead: boolean;
  read?: boolean;
  createdAt: string;
  updatedAt?: string;
}
```

---

## 5. LESSON Navigation
- Khi `type === "LESSON"` và có metadata:
  - Khóa học được định danh qua `metadata.courseSlug || metadata.courseId`.
  - Nếu có `metadata.lessonId`: Sinh URL `/learn/${courseKey}?lesson=${lessonId}`.
  - Nếu không có `lessonId`: Sinh URL `/learn/${courseKey}`.
- Trình phát `ClassroomPage` đọc query `?lesson=` để chọn đúng bài học và tự động mở rộng chương (`chapter`) chứa bài học đó.
- Không dùng `relatedId` như course ID nhằm loại bỏ hoàn toàn nguy cơ sinh link gãy.

---

## 6. COMMENT Navigation
- Khi `type === "COMMENT"` và có metadata:
  - Sinh URL: `/learn/${courseKey}?lesson=${lessonId}&tab=qa&commentId=${commentId}`.
  - `ClassroomPage` tự động nhận diện `tab=qa` hoặc `commentId` để khởi tạo/chuyển `activeTab` sang `'qa'`.
  - `LessonComments` nhận diện `commentId`, đợi dữ liệu bình luận nạp xong:
    1. Cuộn mượt mà phần tử `#comment-${commentId}` vào giữa khung nhìn (`block: 'center'`).
    2. Kích hoạt hiệu ứng visual highlighting (`ring-2 ring-[#7240b8] dark:ring-[#a87ffb] bg-purple-50/90 dark:bg-[#281b3d] shadow-md`) trong 4.5 giây, sau đó mờ dần trở về bình thường.

---

## 7. COMMENT_REPLY Navigation
- Khi `type === "COMMENT_REPLY"` và có metadata:
  - `metadata.commentId`: ID của chính phản hồi (reply).
  - `metadata.parentId`: ID của câu hỏi / bình luận gốc (parent thread).
  - Sinh URL: `/learn/${courseKey}?lesson=${lessonId}&tab=qa&commentId=${commentId}&parentId=${parentId}`.
- `LessonComments`:
  1. Khởi tạo và cập nhật `expandedReplies[parentId] = true`, tự động mở rộng danh sách replies của thread cha.
  2. Định vị phần tử `#comment-${commentId}` (reply).
  3. Cuộn mượt mà tới reply và kích hoạt hiệu ứng highlight dành riêng cho reply (`ring-2 ring-[#7240b8] bg-purple-50/90`).

---

## 8. Old Notification Fallback
- Đối với thông báo cũ có `metadata === null`:
  - `LESSON`, `COMMENT`, `COMMENT_REPLY`: Tự động fallback về `/my-courses` (trang khóa học cá nhân của học viên). Tuyệt đối không sinh URL chứa `undefined`, `null` hay đoán mò slug.
  - Các loại `ORDER`, `RATING`, `QUIZ`, `COURSE`, `SYSTEM`: Tiếp tục hoạt động theo đúng logic ban đầu, không bị ảnh hưởng hay hồi quy.

---

## 9. REST Integration
- Dữ liệu trả về từ `GET /api/notifications/` tự động bọc trường `metadata?: NotificationMetadata | null`.
- Toàn bộ hàm tính toán URL (`getNotificationTargetUrl`) và xử lý click nằm tập trung tại `src/lib/notification-utils.ts`, dùng chung cho cả `NotificationPopover` (Header) và `NotificationsPage` (`/notifications`).

---

## 10. Socket.IO Realtime Consistency
- `NotificationContext` đã bổ sung phương thức `addRealtimeNotification(notification: ApiNotification)`.
- Khi sự kiện Socket.IO `new_notification` kích hoạt trong tương lai, notification mới sẽ được đưa trực tiếp vào context, tự động sử dụng chung hệ thống kiểu dữ liệu và logic điều hướng ngữ cảnh mà không cần viết lại.

---

## 11. Read State Behavior
- Hành vi đánh dấu đã đọc (`markAsRead`) được bảo toàn 100%:
  - Khi học viên click vào thông báo từ Popover hoặc Page: Hệ thống thực hiện optimistic mark-as-read, giảm unread count, kích hoạt API PATCH, đóng popover và chuyển hướng tới URL ngữ cảnh.
  - Chống double-click: Vô hiệu hóa nút và quản lý cờ mutation `isMarkingRead`.
  - Rollback an toàn: Nếu API lỗi, hoàn tác trạng thái và thông báo toast.

---

## 12. Files Created
- Không tạo file mới ngoài scope (tận dụng tối đa kiến trúc hiện có).

---

## 13. Files Updated
1. `src/types/notification.ts`: Khai báo `NotificationMetadata` và bổ sung `metadata` vào `ApiNotification`.
2. `src/lib/notification-utils.ts`: Nâng cấp `getNotificationTargetUrl` hỗ trợ phân tích metadata theo ngữ cảnh cho `LESSON`, `COMMENT`, `COMMENT_REPLY` và fallback an toàn.
3. `src/components/notification/notification-item.tsx`: Cập nhật gọi `getNotificationTargetUrl(notification)` truyền trọn vẹn đối tượng thông báo.
4. `src/components/course/lesson-comments.tsx`:
   - Bổ sung props `targetCommentId`, `targetParentId` và đọc từ `useSearchParams`.
   - Gắn `id={`comment-${id}`}` cho root comments và replies.
   - Thêm cơ chế tự động mở rộng thread cha (`expandedReplies`).
   - Thêm cơ chế cuộn mượt và highlight hiệu ứng tạm thời (4.5s) cho comment/reply mục tiêu.
5. `src/app/learn/[slug]/page.tsx`:
   - Khởi tạo và đồng bộ `activeTab` khi có query `tab=qa` hoặc `commentId`.
   - Truyền `targetCommentId` và `targetParentId` vào `<LessonComments>`.
6. `src/contexts/notification-context.tsx`: Bổ sung `addRealtimeNotification` bảo đảm tính nhất quán giữa REST và Realtime.

---

## 14. Validation Results
| Hạng mục kiểm tra | Phương thức kiểm tra | Kết quả | Ghi chú |
| :--- | :--- | :---: | :--- |
| **TypeScript Compilation** | `npx.cmd tsc --noEmit` | **PASS** | 0 lỗi compilation, strict typing. |
| **ESLint Quality Check** | `npm.cmd run lint` | **PASS** | 0 lỗi (0 errors, 35 pre-existing warnings). |
| **Production Build** | `npm.cmd run build` | **PASS** | Compile thành công 24/24 routes (bao gồm `/learn/[slug]` và `/notifications`). |
| **LESSON Navigation** | Code inspection & URL mapping | **PASS** | Mở `/learn/[slug]?lesson=[id]`, chapter tự expand, chọn đúng bài học. |
| **COMMENT Navigation** | Code inspection & DOM target | **PASS** | Mở `/learn/[slug]?lesson=[id]&tab=qa&commentId=[id]`, tự đổi tab, cuộn & highlight comment. |
| **COMMENT_REPLY Navigation**| Code inspection & Thread expand | **PASS** | Mở `/learn/[slug]?lesson=[id]&tab=qa&commentId=[replyId]&parentId=[parentId]`, tự expand thread cha, cuộn & highlight reply. |
| **Old Notifications** | Backward compatibility check | **PASS** | `metadata === null` fallback an toàn về `/my-courses`, không sinh URL lỗi. |
| **Other Types** | Non-regression check | **PASS** | ORDER, RATING, QUIZ, COURSE, SYSTEM hoạt động ổn định. |
| **REST + Realtime Consistency** | Architecture check | **PASS** | Cùng sử dụng `ApiNotification` và `getNotificationTargetUrl`. |

---

## 15. Backend Gaps
- `[BACKEND GAP]` Không phát hiện gap mới. Backend metadata enrichment đáp ứng đúng nhu cầu điều hướng ngữ cảnh của học viên.

---

## 16. Known Limitations
- Nếu khóa học có slug thay đổi sau khi thông báo được gửi, điều hướng fallback qua `metadata.courseId` vẫn hoạt động tốt do endpoint `/api/courses/:slug` hỗ trợ cả UUID và slug.
- Nếu comment hoặc reply bị tác giả xóa bỏ trước khi người dùng click thông báo, trang vẫn hiển thị tab thảo luận bình thường và không gây crash giao diện.

---

## 17. Execution Trace
1. Đọc và phân tích `docs/progress/F7_5_A_NOTIFICATION_CENTER_REPORT.md` cùng các yêu cầu của phase F7.5-A.1.
2. Khảo sát cấu trúc URL thực tế của `/learn/[slug]`, `ClassroomPage`, và `LessonComments`.
3. Cập nhật `src/types/notification.ts` định nghĩa `NotificationMetadata`.
4. Viết lại hàm `getNotificationTargetUrl` trong `src/lib/notification-utils.ts` đáp ứng đầy đủ các trường hợp có và không có metadata.
5. Nâng cấp `LessonComments` trong `src/components/course/lesson-comments.tsx` hỗ trợ tự mở rộng thread cha và visual highlight.
6. Kết nối `searchParams` trong `src/app/learn/[slug]/page.tsx` truyền context xuống `LessonComments`.
7. Kiểm tra và đồng bộ hóa `NotificationContext` với `addRealtimeNotification`.
8. Chạy kiểm thử tự động `tsc`, `lint`, `build` đạt 100% PASS.

---

## 18. Workflow Gates
- **Gate 1: Contract Alignment**: Đáp ứng 100% cấu trúc metadata từ Backend Notification Enhancement.
- **Gate 2: Non-Destructive**: Bảo toàn toàn bộ thông báo lịch sử và các loại thông báo không có metadata.
- **Gate 3: Code Quality**: 0 lỗi TypeScript, 0 lỗi ESLint, build production sạch sẽ.
- **Gate 4: Minimal Changes**: Tái sử dụng tối đa component hiện có, không refactor toàn bộ hệ thống bình luận.

---

## 19. Next Step
- Chờ phản hồi review từ Tech Lead / User về Phase **F7.5-A.1**.
- **STOP: Tuân thủ quy định dừng lại chờ review.**
