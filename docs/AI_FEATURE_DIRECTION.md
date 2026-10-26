# TMDEMY — AI & ADVANCED FEATURES DIRECTION

> **Tài liệu định hướng kiến trúc mở rộng các tính năng Trí tuệ Nhân tạo (AI) và Tự động hóa (Automation) trong tương lai.**  
> 
> [!IMPORTANT]
> **QUY TẮC BẮT BUỘC**:  
> Toàn bộ các tính năng trong tài liệu này là **ĐỊNH HƯỚNG TƯƠNG LAI (PHASE 2)**.  
> **TUYỆT ĐỐI KHÔNG TRIỂN KHAI HOẶC CÀI ĐẶT PACKAGE AI TRONG GIAI ĐOẠN XÂY DỰNG FRONTEND CORE (F1 - F10).**

---

## 1. Mục Đích & Vị Trí Của AI Trong Đồ Án Tốt Nghiệp

Trong đồ án tốt nghiệp TMDEMY:
- **Frontend Core & Backend Core** là điều kiện tiên quyết đảm bảo hệ sinh thái e-learning vận hành trọn vẹn, ổn định và đầy đủ chức năng thương mại, học tập, quản trị.
- **Tính năng AI** được định vị là "điểm nhấn công nghệ" (Innovation Highlight) bổ trợ sau khi nền tảng đã vững chắc, giúp nâng cao giá trị học thuật của luận văn tốt nghiệp.

---

## 2. Danh Mục Các Tính Năng AI Định Hướng

```text
┌─────────────────────────────────────────────────────────────┐
│                    TMDEMY AI ECOSYSTEM                      │
└──────────────────────────────┬──────────────────────────────┘
                               │
       ┌───────────────────────┼───────────────────────┐
       ▼                       ▼                       ▼
┌──────────────┐        ┌──────────────┐        ┌──────────────┐
│  AI Student  │        │  AI Teacher  │        │  Automated   │
│  Experience  │        │   Insights   │        │  Workflows   │
└──────┬───────┘        └──────┬───────┘        └──────┬───────┘
       │                       │                       │
       ├─ AI Recommendation    ├─ Drop-off Explainer   ├─ n8n Automation
       └─ AI Learning Tutor    └─ Curriculum Optimizer └─ Telegram Bots
```

### 2.1. AI Course Recommendation (Gợi Ý Khóa Học Cá Nhân Hóa)
- **Đối tượng**: Học viên (`Student`).
- **Mô tả**:
  - Dựa trên lịch sử xem khóa học, danh mục yêu thích, kết quả các bài trắc nghiệm và đánh giá đã viết.
  - Sử dụng mô hình lọc cộng tác (Collaborative Filtering) hoặc nhúng nội dung (Content-based Embedding) để gợi ý danh sách khóa học phù hợp nhất trên trang chủ và trang kết thúc khóa học.
- **Điểm gắn kết trên Frontend (Future UI Plug)**:
  - Một khối `RecommendedCoursesSection` trên Trang chủ (`/`) và Dashboard học viên (`/student/dashboard`).

### 2.2. AI Learning Assistant / Tutor (Trợ Lý Học Tập Tương Tác)
- **Đối tượng**: Học viên trong phòng học (`/learn/:courseId`).
- **Mô tả**:
  - Trợ lý ảo hiểu ngữ cảnh bài giảng hiện tại (dựa vào transcript video hoặc nội dung văn bản bài học).
  - Trả lời thắc mắc tức thời của học viên về nội dung bài giảng mà không cần chờ giảng viên trả lời.
  - Tự động gợi ý gợi ý giải thích khi học viên làm sai một câu hỏi trong bài Quiz.
- **Điểm gắn kết trên Frontend (Future UI Plug)**:
  - Một widget Chatbot thu nhỏ góc phải màn hình trong phòng học (`FloatingAssistantWidget`).

### 2.3. AI Course Insights & Actionable Recommendations (Phân Tích Thông Minh Cho Giảng Viên)
- **Đối tượng**: Giảng viên (`Teacher`).
- **Mô tả**:
  - Tự động đọc và diễn giải số liệu từ API `GET /api/teacher/statistics/course-performance/:courseId`.
  - Thay vì giảng viên phải tự đọc biểu đồ Drop-off phức tạp, AI sẽ tổng hợp thành văn bản:
    > *"Bài học số 4 'Cấu trúc Con trỏ trong C' đang có tỉ lệ học viên bỏ cuộc cao bất thường (42%). Lý do có thể thời lượng video quá dài (45 phút) hoặc bài tập quá khó. Đề xuất: Chia nhỏ video thành 2 phần và bổ sung bài trắc nghiệm khởi động."*
- **Điểm gắn kết trên Frontend (Future UI Plug)**:
  - Khối thẻ `AIInsightBanner` đặt phía trên biểu đồ phễu bài học trong trang `/teacher/analytics/:courseId`.

### 2.4. Tự Động Hóa Quy Trình Với n8n & Telegram Bot (Workflow Automation)
- **Mô tả**:
  - Gửi thông báo tức thời tới Telegram của Giảng viên khi có học viên mới ghi danh hoặc hoàn thành khóa học.
  - Báo động cho Admin qua Telegram khi có khóa học mới được gửi lên yêu cầu phê duyệt hoặc có bình luận bị báo cáo vi phạm.
  - Đồng bộ số liệu thống kê doanh thu tuần tự động qua Google Sheets / Notion qua nền tảng n8n.

---

## 3. Nguyên Tắc Thiết Kế Sẵn Sàng (Future-Proof Architecture)

Mặc dù chưa triển khai mã nguồn AI trong giai đoạn F1 - F10, kiến trúc Frontend Core hiện tại được xây dựng để dễ dàng đón nhận các tính năng này:
1. **Dữ liệu chuẩn hóa (Clean Data Contracts)**: Các API thống kê của Backend (`Teacher Statistics`, `Course Performance`) đã trả về đầy đủ các chỉ số định lượng (tỉ lệ drop-off, phân bố điểm quiz), là đầu vào hoàn hảo cho các mô hình AI sau này.
2. **Component Pluggable**: Các vị trí dự kiến cắm widget AI được thiết kế dạng component độc lập, không xâm lấn vào logic của Video Player hay Form thanh toán.
3. **Không Phụ Thuộc (Zero AI Lock-in)**: Hệ thống hoạt động trơn tru 100% độc lập mà không bắt buộc phải có AI mới chạy được.
