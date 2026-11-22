# TMdemy AI Tutor — API Contract & DTO Specifications (Draft)

**Document Version:** 1.6.0  
**Status:** ACTIVE (Database Schema Deployed in Step 02; Python Embedding Endpoints Implemented in Step 03; Node.js Indexing Pipeline Implemented in Step 04; Semantic Retrieval & Gemini RAG Implemented in Step 05; Student Conversation Management & Chat API Fully Implemented in Step 06)  
**Target Services:** `e-learning_server/` (Node.js/Express) & `ai-service/` (Python FastAPI)  
**Date:** November 2026  

> [!NOTE]
> - For detailed specifications of the Step 04 Lesson Transcript Indexing endpoints, refer to [LESSON_INDEXING_API.md](file:///D:/e-learning-project/e-learning_server/api/ai-tutor/LESSON_INDEXING_API.md).
> - For detailed specifications of the Step 05 Semantic Retrieval & Gemini RAG Engine, refer to [RAG_RETRIEVAL_API.md](file:///D:/e-learning-project/e-learning_server/api/ai-tutor/RAG_RETRIEVAL_API.md).
> - For complete specifications of the Step 06 Student Conversation & Chat APIs, refer to [AI_TUTOR_CHAT_API.md](file:///D:/e-learning-project/e-learning_server/api/ai-tutor/AI_TUTOR_CHAT_API.md).  

---

## 1. Overview & Architecture

The TMdemy AI Tutor feature enables contextual, video-grounded Q&A for enrolled students on lesson pages.
- **Node.js Express Server (`e-learning_server/`)**: Manages session state, student authentication, course enrollment authorization, RAG retrieval via PostgreSQL `pgvector`, Gemini prompt assembly, and message persistence.
- **Python AI Service (`ai-service/`)**: Exposes internal embedding endpoints powered by `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2` (384-dimensional dense vectors) for transcript indexing and query vectorization.

---

## 2. Authentication & Authorization

All student-facing endpoints under `/api/v1/ai-tutor` require:
1. Valid JWT Bearer Token in `Authorization: Bearer <accessToken>` header.
2. Verified student enrollment in the course that contains the requested lesson.
3. Strict user-isolation: Students can only access their own sessions (`user_id = req.user.id`).

Internal service-to-service communication with `ai-service/` requires:
- Header: `X-API-Key: <AI_SERVICE_API_KEY>`

---

## 3. Student AI Tutor REST Endpoints (Express Backend)

> [!NOTE]
> All student conversation endpoints below are fully implemented and verified in Step 06. For comprehensive frontend integration documentation, see [AI_TUTOR_CHAT_API.md](file:///D:/e-learning-project/e-learning_server/api/ai-tutor/AI_TUTOR_CHAT_API.md).

### 3.1 List Student Sessions for a Lesson
Returns all active AI Tutor sessions belonging to the authenticated student for a specific lesson.

- **Method**: `GET`
- **Route**: `/api/v1/ai-tutor/lessons/:lessonId/sessions`
- **Auth**: `Bearer <token>`

#### Response `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "e2a731b8-6db1-4b1f-998f-015892c23a11",
      "lessonId": "b11a58c0-8d59-4b1f-998f-015892c23a55",
      "userId": "9f3f4c6a-4d7a-4ecb-99f8-d421a2db7935",
      "title": "Hỏi về useEffect cleanup function",
      "isActive": true,
      "createdAt": "2026-11-06T14:35:00.000Z",
      "updatedAt": "2026-11-06T14:38:12.000Z",
      "_count": {
        "messages": 4
      }
    }
  ]
}
```

---

### 3.2 Create New AI Tutor Session
Initializes a new conversation session for a lesson.

- **Method**: `POST`
- **Route**: `/api/v1/ai-tutor/lessons/:lessonId/sessions`
- **Auth**: `Bearer <token>`

#### Request Body (Optional)
```json
{
  "title": "Thắc mắc về cú pháp async/await"
}
```

#### Response `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "e2a731b8-6db1-4b1f-998f-015892c23a11",
    "lessonId": "b11a58c0-8d59-4b1f-998f-015892c23a55",
    "userId": "9f3f4c6a-4d7a-4ecb-99f8-d421a2db7935",
    "title": "Thắc mắc về cú pháp async/await",
    "isActive": true,
    "createdAt": "2026-11-06T14:35:00.000Z",
    "updatedAt": "2026-11-06T14:35:00.000Z"
  }
}
```

---

### 3.3 Get Session Details with Message History
Fetches a session along with its chronological message history.

- **Method**: `GET`
- **Route**: `/api/v1/ai-tutor/sessions/:sessionId`
- **Auth**: `Bearer <token>`

#### Response `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "e2a731b8-6db1-4b1f-998f-015892c23a11",
    "lessonId": "b11a58c0-8d59-4b1f-998f-015892c23a55",
    "title": "Hỏi về useEffect cleanup function",
    "isActive": true,
    "messages": [
      {
        "id": "a1b2c3d4-0001-4b1f-998f-015892c23a01",
        "role": "user",
        "content": "Tại sao cần return một hàm trong useEffect?",
        "citations": [],
        "createdAt": "2026-11-06T14:35:10.000Z"
      },
      {
        "id": "a1b2c3d4-0002-4b1f-998f-015892c23a02",
        "role": "assistant",
        "content": "Trong React, hàm được return bên trong `useEffect` đóng vai trò là **cleanup function**...",
        "citations": [
          {
            "chunkId": "f7d9a1e2-3c4b-4a5f-8d9e-0123456789ab",
            "startTime": 195.0,
            "endTime": 242.5,
            "startTimeFormatted": "03:15",
            "endTimeFormatted": "04:02",
            "snippet": "Khi component unmount hoặc trước khi effect chạy lại ở lần render tiếp theo, React sẽ gọi cleanup function này..."
          }
        ],
        "createdAt": "2026-11-06T14:35:14.000Z"
      }
    ]
  }
}
```

---

### 3.4 Send Message & Get Grounded Answer
Sends a student question, performs vector similarity search across `lesson_chunks`, grounds Gemini with the retrieved transcript segments, and persists the response.

- **Method**: `POST`
- **Route**: `/api/v1/ai-tutor/sessions/:sessionId/messages`
- **Auth**: `Bearer <token>`

#### Request Body
```json
{
  "content": "Tại sao cần return một hàm trong useEffect?"
}
```

#### Response `200 OK`
```json
{
  "success": true,
  "data": {
    "userMessage": {
      "id": "a1b2c3d4-0001-4b1f-998f-015892c23a01",
      "role": "user",
      "content": "Tại sao cần return một hàm trong useEffect?",
      "createdAt": "2026-11-06T14:35:10.000Z"
    },
    "assistantMessage": {
      "id": "a1b2c3d4-0002-4b1f-998f-015892c23a02",
      "role": "assistant",
      "content": "Trong React, hàm được return bên trong `useEffect` đóng vai trò là **cleanup function**...",
      "citations": [
        {
          "chunkId": "f7d9a1e2-3c4b-4a5f-8d9e-0123456789ab",
          "startTime": 195.0,
          "endTime": 242.5,
          "startTimeFormatted": "03:15",
          "endTimeFormatted": "04:02",
          "snippet": "Khi component unmount hoặc trước khi effect chạy lại ở lần render tiếp theo, React sẽ gọi cleanup function này..."
        }
      ],
      "promptTokens": 380,
      "completionTokens": 145,
      "createdAt": "2026-11-06T14:35:14.000Z"
    }
  }
}
```

---

## 4. Citation DTO Schema

The citations array included in assistant responses is structured as follows:

```typescript
export interface CitationDto {
  chunkId: string;           // UUID of the source lesson_chunk
  startTime: number;         // Start time in floating-point seconds
  endTime: number;           // End time in floating-point seconds
  startTimeFormatted: string;// e.g., "03:15"
  endTimeFormatted: string;  // e.g., "04:02"
  snippet: string;           // Text excerpt from the transcript
}
```

The frontend can map `startTime` directly to the video player seek handler:
```typescript
const handleCitationClick = (timeInSeconds: number) => {
  playerRef.current?.seekTo(timeInSeconds);
};
```

---

## 5. Embeddings Microservice Internal Endpoints (`ai-service`)

These endpoints are implemented in `ai-service/` (Python FastAPI, port 8001) as of Step 03, powered by `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2` (384-dimensional dense vectors), and protected via `X-API-Key`.

### 5.1 Generate Text Embeddings
Calculate 384-dimensional dense vectors for one or more text queries.

- **Method**: `POST`
- **Route**: `/api/v1/embeddings/text`
- **Auth**: Header `X-API-Key: <AI_SERVICE_API_KEY>`
- **Validation**:
  - `texts`: Non-empty array, 1 to 128 items.
  - Each text item: Non-empty, non-whitespace string, maximum 8192 characters.

#### Request Body
```json
{
  "texts": [
    "Tại sao cần return một hàm trong useEffect?"
  ],
  "model": "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
}
```

#### Response `200 OK`
```json
{
  "success": true,
  "model": "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2",
  "dimensions": 384,
  "embeddings": [
    [0.0125, -0.0482, 0.0891, 0.0031, -0.0219]
  ]
}
```

---

### 5.2 Chunk & Embed Transcript
Directly parses the `transcript_refined.md` Markdown representation, strips duplicated full-transcript sections (`## Toàn bộ nội dung lời giảng`), creates timestamp-aware semantic chunks (respecting `maxTokensPerChunk`), and computes 384-dim dense embeddings in a single optimized pass.

