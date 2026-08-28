import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { StatusIndicator } from "@/components/status-indicator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Label, Textarea } from "@/components/ui/input";
import { requireUser, getStudentDetail } from "@/lib/queries";
import { can, isStaff } from "@/lib/permissions";
import { sendMessageAction } from "@/app/actions";
import { SERVICE_AREA_LABELS, type ServiceArea } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Student profile" };

export default async function StudentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const student = await getStudentDetail(user, id);
  if (!student) notFound();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted">Student profile · minimum fields only</p>
          <h1 className="font-serif text-4xl">{student.preferredName}</h1>
          <p className="text-muted">
            Grade {student.grade} · {student.school}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {can(user.role, "goal.create") ? (
            <Button asChild>
              <Link href={`/students/${student.id}/goals/new`}>Add IEP goal</Link>
            </Button>
          ) : null}
          <Button asChild variant="secondary">
            <Link href={`/reports?studentId=${student.id}`}>Build report</Link>
          </Button>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardTitle className="text-lg">Case manager</CardTitle>
          <p className="mt-2 font-semibold">{student.caseManager.name}</p>
          <p className="text-sm text-muted">{student.caseManager.title}</p>
        </Card>
        <Card>
          <CardTitle className="text-lg">Service providers</CardTitle>
          <ul className="mt-2 space-y-1 text-sm">
            {student.providers.map((link) => (
              <li key={link.userId}>
                {link.user.name} · {SERVICE_AREA_LABELS[link.serviceArea as ServiceArea] ?? link.serviceArea}
              </li>
            ))}
            {student.providers.length === 0 ? <li className="text-muted">None listed yet.</li> : null}
          </ul>
        </Card>
        <Card>
          <CardTitle className="text-lg">Guardian contacts</CardTitle>
          <ul className="mt-2 space-y-1 text-sm">
            {student.guardians.map((guardian) => (
              <li key={guardian.id}>
                {guardian.name} · {guardian.relationship}
                <span className="block text-muted">{guardian.email}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <section>
        <h2 className="font-serif text-2xl">IEP goals</h2>
        {student.goals.length === 0 ? (
          <p className="mt-3 text-muted">No shared goals are available on this profile.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {student.goals.map((goal) => (
              <li key={goal.id}>
                <Card>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <Badge>{SERVICE_AREA_LABELS[goal.serviceArea as ServiceArea]}</Badge>
                      <p className="mt-2 font-semibold">{goal.plainLanguageSummary}</p>
                      <CardDescription>Target: {goal.measurableTarget}</CardDescription>
                    </div>
                    <StatusIndicator signal={goal.signal} />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button asChild variant="secondary">
                      <Link href={`/goals/${goal.id}`}>Open goal and chart</Link>
                    </Button>
                    {can(user.role, "progress.create") ? (
                      <Button asChild>
                        <Link href={`/goals/${goal.id}/progress/new`}>Add progress</Link>
                      </Button>
                    ) : null}
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" aria-hidden="true" />
            Team messages
          </CardTitle>
          <ul className="mt-4 max-h-80 space-y-3 overflow-auto">
            {student.messages.map((message) => (
              <li key={message.id} className="rounded-lg bg-paper px-3 py-2">
                <p className="text-xs text-muted">
                  {message.fromUser.name} · {formatDate(message.createdAt)}
                </p>
                <p>{message.body}</p>
              </li>
            ))}
            {student.messages.length === 0 ? (
              <li className="text-sm text-muted">No messages yet. Keep notes short and supportive.</li>
            ) : null}
          </ul>
          <form action={sendMessageAction} className="mt-4 space-y-3">
            <input type="hidden" name="studentId" value={student.id} />
            <input type="hidden" name="returnTo" value={`/students/${student.id}`} />
            <Label htmlFor="body">Write a message</Label>
            <Textarea id="body" name="body" required maxLength={2000} placeholder="Share an update the family or team can use." />
            <Button type="submit">Send message</Button>
          </form>
        </Card>
        {isStaff(user.role) ? (
          <Card>
            <CardTitle>Consent</CardTitle>
            {student.consents[0] ? (
              <p className="mt-2 text-sm">
                Latest notice acknowledgment: {student.consents[0].guardianName} on{" "}
                {formatDate(student.consents[0].grantedAt)} (version {student.consents[0].noticeVersion}).
              </p>
            ) : (
              <p className="mt-2 text-sm text-muted">No consent record is on file yet.</p>
            )}
          </Card>
        ) : null}
      </section>
    </div>
  );
}
