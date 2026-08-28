"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { hash, compare } from "bcryptjs";
import { signOut } from "@/auth";
import { prisma } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import { can } from "@/lib/permissions";
import {
  assertStudentAccess,
  requirePermission,
  requireStaff,
  requireUser,
} from "@/lib/queries";
import {
  goalSchema,
  messageSchema,
  progressSchema,
  retentionSchema,
  setupPasswordSchema,
  studentSchema,
  teamMemberSchema,
} from "@/lib/validation";
import { SERVICE_AREAS, type ServiceArea } from "@/lib/constants";

export async function signOutAction() {
  await signOut({ redirectTo: "/sign-in" });
}

function formString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

function formBool(formData: FormData, key: string) {
  const values = formData.getAll(key).map(String);
  return values.includes("on") || values.includes("true");
}

function fail(returnTo: string, message: string): never {
  const path = returnTo.startsWith("/") ? returnTo.split("?")[0] : "/dashboard";
  redirect(`${path}?error=${encodeURIComponent(message)}`);
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
    score: formString(formData, "score"),
    measurementType: formString(formData, "measurementType"),
    notes: formString(formData, "notes"),
    evidenceLabel: formString(formData, "evidenceLabel"),
  });
  if (!parsed.success) {
    fail(returnTo, parsed.error.issues[0]?.message ?? "Check the form and try again.");
  }

  const goal = await prisma.iepGoal.findUnique({
    where: { id: parsed.data.goalId },
    select: { id: true, studentId: true },
  });
  if (!goal) fail(returnTo, "Goal not found.");
  await assertStudentAccess(user, goal.studentId);

  const evidence = formData.get("evidence");
  let evidencePath: string | undefined;
  let evidenceLabel = parsed.data.evidenceLabel || undefined;
  if (evidence instanceof File && evidence.size > 0) {
    if (evidence.size > 5 * 1024 * 1024) {
      fail(returnTo, "Evidence files must be 5 MB or smaller.");
    }
    const { mkdir, writeFile } = await import("node:fs/promises");
    const path = await import("node:path");
    const dir = path.join(process.cwd(), "data", "uploads");
    await mkdir(dir, { recursive: true });
    const safeName = `${goal.id}-${Date.now()}-${evidence.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const dest = path.join(dir, safeName);
    await writeFile(dest, Buffer.from(await evidence.arrayBuffer()));
    evidencePath = safeName;
    evidenceLabel = evidenceLabel || evidence.name;
  }

  const entry = await prisma.progressEntry.create({
    data: {
      goalId: parsed.data.goalId,
      recordedAt: new Date(parsed.data.recordedAt),
      score: parsed.data.score,
      measurementType: parsed.data.measurementType,
      notes: parsed.data.notes,
      evidenceLabel,
      evidencePath,
      authorId: user.id,
    },
  });

  await writeAudit({
    organizationId: user.organizationId,
    userId: user.id,
    action: "progress.create",
    resourceType: "progress",
    resourceId: entry.id,
    studentId: goal.studentId,
  });

  revalidatePath(`/goals/${goal.id}`);
  revalidatePath(`/students/${goal.studentId}`);
  revalidatePath("/dashboard");
  redirect(`/goals/${goal.id}?saved=1`);
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
  });
  if (!parsed.success) {
    fail(returnTo, parsed.error.issues[0]?.message ?? "Check the form and try again.");
  }
  await assertStudentAccess(user, parsed.data.studentId);

  const goal = await prisma.iepGoal.create({
    data: {
      ...parsed.data,
      nextReportDue: new Date(parsed.data.nextReportDue),
      startDate: new Date(parsed.data.startDate),
      createdById: user.id,
    },
  });

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

  await prisma.iepGoal.update({
    where: { id: goalId },
    data: {
      status: status || existing.status,
      sharedWithGuardians: shared,
      nextReportDue: nextReportDue ? new Date(nextReportDue) : existing.nextReportDue,
      plainLanguageSummary:
        formString(formData, "plainLanguageSummary") || existing.plainLanguageSummary,
    },
  });

  await writeAudit({
    organizationId: user.organizationId,
    userId: user.id,
    action: "goal.update",
    resourceType: "goal",
    resourceId: goalId,
    studentId: existing.studentId,
  });

  revalidatePath(`/goals/${goalId}`);
  redirect(`${returnTo}?saved=1`);
}

export async function createStudentAction(formData: FormData): Promise<void> {
  const user = await requirePermission("student.create");
  const returnTo = "/students/new";
  const parsed = studentSchema.safeParse({
    preferredName: formString(formData, "preferredName"),
    grade: formString(formData, "grade"),
    school: formString(formData, "school"),
    caseManagerId: formString(formData, "caseManagerId") || user.id,
  });
  if (!parsed.success) {
    fail(returnTo, parsed.error.issues[0]?.message ?? "Check the form and try again.");
  }

  const student = await prisma.student.create({
    data: {
      ...parsed.data,
      organizationId: user.organizationId,
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

export async function sendMessageAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const studentId = formString(formData, "studentId");
  const returnTo = formString(formData, "returnTo") || `/students/${studentId}`;
  const parsed = messageSchema.safeParse({
    studentId,
    body: formString(formData, "body"),
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
  const passwordHash = await hash(parsed.data.password, 12);
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
  const studentId = formString(formData, "studentId");
  await assertStudentAccess(user, studentId);
  const org = await prisma.organization.findUnique({ where: { id: user.organizationId } });
  await prisma.consentRecord.create({
    data: {
      studentId,
      guardianName: user.name,
      noticeVersion: org?.noticeVersion ?? "2026-08",
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
  revalidatePath("/privacy");
  revalidatePath("/parent");
  redirect("/privacy?saved=1");
}
