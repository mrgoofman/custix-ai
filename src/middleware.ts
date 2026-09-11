import { NextResponse, type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  /**
   * Ohne diese Weiterleitung liefert custix.ai die Seite auch über http aus –
   * Browser schreiben dann „Nicht sicher" in die Adresszeile. Bewusst nur bei
   * ausdrücklichem http-Signal von Cloudflare, damit kein Umleitungskreis
   * entsteht, falls der Header einmal fehlt.
   *
   * Der saubere Ort dafür ist „Always Use HTTPS" in Cloudflare (greift schon
   * am Edge, also auch für /api und statische Dateien). Das hier ist der
   * Auffangnetz-Fall für die Seitenrouten.
   */
  // Nicht in der Entwicklung: dort setzt der Dev-Proxy denselben Header und
  // die Weiterleitung liefe auf ein https://localhost, das es nicht gibt.
  if (
    process.env.NODE_ENV === "production" &&
    request.headers.get("x-forwarded-proto") === "http"
  ) {
    const url = new URL(request.url);
    url.protocol = "https:";
    return NextResponse.redirect(url, 308);
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|admin|_next|_vercel|.*\\..*).*)"],
};
