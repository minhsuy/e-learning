# F7.5-B.0 — Socket.IO Realtime Notification Discovery & Architecture Audit

## 1. Current Socket.IO Architecture
### Frontend State
- **Thư viện**: `socket.io-client` **chưa được cài đặt** trong `package.json`.
- **Client & Context**: Hiện tại **chưa có** Socket singleton, chưa có `SocketProvider` hay `useSocket` hook nào trong codebase `src/`.
- **Trạng thái tính năng Chat/Messages**: Trang `/messages` (`src/app/messages/page.tsx`) hiện vẫn đang sử dụng mock data (`mockMessagesData`).
- **Ý nghĩa kiến trúc**: Phase F7.5-B sẽ là bước đầu tiên thiết lập nền tảng Socket.IO client dùng chung cho toàn bộ dự án TMdemy Frontend (phục vụ cả Notification ở F7.5-B và Chat/Messaging ở F7.6).

### Backend State
- **URL & Port**: Chạy chung port với REST API tại `http://localhost:3002` (cấu hình qua biến môi trường `NEXT_PUBLIC_SOCKET_URL` hoặc `NEXT_PUBLIC_API_URL`).
- **Path**: Path chuẩn `/socket.io/`.
- **Server Version**: Socket.IO server version 4.8.1 (Node.js/Express).
- **Phân luồng phòng (Rooms)**: Server sử dụng mô hình phòng cá nhân: mỗi socket sau khi xác thực thành công sẽ tự động tham gia vào phòng có ID là `userId` (`socket.join(String(userId))`).

---

## 2. Authentication Flow
- **Nguồn token**: Frontend lưu Access Token trong `localStorage` với key `tmdemy_access_token`, truy xuất an toàn qua hàm `getAccessToken()` từ `@/lib/api/token`.
- **Cơ chế bắt tay (Handshake)**:
  - Socket.IO middleware phía backend yêu cầu truyền Access Token qua trường `auth.token`:
    ```typescript
    const socket = io(SOCKET_URL, {
      auth: {
        token: getAccessToken()
      },
      autoConnect: false
    });
    ```
  - Backend cũng hỗ trợ fallback đọc qua header: `socket.handshake.headers.authorization`.
- **Xử lý từ chối kết nối**:
  - Nếu thiếu token hoặc token hết hạn/không hợp lệ, backend emit lỗi:
    `connect_error: "Authentication error: Access token required"` hoặc `"Invalid or expired token"`.
  - Frontend cần lắng nghe sự kiện `connect_error` để tránh reconnect liên tục khi token không hợp lệ.
- **Làm mới token (Token Refresh)**:
  - Khi token được làm mới qua luồng refresh token của `apiClient`, socket cần được cập nhật `socket.auth = { token: newAccessToken }` trước khi tái kết nối.

---

## 3. Existing Connection Lifecycle
- **Khởi tạo kết nối**:
  - Chỉ thiết lập kết nối khi người dùng đã đăng nhập thành công (`isAuthenticated === true && user?.id`).
  - Đối với khách (Guest/Unauthenticated): Tuyệt đối không mở kết nối socket để tiết kiệm tài nguyên server.
- **Vòng đời ngắt kết nối (Disconnect)**:
  - Khi người dùng đăng xuất (`logout` trong `auth-context.tsx`), socket phải được ngắt kết nối ngay lập tức (`socket.disconnect()`) và dọn dẹp các event listeners.
- **Chuyển đổi tài khoản (Account Switching)**:
  - Khi tài khoản thay đổi (`user?.id` thay đổi), ngắt socket cũ, cập nhật token mới và kết nối lại, đảm bảo socket join đúng phòng `userId` mới.

---

## 4. Existing Realtime Events
Bảng danh mục sự kiện Socket.IO phía backend TMdemy:

