"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { hash, compare } from "bcryptjs";
import { signOut } from "@/auth";
import { prisma } from "@/lib/db";
import { evidenceSizeLimitBytes, storeEvidenceFile, deleteEvidenceFile } from "@/lib/evidence-storage";
import { writeAudit } from "@/lib/audit";
import { can, isStaff } from "@/lib/permissions";
import {
  assertStudentAccess,
  requirePermission,
  requireStaff,
  requireUser,
} from "@/lib/queries";
import { recordProgressEntry } from "@/lib/record-progress";
import { goalWordingChanged, versionActiveAt } from "@/lib/workflow";
import {
  accommodationSchema,
  goalSchema,
  messageSchema,
  objectiveSchema,
  periodStatementSchema,
  progressSchema,
  reportSnippetSchema,
  retentionSchema,
  setupPasswordSchema,
  schoolSchema,
  studentSchema,
  teamMemberSchema,
  trialSchema,
} from "@/lib/validation";
import { ROLE_LABELS, SERVICE_AREAS, type ServiceArea } from "@/lib/constants";
import { isSsoConfigured } from "@/lib/sso";
import { sendFamilyMessageMail, sendTeamInviteMail } from "@/lib/mail";
import { utcMeetingOn } from "@/lib/meeting";
import { encodeSimplePdf, packetFromStudent } from "@/lib/packet-pdf";
import { decryptSecret, encryptSecret, generateTotpSecret, verifyTotp } from "@/lib/totp";
import { normalizeSchoolCode, normalizeSchoolName } from "@/lib/schools";
import { runRetentionSweep } from "@/lib/retention-sweep";

/** Auth.js prefixes relative redirectTo with AUTH_URL; use the request host instead. */
async function signInRedirect() {
  const h = await headers();
  const host = h.get("x-forwarded-host")?.split(",")[0]?.trim() || h.get("host");
  if (!host) return "/sign-in";
  const proto =
    h.get("x-forwarded-proto")?.split(",")[0]?.trim() ||
    (process.env.AUTH_URL?.startsWith("https://") ? "https" : null) ||
    (host.startsWith("127.") || host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}/sign-in`;
}

export async function signOutAction() {
  await signOut({ redirectTo: await signInRedirect() });
}

function formString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

function formBool(formData: FormData, key: string) {
  const values = formData.getAll(key).map(String);
  return values.includes("on") || values.includes("true");
}

function optionalDate(value: string) {
  return value ? new Date(value) : null;
}

function optionalInt(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed) : null;
}

function fail(returnTo: string, message: string): never {
  const path = returnTo.startsWith("/") ? returnTo.split("?")[0] : "/dashboard";
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

function parseTrials(json: string | undefined) {
  if (!json) return [];
  try {
    const parsed = trialSchema.array().safeParse(JSON.parse(json));
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
}

export async function createProgressAction(formData: FormData): Promise<void> {
  const user = await requireStaff();
  const returnTo = formString(formData, "returnTo") || "/dashboard";
  if (!can(user.role, "progress.create")) {
    fail(returnTo, "You do not have permission to record progress.");
  }
  const parsed = progressSchema.safeParse({
    goalId: formString(formData, "goalId"),
    recordedAt: formString(formData, "recordedAt"),
    score: formString(formData, "score") || undefined,
    measurementType: formString(formData, "measurementType"),
    notes: formString(formData, "notes"),
    evidenceLabel: formString(formData, "evidenceLabel"),
    sessionOutcome: formString(formData, "sessionOutcome") || "PRESENT",
    setting: formString(formData, "setting") || "CLASSROOM",
    conditionTag: formString(formData, "conditionTag"),
    accommodations:
      formString(formData, "accommodations") ||
      formData.getAll("standingAccommodation").map(String).filter(Boolean).join(", "),
    minutesDelivered: formString(formData, "minutesDelivered"),
    groupSize: formString(formData, "groupSize"),
    homeCarryover: formString(formData, "homeCarryover"),
    objectiveId: formString(formData, "objectiveId"),
    trialsJson: formString(formData, "trialsJson"),
    maxPromptForMastery: formString(formData, "maxPromptForMastery") || undefined,
    makeupScheduledFor: formString(formData, "makeupScheduledFor"),
    makeupLocation: formString(formData, "makeupLocation"),
  });
  if (!parsed.success) {
    fail(returnTo, parsed.error.issues[0]?.message ?? "Check the form and try again.");
  }

  const goalLookup = await prisma.iepGoal.findUnique({
    where: { id: parsed.data.goalId },
    select: { id: true, studentId: true, maxPromptForMastery: true },
  });
  if (!goalLookup) fail(returnTo, "Goal not found.");
  await assertStudentAccess(user, goalLookup.studentId);

  const trials = parseTrials(parsed.data.trialsJson);
  const evidence = formData.get("evidence");
  let evidencePath: string | undefined;
  let evidenceLabel = parsed.data.evidenceLabel || undefined;
  if (evidence instanceof File && evidence.size > 0) {
    const maxBytes = evidenceSizeLimitBytes();
    if (evidence.size > maxBytes) {
      fail(
        returnTo,
        `Evidence files must be ${Math.floor(maxBytes / (1024 * 1024))} MB or smaller.`,
      );
    }
    const safeName = `${goalLookup.id}-${Date.now()}-${evidence.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    try {
      evidencePath = await storeEvidenceFile(safeName, evidence);
    } catch {
      fail(
        returnTo,
        "Could not store the evidence file. Configure private Supabase Storage or a Vercel Blob store.",
      );
    }
    evidenceLabel = evidenceLabel || evidence.name;
  }

  const saved = await recordProgressEntry({
    user,
    data: parsed.data,
    trials,
    evidenceLabel,
    evidencePath,
  });
  const savedGoal = "goal" in saved ? saved.goal : null;
  if (!savedGoal) {
    fail(returnTo, ("error" in saved && saved.error) || "Could not save the session.");
  }

  revalidatePath(`/goals/${savedGoal.id}`);
  revalidatePath(`/students/${savedGoal.studentId}`);
  revalidatePath("/dashboard");
  revalidatePath("/today");
  revalidatePath("/minutes");
  const nextHref = formString(formData, "nextHref");
  redirect(withSaved(nextHref || `/goals/${savedGoal.id}`));
}

