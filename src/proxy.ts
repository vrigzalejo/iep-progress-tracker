import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  isNoisyLogPath,
  logEvent,
  redactRequestPath,
  shouldLogRequests,
} from "@/lib/monitoring";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (shouldLogRequests() && !isNoisyLogPath(pathname)) {
    logEvent("info", "request", {
      method: request.method,
      path: redactRequestPath(pathname),
    });
  }
  const isPublic =
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/set-password") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/health") ||
    pathname.startsWith("/api/cron") ||
    pathname.startsWith("/api/digest/unsubscribe") ||
    pathname === "/privacy-notice" ||
    pathname === "/sw.js" ||
    pathname.startsWith("/manifest");
  const session =
    request.cookies.get("authjs.session-token") ??
    request.cookies.get("__Secure-authjs.session-token");

  if (!session && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