| Tên Event | Chiều gửi | Payload | Mục đích | Scope áp dụng |
| :--- | :---: | :--- | :--- | :--- |
| `new_notification` | Server $\rightarrow$ User Room | `ApiNotification` | Gửi thông báo realtime tức thời đến học viên | **F7.5-B (Mục tiêu hiện tại)** |
| `join` | Client $\rightarrow$ Server | `conversationId` (string) | Tham gia phòng chat hội thoại | F7.6 (Chat / Messages) |
| `sendMessage` | Client $\rightarrow$ Server | `{ conversationId, content, type }` | Gửi tin nhắn mới | F7.6 (Chat / Messages) |
| `receiveMessage` | Server $\rightarrow$ Room | `MessageDTO` | Nhận tin nhắn mới trong phòng chat | F7.6 (Chat / Messages) |
| `messageUpdated` | Server $\rightarrow$ Room | `MessageDTO` | Tin nhắn được chỉnh sửa | F7.6 (Chat / Messages) |
| `messageDeleted` | Server $\rightarrow$ Room | `{ messageId }` | Tin nhắn bị xóa | F7.6 (Chat / Messages) |
| `errorMessage` | Server $\rightarrow$ Socket | `string` | Báo lỗi socket phát sinh | Toàn hệ thống |

---

## 5. Backend `new_notification` Contract
Sự kiện `new_notification` phát từ backend tới phòng cá nhân `io.to(receiverId)` có cấu trúc hoàn toàn tương thích với REST `ApiNotification`:

```typescript
export interface RealtimeNotificationPayload {
  id: string;
  _id?: string;
  senderId?: string;
  receiverId?: string;
  sender?: {
    id: string;
    _id?: string;
    username: string;
    avatar?: string;
  } | null;
  type: 'COMMENT' | 'RATING' | 'ORDER' | 'MESSAGE' | 'SYSTEM' | 'COURSE' | 'LESSON' | 'COMMENT_REPLY' | 'QUIZ';
  message: string;
  relatedId?: string | null;
  metadata?: {
    courseId?: string;
    courseSlug?: string;
    lessonId?: string;
    commentId?: string;
    parentId?: string;
    [key: string]: unknown;
  } | null;
  isRead: boolean;
  read?: boolean;
  createdAt: string;
  updatedAt?: string;
}
```

---

## 6. Current NotificationContext Architecture
Trong `src/contexts/notification-context.tsx`:
- **State hiện có**:
  - `notifications: ApiNotification[]`: Danh sách thông báo hiện thời.
  - `unreadCount`: Computed property qua `useMemo` đếm chính xác số lượng item có `!isRead && !read`.
  - `pagination`: Thông tin phân trang từ REST API.
  - `isLoading`, `error`, `isMarkingRead(id)`.
- **Hàm tiếp nhận realtime**:
  - `addRealtimeNotification(newNotif: ApiNotification)`: Đã được triển khai sẵn trong F7.5-A.1, tự động thêm vào đầu mảng và chống trùng lặp theo `id` / `_id`.
- **Đánh dấu đã đọc**:
  - `markAsRead(id)`: Optimistic update, chống double-click và có rollback an toàn.
- **Account Isolation**:
  - `activeUserIdRef` theo dõi phiên làm việc, tự động dọn dẹp state rỗng khi logout hoặc chuyển tài khoản.

---

## 7. Integration Design
Để tuân thủ nguyên tắc kiến trúc "Không tạo socket connection riêng chỉ cho notification", thiết kế đề xuất gồm:

### Cấp 1: Centralized Socket Infrastructure (`SocketProvider`)
- Tạo `src/contexts/socket-context.tsx` (hoặc `src/lib/socket/client.ts`):
  - Khởi tạo **một singleton Socket.IO connection duy nhất** cho toàn bộ frontend.
  - Lắng nghe `isAuthenticated` và `user?.id` từ `AuthContext`:
    - Khi đăng nhập: Lấy `getAccessToken()`, gọi `socket.connect()`.
    - Khi đăng xuất: Gọi `socket.disconnect()`.
  - Cung cấp socket instance qua `SocketContext` cho các module tiêu thụ (`Notification`, `Chat`).

### Cấp 2: Tích hợp vào `NotificationProvider`
- `NotificationProvider` tiêu thụ socket instance từ `SocketContext`:
  ```typescript
  useEffect(() => {
    if (!socket || !isAuthenticated) return;

    const handleNewNotification = (data: ApiNotification) => {
      addRealtimeNotification(data);
      // Hiển thị toast thông báo nhẹ nhàng
      toast.info(data.message);
    };

    socket.on('new_notification', handleNewNotification);

    return () => {
      socket.off('new_notification', handleNewNotification);
    };
  }, [socket, isAuthenticated, addRealtimeNotification]);
  ```
- **Số lượng listener**: Chính xác **1 listener duy nhất** tại tầng Provider. Tuyệt đối không đăng ký listener lặp lại ở `NotificationPopover` hay `NotificationsPage`.

