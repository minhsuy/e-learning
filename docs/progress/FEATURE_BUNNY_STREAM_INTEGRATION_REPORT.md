# TMDEMY — BÁO CÁO TÍCH HỢP BUNNY STREAM TUS UPLOAD & VIDEO PLAYBACK (FRONTEND)

> **Mã tính năng**: `FEATURE_BUNNY_STREAM_INTEGRATION`  
> **Thời điểm hoàn thành**: 21/10/2026  
> **Trạng thái**: Hoàn thành toàn diện (Completed & Verified)  
> **Môi trường xác minh**: Next.js 14 App Router, TypeScript Strict Mode, Tailwind CSS, shadcn/ui

---

## 1. TỔNG QUAN YÊU CẦU VÀ MỤC TIÊU TRIỂN KHAI

Hệ thống E-Learning TMDEMY nâng cấp giải pháp lưu trữ và phát video bài giảng:
1. **TUS Resumable Direct Upload**: Trình duyệt tải tệp video trực tiếp lên mạng phân phối Bunny Stream CDN qua chuẩn giao thức TUS. Tuyệt đối không gửi luồng nhị phân video (binary stream) qua máy chủ Express backend.
2. **Cấp chữ ký TUS an toàn**: Gọi `POST /api/videos/upload-signature` để nhận `authorizationSignature`, `videoId`, `libraryId`, và `uploadUrl`.
3. **Quản lý vòng đời tải lên toàn diện**: Hỗ trợ xem tiến độ %, dung lượng đã tải (`bytesUploaded / totalBytes`), tạm dừng (Pause), tiếp tục (Resume), thử lại khi gián đoạn mạng (Retry), và hủy phiên (Cancel) với cơ chế dọn dẹp bộ nhớ (cleanup on unmount).
4. **Phân biệt rõ ràng 2 giai đoạn**:
   - **Giai đoạn 1 (TUS Upload)**: Tải luồng nhị phân lên máy chủ Bunny (0% -> 100%). Ngay khi hoàn tất (100%), video đã có `bunnyVideoId` và Giảng viên có thể bấm "Lưu bài học" ngay lập tức mà không cần chờ.
   - **Giai đoạn 2 (Bunny Transcoding)**: Máy chủ Bunny Stream CDN xử lý mã hóa thích ứng HLS (360p - 1080p). Frontend tự động tra cứu tiến độ chuyển mã định kỳ qua `GET /api/videos/:videoId/status` và dừng lại khi chạm trạng thái kết thúc (`READY` hoặc `FAILED`).
5. **Bảo mật luồng phát học viên**: Trình duyệt học viên gọi `GET /api/videos/lesson/:lessonId/playback` để nhận `embedUrl` ký danh từ backend. Tuyệt đối không để lộ Bunny API Keys hay Secret Keys trên trình duyệt.
6. **Bảo toàn khả năng tương thích ngược (100% Backward Compatibility)**: Giữ nguyên khả năng phát các video kế thừa (YouTube, Cloudinary CDN, trực tiếp file MP4).

---

## 2. DANH SÁCH TỆP TẠO MỚI VÀ CHỈNH SỬA

| STT | Tệp tin | Thao tác | Mô tả chi tiết |
| :--- | :--- | :--- | :--- |
| 1 | `package.json` | Cập nhật | Bổ sung dependency `tus-js-client` (v4.3.1) phục vụ tải video trực tiếp qua TUS protocol |
| 2 | `src/types/video.ts` | Tạo mới | Định nghĩa hợp đồng kiểu TypeScript: `UploadSignatureRequest`, `UploadSignatureResponse`, `VideoStatusData`, `VideoStatusResponse`, `LessonPlaybackData`, `LessonPlaybackResponse`, `BunnyVideoStatus` |
| 3 | `src/types/lesson.ts` | Cập nhật | Bổ sung `bunnyVideoId?: string` và `videoStatus?: string` vào `ApiLessonItem`, `CreateLessonDto`, `UpdateLessonDto` |
| 4 | `src/services/video.service.ts` | Tạo mới | Service giao tiếp với các endpoint Bunny Stream của TMDEMY Backend: `getUploadSignature`, `getVideoStatus`, `deleteVideo`, `getLessonPlayback` |
| 5 | `src/hooks/use-bunny-upload.ts` | Tạo mới | Custom Hook quản lý toàn diện vòng đời tải video TUS: kiểm tra tệp (dung lượng tối đa 5GB, định dạng video), xin chữ ký an toàn, tải lên phân đoạn, pause/resume/retry không duplicate, cleanup on unmount, và polling tiến độ mã hóa |
| 6 | `src/components/teacher/curriculum/bunny-video-uploader.tsx` | Tạo mới | Giao diện kéo thả video uploader chuẩn TMDEMY: thông tin tệp, thanh tiến độ nhị phân, tiến độ mã hóa HLS, các nút Tạm dừng/Tiếp tục/Thử lại/Hủy và badge trạng thái `READY`/`PROCESSING` |
| 7 | `src/components/teacher/curriculum/lesson-modal.tsx` | Cập nhật | Tích hợp bộ chuyển đổi nguồn video kép (Tab "Tải lên CDN Bunny Stream" & Tab "Liên kết ngoài YouTube/MP4"), đồng bộ thời lượng tự động và gửi `bunnyVideoId` khi lưu bài học |
| 8 | `src/components/teacher/curriculum/video-preview-modal.tsx` | Cập nhật | Tích hợp phát iframe bảo mật Bunny Stream qua `GET /api/videos/lesson/:lessonId/playback`, hiển thị trạng thái `PROCESSING`, và fallback YouTube/MP4 |
| 9 | `src/app/learn/[slug]/page.tsx` | Cập nhật | Tích hợp player rạp chiếu phim (Cinema Player) hỗ trợ phát iframe Bunny CDN với `allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"`, xử lý màn hình chờ mã hóa HLS, màn hình lỗi và fallback 100% video cũ |

