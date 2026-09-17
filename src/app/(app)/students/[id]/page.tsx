import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { StatusIndicator } from "@/components/status-indicator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";
import { requireUser, getStudentDetail, listStudentEvidence, markStudentMessagesRead } from "@/lib/queries";
import { EvidenceGallery } from "@/components/evidence-gallery";
import { MessageThread } from "@/components/message-thread";
import { can, isStaff } from "@/lib/permissions";
import {
  addAccommodationAction,
  archiveAccommodationAction,
  updateStudentDatesAction,
} from "@/app/actions";
import { SERVICE_AREA_LABELS, type ServiceArea } from "@/lib/constants";
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
  if (user.role === "PARENT") {
    redirect(`/parent?studentId=${id}`);
  }
  const student = await getStudentDetail(user, id);
  if (!student) notFound();
  await markStudentMessagesRead(user, student.id);
  const evidence = isStaff(user.role) ? await listStudentEvidence(user, id) : [];
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
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {can(user.role, "goal.create") ? (
            <Button asChild>
              <Link href={`/students/${student.id}/goals/new`}>Add IEP goal</Link>
            </Button>
          ) : null}
          <Button asChild variant="link">
            <Link href={`/students/${student.id}/carryover`}>Home practice cards</Link>
          </Button>
          <Button asChild variant="link">
            <Link href={`/reports?studentId=${student.id}`}>Build report</Link>
          </Button>
          <Button asChild variant="link">
            <Link href={`/reports/${student.id}/meeting`}>Meeting packet</Link>
          </Button>
          <Button asChild variant="link">
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

      {isStaff(user.role) ? (
        <section>
          <h2 className="font-serif text-2xl">Evidence gallery</h2>
          <p className="mt-1 text-sm text-muted">Work samples attached to sessions, not filenames only.</p>
          <div className="mt-4">
            <EvidenceGallery
              returnTo={`/students/${student.id}`}
              canFlag={isStaff(user.role)}
              items={evidence.map((item) => ({
                id: item.id,
                evidenceLabel: item.evidenceLabel,
                evidencePath: item.evidencePath,
                evidenceInPacket: item.evidenceInPacket,
                recordedAt: item.recordedAt,
                goalSummary: item.goal.plainLanguageSummary,
              }))}
            />
          </div>
        </section>
      ) : null}

      <section>
        <h2 className="font-serif text-2xl">IEP goals</h2>
        {isStaff(user.role) && can(user.role, "progress.create") ? (
          <p className="mt-2 text-sm text-muted">
            <strong>Hallway</strong> is the trial pad and moves to the next student on Today after
            save. <strong>Log a session</strong> stays on this student.
          </p>
        ) : null}
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
                  <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                    <Button asChild variant="link">
                      <Link href={`/goals/${goal.id}`}>Open goal and chart</Link>
                    </Button>
                    {can(user.role, "progress.create") ? (
                      <>
                        <Button asChild>
                          <Link href={`/hallway?studentId=${student.id}&goalId=${goal.id}`}>
                            Hallway
                          </Link>
                        </Button>
                        <Button asChild variant="link">
                          <Link href={`/goals/${goal.id}/progress/new`}>Log a session</Link>
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
          <CardTitle className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" aria-hidden="true" />
              {isStaff(user.role) ? "Team and family messages" : "Messages with the team"}
            </span>
            <Button asChild variant="link">
              <Link href={`/messages/${student.id}`}>Open thread</Link>
            </Button>
          </CardTitle>
          <div className="mt-4">
            <MessageThread
              messages={student.messages}
              currentUserId={user.id}
              studentId={student.id}
              returnTo={`/students/${student.id}`}
              isStaffUser={isStaff(user.role)}
              compact
              composerId="profile-message-body"
            />
          </div>
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