function withSaved(path: string) {
  return path.includes("?") ? `${path}&saved=1` : `${path}?saved=1`;
}

export async function createGoalAction(formData: FormData): Promise<void> {
  const user = await requirePermission("goal.create");
  const studentId = formString(formData, "studentId");
  const returnTo = formString(formData, "returnTo") || `/students/${studentId}/goals/new`;
  const parsed = goalSchema.safeParse({
    studentId,
    officialWording: formString(formData, "officialWording"),
    plainLanguageSummary: formString(formData, "plainLanguageSummary"),
    baseline: formString(formData, "baseline"),
    measurableTarget: formString(formData, "measurableTarget"),
    targetValue: formString(formData, "targetValue"),
    unit: formString(formData, "unit"),
    reportingPeriod: formString(formData, "reportingPeriod"),
    nextReportDue: formString(formData, "nextReportDue"),
    serviceArea: formString(formData, "serviceArea"),
    measurementMethod: formString(formData, "measurementMethod"),
    status: formString(formData, "status"),
    startDate: formString(formData, "startDate"),
    sharedWithGuardians: formBool(formData, "sharedWithGuardians"),
    consecutiveSessionsNeeded: formString(formData, "consecutiveSessionsNeeded") || "1",
    maxPromptForMastery: formString(formData, "maxPromptForMastery") || "INDEPENDENT",
    presentLevelsSnapshot: formString(formData, "presentLevelsSnapshot"),
    objectiveWording: formString(formData, "objectiveWording"),
    objectiveSummary: formString(formData, "objectiveSummary"),
    objectiveTarget: formString(formData, "objectiveTarget"),
  });
  if (!parsed.success) {
    fail(returnTo, parsed.error.issues[0]?.message ?? "Check the form and try again.");
  }
  await assertStudentAccess(user, parsed.data.studentId);

  const {
    objectiveWording,
    objectiveSummary,
    objectiveTarget,
    presentLevelsSnapshot,
    nextReportDue,
    startDate,
    ...goalFields
  } = parsed.data;

  const goal = await prisma.iepGoal.create({
    data: {
      ...goalFields,
      presentLevelsSnapshot: presentLevelsSnapshot || null,
      nextReportDue: new Date(nextReportDue),
      startDate: new Date(startDate),
      createdById: user.id,
    },
  });

  if (objectiveWording && objectiveSummary) {
    await prisma.goalObjective.create({
      data: {
        goalId: goal.id,
        officialWording: objectiveWording,
        plainLanguageSummary: objectiveSummary,
        targetValue: objectiveTarget ? Number(objectiveTarget) : parsed.data.targetValue,
        unit: parsed.data.unit,
        sortOrder: 0,
      },
    });
  }

  await writeAudit({
    organizationId: user.organizationId,
    userId: user.id,
    action: "goal.create",
    resourceType: "goal",
    resourceId: goal.id,
    studentId: parsed.data.studentId,
  });

  revalidatePath(`/students/${parsed.data.studentId}`);
  redirect(`/goals/${goal.id}`);
}

