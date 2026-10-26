// F5 UI static mock data only.
// Real messaging / Socket.IO integration will be implemented in a later phase.

export interface ConversationItem {
  id: string;
  name: string;
  role: string;
  avatarUrl?: string;
  badgeType?: 'instructor' | 'admin' | 'group';
  badgeLabel?: string;
  isOnline: boolean;
  isVerified: boolean;
  lastMessage: string;
  lastTime: string;
  unreadCount: number;
  category: 'all' | 'unread' | 'instructor' | 'group';
  courseContext?: {
    courseName: string;
    lessonName: string;
  };
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  isMe: boolean;
  text: string;
  time: string;
  status?: 'sent' | 'delivered' | 'read';
  codeAttachment?: {
    fileName: string;
    language: string;
    code: string;
    linesCount: number;
    sizeText: string;
  };
  fileAttachment?: {
    fileName: string;
    fileType: 'pdf' | 'zip' | 'doc';
    fileSize: string;
    statusNote: string;
  };
}

export interface MessagesData {
  conversations: ConversationItem[];
  activeConversationId: string;
  messages: Record<string, ChatMessage[]>;
}

export const mockMessagesData: MessagesData = {
  activeConversationId: 'conv-1',
  conversations: [
    {
      id: 'conv-1',
      name: 'ThS. Hoàng Minh Đức',
      role: 'Giảng viên React & Next.js',
      avatarUrl:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuDt0nk3nDz2H6wYKmtwzf3m3mTMxmzWoe-GX4nrwhcx3i93ESiiAitFijvaBSsd3MN4PkoiFtZuCmaZxHAx2-sz_1vfJWwhdJvVxHu8hJO_hyy6Xlj6AQmk4s42r-66bpQm7fxJ5uOal_C1Mq_zHgO3zJXfHJPv0XKXiWmKMxriA9j5X1uB2yo0t_0qUGV2WMt0BKsItI7bA4Oq4emmsENXLuZ8dw9T37NQeWeo0M3GFBzj4R8v6eaR',
      badgeType: 'instructor',
      badgeLabel: 'Giảng viên',
      isOnline: true,
      isVerified: true,
      lastMessage: 'Em xem lại phần JWT trước nhé, sau đó thử implement...',
      lastTime: '10:24',
      unreadCount: 1,
      category: 'instructor',
      courseContext: {
        courseName: 'React & Next.js từ cơ bản đến nâng cao',
        lessonName: 'Bài 18: Tối ưu hiệu năng & Server Actions',
      },
    },
    {
      id: 'conv-2',
      name: 'KS. Phạm Văn Tuấn',
      role: 'Giảng viên Node.js & Microservices',
      avatarUrl:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCOeMa39ndIwh_ZWuxAXDWoHfK-h5ZO17w9Mn7ppybi300VyZRlAiPyQaD7X93Kj1nJov5wOZwh96F4d46cuMwkpbMA7KVFhsNg3GswevuwEXv3iWw9tuqZuAR2WuGhQEJQiwFGYaPmf0yCWqE3x8QygF_fwt7z__PcInYWGw8HGY4MTlDr92ugrTuyjQ0rLq7nSxbMwKb5dAgN8YQ8kjoqikpvO6E7kL4mupvGMCgjifO1dicBD6db',
      badgeType: 'instructor',
      badgeLabel: 'Giảng viên',
      isOnline: false,
      isVerified: false,
      lastMessage: 'Source code buổi thực hành đã được cập nhật trên repo.',
      lastTime: 'Hôm qua',
      unreadCount: 0,
      category: 'instructor',
      courseContext: {
        courseName: 'Node.js Backend Architecture',
        lessonName: 'Bài 12: Microservices Event Bus',
      },
    },
    {
      id: 'conv-3',
      name: 'Trợ giảng TMdemy',
      role: 'Phòng Hỗ trợ Học vụ & Chứng chỉ',
      badgeType: 'admin',
      badgeLabel: 'Học vụ',
      isOnline: true,
      isVerified: false,
      lastMessage: 'Chứng chỉ khóa học của bạn đã được phê duyệt!',
      lastTime: '2 ngày trước',
      unreadCount: 1,
      category: 'unread',
    },
    {
      id: 'conv-4',
      name: 'Nhóm Next.js 14 App Router',
      role: '5 học viên tích cực',
      badgeType: 'group',
      badgeLabel: 'Nhóm N14',
      isOnline: true,
      isVerified: false,
      lastMessage: 'Lê Thùy Trang: Mọi người ai xong bài tập 18 chưa?',
      lastTime: '3 ngày trước',
      unreadCount: 0,
      category: 'group',
    },
    {
      id: 'conv-5',
      name: 'TS. Đặng Quốc Thịnh',
      role: 'Chủ nhiệm bộ môn AI & Machine Learning',
      avatarUrl:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuDQPzGhfxnxDiVmD-_ydHhZ4TURUCJaZecusQb3hcUcRMOuic5yV2cPqpx-rfHmgprruS3HYFKouEF2RtVVEmETMYUjU7eCY28zDTuijV9Af_eGGXQ7c1Uubxvm6zclUTiJLOl2FMgU0xGksuJ_morzs0YCSW4mO8wAFrON-7xEp7LSS6N6kTgEix7kQiZthEuzXxh6x_O2ElrKSIFahI-no0Jepnr3JzT3km9vYCgN6ogdGrWwO8Yp',
      badgeType: 'instructor',
      badgeLabel: 'Chuyên gia AI',
      isOnline: false,
      isVerified: false,
      lastMessage: 'Chúc mừng em đã hoàn thành đồ án tốt nghiệp khóa học!',
      lastTime: '1 tuần trước',
      unreadCount: 0,
      category: 'instructor',
    },
  ],
  messages: {
    'conv-1': [
      {
        id: 'msg-1',
        senderId: 'me',
        senderName: 'Trần Minh Triết',
        isMe: true,
        text: 'Thưa thầy, cho em hỏi phần Authentication JWT và Cookie bảo mật trong bài 18 ạ. Khi lưu token trong HttpOnly Cookie thì Next.js Server Actions có đọc trực tiếp được qua cookies() header không ạ?',
        time: '10:15',
        status: 'read',
        codeAttachment: {
          fileName: 'auth-middleware.ts',
          language: 'TypeScript',
          code: `export async function middleware(request: NextRequest) {\n  const token = request.cookies.get('session_token')?.value;\n  if (!token) return NextResponse.redirect(new URL('/login', request.url));\n}`,
          linesCount: 18,
          sizeText: '420 B',
        },
      },
      {
        id: 'msg-2',
        senderId: 'ins-1',
        senderName: 'ThS. Hoàng Minh Đức',
        senderAvatar:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuA-TQB4qwXdehYuRQ8x4tyXJPdjurbnhGTnJVtV10ollSDRsJaq311B8YR3R1BdJ2V6lMr9XAk7cCWxBlbe2xXibxtQ0W7csj-SsbhO2pq6UQxsZ0Lc1gwYMmqCqjnmuz-3TzTaSEPkKeCKtzoKzO0Plk67cx13QcDP0ezSzZlUkPxUdnpIHiAdX5Nd9lUqeOiNnRFBm_ceQjApALNtKm8FZSgR3ygTQoRQRC-fFPZ8CPgHvVarylai',
        isMe: false,
        text: 'Chào Triết, hoàn toàn được nhé em! Khi dùng Server Actions hoặc Route Handlers trong Next.js 14, em import cookies từ next/headers và gọi const cookieStore = cookies(); const token = cookieStore.get("token")?.value; Cách này đảm bảo an toàn vì HttpOnly Cookie không bao giờ bị lộ ra client JavaScript.',
        time: '10:20',
      },
      {
        id: 'msg-3',
        senderId: 'ins-1',
        senderName: 'ThS. Hoàng Minh Đức',
        senderAvatar:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuA-TQB4qwXdehYuRQ8x4tyXJPdjurbnhGTnJVtV10ollSDRsJaq311B8YR3R1BdJ2V6lMr9XAk7cCWxBlbe2xXibxtQ0W7csj-SsbhO2pq6UQxsZ0Lc1gwYMmqCqjnmuz-3TzTaSEPkKeCKtzoKzO0Plk67cx13QcDP0ezSzZlUkPxUdnpIHiAdX5Nd9lUqeOiNnRFBm_ceQjApALNtKm8FZSgR3ygTQoRQRC-fFPZ8CPgHvVarylai',
        isMe: false,
        text: 'Thầy có để ví dụ mẫu trong repository của bài 18 ở nhánh feature/server-actions-auth. Em xem lại nhánh đó rồi thử implement lại nhé!',
        time: '10:24',
        fileAttachment: {
          fileName: 'JWT-Server-Action-Guide.pdf',
          fileType: 'pdf',
          fileSize: '1.4 MB',
          statusNote: 'Tài liệu đính kèm • Đã quét an toàn',
        },
      },
    ],
  },
};
