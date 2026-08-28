import type { DataSignal } from "@/lib/constants";

export type ProgressPoint = {
  recordedAt: Date | string;
  score: number;
};

export type GoalForSignal = {
  targetValue: number;
  startDate: Date | string;
  nextReportDue: Date | string;
  status: string;
  entries: ProgressPoint[];
};

const STALE_DAYS = 14;

function toTime(value: Date | string) {
  return (typeof value === "string" ? new Date(value) : value).getTime();
}

function daysBetween(a: Date | string, b: Date | string) {
  return Math.abs(toTime(a) - toTime(b)) / 86_400_000;
}

/**
 * Operational data signal — not an educational, legal, or clinical decision.
 * Staff remain responsible for IEP status and instructional choices.
 */
export function computeDataSignal(goal: GoalForSignal, now = new Date()): DataSignal {
  if (goal.status === "GOAL_MET") return "GOAL_MET";
  if (goal.status === "DISCONTINUED" || goal.status === "DRAFT") return "NEEDS_DATA";

  const entries = [...goal.entries].sort(
    (a, b) => toTime(a.recordedAt) - toTime(b.recordedAt),
  );
  if (entries.length === 0) return "NEEDS_DATA";

  const latest = entries[entries.length - 1];
  if (daysBetween(latest.recordedAt, now) > STALE_DAYS) return "NEEDS_DATA";
  if (latest.score >= goal.targetValue) return "GOAL_MET";

  const dueSoon = daysBetween(goal.nextReportDue, now) <= 10 && toTime(goal.nextReportDue) >= toTime(now) - 86_400_000;
  if (entries.length < 2) {
    return dueSoon ? "NEEDS_ATTENTION" : "ON_TRACK";
  }

  const previous = entries[entries.length - 2];
  const improving = latest.score >= previous.score;
  const remaining = goal.targetValue - latest.score;
  const elapsed = Math.max(1, daysBetween(goal.startDate, latest.recordedAt));
  const projected = (latest.score - (entries[0]?.score ?? latest.score)) / elapsed;
  const daysToDue = Math.max(1, (toTime(goal.nextReportDue) - toTime(now)) / 86_400_000);
  const likelyToMeet = latest.score + projected * daysToDue >= goal.targetValue * 0.9;

  if (!improving && remaining > 0) return "NEEDS_ATTENTION";
  if (dueSoon && !likelyToMeet) return "NEEDS_ATTENTION";
  return "ON_TRACK";
}

export function trendSlope(entries: ProgressPoint[]) {
  if (entries.length < 2) return 0;
  const sorted = [...entries].sort((a, b) => toTime(a.recordedAt) - toTime(b.recordedAt));
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const days = Math.max(1, daysBetween(first.recordedAt, last.recordedAt));
  return (last.score - first.score) / days;
}
