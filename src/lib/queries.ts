import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { seedDemoData } from "@/lib/seed";
import { can, canAccessStudent, isStaff, type Permission } from "@/lib/permissions";
import type { Role } from "@/lib/constants";
import { computeDataSignal } from "@/lib/progress";
import { writeAudit } from "@/lib/audit";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  organizationId: string;
};

export async function requireUser(): Promise<SessionUser> {
  await seedDemoData();
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  const user = session.user;
  return {
    id: user.id,
    name: user.name ?? "",
    email: user.email ?? "",
    role: user.role,
    organizationId: user.organizationId,
  };
}

export async function requirePermission(permission: Permission) {
  const user = await requireUser();
  if (!can(user.role, permission)) redirect("/dashboard");
  return user;
}

export async function requireStaff() {
  const user = await requireUser();
  if (!isStaff(user.role)) redirect("/parent");
  return user;
}

export async function requireParent() {
  const user = await requireUser();
  if (user.role !== "PARENT") redirect("/dashboard");
  return user;
}

async function studentAccessShape(studentId: string, organizationId: string) {
  const student = await prisma.student.findFirst({
    where: { id: studentId, organizationId, archivedAt: null },
    include: {
      providers: true,
      guardians: true,
      goals: { select: { id: true, sharedWithGuardians: true } },
    },
  });
  return student;
}

export async function assertStudentAccess(user: SessionUser, studentId: string) {
  const student = await studentAccessShape(studentId, user.organizationId);
  if (!student) notFound();
  const allowed = canAccessStudent({
    userId: user.id,
    role: user.role,
    organizationId: user.organizationId,
    caseManagerId: student.caseManagerId,
    providerIds: student.providers.map((link) => link.userId),
    guardianUserIds: student.guardians
      .map((guardian) => guardian.userId)
      .filter((id): id is string => Boolean(id)),
  });
  if (!allowed) notFound();
  return student;
}

export async function listVisibleStudents(user: SessionUser, query?: string) {
  const where = {
    organizationId: user.organizationId,
    archivedAt: null,
    ...(query
      ? {
          OR: [
            { preferredName: { contains: query } },
            { school: { contains: query } },
            { grade: { contains: query } },
          ],
        }
      : {}),
    ...(user.role === "ADMINISTRATOR"
      ? {}
      : user.role === "EDUCATOR"
        ? { caseManagerId: user.id }
        : user.role === "PROVIDER"
          ? { providers: { some: { userId: user.id } } }
          : { guardians: { some: { userId: user.id } } }),
  };

  return prisma.student.findMany({
    where,
    include: {
      caseManager: { select: { id: true, name: true } },
      providers: { include: { user: { select: { id: true, name: true, title: true } } } },
      guardians: true,
      goals: { include: { entries: { orderBy: { recordedAt: "asc" } } } },
    },
    orderBy: { preferredName: "asc" },
  });
}

