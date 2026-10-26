# TMDEMY FULL CORE API COVERAGE AUDIT — PHASE F6.6

> **Ngày thực hiện**: 12/10/2026  
> **Người thực hiện**: Frontend AI Engineer (Antigravity)  
> **Phạm vi**: TMdemy Frontend (`d:/e-learning`) & TMdemy Backend (`d:/e-learning_server`)  
> **Chế độ**: **AUDIT ONLY** — *Không sửa source code, không tạo file mã nguồn, không cài package*  
> **Tài liệu đối chiếu**: `api/API_INDEX.md` (102 REST Endpoints + Socket.IO Realtime)

---

## 1. Executive Summary

Hệ thống E-learning TMdemy hiện tại có **102 REST API endpoints** và một hệ thống **Socket.IO Realtime Chat & Notification** hoàn chỉnh trong backend.

Trải qua các phase từ F6.1 đến F6.5, Frontend đã tích hợp thành công các phân hệ lõi của trải nghiệm học tập học viên (Student Experience):
- **Authentication & User Session Lifecycle** (Register, Verify OTP, Login, Current User `/api/users/me`, Logout, Forgot Password, Reset Password, Dual-token Silent Refresh).
- **Public Course Discovery** (Course Listing, Categories, Filters, Search, Pagination).
- **Course Detail & Syllabus** (Course Details, Chapters, Lessons preview, Public Ratings, Enrollment Check).
- **Classroom Interactive Learning** (Chapters & Lessons streaming, Complete/Uncomplete Lesson Progress tracking, Q&A Comments & Replies).
- **My Courses & Enrolled Progress** (Enrolled Courses List, Progress % calculation, Completed/Total Lessons count, Safe Classroom Navigation).

Tuy nhiên, cuộc kiểm toán toàn diện này chỉ ra rằng **83/102 endpoints (81.4%)** chưa được tích hợp vào Frontend, bao gồm toàn bộ phân hệ:
1. **Commerce & Checkout** (Orders, Coupons, Cart, Free checkout).
2. **Teacher System** (Quản lý khóa học, chương, bài học, mã giảm giá, học viên và báo cáo doanh thu/KPIs).
3. **Admin System** (Quản lý người dùng, duyệt khóa học, quản lý danh mục, kiểm duyệt bình luận và đánh giá).
4. **Quiz & Examination** (Bài kiểm tra Quiz, ngân hàng câu hỏi Question, nộp bài Submissions và chấm điểm).
5. **Realtime Communication** (Trò chuyện trực tiếp qua Socket.IO, phòng chat nhóm, tin nhắn đa phương tiện).
6. **Gamification & Social** (Leaderboard xếp hạng toàn cầu, chuỗi học tập Streak, XP summary, lịch sử XP).
7. **Certificate Issuance** (Xác thực điều kiện tốt nghiệp và cấp chứng chỉ số).
8. **User Self-Management** (Cập nhật hồ sơ cá nhân `update-me`, đổi mật khẩu `change-password`, danh sách yêu thích Favorites).

---

## 2. Tổng quan API Coverage

### 2.1 Thống kê định lượng 102 REST Endpoints

| Nhóm API (Domain) | Tổng số Endpoints | FULL (Đã tích hợp) | PARTIAL (Tích hợp một phần) | NOT INTEGRATED (Chưa tích hợp) | Tỷ lệ tích hợp |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Auth** | 8 | 8 | 0 | 0 | **100%** |
| **User** | 4 | 0 | 0 | 4 | **0%** |
| **Admin** | 13 | 0 | 0 | 13 | **0%** |
| **Teacher** | 4 | 0 | 0 | 4 | **0%** |
| **Course** | 2 | 2 | 0 | 0 | **100%** |
| **Category** | 2 | 1 | 0 | 1 | **50%** |
| **Chapter** | 4 | 0 | 0 | 4 | **0%** |
| **Lesson** | 4 | 1 | 0 | 3 | **25%** |
| **Coupon** | 6 | 0 | 0 | 6 | **0%** |
| **Order** | 4 | 0 | 0 | 4 | **0%** |
| **Progress** | 3 | 3 | 0 | 0 | **100%** |
| **Enrollment** | 3 | 1 | 0 | 2 | **33.3%** |
| **Comment** | 9 | 2 | 0 | 7 | **22.2%** |
| **Rating** | 5 | 1 | 0 | 4 | **20%** |
| **Favorite** | 3 | 0 | 0 | 3 | **0%** |
| **Notification** | 2 | 0 | 0 | 2 | **0%** |
| **Quiz** | 4 | 0 | 0 | 4 | **0%** |
| **Question** | 3 | 0 | 0 | 3 | **0%** |
| **Submissions** | 4 | 0 | 0 | 4 | **0%** |
| **Certificate** | 1 | 0 | 0 | 1 | **0%** |
| **Conversation** | 2 | 0 | 0 | 2 | **0%** |
| **Message** | 1 | 0 | 0 | 1 | **0%** |
| **Teacher Statistics** | 5 | 0 | 0 | 5 | **0%** |
| **Course Performance** | 1 | 0 | 0 | 1 | **0%** |
| **Gamification** | 6 | 0 | 0 | 6 | **0%** |
| **TỔNG CỘNG** | **102** | **19** | **0** | **83** | **18.6%** |

### 2.2 Đánh giá phân loại
- **FULL (19/102 = 18.6%)**: Endpoint có Frontend Service tương ứng, có màn hình Frontend gọi thực tế qua Central API Client, có xử lý Token Authorization, có đầy đủ Loading/Error/Empty UX states và đã được kiểm thử (Unit/E2E).
- **PARTIAL (0/102)**: Tất cả các endpoint đã đưa vào service đều đã được kết nối vào ít nhất một màn hình cụ thể.
- **NOT INTEGRATED (83/102 = 81.4%)**: Chưa có hàm trong `src/services/` và chưa có màn hình/component nào gọi tới.

---

## 3. Bảng Chi Tiết Toàn Bộ 102 REST Endpoints

### 3.1 Nhóm Authentication (8 endpoints)
| Domain | Method | Endpoint | Backend Exists | Frontend Service | Frontend Screen | Integration Status | Test Status | Missing Work | Evidence |
| :--- | :---: | :--- | :---: | :--- | :--- | :---: | :---: | :--- | :--- |
| **Auth** | `POST` | `/api/users/register` | Có | `authService.register` | `/(auth)/register` | **FULL** | **PASS** | Đã hoàn thành | `src/services/auth.service.ts:30` |
| **Auth** | `POST` | `/api/users/verify-otp` | Có | `authService.verifyOtp` | `/(auth)/verify-otp` | **FULL** | **PASS** | Đã hoàn thành | `src/services/auth.service.ts:40` |
| **Auth** | `POST` | `/api/users/login` | Có | `authService.login` | `/(auth)/login` | **FULL** | **PASS** | Đã hoàn thành | `src/services/auth.service.ts:50` |
| **Auth** | `GET` | `/api/users/me` | Có | `authService.getMe` | AuthContext, Header, Profile | **FULL** | **PASS** | Đã hoàn thành | `src/services/auth.service.ts:60` |
| **Auth** | `POST` | `/api/users/logout` | Có | `authService.logout` | UserDropdown (Header) | **FULL** | **PASS** | Đã hoàn thành | `src/services/auth.service.ts:69` |
| **Auth** | `POST` | `/api/users/forgot-password` | Có | `authService.forgotPassword` | `/(auth)/forgot-password` | **FULL** | **PASS** | Phụ thuộc cấu hình SMTP mailer thực tế backend | `src/services/auth.service.ts:77` |
| **Auth** | `PUT` | `/api/users/reset-password` | Có | `authService.resetPassword` | `/(auth)/reset-password` | **FULL** | **PASS** | Đã hoàn thành | `src/services/auth.service.ts:88` |
| **Auth** | `POST` | `/api/users/access_token` | Có | `authService.refreshToken` | `src/lib/api/client.ts` | **FULL** | **PASS** | Đã tích hợp trong Interceptor khôi phục token | `src/lib/api/client.ts:82` |