export async function updateGoalAction(formData: FormData): Promise<void> {
  const user = await requirePermission("goal.update");
  const goalId = formString(formData, "goalId");
  const returnTo = `/goals/${goalId}`;
  const existing = await prisma.iepGoal.findUnique({ where: { id: goalId } });
  if (!existing) fail(returnTo, "Goal not found.");
  await assertStudentAccess(user, existing.studentId);

  const status = formString(formData, "status");
  const shared = formBool(formData, "sharedWithGuardians");
  const nextReportDue = formString(formData, "nextReportDue");
  const consecutive = optionalInt(formString(formData, "consecutiveSessionsNeeded"));
  const maxPrompt = formString(formData, "maxPromptForMastery");
  const nextSnapshot = {
    officialWording: formString(formData, "officialWording") || existing.officialWording,
    plainLanguageSummary:
      formString(formData, "plainLanguageSummary") || existing.plainLanguageSummary,
    baseline: formString(formData, "baseline") || existing.baseline,
    measurableTarget: formString(formData, "measurableTarget") || existing.measurableTarget,
    targetValue: (() => {
      const raw = formString(formData, "targetValue");
      if (!raw.trim()) return existing.targetValue;
      const parsed = Number(raw);
      return Number.isFinite(parsed) ? parsed : existing.targetValue;
    })(),
    unit: formString(formData, "unit") || existing.unit,
    measurementMethod: existing.measurementMethod,
    presentLevelsSnapshot: existing.presentLevelsSnapshot,
    consecutiveSessionsNeeded: consecutive ?? existing.consecutiveSessionsNeeded,
    maxPromptForMastery: maxPrompt || existing.maxPromptForMastery,
  };
  const wordingChanged = goalWordingChanged(existing, nextSnapshot);
  const changeReason = formString(formData, "changeReason");
  if (wordingChanged && changeReason.trim().length < 3) {
    fail(returnTo, "Add a short reason when official wording, baseline, target, or mastery changes.");
  }
  if (wordingChanged) {
    await prisma.goalVersion.create({
      data: {
        goalId,
        officialWording: existing.officialWording,
        plainLanguageSummary: existing.plainLanguageSummary,
        baseline: existing.baseline,
        measurableTarget: existing.measurableTarget,
        targetValue: existing.targetValue,
        unit: existing.unit,
        measurementMethod: existing.measurementMethod,
        presentLevelsSnapshot: existing.presentLevelsSnapshot,
        consecutiveSessionsNeeded: existing.consecutiveSessionsNeeded,
        maxPromptForMastery: existing.maxPromptForMastery,
        changeReason: changeReason.trim(),
        createdById: user.id,
      },
    });
  }

  await prisma.iepGoal.update({
    where: { id: goalId },
    data: {
      status: status || existing.status,
      sharedWithGuardians: shared,
      nextReportDue: nextReportDue ? new Date(nextReportDue) : existing.nextReportDue,
      officialWording: nextSnapshot.officialWording,
      plainLanguageSummary: nextSnapshot.plainLanguageSummary,
      baseline: nextSnapshot.baseline,
      measurableTarget: nextSnapshot.measurableTarget,
      targetValue: nextSnapshot.targetValue,
      unit: nextSnapshot.unit,
      consecutiveSessionsNeeded: nextSnapshot.consecutiveSessionsNeeded,
      maxPromptForMastery: nextSnapshot.maxPromptForMastery,
    },
  });

  await writeAudit({
    organizationId: user.organizationId,
    userId: user.id,
    action: "goal.update",
    resourceType: "goal",
    resourceId: goalId,
    studentId: existing.studentId,
    details: wordingChanged ? "amendment" : undefined,
  });

  revalidatePath(`/goals/${goalId}`);
  redirect(`${returnTo}?saved=1`);
}

export async function createObjectiveAction(formData: FormData): Promise<void> {
  const user = await requirePermission("goal.update");
  const goalId = formString(formData, "goalId");
  const returnTo = `/goals/${goalId}`;
  const parsed = objectiveSchema.safeParse({
    goalId,
    officialWording: formString(formData, "officialWording"),
    plainLanguageSummary: formString(formData, "plainLanguageSummary"),
    targetValue: formString(formData, "targetValue"),
    unit: formString(formData, "unit"),
  });
  if (!parsed.success) fail(returnTo, parsed.error.issues[0]?.message ?? "Check the objective.");
  const goal = await prisma.iepGoal.findUnique({ where: { id: goalId } });
  if (!goal) fail(returnTo, "Goal not found.");
  await assertStudentAccess(user, goal.studentId);
  const count = await prisma.goalObjective.count({ where: { goalId } });
  await prisma.goalObjective.create({
    data: { ...parsed.data, sortOrder: count },
  });
  await writeAudit({
    organizationId: user.organizationId,
    userId: user.id,
    action: "objective.create",
    resourceType: "goal",
    resourceId: goalId,
    studentId: goal.studentId,
  });
  revalidatePath(returnTo);
  redirect(`${returnTo}?saved=1`);
}

export async function createStudentAction(formData: FormData): Promise<void> {
  const user = await requirePermission("student.create");
  const returnTo = "/students/new";
  const parsed = studentSchema.safeParse({
    preferredName: formString(formData, "preferredName"),
    grade: formString(formData, "grade"),
    schoolId: formString(formData, "schoolId"),
    caseManagerId: formString(formData, "caseManagerId") || user.id,
    iepAnnualReviewAt: formString(formData, "iepAnnualReviewAt"),
    iepTriennialAt: formString(formData, "iepTriennialAt"),
    presentLevels: formString(formData, "presentLevels"),
  });
  if (!parsed.success) {
    fail(returnTo, parsed.error.issues[0]?.message ?? "Check the form and try again.");
  }

  const campus = await prisma.school.findFirst({
    where: {
      id: parsed.data.schoolId,
      organizationId: user.organizationId,
      archivedAt: null,
    },
  });
  if (!campus) fail(returnTo, "Select a school from the list. An administrator can add a campus first.");

  const student = await prisma.student.create({
    data: {
      preferredName: parsed.data.preferredName,
      grade: parsed.data.grade,
      school: campus.name,
      schoolId: campus.id,
      caseManagerId: parsed.data.caseManagerId,
      organizationId: user.organizationId,
      iepAnnualReviewAt: optionalDate(parsed.data.iepAnnualReviewAt ?? ""),
      iepTriennialAt: optionalDate(parsed.data.iepTriennialAt ?? ""),
      presentLevels: parsed.data.presentLevels || null,
    },
  });

  const providerIds = formData.getAll("providerIds").map(String).filter(Boolean);
  if (providerIds.length) {
    await prisma.studentProvider.createMany({
      data: providerIds.map((userId) => ({
        studentId: student.id,
        userId,
        serviceArea: (SERVICE_AREAS[0] ?? "ACADEMIC") as ServiceArea,
      })),
    });
  }

  await writeAudit({
    organizationId: user.organizationId,
    userId: user.id,
    action: "student.create",
    resourceType: "student",
    resourceId: student.id,
    studentId: student.id,
  });

  revalidatePath("/students");
  redirect(`/students/${student.id}`);
}

