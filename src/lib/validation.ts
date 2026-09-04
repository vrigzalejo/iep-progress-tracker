import { z } from "zod";
import {
  CONDITION_TAGS,
  GOAL_STATUSES,
  MEASUREMENT_TYPES,
  MESSAGE_VISIBILITIES,
  PROGRESS_CODES,
  PROMPT_LEVELS,
  REPORTING_PERIODS,
  ROLES,
  SERVICE_AREAS,
  SESSION_OUTCOMES,
  SESSION_SETTINGS,
  TRIAL_RESULTS,
} from "@/lib/constants";

const passwordSchema = z
  .string()
  .min(12, "Use at least 12 characters.")
  .regex(/[a-z]/, "Include a lowercase letter.")
  .regex(/[A-Z]/, "Include an uppercase letter.")
  .regex(/[0-9]/, "Include a number.")
  .regex(/[^A-Za-z0-9]/, "Include a symbol.");

export const signInSchema = z.object({
  email: z.string().email("Enter a valid work or family email."),
  password: z.string().min(1, "Enter your password."),
});

export const studentSchema = z.object({
  preferredName: z.string().trim().min(1, "Preferred name is required.").max(80),
  grade: z.string().trim().min(1, "Grade is required.").max(20),
  school: z.string().trim().min(1, "School is required.").max(120),
  caseManagerId: z.string().min(1, "Select a case manager."),
  iepAnnualReviewAt: z.string().optional().or(z.literal("")),
  iepTriennialAt: z.string().optional().or(z.literal("")),
  presentLevels: z.string().trim().max(4000).optional().or(z.literal("")),
});

export const goalSchema = z.object({
  studentId: z.string().min(1),
  officialWording: z.string().trim().min(10, "Enter the official IEP goal wording.").max(2000),
  plainLanguageSummary: z
    .string()
    .trim()
    .min(10, "Add a plain-language summary for families.")
    .max(1000),
  baseline: z.string().trim().min(1, "Baseline is required.").max(500),
  measurableTarget: z.string().trim().min(1, "Measurable target is required.").max(500),
  targetValue: z.coerce.number().positive("Target value must be greater than 0."),
  unit: z.string().trim().min(1).max(40),
  reportingPeriod: z.enum(REPORTING_PERIODS),
  nextReportDue: z.string().min(1, "Reporting date is required."),
  serviceArea: z.enum(SERVICE_AREAS),
  measurementMethod: z.enum(MEASUREMENT_TYPES),
  status: z.enum(GOAL_STATUSES),
  startDate: z.string().min(1),
  sharedWithGuardians: z.coerce.boolean(),
  consecutiveSessionsNeeded: z.coerce.number().int().min(1).max(10).default(1),
  maxPromptForMastery: z.enum(PROMPT_LEVELS).default("INDEPENDENT"),
  presentLevelsSnapshot: z.string().trim().max(2000).optional().or(z.literal("")),
  objectiveWording: z.string().trim().max(2000).optional().or(z.literal("")),
  objectiveSummary: z.string().trim().max(1000).optional().or(z.literal("")),
  objectiveTarget: z.string().optional().or(z.literal("")),
});

export const objectiveSchema = z.object({
  goalId: z.string().min(1),
  officialWording: z.string().trim().min(10, "Enter the objective as written.").max(2000),
  plainLanguageSummary: z.string().trim().min(10, "Add a short summary.").max(1000),
  targetValue: z.coerce.number().positive(),
  unit: z.string().trim().min(1).max(40),
});

export const trialSchema = z.object({
  result: z.enum(TRIAL_RESULTS),
  promptLevel: z.enum(PROMPT_LEVELS).default("INDEPENDENT"),
});

