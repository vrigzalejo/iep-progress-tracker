import { APP_SLUG } from "@/lib/brand";

export const BLOCKED_LOG_KEYS = [
  "preferredName",
  "legalName",
  "notes",
  "officialWording",
  "plainLanguageSummary",
  "plainLanguageSummaryEs",
  "email",
  "phone",
  "studentName",
  "homeCarryover",
  "narrative",
] as const;

const BLOCKED_KEY_SET = new Set<string>(BLOCKED_LOG_KEYS);

export type LogLevel = "info" | "warn" | "error";

export function shouldLogRequests(env: NodeJS.Dict<string> = process.env) {
  return env.LOG_REQUESTS !== "false";
}

export function isNoisyLogPath(pathname: string) {
  return (
    pathname.startsWith("/api/health") ||
    pathname === "/sw.js" ||
    pathname.startsWith("/icon") ||
    pathname.startsWith("/apple-icon")
  );
}

/** Drop query strings and replace student/record ids in the path. */
export function redactRequestPath(pathname: string) {
  const pathOnly = pathname.split("?")[0] || "/";
  return pathOnly.replace(
    /\/(?:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|c[a-z0-9]{24,})\b/gi,
    "/:id",
  );
}

export function assertNeverStudentInLogs(payload: Record<string, unknown>) {
  for (const key of BLOCKED_LOG_KEYS) {
    if (key in payload) {
      throw new Error("Refusing to log student educational data.");
    }
  }
}

export function scrubLogContext(payload: Record<string, unknown> = {}) {
  const next: Record<string, unknown> = {};
  let redacted = false;
  for (const [key, value] of Object.entries(payload)) {
    if (BLOCKED_KEY_SET.has(key)) {
      redacted = true;
      continue;
    }
    next[key] = value;
  }
  if (redacted) next.redacted = true;
  return next;
}

export function formatLogLine(
  level: LogLevel,
  event: string,
  context: Record<string, unknown> = {},
  at: Date = new Date(),
) {
  return JSON.stringify({
    ts: at.toISOString(),
    level,
    event,
    app: APP_SLUG,
    ...scrubLogContext(context),
  });
}

export function logEvent(level: LogLevel, event: string, context?: Record<string, unknown>) {
  const line = formatLogLine(level, event, context);
  if (level === "error") {
    console.error(line);
    return;
  }
  if (level === "warn") {
    console.warn(line);
    return;
  }
  console.info(line);
}

export function captureError(error: unknown, context?: Record<string, unknown>) {
  const message = error instanceof Error ? error.message : "Unknown error";
  logEvent("error", "error", { message, ...(context ?? {}) });
  // Optional later: set SENTRY_DSN and initialize @sentry/nextjs in instrumentation.ts.
  // Student payloads must never be sent to third-party telemetry without a DPA.
}
