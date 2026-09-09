import Link from "next/link";
import { requireParent, listVisibleStudents, getStudentDetail } from "@/lib/queries";
import { StatusIndicator } from "@/components/status-indicator";
import { ProgressCodeBadge } from "@/components/progress-code-badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Label, Textarea } from "@/components/ui/input";
import { sendMessageAction, setDigestOptInAction } from "@/app/actions";
import { formatDate } from "@/lib/utils";
import { Alert, EmptyState } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import type { ProgressCode } from "@/lib/constants";

export const metadata = { title: "Family portal" };

export default async function ParentPage({
  searchParams,
}: {
  searchParams: Promise<{ studentId?: string; saved?: string }>;
}) {
  const user = await requireParent();
  const params = await searchParams;
  const students = await listVisibleStudents(user);
  const selected =
    students.find((student) => student.id === params.studentId) ?? students[0] ?? null;
  const student = selected ? await getStudentDetail(user, selected.id) : null;

  if (!student) {
    return (
      <EmptyState title="No student is linked to this account">
        Ask your school’s special education office to connect this family account to a student
        profile.
      </EmptyState>
    );
  }

  const digestContact = student.guardians.find((guardian) => guardian.userId === user.id);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-forest">Family portal</p>
        <h1 className="font-serif text-3xl">{student.preferredName}’s progress</h1>
        <p className="mt-2 max-w-2xl text-muted">
          You can see goals the school has shared, recent progress in everyday language, reports,
          and messages with the team. You cannot see other families’ students.
        </p>
      </header>

      {students.length > 1 ? (
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Linked students">
          {students.map((option) => (
            <Link
              key={option.id}
              href={`/parent?studentId=${option.id}`}
              className={cn(
                "min-h-11 rounded-full border px-4 py-2 text-sm font-semibold",
                option.id === student.id
                  ? "border-forest bg-forest text-white"
                  : "border-border bg-white hover:bg-paper",
              )}
            >
              {option.preferredName}
            </Link>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <Link href={`/reports/${student.id}`}>Open progress report</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href={`/reports/${student.id}/meeting`}>Meeting packet</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/privacy">Privacy and consent</Link>
        </Button>
      </div>

      {params.saved === "digest" ? (
        <Alert title="Weekly email preference saved" tone="success">
          The school will only send this update if you opted in. It uses scores and home-carryover
          notes already on file.
        </Alert>
      ) : null}

      {digestContact ? (
        <Card>
          <CardTitle>Weekly email</CardTitle>
          <p className="mt-2 text-sm text-muted">
            Optional Friday update for {student.preferredName}: shared goals, last week’s scores, and
            staff-written home carryover. Off by default. The subject line is only a name—no scores.
            Each mail includes who can see it and an unsubscribe link. The product does not rewrite
            this with a model.
          </p>
          <form action={setDigestOptInAction} className="mt-4 space-y-3">
            <input type="hidden" name="studentId" value={student.id} />
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                name="digestOptIn"
                defaultChecked={digestContact.digestOptIn && !digestContact.digestUnsubscribedAt}
                className="mt-1 h-5 w-5"
              />
              Send me the weekly update for this student
            </label>
            <Button type="submit">Save email preference</Button>
          </form>
        </Card>
      ) : null}

      <section className="space-y-3">
        {student.goals.map((goal) => {
          const latest = [...goal.entries].reverse().find((entry) => entry.sessionOutcome === "PRESENT");
          const carryover = [...goal.entries].reverse().find((entry) => entry.homeCarryover)?.homeCarryover;
          const statement = goal.periodStatements[0];
          return (
            <Card key={goal.id}>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                <div>
                  <CardTitle className="text-xl">{goal.plainLanguageSummary}</CardTitle>
                  <p className="mt-2 text-sm text-muted">Official goal: {goal.officialWording}</p>
                </div>
                <div className="flex flex-col items-start gap-2">
                  <StatusIndicator signal={goal.signal} />
                  {statement ? <ProgressCodeBadge code={statement.progressCode as ProgressCode} /> : null}
                </div>
              </div>
              {latest ? (
                <p className="mt-3 text-sm">
                  Latest update {formatDate(latest.recordedAt)}: {latest.score} {goal.unit}.{" "}
                  {latest.notes}
                </p>
              ) : (
                <p className="mt-3 text-sm text-muted">The team has not posted a score yet.</p>
              )}
              {statement ? <p className="mt-2 text-sm">{statement.narrative}</p> : null}
              {carryover ? (
                <p className="mt-2 rounded-lg bg-paper p-3 text-sm">
                  <strong>To try at home:</strong> {carryover}
                </p>
              ) : null}
              <Button asChild variant="secondary" className="mt-4">
                <Link href={`/goals/${goal.id}`}>See the chart</Link>
              </Button>
            </Card>
          );
        })}
      </section>

      <Card>
        <CardTitle>Messages with the team</CardTitle>
        <ul className="mt-4 space-y-3">
          {student.messages.map((message) => (
            <li key={message.id} className="rounded-lg bg-paper p-3">
              <p className="text-xs text-muted">
                {message.fromUser.name} · {formatDate(message.createdAt)}
              </p>
              <p>{message.body}</p>
            </li>
          ))}
        </ul>
        <form action={sendMessageAction} className="mt-4 space-y-3">
          <input type="hidden" name="studentId" value={student.id} />
          <input type="hidden" name="returnTo" value={`/parent?studentId=${student.id}`} />
          <Label htmlFor="body">Write to the team</Label>
          <Textarea id="body" name="body" required placeholder="A question or an observation from home." />
          <Button type="submit">Send</Button>
        </form>
      </Card>
    </div>
  );
}
