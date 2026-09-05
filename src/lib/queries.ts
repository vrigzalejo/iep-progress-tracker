import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { can, canAccessStudent, isStaff, type Permission } from "@/lib/permissions";
import type { Role } from "@/lib/constants";
import { isDemoMode } from "@/lib/runtime";
import { computeDataSignal, deliveredMinutesInRange } from "@/lib/progress";
import { buildMinutesLedger, buildTodayCaseload, type TodayServiceInput } from "@/lib/workflow";
import { writeAudit } from "@/lib/audit";
import { ilike } from "@/lib/search-filter";
import { endOfUtcWeek, startOfUtcWeek } from "@/lib/utils";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  organizationId: string;
  mfaEnrollRequired?: boolean;
};

const goalDetailInclude = {
  entries: {
    include: {
      author: { select: { id: true, name: true, role: true } },
      trials: { orderBy: { sortOrder: "asc" as const } },
      objective: { select: { id: true, plainLanguageSummary: true } },
    },
    orderBy: { recordedAt: "asc" as const },
  },
  objectives: { orderBy: { sortOrder: "asc" as const } },
  periodStatements: {
    include: {
      period: true,
      author: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" as const },
  },
  createdBy: { select: { id: true, name: true } },
  versions: {
    include: { createdBy: { select: { name: true } } },
    orderBy: { createdAt: "desc" as const },
  },
};

export async function requireUser(): Promise<SessionUser> {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  const user = session.user;
  let mfaEnrollRequired = Boolean(user.mfaEnrollRequired);
  if (mfaEnrollRequired) {
    const record = await prisma.user.findUnique({
      where: { id: user.id },
      select: { totpEnabledAt: true, passwordHash: true },
    });
    mfaEnrollRequired =
      !isDemoMode() && Boolean(record?.passwordHash) && !record?.totpEnabledAt;
  }
  return {
    id: user.id,
    name: user.name ?? "",
    email: user.email ?? "",
    role: user.role,
    organizationId: user.organizationId,
    mfaEnrollRequired,
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
            { preferredName: ilike(query) },
            { school: ilike(query) },
            { grade: ilike(query) },
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
      consents: { orderBy: { grantedAt: "desc" } },
      goals: {
        include: {
          entries: { orderBy: { recordedAt: "asc" } },
          periodStatements: { include: { period: true } },
        },
      },
    },
    orderBy: { preferredName: "asc" },
  });
}

