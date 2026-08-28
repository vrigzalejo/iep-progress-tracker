import Link from "next/link";
import { requireParent, listVisibleStudents, getStudentDetail } from "@/lib/queries";
import { StatusIndicator } from "@/components/status-indicator";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Label, Textarea } from "@/components/ui/input";
import { sendMessageAction } from "@/app/actions";
import { formatDate } from "@/lib/utils";
import { EmptyState } from "@/components/ui/alert";

export const metadata = { title: "Family portal" };

export default async function ParentPage() {
  const user = await requireParent();
  const students = await listVisibleStudents(user);
  const student = students[0] ? await getStudentDetail(user, students[0].id) : null;

  if (!student) {
    return (
      <EmptyState title="No student is linked to this account">
        Ask your school’s special education office to connect this family account to a student
        profile.
      </EmptyState>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-forest">Family portal</p>
        <h1 className="font-serif text-3xl">{student.preferredName}’s progress</h1>
        <p className="mt-2 max-w-2xl text-muted">
          You can see goals the school has shared, recent progress in everyday language, reports,
          and messages with the team. You cannot see other students.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <Link href={`/reports/${student.id}`}>Open progress report</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/privacy">Privacy and consent</Link>
        </Button>
      </div>

      <section className="space-y-3">
        {student.goals.map((goal) => {
          const latest = goal.entries.at(-1);
          return (
            <Card key={goal.id}>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                <div>
                  <CardTitle className="text-xl">{goal.plainLanguageSummary}</CardTitle>
                  <p className="mt-2 text-sm text-muted">Official goal: {goal.officialWording}</p>
                </div>
                <StatusIndicator signal={goal.signal} />
              </div>
              {latest ? (
                <p className="mt-3 text-sm">
                  Latest update {formatDate(latest.recordedAt)}: {latest.score} {goal.unit}.{" "}
                  {latest.notes}
                </p>
              ) : (
                <p className="mt-3 text-sm text-muted">The team has not posted a score yet.</p>
              )}
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
          <input type="hidden" name="returnTo" value="/parent" />
          <Label htmlFor="body">Write to the team</Label>
          <Textarea id="body" name="body" required placeholder="A question or an observation from home." />
          <Button type="submit">Send</Button>
        </form>
      </Card>
    </div>
  );
}
