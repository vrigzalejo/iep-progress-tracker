import { notFound } from "next/navigation";
import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/db";
import { requireStaff, assertStudentAccess } from "@/lib/queries";
import { writeAudit } from "@/lib/audit";

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

  const filePath = path.join(process.cwd(), "data", "uploads", entry.evidencePath);
  const bytes = await readFile(filePath).catch(() => null);
  if (!bytes) notFound();

  await writeAudit({
    organizationId: user.organizationId,
    userId: user.id,
    action: "evidence.download",
    resourceType: "progress",
    resourceId: entry.id,
    studentId: entry.goal.studentId,
  });

  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${entry.evidenceLabel ?? "evidence"}"`,
      "Cache-Control": "no-store",
    },
  });
}