- **Method**: `POST`
- **Route**: `/api/v1/embeddings/index-transcript`
- **Auth**: Header `X-API-Key: <AI_SERVICE_API_KEY>`
- **Validation**:
  - `lessonId`: Valid non-empty string / UUID.
  - `transcriptMarkdown`: Non-empty Markdown string with timestamp blocks `**[HH:MM:SS.ss → HH:MM:SS.ss]**`.
  - `maxTokensPerChunk`: Optional integer between 20 and 1000 (defaults to 150).

#### Request Body
```json
{
  "lessonId": "b11a58c0-8d59-4b1f-998f-015892c23a55",
  "transcriptMarkdown": "# Tiêu đề bài học\n\n## Transcript theo mốc thời gian\n\n**[00:00:00.00 → 00:00:15.50]**\nChào các bạn...\n\n**[00:00:15.50 → 00:00:45.00]**\nCleanup function giúp dọn dẹp tài nguyên...\n\n## Toàn bộ nội dung lời giảng\n\nChào các bạn... (bị loại bỏ để tránh trùng lặp)",
  "maxTokensPerChunk": 150
}
```

#### Response `200 OK`
```json
{
  "success": true,
  "lessonId": "b11a58c0-8d59-4b1f-998f-015892c23a55",
  "chunkCount": 18,
  "chunks": [
    {
      "chunkIndex": 0,
      "content": "Chào mừng các bạn đến với bài học hôm nay. Trong phần này chúng ta sẽ tìm hiểu về useEffect...",
      "startTime": 0.0,
      "endTime": 45.0,
      "embedding": [0.0142, -0.0381, 0.0519]
    }
  ]
}
```

