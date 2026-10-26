import { createRouteHandler } from 'uploadthing/next';
import { ourFileRouter } from './core';

/**
 * UploadThing Next.js App Router Route Handler
 * Endpoint: /api/uploadthing (GET, POST)
 */
export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
});
