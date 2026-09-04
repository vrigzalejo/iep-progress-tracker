import { PROMPT_LEVELS, type PromptLevel, type SessionOutcome } from "@/lib/constants";
import { startOfUtcWeek, endOfUtcWeek } from "@/lib/utils";

export type WeekSession = {
  recordedAt: Date | string;
  sessionOutcome?: string | null;
  minutesDelivered?: number | null;
  makeupScheduledFor?: Date | string | null;
  makeupLocation?: string | null;
};

export type TodayServiceInput = {
  studentId: string;
  studentName: string;
  serviceArea: string;
  providerUserId: string;
  providerName: string;
  minutesPerWeek: number;
  sessionsPerWeek: number;
  goalId: string | null;
  goalSummary: string | null;
  entries: WeekSession[];
};

export type TodayServiceRow = TodayServiceInput & {
  sessionsLogged: number;
  minutesDelivered: number;
  sessionsRemaining: number;
  minutesRemaining: number;
  dueToday: boolean;
};

function toTime(value: Date | string) {
  return (typeof value === "string" ? new Date(value) : value).getTime();
}

export function sessionsCountTowardDelivery(outcome?: string | null) {
  return outcome === "PRESENT" || outcome === "MAKEUP_SCHEDULED";
}

export function countWeekSessions(entries: WeekSession[], now = new Date()) {
  const start = startOfUtcWeek(now).getTime();
  const end = endOfUtcWeek(now).getTime();
  let sessionsLogged = 0;
  let minutesDelivered = 0;
  for (const entry of entries) {
    const time = toTime(entry.recordedAt);
    if (time < start || time >= end) continue;
    if (entry.sessionOutcome === "ABSENT" || entry.sessionOutcome === "REFUSED") continue;
    if (sessionsCountTowardDelivery(entry.sessionOutcome)) {
      sessionsLogged += 1;
    }
    minutesDelivered += entry.minutesDelivered ?? 0;
  }
  return { sessionsLogged, minutesDelivered };
}

export function buildTodayCaseload(services: TodayServiceInput[], now = new Date()): TodayServiceRow[] {
  return services
    .map((service) => {
      const { sessionsLogged, minutesDelivered } = countWeekSessions(service.entries, now);
      const sessionsRemaining = Math.max(0, service.sessionsPerWeek - sessionsLogged);
      const minutesRemaining = Math.max(0, service.minutesPerWeek - minutesDelivered);
      const dueToday =
        (service.sessionsPerWeek > 0 && sessionsRemaining > 0) ||
        (service.minutesPerWeek > 0 && minutesRemaining > 0 && service.sessionsPerWeek === 0);
      return {
        ...service,
        sessionsLogged,
        minutesDelivered,
        sessionsRemaining,
        minutesRemaining,
        dueToday,
      };
    })
    .filter((row) => row.dueToday)
    .sort((a, b) => a.studentName.localeCompare(b.studentName) || a.serviceArea.localeCompare(b.serviceArea));
}

export type LedgerDay = {
  date: string;
  presentMinutes: number;
  absent: number;
  declined: number;
  makeup: number;
};

export type MinutesLedgerRow = {
  studentId: string;
  studentName: string;
  serviceArea: string;
  providerName: string;
  prescribed: number;
  sessionsPerWeek: number;
  delivered: number;
  absent: number;
  declined: number;
  makeupScheduled: number;
  gap: number;
  days: LedgerDay[];
};

