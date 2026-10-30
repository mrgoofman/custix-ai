import type { D1Database, R2Bucket } from "@cloudflare/workers-types";
import { newId } from "./license-key";

/*
 * Feedback v2 (mrgoofman/custix-ai#16, znerol74/custix#65, ADR-0014).
 *
 * Bewusst ohne getCloudflareContext und ohne „@/“-Importe: Diese Datei läuft
 * auch im Cron-Handler (custom-worker.ts), wo es keinen Next-Request gibt.
 * Datenbank und Bucket kommen deshalb immer als Parameter.
 */

/** Beschreibung „Was ist das Problem oder die Idee?“, längerer Text wird gekürzt. */
export const FEEDBACK_DESCRIPTION_MAX = 4000;
/** Größtes Bild (nach dem Dekodieren). */
export const SCREENSHOT_MAX_BYTES = 2 * 1024 * 1024;
/** Bilder werden nach so vielen Tagen gelöscht (Cron, ADR-0014). */
export const SCREENSHOT_RETENTION_DAYS = 90;
/** Mehr Einträge pro Konto in 24 Stunden lehnt POST mit 429 ab (Speicher-Missbrauch). */
export const FEEDBACK_PER_DAY_LIMIT = 20;
/**
 * Größte Anfrage, die POST überhaupt liest: das Bild als Base64 (4/3 der
 * Bytes) plus Beschreibung, Kontext und JSON- bzw. Multipart-Hülle.
 */
export const FEEDBACK_REQUEST_MAX_BYTES =
  Math.ceil((SCREENSHOT_MAX_BYTES * 4) / 3) + 64 * 1024;

export const FEEDBACK_PLATFORMS = ["web", "desktop-mac", "desktop-win"] as const;
export type FeedbackPlatform = (typeof FEEDBACK_PLATFORMS)[number];

export type ScreenshotType = "image/png" | "image/webp";

/** Was die App über die Lage beim Senden mitschickt. Keine PII. */
export interface FeedbackContext {
  platform: FeedbackPlatform | null;
  /** Bildschirm oder Schritt, z. B. "akte/schritt-2". */
  screen: string | null;
  viewport: { w: number; h: number } | null;
  appVersion: string | null;
}

export interface FeedbackSubmission {
  description: string | null;
  /** Nur ältere Desktop-Versionen (0.6.x/0.7.x) senden Sterne. */
  rating: number | null;
  screenshot: { bytes: Uint8Array; type: ScreenshotType } | null;
  context: FeedbackContext | null;
  appVersion: string | null;
}

/** Fehler in der Eingabe; `code` geht als `{ error: code }` an den Client. */
export class FeedbackInputError extends Error {
  constructor(
    public readonly code: string,
    public readonly status = 400,
  ) {
    super(code);
  }
}

// ---------------------------------------------------------------- Eingabe

/** PNG oder WebP an den ersten Bytes erkennen; dem angegebenen Typ trauen wir nicht. */
export function sniffScreenshotType(b: Uint8Array): ScreenshotType | null {
  const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (b.length >= 8 && png.every((v, i) => b[i] === v)) return "image/png";
  // RIFF....WEBP
  if (
    b.length >= 12 &&
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50
  ) {
    return "image/webp";
  }
  return null;
}

function cleanString(v: unknown, max: number): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim().slice(0, max);
  return s || null;
}

/**
 * Kontext auf die vereinbarten Felder reduzieren. Unbekannte Plattformen und
 * Felder fallen still weg: Feedback soll nie an einem Kontextdetail scheitern.
 */
export function sanitizeContext(raw: unknown): FeedbackContext | null {
  if (typeof raw === "string") {
    try {
      raw = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;

  const platform = (FEEDBACK_PLATFORMS as readonly unknown[]).includes(r.platform)
    ? (r.platform as FeedbackPlatform)
    : null;

  let viewport: FeedbackContext["viewport"] = null;
  const vp = r.viewport as Record<string, unknown> | null | undefined;
  if (vp && typeof vp === "object") {
    const w = Number(vp.w);
    const h = Number(vp.h);
    if (Number.isFinite(w) && Number.isFinite(h) && w >= 0 && h >= 0) {
      viewport = { w: Math.min(Math.round(w), 100_000), h: Math.min(Math.round(h), 100_000) };
    }
  }

  const ctx: FeedbackContext = {
    platform,
    screen: cleanString(r.screen, 120),
    viewport,
    appVersion: cleanString(r.appVersion, 32),
  };
  return ctx.platform || ctx.screen || ctx.viewport || ctx.appVersion ? ctx : null;
}

function decodeBase64Screenshot(s: string): Uint8Array {
  // Auch als Data-URL erlaubt: "data:image/png;base64,…"
  const b64 = s.replace(/^data:[^,]*;base64,/, "").replace(/\s+/g, "");
  // Vor dem Dekodieren abschätzen, damit ein Riesenbild gar nicht erst entsteht.
  if (Math.floor((b64.length * 3) / 4) - 2 > SCREENSHOT_MAX_BYTES) {
    throw new FeedbackInputError("screenshot_too_large", 413);
  }
  let bin: string;
  try {
    bin = atob(b64);
  } catch {
    throw new FeedbackInputError("screenshot_invalid_base64");
  }
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function checkScreenshot(bytes: Uint8Array): FeedbackSubmission["screenshot"] {
  if (bytes.length === 0) return null;
  if (bytes.length > SCREENSHOT_MAX_BYTES) {
    throw new FeedbackInputError("screenshot_too_large", 413);
  }
  const type = sniffScreenshotType(bytes);
  if (!type) throw new FeedbackInputError("screenshot_unsupported_type", 415);
  return { bytes, type };
}

/** Rohe Felder (aus JSON oder Multipart) in eine geprüfte Einsendung übersetzen. */
export function normalizeSubmission(
  raw: {
    description?: unknown;
    comment?: unknown;
    rating?: unknown;
    context?: unknown;
    appVersion?: unknown;
  },
  screenshotBytes: Uint8Array | null,
): FeedbackSubmission {
  // Alte Desktop-Clients schicken `comment`, neue `description`.
  const text =
    typeof raw.description === "string" && raw.description.trim()
      ? raw.description
      : raw.comment;
  const description = cleanString(text, FEEDBACK_DESCRIPTION_MAX);

  let rating: number | null = null;
  if (raw.rating !== undefined && raw.rating !== null && raw.rating !== "") {
    rating = Number(raw.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new FeedbackInputError("rating_invalid");
    }
  }

  if (!description && rating === null) {
    throw new FeedbackInputError("description_required");
  }

  const context = sanitizeContext(raw.context);
  return {
    description,
    rating,
    screenshot: screenshotBytes ? checkScreenshot(screenshotBytes) : null,
    context,
    appVersion: context?.appVersion ?? cleanString(raw.appVersion, 32),
  };
}

/**
 * POST-Body lesen: `multipart/form-data` (Bild als Datei-Teil oder Base64-Feld
 * `screenshot`, `context` als JSON-Text) oder JSON (Bild als Base64). Ohne
 * Content-Type gilt JSON, so senden es die alten Desktop-Clients.
 */
export async function parseFeedbackRequest(request: Request): Promise<FeedbackSubmission> {
  const length = Number(request.headers.get("content-length") ?? "0");
  if (length > FEEDBACK_REQUEST_MAX_BYTES) {
    throw new FeedbackInputError("payload_too_large", 413);
  }

  const type = (request.headers.get("content-type") ?? "").toLowerCase();

  if (type.startsWith("multipart/form-data")) {
    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      throw new FeedbackInputError("invalid_body");
    }
    const part = form.get("screenshot");
    let bytes: Uint8Array | null = null;
    if (part && typeof part === "object") {
      const blob = part as Blob;
      if (blob.size > SCREENSHOT_MAX_BYTES) {
        throw new FeedbackInputError("screenshot_too_large", 413);
      }
      bytes = new Uint8Array(await blob.arrayBuffer());
    } else if (typeof part === "string" && part.trim()) {
      bytes = decodeBase64Screenshot(part);
    }
    return normalizeSubmission(
      {
        description: form.get("description") ?? undefined,
        comment: form.get("comment") ?? undefined,
        rating: form.get("rating") ?? undefined,
        context: form.get("context") ?? undefined,
        appVersion: form.get("appVersion") ?? undefined,
      },
      bytes,
    );
  }

  const text = await request.text();
  if (text.length > FEEDBACK_REQUEST_MAX_BYTES) {
    throw new FeedbackInputError("payload_too_large", 413);
  }
  let body: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(text);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
    body = parsed as Record<string, unknown>;
  } catch {
    throw new FeedbackInputError("invalid_body");
  }
  const shot = body.screenshot;
  const bytes = typeof shot === "string" && shot.trim() ? decodeBase64Screenshot(shot) : null;
  return normalizeSubmission(body, bytes);
}

// ---------------------------------------------------------------- Speichern

export function screenshotKey(feedbackId: string, type: ScreenshotType): string {
  return `screenshots/${feedbackId}.${type === "image/png" ? "png" : "webp"}`;
}

/**
 * Einsendung speichern. Erst das Bild nach R2, dann die Zeile; scheitert die
 * Zeile, wird das Bild wieder gelöscht, damit kein Bild ohne Eintrag übrig bleibt
 * (das fände weder die 90-Tage-Löschung noch die DSGVO-Löschung).
 */
export async function insertFeedback(
  db: D1Database,
  bucket: R2Bucket | undefined,
  user: { id: string; email: string },
  sub: FeedbackSubmission,
  now: number,
): Promise<{ id: string; has_screenshot: boolean }> {
  const recent = await db
    .prepare("SELECT COUNT(*) AS n FROM feedback WHERE user_id = ? AND created_at > ?")
    .bind(user.id, now - 86_400)
    .first<{ n: number }>();
  if ((recent?.n ?? 0) >= FEEDBACK_PER_DAY_LIMIT) {
    throw new FeedbackInputError("too_many_requests", 429);
  }

  const id = newId();
  let key: string | null = null;
  if (sub.screenshot) {
    if (!bucket) throw new Error("R2 binding 'FEEDBACK' is not available (wrangler.jsonc r2_buckets)");
    key = screenshotKey(id, sub.screenshot.type);
    await bucket.put(key, sub.screenshot.bytes, {
      httpMetadata: { contentType: sub.screenshot.type },
      customMetadata: { feedback_id: id },
    });
  }

  try {
    await db
      .prepare(
        `INSERT INTO feedback (id, user_id, user_email, rating, description, screenshot_key, context_json, app_version, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        id,
        user.id,
        user.email,
        sub.rating,
        sub.description,
        key,
        sub.context ? JSON.stringify(sub.context) : null,
        sub.appVersion,
        now,
      )
      .run();
  } catch (e) {
    if (key && bucket) await bucket.delete(key).catch(() => undefined);
    throw e;
  }

  return { id, has_screenshot: key !== null };
}

/** Eintrag von GET /api/feedback/mine (Vertrag mit znerol74/custix#65). */
export interface OwnFeedbackItem {
  id: string;
  /** Epoch-Sekunden. */
  created_at: number;
  description: string | null;
  has_screenshot: boolean;
}

export async function listOwnFeedback(db: D1Database, userId: string): Promise<OwnFeedbackItem[]> {
  const rows = (
    await db
      .prepare(
        `SELECT id, created_at, description, screenshot_key IS NOT NULL AS has_screenshot
           FROM feedback WHERE user_id = ? ORDER BY created_at DESC, rowid DESC LIMIT 50`,
      )
      .bind(userId)
      .all<{ id: string; created_at: number; description: string | null; has_screenshot: number }>()
  ).results;
  return rows.map((r) => ({
    id: r.id,
    created_at: r.created_at,
    description: r.description,
    has_screenshot: r.has_screenshot === 1,
  }));
}

// ---------------------------------------------------------------- Löschen

/** R2 löscht bis zu 1000 Schlüssel je Aufruf; D1 erlaubt 100 gebundene Werte je Abfrage. */
const PURGE_BATCH = 100;
/** Obergrenze je Lauf, damit ein Cron-Lauf in seinem Zeitbudget bleibt; der Rest folgt am nächsten Tag. */
const PURGE_MAX_ROUNDS = 50;

/**
 * Bilder älter als `retentionDays` löschen (ADR-0014). Die Zeile bleibt, nur
 * `screenshot_key` wird NULL. Reihenfolge: erst R2, dann D1. Bricht es
 * dazwischen ab, löscht der nächste Lauf dasselbe Bild noch einmal (in R2 ist
 * das harmlos), es bleibt aber nie ein Bild ohne Verweis zurück.
 */
export async function purgeExpiredScreenshots(
  db: D1Database,
  bucket: R2Bucket | undefined,
  now: number,
  retentionDays = SCREENSHOT_RETENTION_DAYS,
): Promise<{ deleted: number }> {
  const cutoff = now - retentionDays * 86_400;
  let deleted = 0;
  for (let round = 0; round < PURGE_MAX_ROUNDS; round++) {
    const rows = (
      await db
        .prepare(
          `SELECT id, screenshot_key FROM feedback
            WHERE screenshot_key IS NOT NULL AND created_at < ?
            ORDER BY created_at LIMIT ?`,
        )
        .bind(cutoff, PURGE_BATCH)
        .all<{ id: string; screenshot_key: string }>()
    ).results;
    if (rows.length === 0) break;
    if (!bucket) throw new Error("R2 binding 'FEEDBACK' is not available (wrangler.jsonc r2_buckets)");

    await bucket.delete(rows.map((r) => r.screenshot_key));
    await db.batch(
      rows.map((r) =>
        db
          .prepare("UPDATE feedback SET screenshot_key = NULL WHERE id = ? AND screenshot_key = ?")
          .bind(r.id, r.screenshot_key),
      ),
    );
    deleted += rows.length;
    if (rows.length < PURGE_BATCH) break;
  }
  return { deleted };
}

/**
 * DSGVO-Löschung (anonymizePerson, ADR-0008/ADR-0014): Bilder der Person
 * löschen und ihre Feedback-Zeilen von ihr lösen. Getroffen werden Zeilen über
 * das Konto (`user_id`) oder die E-Mail (alte Zeilen und Konten, die es nicht
 * mehr gibt). Die Beschreibung ist Freitext und kann Personenbezug enthalten,
 * sie wird mit gelöscht; Sterne, Kontext, Version und Datum bleiben für die
 * Statistik. Ohne Bucket und mit Bildern bricht die Funktion ab, statt still
 * Bilder stehen zu lassen.
 */
export async function anonymizeFeedbackOf(
  db: D1Database,
  bucket: R2Bucket | undefined,
  subject: { userId: string | null; email: string | null },
  now: number,
): Promise<{ rows: number; screenshots: number }> {
  if (!subject.userId && !subject.email) return { rows: 0, screenshots: 0 };

  const match = "(user_id = ?1 OR (?2 IS NOT NULL AND user_email = ?2 COLLATE NOCASE))";
  const rows = (
    await db
      .prepare(`SELECT id, screenshot_key FROM feedback WHERE ${match}`)
      .bind(subject.userId, subject.email)
      .all<{ id: string; screenshot_key: string | null }>()
  ).results;

  const keys = rows.map((r) => r.screenshot_key).filter((k): k is string => !!k);
  if (keys.length > 0) {
    if (!bucket) throw new Error("R2 binding 'FEEDBACK' is not available (wrangler.jsonc r2_buckets)");
    for (let i = 0; i < keys.length; i += 1000) {
      await bucket.delete(keys.slice(i, i + 1000));
    }
  }

  if (rows.length > 0) {
    await db
      .prepare(
        `UPDATE feedback
            SET user_id = NULL, user_email = NULL, description = NULL,
                screenshot_key = NULL, anonymized_at = ?3
          WHERE ${match}`,
      )
      .bind(subject.userId, subject.email, now)
      .run();
  }
  return { rows: rows.length, screenshots: keys.length };
}
