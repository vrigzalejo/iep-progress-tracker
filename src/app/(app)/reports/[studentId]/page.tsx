import { requireUser, getStudentDetail } from "@/lib/queries";
import { ProgressChart } from "@/components/progress-chart";
import { StatusIndicator } from "@/components/status-indicator";
import { PrintButton } from "@/components/print-button";
import { Logo } from "@/components/logo";
import { formatDateLong } from "@/lib/utils";
import { SERVICE_AREA_LABELS, type ServiceArea } from "@/lib/constants";

export const metadata = { title: "Printable progress report" };

export default async function ReportPreviewPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const user = await requireUser();
  const { studentId } = await params;
  const student = await getStudentDetail(user, studentId);

  return (
    <div className="mx-auto max-w-3xl space-y-8 bg-white p-6 print:p-0">
      <div className="no-print flex justify-end">
        <PrintButton />
      </div>
      <header className="flex items-start justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <Logo />
          <div>
            <p className="font-serif text-2xl">ProgressPath report</p>
            <p className="text-sm text-muted">Maple Ridge Demonstration School</p>
          </div>
        </div>
        <p className="text-sm">{formatDateLong(new Date())}</p>
      </header>
      <section>
        <h1 className="font-serif text-3xl">{student.preferredName}</h1>
        <p>
          Grade {student.grade} · {student.school}
        </p>
        <p className="text-sm text-muted">Case manager: {student.caseManager.name}</p>
      </section>
      <p className="rounded-lg bg-paper p-4 text-sm">
        This report uses everyday language so families can follow progress. Official IEP wording is
        included under each goal. Indicators such as “on track” describe recent scores. They are not
        grades, evaluations, or IEP team decisions.
      </p>
      {student.goals.map((goal) => {
        const latest = goal.entries.at(-1);
        return (
          <article key={goal.id} className="break-inside-avoid border-t border-border pt-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-forest">
              {SERVICE_AREA_LABELS[goal.serviceArea as ServiceArea]}
            </p>
            <h2 className="mt-1 font-serif text-2xl">{goal.plainLanguageSummary}</h2>
            <p className="mt-2 text-sm">
              <strong>Official goal:</strong> {goal.officialWording}
            </p>
            <p className="mt-2 text-sm">
              <strong>Starting point:</strong> {goal.baseline}
            </p>
            <p className="text-sm">
              <strong>What we are working toward:</strong> {goal.measurableTarget}
            </p>
            <div className="mt-3">
              <StatusIndicator signal={goal.signal} showHint />
            </div>
            {latest ? (
              <p className="mt-3 text-sm">
                Latest score: {latest.score} {goal.unit} on {formatDateLong(latest.recordedAt)}.{" "}
                {latest.notes}
              </p>
            ) : (
              <p className="mt-3 text-sm">A progress score has not been recorded yet.</p>
            )}
            <div className="mt-4">
              <ProgressChart entries={goal.entries} targetValue={goal.targetValue} unit={goal.unit} />
            </div>
          </article>
        );
      })}
      <footer className="border-t border-border pt-4 text-xs text-muted">
        Generated for authorized ProgressPath users. Demonstration records are fictional. Student
        educational records are sensitive; share only with people who have a legitimate educational
        interest or parental rights.
      </footer>
    </div>
  );
}