### 3.2 Nhóm User Profile & Management (4 endpoints)
| Domain | Method | Endpoint | Backend Exists | Frontend Service | Frontend Screen | Integration Status | Test Status | Missing Work | Evidence |
| :--- | :---: | :--- | :---: | :--- | :--- | :---: | :---: | :--- | :--- |
| **User** | `PUT` | `/api/users/update-me` | Có | Chưa có | `/profile`, `/settings` | **NOT INTEGRATED** | **NOT TESTED** | Cần tạo `userService.updateMe`, gắn vào form modal lưu hồ sơ | `src/app/profile/page.tsx:72` (đang lưu state local) |
| **User** | `PUT` | `/api/users/change-password` | Có | Chưa có | `/settings` | **NOT INTEGRATED** | **NOT TESTED** | Cần tạo `userService.changePassword`, gắn vào tab Bảo mật | `src/app/settings/page.tsx:42` (form chưa gọi API) |
| **User** | `GET` | `/api/users/profile/:id` | Có | Chưa có | Chưa có | **NOT INTEGRATED** | **NOT TESTED** | Cần tạo trang xem profile công khai của giảng viên/học viên | Chưa có route `/profile/[id]` |
| **User** | `GET` | `/api/users/teachers` | Có | Chưa có | Chưa có | **NOT INTEGRATED** | **NOT TESTED** | Cần trang danh bạ giảng viên hoặc component Featured Teachers | Chưa có route `/teachers` |

### 3.3 Nhóm Admin System (13 endpoints)
| Domain | Method | Endpoint | Backend Exists | Frontend Service | Frontend Screen | Integration Status | Test Status | Missing Work | Evidence |
| :--- | :---: | :--- | :---: | :--- | :--- | :---: | :---: | :--- | :--- |
| **Admin** | `GET` | `/api/admin/users` | Có | Chưa có | Chưa có | **NOT INTEGRATED** | **NOT TESTED** | Chưa có Admin Portal `/admin/users` | Chưa có service & screen |
| **Admin** | `GET` | `/api/admin/users/:id` | Có | Chưa có | Chưa có | **NOT INTEGRATED** | **NOT TESTED** | Xem chi tiết thông tin user | Chưa có service & screen |
| **Admin** | `PUT` | `/api/admin/users/:id` | Có | Chưa có | Chưa có | **NOT INTEGRATED** | **NOT TESTED** | Đổi quyền, khóa/mở tài khoản | Chưa có service & screen |
| **Admin** | `DELETE` | `/api/admin/users/:id` | Có | Chưa có | Chưa có | **NOT INTEGRATED** | **NOT TESTED** | Xóa tài khoản người dùng | Chưa có service & screen |
| **Admin** | `POST` | `/api/admin/users` | Có | Chưa có | Chưa có | **NOT INTEGRATED** | **NOT TESTED** | Tạo tài khoản Teacher mới | Chưa có service & screen |
| **Admin** | `POST` | `/api/admin/courses` | Có | Chưa có | Chưa có | **NOT INTEGRATED** | **NOT TESTED** | Admin tạo khóa học phê duyệt ngay | Chưa có service & screen |
| **Admin** | `PUT` | `/api/admin/courses/:id` | Có | Chưa có | Chưa có | **NOT INTEGRATED** | **NOT TESTED** | Cập nhật bất kỳ khóa học | Chưa có service & screen |
| **Admin** | `DELETE` | `/api/admin/courses/:id` | Có | Chưa có | Chưa có | **NOT INTEGRATED** | **NOT TESTED** | Soft-delete khóa học | Chưa có service & screen |
| **Admin** | `GET` | `/api/admin/courses` | Có | Chưa có | Chưa có | **NOT INTEGRATED** | **NOT TESTED** | Danh sách khóa học quản trị | Chưa có service & screen |
| **Admin** | `PATCH` | `/api/admin/courses/teacher/:id` | Có | Chưa có | Chưa có | **NOT INTEGRATED** | **NOT TESTED** | Duyệt / Từ chối khóa học giáo viên | Chưa có service & screen |
| **Admin** | `POST` | `/api/admin/categories` | Có | Chưa có | Chưa có | **NOT INTEGRATED** | **NOT TESTED** | Thêm danh mục mới | Chưa có service & screen |
| **Admin** | `PUT` | `/api/admin/categories/:id` | Có | Chưa có | Chưa có | **NOT INTEGRATED** | **NOT TESTED** | Chỉnh sửa danh mục | Chưa có service & screen |
| **Admin** | `DELETE` | `/api/admin/categories/:id` | Có | Chưa có | Chưa có | **NOT INTEGRATED** | **NOT TESTED** | Xóa danh mục | Chưa có service & screen |

### 3.4 Nhóm Teacher Management (4 endpoints)
| Domain | Method | Endpoint | Backend Exists | Frontend Service | Frontend Screen | Integration Status | Test Status | Missing Work | Evidence |
| :--- | :---: | :--- | :---: | :--- | :--- | :---: | :---: | :--- | :--- |
| **Teacher** | `POST` | `/api/teacher/courses/` | Có | Chưa có | Chưa có | **NOT INTEGRATED** | **NOT TESTED** | Chưa có Teacher Studio `/teacher/courses/create` | Chưa có service & screen |
| **Teacher** | `PUT` | `/api/teacher/courses/:id` | Có | Chưa có | Chưa có | **NOT INTEGRATED** | **NOT TESTED** | Cập nhật khóa học giáo viên | Chưa có service & screen |
| **Teacher** | `DELETE` | `/api/teacher/courses/:id` | Có | Chưa có | Chưa có | **NOT INTEGRATED** | **NOT TESTED** | Xóa khóa học nháp/pending | Chưa có service & screen |
| **Teacher** | `GET` | `/api/teacher/courses/` | Có | Chưa có | Chưa có | **NOT INTEGRATED** | **NOT TESTED** | Danh sách khóa học của tôi (giáo viên) | Chưa có service & screen |