export const progressSchema = z
  .object({
    goalId: z.string().min(1),
    recordedAt: z.string().min(1, "Date is required."),
    score: z.coerce.number().min(0, "Score cannot be negative.").optional(),
    measurementType: z.enum(MEASUREMENT_TYPES),
    notes: z.string().trim().max(2000).optional().or(z.literal("")),
    evidenceLabel: z.string().trim().max(200).optional().or(z.literal("")),
    sessionOutcome: z.enum(SESSION_OUTCOMES).default("PRESENT"),
    setting: z.enum(SESSION_SETTINGS).default("CLASSROOM"),
    conditionTag: z.enum(CONDITION_TAGS).optional().or(z.literal("")),
    accommodations: z.string().trim().max(500).optional().or(z.literal("")),
    minutesDelivered: z.string().optional().or(z.literal("")),
    groupSize: z.string().optional().or(z.literal("")),
    homeCarryover: z.string().trim().max(500).optional().or(z.literal("")),
    objectiveId: z.string().optional().or(z.literal("")),
    trialsJson: z.string().optional().or(z.literal("")),
    maxPromptForMastery: z.enum(PROMPT_LEVELS).optional(),
    makeupScheduledFor: z.string().optional().or(z.literal("")),
    makeupLocation: z.string().trim().max(120).optional().or(z.literal("")),
  })
  .superRefine((value, ctx) => {
    let trials: z.infer<typeof trialSchema>[] = [];
    if (value.trialsJson) {
      try {
        const parsed = JSON.parse(value.trialsJson);
        const result = z.array(trialSchema).safeParse(parsed);
        if (!result.success) {
          ctx.addIssue({ code: "custom", message: "Trial data is not valid.", path: ["trialsJson"] });
          return;
        }
        trials = result.data;
      } catch {
        ctx.addIssue({ code: "custom", message: "Trial data is not valid.", path: ["trialsJson"] });
        return;
      }
    }

    if (value.sessionOutcome === "PRESENT") {
      const hasTrials = trials.length > 0;
      const hasScore = value.score !== undefined && !Number.isNaN(value.score);
      if (!hasTrials && !hasScore) {
        ctx.addIssue({
          code: "custom",
          message: "Add a score or record trials for a present session.",
          path: ["score"],
        });
      }
      if (!hasTrials && !(value.notes && value.notes.trim().length >= 3)) {
        ctx.addIssue({
          code: "custom",
          message: "Add a short session note.",
          path: ["notes"],
        });
      }
    }
  });

export const messageSchema = z.object({
  studentId: z.string().min(1),
  body: z.string().trim().min(1, "Write a message.").max(2000),
  visibility: z.enum(MESSAGE_VISIBILITIES).default("FAMILY"),
});

export const periodStatementSchema = z.object({
  goalId: z.string().min(1),
  periodId: z.string().min(1),
  progressCode: z.enum(PROGRESS_CODES),
  narrative: z.string().trim().min(10, "Write a short period comment.").max(2000),
});

export const reportSnippetSchema = z.object({
  label: z.string().trim().min(2, "Name this snippet.").max(80),
  body: z.string().trim().min(10, "Write the phrase you want to paste.").max(2000),
});

export const accommodationSchema = z.object({
  studentId: z.string().min(1),
  label: z.string().trim().min(2, "Name the accommodation.").max(120),
});

export const goalAmendmentSchema = z.object({
  officialWording: z.string().trim().min(10).max(2000).optional().or(z.literal("")),
  plainLanguageSummary: z.string().trim().min(10).max(1000).optional().or(z.literal("")),
  baseline: z.string().trim().min(1).max(500).optional().or(z.literal("")),
  measurableTarget: z.string().trim().min(1).max(500).optional().or(z.literal("")),
  targetValue: z.string().optional().or(z.literal("")),
  unit: z.string().trim().max(40).optional().or(z.literal("")),
  changeReason: z.string().trim().max(500).optional().or(z.literal("")),
});

export const teamMemberSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().email(),
  title: z.string().trim().max(80).optional().or(z.literal("")),
  role: z.enum(ROLES),
  password: z.string().optional().or(z.literal("")),
}).superRefine((value, ctx) => {
  const password = value.password ?? "";
  if (!password) return;
  const result = passwordSchema.safeParse(password);
  if (!result.success) {
    ctx.addIssue({
      code: "custom",
      path: ["password"],
      message: result.error.issues[0]?.message ?? "Check the password.",
    });
  }
});

export const retentionSchema = z.object({
  retentionDays: z.coerce.number().int().min(30).max(3650),
});

export const setupPasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });
