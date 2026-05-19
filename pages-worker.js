import { handleCdnCgiImageRequest, handleImageRequest } from "./cloudflare/images.js";
import { runWithCloudflareRequestContext } from "./cloudflare/init.js";
import { maybeGetSkewProtectionResponse } from "./cloudflare/skew-protection.js";
import { handler as middlewareHandler } from "./middleware/handler.mjs";
import { handler } from "./server-functions/default/handler.mjs";

export default {
  async fetch(request, env, ctx) {
    return runWithCloudflareRequestContext(request, env, ctx, async () => {
      const response = maybeGetSkewProtectionResponse(request);
      if (response) return response;

      const url = new URL(request.url);

      if (url.pathname.startsWith("/cdn-cgi/image/")) {
        return handleCdnCgiImageRequest(url, env);
      }

      if (
        url.pathname ===
        `${globalThis.__NEXT_BASE_PATH__}/_next/image${globalThis.__TRAILING_SLASH__ ? "/" : ""}`
      ) {
        return await handleImageRequest(url, request.headers, env);
      }

      const reqOrResp = await middlewareHandler(request, env, ctx);
      if (reqOrResp instanceof Response) return reqOrResp;

      return handler(reqOrResp, env, ctx, request.signal);
    });
  },
};