export async function createSchoolAction(formData: FormData) {
  const user = await requirePermission("team.manage");
  const parsed = schoolSchema.safeParse({
    name: formString(formData, "name"),
    code: formString(formData, "code"),
  });
  if (!parsed.success) fail("/schools", parsed.error.issues[0]?.message ?? "Check the school name.");
  const name = normalizeSchoolName(parsed.data.name);
  const existing = await prisma.school.findFirst({
    where: { organizationId: user.organizationId, name: { equals: name, mode: "insensitive" } },
  });
  if (existing && !existing.archivedAt) fail("/schools", "That school is already on the list.");
  const school = existing
    ? await prisma.school.update({
        where: { id: existing.id },
        data: { archivedAt: null, code: normalizeSchoolCode(parsed.data.code) ?? existing.code },
      })
    : await prisma.school.create({
        data: {
          organizationId: user.organizationId,
          name,
          code: normalizeSchoolCode(parsed.data.code),
        },
      });
  await writeAudit({
    organizationId: user.organizationId,
    userId: user.id,
    action: existing ? "school.restore" : "school.create",
    resourceType: "school",
    resourceId: school.id,
    details: name,
  });
  revalidatePath("/schools");
  revalidatePath("/students");
  redirect("/schools?saved=1");
}

export async function archiveSchoolAction(formData: FormData) {
  const user = await requirePermission("team.manage");
  const schoolId = formString(formData, "schoolId");
  const school = await prisma.school.findFirst({
    where: { id: schoolId, organizationId: user.organizationId },
  });
  if (!school) fail("/schools", "School not found.");
  await prisma.school.update({
    where: { id: school.id },
    data: { archivedAt: new Date() },
  });
  await writeAudit({
    organizationId: user.organizationId,
    userId: user.id,
    action: "school.archive",
    resourceType: "school",
    resourceId: school.id,
    details: school.name,
  });
  revalidatePath("/schools");
  revalidatePath("/students");
  redirect("/schools?saved=archived");
}

export async function updateStudentDatesAction(formData: FormData): Promise<void> {
  const user = await requirePermission("student.update");
  const studentId = formString(formData, "studentId");
  const returnTo = `/students/${studentId}`;
  await assertStudentAccess(user, studentId);
  await prisma.student.update({
    where: { id: studentId },
    data: {
      iepAnnualReviewAt: optionalDate(formString(formData, "iepAnnualReviewAt")),
      iepTriennialAt: optionalDate(formString(formData, "iepTriennialAt")),
      presentLevels: formString(formData, "presentLevels") || null,
    },
  });
  await writeAudit({
    organizationId: user.organizationId,
    userId: user.id,
    action: "student.update",
    resourceType: "student",
    resourceId: studentId,
    studentId,
  });
  revalidatePath(returnTo);
  redirect(`${returnTo}?saved=1`);
}

export async function sendMessageAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const studentId = formString(formData, "studentId");
  const returnTo = formString(formData, "returnTo") || `/students/${studentId}`;
  const visibility = isStaff(user.role)
    ? formString(formData, "visibility") || "FAMILY"
    : "FAMILY";
  const parsed = messageSchema.safeParse({
    studentId,
    body: formString(formData, "body"),
    visibility,
  });
  if (!parsed.success) {
    fail(returnTo, parsed.error.issues[0]?.message ?? "Write a short message.");
  }
  await assertStudentAccess(user, parsed.data.studentId);
  const message = await prisma.message.create({
    data: {
      studentId: parsed.data.studentId,
      fromUserId: user.id,
      body: parsed.data.body,
      visibility: parsed.data.visibility,
    },
  });
  await writeAudit({
    organizationId: user.organizationId,
    userId: user.id,
    action: "message.create",
    resourceType: "message",
    resourceId: message.id,
    studentId: parsed.data.studentId,
  });
  revalidatePath(`/students/${parsed.data.studentId}`);
  revalidatePath("/parent");
  revalidatePath("/messages");
  revalidatePath(`/messages/${parsed.data.studentId}`);

  if (parsed.data.visibility === "FAMILY") {
    const student = await prisma.student.findFirst({
      where: { id: parsed.data.studentId },
      include: {
        caseManager: { select: { email: true, id: true } },
        guardians: { include: { user: { select: { email: true, id: true } } } },
      },
    });
    const recipients = new Set<string>();
    if (user.role === "PARENT") {
      if (student?.caseManager.email) recipients.add(student.caseManager.email);
      const providers = await prisma.studentProvider.findMany({
        where: { studentId: parsed.data.studentId },
        include: { user: { select: { email: true } } },
      });
      for (const link of providers) {
        if (link.user.email) recipients.add(link.user.email);
      }
    } else {
      for (const guardian of student?.guardians ?? []) {
        if (guardian.user?.email && guardian.user.id !== user.id) {
          recipients.add(guardian.user.email);
        }
      }
    }
    await Promise.all([...recipients].map((email) => sendFamilyMessageMail(email)));
  }

  redirect(`${returnTo}?saved=1`);
}

