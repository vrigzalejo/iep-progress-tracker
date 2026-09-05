import Link from "next/link";
import { requireUser, getStudentDetail, listFiledDocuments } from "@/lib/queries";
import { FilePdfForm, FiledDocumentList } from "@/components/file-pdf-form";
import { ProgressChart } from "@/components/progress-chart";
import { ProgressCodeBadge } from "@/components/progress-code-badge";
import { StatusIndicator } from "@/components/status-indicator";
import { PrintButton } from "@/components/print-button";
import { Logo } from "@/components/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatDateLong } from "@/lib/utils";
import { deliveredMinutesInRange } from "@/lib/progress";
import {
  SERVICE_AREA_LABELS,
  type ProgressCode,
  type ServiceArea,
} from "@/lib/constants";
import { isStaff } from "@/lib/permissions";
import { APP_NAME } from "@/lib/brand";

export const metadata = { title: "IEP meeting packet" };

export default async function MeetingPacketPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const user = await requireUser();
  const { studentId } = await params;
  const student = await getStudentDetail(user, studentId);
  const monthStart = new Date(new Date().getTime() - 30 * 86_400_000);
  const familyMessages = student.messages.filter((message) => message.visibility === "FAMILY");
  const filed = isStaff(user.role) ? await listFiledDocuments(user, studentId) : [];

  return (
    <div className="mx-auto max-w-3xl space-y-8 bg-white p-6 print:p-0">
      <div className="no-print flex flex-wrap justify-between gap-3">
        <Button asChild variant="secondary">
          <Link href={`/students/${student.id}`}>Back to profile</Link>
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href={`/reports/${student.id}/meeting/room`}>Meeting room</Link>
          </Button>
          {isStaff(user.role) ? (
            <FilePdfForm
              studentId={student.id}
              kind="PACKET"
              returnTo={`/reports/${student.id}/meeting`}
              label="File PDF"
            />
          ) : null}
          <PrintButton />
        </div>
      </div>
      {filed.length > 0 ? <FiledDocumentList documents={filed} /> : null}
      <header className="flex items-start justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <Logo />
          <div>
            <p className="font-serif text-2xl">IEP meeting packet</p>
            <p className="text-sm text-muted">Prepared from {APP_NAME} session data</p>
          </div>
        </div>
        <p className="text-sm">{formatDateLong(new Date())}</p>
      </header>
      <section>
        <h1 className="font-serif text-3xl">{student.preferredName}</h1>
        <p>
          Grade {student.grade} · {student.school}
        </p>
        <p className="text-sm">Case manager: {student.caseManager.name}</p>
        <p className="mt-2 text-sm">
          Annual review: {student.iepAnnualReviewAt ? formatDate(student.iepAnnualReviewAt) : "Not set"}
          {" · "}
          Triennial: {student.iepTriennialAt ? formatDate(student.iepTriennialAt) : "Not set"}
        </p>
      </section>
      {student.presentLevels ? (
        <section>
          <h2 className="font-serif text-xl">Present levels on file</h2>
          <p className="mt-2 text-sm">{student.presentLevels}</p>
        </section>
      ) : null}
      <section>
        <h2 className="font-serif text-xl">Service minutes, last 30 days</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {student.providers.map((link) => {
            const delivered = deliveredMinutesInRange(
              student.goals
                .filter((goal) => goal.serviceArea === link.serviceArea)
                .flatMap((goal) => goal.entries),
              monthStart,
              new Date(),
            );
            const expected = Math.round((link.minutesPerWeek * 30) / 7);
            return (
              <li key={link.userId} className="flex justify-between gap-3 border-b border-border py-2">
                <span>
                  {SERVICE_AREA_LABELS[link.serviceArea as ServiceArea]} · {link.user.name}
                </span>
                <span>
                  {delivered} delivered
                  {link.minutesPerWeek > 0 ? ` / ~${expected} expected` : ""}
                </span>
              </li>
            );
          })}
        </ul>
      </section>
      {student.goals.map((goal) => {
        const statement = goal.periodStatements[0];
        const present = goal.entries.filter((entry) => entry.sessionOutcome === "PRESENT");
        const absences = goal.entries.filter((entry) => entry.sessionOutcome !== "PRESENT");
        return (
          <article key={goal.id} className="break-inside-avoid border-t border-border pt-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-forest">
              {SERVICE_AREA_LABELS[goal.serviceArea as ServiceArea]}
            </p>
            <h2 className="mt-1 font-serif text-2xl">{goal.plainLanguageSummary}</h2>
            <p className="mt-2 text-sm">{goal.officialWording}</p>
            {goal.objectives.length > 0 ? (
              <ul className="mt-2 list-disc pl-5 text-sm">
                {goal.objectives.map((objective) => (
                  <li key={objective.id}>{objective.plainLanguageSummary}</li>
                ))}
              </ul>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-3">
              <StatusIndicator signal={goal.signal} />
              {statement ? <ProgressCodeBadge code={statement.progressCode as ProgressCode} /> : null}
            </div>
            {statement ? <p className="mt-3 text-sm">{statement.narrative}</p> : null}
            <p className="mt-2 text-sm text-muted">
              {present.length} present session{present.length === 1 ? "" : "s"}
              {absences.length ? ` · ${absences.length} absent/declined/makeup` : ""}
            </p>
            <div className="mt-4">
              <ProgressChart entries={present} targetValue={goal.targetValue} unit={goal.unit} />
            </div>
          </article>
        );
      })}
      <section className="border-t border-border pt-6">
        <h2 className="font-serif text-xl">Family questions on file</h2>
        {familyMessages.length === 0 ? (
          <p className="mt-2 text-sm text-muted">No family messages yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {familyMessages.slice(-8).map((message) => (
              <li key={message.id} className="text-sm">
                <span className="text-muted">
                  {message.fromUser.name} · {formatDate(message.createdAt)}:
                </span>{" "}
                {message.body}
              </li>
            ))}
          </ul>
        )}
      </section>
      {isStaff(user.role) ? (
        <p className="text-xs text-muted">
          Staff-only messages are omitted from this packet.
        </p>
      ) : (
        <Badge>Family copy</Badge>
      )}
    </div>
  );
}