---

## 8. Deduplication Strategy
1. **Lớp 1 (State Level)**: Hàm `addRealtimeNotification` kiểm tra `prev.some(n => (n.id || n._id) === (newNotif.id || newNotif._id))`. Nếu thông báo đã tồn tại trong state, bỏ qua không chèn thêm.
2. **Lớp 2 (Sync Level)**: Khi người dùng bấm "Làm mới" hoặc chuyển trang (REST fetch), dữ liệu trả về từ backend có cùng UUID với sự kiện socket, do đó `notifications` được hòa nhập tự nhiên mà không gây trùng lặp.
3. **Lớp 3 (Unread Count)**: `unreadCount` được tính động từ tập hợp các phần tử duy nhất trong `notifications`, bảo đảm con số trên chuông thông báo luôn khớp 100%.

---

## 9. Reconnect Strategy
- Cấu hình client:
  ```typescript
  {
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    transports: ['websocket', 'polling']
  }
  ```
- **Bù đắp thông báo bị rớt mạng (Missed Events Sync)**:
  - Khi socket kết nối lại thành công sau một khoảng thời gian mất mạng (`socket.on('reconnect')` hoặc flag `wasDisconnected`), kích hoạt hàm `refresh()` của `NotificationContext` để kéo danh sách thông báo mới nhất từ REST API.

---

## 10. Account Isolation
- Khi đăng xuất:
  1. `auth-context.tsx` xóa token và set `user = null`.
  2. `SocketProvider` lập tức gọi `socket.disconnect()`.
  3. `NotificationProvider` xóa sạch `notifications = []`, `unreadCount = 0`.
- Khi đăng nhập tài khoản khác:
  1. `SocketProvider` cập nhật `socket.auth.token` mới và mở kết nối.
  2. Server tự động join socket vào phòng `userId` của tài khoản mới.
  3. Tuyệt đối không rò rỉ thông báo của tài khoản cũ sang tài khoản mới.

---

## 11. Files Expected to Change in Phase F7.5-B
1. `package.json`: Bổ sung dependency `socket.io-client` (`^4.8.1`).
2. `src/contexts/socket-context.tsx`: Tạo mới Context & Provider quản lý singleton socket connection và lifecycle.
3. `src/hooks/use-socket.ts`: Custom hook tiện ích để tiêu thụ SocketContext.
4. `src/components/providers.tsx`: Bọc `SocketProvider` quanh `NotificationProvider`.
5. `src/contexts/notification-context.tsx`: Đăng ký lắng nghe sự kiện `new_notification` và kích hoạt resync khi reconnect.

---

## 12. Risks and Backend Gaps
### Rủi ro Kỹ thuật (Risks)
1. **Chưa có thư viện `socket.io-client`**: Bắt buộc phải thực hiện giao thức `[DEPENDENCY REQUEST]` trước khi cài đặt package.
2. **Lệch version Socket.IO**: Backend sử dụng `socket.io@4.8.1`. Frontend phải cài đúng phiên bản tương thích `socket.io-client@^4.8.1` để tránh lỗi handshake protocol.
3. **Transports fallback**: Một số môi trường mạng chặn WebSocket thuần túy, cần cấu hình `transports: ['websocket', 'polling']`.

### Khoảng trống Backend (Backend Gaps)
- **Không có backend gap đối với sự kiện `new_notification`**: Backend đã triển khai phát sự kiện này đến `io.to(receiverId)` với đầy đủ metadata theo chuẩn REST API.

---

## 13. Recommended Implementation Sequence
1. **Bước 1**: Đệ trình và phê duyệt `[DEPENDENCY REQUEST]` cho `socket.io-client@^4.8.1`.
2. **Bước 2**: Cài đặt dependency `socket.io-client`.
3. **Bước 3**: Xây dựng `src/contexts/socket-context.tsx` quản lý kết nối socket tập trung, handshake JWT và lifecycle.
4. **Bước 4**: Tích hợp `SocketProvider` vào `src/components/providers.tsx`.
5. **Bước 5**: Kết nối sự kiện `new_notification` trong `src/contexts/notification-context.tsx` và cơ chế resync sau reconnect.
6. **Bước 6**: Kiểm thử tính năng realtime, dọn dẹp kết nối khi logout và xác thực `tsc`, `lint`, `build`.