export async function savePeriodStatementAction(formData: FormData): Promise<void> {
  const user = await requireStaff();
  if (!can(user.role, "progress.create")) {
    fail("/reports", "You do not have permission to write period comments.");
  }
  const parsed = periodStatementSchema.safeParse({
    goalId: formString(formData, "goalId"),
    periodId: formString(formData, "periodId"),
    progressCode: formString(formData, "progressCode"),
    narrative: formString(formData, "narrative"),
  });
  const studentId = formString(formData, "studentId");
  const returnTo = formString(formData, "returnTo") || `/reports/${studentId}/period`;
  if (!parsed.success) {
    fail(returnTo, parsed.error.issues[0]?.message ?? "Check the period comment.");
  }
  const goal = await prisma.iepGoal.findUnique({
    where: { id: parsed.data.goalId },
    include: { versions: { orderBy: { createdAt: "desc" } } },
  });
  if (!goal) fail(returnTo, "Goal not found.");
  await assertStudentAccess(user, goal.studentId);
  const period = await prisma.reportingPeriodWindow.findUnique({
    where: { id: parsed.data.periodId },
  });
  const pinned = period ? versionActiveAt(goal.versions, period.endsAt) : null;

  await prisma.goalPeriodStatement.upsert({
    where: { goalId_periodId: { goalId: parsed.data.goalId, periodId: parsed.data.periodId } },
    create: {
      ...parsed.data,
      authorId: user.id,
      goalVersionId: pinned?.id,
    },
    update: {
      progressCode: parsed.data.progressCode,
      narrative: parsed.data.narrative,
      authorId: user.id,
      goalVersionId: pinned?.id,
    },
  });

  await writeAudit({
    organizationId: user.organizationId,
    userId: user.id,
    action: "report.period_statement",
    resourceType: "goal",
    resourceId: parsed.data.goalId,
    studentId: goal.studentId,
  });
  revalidatePath(returnTo);
  revalidatePath(`/reports/${goal.studentId}`);
  redirect(`${returnTo}?saved=1`);
}

export async function createTeamMemberAction(formData: FormData): Promise<void> {
  const user = await requirePermission("team.manage");
  const parsed = teamMemberSchema.safeParse({
    name: formString(formData, "name"),
    email: formString(formData, "email"),
    title: formString(formData, "title"),
    role: formString(formData, "role"),
    password: formString(formData, "password"),
  });
  if (!parsed.success) {
    fail("/team", parsed.error.issues[0]?.message ?? "Check the team form.");
  }
  if (!parsed.data.password && !isSsoConfigured()) {
    fail("/team", "Set a temporary password, or configure school SSO first.");
  }
  const passwordHash = parsed.data.password ? await hash(parsed.data.password, 12) : null;
  const created = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email.toLowerCase(),
      title: parsed.data.title || null,
      role: parsed.data.role,
      passwordHash,
      organizationId: user.organizationId,
    },
  });
  await writeAudit({
    organizationId: user.organizationId,
    userId: user.id,
    action: "team.create",
    resourceType: "user",
    resourceId: created.id,
  });
  await sendTeamInviteMail(created.email, ROLE_LABELS[parsed.data.role]);
  revalidatePath("/team");
  redirect("/team?saved=1");
}

export async function setUserRoleAction(formData: FormData): Promise<void> {
  const user = await requirePermission("team.manage");
  const userId = formString(formData, "userId");
  const role = formString(formData, "role");
  if (userId === user.id) fail("/team", "You cannot change your own role here.");
  await prisma.user.update({
    where: { id: userId, organizationId: user.organizationId },
    data: { role },
  });
  await writeAudit({
    organizationId: user.organizationId,
    userId: user.id,
    action: "team.role_change",
    resourceType: "user",
    resourceId: userId,
    details: `role=${role}`,
  });
  revalidatePath("/team");
  redirect("/team?saved=1");
}

export async function deactivateUserAction(formData: FormData): Promise<void> {
  const user = await requirePermission("team.manage");
  const userId = formString(formData, "userId");
  if (userId === user.id) fail("/team", "You cannot deactivate your own account.");
  await prisma.user.update({
    where: { id: userId, organizationId: user.organizationId },
    data: { deactivatedAt: new Date() },
  });
  await writeAudit({
    organizationId: user.organizationId,
    userId: user.id,
    action: "team.deactivate",
    resourceType: "user",
    resourceId: userId,
  });
  revalidatePath("/team");
  redirect("/team?saved=1");
}

