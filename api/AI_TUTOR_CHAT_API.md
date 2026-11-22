# TMdemy AI Tutor — Student Conversation & Chat REST API Specification

**Document Version:** 1.0.0  
**Phase:** Step 06 — Student Conversation Management & Chat API  
**Target Clients:** TMdemy Web Client (Next.js), Mobile App, Teacher Portal  
**Base URL:** `/api/v1/ai-tutor`  
**Date:** November 2026  
**Status:** PRODUCTION READY  

---

## 1. Overview & Architecture

The TMdemy AI Tutor Chat API provides a lesson-specific, video-grounded Q&A conversation interface for students. When a student submits a question inside a session, the backend:
1. Verifies student enrollment and session ownership.
2. Formats recent conversation history for multi-turn conversational context.
3. Vectorizes the question via the local SentenceTransformers embedding service (`384-dimensional dense vectors`).
4. Performs cosine distance retrieval (`<=>`) on PostgreSQL `lesson_chunks` using `pgvector`.
5. Synthesizes a pedagogical, grounded response with Google Gemini.
6. Validates citation tags against PostgreSQL and persists both user and assistant messages with structured JSONB citations into `ai_tutor_messages`.

```text
Student (Next.js Client)
       │ (JWT Bearer Token)
       ▼
Express API Gateway (`/api/v1/ai-tutor`)
       │
       ├─► verifyAccessToken & Ownership Guard
       ├─► verifyUserLessonAccessService (Enrollment / Demo / Free / Author / Admin)
       │
       ├─► Step 05 RAG Engine
       │     ├─► Python AI Service (Port 8001): MiniLM text embeddings (384-dim)
       │     ├─► PostgreSQL 16 `pgvector`: Cosine distance retrieval (<=>)
       │     └─► Google Gemini GenAI: Grounded answer generation with [CHUNK:uuid] tags
       │
       └─► PostgreSQL Database Persistence
             ├─► `ai_tutor_sessions` (Session metadata, title, updatedAt)
             └─► `ai_tutor_messages` (Chronological history & JSONB citations)
```

---

## 2. Authentication & Authorization

All endpoints in this specification require an active JSON Web Token (JWT) in the HTTP Authorization header:

```http
Authorization: Bearer <accessToken>
```

### Access Entitlement Rules
Access to create sessions and submit questions for a lesson is permitted if **any** of the following conditions are met:
1. **Active Enrollment:** The authenticated user has an active enrollment (`status === 'ACTIVE'`) in the course containing the lesson.
2. **Demo Lesson:** The lesson has `isDemo === true`.
3. **Free Course:** The course price is `0` VND.
4. **Course Author:** The authenticated user is the instructor/author of the course (`course.authorId === userId`).
5. **System Administrator:** The authenticated user holds the `ADMIN` role.

> [!IMPORTANT]
> Unenrolled users attempting to access paid, non-demo lessons will receive `403 Forbidden` (`AI_TUTOR_ACCESS_DENIED`).

### Strict Session Isolation (Anti-Enumeration)
All session access is strictly scoped to the authenticated user (`session.userId === req.user.id`). Attempting to read, message, modify, or delete a session belonging to another user returns `404 Not Found` (`AI_TUTOR_SESSION_NOT_FOUND`) rather than `403`, preventing session ID enumeration attacks.

---

## 3. Endpoints Reference

### 3.1 Create Conversation Session
Creates a new conversation session for an authenticated student in a lesson.

- **Method:** `POST`
- **Route:** `/api/v1/ai-tutor/lessons/:lessonId/sessions`
- **Auth:** `Bearer <token>`

#### Request Body
```json
{
  "title": "Hỏi về useEffect Cleanup"
}
```
*Note: `title` is optional. If omitted or empty, it defaults to `"Cuộc trò chuyện mới"` and will be automatically renamed after the first question.*

#### Response `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "c3b6cc5b-002a-4e37-8e7c-a4d32335271c",
    "userId": "2045d111-4c00-4a32-9903-6b1316204ed2",
    "lessonId": "ef4ceaa1-4513-4c9e-9218-fdd0722afb95",
    "title": "Hỏi về useEffect Cleanup",
    "isActive": true,
    "createdAt": "2026-11-09T14:24:03.120Z",
    "updatedAt": "2026-11-09T14:24:03.120Z"
  }
}
```

---

### 3.2 List Student Sessions for a Lesson
Lists all conversation sessions belonging to the authenticated student for a specific lesson with pagination and message counts.

- **Method:** `GET`
- **Route:** `/api/v1/ai-tutor/lessons/:lessonId/sessions`
- **Auth:** `Bearer <token>`
- **Query Parameters:**
  - `page` *(optional, integer, default: 1)*
  - `limit` *(optional, integer, default: 20, max: 50)*
  - `status` *(optional, string, enum: `active` | `archived` | `all`, default: `all`)*
  - `includeArchived` *(optional, boolean, default: false)*

#### Response `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "c3b6cc5b-002a-4e37-8e7c-a4d32335271c",
      "userId": "2045d111-4c00-4a32-9903-6b1316204ed2",
      "lessonId": "ef4ceaa1-4513-4c9e-9218-fdd0722afb95",
      "title": "Sentence Transformers và PostgreSQL pgvector kết hợp...",
      "isActive": true,
      "createdAt": "2026-11-09T14:24:03.120Z",
      "updatedAt": "2026-11-09T14:24:08.540Z",
      "_count": {
        "messages": 4
      }
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

