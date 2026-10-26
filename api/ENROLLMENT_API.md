# TMDEMY — ENROLLMENT MANAGEMENT API (ENROLLMENT_API.MD)

Tài liệu đặc tả các API quản lý Ghi danh học tập (`Enrollment`) của học viên và quản trị học viên của Giảng viên.

Base URL: `{{BASE_URL}}` (Mặc định: `http://localhost:3002`)

---

## 1. GET /api/enrollments/my

### Method & Endpoint
* **Method**: `GET`
* **Endpoint**: `/api/enrollments/my`
* **Purpose**: Học viên lấy danh sách toàn bộ các khóa học mà mình đã ghi danh học tập (kèm tiến độ `progress` % và trạng thái `status`: ACTIVE/COMPLETED/CANCELED).
* **Authentication**: `Bearer JWT required`
* **Roles**: All (`USER`, `TEACHER`, `ADMIN`)

### Success Response
* **HTTP Status**: `200 OK`
* **JSON Schema**:
  ```json
  {
    "success": true,
    "message": "Fetched enrolled courses successfully",
    "data": [
      {
        "id": "enrollment-uuid-1",
        "_id": "enrollment-uuid-1",
        "userId": "user-uuid",
        "courseId": "course-uuid",
        "progress": 45,
        "status": "ACTIVE",
        "completedAt": null,
        "createdAt": "2026-02-15T08:00:00.000Z",
        "course": {
          "id": "course-uuid",
          "_id": "course-uuid",
          "title": "Fullstack Next.js 15 & Node.js Architecture",
          "slug": "fullstack-nextjs-15-nodejs-architecture",
          "image": "https://res.cloudinary.com/tmdemy/course.png",
          "price": 699000
        }
      }
    ]
  }
  ```

### Raw HTTP Request
```http
GET {{BASE_URL}}/api/enrollments/my
Authorization: Bearer <ACCESS_TOKEN>
```

---

## 2. GET /api/enrollments/course/:id

### Method & Endpoint
* **Method**: `GET`
* **Endpoint**: `/api/enrollments/course/:id`
* **Purpose**: Giảng viên (`TEACHER`) hoặc Quản trị viên (`ADMIN`) xem danh sách học viên đang ghi danh trong một khóa học cụ thể.
* **Authentication**: `Bearer JWT required`
* **Roles**: `TEACHER`, `ADMIN`

### Path Parameters
| Parameter | Type | Required | Description |
| :--- | :---: | :---: | :--- |
| `id` | UUID | Yes | Mã khóa học (`courseId`) |

### Query Parameters
| Parameter | Type | Required | Default | Description |
| :--- | :---: | :---: | :---: | :--- |
| `page` | number | No | `1` | Số trang |
| `limit` | number | No | `10` | Số lượng học viên mỗi trang |
| `search` | string | No | `undefined` | Tìm kiếm theo tên hoặc email học viên |

### Ownership Rules
* Nếu người gọi là `TEACHER`: khóa học `id` **bắt buộc phải do giảng viên đó tạo** (`course.authorId === req.user.userId`). Nếu không -> trả `403 Forbidden` ("You are not the owner of this course").

### Success Response
* **HTTP Status**: `200 OK`
* **JSON Schema**:
  ```json
  {
    "success": true,
    "message": "Fetched enrolled students successfully!",
    "data": {
      "students": [
        {
          "id": "enrollment-uuid-1",
          "_id": "enrollment-uuid-1",
          "userId": "user-uuid-1",
          "courseId": "course-uuid",
          "progress": 80,
          "status": "ACTIVE",
          "user": {
            "id": "user-uuid-1",
            "_id": "user-uuid-1",
            "username": "minh_student",
            "email": "student@example.com",
            "avatar": ""
          },
          "createdAt": "2026-02-15T08:00:00.000Z"
        }
      ],
      "pagination": { "page": 1, "limit": 10, "total": 25, "totalPages": 3 }
    }
  }
  ```

### Raw HTTP Request
```http
GET {{BASE_URL}}/api/enrollments/course/course-uuid-here?page=1&limit=10
Authorization: Bearer <TEACHER_ACCESS_TOKEN>
```

---

## 3. DELETE /api/enrollments/course/:id/:userId