export async function getStudentDetail(user: SessionUser, studentId: string) {
  await assertStudentAccess(user, studentId);
  const student = await prisma.student.findFirst({
    where: { id: studentId, organizationId: user.organizationId },
    include: {
      caseManager: { select: { id: true, name: true, title: true, email: true } },
      providers: {
        include: { user: { select: { id: true, name: true, title: true, email: true } } },
      },
      guardians: true,
      goals: {
        include: {
          entries: { include: { author: { select: { id: true, name: true } } }, orderBy: { recordedAt: "asc" } },
          createdBy: { select: { name: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      messages: {
        include: { fromUser: { select: { id: true, name: true, role: true } } },
        orderBy: { createdAt: "asc" },
      },
      consents: { orderBy: { grantedAt: "desc" } },
    },
  });
  if (!student) notFound();

  const goals =
    user.role === "PARENT"
      ? student.goals.filter((goal) => goal.sharedWithGuardians)
      : student.goals;

  await writeAudit({
    organizationId: user.organizationId,
    userId: user.id,
    action: "student.view",
    resourceType: "student",
    resourceId: student.id,
    studentId: student.id,
  });

  return {
    ...student,
    goals: goals.map((goal) => ({
      ...goal,
      signal: computeDataSignal(goal),
    })),
  };
}

export async function getGoalDetail(user: SessionUser, goalId: string) {
  const goal = await prisma.iepGoal.findFirst({
    where: { id: goalId, student: { organizationId: user.organizationId } },
    include: {
      student: {
        include: {
          providers: true,
          guardians: true,
          caseManager: { select: { id: true, name: true } },
        },
      },
      entries: {
        include: { author: { select: { id: true, name: true, role: true } } },
        orderBy: { recordedAt: "asc" },
      },
      createdBy: { select: { id: true, name: true } },
    },
  });
  if (!goal) notFound();

  const allowed = canAccessStudent(
    {
      userId: user.id,
      role: user.role,
      organizationId: user.organizationId,
      caseManagerId: goal.student.caseManagerId,
      providerIds: goal.student.providers.map((link) => link.userId),
      guardianUserIds: goal.student.guardians
        .map((guardian) => guardian.userId)
        .filter((id): id is string => Boolean(id)),
    },
    { goalId: goal.id, goalShared: goal.sharedWithGuardians },
  );
  if (!allowed) notFound();

  await writeAudit({
    organizationId: user.organizationId,
    userId: user.id,
    action: "goal.view",
    resourceType: "goal",
    resourceId: goal.id,
    studentId: goal.studentId,
  });

  return { ...goal, signal: computeDataSignal(goal) };
}

export async function getDashboardData(user: SessionUser) {
  const students = await listVisibleStudents(user);
  const goals = students.flatMap((student) =>
    student.goals.map((goal) => ({
      ...goal,
      studentName: student.preferredName,
      studentId: student.id,
      signal: computeDataSignal(goal),
    })),
  );

  const now = new Date();
  const inTwoWeeks = new Date(now.getTime() + 14 * 86_400_000);

  const deadlines = goals
    .filter((goal) => goal.status === "ACTIVE" && goal.nextReportDue <= inTwoWeeks)
    .sort((a, b) => a.nextReportDue.getTime() - b.nextReportDue.getTime());

  const needingData = goals.filter((goal) => goal.signal === "NEEDS_DATA" && goal.status === "ACTIVE");
  const needingAttention = goals.filter(
    (goal) => goal.signal === "NEEDS_ATTENTION" || goal.signal === "NEEDS_DATA",
  );

  const recentActivity = isStaff(user.role)
    ? await prisma.auditLog.findMany({
        where: { organizationId: user.organizationId },
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 8,
      })
    : [];

  return { students, goals, deadlines, needingData, needingAttention, recentActivity };
}

export async function listTeam(user: SessionUser) {
  return prisma.user.findMany({
    where: { organizationId: user.organizationId },
    select: {
      id: true,
      name: true,
      email: true,
      title: true,
      role: true,
      lastLoginAt: true,
      deactivatedAt: true,
      createdAt: true,
    },
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });
}

export async function getOrganization(user: SessionUser) {
  const org = await prisma.organization.findUnique({
    where: { id: user.organizationId },
  });
  if (!org) notFound();
  return org;
}

export async function listAudit(user: SessionUser) {
  return prisma.auditLog.findMany({
    where: { organizationId: user.organizationId },
    include: { user: { select: { name: true, role: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function searchRecords(user: SessionUser, query: string) {
  const students = await listVisibleStudents(user, query);
  const studentIds = students.map((student) => student.id);
  const goals = await prisma.iepGoal.findMany({
    where: {
      studentId: { in: studentIds },
      ...(user.role === "PARENT" ? { sharedWithGuardians: true } : {}),
      OR: [
        { officialWording: { contains: query } },
        { plainLanguageSummary: { contains: query } },
        { serviceArea: { contains: query.toUpperCase() } },
      ],
    },
    include: { student: { select: { preferredName: true } } },
    take: 20,
  });
  return { students, goals };
}
