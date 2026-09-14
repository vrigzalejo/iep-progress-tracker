import { notFound } from "next/navigation";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser, assertStudentAccess } from "@/lib/queries";
import { writeAudit } from "@/lib/audit";
import { readEvidenceFile } from "@/lib/evidence-storage";

function contentTypeFor(path: string, label: string | null, inline: boolean) {
  const name = `${label ?? ""} ${path}`.toLowerCase();
  if (name.includes(".png")) return "image/png";
  if (name.includes(".jpg") || name.includes(".jpeg")) return "image/jpeg";
  if (name.includes(".gif")) return "image/gif";
  if (name.includes(".webp")) return "image/webp";
  if (name.includes(".pdf")) return "application/pdf";
  return inline ? "application/octet-stream" : "application/octet-stream";
}

export async function GET(
  request: Request,
  context: { params: Promise<{ entryId: string }> },
) {
  const user = await requireUser();
  const { entryId } = await context.params;
  const inline = new URL(request.url).searchParams.get("inline") === "1";
  const entry = await prisma.progressEntry.findUnique({
    where: { id: entryId },
    include: { goal: { select: { studentId: true, sharedWithGuardians: true } } },
  });
  if (!entry?.evidencePath) notFound();
  if (user.role === "PARENT" && !entry.goal.sharedWithGuardians) notFound();
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
  const type = contentTypeFor(entry.evidencePath, entry.evidenceLabel, inline);
  return new NextResponse(payload, {
    headers: {
      "Content-Type": type,
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${entry.evidenceLabel ?? "evidence"}"`,
      "Cache-Control": "no-store",
    },
  });
}
