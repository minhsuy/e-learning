    # TMDEMY — API MASTER INDEX

    Tài liệu này là Bảng Mục Lục Tổng Hợp toàn bộ **102 REST Endpoints** và hệ thống **Socket.IO Realtime Events** đang hoạt động trong backend TMDEMY.

    Tất cả các endpoint đều được trích xuất trực tiếp từ mã nguồn thực tế tại `src/routes/` và đã được kiểm chứng với Controller, Service và Middleware tương ứng.

    ---

    ## Bảng Tổng Hợp Master API Catalog

    | Domain | Method | Endpoint | Authentication | Roles | Mục đích | Documentation File |
    | :--- | :---: | :--- | :---: | :---: | :--- | :--- |
    | **Auth** | `POST` | `/api/users/register` | Public | - | Đăng ký tài khoản người dùng mới | [AUTH_API.md](file:///d:/e-learning_server/docs/api/AUTH_API.md) |
    | **Auth** | `POST` | `/api/users/verify-otp` | Public | - | Xác thực email đăng ký bằng mã OTP | [AUTH_API.md](file:///d:/e-learning_server/docs/api/AUTH_API.md) |
    | **Auth** | `POST` | `/api/users/login` | Public | - | Đăng nhập hệ thống, nhận Access & Refresh Token | [AUTH_API.md](file:///d:/e-learning_server/docs/api/AUTH_API.md) |
    | **Auth** | `POST` | `/api/users/google-login` | Public | - | Đăng nhập / Đăng ký tự động bằng Google OAuth | [AUTH_API.md](file:///d:/e-learning_server/docs/api/AUTH_API.md) |
    | **Auth** | `GET` | `/api/users/me` | Bearer JWT | All | Lấy thông tin cá nhân của người dùng hiện tại | [AUTH_API.md](file:///d:/e-learning_server/docs/api/AUTH_API.md) |
    | **Auth** | `POST` | `/api/users/logout` | Bearer JWT | All | Đăng xuất và thu hồi Refresh Token trong DB | [AUTH_API.md](file:///d:/e-learning_server/docs/api/AUTH_API.md) |
    | **Auth** | `POST` | `/api/users/forgot-password` | Public | - | Gửi liên kết đặt lại mật khẩu qua email | [AUTH_API.md](file:///d:/e-learning_server/docs/api/AUTH_API.md) |
    | **Auth** | `PUT` | `/api/users/reset-password` | Public | - | Đặt lại mật khẩu mới bằng reset token | [AUTH_API.md](file:///d:/e-learning_server/docs/api/AUTH_API.md) |
    | **Auth** | `POST` | `/api/users/access_token` | Refresh Token | All | Cấp mới Access Token bằng Refresh Token | [AUTH_API.md](file:///d:/e-learning_server/docs/api/AUTH_API.md) |
    | **User** | `PUT` | `/api/users/update-me` | Bearer JWT | All | Cập nhật hồ sơ cá nhân (username, bio, avatar,...) | [USER_API.md](file:///d:/e-learning_server/docs/api/USER_API.md) |
    | **User** | `PUT` | `/api/users/change-password` | Bearer JWT | All | Đổi mật khẩu tài khoản | [USER_API.md](file:///d:/e-learning_server/docs/api/USER_API.md) |
    | **User** | `GET` | `/api/users/profile/:id` | Public | - | Xem hồ sơ công khai của giảng viên hoặc học viên | [USER_API.md](file:///d:/e-learning_server/docs/api/USER_API.md) |
    | **User** | `GET` | `/api/users/teachers` | Public | - | Lấy danh sách giảng viên đang hoạt động (phân trang) | [USER_API.md](file:///d:/e-learning_server/docs/api/USER_API.md) |
    | **Admin** | `GET` | `/api/admin/users` | Bearer JWT | ADMIN | Quản lý danh sách người dùng hệ thống | [ADMIN_API.md](file:///d:/e-learning_server/docs/api/ADMIN_API.md) |
    | **Admin** | `GET` | `/api/admin/users/:id` | Bearer JWT | ADMIN | Xem chi tiết thông tin quản trị của người dùng | [ADMIN_API.md](file:///d:/e-learning_server/docs/api/ADMIN_API.md) |
    | **Admin** | `PUT` | `/api/admin/users/:id` | Bearer JWT | ADMIN | Cập nhật quyền (role), trạng thái người dùng | [ADMIN_API.md](file:///d:/e-learning_server/docs/api/ADMIN_API.md) |
    | **Admin** | `DELETE` | `/api/admin/users/:id` | Bearer JWT | ADMIN | Xóa tài khoản người dùng khỏi hệ thống | [ADMIN_API.md](file:///d:/e-learning_server/docs/api/ADMIN_API.md) |
    | **Admin** | `POST` | `/api/admin/users` | Bearer JWT | ADMIN | Tạo tài khoản Giảng viên mới (Teacher) | [ADMIN_API.md](file:///d:/e-learning_server/docs/api/ADMIN_API.md) |
    | **Admin** | `POST` | `/api/admin/courses` | Bearer JWT | ADMIN | Tạo khóa học mới (trạng thái APPROVED ngay) | [ADMIN_API.md](file:///d:/e-learning_server/docs/api/ADMIN_API.md) |
    | **Admin** | `PUT` | `/api/admin/courses/:id` | Bearer JWT | ADMIN | Cập nhật bất kỳ khóa học nào | [ADMIN_API.md](file:///d:/e-learning_server/docs/api/ADMIN_API.md) |
    | **Admin** | `DELETE` | `/api/admin/courses/:id` | Bearer JWT | ADMIN | Soft-delete khóa học bởi Admin | [ADMIN_API.md](file:///d:/e-learning_server/docs/api/ADMIN_API.md) |
    | **Admin** | `GET` | `/api/admin/courses` | Bearer JWT | ADMIN | Lấy danh sách toàn bộ khóa học để quản lý | [ADMIN_API.md](file:///d:/e-learning_server/docs/api/ADMIN_API.md) |
    | **Admin** | `PATCH` | `/api/admin/courses/teacher/:id` | Bearer JWT | ADMIN | Duyệt / Từ chối khóa học của Giảng viên | [ADMIN_API.md](file:///d:/e-learning_server/docs/api/ADMIN_API.md) |
    | **Admin** | `POST` | `/api/admin/categories` | Bearer JWT | ADMIN | Tạo danh mục khóa học mới | [ADMIN_API.md](file:///d:/e-learning_server/docs/api/ADMIN_API.md) |
    | **Admin** | `PUT` | `/api/admin/categories/:id` | Bearer JWT | ADMIN | Cập nhật danh mục khóa học | [ADMIN_API.md](file:///d:/e-learning_server/docs/api/ADMIN_API.md) |
    | **Admin** | `DELETE` | `/api/admin/categories/:id` | Bearer JWT | ADMIN | Soft-delete danh mục khóa học | [ADMIN_API.md](file:///d:/e-learning_server/docs/api/ADMIN_API.md) |
    | **Teacher** | `POST` | `/api/teacher/courses/` | Bearer JWT | TEACHER | Giảng viên tạo khóa học mới (PENDING duyệt) | [TEACHER_API.md](file:///d:/e-learning_server/docs/api/TEACHER_API.md) |
    | **Teacher** | `PUT` | `/api/teacher/courses/:id` | Bearer JWT | TEACHER | Giảng viên cập nhật khóa học của chính mình | [TEACHER_API.md](file:///d:/e-learning_server/docs/api/TEACHER_API.md) |
    | **Teacher** | `DELETE` | `/api/teacher/courses/:id` | Bearer JWT | TEACHER | Giảng viên xóa khóa học của mình (chỉ khi PENDING) | [TEACHER_API.md](file:///d:/e-learning_server/docs/api/TEACHER_API.md) |
    | **Teacher** | `GET` | `/api/teacher/courses/` | Bearer JWT | TEACHER | Lấy danh sách các khóa học do chính mình tạo | [TEACHER_API.md](file:///d:/e-learning_server/docs/api/TEACHER_API.md) |
    | **Course** | `GET` | `/api/courses/` | Public | - | Danh sách khóa học công khai đã phê duyệt | [COURSE_API.md](file:///d:/e-learning_server/docs/api/COURSE_API.md) |
    | **Course** | `GET` | `/api/courses/:slug` | Public | - | Chi tiết khóa học công khai theo slug (tăng view) | [COURSE_API.md](file:///d:/e-learning_server/docs/api/COURSE_API.md) |
    | **Category** | `GET` | `/api/categories/` | Public | - | Danh sách danh mục công khai đang hoạt động | [CATEGORY_API.md](file:///d:/e-learning_server/docs/api/CATEGORY_API.md) |
    | **Category** | `GET` | `/api/categories/:slug` | Public | - | Chi tiết danh mục công khai theo slug | [CATEGORY_API.md](file:///d:/e-learning_server/docs/api/CATEGORY_API.md) |
    | **Chapter** | `POST` | `/api/chapters/:courseId` | Bearer JWT | TEACHER, ADMIN | Tạo chương học mới trong khóa học | [CHAPTER_API.md](file:///d:/e-learning_server/docs/api/CHAPTER_API.md) |
    | **Chapter** | `PUT` | `/api/chapters/:id` | Bearer JWT | TEACHER, ADMIN | Cập nhật tiêu đề, thứ tự, soft-delete chương học | [CHAPTER_API.md](file:///d:/e-learning_server/docs/api/CHAPTER_API.md) |
    | **Chapter** | `DELETE` | `/api/chapters/:id` | Bearer JWT | TEACHER, ADMIN | Soft-delete chương học | [CHAPTER_API.md](file:///d:/e-learning_server/docs/api/CHAPTER_API.md) |
    | **Chapter** | `GET` | `/api/chapters/course/:id` | Bearer JWT | TEACHER, ADMIN | Lấy danh sách chương học của khóa học | [CHAPTER_API.md](file:///d:/e-learning_server/docs/api/CHAPTER_API.md) |
    | **Lesson** | `POST` | `/api/lessons/` | Bearer JWT | TEACHER, ADMIN | Tạo bài học mới (Video / Text) trong chương | [LESSON_API.md](file:///d:/e-learning_server/docs/api/LESSON_API.md) |
    | **Lesson** | `PUT` | `/api/lessons/:id` | Bearer JWT | TEACHER, ADMIN | Cập nhật thông tin nội dung bài học | [LESSON_API.md](file:///d:/e-learning_server/docs/api/LESSON_API.md) |
    | **Lesson** | `DELETE` | `/api/lessons/:id` | Bearer JWT | TEACHER, ADMIN | Xóa bài học khỏi chương học | [LESSON_API.md](file:///d:/e-learning_server/docs/api/LESSON_API.md) |
    | **Lesson** | `GET` | `/api/lessons/chapter/:chapterId` | Public | - | Lấy danh sách bài học thuộc một chương | [LESSON_API.md](file:///d:/e-learning_server/docs/api/LESSON_API.md) |
    | **Coupon** | `POST` | `/api/coupons/` | Bearer JWT | TEACHER, ADMIN | Tạo mã giảm giá khóa học mới | [COUPON_API.md](file:///d:/e-learning_server/docs/api/COUPON_API.md) |
    | **Coupon** | `PUT` | `/api/coupons/:id` | Bearer JWT | TEACHER, ADMIN | Cập nhật thông tin mã giảm giá | [COUPON_API.md](file:///d:/e-learning_server/docs/api/COUPON_API.md) |
    | **Coupon** | `DELETE` | `/api/coupons/:id` | Bearer JWT | TEACHER, ADMIN | Xóa mã giảm giá | [COUPON_API.md](file:///d:/e-learning_server/docs/api/COUPON_API.md) |
    | **Coupon** | `GET` | `/api/coupons/` | Bearer JWT | TEACHER, ADMIN | Lấy danh sách mã giảm giá để quản lý | [COUPON_API.md](file:///d:/e-learning_server/docs/api/COUPON_API.md) |
    | **Coupon** | `POST` | `/api/coupons/use` | Bearer JWT | All | Kiểm tra tính hợp lệ và số tiền giảm của coupon | [COUPON_API.md](file:///d:/e-learning_server/docs/api/COUPON_API.md) |
    | **Coupon** | `GET` | `/api/coupons/:id` | Bearer JWT | TEACHER, ADMIN | Xem chi tiết thông tin một mã giảm giá | [COUPON_API.md](file:///d:/e-learning_server/docs/api/COUPON_API.md) |
    | **Order** | `POST` | `/api/orders/` | Bearer JWT | All | Tạo đơn hàng mua khóa học (kèm mã giảm giá nếu có) | [ORDER_API.md](file:///d:/e-learning_server/docs/api/ORDER_API.md) |
    | **Order** | `GET` | `/api/orders/my` | Bearer JWT | All | Xem lịch sử đơn hàng của bản thân | [ORDER_API.md](file:///d:/e-learning_server/docs/api/ORDER_API.md) |
    | **Order** | `PUT` | `/api/orders/:id` | Bearer JWT | TEACHER, ADMIN | Cập nhật trạng thái đơn hàng (COMPLETED/REJECTED) | [ORDER_API.md](file:///d:/e-learning_server/docs/api/ORDER_API.md) |
    | **Order** | `GET` | `/api/orders/` | Bearer JWT | TEACHER, ADMIN | Lấy danh sách toàn bộ đơn hàng để quản trị | [ORDER_API.md](file:///d:/e-learning_server/docs/api/ORDER_API.md) |
    | **Progress** | `POST` | `/api/progress/complete` | Bearer JWT | All | Đánh dấu hoàn thành một bài học | [PROGRESS_API.md](file:///d:/e-learning_server/docs/api/PROGRESS_API.md) |
    | **Progress** | `POST` | `/api/progress/uncomplete` | Bearer JWT | All | Hủy đánh dấu hoàn thành bài học | [PROGRESS_API.md](file:///d:/e-learning_server/docs/api/PROGRESS_API.md) |
    | **Progress** | `GET` | `/api/progress/:courseId` | Bearer JWT | All | Lấy tiến độ học tập chi tiết của khóa học | [PROGRESS_API.md](file:///d:/e-learning_server/docs/api/PROGRESS_API.md) |
    | **Enrollment** | `GET` | `/api/enrollments/my` | Bearer JWT | All | Lấy danh sách các khóa học học viên đã ghi danh | [ENROLLMENT_API.md](file:///d:/e-learning_server/docs/api/ENROLLMENT_API.md) |
    | **Enrollment** | `GET` | `/api/enrollments/course/:id` | Bearer JWT | TEACHER, ADMIN | Lấy danh sách học viên trong khóa học cụ thể | [ENROLLMENT_API.md](file:///d:/e-learning_server/docs/api/ENROLLMENT_API.md) |
    | **Enrollment** | `DELETE`| `/api/enrollments/course/:id/:userId`| Bearer JWT | TEACHER, ADMIN | Xóa học viên khỏi khóa học | [ENROLLMENT_API.md](file:///d:/e-learning_server/docs/api/ENROLLMENT_API.md) |
    | **Comment** | `POST` | `/api/comments/` | Bearer JWT | All | Tạo bình luận hoặc câu trả lời trong bài học | [COMMENT_API.md](file:///d:/e-learning_server/docs/api/COMMENT_API.md) |
    | **Comment** | `GET` | `/api/comments/lesson/:lessonId`| Public | - | Lấy danh sách bình luận dạng phân cấp theo bài học | [COMMENT_API.md](file:///d:/e-learning_server/docs/api/COMMENT_API.md) |
    | **Comment** | `DELETE`| `/api/comments/:id` | Bearer JWT | All (Owner) | Người dùng tự xóa bình luận của mình | [COMMENT_API.md](file:///d:/e-learning_server/docs/api/COMMENT_API.md) |
    | **Comment** | `PUT` | `/api/comments/:id` | Bearer JWT | All (Owner) | Người dùng cập nhật nội dung bình luận của mình | [COMMENT_API.md](file:///d:/e-learning_server/docs/api/COMMENT_API.md) |
    | **Comment** | `POST` | `/api/comments/like/:commentId` | Bearer JWT | All | Thích (Like) bình luận | [COMMENT_API.md](file:///d:/e-learning_server/docs/api/COMMENT_API.md) |
    | **Comment** | `POST` | `/api/comments/dislike/:commentId`| Bearer JWT | All | Bỏ thích (Dislike) bình luận | [COMMENT_API.md](file:///d:/e-learning_server/docs/api/COMMENT_API.md) |
    | **Comment** | `GET` | `/api/comments/` | Bearer JWT | TEACHER, ADMIN | Quản lý danh sách bình luận | [COMMENT_API.md](file:///d:/e-learning_server/docs/api/COMMENT_API.md) |
    | **Comment** | `DELETE`| `/api/comments/admin/:id` | Bearer JWT | ADMIN | Admin xóa bình luận kiểm duyệt | [COMMENT_API.md](file:///d:/e-learning_server/docs/api/COMMENT_API.md) |
    | **Comment** | `DELETE`| `/api/comments/teacher/:id` | Bearer JWT | TEACHER, ADMIN | Giảng viên xóa bình luận trong khóa học của mình | [COMMENT_API.md](file:///d:/e-learning_server/docs/api/COMMENT_API.md) |
    | **Rating** | `POST` | `/api/ratings/` | Bearer JWT | All (Enrolled) | Đánh giá sao (1-5) và nhận xét khóa học đã học | [RATING_API.md](file:///d:/e-learning_server/docs/api/RATING_API.md) |
    | **Rating** | `GET` | `/api/ratings/course/:id` | Public | - | Xem tất cả đánh giá công khai của khóa học | [RATING_API.md](file:///d:/e-learning_server/docs/api/RATING_API.md) |
    | **Rating** | `GET` | `/api/ratings/manage/` | Bearer JWT | TEACHER, ADMIN | Lấy danh sách đánh giá để kiểm duyệt | [RATING_API.md](file:///d:/e-learning_server/docs/api/RATING_API.md) |
    | **Rating** | `DELETE`| `/api/ratings/manage/:id` | Bearer JWT | TEACHER, ADMIN | Xóa đánh giá khóa học | [RATING_API.md](file:///d:/e-learning_server/docs/api/RATING_API.md) |
    | **Rating** | `PUT` | `/api/ratings/manage/:id` | Bearer JWT | TEACHER, ADMIN | Cập nhật trạng thái hiển thị (ACTIVE/INACTIVE) | [RATING_API.md](file:///d:/e-learning_server/docs/api/RATING_API.md) |
    | **Favorite**| `POST` | `/api/favorites/:id` | Bearer JWT | All | Thêm khóa học vào danh sách yêu thích | [FAVORITE_API.md](file:///d:/e-learning_server/docs/api/FAVORITE_API.md) |
    | **Favorite**| `DELETE`| `/api/favorites/:id` | Bearer JWT | All | Xóa khóa học khỏi danh sách yêu thích | [FAVORITE_API.md](file:///d:/e-learning_server/docs/api/FAVORITE_API.md) |
    | **Favorite**| `GET` | `/api/favorites/` | Bearer JWT | All | Lấy danh sách khóa học yêu thích của bản thân | [FAVORITE_API.md](file:///d:/e-learning_server/docs/api/FAVORITE_API.md) |
    | **Notification** | `GET` | `/api/notifications/` | Bearer JWT | All | Lấy danh sách thông báo của bản thân (phân trang) | [NOTIFICATION_API.md](file:///d:/e-learning_server/docs/api/NOTIFICATION_API.md) |
    | **Notification** | `PATCH`| `/api/notifications/read/:id` | Bearer JWT | All | Đánh dấu một thông báo là đã đọc | [NOTIFICATION_API.md](file:///d:/e-learning_server/docs/api/NOTIFICATION_API.md) |
    | **Quiz** | `POST` | `/api/quiz/` | Bearer JWT | TEACHER, ADMIN | Tạo bài kiểm tra (Quiz) mới cho bài học | [QUIZ_API.md](file:///d:/e-learning_server/docs/api/QUIZ_API.md) |
    | **Quiz** | `PUT` | `/api/quiz/:quizId` | Bearer JWT | TEACHER, ADMIN | Cập nhật thông tin bài kiểm tra | [QUIZ_API.md](file:///d:/e-learning_server/docs/api/QUIZ_API.md) |
    | **Quiz** | `DELETE`| `/api/quiz/:quizId` | Bearer JWT | TEACHER, ADMIN | Xóa bài kiểm tra và toàn bộ câu hỏi liên quan | [QUIZ_API.md](file:///d:/e-learning_server/docs/api/QUIZ_API.md) |
    | **Quiz** | `GET` | `/api/quiz/lesson/:lessonId` | Public | - | Lấy Quiz của bài học (đã ẩn đáp án đúng) | [QUIZ_API.md](file:///d:/e-learning_server/docs/api/QUIZ_API.md) |
    | **Question**| `POST` | `/api/questions/` | Bearer JWT | TEACHER, ADMIN | Tạo câu hỏi mới trong bài kiểm tra | [QUESTION_API.md](file:///d:/e-learning_server/docs/api/QUESTION_API.md) |
    | **Question**| `PUT` | `/api/questions/:questionId` | Bearer JWT | TEACHER, ADMIN | Cập nhật nội dung câu hỏi và đáp án | [QUESTION_API.md](file:///d:/e-learning_server/docs/api/QUESTION_API.md) |
    | **Question**| `DELETE`| `/api/questions/:questionId` | Bearer JWT | TEACHER, ADMIN | Xóa câu hỏi khỏi bài kiểm tra | [QUESTION_API.md](file:///d:/e-learning_server/docs/api/QUESTION_API.md) |
    | **Submissions** | `POST` | `/api/submissions/` | Bearer JWT | All (Enrolled) | Nộp bài làm Quiz và nhận kết quả chấm điểm | [QUIZ_SUBMISSION_API.md](file:///d:/e-learning_server/docs/api/QUIZ_SUBMISSION_API.md) |
    | **Submissions** | `GET` | `/api/submissions/:quizId` | Bearer JWT | All (Enrolled) | Học viên xem lại kết quả bài nộp của mình | [QUIZ_SUBMISSION_API.md](file:///d:/e-learning_server/docs/api/QUIZ_SUBMISSION_API.md) |
    | **Submissions** | `GET` | `/api/submissions/teacher/:quizId` | Bearer JWT | TEACHER, ADMIN | Giảng viên xem tất cả bài nộp của một Quiz | [QUIZ_SUBMISSION_API.md](file:///d:/e-learning_server/docs/api/QUIZ_SUBMISSION_API.md) |
    | **Submissions** | `GET` | `/api/submissions/teacher/analytics/:quizId` | Bearer JWT | TEACHER, ADMIN | Giảng viên xem số liệu phân tích hiệu suất Quiz | [QUIZ_SUBMISSION_API.md](file:///d:/e-learning_server/docs/api/QUIZ_SUBMISSION_API.md) |
    | **Certificate** | `POST` | `/api/certificates/` | Bearer JWT | All (Enrolled) | Kiểm tra điều kiện tốt nghiệp và cấp Chứng chỉ | [CERTIFICATE_API.md](file:///d:/e-learning_server/docs/api/CERTIFICATE_API.md) |
    | **Conversation**| `POST` | `/api/conversations/` | Bearer JWT | All | Tạo hoặc lấy phòng chat riêng/nhóm khóa học | [CONVERSATION_API.md](file:///d:/e-learning_server/docs/api/CONVERSATION_API.md) |
    | **Conversation**| `GET` | `/api/conversations/` | Bearer JWT | All | Lấy danh sách các cuộc trò chuyện của người dùng | [CONVERSATION_API.md](file:///d:/e-learning_server/docs/api/CONVERSATION_API.md) |
    | **Message** | `GET` | `/api/messages/:conversationId`| Bearer JWT | All (Member) | Lấy lịch sử tin nhắn của cuộc trò chuyện | [MESSAGE_API.md](file:///d:/e-learning_server/docs/api/MESSAGE_API.md) |
    | **Statistics** | `GET` | `/api/teacher/statistics/overview` | Bearer JWT | TEACHER | Tổng quan KPI giảng viên (doanh thu, học viên) | [TEACHER_STATISTICS_API.md](file:///d:/e-learning_server/docs/api/TEACHER_STATISTICS_API.md) |
    | **Statistics** | `GET` | `/api/teacher/statistics/revenue` | Bearer JWT | TEACHER | Biểu đồ doanh thu theo chu kỳ (7d, 30d, 12m, custom) | [TEACHER_STATISTICS_API.md](file:///d:/e-learning_server/docs/api/TEACHER_STATISTICS_API.md) |
    | **Statistics** | `GET` | `/api/teacher/statistics/courses` | Bearer JWT | TEACHER | Bảng xếp hạng khóa học theo doanh thu, học viên | [TEACHER_STATISTICS_API.md](file:///d:/e-learning_server/docs/api/TEACHER_STATISTICS_API.md) |
    | **Statistics** | `GET` | `/api/teacher/statistics/enrollments`| Bearer JWT | TEACHER | Phân tích học viên mới và trạng thái học tập | [TEACHER_STATISTICS_API.md](file:///d:/e-learning_server/docs/api/TEACHER_STATISTICS_API.md) |
    | **Statistics** | `GET` | `/api/teacher/statistics/learning` | Bearer JWT | TEACHER | Thống kê tiến độ hoàn thành và tỷ lệ nhận chứng chỉ | [TEACHER_STATISTICS_API.md](file:///d:/e-learning_server/docs/api/TEACHER_STATISTICS_API.md) |
    | **Performance** | `GET` | `/api/teacher/statistics/course-performance/:courseId` | Bearer JWT | TEACHER | Snapshot toàn diện hiệu suất và Funnel bài học | [COURSE_PERFORMANCE_API.md](file:///d:/e-learning_server/docs/api/COURSE_PERFORMANCE_API.md) |
    | **Gamification** | `GET` | `/api/leaderboard` | Public / Tùy chọn Auth | All | Bảng xếp hạng học viên toàn cầu theo điểm XP (RANK() 1224) | [GAMIFICATION_LEADERBOARD_API.md](file:///d:/e-learning_server/docs/api/GAMIFICATION_LEADERBOARD_API.md) |
    | **Gamification** | `GET` | `/api/leaderboard/me` | Bearer JWT | All | Vị trí xếp hạng cá nhân trên bảng xếp hạng Leaderboard | [GAMIFICATION_LEADERBOARD_API.md](file:///d:/e-learning_server/docs/api/GAMIFICATION_LEADERBOARD_API.md) |
    | **Gamification** | `GET` | `/api/users/me/leaderboard-position` | Bearer JWT | All | Vị trí xếp hạng cá nhân trên bảng xếp hạng (Alias endpoint) | [GAMIFICATION_LEADERBOARD_API.md](file:///d:/e-learning_server/docs/api/GAMIFICATION_LEADERBOARD_API.md) |
    | **Gamification** | `GET` | `/api/users/me/xp-summary` | Bearer JWT | All | Tổng quan điểm XP, danh hiệu hiện tại, khoảng cách tới rank kế | [GAMIFICATION_LEADERBOARD_API.md](file:///d:/e-learning_server/docs/api/GAMIFICATION_LEADERBOARD_API.md) |
    | **Gamification** | `GET` | `/api/users/me/streak` | Bearer JWT | All | Chuỗi ngày học liên tiếp và kỷ lục streak (Asia/Ho_Chi_Minh) | [GAMIFICATION_LEADERBOARD_API.md](file:///d:/e-learning_server/docs/api/GAMIFICATION_LEADERBOARD_API.md) |
    | **Gamification** | `GET` | `/api/users/me/xp-history` | Bearer JWT | All | Lịch sử biến động điểm XP có phân trang và lọc theo type | [GAMIFICATION_LEADERBOARD_API.md](file:///d:/e-learning_server/docs/api/GAMIFICATION_LEADERBOARD_API.md) |