### Method & Endpoint
* **Method**: `DELETE`
* **Endpoint**: `/api/enrollments/course/:id/:userId`
* **Purpose**: Giảng viên hoặc Admin gỡ bỏ (kick) một học viên khỏi khóa học.
* **Authentication**: `Bearer JWT required`
* **Roles**: `TEACHER`, `ADMIN`

### Path Parameters
| Parameter | Type | Required | Description |
| :--- | :---: | :---: | :--- |
| `id` | UUID | Yes | Mã khóa học (`courseId`) |
| `userId` | UUID | Yes | Mã học viên cần xóa (`targetUserId`) |

### Business Rules (Atomic Execution)
Hệ thống thực hiện giao dịch nguyên tử (`prisma.$transaction`):
1. Xóa bản ghi `Enrollment` của học viên khỏi khóa học.
2. Giảm số lượng đã bán của khóa học `sold = max(0, sold - 1)`.
3. Xóa các bản ghi `Order` liên quan giữa học viên và khóa học này.

### Success Response
* **HTTP Status**: `200 OK`
* **JSON Schema**:
  ```json
  {
    "success": true,
    "message": "Student has been removed from the course successfully!"
  }
  ```

### Raw HTTP Request
```http
DELETE {{BASE_URL}}/api/enrollments/course/course-uuid-here/student-uuid-here
Authorization: Bearer <TEACHER_ACCESS_TOKEN>
```

---

## 4. GET /api/enrollments/course/:courseId/students/:userId/progress

### Method & Endpoint
* **Method**: `GET`
* **Endpoint**: `/api/enrollments/course/:courseId/students/:userId/progress`
* **Purpose**: Giảng viên (`TEACHER`) hoặc Quản trị viên (`ADMIN`) xem chi tiết tiến độ học tập của từng học viên cụ thể trong khóa học (bao gồm danh sách bài học đã hoàn thành và lịch sử làm bài kiểm tra quiz).
* **Authentication**: `Bearer JWT required`
* **Roles**: `TEACHER`, `ADMIN`

### Path Parameters
| Parameter | Type | Required | Description |
| :--- | :---: | :---: | :--- |
| `courseId` | UUID | Yes | Mã khóa học |
| `userId` | UUID | Yes | Mã học viên |

### Ownership & Authorization Rules
* Nếu là `TEACHER`: Khóa học `courseId` bắt buộc do giảng viên đó sở hữu (`course.authorId === req.user.userId`). Nếu không -> trả `403 Forbidden` ("You are not the owner of this course").
* Nếu học viên chưa ghi danh khóa học -> trả `404 Not Found`.

### Success Response
* **HTTP Status**: `200 OK`
* **JSON Schema**:
  ```json
  {
    "success": true,
    "message": "Fetched student learning progress successfully",
    "data": {
      "enrollment": {
        "id": "enrollment-uuid",
        "_id": "enrollment-uuid",
        "userId": "student-uuid",
        "courseId": "course-uuid",
        "progress": 100,
        "status": "COMPLETED",
        "enrolledAt": "2026-07-02T12:00:00.000Z",
        "completedAt": "2026-10-04T12:00:00.000Z"
      },
      "completedLessons": [
        {
          "id": "lesson-uuid",
          "_id": "lesson-uuid",
          "lessonId": "lesson-uuid",
          "title": "Bài 1: Khái niệm & Ứng dụng thực tiễn",
          "completed": true,
          "completedAt": "2026-08-20T12:09:00.000Z"
        }
      ],
      "quizSubmissions": [
        {
          "id": "sub-uuid",
          "_id": "sub-uuid",
          "quizId": "quiz-uuid",
          "quizTitle": "Quiz kiểm tra kiến thức",
          "score": 10,
          "maxScore": 10,
          "passed": true,
          "submittedAt": "2026-10-07T13:00:00.000Z"
        }
      ]
    }
  }
  ```

---

## 5. GET /api/enrollments/:enrollmentId/progress

### Method & Endpoint
* **Method**: `GET`
* **Endpoint**: `/api/enrollments/:enrollmentId/progress`
* **Purpose**: Xem chi tiết tiến độ học tập thông qua mã ghi danh `enrollmentId`.
* **Authentication**: `Bearer JWT required`
* **Roles**: `TEACHER`, `ADMIN`

