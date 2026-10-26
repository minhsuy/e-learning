import { createUploadthing, type FileRouter } from 'uploadthing/next';

const f = createUploadthing();

/**
 * UploadThing FileRouter configuration
 * Quản lý định tuyến tải tệp lên UploadThing cho TMDEMY
 */
export const ourFileRouter = {
  /**
   * Định tuyến tải ảnh đại diện người dùng
   * Cho phép file ảnh định dạng jpeg, png, webp tối đa 4MB, 1 ảnh
   */
  avatarUploader: f({
    image: {
      maxFileSize: '4MB',
      maxFileCount: 1,
    },
  })
    .middleware(async () => {
      // Xác thực session nếu cần (client truyền token qua header hoặc cookie)
      return {};
    })
    .onUploadComplete(async ({ file }) => {
      return {
        url: file.url,
        ufsUrl: file.ufsUrl,
      };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