---

## 6. Database Entities Alignment (Step 02 Schema)

The database schema defined in `prisma/schema.prisma` provides the foundation for the above API contracts:

### 6.1 `lesson_chunks`
- Maps to `LessonChunk` Prisma model.
- Contains `lesson_id`, `chunk_index`, `content`, `start_time`, `end_time`, `embedding` (PostgreSQL `vector(384)`), `content_hash` (SHA-256 of transcript), `embedding_model`.
- Unique constraint: `@@unique([lesson_id, content_hash, chunk_index])`.
- Check constraints: `chunk_index >= 0`, `start_time >= 0`, `end_time >= start_time`.

### 6.2 `ai_tutor_index_states`
- Maps to `AiTutorIndexState` Prisma model.
- Stores indexing lifecycle per lesson: `status` (`pending`, `processing`, `completed`, `failed`), `content_hash`, `embedding_model`, `chunk_count`, `error_message`, `indexed_at`.
- Unique constraint: `@@unique([lesson_id])`.

### 6.3 `ai_tutor_sessions`
- Maps to `AiTutorSession` Prisma model.
- Scoped to `(user_id, lesson_id)` allowing multiple sessions per student-lesson pair without unique collision.
- Cascade deletes when parent `User` or `Lesson` is deleted.
- Indexed on `(user_id, lesson_id)` and `(user_id, updated_at)`.

### 6.4 `ai_tutor_messages`
- Maps to `AiTutorMessage` Prisma model.
- Linked to `AiTutorSession` with `role` (`user`, `assistant`).
- `citations`: Stored as `JSONB` adhering to the `CitationDto` schema.
- `prompt_tokens` & `completion_tokens`: Nullable integer fields for token audit; constrained to `>= 0`.
- Chronologically indexed on `(session_id, created_at)`.