---

## 3. KIỂM TRA HỢP ĐỒNG BACKEND (BACKEND CONTRACT INSPECTION)

Dựa trên tài liệu `BUNNY_STREAM_INTEGRATION_REPORT.md` và mã nguồn backend:

1. **Khả năng liên kết video trước khi READY (Link Before Ready)**:
   - Backend TMDEMY xác thực bài học cho phép liên kết `bunnyVideoId` ngay khi video đã tải lên ít nhất 1 chunk dữ liệu trên Bunny Stream.
   - Do đó, ngay khi TUS kích hoạt `onSuccess` (100% binary upload), frontend gọi `onVideoAssigned(videoId)` và kích hoạt cho phép Giảng viên nhấn "Lưu bài học". Không bắt buộc Giảng viên phải đợi quá trình encode hoàn tất.
2. **Cấu trúc trả về của Playback**:
   - Endpoint `GET /api/videos/lesson/:lessonId/playback` trả về đối tượng `data.playback` bao gồm `{ videoId, libraryId, embedUrl, hlsUrl, thumbnailUrl, previewUrl, videoStatus }`.
   - Frontend đã trích xuất an toàn `data.playback.embedUrl` và `data.playback.videoStatus` với fallback tiện ích linh hoạt.
3. **Bảo mật chữ ký**:
   - URL embed `https://iframe.mediadelivery.net/embed/<libraryId>/<videoId>` được backend cấp quyền cho học viên đã ghi danh hoặc bài học học thử (`isDemo: true`), đảm bảo tuân thủ tiêu chuẩn không để lộ khóa bí mật trên client.

---

## 4. KẾT QUẢ KIỂM THỬ VÀ VALIDATION

### 4.1. TypeScript & Static Analysis
```bash
npx tsc --noEmit
# Exit code: 0 (Zero type errors)
```

### 4.2. ESLint Code Quality
```bash
npm run lint
# Exit code: 0 (Zero errors, tất cả các tệp mới và cập nhật đều đạt chuẩn Clean Code)
```

### 4.3. Browser & UX Verification (Browser Subagent)
- **Đăng nhập & Quyền hạn**: Đã kiểm tra phiên Giảng viên `teacher02` tại `/teacher/courses`.
- **Khung giao diện tạo/sửa bài học**:
  - Modal bài học hiển thị bộ chuyển đổi nguồn video kép (Bunny Stream CDN vs URL ngoài).
  - Vùng kéo thả tệp hỗ trợ định dạng MP4, MOV, WebM, MKV với thông báo giới hạn 5GB rõ ràng.
  - Phím tạm dừng, tiếp tục, thử lại và nút thay đổi video bài giảng hoạt động trực quan.
- **Player phòng học học viên (`/learn/[slug]`)**:
  - Trình phát rạp chiếu phim (Cinema Player) tải mượt mà không có bất kỳ console warning/error hay render crash nào.
  - Tương thích hoàn toàn với các bài học kế thừa cũng như bài học video phát qua Bunny CDN.

---

## 5. CÁC ĐIỂM CẦN LƯU Ý & KHUYẾN NGHỊ TIẾP THEO

1. **Khóa học thực tế trên môi trường sản xuất**:
   - Khi chạy ở môi trường production, đảm bảo cấu hình các biến môi trường backend `BUNNY_STREAM_LIBRARY_ID` và `BUNNY_STREAM_API_KEY` đã được kích hoạt.
2. **Realtime Webhook trong tương lai**:
   - Hiện tại trạng thái mã hóa HLS được cập nhật qua Polling mỗi 3 giây. Trong tương lai nếu backend bổ sung WebSocket notification cho sự kiện `bunny.video.ready`, hook `useBunnyUpload` có thể dễ dàng lắng nghe event thay vì polling HTTP.
