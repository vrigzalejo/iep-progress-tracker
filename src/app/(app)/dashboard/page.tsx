import Link from "next/link";
import { CalendarClock, CircleDashed, ClipboardCheck, Timer, Users } from "lucide-react";
import { StatusIndicator } from "@/components/status-indicator";
import { Alert, EmptyState } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { requireStaff, getDashboardData } from "@/lib/queries";
import { formatDate, daysUntil } from "@/lib/utils";
import { SERVICE_AREA_LABELS, type ServiceArea } from "@/lib/constants";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await requireStaff();
  const data = await getDashboardData(user);
  const minutesGaps = data.serviceMinutes.filter((row) => row.gap > 0);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-forest">Educator workspace</p>
          <h1 className="font-serif text-3xl">Good to see you, {user.name.split(" ")[0]}</h1>
          <p className="mt-1 max-w-2xl text-muted">
            This dashboard highlights reporting dates, IEP reviews, uncovered service minutes, and
            goals waiting for a present-session note. It does not make IEP decisions.
          </p>
        </div>
        <Button asChild>
          <Link href="/students">Open caseload</Link>
        </Button>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <div className="flex items-center gap-2 text-forest">
            <CalendarClock className="h-5 w-5" aria-hidden="true" />
            <CardTitle className="text-lg">Upcoming reporting</CardTitle>
          </div>
          <p className="mt-2 font-serif text-4xl">{data.deadlines.length}</p>
          <CardDescription>Active goals with a report due in the next 14 days.</CardDescription>
        </Card>
        <Card>
          <div className="flex items-center gap-2 text-gold">
            <CircleDashed className="h-5 w-5" aria-hidden="true" />
            <CardTitle className="text-lg">Needs recent data</CardTitle>
          </div>
          <p className="mt-2 font-serif text-4xl">{data.needingData.length}</p>
          <CardDescription>Goals without a fresh present-session entry.</CardDescription>
        </Card>
        <Card>
          <div className="flex items-center gap-2 text-sky">
            <ClipboardCheck className="h-5 w-5" aria-hidden="true" />
            <CardTitle className="text-lg">IEP reviews</CardTitle>
          </div>
          <p className="mt-2 font-serif text-4xl">{data.iepReviews.length}</p>
          <CardDescription>Annual reviews due in the next 30 days.</CardDescription>
        </Card>
        <Card>
          <div className="flex items-center gap-2 text-terracotta">
            <Timer className="h-5 w-5" aria-hidden="true" />
            <CardTitle className="text-lg">Minutes gap</CardTitle>
          </div>
          <p className="mt-2 font-serif text-4xl">{minutesGaps.length}</p>
          <CardDescription>Services below this week’s prescribed minutes.</CardDescription>
        </Card>
      </div>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>Reporting deadlines</CardTitle>
          {data.deadlines.length === 0 ? (
            <EmptyState title="No reports due soon">
              When a reporting date is within two weeks, it will appear here.
            </EmptyState>
          ) : (
            <ul className="mt-4 divide-y divide-border">
              {data.deadlines.map((goal) => {
                const due = daysUntil(goal.nextReportDue);
                return (
                  <li key={goal.id} className="flex items-start justify-between gap-3 py-3">
                    <div>
                      <Link href={`/goals/${goal.id}`} className="font-semibold hover:underline">
                        {goal.studentName}
                      </Link>
                      <p className="text-sm text-muted">{goal.plainLanguageSummary}</p>
                    </div>
                    <Badge tone={due < 0 ? "terracotta" : due <= 3 ? "gold" : "sky"}>
                      {due < 0 ? `${Math.abs(due)} days overdue` : due === 0 ? "Due today" : `In ${due} days`}
                    </Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
        <Card>
          <CardTitle>Goals needing a recent note</CardTitle>
          {data.needingData.length === 0 ? (
            <p className="mt-3 text-sm text-muted">Every active goal has a recent progress entry.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {data.needingData.map((goal) => (
                <li key={goal.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link href={`/goals/${goal.id}`} className="font-semibold hover:underline">
                        {goal.studentName}
                      </Link>
                      <p className="text-sm text-muted">
                        {SERVICE_AREA_LABELS[goal.serviceArea as ServiceArea] ?? goal.serviceArea}
                      </p>
                    </div>
                    <StatusIndicator signal={goal.signal} />
                  </div>
                  <Button asChild variant="secondary" size="sm" className="mt-3">
                    <Link href={`/goals/${goal.id}/progress/new`}>Log a session</Link>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>IEP meeting dates</CardTitle>
          {data.iepReviews.length === 0 ? (
            <p className="mt-3 text-sm text-muted">No annual reviews fall in the next 30 days.</p>
          ) : (
            <ul className="mt-4 divide-y divide-border">
              {data.iepReviews.map((student) => (
                <li key={student.id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <Link href={`/students/${student.id}`} className="font-semibold hover:underline">
                      {student.preferredName}
                    </Link>
                    <p className="text-sm text-muted">Annual review {formatDate(student.iepAnnualReviewAt)}</p>
                  </div>
                  <Button asChild variant="secondary" size="sm">
                    <Link href={`/reports/${student.id}/meeting`}>Packet</Link>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-forest" aria-hidden="true" />
            <CardTitle>Service minutes this week</CardTitle>
          </div>
          {data.serviceMinutes.length === 0 ? (
            <p className="mt-3 text-sm text-muted">No prescribed weekly minutes are on file yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-border text-sm">
              {data.serviceMinutes.map((row) => (
                <li key={`${row.studentId}-${row.serviceArea}`} className="flex justify-between gap-3 py-2">
                  <div>
                    <Link href={`/students/${row.studentId}`} className="font-semibold hover:underline">
                      {row.studentName}
                    </Link>
                    <p className="text-muted">
                      {SERVICE_AREA_LABELS[row.serviceArea as ServiceArea] ?? row.serviceArea} · {row.providerName}
                    </p>
                  </div>
                  <Badge tone={row.gap > 0 ? "terracotta" : "forest"}>
                    {row.delivered}/{row.prescribed} min
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      <Card>
        <CardTitle>Recent activity</CardTitle>
        <CardDescription>Access and changes are logged. Student content is not written into these summaries.</CardDescription>
        {data.recentActivity.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Activity will appear after you open records or save notes.</p>
        ) : (
          <ul className="mt-4 divide-y divide-border text-sm">
            {data.recentActivity.map((item) => (
              <li key={item.id} className="flex flex-wrap justify-between gap-2 py-2">
                <span>
                  <strong>{item.user.name}</strong> · {item.action} · {item.resourceType}
                </span>
                <span className="text-muted">{formatDate(item.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Alert title="How to read these indicators" tone="info">
        On track, needs attention, and goal met describe recent present-session scores against the
        written mastery rule. They are not grades, diagnoses, or automatic IEP amendments.
      </Alert>
    </div>
  );
}
