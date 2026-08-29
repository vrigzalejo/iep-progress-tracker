import { notFound } from "next/navigation";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireStaff, assertStudentAccess } from "@/lib/queries";
import { writeAudit } from "@/lib/audit";
import { readEvidenceFile } from "@/lib/evidence-storage";

export async function GET(
  _request: Request,
  context: { params: Promise<{ entryId: string }> },
) {
  const user = await requireStaff();
  const { entryId } = await context.params;
  const entry = await prisma.progressEntry.findUnique({
    where: { id: entryId },
    include: { goal: { select: { studentId: true } } },
  });
  if (!entry?.evidencePath) notFound();
  await assertStudentAccess(user, entry.goal.studentId);

  const body = await readEvidenceFile(entry.evidencePath);
  if (!body) notFound();

  await writeAudit({
    organizationId: user.organizationId,
    userId: user.id,
    action: "evidence.download",
    resourceType: "progress",
    resourceId: entry.id,
    studentId: entry.goal.studentId,
  });

  const payload = body instanceof Uint8Array ? new Uint8Array(body) : body;
  return new NextResponse(payload, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${entry.evidenceLabel ?? "evidence"}"`,
      "Cache-Control": "no-store",
    },
  });
}
