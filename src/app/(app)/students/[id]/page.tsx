import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { StatusIndicator } from "@/components/status-indicator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";
import { requireUser, getStudentDetail } from "@/lib/queries";
import { can, isStaff } from "@/lib/permissions";
import {
  addAccommodationAction,
  archiveAccommodationAction,
  sendMessageAction,
  updateStudentDatesAction,
} from "@/app/actions";
import {
  MESSAGE_VISIBILITY_LABELS,
  SERVICE_AREA_LABELS,
  type MessageVisibility,
  type ServiceArea,
} from "@/lib/constants";
import { deliveredMinutesInRange } from "@/lib/progress";
import { endOfUtcWeek, formatDate, isoDate, startOfUtcWeek } from "@/lib/utils";

export const metadata = { title: "Student profile" };

export default async function StudentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  await searchParams;
  const student = await getStudentDetail(user, id);
  if (!student) notFound();
  const weekStart = startOfUtcWeek();
  const weekEnd = endOfUtcWeek();

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
          <Button asChild variant="secondary">
            <Link href={`/reports/${student.id}/meeting`}>Meeting packet</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href={`/reports/${student.id}/meeting/room`}>Meeting room</Link>
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
            {student.providers.map((link) => {
              const delivered = deliveredMinutesInRange(
                student.goals
                  .filter((goal) => goal.serviceArea === link.serviceArea)
                  .flatMap((goal) => goal.entries),
                weekStart,
                weekEnd,
              );
              return (
                <li key={link.userId}>
                  {link.user.name} · {SERVICE_AREA_LABELS[link.serviceArea as ServiceArea] ?? link.serviceArea}
                  {link.minutesPerWeek > 0 ? (
                    <span className="block text-muted">
                      This week: {delivered} of {link.minutesPerWeek} prescribed minutes
                    </span>
                  ) : null}
                </li>
              );
            })}
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

      <Card>
        <CardTitle>IEP calendar</CardTitle>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <p className="text-sm">
            <span className="text-muted">Annual review:</span>{" "}
            {student.iepAnnualReviewAt ? formatDate(student.iepAnnualReviewAt) : "Not set"}
          </p>
          <p className="text-sm">
            <span className="text-muted">Triennial evaluation:</span>{" "}
            {student.iepTriennialAt ? formatDate(student.iepTriennialAt) : "Not set"}
          </p>
        </div>
        {student.presentLevels ? (
          <p className="mt-3 text-sm">
            <strong>Present levels:</strong> {student.presentLevels}
          </p>
        ) : (
          <p className="mt-3 text-sm text-muted">No present-levels snapshot is on file.</p>
        )}
        {can(user.role, "student.update") ? (
          <form action={updateStudentDatesAction} className="mt-4 grid gap-3 sm:grid-cols-2">
            <input type="hidden" name="studentId" value={student.id} />
            <div>
              <Label htmlFor="iepAnnualReviewAt">Annual review</Label>
              <Input
                id="iepAnnualReviewAt"
                name="iepAnnualReviewAt"
                type="date"
                defaultValue={student.iepAnnualReviewAt ? isoDate(student.iepAnnualReviewAt) : ""}
              />
            </div>
            <div>
              <Label htmlFor="iepTriennialAt">Triennial</Label>
              <Input
                id="iepTriennialAt"
                name="iepTriennialAt"
                type="date"
                defaultValue={student.iepTriennialAt ? isoDate(student.iepTriennialAt) : ""}
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="presentLevels">Present levels snapshot</Label>
              <Textarea id="presentLevels" name="presentLevels" defaultValue={student.presentLevels ?? ""} />
            </div>
            <div>
              <Button type="submit" variant="secondary">
                Save IEP dates
              </Button>
            </div>
          </form>
        ) : null}
      </Card>

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
                      <CardDescription>
                        Target: {goal.measurableTarget} · {goal.consecutiveSessionsNeeded} consecutive
                        sessions
                        {goal.objectives.length
                          ? ` · ${goal.objectives.length} objective${goal.objectives.length === 1 ? "" : "s"}`
                          : ""}
                      </CardDescription>
                    </div>
                    <StatusIndicator signal={goal.signal} />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button asChild variant="secondary">
                      <Link href={`/goals/${goal.id}`}>Open goal and chart</Link>
                    </Button>
                    {can(user.role, "progress.create") ? (
                      <>
                        <Button asChild>
                          <Link href={`/goals/${goal.id}/progress/new`}>Log a session</Link>
                        </Button>
                        <Button asChild variant="secondary">
                          <Link href={`/hallway?studentId=${student.id}&goalId=${goal.id}`}>
                            Hallway
                          </Link>
                        </Button>
                      </>
                    ) : null}
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      {isStaff(user.role) ? (
        <Card>
          <CardTitle>Standing accommodations</CardTitle>
          <p className="mt-2 text-sm text-muted">
            Session forms start with this list checked. Uncheck what was not used that day.
          </p>
          <ul className="mt-3 space-y-2">
            {student.accommodations.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
                <span>{item.label}</span>
                <form action={archiveAccommodationAction}>
                  <input type="hidden" name="accommodationId" value={item.id} />
                  <input type="hidden" name="studentId" value={student.id} />
                  <Button type="submit" variant="ghost" size="sm">
                    Remove
                  </Button>
                </form>
              </li>
            ))}
            {student.accommodations.length === 0 ? (
              <li className="text-sm text-muted">None on file yet.</li>
            ) : null}
          </ul>
          <form action={addAccommodationAction} className="mt-4 flex flex-wrap items-end gap-3">
            <input type="hidden" name="studentId" value={student.id} />
            <div className="min-w-56 flex-1">
              <Label htmlFor="label">Add accommodation</Label>
              <Input id="label" name="label" required minLength={2} placeholder="Visual schedule" />
            </div>
            <Button type="submit" variant="secondary">
              Add
            </Button>
          </form>
        </Card>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" aria-hidden="true" />
            {isStaff(user.role) ? "Team and family messages" : "Messages with the team"}
          </CardTitle>
          <ul className="mt-4 max-h-80 space-y-3 overflow-auto">
            {student.messages.map((message) => (
              <li key={message.id} className="rounded-lg bg-paper px-3 py-2">
                <p className="text-xs text-muted">
                  {message.fromUser.name} · {formatDate(message.createdAt)}
                  {isStaff(user.role) ? (
                    <>
                      {" "}
                      · {MESSAGE_VISIBILITY_LABELS[message.visibility as MessageVisibility]}
                    </>
                  ) : null}
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
            {isStaff(user.role) ? (
              <fieldset>
                <legend className="mb-2 text-sm font-semibold">Who can see this</legend>
                <label className="flex min-h-11 items-center gap-2">
                  <input type="radio" name="visibility" value="FAMILY" defaultChecked className="h-4 w-4" />
                  Family thread
                </label>
                <label className="flex min-h-11 items-center gap-2">
                  <input type="radio" name="visibility" value="STAFF" className="h-4 w-4" />
                  Staff only — not shown in the parent portal
                </label>
              </fieldset>
            ) : null}
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