export async function updateRetentionAction(formData: FormData): Promise<void> {
  const user = await requirePermission("privacy.manage");
  const parsed = retentionSchema.safeParse({
    retentionDays: formString(formData, "retentionDays"),
  });
  if (!parsed.success) fail("/privacy", parsed.error.issues[0]?.message ?? "Enter a valid number of days.");
  await prisma.organization.update({
    where: { id: user.organizationId },
    data: { retentionDays: parsed.data.retentionDays },
  });
  await writeAudit({
    organizationId: user.organizationId,
    userId: user.id,
    action: "privacy.retention",
    resourceType: "organization",
    resourceId: user.organizationId,
    details: `retentionDays=${parsed.data.retentionDays}`,
  });
  revalidatePath("/privacy");
  redirect("/privacy?saved=1");
}

export async function archiveStudentAction(formData: FormData): Promise<void> {
  const user = await requirePermission("student.archive");
  const studentId = formString(formData, "studentId");
  await assertStudentAccess(user, studentId);
  await prisma.student.update({
    where: { id: studentId },
    data: { archivedAt: new Date() },
  });
  await writeAudit({
    organizationId: user.organizationId,
    userId: user.id,
    action: "student.archive",
    resourceType: "student",
    resourceId: studentId,
    studentId,
  });
  revalidatePath("/students");
  redirect("/students");
}

export async function deleteStudentDataAction(formData: FormData): Promise<void> {
  const user = await requirePermission("privacy.manage");
  const studentId = formString(formData, "studentId");
  const confirm = formString(formData, "confirm");
  const student = await prisma.student.findFirst({
    where: { id: studentId, organizationId: user.organizationId },
  });
  if (!student) fail("/privacy", "Student not found.");
  if (confirm !== student.preferredName) {
    fail("/privacy", "Type the preferred name exactly to confirm deletion.");
  }
  const evidence = await prisma.progressEntry.findMany({
    where: { goal: { studentId }, evidencePath: { not: null } },
    select: { evidencePath: true },
  });
  for (const entry of evidence) {
    if (entry.evidencePath) await deleteEvidenceFile(entry.evidencePath);
  }
  await prisma.student.delete({ where: { id: studentId } });
  await writeAudit({
    organizationId: user.organizationId,
    userId: user.id,
    action: "student.delete",
    resourceType: "student",
    resourceId: studentId,
    details: "Record permanently deleted after confirmation.",
  });
  revalidatePath("/privacy");
  revalidatePath("/students");
  redirect("/privacy?saved=1");
}

export async function changePasswordAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const parsed = setupPasswordSchema.safeParse({
    currentPassword: formString(formData, "currentPassword"),
    newPassword: formString(formData, "newPassword"),
    confirmPassword: formString(formData, "confirmPassword"),
  });
  if (!parsed.success) {
    fail("/setup", parsed.error.issues[0]?.message ?? "Check the password fields.");
  }
  const record = await prisma.user.findUnique({ where: { id: user.id } });
  if (!record) fail("/setup", "Account not found.");
  if (!record.passwordHash) {
    fail("/setup", "This account uses school SSO. There is no password to change.");
  }
  const valid = await compare(parsed.data.currentPassword, record.passwordHash);
  if (!valid) fail("/setup", "Current password is not correct.");
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hash(parsed.data.newPassword, 12) },
  });
  await writeAudit({
    organizationId: user.organizationId,
    userId: user.id,
    action: "auth.password_change",
    resourceType: "user",
    resourceId: user.id,
  });
  redirect("/setup?updated=1");
}

export async function recordConsentAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  if (user.role !== "PARENT") fail("/privacy", "Only a linked parent or guardian can acknowledge this notice.");
  const studentId = formString(formData, "studentId");
  await assertStudentAccess(user, studentId);
  const org = await prisma.organization.findUnique({ where: { id: user.organizationId } });
  const noticeVersion = org?.noticeVersion ?? "2026-08";
  const existing = await prisma.consentRecord.findFirst({
    where: {
      studentId,
      guardianName: user.name,
      noticeVersion,
      withdrawnAt: null,
    },
  });
  if (!existing) {
    await prisma.consentRecord.create({
      data: {
        studentId,
        guardianName: user.name,
        noticeVersion,
        grantedAt: new Date(),
      },
    });
    await writeAudit({
      organizationId: user.organizationId,
      userId: user.id,
      action: "privacy.consent",
      resourceType: "consent",
      resourceId: studentId,
      studentId,
    });
  }
  revalidatePath("/privacy");
  revalidatePath("/parent");
  redirect("/privacy?saved=1");
}

export async function beginMfaAction(): Promise<void> {
  const user = await requireUser();
  const record = await prisma.user.findUnique({ where: { id: user.id } });
  if (!record?.passwordHash) fail("/setup", "School SSO accounts do not use an authenticator code.");
  if (record.totpEnabledAt) fail("/setup", "Authenticator is already enabled.");
  const secret = generateTotpSecret();
  await prisma.user.update({
    where: { id: user.id },
    data: { totpSecret: encryptSecret(secret), totpEnabledAt: null },
  });
  await writeAudit({
    organizationId: user.organizationId,
    userId: user.id,
    action: "auth.mfa_begin",
    resourceType: "user",
    resourceId: user.id,
  });
  redirect("/setup?mfa=enroll");
}

