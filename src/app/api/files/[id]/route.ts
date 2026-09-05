import { notFound } from "next/navigation";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireStaff, assertStudentAccess } from "@/lib/queries";
import { writeAudit } from "@/lib/audit";
import { readEvidenceFile } from "@/lib/evidence-storage";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await requireStaff();
  const { id } = await context.params;
  const filed = await prisma.filedDocument.findFirst({
    where: { id, organizationId: user.organizationId },
  });
  if (!filed) notFound();
  await assertStudentAccess(user, filed.studentId);

  const body = await readEvidenceFile(filed.storagePath);
  if (!body) notFound();

  await writeAudit({
    organizationId: user.organizationId,
    userId: user.id,
    action: "document.download",
    resourceType: "filedDocument",
    resourceId: filed.id,
    studentId: filed.studentId,
    details: filed.kind,
  });

  const payload = body instanceof Uint8Array ? new Uint8Array(body) : body;
  const kind = filed.kind === "REPORT" ? "report" : "packet";
  return new NextResponse(payload, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${kind}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
