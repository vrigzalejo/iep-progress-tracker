import { NextResponse } from "next/server";
import { requireStaff, assertStudentAccess } from "@/lib/queries";
import { prisma } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import { can } from "@/lib/permissions";

export async function GET() {
  const user = await requireStaff();
  if (!can(user.role, "student.export")) {
    return NextResponse.json({ error: "Not authorized to export." }, { status: 403 });
  }

  const students = await prisma.student.findMany({
    where: {
      organizationId: user.organizationId,
      archivedAt: null,
      ...(user.role === "EDUCATOR"
        ? { caseManagerId: user.id }
        : user.role === "PROVIDER"
          ? { providers: { some: { userId: user.id } } }
          : {}),
    },
    include: {
      goals: { include: { entries: true } },
    },
  });

  for (const student of students) {
    await assertStudentAccess(user, student.id);
  }

  const header = [
    "student_preferred_name",
    "grade",
    "school",
    "goal_plain_language",
    "service_area",
    "status",
    "target",
    "latest_score",
    "latest_date",
  ];
  const rows = students.flatMap((student) =>
    student.goals.map((goal) => {
      const latest = [...goal.entries].sort(
        (a, b) => a.recordedAt.getTime() - b.recordedAt.getTime(),
      ).at(-1);
      return [
        csv(student.preferredName),
        csv(student.grade),
        csv(student.school),
        csv(goal.plainLanguageSummary),
        csv(goal.serviceArea),
        csv(goal.status),
        csv(String(goal.targetValue)),
        csv(latest ? String(latest.score) : ""),
        csv(latest ? latest.recordedAt.toISOString().slice(0, 10) : ""),
      ].join(",");
    }),
  );

  await writeAudit({
    organizationId: user.organizationId,
    userId: user.id,
    action: "export.csv",
    resourceType: "organization",
    resourceId: user.organizationId,
  });

  return new NextResponse([header.join(","), ...rows].join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=progresspath-export.csv",
      "Cache-Control": "no-store",
    },
  });
}

function csv(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}
