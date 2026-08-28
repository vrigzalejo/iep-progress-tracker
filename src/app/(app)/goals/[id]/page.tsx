import Link from "next/link";
import { updateGoalAction } from "@/app/actions";
import { ProgressChart } from "@/components/progress-chart";
import { StatusIndicator } from "@/components/status-indicator";
import { Alert, FormError } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { requireUser, getGoalDetail } from "@/lib/queries";
import { can } from "@/lib/permissions";
import {
  GOAL_STATUS_LABELS,
  GOAL_STATUSES,
  MEASUREMENT_LABELS,
  PERIOD_LABELS,
  SERVICE_AREA_LABELS,
  type MeasurementType,
  type ReportingPeriod,
  type ServiceArea,
} from "@/lib/constants";
import { formatDate, isoDate } from "@/lib/utils";

export const metadata = { title: "IEP goal" };

export default async function GoalDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const query = await searchParams;
  const goal = await getGoalDetail(user, id);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <p className="text-sm">
        <Link href={`/students/${goal.studentId}`} className="text-forest hover:underline">
          ← {goal.student.preferredName}
        </Link>
      </p>
      {query.saved ? (
        <Alert title="Progress saved" tone="success">
          The session note is on the chart and in the history below.
        </Alert>
      ) : null}
      <FormError error={query.error} />
      <header className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Badge>{SERVICE_AREA_LABELS[goal.serviceArea as ServiceArea]}</Badge>
          <h1 className="mt-2 font-serif text-3xl">{goal.plainLanguageSummary}</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted">Official wording: {goal.officialWording}</p>
        </div>
        <div className="flex flex-col items-start gap-3">
          <StatusIndicator signal={goal.signal} showHint />
          {can(user.role, "progress.create") ? (
            <Button asChild>
              <Link href={`/goals/${goal.id}/progress/new`}>Add progress entry</Link>
            </Button>
          ) : null}
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-sm text-muted">Baseline</p>
          <p className="mt-1 font-semibold">{goal.baseline}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted">Measurable target</p>
          <p className="mt-1 font-semibold">{goal.measurableTarget}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted">Reporting</p>
          <p className="mt-1 font-semibold">
            {PERIOD_LABELS[goal.reportingPeriod as ReportingPeriod]} · next {formatDate(goal.nextReportDue)}
          </p>
        </Card>
      </div>

      <Card>
        <CardTitle>Progress trend</CardTitle>
        <p className="mt-1 text-sm text-muted">
          Measurement: {MEASUREMENT_LABELS[goal.measurementMethod as MeasurementType]}. Target line is{" "}
          {goal.targetValue} {goal.unit}.
        </p>
        <div className="mt-4">
          <ProgressChart entries={goal.entries} targetValue={goal.targetValue} unit={goal.unit} />
        </div>
      </Card>

      <Card>
        <CardTitle>Progress history</CardTitle>
        {goal.entries.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No entries yet.</p>
        ) : (
          <ol className="mt-4 space-y-3">
            {[...goal.entries].reverse().map((entry) => (
              <li key={entry.id} className="rounded-lg border border-border p-3">
                <p className="text-sm font-semibold">
                  {formatDate(entry.recordedAt)} · {entry.score} {goal.unit} · {entry.author.name}
                </p>
                <p className="mt-1 text-sm">{entry.notes}</p>
                {entry.evidenceLabel ? (
                  <p className="mt-1 text-sm text-muted">
                    Evidence:{" "}
                    {entry.evidencePath && user.role !== "PARENT" ? (
                      <a className="underline" href={`/api/evidence/${entry.id}`}>
                        {entry.evidenceLabel}
                      </a>
                    ) : (
                      entry.evidenceLabel
                    )}
                  </p>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </Card>

      {can(user.role, "goal.update") ? (
        <Card>
          <CardTitle>Update goal settings</CardTitle>
          <form action={updateGoalAction} className="mt-4 grid gap-4 sm:grid-cols-2">
            <input type="hidden" name="goalId" value={goal.id} />
            <div>
              <Label htmlFor="status">Official status (set by the IEP team)</Label>
              <Select id="status" name="status" defaultValue={goal.status}>
                {GOAL_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {GOAL_STATUS_LABELS[status]}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="nextReportDue">Next report due</Label>
              <Input
                id="nextReportDue"
                name="nextReportDue"
                type="date"
                defaultValue={isoDate(goal.nextReportDue)}
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="plainLanguageSummary">Plain-language summary</Label>
              <Textarea
                id="plainLanguageSummary"
                name="plainLanguageSummary"
                defaultValue={goal.plainLanguageSummary}
              />
            </div>
            <label className="flex min-h-11 items-center gap-2 sm:col-span-2">
              <input type="hidden" name="sharedWithGuardians" value="false" />
              <input
                type="checkbox"
                name="sharedWithGuardians"
                value="true"
                defaultChecked={goal.sharedWithGuardians}
                className="h-4 w-4"
              />
              Visible in the parent portal
            </label>
            <div>
              <Button type="submit">Save changes</Button>
            </div>
          </form>
        </Card>
      ) : null}
    </div>
  );
}
