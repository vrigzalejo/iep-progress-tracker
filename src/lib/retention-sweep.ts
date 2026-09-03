import { prisma } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import { deleteEvidenceFile } from "@/lib/evidence-storage";
import { sendReportingWindowMail } from "@/lib/mail";
import { isPastRetention, retentionCutoff } from "@/lib/retention";

export type RetentionPreview = {
  organizationId: string;
  retentionDays: number;
  cutoff: string;
  candidateCount: number;
  candidates: { id: string; preferredName: string; archivedAt: string }[];
};

export async function previewRetentionSweep(
  organizationId: string,
  now = new Date(),
): Promise<RetentionPreview> {
  const org = await prisma.organization.findUnique({ where: { id: organizationId } });
  if (!org) {
    return {
      organizationId,
      retentionDays: 0,
      cutoff: now.toISOString(),
      candidateCount: 0,
      candidates: [],
    };
  }
  const cutoff = retentionCutoff(now, org.retentionDays);
  const archived = await prisma.student.findMany({
    where: { organizationId, archivedAt: { not: null } },
    select: { id: true, preferredName: true, archivedAt: true },
  });
  const candidates = archived
    .filter((student) => student.archivedAt && isPastRetention(student.archivedAt, cutoff))
    .map((student) => ({
      id: student.id,
      preferredName: student.preferredName,
      archivedAt: student.archivedAt!.toISOString(),
    }));
  return {
    organizationId,
    retentionDays: org.retentionDays,
    cutoff: cutoff.toISOString(),
    candidateCount: candidates.length,
    candidates,
  };
}

export async function runRetentionSweep(options: {
  organizationId: string;
  actorUserId: string;
  dryRun: boolean;
  now?: Date;
}) {
  const preview = await previewRetentionSweep(options.organizationId, options.now);
  if (options.dryRun || preview.candidateCount === 0) {
    await writeAudit({
      organizationId: options.organizationId,
      userId: options.actorUserId,
      action: options.dryRun ? "privacy.retention_dry_run" : "privacy.retention_sweep",
      resourceType: "organization",
      resourceId: options.organizationId,
      details: `candidates=${preview.candidateCount} dryRun=${options.dryRun ? "true" : "false"}`,
    });
    return preview;
  }

  let removedEvidence = 0;
  for (const candidate of preview.candidates) {
    const entries = await prisma.progressEntry.findMany({
      where: { goal: { studentId: candidate.id }, evidencePath: { not: null } },
      select: { evidencePath: true },
    });
    for (const entry of entries) {
      if (!entry.evidencePath) continue;
      const deleted = await deleteEvidenceFile(entry.evidencePath);
      if (deleted) removedEvidence += 1;
    }
    await prisma.student.delete({ where: { id: candidate.id } });
  }

  await writeAudit({
    organizationId: options.organizationId,
    userId: options.actorUserId,
    action: "privacy.retention_sweep",
    resourceType: "organization",
    resourceId: options.organizationId,
    details: `purged=${preview.candidateCount} evidenceFilesRemoved=${removedEvidence} dryRun=false`,
  });
  return preview;
}

export async function notifyOpenReportingWindows(now = new Date()) {
  const dayAgo = new Date(now.getTime() - 86_400_000);
  const periods = await prisma.reportingPeriodWindow.findMany({
    where: { startsAt: { gte: dayAgo, lte: now } },
    include: { organization: { include: { users: true } } },
  });
  let sent = 0;
  for (const period of periods) {
    const staff = period.organization.users.filter(
      (user) =>
        !user.deactivatedAt &&
        (user.role === "ADMINISTRATOR" || user.role === "EDUCATOR" || user.role === "PROVIDER"),
    );
    for (const user of staff) {
      const ok = await sendReportingWindowMail(user.email);
      if (ok) sent += 1;
    }
  }
  return { windows: periods.length, sent };
}
