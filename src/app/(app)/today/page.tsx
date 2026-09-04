import Link from "next/link";
import { requireStaff, getTodayCaseload } from "@/lib/queries";
import { SERVICE_AREA_LABELS, type ServiceArea } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Alert, EmptyState } from "@/components/ui/alert";
import { formatDate } from "@/lib/utils";
import { HallwaySync } from "@/components/hallway-sync";

export const metadata = { title: "Today" };

export default async function TodayPage() {
  const user = await requireStaff();
  const { due, weekStart } = await getTodayCaseload(user);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-forest">Worklist</p>
        <h1 className="font-serif text-3xl">Today</h1>
        <p className="mt-2 text-muted">
          Students still owed a session or minutes this week (week of {formatDate(weekStart)}). This
          is a worklist, not a compliance finding.
        </p>
      </header>
      <HallwaySync />
      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <Link href={due[0]?.goalId ? `/hallway?studentId=${due[0].studentId}&goalId=${due[0].goalId}` : "/students"}>
            Open hallway
          </Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/minutes">Minutes ledger</Link>
        </Button>
      </div>
      {due.length === 0 ? (
        <EmptyState title="No remaining sessions on this week’s list">
          Everyone on your caseload with prescribed sessions already has a present or makeup note
          this week—or no weekly prescription is on file.
        </EmptyState>
      ) : (
        <ul className="space-y-3">
          {due.map((row, index) => {
            const next = due[index + 1];
            const href = row.goalId
              ? `/hallway?studentId=${row.studentId}&goalId=${row.goalId}${
                  next?.goalId ? `&nextStudentId=${next.studentId}&nextGoalId=${next.goalId}` : ""
                }`
              : `/students/${row.studentId}`;
            return (
              <li key={`${row.studentId}-${row.serviceArea}`}>
                <Card>
                  <CardTitle className="text-lg">{row.studentName}</CardTitle>
                  <CardDescription>
                    {SERVICE_AREA_LABELS[row.serviceArea as ServiceArea] ?? row.serviceArea} ·{" "}
                    {row.providerName}
                  </CardDescription>
                  <p className="mt-2 text-sm">
                    {row.sessionsLogged} of {row.sessionsPerWeek} sessions · {row.minutesDelivered} of{" "}
                    {row.minutesPerWeek} minutes
                  </p>
                  {row.goalSummary ? <p className="mt-1 text-sm text-muted">{row.goalSummary}</p> : null}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Badge tone="sky">{row.sessionsRemaining} remaining</Badge>
                    <Button asChild>
                      <Link href={href}>Log in hallway</Link>
                    </Button>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
      <Alert title="How to read this list" tone="info">
        Remaining sessions come from the provider line on the student profile. Logging a present or
        makeup session moves the student down the list. After you save, hallway opens the next
        student.
      </Alert>
    </div>
  );
}