export async function getStudentDetail(user: SessionUser, studentId: string) {
  await assertStudentAccess(user, studentId);
  const student = await prisma.student.findFirst({
    where: { id: studentId, organizationId: user.organizationId },
    include: {
      organization: { select: { name: true } },
      caseManager: { select: { id: true, name: true, title: true, email: true } },
      providers: {
        include: { user: { select: { id: true, name: true, title: true, email: true } } },
      },
      guardians: true,
      goals: {
        include: goalDetailInclude,
        orderBy: { createdAt: "asc" },
      },
      messages: {
        where: user.role === "PARENT" ? { visibility: "FAMILY" } : {},
        include: { fromUser: { select: { id: true, name: true, role: true } } },
        orderBy: { createdAt: "asc" },
      },
      consents: { orderBy: { grantedAt: "desc" } },
      accommodations: { where: { archivedAt: null }, orderBy: { sortOrder: "asc" } },
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
      ...goalDetailInclude,
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

export async function listReportingPeriods(user: SessionUser) {
  return prisma.reportingPeriodWindow.findMany({
    where: { organizationId: user.organizationId },
    orderBy: { startsAt: "desc" },
  });
}

export function currentReportingPeriod<T extends { startsAt: Date; endsAt: Date }>(
  periods: T[],
  now = new Date(),
) {
  return (
    periods.find((period) => period.startsAt <= now && period.endsAt >= now) ?? periods[0] ?? null
  );
}

function serviceInputs(
  students: Awaited<ReturnType<typeof listVisibleStudents>>,
  userId?: string,
): TodayServiceInput[] {
  return students.flatMap((student) =>
    student.providers
      .filter((link) => (userId ? link.userId === userId : true))
      .filter((link) => link.minutesPerWeek > 0 || link.sessionsPerWeek > 0)
      .map((link) => {
        const matchingGoals = student.goals.filter((goal) => goal.serviceArea === link.serviceArea);
        const primary = matchingGoals.find((goal) => goal.status === "ACTIVE") ?? matchingGoals[0];
        return {
          studentId: student.id,
          studentName: student.preferredName,
          serviceArea: link.serviceArea,
          providerUserId: link.userId,
          providerName: link.user.name,
          minutesPerWeek: link.minutesPerWeek,
          sessionsPerWeek: link.sessionsPerWeek,
          goalId: primary?.id ?? student.goals.find((goal) => goal.status === "ACTIVE")?.id ?? null,
          goalSummary:
            primary?.plainLanguageSummary ??
            student.goals.find((goal) => goal.status === "ACTIVE")?.plainLanguageSummary ??
            null,
          entries: matchingGoals.flatMap((goal) =>
            goal.entries.map((entry) => ({
              recordedAt: entry.recordedAt,
              sessionOutcome: entry.sessionOutcome,
              minutesDelivered: entry.minutesDelivered,
            })),
          ),
        };
      }),
  );
}

export function summarizeServiceMinutes(
  students: Awaited<ReturnType<typeof listVisibleStudents>>,
  now = new Date(),
) {
  const weekStart = startOfUtcWeek(now);
  const weekEnd = endOfUtcWeek(now);
  return students.flatMap((student) =>
    student.providers
      .filter((link) => link.minutesPerWeek > 0)
      .map((link) => {
        const entries = student.goals
          .filter((goal) => goal.serviceArea === link.serviceArea)
          .flatMap((goal) => goal.entries);
        const delivered = deliveredMinutesInRange(entries, weekStart, weekEnd);
        return {
          studentId: student.id,
          studentName: student.preferredName,
          serviceArea: link.serviceArea,
          providerName: link.user.name,
          prescribed: link.minutesPerWeek,
          sessionsPerWeek: link.sessionsPerWeek,
          delivered,
          gap: Math.max(0, link.minutesPerWeek - delivered),
        };
      }),
  );
}

export async function getTodayCaseload(user: SessionUser, now = new Date()) {
  const students = await listVisibleStudents(user);
  const scoped = user.role === "PROVIDER" ? serviceInputs(students, user.id) : serviceInputs(students);
  const due = buildTodayCaseload(scoped, now);
  return { students, due, weekStart: startOfUtcWeek(now), weekEnd: endOfUtcWeek(now) };
}

export async function getMinutesLedger(user: SessionUser, now = new Date()) {
  const students = await listVisibleStudents(user);
  const scoped = user.role === "PROVIDER" ? serviceInputs(students, user.id) : serviceInputs(students);
  return {
    rows: buildMinutesLedger(scoped, now),
    weekStart: startOfUtcWeek(now),
    weekEnd: endOfUtcWeek(now),
  };
}

export async function getReportStudio(user: SessionUser, periodId?: string) {
  const students = await listVisibleStudents(user);
  const periods = await listReportingPeriods(user);
  const period = periods.find((item) => item.id === periodId) ?? currentReportingPeriod(periods);
  const snippets = await prisma.reportSnippet.findMany({
    where: { organizationId: user.organizationId },
    orderBy: { createdAt: "desc" },
    take: 40,
  });
  const rows = students.flatMap((student) =>
    student.goals
      .filter((goal) => (user.role === "PARENT" ? goal.sharedWithGuardians : true))
      .map((goal) => {
        const statement = period
          ? goal.periodStatements.find((item) => item.periodId === period.id)
          : undefined;
        return {
          studentId: student.id,
          studentName: student.preferredName,
          goalId: goal.id,
          goalSummary: goal.plainLanguageSummary,
          serviceArea: goal.serviceArea,
          signal: computeDataSignal(goal),
          written: Boolean(statement),
          progressCode: statement?.progressCode ?? null,
        };
      }),
  );
  return { students, periods, period, snippets, rows };
}

export async function countUnreadMessages(user: SessionUser) {
  const students = await listVisibleStudents(user);
  const ids = students.map((student) => student.id);
  if (ids.length === 0) return 0;
  return prisma.message.count({
    where: {
      studentId: { in: ids },
      fromUserId: { not: user.id },
      ...(user.role === "PARENT" ? { visibility: "FAMILY" } : {}),
      reads: { none: { userId: user.id } },
    },
  });
}

export async function listMessageThreads(user: SessionUser) {
  const students = await listVisibleStudents(user);
  const ids = students.map((student) => student.id);
  if (ids.length === 0) return [];
  const messages = await prisma.message.findMany({
    where: {
      studentId: { in: ids },
      ...(user.role === "PARENT" ? { visibility: "FAMILY" } : {}),
    },
    include: {
      fromUser: { select: { id: true, name: true } },
      student: { select: { id: true, preferredName: true } },
      reads: { where: { userId: user.id }, select: { readAt: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  const byStudent = new Map<
    string,
    {
      studentId: string;
      studentName: string;
      latest: (typeof messages)[number];
      unread: number;
    }
  >();
  for (const message of messages) {
    const existing = byStudent.get(message.studentId);
    const unread =
      message.fromUserId !== user.id && message.reads.length === 0 ? 1 : 0;
    if (!existing) {
      byStudent.set(message.studentId, {
        studentId: message.studentId,
        studentName: message.student.preferredName,
        latest: message,
        unread,
      });
    } else {
      existing.unread += unread;
    }
  }
  return [...byStudent.values()];
}

export async function markStudentMessagesRead(user: SessionUser, studentId: string) {
  const messages = await prisma.message.findMany({
    where: {
      studentId,
      fromUserId: { not: user.id },
      ...(user.role === "PARENT" ? { visibility: "FAMILY" } : {}),
    },
    select: { id: true },
  });
  if (messages.length === 0) return;
  await prisma.messageRead.createMany({
    data: messages.map((message) => ({ messageId: message.id, userId: user.id })),
    skipDuplicates: true,
  });
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
  const inThirtyDays = new Date(now.getTime() + 30 * 86_400_000);

  const deadlines = goals
    .filter((goal) => goal.status === "ACTIVE" && goal.nextReportDue <= inTwoWeeks)
    .sort((a, b) => a.nextReportDue.getTime() - b.nextReportDue.getTime());

  const needingData = goals.filter((goal) => goal.signal === "NEEDS_DATA" && goal.status === "ACTIVE");
  const needingAttention = goals.filter(
    (goal) => goal.signal === "NEEDS_ATTENTION" || goal.signal === "NEEDS_DATA",
  );

  const iepReviews = students
    .filter((student) => student.iepAnnualReviewAt && student.iepAnnualReviewAt <= inThirtyDays)
    .map((student) => ({
      id: student.id,
      preferredName: student.preferredName,
      iepAnnualReviewAt: student.iepAnnualReviewAt as Date,
      iepTriennialAt: student.iepTriennialAt,
    }))
    .sort((a, b) => a.iepAnnualReviewAt.getTime() - b.iepAnnualReviewAt.getTime());

  const serviceMinutes = summarizeServiceMinutes(students, now);

  const recentActivity = isStaff(user.role)
    ? await prisma.auditLog.findMany({
        where: { organizationId: user.organizationId },
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 8,
      })
    : [];

  return {
    students,
    goals,
    deadlines,
    needingData,
    needingAttention,
    iepReviews,
    serviceMinutes,
    recentActivity,
  };
}

export async function listTeam(user: SessionUser) {
  const team = await prisma.user.findMany({
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
      passwordHash: true,
    },
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });
  return team.map(({ passwordHash, ...member }) => ({
    ...member,
    hasPassword: Boolean(passwordHash),
  }));
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
  const caseload = await listVisibleStudents(user);
  const students = await listVisibleStudents(user, query);
  const caseloadIds = caseload.map((student) => student.id);
  const goals =
    caseloadIds.length === 0
      ? []
      : await prisma.iepGoal.findMany({
          where: {
            studentId: { in: caseloadIds },
            ...(user.role === "PARENT" ? { sharedWithGuardians: true } : {}),
            OR: [
              { officialWording: ilike(query) },
              { plainLanguageSummary: ilike(query) },
              { measurableTarget: ilike(query) },
              { serviceArea: ilike(query) },
              { student: { preferredName: ilike(query) } },
            ],
          },
          include: { student: { select: { preferredName: true } } },
          take: 20,
        });
  return { students, goals };
}

export async function listFiledDocuments(user: SessionUser, studentId: string) {
  await assertStudentAccess(user, studentId);
  return prisma.filedDocument.findMany({
    where: { studentId, organizationId: user.organizationId },
    include: { createdBy: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}

export async function listMeetingAttendance(user: SessionUser, studentId: string, meetingOn: Date) {
  await assertStudentAccess(user, studentId);
  return prisma.meetingAttendance.findMany({
    where: { studentId, meetingOn },
    orderBy: { attendeeName: "asc" },
  });
}