export async function confirmMfaAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const code = formString(formData, "totp");
  const record = await prisma.user.findUnique({ where: { id: user.id } });
  if (!record?.totpSecret) fail("/setup", "Start authenticator setup first.");
  let secret = "";
  try {
    secret = decryptSecret(record.totpSecret);
  } catch {
    fail("/setup", "Authenticator setup could not be read. Start again.");
  }
  if (!verifyTotp(secret, code)) fail("/setup", "That authenticator code is not correct.");
  await prisma.user.update({
    where: { id: user.id },
    data: { totpEnabledAt: new Date() },
  });
  await writeAudit({
    organizationId: user.organizationId,
    userId: user.id,
    action: "auth.mfa_enable",
    resourceType: "user",
    resourceId: user.id,
  });
  redirect("/setup?updated=mfa");
}

export async function disableMfaAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const password = formString(formData, "currentPassword");
  const code = formString(formData, "totp");
  const record = await prisma.user.findUnique({ where: { id: user.id } });
  if (!record?.passwordHash || !record.totpSecret || !record.totpEnabledAt) {
    fail("/setup", "Authenticator is not enabled.");
  }
  const valid = await compare(password, record.passwordHash);
  if (!valid) fail("/setup", "Current password is not correct.");
  try {
    if (!verifyTotp(decryptSecret(record.totpSecret), code)) {
      fail("/setup", "That authenticator code is not correct.");
    }
  } catch {
    fail("/setup", "That authenticator code is not correct.");
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { totpSecret: null, totpEnabledAt: null },
  });
  await writeAudit({
    organizationId: user.organizationId,
    userId: user.id,
    action: "auth.mfa_disable",
    resourceType: "user",
    resourceId: user.id,
  });
  redirect("/setup?updated=mfa-off");
}

export async function runRetentionAction(formData: FormData): Promise<void> {
  const user = await requirePermission("privacy.manage");
  const dryRun = formString(formData, "dryRun") === "true";
  await runRetentionSweep({
    organizationId: user.organizationId,
    actorUserId: user.id,
    dryRun,
  });
  revalidatePath("/privacy");
  redirect(dryRun ? "/privacy?saved=retention-preview" : "/privacy?saved=retention");
}

export async function addAccommodationAction(formData: FormData): Promise<void> {
  const user = await requireStaff();
  const parsed = accommodationSchema.safeParse({
    studentId: formString(formData, "studentId"),
    label: formString(formData, "label"),
  });
  const returnTo = `/students/${formString(formData, "studentId")}`;
  if (!parsed.success) fail(returnTo, parsed.error.issues[0]?.message ?? "Name the accommodation.");
  await assertStudentAccess(user, parsed.data.studentId);
  const count = await prisma.studentAccommodation.count({
    where: { studentId: parsed.data.studentId, archivedAt: null },
  });
  await prisma.studentAccommodation.create({
    data: { studentId: parsed.data.studentId, label: parsed.data.label, sortOrder: count },
  });
  await writeAudit({
    organizationId: user.organizationId,
    userId: user.id,
    action: "student.accommodation",
    resourceType: "student",
    resourceId: parsed.data.studentId,
    studentId: parsed.data.studentId,
  });
  revalidatePath(returnTo);
  redirect(`${returnTo}?saved=1`);
}

export async function archiveAccommodationAction(formData: FormData): Promise<void> {
  const user = await requireStaff();
  const id = formString(formData, "accommodationId");
  const studentId = formString(formData, "studentId");
  await assertStudentAccess(user, studentId);
  await prisma.studentAccommodation.update({
    where: { id },
    data: { archivedAt: new Date() },
  });
  revalidatePath(`/students/${studentId}`);
  redirect(`/students/${studentId}?saved=1`);
}

export async function addReportSnippetAction(formData: FormData): Promise<void> {
  const user = await requireStaff();
  const parsed = reportSnippetSchema.safeParse({
    label: formString(formData, "label"),
    body: formString(formData, "body"),
  });
  const returnTo = formString(formData, "returnTo") || "/reports/studio";
  if (!parsed.success) fail(returnTo, parsed.error.issues[0]?.message ?? "Check the snippet.");
  await prisma.reportSnippet.create({
    data: {
      organizationId: user.organizationId,
      createdById: user.id,
      label: parsed.data.label,
      body: parsed.data.body,
    },
  });
  revalidatePath(returnTo);
  redirect(`${returnTo.split("?")[0]}?saved=snippet`);
}