---

### 3.3 Get Session Details & Message History
Retrieves full details of a session and paginated chronological message history.

- **Method:** `GET`
- **Route:** `/api/v1/ai-tutor/sessions/:sessionId`
- **Auth:** `Bearer <token>`
- **Query Parameters:**
  - `page` *(optional, integer, default: 1)*
  - `limit` *(optional, integer, default: 50, max: 100)*

#### Response `200 OK`
```json
{
  "success": true,
  "data": {
    "session": {
      "id": "c3b6cc5b-002a-4e37-8e7c-a4d32335271c",
      "userId": "2045d111-4c00-4a32-9903-6b1316204ed2",
      "lessonId": "ef4ceaa1-4513-4c9e-9218-fdd0722afb95",
      "title": "Sentence Transformers và PostgreSQL pgvector kết hợp...",
      "isActive": true,
      "createdAt": "2026-11-09T14:24:03.120Z",
      "updatedAt": "2026-11-09T14:24:08.540Z",
      "_count": {
        "messages": 4
      }
    },
    "messages": [
      {
        "id": "72ba5a90-27c1-47eb-9feb-57040bc85b03",
        "sessionId": "c3b6cc5b-002a-4e37-8e7c-a4d32335271c",
        "role": "user",
        "content": "Sentence Transformers và PostgreSQL pgvector kết hợp với nhau như thế nào trong AI Tutor?",
        "citations": [],
        "promptTokens": null,
        "completionTokens": null,
        "createdAt": "2026-11-09T14:24:04.000Z"
      },
      {
        "id": "eb01c163-8b4d-482e-b298-6ab6c5f9a951",
        "sessionId": "c3b6cc5b-002a-4e37-8e7c-a4d32335271c",
        "role": "assistant",
        "content": "Trong hệ thống AI Tutor, sự kết hợp giữa Sentence Transformers và PostgreSQL pgvector diễn ra theo cơ chế mạch lạc...",
        "citations": [
          {
            "chunkId": "48b3020f-36e4-4f57-8a03-7f0073860f25",
            "startTime": 0.0,
            "endTime": 90.0,
            "startTimeFormatted": "00:00",
            "endTimeFormatted": "01:30",
            "snippet": "Chào mừng các bạn đến với hệ thống AI Tutor của TMdemy..."
          }
        ],
        "promptTokens": null,
        "completionTokens": null,
        "createdAt": "2026-11-09T14:24:08.000Z"
      }
    ],
    "pagination": {
      "total": 4,
      "page": 1,
      "limit": 50,
      "totalPages": 1
    }
  }
}
```

---

### 3.4 Submit Question to Session
Submits a student question, executes the grounded RAG pipeline, persists both user and assistant messages, and returns the result.

- **Method:** `POST`
- **Route:** `/api/v1/ai-tutor/sessions/:sessionId/messages`
- **Auth:** `Bearer <token>`

#### Request Body
```json
{
  "content": "Mô hình sinh ra bao nhiêu chiều vector?"
}
```
*Note: For convenience, the payload accepts either `content` or `question` (2 to 2000 characters).*

#### Response `200 OK`
```json
{
  "success": true,
  "data": {
    "userMessage": {
      "id": "99f3b140-59dc-4bfb-9271-477011a4369e",
      "sessionId": "c3b6cc5b-002a-4e37-8e7c-a4d32335271c",
      "role": "user",
      "content": "Mô hình sinh ra bao nhiêu chiều vector?",
      "citations": [],
      "createdAt": "2026-11-09T14:24:09.100Z"
    },
    "assistantMessage": {
      "id": "18f91244-a957-4589-982e-6539a28e7529",
      "sessionId": "c3b6cc5b-002a-4e37-8e7c-a4d32335271c",
      "role": "assistant",
      "content": "Các mô hình embedding trong bài giảng (như all-MiniLM-L6-v2 và paraphrase-multilingual-MiniLM-L12-v2) ánh xạ văn bản thành vector **384 chiều** trong không gian đặc trưng...",
      "citations": [
        {
          "chunkId": "48b3020f-36e4-4f57-8a03-7f0073860f25",
          "startTime": 45.0,
          "endTime": 90.0,
          "startTimeFormatted": "00:45",
          "endTimeFormatted": "01:30",
          "snippet": "Mô hình embedding all-MiniLM-L6-v2 ánh xạ văn bản thành vector 384 chiều..."
        }
      ],
      "createdAt": "2026-11-09T14:24:10.200Z"
    },
    "ragStatus": "ANSWERED",
    "retrieval": {
      "retrievedChunkCount": 2,
      "usedChunkCount": 1
    }
  }
}
```

