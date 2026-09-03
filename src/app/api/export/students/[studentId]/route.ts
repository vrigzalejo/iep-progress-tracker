import { NextResponse } from "next/server";
import { requirePermission, assertStudentAccess } from "@/lib/queries";
import { writeAudit } from "@/lib/audit";
import { buildStudentFileZip } from "@/lib/student-file";

export async function GET(
  _request: Request,
  context: { params: Promise<{ studentId: string }> },
) {
  const user = await requirePermission("privacy.manage");
  const { studentId } = await context.params;
  await assertStudentAccess(user, studentId);
  const bundle = await buildStudentFileZip(user.organizationId, studentId);
  if (!bundle) {
    return NextResponse.json({ error: "Student not found." }, { status: 404 });
  }

  await writeAudit({
    organizationId: user.organizationId,
    userId: user.id,
    action: "export.student_file",
    resourceType: "student",
    resourceId: studentId,
    studentId,
    details: "format=zip",
  });

  return new NextResponse(new Uint8Array(bundle.zip), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename=${bundle.filename}`,
      "Cache-Control": "no-store",
    },
  });
}
