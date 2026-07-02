import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // The web app (custix.ai/app) is a static SPA build (see custix repo,
  // frontend `pnpm build:web`) synced into public/app by scripts/sync-webapp.sh.
  // Fallback rewrites give it clean-URL entry + SPA routing: real files in
  // public/app win first, anything else lands on the SPA shell.
  async redirects() {
    return [{ source: "/app", destination: "/app/", permanent: false }];
  },
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [],
      fallback: [
        { source: "/app", destination: "/app/index.html" },
        { source: "/app/:path*", destination: "/app/index.html" },
      ],
    };
  },
};

export default withNextIntl(nextConfig);