export function buildMinutesLedger(
  services: TodayServiceInput[],
  now = new Date(),
): MinutesLedgerRow[] {
  const weekStart = startOfUtcWeek(now);
  return services.map((service) => {
    const days: LedgerDay[] = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(weekStart.getTime() + index * 86_400_000);
      return {
        date: date.toISOString().slice(0, 10),
        presentMinutes: 0,
        absent: 0,
        declined: 0,
        makeup: 0,
      };
    });
    let delivered = 0;
    let absent = 0;
    let declined = 0;
    let makeupScheduled = 0;
    for (const entry of service.entries) {
      const time = toTime(entry.recordedAt);
      if (time < weekStart.getTime() || time >= endOfUtcWeek(now).getTime()) continue;
      const dayIndex = Math.floor((time - weekStart.getTime()) / 86_400_000);
      const day = days[dayIndex];
      if (!day) continue;
      const outcome = (entry.sessionOutcome ?? "PRESENT") as SessionOutcome;
      if (outcome === "ABSENT") {
        absent += 1;
        day.absent += 1;
        continue;
      }
      if (outcome === "REFUSED") {
        declined += 1;
        day.declined += 1;
        continue;
      }
      if (outcome === "MAKEUP_SCHEDULED") {
        makeupScheduled += 1;
        day.makeup += 1;
      }
      const minutes = entry.minutesDelivered ?? 0;
      delivered += minutes;
      day.presentMinutes += minutes;
    }
    return {
      studentId: service.studentId,
      studentName: service.studentName,
      serviceArea: service.serviceArea,
      providerName: service.providerName,
      prescribed: service.minutesPerWeek,
      sessionsPerWeek: service.sessionsPerWeek,
      delivered,
      absent,
      declined,
      makeupScheduled,
      gap: Math.max(0, service.minutesPerWeek - delivered),
      days,
    };
  });
}

export type PromptSharePoint = {
  date: string;
  independent: number;
  gesture: number;
  verbal: number;
  model: number;
  physical: number;
  total: number;
};

export function promptLevelShares(
  entries: {
    recordedAt: Date | string;
    sessionOutcome?: string | null;
    trials: { promptLevel: string; result: string }[];
  }[],
): PromptSharePoint[] {
  return entries
    .filter((entry) => (!entry.sessionOutcome || entry.sessionOutcome === "PRESENT") && entry.trials.length)
    .map((entry) => {
      const counts: Record<PromptLevel, number> = {
        INDEPENDENT: 0,
        GESTURE: 0,
        VERBAL: 0,
        MODEL: 0,
        PHYSICAL: 0,
      };
      for (const trial of entry.trials) {
        if (trial.result === "INCORRECT") continue;
        const level = (PROMPT_LEVELS.includes(trial.promptLevel as PromptLevel)
          ? trial.promptLevel
          : "INDEPENDENT") as PromptLevel;
        counts[level] += 1;
      }
      const total = PROMPT_LEVELS.reduce((sum, level) => sum + counts[level], 0);
      const pct = (value: number) => (total === 0 ? 0 : Math.round((value / total) * 1000) / 10);
      return {
        date: (typeof entry.recordedAt === "string" ? entry.recordedAt : entry.recordedAt.toISOString()).slice(
          0,
          10,
        ),
        independent: pct(counts.INDEPENDENT),
        gesture: pct(counts.GESTURE),
        verbal: pct(counts.VERBAL),
        model: pct(counts.MODEL),
        physical: pct(counts.PHYSICAL),
        total,
      };
    });
}

export type GoalWordingSnapshot = {
  officialWording: string;
  plainLanguageSummary: string;
  baseline: string;
  measurableTarget: string;
  targetValue: number;
  unit: string;
  measurementMethod: string;
  presentLevelsSnapshot?: string | null;
  consecutiveSessionsNeeded: number;
  maxPromptForMastery: string;
};

export function goalWordingChanged(previous: GoalWordingSnapshot, next: GoalWordingSnapshot) {
  return (
    previous.officialWording !== next.officialWording ||
    previous.plainLanguageSummary !== next.plainLanguageSummary ||
    previous.baseline !== next.baseline ||
    previous.measurableTarget !== next.measurableTarget ||
    previous.targetValue !== next.targetValue ||
    previous.unit !== next.unit ||
    previous.measurementMethod !== next.measurementMethod ||
    (previous.presentLevelsSnapshot ?? "") !== (next.presentLevelsSnapshot ?? "") ||
    previous.consecutiveSessionsNeeded !== next.consecutiveSessionsNeeded ||
    previous.maxPromptForMastery !== next.maxPromptForMastery
  );
}

export function versionActiveAt<T extends { createdAt: Date | string }>(
  versions: T[],
  at: Date,
): T | null {
  const eligible = versions
    .filter((version) => toTime(version.createdAt) <= at.getTime())
    .sort((a, b) => toTime(b.createdAt) - toTime(a.createdAt));
  return eligible[0] ?? null;
}
