import Link from "next/link";
import { cookies } from "next/headers";
import { requireParent, listVisibleStudents, getStudentDetail, markStudentMessagesRead } from "@/lib/queries";
import { StatusIndicator } from "@/components/status-indicator";
import { ProgressCodeBadge } from "@/components/progress-code-badge";
import { FamilyLocaleToggle } from "@/components/family-locale-toggle";
import { MessageThread } from "@/components/message-thread";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/input";
import { setDigestOptInAction } from "@/app/actions";
import { formatDate } from "@/lib/utils";
import { Alert, EmptyState, FormError } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import type { ProgressCode } from "@/lib/constants";
import { familyCopy } from "@/lib/family-copy";
import { FAMILY_LOCALE_COOKIE, familyGoalSummary, resolveFamilyLocale } from "@/lib/family-locale";

export const metadata = { title: "Family portal" };

export default async function ParentPage({
  searchParams,
}: {
  searchParams: Promise<{ studentId?: string; saved?: string; error?: string }>;
}) {
  const user = await requireParent();
  const params = await searchParams;
  const students = await listVisibleStudents(user);
  const selected =
    students.find((student) => student.id === params.studentId) ?? students[0] ?? null;
  const student = selected ? await getStudentDetail(user, selected.id) : null;
  if (student) await markStudentMessagesRead(user, student.id);
  const digestContact = student?.guardians.find((guardian) => guardian.userId === user.id);
  const locale = resolveFamilyLocale(
    (await cookies()).get(FAMILY_LOCALE_COOKIE)?.value,
    digestContact?.familyLocale,
  );
  const copy = familyCopy(locale);

  if (!student) {
    return (
      <EmptyState title={copy.noStudent}>{copy.noStudentBody}</EmptyState>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="space-y-3">
        <FamilyLocaleToggle locale={locale} returnTo={`/parent?studentId=${student.id}`} />
        <p className="text-sm font-semibold uppercase tracking-wide text-forest">{copy.portalEyebrow}</p>
        <h1 className="font-serif text-3xl">{copy.progressTitle(student.preferredName)}</h1>
        <p className="mt-2 max-w-2xl text-muted">{copy.portalIntro}</p>
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

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Button asChild>
          <Link href={`/reports/${student.id}`}>{copy.openReport}</Link>
        </Button>
        <Button asChild variant="link">
          <Link href={`/reports/${student.id}/meeting`}>{copy.meetingPacket}</Link>
        </Button>
        <Button asChild variant="link">
          <Link href={`/students/${student.id}/carryover`}>{copy.homeCards}</Link>
        </Button>
        <Button asChild variant="link">
          <Link href="/privacy">{copy.privacyConsent}</Link>
        </Button>
      </div>

      {params.saved === "digest" ? (
        <Alert title={copy.weeklySaved} tone="success">
          {copy.weeklySavedBody}
        </Alert>
      ) : null}
      {params.saved === "1" ? (
        <Alert title={copy.messageSent} tone="success">
          {copy.messageSentBody}
        </Alert>
      ) : null}

      {digestContact ? (
        <Card>
          <CardTitle>{copy.weeklyEmail}</CardTitle>
          <p className="mt-2 text-sm text-muted">{copy.weeklyEmailBody(student.preferredName)}</p>
          <form action={setDigestOptInAction} className="mt-4 space-y-3">
            <input type="hidden" name="studentId" value={student.id} />
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                name="digestOptIn"
                defaultChecked={digestContact.digestOptIn && !digestContact.digestUnsubscribedAt}
                className="mt-1 h-5 w-5"
              />
              {copy.weeklyOptIn}
            </label>
            <Button type="submit">{copy.saveEmail}</Button>
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
                  <CardTitle className="text-xl">{familyGoalSummary(goal, locale)}</CardTitle>
                  <p className="mt-2 text-sm text-muted">{copy.officialGoal}: {goal.officialWording}</p>
                </div>
                <div className="flex flex-col items-start gap-2">
                  <StatusIndicator signal={goal.signal} />
                  {statement ? <ProgressCodeBadge code={statement.progressCode as ProgressCode} /> : null}
                </div>
              </div>
              {latest ? (
                <p className="mt-3 text-sm">
                  {copy.latestUpdate(formatDate(latest.recordedAt), `${latest.score} ${goal.unit}`)}{" "}
                  {latest.notes}
                </p>
              ) : (
                <p className="mt-3 text-sm text-muted">{copy.noScore}</p>
              )}
              {statement ? <p className="mt-2 text-sm">{statement.narrative}</p> : null}
              {carryover ? (
                <p className="mt-2 rounded-lg bg-paper p-3 text-sm">
                  <strong>{copy.tryAtHome}</strong> {carryover}
                </p>
              ) : null}
              <Button asChild variant="secondary" className="mt-4">
                <Link href={`/goals/${goal.id}`}>{copy.seeChart}</Link>
              </Button>
            </Card>
          );
        })}
      </section>

      <Card>
        <CardTitle className="flex items-center justify-between gap-3">
          <span>{copy.messages}</span>
          <Button asChild variant="link">
            <Link href={`/messages/${student.id}`}>{copy.messagesNav}</Link>
          </Button>
        </CardTitle>
        <FormError error={params.error} />
        <div className="mt-4">
          <MessageThread
            messages={student.messages}
            currentUserId={user.id}
            studentId={student.id}
            returnTo={`/parent?studentId=${student.id}`}
            isStaffUser={false}
            locale={locale}
            compact
            composerId="familyMessage"
            labels={{ write: copy.writeTeam, send: copy.send, empty: copy.noMessages }}
          />
        </div>
      </Card>
    </div>
  );
}