export async function bulkNotIntroducedAction(formData: FormData): Promise<void> {
  const user = await requireStaff();
  if (!can(user.role, "progress.create")) fail("/reports/studio", "You cannot write period comments.");
  const periodId = formString(formData, "periodId");
  const confirm = formString(formData, "confirm");
  if (confirm !== "NOT_INTRODUCED") {
    fail("/reports/studio", "Type NOT_INTRODUCED to confirm the bulk update.");
  }
  const pairs = formData
    .getAll("goalId")
    .map(String)
    .filter(Boolean);
  const period = await prisma.reportingPeriodWindow.findUnique({ where: { id: periodId } });
  if (!period) fail("/reports/studio", "Reporting period not found.");
  for (const goalId of pairs) {
    const goal = await prisma.iepGoal.findUnique({
      where: { id: goalId },
      include: { versions: true },
    });
    if (!goal) continue;
    await assertStudentAccess(user, goal.studentId);
    const pinned = versionActiveAt(goal.versions, period.endsAt);
    await prisma.goalPeriodStatement.upsert({
      where: { goalId_periodId: { goalId, periodId } },
      create: {
        goalId,
        periodId,
        progressCode: "NOT_INTRODUCED",
        narrative: "Staff marked this goal as not yet introduced during this reporting period.",
        authorId: user.id,
        goalVersionId: pinned?.id,
      },
      update: {},
    });
  }
  await writeAudit({
    organizationId: user.organizationId,
    userId: user.id,
    action: "report.bulk_not_introduced",
    resourceType: "period",
    resourceId: periodId,
    details: `count=${pairs.length}`,
  });
  revalidatePath("/reports/studio");
  redirect(`/reports/studio?periodId=${periodId}&saved=bulk`);
}

export async function setDigestOptInAction(formData: FormData) {
  const user = await requireUser();
  if (user.role !== "PARENT") fail("/parent", "Only a linked guardian can change this.");
  const studentId = formString(formData, "studentId");
  await assertStudentAccess(user, studentId);
  const optIn = formBool(formData, "digestOptIn");
  const contact = await prisma.guardianContact.findFirst({
    where: { studentId, userId: user.id },
  });
  if (!contact) fail("/parent", "This account is not linked to that student.");
  await prisma.guardianContact.update({
    where: { id: contact.id },
    data: {
      digestOptIn: optIn,
      digestUnsubscribedAt: optIn ? null : new Date(),
    },
  });
  await writeAudit({
    organizationId: user.organizationId,
    userId: user.id,
    action: optIn ? "digest.opt_in" : "digest.opt_out",
    resourceType: "student",
    resourceId: studentId,
    studentId,
  });
  revalidatePath("/parent");
  redirect(`/parent?studentId=${studentId}&saved=digest`);
}

export async function saveMeetingAttendanceAction(formData: FormData) {
  const user = await requireStaff();
  const studentId = formString(formData, "studentId");
  const returnTo = formString(formData, "returnTo") || `/reports/${studentId}/meeting/room`;
  await assertStudentAccess(user, studentId);
  const meetingOn = utcMeetingOn(formString(formData, "meetingOn"));
  const names = formData.getAll("attendeeName").map(String).map((name) => name.trim()).filter(Boolean);
  const presentNames = new Set(formData.getAll("present").map(String));
  for (const name of names) {
    await prisma.meetingAttendance.upsert({
      where: {
        studentId_meetingOn_attendeeName: { studentId, meetingOn, attendeeName: name },
      },
      create: {
        studentId,
        meetingOn,
        attendeeName: name,
        present: presentNames.has(name),
        createdById: user.id,
      },
      update: { present: presentNames.has(name) },
    });
  }
  await writeAudit({
    organizationId: user.organizationId,
    userId: user.id,
    action: "meeting.attendance",
    resourceType: "student",
    resourceId: studentId,
    studentId,
    details: `count=${names.length}`,
  });
  revalidatePath(returnTo);
  redirect(`${returnTo}?saved=attendance`);
}

export async function fileStudentPdfAction(formData: FormData) {
  const user = await requireStaff();
  const studentId = formString(formData, "studentId");
  const kind = formString(formData, "kind") === "REPORT" ? "REPORT" : "PACKET";
  const returnTo = formString(formData, "returnTo") || `/reports/${studentId}`;
  await assertStudentAccess(user, studentId);
  const student = await prisma.student.findFirst({
    where: { id: studentId, organizationId: user.organizationId },
    include: {
      goals: {
        include: {
          entries: { orderBy: { recordedAt: "asc" } },
          periodStatements: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      },
    },
  });
  if (!student) fail(returnTo, "Student not found.");
  const periodLabel = formString(formData, "periodLabel") || null;
  const lines = packetFromStudent({
    kind,
    studentName: student.preferredName,
    grade: student.grade,
    school: student.school,
    periodLabel,
    goals: student.goals,
  });
  const pdf = encodeSimplePdf(lines);
  const safeName = `${kind.toLowerCase()}-${student.id}-${Date.now()}.pdf`;
  const storagePath = await storeEvidenceFile(
    safeName,
    new File([new Uint8Array(pdf)], safeName, { type: "application/pdf" }),
  );
  const filed = await prisma.filedDocument.create({
    data: {
      studentId: student.id,
      organizationId: user.organizationId,
      kind,
      periodLabel,
      storagePath,
      createdById: user.id,
    },
  });
  await writeAudit({
    organizationId: user.organizationId,
    userId: user.id,
    action: "document.file",
    resourceType: "filedDocument",
    resourceId: filed.id,
    studentId: student.id,
    details: kind,
  });
  redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}filed=${filed.id}`);
}
