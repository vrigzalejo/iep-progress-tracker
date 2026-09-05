import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendWeeklyFamilyDigests } from "@/lib/digest-send";
import { notifyOpenReportingWindows, runRetentionSweep } from "@/lib/retention-sweep";

export const dynamic = "force-dynamic";

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const orgs = await prisma.organization.findMany({ select: { id: true } });
  let purged = 0;
  for (const org of orgs) {
    const admin = await prisma.user.findFirst({
      where: { organizationId: org.id, role: "ADMINISTRATOR", deactivatedAt: null },
      select: { id: true },
    });
    if (!admin) continue;
    const result = await runRetentionSweep({
      organizationId: org.id,
      actorUserId: admin.id,
      dryRun: false,
    });
    purged += result.candidateCount;
  }

  const notices = await notifyOpenReportingWindows();
  const digest = await sendWeeklyFamilyDigests();
  return NextResponse.json({
    ok: true,
    purged,
    reportingNotices: notices.sent,
    familyDigests: digest.sent,
  });
}

export const POST = GET;
