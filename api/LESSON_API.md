# TMDEMY — LESSON MANAGEMENT API (LESSON_API.MD)

Tài liệu đặc tả các API quản lý Bài học (`Lesson`) trong hệ thống.

Base URL: `{{BASE_URL}}` (Mặc định: `http://localhost:3002`)

---

## 1. POST /api/lessons/

### Method & Endpoint
* **Method**: `POST`
* **Endpoint**: `/api/lessons/`
* **Purpose**: Tạo bài học mới (Video hoặc Text) nằm trong một Chương học (`Chapter`) của một Khóa học (`Course`).
* **Authentication**: `Bearer JWT required`
* **Roles**: `TEACHER`, `ADMIN`

### Request Body
```json
{
  "title": "Bài 2.1: Phân tích kiến trúc Functional Repository",
  "chapter": "chapter-uuid-v4",
  "course": "course-uuid-v4",
  "type": "video",
  "duration": 720,
  "videoUrl": "https://res.cloudinary.com/tmdemy/video/upload/v1/lesson1.mp4",
  "content": "Nội dung tóm tắt bài học và tài liệu đính kèm",
  "isDemo": false
}
```

### Validation Rules
* `title`: Bắt buộc, tối thiểu 5 ký tự.
* `chapter`: Bắt buộc, UUID hợp lệ.
* `course`: Bắt buộc, UUID hợp lệ.
* `type`: Tùy chọn, một trong `video`, `text` (mặc định: `video`).
* `duration`: Tùy chọn, số giây >= 0.
* `videoUrl`: Tùy chọn, URL hợp lệ.
* `isDemo`: Tùy chọn, boolean (`true` nếu cho phép học thử miễn phí).

### Business & Integrity Rules
* **Cross-Entity Integrity Check**: Backend kiểm tra Chương học `chapter` **bắt buộc phải thuộc về Khóa học `course`** (`chapterDoc.courseId === course`). Nếu sai trả `400 Bad Request` ("Chapter does not belong to the specified course").
* **Ownership Check**: Giảng viên (`TEACHER`) phải là tác giả của khóa học (`courseDoc.authorId === req.user.userId`). Nếu không trả `403 Forbidden`.
* **Thứ tự tự động**: Nếu không chỉ định `order`, backend tự động tính `max(order) + 1` của các bài học trong cùng một chương.
* **Thông báo cho học viên**: Sau khi tạo bài học mới, hệ thống tự động gửi Notification đến toàn bộ học viên đang ghi danh (`ACTIVE`) trong khóa học để báo có bài học mới.

### Success Response
* **HTTP Status**: `201 Created`
* **JSON Schema**:
  ```json
  {
    "success": true,
    "message": "Lesson created successfully",
    "data": {
      "id": "lesson-uuid-1",
      "_id": "lesson-uuid-1",
      "title": "Bài 2.1: Phân tích kiến trúc Functional Repository",
      "slug": "bai-21-phan-tich-kien-truc-functional-repository",
      "chapter": "chapter-uuid-v4",
      "course": "course-uuid-v4",
      "author": "teacher-uuid-v4",
      "type": "video",
      "duration": 720,
      "videoUrl": "https://res.cloudinary.com/tmdemy/video/upload/v1/lesson1.mp4",
      "content": "Nội dung tóm tắt bài học",
      "isDemo": false,
      "order": 1,
      "createdAt": "2026-03-01T10:00:00.000Z",
      "updatedAt": "2026-03-01T10:00:00.000Z"
    }
  }
  ```

### Raw HTTP Request
```http
POST {{BASE_URL}}/api/lessons/
Authorization: Bearer <TEACHER_ACCESS_TOKEN>
Content-Type: application/json

{
  "title": "Bài 2.1: Phân tích kiến trúc Functional Repository",
  "chapter": "chapter-uuid-v4",
  "course": "course-uuid-v4",
  "type": "video",
  "duration": 720,
  "videoUrl": "https://res.cloudinary.com/tmdemy/video/upload/v1/lesson1.mp4"
}
```

---

## 2. PUT /api/lessons/:id

### Method & Endpoint
* **Method**: `PUT`
* **Endpoint**: `/api/lessons/:id`
* **Purpose**: Cập nhật thông tin bài học (tiêu đề, thời lượng, videoUrl, nội dung, cờ học thử `isDemo`).
* **Authentication**: `Bearer JWT required`
* **Roles**: `TEACHER`, `ADMIN`

### Path Parameters
| Parameter | Type | Required | Description |
| :--- | :---: | :---: | :--- |
| `id` | UUID | Yes | Mã bài học cần sửa |

### Request Body
```json
{
  "title": "Bài 2.1: Phân tích kiến trúc Functional Repository (Cập nhật)",
  "duration": 850,
  "isDemo": true
}
```

### Success Response
* **HTTP Status**: `200 OK`
* **JSON Schema**: Trả về dữ liệu bài học đã cập nhật kèm `chapter`, `course`, `author`.

### Raw HTTP Request
```http
PUT {{BASE_URL}}/api/lessons/lesson-uuid-1
Authorization: Bearer <TEACHER_ACCESS_TOKEN>
Content-Type: application/json

{
  "title": "Bài 2.1: Phân tích kiến trúc Functional Repository (Cập nhật)",
  "isDemo": true
}
```

---

## 3. DELETE /api/lessons/:id

### Method & Endpoint
* **Method**: `DELETE`
* **Endpoint**: `/api/lessons/:id`
* **Purpose**: Xóa vĩnh viễn bài học khỏi chương học.
* **Authentication**: `Bearer JWT required`
* **Roles**: `TEACHER`, `ADMIN`

### Path Parameters
| Parameter | Type | Required | Description |
| :--- | :---: | :---: | :--- |
| `id` | UUID | Yes | Mã bài học cần xóa |

### Success Response
* **HTTP Status**: `200 OK`
* **JSON Schema**:
  ```json
  {
    "success": true,
    "message": "Lesson deleted successfully"
  }
  ```

### Raw HTTP Request
```http
DELETE {{BASE_URL}}/api/lessons/lesson-uuid-1
Authorization: Bearer <TEACHER_ACCESS_TOKEN>
```

---

## 4. GET /api/lessons/chapter/:chapterId

### Method & Endpoint
* **Method**: `GET`
* **Endpoint**: `/api/lessons/chapter/:chapterId`
* **Purpose**: Lấy danh sách toàn bộ các bài học thuộc về một chương học theo thứ tự tăng dần (`order ASC`).
* **Authentication**: `Public` (Không yêu cầu đăng nhập)
* **Roles**: Không yêu cầu

### Path Parameters
| Parameter | Type | Required | Description |
| :--- | :---: | :---: | :--- |
| `chapterId` | UUID | Yes | Mã chương học cần lấy bài |

### Success Response
* **HTTP Status**: `200 OK`
* **JSON Schema**:
  ```json
  {
    "success": true,
    "message": "Fetched lessons by chapter successfully!",
    "data": [
      {
        "id": "lesson-uuid-1",
        "_id": "lesson-uuid-1",
        "title": "Bài 1.1: Giới thiệu hệ thống",
        "slug": "bai-11-gioi-thieu-he-thong",
        "type": "video",
        "duration": 450,
        "isDemo": true,
        "order": 1,
        "chapter": "chapter-uuid",
        "course": "course-uuid"
      }
    ]
  }
  ```

### Raw HTTP Request
```http
GET {{BASE_URL}}/api/lessons/chapter/chapter-uuid-here
```