### 3.5 Nhóm Course Discovery & Details (2 endpoints)
| Domain | Method | Endpoint | Backend Exists | Frontend Service | Frontend Screen | Integration Status | Test Status | Missing Work | Evidence |
| :--- | :---: | :--- | :---: | :--- | :--- | :---: | :---: | :--- | :--- |
| **Course** | `GET` | `/api/courses/` | Có | `courseService.getCourses` | `/courses` | **FULL** | **PASS** | Đã hoàn thành bộ lọc, tìm kiếm, phân trang | `src/services/course.service.ts:13` |
| **Course** | `GET` | `/api/courses/:slug` | Có | `courseService.getCourseBySlug` | `/courses/[slug]`, `/learn/[slug]` | **FULL** | **PASS** | Đã hoàn thành chi tiết khóa & giáo trình | `src/services/course.service.ts:37` |

### 3.6 Nhóm Category (2 endpoints)
| Domain | Method | Endpoint | Backend Exists | Frontend Service | Frontend Screen | Integration Status | Test Status | Missing Work | Evidence |
| :--- | :---: | :--- | :---: | :--- | :--- | :---: | :---: | :--- | :--- |
| **Category** | `GET` | `/api/categories/` | Có | `categoryService.getCategories` | `/courses` | **FULL** | **PASS** | Đã load danh mục động làm pills lọc | `src/services/category.service.ts:13` |
| **Category** | `GET` | `/api/categories/:slug` | Có | Chưa có | Chưa có | **NOT INTEGRATED** | **NOT TESTED** | Chưa có trang xem chuyên trang danh mục | Có thể bổ sung `/categories/[slug]` |

### 3.7 Nhóm Curriculum: Chapter & Lesson (8 endpoints)
| Domain | Method | Endpoint | Backend Exists | Frontend Service | Frontend Screen | Integration Status | Test Status | Missing Work | Evidence |
| :--- | :---: | :--- | :---: | :--- | :--- | :---: | :---: | :--- | :--- |
| **Chapter** | `POST` | `/api/chapters/:courseId` | Có | Chưa có | Chưa có | **NOT INTEGRATED** | **NOT TESTED** | Giáo viên thêm chương học | Quyền TEACHER/ADMIN |
| **Chapter** | `PUT` | `/api/chapters/:id` | Có | Chưa có | Chưa có | **NOT INTEGRATED** | **NOT TESTED** | Sửa tiêu đề, thứ tự chương | Quyền TEACHER/ADMIN |
| **Chapter** | `DELETE` | `/api/chapters/:id` | Có | Chưa có | Chưa có | **NOT INTEGRATED** | **NOT TESTED** | Xóa chương học | Quyền TEACHER/ADMIN |
| **Chapter** | `GET` | `/api/chapters/course/:id` | Có | Chưa có | Chưa có | **NOT INTEGRATED** | **NOT TESTED** | API quản lý chapter cho giáo viên | Học viên lấy qua `course.chapters` |
| **Lesson** | `POST` | `/api/lessons/` | Có | Chưa có | Chưa có | **NOT INTEGRATED** | **NOT TESTED** | Giáo viên tạo bài học mới | Quyền TEACHER/ADMIN |
| **Lesson** | `PUT` | `/api/lessons/:id` | Có | Chưa có | Chưa có | **NOT INTEGRATED** | **NOT TESTED** | Sửa videoUrl, tài liệu bài học | Quyền TEACHER/ADMIN |
| **Lesson** | `DELETE` | `/api/lessons/:id` | Có | Chưa có | Chưa có | **NOT INTEGRATED** | **NOT TESTED** | Xóa bài học | Quyền TEACHER/ADMIN |
| **Lesson** | `GET` | `/api/lessons/chapter/:chapterId`| Có | `lessonService.getLessonsByChapter`| `/learn/[slug]` | **FULL** | **PASS** | Đã load bài học theo chương học trong Classroom | `src/services/lesson.service.ts:12` |

### 3.8 Nhóm Coupon & Khuyến Mãi (6 endpoints)
| Domain | Method | Endpoint | Backend Exists | Frontend Service | Frontend Screen | Integration Status | Test Status | Missing Work | Evidence |
| :--- | :---: | :--- | :---: | :--- | :--- | :---: | :---: | :--- | :--- |
| **Coupon** | `POST` | `/api/coupons/` | Có | Chưa có | Chưa có | **NOT INTEGRATED** | **NOT TESTED** | Giáo viên tạo mã coupon | Quyền TEACHER/ADMIN |
| **Coupon** | `PUT` | `/api/coupons/:id` | Có | Chưa có | Chưa có | **NOT INTEGRATED** | **NOT TESTED** | Sửa mã giảm giá | Quyền TEACHER/ADMIN |
| **Coupon** | `DELETE` | `/api/coupons/:id` | Có | Chưa có | Chưa có | **NOT INTEGRATED** | **NOT TESTED** | Xóa mã giảm giá | Quyền TEACHER/ADMIN |
| **Coupon** | `GET` | `/api/coupons/` | Có | Chưa có | Chưa có | **NOT INTEGRATED** | **NOT TESTED** | Quản lý danh sách coupon | Quyền TEACHER/ADMIN |
| **Coupon** | `POST` | `/api/coupons/use` | Có | Chưa có | Chưa có | **NOT INTEGRATED** | **NOT TESTED** | Kiểm tra mã coupon tại màn hình Checkout | Cần làm khi triển khai Checkout |
| **Coupon** | `GET` | `/api/coupons/:id` | Có | Chưa có | Chưa có | **NOT INTEGRATED** | **NOT TESTED** | Xem chi tiết mã coupon | Quyền TEACHER/ADMIN |

### 3.9 Nhóm Order & Commerce (4 endpoints)
| Domain | Method | Endpoint | Backend Exists | Frontend Service | Frontend Screen | Integration Status | Test Status | Missing Work | Evidence |
| :--- | :---: | :--- | :---: | :--- | :--- | :---: | :---: | :--- | :--- |
| **Order** | `POST` | `/api/orders/` | Có | Chưa có | Chưa có | **NOT INTEGRATED** | **NOT TESTED** | Chưa có màn hình Checkout `/checkout` | `CourseDetail` đang link tới `/checkout` ảo |
| **Order** | `GET` | `/api/orders/my` | Có | Chưa có | Chưa có | **NOT INTEGRATED** | **NOT TESTED** | Chưa có màn hình Lịch sử đơn hàng `/orders` | Cần màn hình đơn hàng đã mua |
| **Order** | `PUT` | `/api/orders/:id` | Có | Chưa có | Chưa có | **NOT INTEGRATED** | **NOT TESTED** | Duyệt trạng thái thanh toán | Quyền TEACHER/ADMIN |
| **Order** | `GET` | `/api/orders/` | Có | Chưa có | Chưa có | **NOT INTEGRATED** | **NOT TESTED** | Quản lý danh sách đơn hàng toàn sàn | Quyền TEACHER/ADMIN |

