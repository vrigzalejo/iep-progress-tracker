import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import { parseDigestUnsubscribeToken } from "@/lib/digest";

export const dynamic = "force-dynamic";

function htmlPage(title: string, body: string) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>${title}</title></head><body><p>${body}</p></body></html>`;
}

export async function GET(request: Request) {
  const secret = process.env.AUTH_SECRET?.trim();
  const token = new URL(request.url).searchParams.get("t") ?? "";
  const contactId = secret ? parseDigestUnsubscribeToken(token, secret) : null;
  if (!contactId) {
    return new NextResponse(htmlPage("Unsubscribe", "This unsubscribe link is not valid."), {
      status: 400,
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
    });
  }

  const contact = await prisma.guardianContact.findUnique({
    where: { id: contactId },
    select: {
      id: true,
      userId: true,
      studentId: true,
      student: { select: { organizationId: true, caseManagerId: true } },
    },
  });
  if (!contact) {
    return new NextResponse(htmlPage("Unsubscribe", "This unsubscribe link is not valid."), {
      status: 400,
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
    });
  }

  await prisma.guardianContact.update({
    where: { id: contact.id },
    data: { digestOptIn: false, digestUnsubscribedAt: new Date() },
  });
  await writeAudit({
    organizationId: contact.student.organizationId,
    userId: contact.userId ?? contact.student.caseManagerId,
    action: "digest.unsubscribed",
    resourceType: "student",
    resourceId: contact.studentId,
    studentId: contact.studentId,
    details: "email-link",
  });

  return new NextResponse(
    htmlPage("Unsubscribe", "Weekly emails are off for this family contact."),
    {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
    },
  );
}
