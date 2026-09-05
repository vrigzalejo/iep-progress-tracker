import { prisma } from "@/lib/db";
import { APP_NAME, APP_SLUG } from "@/lib/brand";
import { zipUtf8Files } from "@/lib/zip";

function json(value: unknown) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

export async function buildStudentFileZip(organizationId: string, studentId: string) {
  const student = await prisma.student.findFirst({
    where: { id: studentId, organizationId },
    include: {
      organization: { select: { name: true, noticeVersion: true, retentionDays: true } },
      caseManager: { select: { name: true, email: true, title: true, role: true } },
      providers: {
        include: { user: { select: { name: true, email: true, title: true, role: true } } },
      },
      guardians: {
        select: { name: true, relationship: true, email: true, phone: true, digestOptIn: true },
      },
      attendances: { orderBy: [{ meetingOn: "asc" }, { attendeeName: "asc" }] },
      filedDocuments: {
        select: {
          kind: true,
          periodLabel: true,
          createdAt: true,
          createdBy: { select: { name: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      consents: { orderBy: { grantedAt: "asc" } },
      accommodations: { where: { archivedAt: null }, orderBy: { sortOrder: "asc" } },
      goals: {
        include: {
          versions: { orderBy: { createdAt: "asc" } },
          objectives: { orderBy: { sortOrder: "asc" } },
          entries: {
            include: {
              trials: { orderBy: { sortOrder: "asc" } },
              author: { select: { name: true, role: true } },
              objective: { select: { plainLanguageSummary: true } },
            },
            orderBy: { recordedAt: "asc" },
          },
          periodStatements: {
            include: {
              period: { select: { label: true, startsAt: true, endsAt: true } },
              author: { select: { name: true } },
            },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      messages: {
        include: { fromUser: { select: { name: true, role: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!student) return null;

  const audit = await prisma.auditLog.findMany({
    where: { studentId, organizationId },
    select: {
      createdAt: true,
      action: true,
      resourceType: true,
      resourceId: true,
      details: true,
      user: { select: { name: true, role: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const exportedAt = new Date().toISOString();
  const profile = {
    exportedAt,
    product: APP_NAME,
    organization: student.organization.name,
    noticeVersion: student.organization.noticeVersion,
    student: {
      preferredName: student.preferredName,
      grade: student.grade,
      school: student.school,
      archivedAt: student.archivedAt,
      iepAnnualReviewAt: student.iepAnnualReviewAt,
      iepTriennialAt: student.iepTriennialAt,
      presentLevels: student.presentLevels,
      caseManager: student.caseManager,
      providers: student.providers.map((link) => ({
        serviceArea: link.serviceArea,
        minutesPerWeek: link.minutesPerWeek,
        sessionsPerWeek: link.sessionsPerWeek,
        staff: link.user,
      })),
      guardians: student.guardians,
      accommodations: student.accommodations.map((item) => item.label),
    },
  };

  const zip = zipUtf8Files([
    { name: "README.txt", content: studentFileReadme(exportedAt) },
    { name: "profile.json", content: json(profile) },
    {
      name: "goals.json",
      content: json(
        student.goals.map((goal) => ({
          officialWording: goal.officialWording,
          plainLanguageSummary: goal.plainLanguageSummary,
          baseline: goal.baseline,
          measurableTarget: goal.measurableTarget,
          targetValue: goal.targetValue,
          unit: goal.unit,
          serviceArea: goal.serviceArea,
          measurementMethod: goal.measurementMethod,
          status: goal.status,
          startDate: goal.startDate,
          endDate: goal.endDate,
          sharedWithGuardians: goal.sharedWithGuardians,
          consecutiveSessionsNeeded: goal.consecutiveSessionsNeeded,
          maxPromptForMastery: goal.maxPromptForMastery,
          objectives: goal.objectives,
          periodStatements: goal.periodStatements,
          versions: goal.versions,
        })),
      ),
    },
    {
      name: "progress.json",
      content: json(
        student.goals.flatMap((goal) =>
          goal.entries.map((entry) => ({
            goal: goal.plainLanguageSummary,
            recordedAt: entry.recordedAt,
            score: entry.score,
            sessionOutcome: entry.sessionOutcome,
            setting: entry.setting,
            minutesDelivered: entry.minutesDelivered,
            makeupScheduledFor: entry.makeupScheduledFor,
            makeupLocation: entry.makeupLocation,
            accommodations: entry.accommodations,
            homeCarryover: entry.homeCarryover,
            notes: entry.notes,
            evidenceLabel: entry.evidenceLabel,
            hasEvidenceFile: Boolean(entry.evidencePath),
            author: entry.author,
            trials: entry.trials,
            objective: entry.objective?.plainLanguageSummary ?? null,
          })),
        ),
      ),
    },
    {
      name: "minutes-ledger.json",
      content: json(
        student.providers.map((link) => ({
          serviceArea: link.serviceArea,
          prescribedMinutesPerWeek: link.minutesPerWeek,
          sessionsPerWeek: link.sessionsPerWeek,
          staff: link.user,
          thisWeekEntries: student.goals
            .filter((goal) => goal.serviceArea === link.serviceArea)
            .flatMap((goal) =>
              goal.entries.map((entry) => ({
                recordedAt: entry.recordedAt,
                sessionOutcome: entry.sessionOutcome,
                minutesDelivered: entry.minutesDelivered,
                makeupScheduledFor: entry.makeupScheduledFor,
                makeupLocation: entry.makeupLocation,
              })),
            ),
        })),
      ),
    },
    { name: "messages.json", content: json(student.messages) },
    {
      name: "meetings.json",
      content: json(
        student.attendances.map((row) => ({
          meetingOn: row.meetingOn,
          attendeeName: row.attendeeName,
          present: row.present,
        })),
      ),
    },
    {
      name: "filed-documents.json",
      content: json(
        student.filedDocuments.map((doc) => ({
          kind: doc.kind,
          periodLabel: doc.periodLabel,
          createdAt: doc.createdAt,
          createdBy: doc.createdBy.name,
        })),
      ),
    },
    { name: "consents.json", content: json(student.consents) },
    { name: "audit.json", content: json(audit) },
  ]);

  const date = exportedAt.slice(0, 10);
  const filename = `${APP_SLUG}-student-file-${date}.zip`;
  return { zip, filename, studentId: student.id };
}

function studentFileReadme(exportedAt: string) {
  return [
    `${APP_NAME} student education record export`,
    `Exported at ${exportedAt} (UTC).`,
    "",
    "This zip is the school's copy of one student record for a records request.",
    "It includes profile fields, standing accommodations, goals and wording versions,",
    "progress entries, a service-minutes ledger, family and staff messages,",
    "meeting attendance names, filed report/packet metadata,",
    "consent acknowledgments, and audit actions scoped to this student.",
    "Evidence binaries and filed PDF bytes are not copied here; progress.json notes whether a file exists.",
    "Do not email this archive to a personal account.",
    "",
  ].join("\n");
}