### 3.10 Nhóm Progress & Learning Completion (3 endpoints)
| Domain | Method | Endpoint | Backend Exists | Frontend Service | Frontend Screen | Integration Status | Test Status | Missing Work | Evidence |
| :--- | :---: | :--- | :---: | :--- | :--- | :---: | :---: | :--- | :--- |
| **Progress** | `POST` | `/api/progress/complete` | Có | `progressService.completeLesson` | `/learn/[slug]` | **FULL** | **PASS** | Đánh dấu hoàn thành bài học tự tính % | `src/services/progress.service.ts:26` |
| **Progress** | `POST` | `/api/progress/uncomplete` | Có | `progressService.uncompleteLesson` | `/learn/[slug]` | **FULL** | **PASS** | Hủy đánh dấu hoàn thành bài học | `src/services/progress.service.ts:36` |
| **Progress** | `GET` | `/api/progress/:courseId` | Có | `progressService.getCourseProgress` | `/learn/[slug]`, `/my-courses` | **FULL** | **PASS** | Lấy danh sách hoàn thành, tính % và số bài | `src/services/progress.service.ts:16` |

### 3.11 Nhóm Enrollment (3 endpoints)
| Domain | Method | Endpoint | Backend Exists | Frontend Service | Frontend Screen | Integration Status | Test Status | Missing Work | Evidence |
| :--- | :---: | :--- | :---: | :--- | :--- | :---: | :---: | :--- | :--- |
| **Enrollment** | `GET` | `/api/enrollments/my` | Có | `enrollmentService.getMyEnrollments` | `/my-courses`, `/courses/[slug]`, `/learn/[slug]`, `/` | **FULL** | **PASS** | Lấy danh sách khóa học học viên đã tham gia | `src/services/enrollment.service.ts:13` |
| **Enrollment** | `GET` | `/api/enrollments/course/:id` | Có | Chưa có | Chưa có | **NOT INTEGRATED** | **NOT TESTED** | Giáo viên xem danh sách học viên khóa học | Quyền TEACHER/ADMIN |
| **Enrollment** | `DELETE`| `/api/enrollments/course/:id/:userId`| Có | Chưa có | Chưa có | **NOT INTEGRATED** | **NOT TESTED** | Giáo viên/Admin gỡ học viên | Quyền TEACHER/ADMIN |

### 3.12 Nhóm Comment & Discussion (9 endpoints)
| Domain | Method | Endpoint | Backend Exists | Frontend Service | Frontend Screen | Integration Status | Test Status | Missing Work | Evidence |
| :--- | :---: | :--- | :---: | :--- | :--- | :---: | :---: | :--- | :--- |
| **Comment** | `POST` | `/api/comments/` | Có | `commentService.createComment` | `/learn/[slug]` | **FULL** | **PASS** | Gửi bình luận hỏi đáp trong bài học | `src/services/comment.service.ts:27` |
| **Comment** | `GET` | `/api/comments/lesson/:lessonId`| Có | `commentService.getLessonComments` | `/learn/[slug]` | **FULL** | **PASS** | Lấy cây bình luận theo bài học | `src/services/comment.service.ts:16` |
| **Comment** | `DELETE`| `/api/comments/:id` | Có | Chưa có | Chưa có | **NOT INTEGRATED** | **NOT TESTED** | Học viên tự xóa bình luận của mình | Cần thêm nút Xóa trong Classroom Q&A |
| **Comment** | `PUT` | `/api/comments/:id` | Có | Chưa có | Chưa có | **NOT INTEGRATED** | **NOT TESTED** | Học viên tự sửa bình luận của mình | Cần thêm modal Sửa trong Classroom |
| **Comment** | `POST` | `/api/comments/like/:commentId` | Có | Chưa có | Chưa có | **NOT INTEGRATED** | **NOT TESTED** | Thích bình luận | Cần thêm icon Like trong Classroom |
| **Comment** | `POST` | `/api/comments/dislike/:commentId`| Có | Chưa có | Chưa có | **NOT INTEGRATED** | **NOT TESTED** | Bỏ thích bình luận | Cần thêm icon Dislike trong Classroom |
| **Comment** | `GET` | `/api/comments/` | Có | Chưa có | Chưa có | **NOT INTEGRATED** | **NOT TESTED** | Quản lý bình luận cho giáo viên | Quyền TEACHER/ADMIN |
| **Comment** | `DELETE`| `/api/comments/admin/:id` | Có | Chưa có | Chưa có | **NOT INTEGRATED** | **NOT TESTED** | Admin kiểm duyệt xóa bình luận vi phạm | Quyền ADMIN |
| **Comment** | `DELETE`| `/api/comments/teacher/:id` | Có | Chưa có | Chưa có | **NOT INTEGRATED** | **NOT TESTED** | Giáo viên xóa bình luận trong khóa của mình | Quyền TEACHER |

### 3.13 Nhóm Rating & Review (5 endpoints)
| Domain | Method | Endpoint | Backend Exists | Frontend Service | Frontend Screen | Integration Status | Test Status | Missing Work | Evidence |
| :--- | :---: | :--- | :---: | :--- | :--- | :---: | :---: | :--- | :--- |
| **Rating** | `POST` | `/api/ratings/` | Có | Chưa có | Chưa có | **NOT INTEGRATED** | **NOT TESTED** | Mẫu form học viên gửi đánh giá 1-5 sao và nhận xét | Cần thêm form đánh giá sau khi học |
| **Rating** | `GET` | `/api/ratings/course/:id` | Có | `ratingService.getCourseRatings` | `/courses/[slug]`, `/learn/[slug]` | **FULL** | **PASS** | Lấy danh sách đánh giá công khai & số sao trung bình | `src/services/rating.service.ts:13` |
| **Rating** | `GET` | `/api/ratings/manage/` | Có | Chưa có | Chưa có | **NOT INTEGRATED** | **NOT TESTED** | Giáo viên/Admin kiểm duyệt đánh giá | Quyền TEACHER/ADMIN |
| **Rating** | `DELETE`| `/api/ratings/manage/:id` | Có | Chưa có | Chưa có | **NOT INTEGRATED** | **NOT TESTED** | Xóa đánh giá | Quyền TEACHER/ADMIN |
| **Rating** | `PUT` | `/api/ratings/manage/:id` | Có | Chưa có | Chưa có | **NOT INTEGRATED** | **NOT TESTED** | Ẩn/Hiện đánh giá | Quyền TEACHER/ADMIN |

### 3.14 Nhóm Favorite & Wishlist (3 endpoints)
| Domain | Method | Endpoint | Backend Exists | Frontend Service | Frontend Screen | Integration Status | Test Status | Missing Work | Evidence |
| :--- | :---: | :--- | :---: | :--- | :--- | :---: | :---: | :--- | :--- |
| **Favorite**| `POST` | `/api/favorites/:id` | Có | Chưa có | `/courses/[slug]` | **NOT INTEGRATED** | **NOT TESTED** | Nút tim trong CourseDetail mới đổi state local | `src/app/courses/[slug]/page.tsx:1058` |
| **Favorite**| `DELETE`| `/api/favorites/:id` | Có | Chưa có | `/courses/[slug]` | **NOT INTEGRATED** | **NOT TESTED** | Hủy yêu thích | Chưa gọi API |
| **Favorite**| `GET` | `/api/favorites/` | Có | Chưa có | Chưa có | **NOT INTEGRATED** | **NOT TESTED** | Chưa có trang danh sách khóa học yêu thích | Chưa có route `/favorites` |

