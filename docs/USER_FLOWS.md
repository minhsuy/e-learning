# TMDEMY — USER FLOWS SPECIFICATION

> **Tài liệu phân tích và mô tả chi tiết toàn bộ luồng trải nghiệm người dùng (User Flows) của hệ thống TMDEMY.**  
> *Bao gồm 4 đối tượng: Khách vãng lai (Public), Học viên (Student), Giảng viên (Teacher), và Quản trị viên (Admin).*

---

## 1. Luồng Người dùng Công khai (Public Discovery Flow)

Dành cho khách truy cập chưa đăng nhập hoặc học viên tìm kiếm khóa học mới.

```text
┌──────────────┐
│  Trang chủ   │ (Banner, Danh mục hot, Khóa học nổi bật, Đội ngũ giảng viên)
└──────┬───────┘
       │
       ├─────────────────────────────────┐
       ▼                                 ▼
┌──────────────────┐           ┌──────────────────┐
│ Khám phá khóa học│           │ Danh mục cụ thể  │
│  (/courses)      │           │ (/categories/:id)│
└──────┬───────────┘           └─────────┬────────┘
       │                                 │
       ▼                                 │
┌──────────────────────────────────┐     │
│ Tìm kiếm & Lọc nâng cao          │◄────┘
│ (Từ khóa, Level, Giá, Phân trang)│
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────┐
│ Chi tiết Khóa học (/courses/:slug)           │
│ - Video giới thiệu (Trailer)                 │
│ - Mục tiêu bài học, Yêu cầu                  │
│ - Đề cương chương/bài (Xem trước bài mẫu)    │
│ - Đánh giá, Điểm sao & Nhận xét của học viên │
│ - Thông tin Giảng viên                       │
└──────┬───────────────────────────────────────┘
       │
       ├─────────────────────────┬─────────────────────────┐
       ▼                         ▼                         ▼
┌──────────────┐          ┌──────────────┐          ┌──────────────┐
│  Đăng nhập   │          │   Đăng ký    │          │ Nút Mua ngay │
│   (/login)   │          │ (/register)  │          │ (Chuyển Auth)│
└──────────────┘          └──────────────┘          └──────────────┘
```

---

## 2. Luồng Học viên (Student Learning Experience Flow)

Trải nghiệm học tập trọn vẹn từ lúc mua khóa học đến khi nhận chứng chỉ tốt nghiệp.

```text
                  ┌───────────────────────────────┐
                  │    Đăng nhập & Xác thực       │
                  │  (Email, Password & OTP)      │
                  └──────────────┬────────────────┘
                                 │
                                 ▼
                  ┌───────────────────────────────┐
                  │ Khám phá & Chọn Khóa học      │
                  │ (Yêu thích / Thêm vào Wishlist│
                  └──────────────┬────────────────┘
                                 │
                                 ▼
                  ┌───────────────────────────────┐
                  │     Trang Thanh toán          │
                  │  - Kiểm tra giá khóa học      │
                  │  - Nhập mã giảm giá (Coupon)  │
                  │  - Xác nhận Đơn hàng (Order)  │
                  └──────────────┬────────────────┘
                                 │
          ┌──────────────────────┴──────────────────────┐
          ▼ (Khóa học trả phí)                           ▼ (Khóa học 0 VND / Miễn phí)
┌──────────────────────┐                       ┌──────────────────────┐
│ Thanh toán thành công│                       │ Tự động kích hoạt    │
│ (Order Completed)    │                       │ (Order Completed)    │
└─────────┬────────────┘                       └──────────┬───────────┘
          │                                               │
          └──────────────────────┬────────────────────────┘
                                 │
                                 ▼
                  ┌───────────────────────────────┐
                  │ Ghi danh học tập (Enrollment) │
                  │ Khóa học xuất hiện trong      │
                  │ "Khóa học của tôi"            │
                  └──────────────┬────────────────┘
                                 │
                                 ▼
                  ┌───────────────────────────────┐
                  │ Phòng học (Learning Player)   │
                  │ (/learn/:courseId)            │
                  └──────────────┬────────────────┘
                                 │
       ┌─────────────────────────┴─────────────────────────┐
       ▼                                                   ▼
┌──────────────────────────────┐            ┌──────────────────────────────┐
│ Bài học Video (Video Player) │            │ Bài học Văn bản (Article)    │
│ - Xem bài giảng              │            │ - Đọc nội dung & tài liệu    │
│ - Tự động cập nhật Progress  │            │ - Nút "Đánh dấu hoàn thành"  │
└──────────────┬───────────────┘            └──────────────┬───────────────┘
               │                                           │
               └─────────────────┬─────────────────────────┘
                                 │
                                 ▼
                  ┌───────────────────────────────┐
                  │ Bài trắc nghiệm (Quiz)        │
                  │ - Đếm ngược thời gian         │
                  │ - Trả lời câu hỏi MC / Fill   │
                  │ - Nộp bài & xem điểm, đáp án  │
                  └──────────────┬────────────────┘
                                 │
                                 ▼
                  ┌───────────────────────────────┐
                  │ Hoàn thành 100% Khóa học      │
                  │ - Hệ thống cấp Chứng chỉ      │
                  │   tự động (Certificate)       │
                  │ - Tải chứng chỉ PDF/PNG       │
                  └──────────────┬────────────────┘
                                 │
       ┌─────────────────────────┴─────────────────────────┐
       ▼                                                   ▼
┌──────────────────────────────┐            ┌──────────────────────────────┐
│ Đánh giá & Nhận xét Khóa học │            │ Tương tác & Thảo luận        │
│ (Rating 1 - 5 sao)           │            │ - Bình luận trong bài học    │
│                              │            │ - Like / Dislike bình luận   │
│                              │            │ - Chat realtime với Teacher  │
│                              │            │ - Nhận Thông báo hệ thống    │
└──────────────────────────────┘            └──────────────────────────────┘
```

