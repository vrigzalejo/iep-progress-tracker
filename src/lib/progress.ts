import {
  PROMPT_RANK,
  TRIAL_MEASUREMENTS,
  type DataSignal,
  type MeasurementType,
  type PromptLevel,
  type SessionOutcome,
} from "@/lib/constants";

export type ProgressPoint = {
  recordedAt: Date | string;
  score: number;
  sessionOutcome?: string | null;
};

export type GoalForSignal = {
  targetValue: number;
  startDate: Date | string;
  nextReportDue: Date | string;
  status: string;
  consecutiveSessionsNeeded?: number | null;
  entries: ProgressPoint[];
};

export type TrialInput = {
  result: string;
  promptLevel?: string | null;
};

const STALE_DAYS = 14;

function toTime(value: Date | string) {
  return (typeof value === "string" ? new Date(value) : value).getTime();
}

function daysBetween(a: Date | string, b: Date | string) {
  return Math.abs(toTime(a) - toTime(b)) / 86_400_000;
}

export function isPresentSession(outcome?: string | null): outcome is SessionOutcome | undefined {
  return !outcome || outcome === "PRESENT";
}

export function presentEntries<T extends ProgressPoint>(entries: T[]): T[] {
  return [...entries]
    .filter((entry) => isPresentSession(entry.sessionOutcome))
    .sort((a, b) => toTime(a.recordedAt) - toTime(b.recordedAt));
}

export function trialCountsAsSuccess(promptLevel: string | null | undefined, maxPromptForMastery: string) {
  const used = (promptLevel && promptLevel in PROMPT_RANK ? promptLevel : "INDEPENDENT") as PromptLevel;
  const allowed = (maxPromptForMastery in PROMPT_RANK ? maxPromptForMastery : "INDEPENDENT") as PromptLevel;
  return PROMPT_RANK[used] <= PROMPT_RANK[allowed];
}

export function scoreFromTrials(trials: TrialInput[], maxPromptForMastery = "INDEPENDENT") {
  if (trials.length === 0) return null;
  const successes = trials.filter((trial) => {
    if (trial.result === "INCORRECT") return false;
    if (trial.result === "INDEPENDENT") return true;
    return trialCountsAsSuccess(trial.promptLevel, maxPromptForMastery);
  }).length;
  return Math.round((successes / trials.length) * 1000) / 10;
}

export function trialSummary(trials: TrialInput[]) {
  return {
    total: trials.length,
    independent: trials.filter((trial) => trial.result === "INDEPENDENT").length,
    prompted: trials.filter((trial) => trial.result === "PROMPTED").length,
    incorrect: trials.filter((trial) => trial.result === "INCORRECT").length,
  };
}

export function usesTrialPad(measurement: string): measurement is MeasurementType {
  return TRIAL_MEASUREMENTS.includes(measurement as MeasurementType);
}

export function meetsConsecutiveMastery(goal: GoalForSignal) {
  const needed = Math.max(1, goal.consecutiveSessionsNeeded ?? 1);
  const present = presentEntries(goal.entries);
  if (present.length < needed) return false;
  return present.slice(-needed).every((entry) => entry.score >= goal.targetValue);
}

/**
 * Operational data signal — not an educational, legal, or clinical decision.
 * Staff remain responsible for IEP status and instructional choices.
 */
export function computeDataSignal(goal: GoalForSignal, now = new Date()): DataSignal {
  if (goal.status === "GOAL_MET") return "GOAL_MET";
  if (goal.status === "DISCONTINUED" || goal.status === "DRAFT") return "NEEDS_DATA";

  const entries = presentEntries(goal.entries);
  if (entries.length === 0) return "NEEDS_DATA";

  const latest = entries[entries.length - 1];
  if (daysBetween(latest.recordedAt, now) > STALE_DAYS) return "NEEDS_DATA";
  if (meetsConsecutiveMastery(goal)) return "GOAL_MET";

  const dueSoon =
    daysBetween(goal.nextReportDue, now) <= 10 && toTime(goal.nextReportDue) >= toTime(now) - 86_400_000;
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
  const present = presentEntries(entries);
  if (present.length < 2) return 0;
  const first = present[0];
  const last = present[present.length - 1];
  const days = Math.max(1, daysBetween(first.recordedAt, last.recordedAt));
  return (last.score - first.score) / days;
}

export function deliveredMinutesInRange(
  entries: { recordedAt: Date | string; minutesDelivered?: number | null; sessionOutcome?: string | null }[],
  start: Date,
  end: Date,
) {
  return entries.reduce((sum, entry) => {
    const time = toTime(entry.recordedAt);
    if (time < start.getTime() || time > end.getTime()) return sum;
    if (entry.sessionOutcome === "ABSENT" || entry.sessionOutcome === "REFUSED") return sum;
    return sum + (entry.minutesDelivered ?? 0);
  }, 0);
}