### 3.15 Nhóm Notification (2 endpoints)
| Domain | Method | Endpoint | Backend Exists | Frontend Service | Frontend Screen | Integration Status | Test Status | Missing Work | Evidence |
| :--- | :---: | :--- | :---: | :--- | :--- | :---: | :---: | :--- | :--- |
| **Notification** | `GET` | `/api/notifications/` | Có | Chưa có | Header Bell Icon | **NOT INTEGRATED** | **NOT TESTED** | Icon chuông trên Header đang tĩnh, chưa có popover danh sách | `src/components/layout/dashboard-header.tsx:129` |
| **Notification** | `PATCH`| `/api/notifications/read/:id` | Có | Chưa có | Chưa có | **NOT INTEGRATED** | **NOT TESTED** | Đánh dấu đã đọc thông báo | Chưa có gọi API |

### 3.16 Nhóm Quiz, Question & Submissions (11 endpoints)
| Domain | Method | Endpoint | Backend Exists | Frontend Service | Frontend Screen | Integration Status | Test Status | Missing Work | Evidence |
| :--- | :---: | :--- | :---: | :--- | :--- | :---: | :---: | :--- | :--- |
| **Quiz** | `POST` | `/api/quiz/` | Có | Chưa có | Chưa có | **NOT INTEGRATED** | **NOT TESTED** | Giáo viên tạo bài Quiz | Quyền TEACHER/ADMIN |
| **Quiz** | `PUT` | `/api/quiz/:quizId` | Có | Chưa có | Chưa có | **NOT INTEGRATED** | **NOT TESTED** | Cập nhật Quiz | Quyền TEACHER/ADMIN |
| **Quiz** | `DELETE`| `/api/quiz/:quizId` | Có | Chưa có | Chưa có | **NOT INTEGRATED** | **NOT TESTED** | Xóa Quiz | Quyền TEACHER/ADMIN |
| **Quiz** | `GET` | `/api/quiz/lesson/:lessonId` | Có | Chưa có | Chưa có | **NOT INTEGRATED** | **NOT TESTED** | Học viên lấy bài Quiz của bài học | Cần tích hợp vào Classroom tab Quiz |
| **Question**| `POST` | `/api/questions/` | Có | Chưa có | Chưa có | **NOT INTEGRATED** | **NOT TESTED** | Thêm câu hỏi vào Quiz | Quyền TEACHER/ADMIN |
| **Question**| `PUT` | `/api/questions/:questionId` | Có | Chưa có | Chưa có | **NOT INTEGRATED** | **NOT TESTED** | Sửa câu hỏi và đáp án | Quyền TEACHER/ADMIN |
| **Question**| `DELETE`| `/api/questions/:questionId` | Có | Chưa có | Chưa có | **NOT INTEGRATED** | **NOT TESTED** | Xóa câu hỏi | Quyền TEACHER/ADMIN |
| **Submissions** | `POST` | `/api/submissions/` | Có | Chưa có | Chưa có | **NOT INTEGRATED** | **NOT TESTED** | Học viên nộp bài làm và nhận điểm số | Cần giao diện làm bài Quiz trong Classroom |
| **Submissions** | `GET` | `/api/submissions/:quizId` | Có | Chưa có | Chưa có | **NOT INTEGRATED** | **NOT TESTED** | Xem lại lịch sử bài nộp của học viên | Cần màn hình kết quả Quiz |
| **Submissions** | `GET` | `/api/submissions/teacher/:quizId` | Có | Chưa có | Chưa có | **NOT INTEGRATED** | **NOT TESTED** | Giáo viên xem tất cả bài nộp của học viên | Quyền TEACHER/ADMIN |
| **Submissions** | `GET` | `/api/submissions/teacher/analytics/:quizId` | Có | Chưa có | Chưa có | **NOT INTEGRATED** | **NOT TESTED** | Thống kê phân tích tỷ lệ đúng/sai | Quyền TEACHER/ADMIN |

### 3.17 Nhóm Certificate (1 endpoint)
| Domain | Method | Endpoint | Backend Exists | Frontend Service | Frontend Screen | Integration Status | Test Status | Missing Work | Evidence |
| :--- | :---: | :--- | :---: | :--- | :--- | :---: | :---: | :--- | :--- |
| **Certificate** | `POST` | `/api/certificates/` | Có | Chưa có | `/certificates` | **NOT INTEGRATED** | **NOT TESTED** | Trang `/certificates` đang dùng `mockCertificatesData` hoàn toàn | `src/app/certificates/page.tsx:9` |

### 3.18 Nhóm Chat & Realtime Messaging (3 endpoints)
| Domain | Method | Endpoint | Backend Exists | Frontend Service | Frontend Screen | Integration Status | Test Status | Missing Work | Evidence |
| :--- | :---: | :--- | :---: | :--- | :--- | :---: | :---: | :--- | :--- |
| **Conversation**| `POST` | `/api/conversations/` | Có | Chưa có | `/messages` | **NOT INTEGRATED** | **NOT TESTED** | Tạo phòng chat riêng / nhóm | Trang `/messages` dùng `mockMessagesData` |
| **Conversation**| `GET` | `/api/conversations/` | Có | Chưa có | `/messages` | **NOT INTEGRATED** | **NOT TESTED** | Lấy danh sách các cuộc trò chuyện | Trang `/messages` dùng `mockMessagesData` |
| **Message** | `GET` | `/api/messages/:conversationId`| Có | Chưa có | `/messages` | **NOT INTEGRATED** | **NOT TESTED** | Lấy lịch sử tin nhắn cuộc trò chuyện | Trang `/messages` dùng `mockMessagesData` |

### 3.19 Nhóm Teacher Analytics & KPI (6 endpoints)
| Domain | Method | Endpoint | Backend Exists | Frontend Service | Frontend Screen | Integration Status | Test Status | Missing Work | Evidence |
| :--- | :---: | :--- | :---: | :--- | :--- | :---: | :---: | :--- | :--- |
| **Statistics** | `GET` | `/api/teacher/statistics/overview` | Có | Chưa có | Chưa có | **NOT INTEGRATED** | **NOT TESTED** | KPI doanh thu, số học viên giảng viên | Quyền TEACHER |
| **Statistics** | `GET` | `/api/teacher/statistics/revenue` | Có | Chưa có | Chưa có | **NOT INTEGRATED** | **NOT TESTED** | Biểu đồ doanh thu theo chu kỳ | Quyền TEACHER |
| **Statistics** | `GET` | `/api/teacher/statistics/courses` | Có | Chưa có | Chưa có | **NOT INTEGRATED** | **NOT TESTED** | Bảng xếp hạng khóa học bán chạy | Quyền TEACHER |
| **Statistics** | `GET` | `/api/teacher/statistics/enrollments`| Có | Chưa có | Chưa có | **NOT INTEGRATED** | **NOT TESTED** | Phân tích tăng trưởng học viên | Quyền TEACHER |
| **Statistics** | `GET` | `/api/teacher/statistics/learning` | Có | Chưa có | Chưa có | **NOT INTEGRATED** | **NOT TESTED** | Tỷ lệ hoàn thành & nhận chứng chỉ | Quyền TEACHER |
| **Performance** | `GET` | `/api/teacher/statistics/course-performance/:courseId` | Có | Chưa có | Chưa có | **NOT INTEGRATED** | **NOT TESTED** | Phễu drop-off bài học | Quyền TEACHER |

