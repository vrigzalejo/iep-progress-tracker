import { APP_SLUG } from "@/lib/brand";

export function captureError(error: unknown, context?: Record<string, unknown>) {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error(`[${APP_SLUG}]`, message, context ?? {});
  // Production: set SENTRY_DSN and initialize @sentry/nextjs in instrumentation.ts.
  // Student payloads must never be sent to third-party telemetry without a DPA.
}

export function assertNeverStudentInLogs(payload: Record<string, unknown>) {
  const blocked = ["preferredName", "notes", "officialWording", "email", "phone"];
  for (const key of blocked) {
    if (key in payload) {
      throw new Error("Refusing to log student educational data.");
    }
  }
}
