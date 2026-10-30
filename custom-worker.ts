/*
 * Einstieg des Workers (wrangler.jsonc → main). OpenNext erzeugt mit
 * `npm run build:cf` den Next-Handler in .open-next/worker.js; diese Datei
 * reicht `fetch` unverändert durch und ergänzt einen `scheduled`-Handler für
 * die Cron Trigger (wrangler.jsonc → triggers.crons). So beschreibt es OpenNext
 * selbst: https://opennext.js.org/cloudflare/howtos/custom-worker
 *
 * Cron täglich: Feedback-Screenshots älter als 90 Tage löschen (ADR-0014).
 * Lokal testen: `wrangler dev --test-scheduled`, dann
 * `curl "http://localhost:8787/__scheduled?cron=17+3+*+*+*"`.
 *
 * Durable Objects nutzt das Projekt nicht (kein DO-Queue, kein DO-Tag-Cache),
 * deshalb keine Re-Exporte aus .open-next/worker.js.
 */
import type { ExecutionContext, ScheduledController } from "@cloudflare/workers-types";
// .open-next/worker.js entsteht erst beim Build (opennextjs-cloudflare build). Vorher fehlt
// das Modul, danach ist es vorhanden: @ts-expect-error würde dann selbst zum Fehler.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { default as handler } from "./.open-next/worker.js";
import { purgeExpiredScreenshots } from "./src/lib/feedback";

const worker = {
  fetch: handler.fetch,

  async scheduled(controller: ScheduledController, env: CloudflareEnv, ctx: ExecutionContext) {
    ctx.waitUntil(
      (async () => {
        const now = Math.floor(Date.now() / 1000);
        const { deleted } = await purgeExpiredScreenshots(env.DB, env.FEEDBACK, now);
        console.log(`cron ${controller.cron}: ${deleted} feedback screenshot(s) older than 90 days deleted`);
      })(),
    );
  },
};

export default worker;