---

### 3.5 Update / Rename Session
Updates the title of a session or toggles its active/archived state.

- **Method:** `PATCH`
- **Route:** `/api/v1/ai-tutor/sessions/:sessionId`
- **Auth:** `Bearer <token>`

#### Request Body
```json
{
  "title": "Kiến trúc pgvector và Cosine Similarity",
  "isActive": true
}
```
*Note: At least one field (`title` or `isActive`) must be provided.*

#### Response `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "c3b6cc5b-002a-4e37-8e7c-a4d32335271c",
    "userId": "2045d111-4c00-4a32-9903-6b1316204ed2",
    "lessonId": "ef4ceaa1-4513-4c9e-9218-fdd0722afb95",
    "title": "Kiến trúc pgvector và Cosine Similarity",
    "isActive": true,
    "createdAt": "2026-11-09T14:24:03.120Z",
    "updatedAt": "2026-11-09T14:24:15.000Z"
  }
}
```

---

### 3.6 Delete or Archive Session
Archives or permanently removes a session.

- **Method:** `DELETE`
- **Route:** `/api/v1/ai-tutor/sessions/:sessionId`
- **Auth:** `Bearer <token>`
- **Query Parameters:**
  - `permanent` *(optional, boolean, default: `false`)*:
    - `false` (default): Soft deletes (sets `isActive = false`). Session and history remain viewable under archived view.
    - `true`: Permanently removes the session and cascade-deletes all associated messages from the database.

#### Response `200 OK` (Soft Delete / Archive)
```json
{
  "success": true,
  "action": "ARCHIVED",
  "message": "Phiên trò chuyện đã được lưu trữ thành công."
}
```

#### Response `200 OK` (Permanent Delete)
```json
{
  "success": true,
  "action": "DELETED",
  "message": "Phiên trò chuyện đã được xóa vĩnh viễn."
}
```

---

## 4. Citation DTO Schema & Video Player Seeking Integration

### Citation Structure
Every assistant message includes an array of verified `citations`:
```typescript
interface CitationDto {
  chunkId: string              // UUID of the referenced lesson_chunks record
  startTime: number            // Start timestamp in seconds (float)
  endTime: number              // End timestamp in seconds (float)
  startTimeFormatted: string   // Formatted string (e.g., "01:15")
  endTimeFormatted: string     // Formatted string (e.g., "02:00")
  snippet: string              // Exact excerpt from the transcript
}
```

### Video Player Seeking in Next.js
In the TMdemy lesson classroom view, render citation badges below the assistant's message:
```tsx
// Example Next.js / React component integration
export function CitationBadge({ citation, videoRef }: { citation: CitationDto; videoRef: React.RefObject<HTMLVideoElement> }) {
  const handleSeek = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = citation.startTime
      videoRef.current.play()
    }
  }

  return (
    <button
      onClick={handleSeek}
      className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md border border-blue-200 transition"
      title={`Bấm để chuyển video đến mốc ${citation.startTimeFormatted}`}
    >
      <PlayIcon className="w-3.5 h-3.5 mr-1" />
      {citation.startTimeFormatted} - {citation.endTimeFormatted}
    </button>
  )
}
```

---

## 5. Error Codes & HTTP Status Mapping

| HTTP Code | Error Code | Description | User Message |
| :--- | :--- | :--- | :--- |
| `400 Bad Request` | `AI_TUTOR_CHAT_VALIDATION_ERROR` | Empty question or invalid UUID parameter | Dữ liệu không hợp lệ. |
| `400 Bad Request` | `AI_TUTOR_SESSION_INACTIVE` | Attempting to message an archived/inactive session | Phiên trò chuyện này đã bị lưu trữ. Vui lòng tạo cuộc trò chuyện mới. |
| `401 Unauthorized` | `AUTHENTICATION_REQUIRED` | Missing or expired JWT Bearer token | Vui lòng đăng nhập để tiếp tục. |
| `403 Forbidden` | `AI_TUTOR_ACCESS_DENIED` | Student is not enrolled in the course | Bạn cần ghi danh vào khóa học để sử dụng trợ lý AI Tutor. |
| `404 Not Found` | `AI_TUTOR_LESSON_NOT_FOUND` | Lesson ID does not exist | Không tìm thấy bài học tương ứng. |
| `404 Not Found` | `AI_TUTOR_SESSION_NOT_FOUND` | Session ID does not exist or belongs to another user (anti-enumeration) | Không tìm thấy phiên trò chuyện tương ứng. |
| `503 Service Unavailable` | `AI_TUTOR_SERVICE_UNAVAILABLE` | Python embedding microservice is offline | Dịch vụ AI Tutor hiện đang bận, vui lòng thử lại sau. |