### 3.20 Nhóm Gamification & Leaderboard (6 endpoints)
| Domain | Method | Endpoint | Backend Exists | Frontend Service | Frontend Screen | Integration Status | Test Status | Missing Work | Evidence |
| :--- | :---: | :--- | :---: | :--- | :--- | :---: | :---: | :--- | :--- |
| **Gamification** | `GET` | `/api/leaderboard` | Có | Chưa có | `/leaderboard` | **NOT INTEGRATED** | **NOT TESTED** | Trang `/leaderboard` đang dùng `mockLeaderboardData` | `src/app/leaderboard/page.tsx:9` |
| **Gamification** | `GET` | `/api/leaderboard/me` | Có | Chưa có | `/leaderboard` | **NOT INTEGRATED** | **NOT TESTED** | Vị trí xếp hạng cá nhân | Chưa có service & screen |
| **Gamification** | `GET` | `/api/users/me/leaderboard-position` | Có | Chưa có | Header, Profile | **NOT INTEGRATED** | **NOT TESTED** | Rank badge trên header & profile | Chưa có service & screen |
| **Gamification** | `GET` | `/api/users/me/xp-summary` | Có | Chưa có | Header, Profile, Home | **NOT INTEGRATED** | **NOT TESTED** | Tổng XP & thanh cấp bậc | Đang dùng mock |
| **Gamification** | `GET` | `/api/users/me/streak` | Có | Chưa có | Header, Home | **NOT INTEGRATED** | **NOT TESTED** | Icon ngọn lửa streak trên header | Đang dùng mock |
| **Gamification** | `GET` | `/api/users/me/xp-history` | Có | Chưa có | Profile / History | **NOT INTEGRATED** | **NOT TESTED** | Lịch sử cộng điểm XP | Chưa có service & screen |

---

## 4. Socket.IO Coverage

Backend TMdemy hỗ trợ đầy đủ WebSocket qua **Socket.IO** (chạy tại port `3002`), yêu cầu xác thực JWT Bearer Handshake.

### 4.1 Danh mục Socket.IO Events theo Contract (`api/MESSAGE_API.md`)
1. **Connection Auth**: `io("http://localhost:3002", { auth: { token } })`
2. **Client -> Server Events**:
   - `join`: Tham gia phòng trò chuyện `conversationId`.
   - `sendMessage`: Gửi tin nhắn mới (text, image, file).
   - `editMessage`: Sửa nội dung tin nhắn.
   - `deleteMessage`: Xóa tin nhắn.
   - `typing` / `stopTyping`: Bắn tín hiệu đang gõ.
3. **Server -> Client Events**:
   - `receiveMessage`: Nhận tin nhắn mới tức thì.
   - `messageEdited`: Cập nhật nội dung tin nhắn đã sửa.
   - `messageDeleted`: Xóa tin nhắn khỏi luồng hiển thị.
   - `userTyping` / `userStopTyping`: Hiển thị animation người khác đang gõ.

### 4.2 Hiện trạng Frontend
- **Package Socket.IO**: **Chưa được cài đặt** trong `package.json` (thiếu `socket.io-client`).
- **Socket Client Provider**: Chưa được khởi tạo trong Frontend codebase.
- **Trang Tin nhắn (`/messages`)**: Hiện sử dụng 100% dữ liệu giả lập từ `src/data/mock-messages.ts`.
- **Tỷ lệ tích hợp Socket.IO**: **0% (NOT INTEGRATED)**.

---

## 5. Frontend Screen Coverage & Phân Tích Thực Tế

| Route / Screen | File Path | Mục đích | Nguồn dữ liệu hiện tại | Trạng thái tích hợp |
| :--- | :--- | :--- | :--- | :---: |
| `/` | `src/app/page.tsx` | Trang chủ TMdemy | Kết hợp: Real API (`/api/enrollments/my`) + Mock (`mockDashboardData`) | **PARTIAL** |
| `/courses` | `src/app/courses/page.tsx` | Khám phá khóa học | 100% Real API (`/api/courses/`, `/api/categories/`) | **FULL** |
| `/courses/[slug]` | `src/app/courses/[slug]/page.tsx` | Chi tiết khóa học | 100% Real API (`/api/courses/:slug`, `/api/ratings/course/:id`, `/api/enrollments/my`) | **FULL** |
| `/learn/[slug]` | `src/app/learn/[slug]/page.tsx` | Lớp học Classroom | 100% Real API (`/api/courses/:slug`, `/api/lessons/...`, `/api/progress/...`, `/api/comments/...`, `/api/ratings/...`) | **FULL** |
| `/my-courses` | `src/app/my-courses/page.tsx` | Khóa học của tôi | 100% Real API (`/api/enrollments/my`, `/api/progress/:courseId`) | **FULL** |
| `/(auth)/login` | `src/app/(auth)/login/page.tsx` | Đăng nhập | 100% Real API (`/api/users/login`) | **FULL** |
| `/(auth)/register` | `src/app/(auth)/register/page.tsx` | Đăng ký | 100% Real API (`/api/users/register`) | **FULL** |
| `/(auth)/verify-otp`| `src/app/(auth)/verify-otp/page.tsx` | Xác thực OTP | 100% Real API (`/api/users/verify-otp`) | **FULL** |
| `/(auth)/forgot-password`| `src/app/(auth)/forgot-password/page.tsx` | Quên mật khẩu | 100% Real API (`/api/users/forgot-password`) | **FULL** |
| `/(auth)/reset-password` | `src/app/(auth)/reset-password/page.tsx` | Đặt lại mật khẩu | 100% Real API (`/api/users/reset-password`) | **FULL** |
| `/dashboard` | `src/app/dashboard/page.tsx` | Bảng điều khiển cũ | Redirect vĩnh viễn sang `/` | **REDIRECT** |
| `/profile` | `src/app/profile/page.tsx` | Hồ sơ cá nhân | Kết hợp: User từ `useAuth` + Mock (`mockUserProfileData`) | **PARTIAL** |
| `/settings` | `src/app/settings/page.tsx` | Cài đặt tài khoản | Kết hợp: User từ `useAuth` + Mock (`mockUserSettingsData`) | **PARTIAL** |
| `/certificates` | `src/app/certificates/page.tsx` | Chứng chỉ số | 100% Mock (`mockCertificatesData`) | **NOT INTEGRATED** |
| `/leaderboard` | `src/app/leaderboard/page.tsx` | Bảng xếp hạng | 100% Mock (`mockLeaderboardData`) | **NOT INTEGRATED** |
| `/messages` | `src/app/messages/page.tsx` | Tin nhắn trao đổi | 100% Mock (`mockMessagesData`) | **NOT INTEGRATED** |
| `/roadmap` | `src/app/roadmap/page.tsx` | Lộ trình học tập | 100% Mock (`mockRoadmapData`) — *Backend chưa có API lộ trình* | **NOT INTEGRATED** |
| `/checkout` | *Chưa có route* | Thanh toán đơn hàng | Nút mua trong CourseDetail đang dẫn tới đường dẫn chưa tồn tại | **MISSING** |
| `/teacher/*` | *Chưa có route* | Studio Giảng viên | Chưa có màn hình quản trị khóa học, bài giảng cho giáo viên | **MISSING** |
| `/admin/*` | *Chưa có route* | Portal Quản trị | Chưa có màn hình quản trị toàn hệ thống | **MISSING** |

