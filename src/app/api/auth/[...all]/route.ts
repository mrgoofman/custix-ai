import { getAuth } from "@/lib/auth";

// Better Auth catch-all handler. Constructed per-request so the D1 binding exists.
export async function GET(request: Request) {
  return getAuth().handler(request);
}

export async function POST(request: Request) {
  return getAuth().handler(request);
}
