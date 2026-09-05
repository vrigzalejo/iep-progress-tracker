import { prisma } from "@/lib/db";
import { APP_NAME } from "@/lib/brand";
import { hasCurrentConsent } from "@/lib/consent";
import { writeAudit } from "@/lib/audit";
import { sendTransactionalMail } from "@/lib/mail";
import { appOrigin } from "@/lib/runtime";
import {
  buildFamilyDigest,
  digestUnsubscribeToken,
  formatDigestText,
  shouldSendWeeklyDigest,
} from "@/lib/digest";

export async function sendWeeklyFamilyDigests(now = new Date()) {
  if (!shouldSendWeeklyDigest(now)) {
    return { sent: 0, skipped: "not-friday" as const };
  }
  const secret = process.env.AUTH_SECRET?.trim();
  if (!secret) return { sent: 0, skipped: "no-secret" as const };

  const contacts = await prisma.guardianContact.findMany({
    where: {
      digestOptIn: true,
      digestUnsubscribedAt: null,
      email: { not: "" },
    },
    include: {
      student: {
        include: {
          organization: { select: { noticeVersion: true } },
          consents: true,
          goals: {
            include: {
              entries: {
                select: {
                  recordedAt: true,
                  sessionOutcome: true,
                  score: true,
                  homeCarryover: true,
                },
                orderBy: { recordedAt: "asc" },
              },
            },
          },
        },
      },
    },
  });

  let sent = 0;
  for (const contact of contacts) {
    if (
      !hasCurrentConsent(
        contact.student.consents,
        contact.student.organization.noticeVersion,
        contact.name,
      )
    ) {
      continue;
    }
    const digest = buildFamilyDigest(
      {
        preferredName: contact.student.preferredName,
        goals: contact.student.goals,
      },
      now,
    );
    const token = digestUnsubscribeToken(contact.id, secret);
    const text = formatDigestText({
      preferredName: contact.student.preferredName,
      weekLabel: digest.weekLabel,
      sections: digest.sections,
      portalUrl: `${appOrigin()}/parent?studentId=${contact.studentId}`,
      unsubscribeUrl: `${appOrigin()}/api/digest/unsubscribe?t=${token}`,
      productName: APP_NAME,
    });
    const ok = await sendTransactionalMail({
      to: contact.email,
      subject: digest.subject,
      text,
    });
    if (!ok) continue;
    sent += 1;
    await writeAudit({
      organizationId: contact.student.organizationId,
      userId: contact.userId ?? contact.student.caseManagerId,
      action: "digest.sent",
      resourceType: "student",
      resourceId: contact.studentId,
      studentId: contact.studentId,
      details: "weekly-family-digest",
    });
  }
  return { sent, skipped: null };
}
