import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function formatTime(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function formatThreadDay(
  value: Date | string,
  labels: { today: string; yesterday: string },
  locale: "en" | "es" = "en",
  now = new Date(),
) {
  const date = typeof value === "string" ? new Date(value) : value;
  const startOfLocalDay = (item: Date) => new Date(item.getFullYear(), item.getMonth(), item.getDate()).getTime();
  const diff = Math.round((startOfLocalDay(now) - startOfLocalDay(date)) / 86_400_000);
  if (diff === 0) return labels.today;
  if (diff === 1) return labels.yesterday;
  return new Intl.DateTimeFormat(locale === "es" ? "es-US" : "en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function formatDateLong(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function daysUntil(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;
  const today = new Date();
  const a = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const b = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  return Math.round((b - a) / 86_400_000);
}

export function isoDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

/** Monday 00:00 UTC of the week that contains `now`. */
export function startOfUtcWeek(now = new Date()) {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const day = start.getUTCDay();
  start.setUTCDate(start.getUTCDate() + (day === 0 ? -6 : 1 - day));
  return start;
}

/** Exclusive end of the UTC week (next Monday 00:00). */
export function endOfUtcWeek(now = new Date()) {
  return new Date(startOfUtcWeek(now).getTime() + 7 * 86_400_000);
}

export function addUtcDays(value: Date, days: number) {
  return new Date(value.getTime() + days * 86_400_000);
}