---

## 6. Các Chức Năng Đã Hoàn Thành (FULL)

1. **Hệ thống Xác thực (Authentication System)**:
   - Đăng ký tài khoản học viên mới kèm xác thực OTP qua Email.
   - Đăng nhập JWT Dual-Token (Access Token trong bộ nhớ, Refresh Token trong cookie/storage).
   - Silent Refresh Token tự động thông qua Interceptor khi gặp 401.
   - Đăng xuất an toàn và thu hồi Refresh Token trên DB.
   - Luồng Quên mật khẩu và Đặt lại mật khẩu qua email token.
2. **Khám phá Khóa học (Course Catalog)**:
   - Danh sách khóa học công khai đã duyệt (`GET /api/courses/`).
   - Lọc theo danh mục động (`GET /api/categories/`), trình độ (Level), hình thức (Type), khoảng giá (Price range).
   - Tìm kiếm từ khóa và sắp xếp (mới nhất, phổ biến, giá tăng/giảm).
   - Chuyển đổi hiển thị Lưới (Grid) và Danh sách (List).
3. **Chi tiết Khóa học (Course Detail)**:
   - Đọc thông tin khóa học theo slug (`GET /api/courses/:slug`).
   - Danh sách chương học và bài học xem trước.
   - Đánh giá học viên và phân bổ số sao (`GET /api/ratings/course/:id`).
   - Nhận diện trạng thái đã ghi danh (`GET /api/enrollments/my`) để đổi nút CTA thành *"Vào học ngay"*.
4. **Lớp học Trực tuyến (Classroom)**:
   - Tải danh mục bài học theo chương (`GET /api/lessons/chapter/:chapterId`).
   - Phát video YouTube embed hoặc HTML5 direct video.
   - Đánh dấu hoàn thành / hủy hoàn thành bài học tự tính % tiến độ (`POST /api/progress/complete`, `/uncomplete`).
   - Bình luận hỏi đáp theo bài học (`GET /api/comments/lesson/:lessonId`, `POST /api/comments/`).
   - Điều hướng Back/Forward và direct refresh không bị lỗi kết nối giả.
5. **Khóa học của tôi (My Courses)**:
   - Lấy danh sách khóa học thực tế của người dùng (`GET /api/enrollments/my`).
   - Lấy tiến độ chi tiết từng khóa học (`GET /api/progress/:courseId`) hiển thị số bài `X/Y` và % tiến độ chuẩn xác.
   - Lọc theo trạng thái Đang học, Hoàn thành, Chưa bắt đầu.

---

## 7. Các Chức Năng Tích Hợp Một Phần (PARTIAL)

1. **Trang Chủ (`/`)**:
   - Phần *"Khóa học đang học"* lấy từ API thật `enrollments/my`.
   - Tuy nhiên danh sách khóa học thịnh hành, khóa học gợi ý và các banner thành tích vẫn lấy từ `mockDashboardData`.
2. **Trang Hồ Sơ Cá Nhân (`/profile`)**:
   - Hiển thị tên, email, avatar của user từ AuthContext (`/api/users/me`).
   - Tuy nhiên, modal chỉnh sửa hồ sơ chỉ lưu vào local state, chưa gọi `PUT /api/users/update-me`. Thống kê khóa học và chứng chỉ ở đây vẫn là mock data.
3. **Trang Cài Đặt (`/settings`)**:
   - Hiển thị thông tin tài khoản hiện tại từ AuthContext.
   - Form đổi mật khẩu (`PUT /api/users/change-password`) và cập nhật số điện thoại/ngôn ngữ chỉ hiện toast giả lập, chưa gửi request tới backend.

---

## 8. Các Chức Năng Chưa Tích Hợp (NOT INTEGRATED)

1. **Thương Mại & Mua Khóa Học (Commerce & Orders)**:
   - Chưa có API tạo đơn hàng `POST /api/orders/`, kiểm tra coupon `POST /api/coupons/use`.
   - Nút *"Mua khóa học ngay"* tại trang Course Detail đang liên kết tới `/checkout?course=slug` nhưng trang `/checkout` chưa được xây dựng.
   - Không có màn hình lịch sử giao dịch `GET /api/orders/my`.
2. **Hệ Thống Trắc Nghiệm (Quizzes & Examination)**:
   - 11 endpoints liên quan đến Quiz, Question và Submissions hoàn toàn chưa được chạm tới.
   - Màn hình Classroom chưa có tab làm bài trắc nghiệm để học viên kiểm tra kiến thức sau bài giảng.
3. **Hệ Thống Đánh Giá Sao Sau Khi Học (Student Ratings Submission)**:
   - Mới chỉ có API đọc đánh giá công khai (`GET /api/ratings/course/:id`).
   - Chưa có form cho phép học viên đã ghi danh gửi đánh giá sao và nhận xét (`POST /api/ratings/`).
4. **Hệ Thống Yêu Thích (Favorites / Wishlist)**:
   - Nút bấm trái tim tại Course Detail chỉ đổi màu bằng state local, chưa gọi `POST /api/favorites/:id` hoặc `DELETE /api/favorites/:id`.
5. **Chứng Chỉ Tốt Nghiệp (Certificates)**:
   - Trang `/certificates` hoàn toàn dựa trên mock data.
   - Chưa tích hợp endpoint cấp chứng chỉ `POST /api/certificates/` khi hoàn thành 100% khóa học.
6. **Bảng Xếp Hạng & Gamification**:
   - 6 endpoints gamification (`/api/leaderboard`, `/api/users/me/streak`, `/api/users/me/xp-summary`,...) chưa được tích hợp.
   - Trang `/leaderboard` hiện chỉ hiển thị bảng xếp hạng tĩnh từ `mock-leaderboard.ts`.
7. **Tin Nhắn Trực Tuyến & Socket.IO**:
   - 3 REST endpoints (`conversations`, `messages`) và toàn bộ sự kiện Socket.IO chưa được tích hợp.
8. **Thông Báo (Notifications)**:
   - Chưa có popover hiển thị danh sách thông báo thực tế từ `GET /api/notifications/` và đánh dấu đã đọc `PATCH /api/notifications/read/:id`.
9. **Hệ Thống Giảng Viên & Quản Trị Viên (Teacher & Admin Portals)**:
   - Toàn bộ 23 endpoints quản trị và thống kê dành cho Teacher và Admin chưa có giao diện trên Frontend.

---

## 9. Các Chức Năng Có Lỗi Hoặc Nguy Cơ Tiềm Ẩn

