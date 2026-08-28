import { z } from "zod";
import {
  GOAL_STATUSES,
  MEASUREMENT_TYPES,
  REPORTING_PERIODS,
  ROLES,
  SERVICE_AREAS,
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
});

export const progressSchema = z.object({
  goalId: z.string().min(1),
  recordedAt: z.string().min(1, "Date is required."),
  score: z.coerce.number().min(0, "Score cannot be negative."),
  measurementType: z.enum(MEASUREMENT_TYPES),
  notes: z.string().trim().min(3, "Add a short session note.").max(2000),
  evidenceLabel: z.string().trim().max(200).optional().or(z.literal("")),
});

export const messageSchema = z.object({
  studentId: z.string().min(1),
  body: z.string().trim().min(1, "Write a message.").max(2000),
});

export const teamMemberSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().email(),
  title: z.string().trim().max(80).optional().or(z.literal("")),
  role: z.enum(ROLES),
  password: passwordSchema,
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
