import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Same-origin model delivery for the web app (custix.ai/models/*), served
 * from the MODELS R2 bucket. Same-origin means zero CORS config and no
 * third-party request in the privacy policy.
 *
 * IMPORTANT — no JavaScript in the byte path: every response body is a
 * single R2 object stream handed to Response verbatim (native passthrough,
 * ~zero CPU). Stitching split parts in the worker (TransformStream pump or
 * pull-based JS streaming) hits the CPU budget after ~75 MB and truncates
 * the download — the CLIENT reassembles parts instead (modelCache.ts).
 *
 * Large files exist as `<key>.part-aa`, `.part-ab`, … (wrangler caps single
 * uploads at 300 MiB). `manifest.json` is generated from a bucket listing so
 * the client knows what to fetch.
 *
 * Everything here is public, immutable model data — no auth.
 */

interface R2ObjectBody {
  size: number;
  httpEtag: string;
  body: ReadableStream;
}
interface R2ListedObject {
  key: string;
  size: number;
  etag: string;
}
interface R2Bucket {
  get(key: string): Promise<R2ObjectBody | null>;
  head(key: string): Promise<{ size: number; httpEtag: string } | null>;
  list(options: { prefix: string }): Promise<{ objects: R2ListedObject[] }>;
}

const ALLOWED_PREFIX = "bert-german-ler/";
// ort runtime wasm binaries also live in the bucket (Workers asset size cap).
const ALLOWED_PREFIXES = [ALLOWED_PREFIX, "ort/"];
const allowed = (key: string) => ALLOWED_PREFIXES.some((p) => key.startsWith(p)) && !key.includes("..");

function contentTypeFor(key: string): string {
  if (key.endsWith(".json")) return "application/json";
  if (key.endsWith(".txt")) return "text/plain; charset=utf-8";
  // module loaders (ort's .mjs) — dynamic import() enforces a JS MIME type
  if (key.endsWith(".mjs") || key.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (key.endsWith(".wasm")) return "application/wasm";
  return "application/octet-stream";
}

function baseHeaders(key: string, size: number, etag: string): Headers {
  return new Headers({
    "Content-Type": contentTypeFor(key),
    "Content-Length": String(size),
    ETag: etag,
    // Model files are versioned by their key/prefix — cache hard.
    "Cache-Control": "public, max-age=31536000, immutable",
  });
}

/** manifest.json: every logical file with its total size and the list of
 *  physical part keys the client must fetch + concatenate (in order). */
async function buildManifest(models: R2Bucket) {
  const objects = (await models.list({ prefix: ALLOWED_PREFIX })).objects;
  const files = new Map<
    string,
    { name: string; size: number; etag: string; parts: Array<{ key: string; size: number }> }
  >();
  const partRe = /^(.*)\.part-[a-z]+$/;
  for (const obj of objects.sort((a, b) => (a.key < b.key ? -1 : 1))) {
    const rel = obj.key.slice(ALLOWED_PREFIX.length);
    const m = rel.match(partRe);
    const logical = m ? m[1] : rel;
    const entry = files.get(logical) ?? { name: logical, size: 0, etag: "", parts: [] };
    entry.size += obj.size;
    entry.etag = entry.etag ? `${entry.etag}+${obj.etag}` : obj.etag;
    entry.parts.push({ key: rel, size: obj.size });
    files.set(logical, entry);
  }
  return { files: [...files.values()] };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const key = (await params).path.join("/");
  if (!allowed(key)) {
    return new Response("not found", { status: 404 });
  }
  const { env } = getCloudflareContext();
  const models = (env as unknown as { MODELS: R2Bucket }).MODELS;

  if (key === `${ALLOWED_PREFIX}manifest.json`) {
    return Response.json(await buildManifest(models), {
      headers: { "Cache-Control": "no-cache" },
    });
  }

  // Exact-key native passthrough only (small files or individual parts).
  const obj = await models.get(key);
  if (!obj) return new Response("not found", { status: 404 });
  return new Response(obj.body, { headers: baseHeaders(key, obj.size, obj.httpEtag) });
}

export async function HEAD(
  _request: Request,
  ctx: { params: Promise<{ path: string[] }> }
) {
  const key = (await ctx.params).path.join("/");
  if (!allowed(key)) {
    return new Response(null, { status: 404 });
  }
  const { env } = getCloudflareContext();
  const models = (env as unknown as { MODELS: R2Bucket }).MODELS;
  const head = await models.head(key);
  if (!head) return new Response(null, { status: 404 });
  return new Response(null, { headers: baseHeaders(key, head.size, head.httpEtag) });
}
