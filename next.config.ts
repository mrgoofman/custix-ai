import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  /**
   * GA4-Mess-ID. Sie stand bisher nur in wrangler.jsonc unter `vars` – das ist
   * eine LAUFZEIT-Variable des Workers und erreicht das Client-Bundle nie.
   * `NEXT_PUBLIC_*` wird beim Build eingesetzt, deshalb war
   * process.env.NEXT_PUBLIC_GA4_ID im Browser undefined und die Consent-Logik
   * brach still ab: GA4 hat nie geladen.
   *
   * Hier statt in .env, weil .gitignore `.env*` ausschließt – dort ginge der
   * Wert beim nächsten Klon wieder verloren. Mess-IDs sind ohnehin öffentlich,
   * sie stehen im ausgelieferten HTML jeder Seite.
   */
  env: {
    NEXT_PUBLIC_GA4_ID: "G-ZLDD4PRB4L",
  },
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