1. **Dead Link `/checkout` tại Course Detail**:
   - Khi học viên chưa ghi danh bấm *"Mua khóa học ngay"*, trình duyệt chuyển hướng đến `/checkout?course=...` dẫn đến màn hình 404 (Not Found).
2. **Giả Lập Cập Nhật Profile & Đổi Mật Khẩu**:
   - Người dùng bấm lưu thông tin trong `/profile` hoặc đổi mật khẩu trong `/settings` nhận được thông báo *"Thành công"* nhưng dữ liệu không được lưu vào backend. Khi F5 thì dữ liệu quay về như cũ.
3. **Mã Giảm Giá & Nút Giỏ Hàng Chưa Có Action**:
   - Nút *"Thêm vào giỏ hàng"* tại Course Detail không có sự kiện click.
4. **Khóa Học Chưa Có Bài Giảng**:
   - Đã được xử lý an toàn tại F6.5 với fallback *"Khóa học đang cập nhật bài giảng"*, không gây lỗi crash app.

---

## 10. Backend Gaps

1. **Thiếu Endpoint Roadmap**:
   - Frontend có màn hình `/roadmap`, tuy nhiên backend hiện tại chưa có bộ controller/service nào cung cấp dữ liệu roadmap cá nhân hóa. (Cần kiến trúc thêm hoặc duy trì như một AI feature tổng hợp).
2. **Author Detail trong Enrolled Courses (`GET /api/enrollments/my`)**:
   - Object `course` trả về từ `GET /api/enrollments/my` chỉ gồm `{ id, title, slug, image, price }`, thiếu thông tin tác giả/giảng viên khiến card tại My Courses phải dùng nhãn mặc định *"Giảng viên TMdemy"*.
3. **Enrollment Endpoint Naming**:
   - User Request nhắc đến `/api/enrollments/my-enrollments`, nhưng backend thực tế là `/api/enrollments/my`. Frontend đã điều chỉnh khớp với backend.

---

## 11. Frontend Gaps

1. **Thiếu Route Thương Mại Lõi**:
   - Thiếu route `/checkout`: Thanh toán khóa học (miễn phí hoặc trả phí) để tạo bản ghi Enrollment.
   - Thiếu route `/orders`: Xem lại lịch sử thanh toán.
2. **Thiếu Route Teacher Studio & Admin Portal**:
   - Không có phân vùng `/teacher` và `/admin` cùng Role-based route guard.
3. **Thiếu Thư Viện Realtime**:
   - Chưa cài đặt package `socket.io-client` để kết nối WebSocket với backend.

---

## 12. Những Vấn Đề Cần Kiểm Thử Lại (Regression Checklist)

Khi triển khai các phase tiếp theo, cần duy trì kiểm thử hồi quy cho các luồng đã PASS:
- [x] Dual-Token Refresh trong `apiClient` khi access token hết hạn giữa chừng.
- [x] Chuyển trang từ My Courses sang Classroom không bị abort request thành lỗi kết nối giả.
- [x] Đánh dấu hoàn thành bài học và tính lại % tiến độ tự động.
- [x] Header User Dropdown tương tác chạm ngoài (outside click) và phím Escape.

---

## 13. Đề Xuất Thứ Tự Triển Khai Tiếp Theo (Roadmap Đề Xuất)

Dựa trên kết quả kiểm toán thực tế, thứ tự ưu tiên được xây dựng dựa trên **tính toàn vẹn của hành trình người dùng (User Journey Completeness)**: Từ việc tìm khóa học -> Mua/Ghi danh -> Học tập -> Đánh giá & Chứng chỉ -> Tương tác xã hội & Quản trị.

| Phase đề xuất | Chức năng | Lý do ưu tiên | Dependencies | Estimated Complexity |
| :--- | :--- | :--- | :--- | :---: |
| **Phase F7.1** | **Commerce, Checkout & Order Flow** | **Tối quan trọng**: Hiện tại học viên không thể mua hoặc ghi danh khóa học mới từ Course Detail (nút Checkout đang 404). Hoàn thiện luồng này sẽ khép kín phễu người dùng từ xem khóa học đến có khóa học trong My Courses. | Course Detail, AuthContext, Order API (`/api/orders`), Coupon API (`/api/coupons/use`) | **Cao (High)** |
| **Phase F7.2** | **User Profile, Settings & Password Management** | Sửa triệt để các form giả lập trong `/profile` và `/settings`, kết nối API thật `update-me`, `change-password` và danh sách yêu thích `favorites`. | AuthContext, User API (`/api/users`), Favorite API | **Trung bình (Medium)** |
| **Phase F7.3** | **Interactive Quiz & Examination in Classroom** | Bổ sung bài tập trắc nghiệm và nộp bài chấm điểm vào Classroom giúp hoàn thiện trải nghiệm học tập thực tế. | Classroom, Quiz API (`/api/quiz`), Question API, Submissions API | **Cao (High)** |
| **Phase F7.4** | **Student Rating Submission & Real Certificates** | Cho phép học viên đánh giá sao khóa học sau khi học và cấp chứng chỉ thật từ API (`/api/certificates`) khi hoàn thành 100%. | Classroom, My Courses, Rating API (`/api/ratings`), Certificate API | **Trung bình (Medium)** |
| **Phase F7.5** | **Gamification & Notifications Integration** | Kết nối bảng xếp hạng `/leaderboard` thật, hiển thị điểm XP, chuỗi Streak và thông báo tức thì trên Header. | Header, Leaderboard API, Notification API | **Trung bình (Medium)** |
| **Phase F7.6** | **Realtime Socket.IO Chat & Messaging** | Cài đặt `socket.io-client`, kết nối phòng chat `/messages`, tin nhắn trực tiếp giữa học viên và giảng viên. | Socket.IO Server, Conversation API, Message API | **Rất cao (Very High)** |
| **Phase F7.7** | **Teacher Studio (Course & Curriculum Management)** | Xây dựng giao diện cho giảng viên: Tạo/sửa khóa học, chương, bài giảng, quản lý học viên và xem thống kê doanh thu. | Role Guards, Teacher API, Chapter/Lesson API, Statistics API | **Rất cao (Very High)** |
| **Phase F7.8** | **Admin Portal (System & Content Moderation)** | Xây dựng cổng quản trị Admin: Quản lý người dùng, duyệt khóa học, duyệt bình luận và danh mục. | Role Guards, Admin API | **Rất cao (Very High)** |

---

## 14. Kết luận

Báo cáo kiểm toán Phase F6.6 đã làm rõ toàn diện hiện trạng của 102 REST Endpoints, hệ thống Socket.IO và toàn bộ App Router screens trong TMdemy Frontend.

- **Frontend Core Learning Flow (Student Experience)** đã đạt độ hoàn thiện cao, hoạt động ổn định trên dữ liệu thật.
- **Khu vực nghẽn lớn nhất hiện tại**: Thiếu màn hình Checkout/Order để người dùng thực hiện ghi danh khóa học mới, và các form hồ sơ cá nhân còn dùng state giả lập.

> **Trạng thái**: Đã hoàn thành báo cáo kiểm toán. **DỪNG LẠI VÀ CHỜ PHÊ DUYỆT THEO QUY TẮC.**