---

## 3. Luồng Giảng viên (Teacher Studio & Analytics Flow)

Dành cho Giảng viên (role `teacher` / Expert) để xuất bản nội dung và giám sát số liệu.

```text
                  ┌───────────────────────────────┐
                  │     Đăng nhập Giảng viên      │
                  │      (Role: "teacher")        │
                  └──────────────┬────────────────┘
                                 │
                                 ▼
                  ┌───────────────────────────────┐
                  │ Bảng điều khiển (Dashboard)   │
                  │ - Tổng doanh thu              │
                  │ - Tổng số học viên            │
                  │ - Số khóa học đang chạy       │
                  └──────────────┬────────────────┘
                                 │
       ┌─────────────────────────┼─────────────────────────┐
       ▼                         ▼                         ▼
┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐
│ Quản lý Khóa học     │  │ Quản lý Mã giảm giá  │  │ Quản lý Học viên &   │
│ - Tạo khóa học mới   │  │ (Coupons)            │  │ Đơn hàng             │
│   (Trạng thái PENDING│  │ - Tạo coupon riêng   │  │ - Danh sách ghi danh │
│    chờ Admin duyệt)  │  │ - Cấu hình % hoặc tiền│  │ - Lịch sử giao dịch  │
│ - Cập nhật thông tin │  │ - Bật/tắt trạng thái │  │ - Doanh thu theo ngày│
│ - Xóa khóa học       │  └──────────────────────┘  └──────────────────────┘
└──────────┬───────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ Studio Giáo trình (Curriculum)       │
│ ├── Quản lý Chương học (Chapters)    │
│ │   └── Thêm, sửa, đổi thứ tự        │
│ ├── Quản lý Bài học (Lessons)        │
│ │   └── Upload video / Viết nội dung │
│ └── Quản lý Trắc nghiệm (Quizzes)    │
│     └── Ngân hàng câu hỏi (MCQ, Fill)│
└──────────────────┬───────────────────┘
                   │
                   ▼
┌────────────────────────────────────────────────────────┐
│ Phân tích Chuyên sâu (Course Performance & Analytics)  │
│ ├── Tỷ lệ hoàn thành khóa học (Completion Rate)        │
│ ├── Phổ điểm bài trắc nghiệm (Quiz Pass Rate)          │
│ ├── Phễu bài học (Lesson Funnel):                      │
│ │   Tỷ lệ người học chuyển tiếp qua từng bài           │
│ └── Điểm rơi rớt (Drop-off Rate):                      │
│     Xác định chính xác bài học học viên bỏ dở nhiều    │
│     nhất để cải tiến chất lượng giảng dạy              │
└──────────────────┬─────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────┐
│ Hỗ trợ & Tương tác                   │
│ - Chat trực tiếp với học viên        │
│ - Trả lời bình luận trong bài học    │
└──────────────────────────────────────┘
```

---

## 4. Luồng Quản trị viên (Admin Operations Flow)

Dành cho Ban Quản trị hệ thống (role `admin`) để điều hành sàn học tập.

```text
                  ┌───────────────────────────────┐
                  │     Đăng nhập Quản trị viên   │
                  │        (Role: "admin")        │
                  └──────────────┬────────────────┘
                                 │
                                 ▼
                  ┌───────────────────────────────┐
                  │ Bảng điều khiển Quản trị      │
                  │ - Tổng doanh thu sàn          │
                  │ - Biến động học viên mới      │
                  │ - Số lượng khóa học chờ duyệt │
                  └──────────────┬────────────────┘
                                 │
       ┌──────────────────┬──────┴───────────┬──────────────────┐
       ▼                  ▼                  ▼                  ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│ Người dùng   │   │ Kiểm duyệt   │   │ Danh mục     │   │ Mã giảm giá  │
│ (Users)      │   │ Khóa học     │   │ (Categories) │   │ (Coupons)    │
│ - Khóa/Mở tk │   │ - Xem chi tiết│   │ - Thêm danh  │   │ - Quản lý mã │
│ - Cấp quyền  │   │   giáo trình │   │   mục mới    │   │   toàn sàn   │
│ - Tạo tài    │   │ - Duyệt      │   │ - Sửa danh   │   │ - Cấu hình   │
│   khoản      │   │   (APPROVED) │   │   mục        │   │   hạn dùng   │
│   Teacher    │   │ - Từ chối    │   │ - Xóa mềm    │   │ - Thống kê   │
│              │   │   (REJECTED) │   │              │   │   lượt dùng  │
└──────────────┘   └──────────────┘   └──────────────┘   └──────────────┘
                          │
                          ▼
              ┌──────────────────────────────┐
              │ Kiểm duyệt Tương tác         │
              │ - Quản lý toàn bộ bình luận  │
              │ - Ẩn/Xóa bình luận vi phạm   │
              │ - Báo cáo tài chính & đơn    │
              │   hàng toàn hệ thống         │
              └──────────────────────────────┘
```
