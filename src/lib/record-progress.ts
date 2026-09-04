import { prisma } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import { scoreFromTrials } from "@/lib/progress";
import type { SessionUser } from "@/lib/queries";
import type { PromptLevel } from "@/lib/constants";
import type { progressSchema } from "@/lib/validation";
import type { z } from "zod";

type ProgressInput = z.infer<typeof progressSchema>;

export async function recordProgressEntry(input: {
  user: SessionUser;
  data: ProgressInput;
  trials: { result: string; promptLevel: string }[];
  evidenceLabel?: string;
  evidencePath?: string;
}) {
  const goal = await prisma.iepGoal.findUnique({
    where: { id: input.data.goalId },
    select: { id: true, studentId: true, maxPromptForMastery: true },
  });
  if (!goal) return { error: "Goal not found." as const };

  const computed = scoreFromTrials(
    input.trials,
    input.data.maxPromptForMastery ?? goal.maxPromptForMastery ?? "INDEPENDENT",
  );
  const score = computed ?? input.data.score ?? 0;

  let notes = input.data.notes?.trim() ?? "";
  if (!notes && input.data.sessionOutcome === "ABSENT") notes = "Student was absent.";
  if (!notes && input.data.sessionOutcome === "REFUSED") notes = "Student declined the session.";
  if (!notes && input.data.sessionOutcome === "MAKEUP_SCHEDULED") notes = "Makeup session scheduled.";
  if (!notes && input.trials.length) {
    notes = `Recorded ${input.trials.length} trial${input.trials.length === 1 ? "" : "s"}.`;
  }

  const entry = await prisma.progressEntry.create({
    data: {
      goalId: input.data.goalId,
      recordedAt: new Date(input.data.recordedAt),
      score,
      measurementType: input.data.measurementType,
      notes,
      evidenceLabel: input.evidenceLabel,
      evidencePath: input.evidencePath,
      authorId: input.user.id,
      sessionOutcome: input.data.sessionOutcome,
      setting: input.data.setting,
      conditionTag: input.data.conditionTag || null,
      accommodations: input.data.accommodations || null,
      minutesDelivered: optionalInt(input.data.minutesDelivered ?? ""),
      groupSize: optionalInt(input.data.groupSize ?? ""),
      homeCarryover: input.data.homeCarryover || null,
      objectiveId: input.data.objectiveId || null,
      makeupScheduledFor: input.data.makeupScheduledFor
        ? new Date(input.data.makeupScheduledFor)
        : null,
      makeupLocation: input.data.makeupLocation || null,
      trials: input.trials.length
        ? {
            create: input.trials.map((trial, index) => ({
              result: trial.result,
              promptLevel: trial.promptLevel as PromptLevel,
              sortOrder: index,
            })),
          }
        : undefined,
    },
  });

  await writeAudit({
    organizationId: input.user.organizationId,
    userId: input.user.id,
    action: "progress.create",
    resourceType: "progress",
    resourceId: entry.id,
    studentId: goal.studentId,
    details: input.data.sessionOutcome === "MAKEUP_SCHEDULED" ? "makeup" : undefined,
  });

  return { entry, goal };
}

function optionalInt(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed) : null;
}
