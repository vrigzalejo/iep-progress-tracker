import Link from "next/link";
import { requireStaff, getReportStudio } from "@/lib/queries";
import { PrintButton } from "@/components/print-button";
import { ProgressCodeBadge } from "@/components/progress-code-badge";
import { type ProgressCode } from "@/lib/constants";

export const metadata = { title: "Print completed reports" };

export default async function StudioPrintPage({
  searchParams,
}: {
  searchParams: Promise<{ periodId?: string }>;
}) {
  const user = await requireStaff();
  const { periodId } = await searchParams;
  const { rows, period, students } = await getReportStudio(user, periodId);
  const completed = rows.filter((row) => row.written);
  const studentIds = [...new Set(completed.map((row) => row.studentId))];

  return (
    <div className="mx-auto max-w-3xl space-y-8 bg-white p-6 print:p-0">
      <div className="no-print flex justify-between gap-3">
        <Link href="/reports/studio" className="text-forest hover:underline">
          ← Report studio
        </Link>
        <PrintButton />
      </div>
      <h1 className="font-serif text-3xl">Completed period reports</h1>
      <p className="text-muted">{period?.label ?? "Current period"}</p>
      {studentIds.length === 0 ? (
        <p>No completed comments in this period yet.</p>
      ) : (
        <ul className="space-y-6">
          {studentIds.map((studentId) => {
            const student = students.find((item) => item.id === studentId);
            const goals = completed.filter((row) => row.studentId === studentId);
            return (
              <li key={studentId} className="break-inside-avoid border-t border-border pt-4">
                <h2 className="font-serif text-2xl">{student?.preferredName ?? "Student"}</h2>
                {goals.map((row) => (
                  <p key={row.goalId} className="mt-2 text-sm">
                    <ProgressCodeBadge code={row.progressCode as ProgressCode} /> {row.goalSummary}
                  </p>
                ))}
                <p className="no-print mt-2 text-sm">
                  <Link className="underline" href={`/reports/${studentId}${period ? `?periodId=${period.id}` : ""}`}>
                    Open full print preview
                  </Link>
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
