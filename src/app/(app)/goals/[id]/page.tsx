import Link from "next/link";
import { createObjectiveAction, updateGoalAction } from "@/app/actions";
import { ProgressChart } from "@/components/progress-chart";
import { PromptLevelChart } from "@/components/prompt-level-chart";
import { promptLevelShares } from "@/lib/workflow";
import { ProgressCodeBadge } from "@/components/progress-code-badge";
import { StatusIndicator } from "@/components/status-indicator";
import { Alert, FormError } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { requireUser, getGoalDetail } from "@/lib/queries";
import { can } from "@/lib/permissions";
import { trialSummary } from "@/lib/progress";
import {
  CONDITION_TAG_LABELS,
  GOAL_STATUS_LABELS,
  GOAL_STATUSES,
  MEASUREMENT_LABELS,
  PERIOD_LABELS,
  PROMPT_LEVEL_LABELS,
  PROMPT_LEVELS,
  SERVICE_AREA_LABELS,
  SESSION_OUTCOME_LABELS,
  SESSION_SETTING_LABELS,
  type ConditionTag,
  type MeasurementType,
  type ProgressCode,
  type PromptLevel,
  type ReportingPeriod,
  type ServiceArea,
  type SessionOutcome,
  type SessionSetting,
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
  const latestStatement = goal.periodStatements[0];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <p className="text-sm">
        <Link href={`/students/${goal.studentId}`} className="text-forest hover:underline">
          ← {goal.student.preferredName}
        </Link>
      </p>
      {query.saved ? (
        <Alert title="Saved" tone="success">
          The record is on the chart and in the history below.
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
              <Link href={`/goals/${goal.id}/progress/new`}>Log a session</Link>
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
          <p className="text-sm text-muted">Mastery rule</p>
          <p className="mt-1 font-semibold">
            {goal.targetValue} {goal.unit} across {goal.consecutiveSessionsNeeded} consecutive
            present session{goal.consecutiveSessionsNeeded === 1 ? "" : "s"}
          </p>
          <p className="mt-1 text-sm text-muted">
            Max prompt that still counts:{" "}
            {PROMPT_LEVEL_LABELS[goal.maxPromptForMastery as PromptLevel]}
          </p>
        </Card>
      </div>

      {goal.presentLevelsSnapshot ? (
        <Card>
          <CardTitle>Present levels at goal start</CardTitle>
          <p className="mt-2 text-sm">{goal.presentLevelsSnapshot}</p>
        </Card>
      ) : null}

      <Card>
        <CardTitle>Short-term objectives</CardTitle>
        {goal.objectives.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No benchmarks are attached yet.</p>
        ) : (
          <ol className="mt-3 space-y-2">
            {goal.objectives.map((objective, index) => (
              <li key={objective.id} className="rounded-lg border border-border p-3">
                <p className="text-sm font-semibold">
                  {index + 1}. {objective.plainLanguageSummary}
                </p>
                <p className="mt-1 text-sm text-muted">{objective.officialWording}</p>
                <p className="mt-1 text-sm">
                  Target: {objective.targetValue} {objective.unit}
                </p>
              </li>
            ))}
          </ol>
        )}
        {can(user.role, "goal.update") ? (
          <form action={createObjectiveAction} className="mt-4 grid gap-3 sm:grid-cols-2">
            <input type="hidden" name="goalId" value={goal.id} />
            <div className="sm:col-span-2">
              <Label htmlFor="objectiveOfficialWording">Official objective wording</Label>
              <Textarea id="objectiveOfficialWording" name="officialWording" required minLength={10} />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="objectiveSummary">Plain-language summary</Label>
              <Textarea id="objectiveSummary" name="plainLanguageSummary" required minLength={10} />
            </div>
            <div>
              <Label htmlFor="targetValue">Target value</Label>
              <Input id="targetValue" name="targetValue" type="number" step="0.1" required />
            </div>
            <div>
              <Label htmlFor="unit">Unit</Label>
              <Input id="unit" name="unit" required defaultValue={goal.unit} />
            </div>
            <div>
              <Button type="submit">Add objective</Button>
            </div>
          </form>
        ) : null}
      </Card>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Progress trend</CardTitle>
            <p className="mt-1 text-sm text-muted">
              Measurement: {MEASUREMENT_LABELS[goal.measurementMethod as MeasurementType]}. Target
              line is {goal.targetValue} {goal.unit}. Absent sessions are omitted.
            </p>
          </div>
          {latestStatement ? (
            <ProgressCodeBadge code={latestStatement.progressCode as ProgressCode} />
          ) : null}
        </div>
        <div className="mt-4">
          <ProgressChart
            entries={goal.entries.filter((entry) => entry.sessionOutcome === "PRESENT")}
            targetValue={goal.targetValue}
            unit={goal.unit}
          />
        </div>
      </Card>

      <Card>
        <CardTitle>Prompt levels over time</CardTitle>
        <p className="mt-1 text-sm text-muted">
          Share of trials by prompt level. This is not a recommendation to change the prompt
          hierarchy.
        </p>
        <div className="mt-4">
          <PromptLevelChart points={promptLevelShares(goal.entries)} />
        </div>
      </Card>

      <Card>
        <CardTitle>Session history</CardTitle>
        {goal.entries.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No entries yet.</p>
        ) : (
          <ol className="mt-4 space-y-3">
            {[...goal.entries].reverse().map((entry) => {
              const summary = trialSummary(entry.trials);
              return (
                <li key={entry.id} className="rounded-lg border border-border p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold">
                      {formatDate(entry.recordedAt)} ·{" "}
                      {SESSION_OUTCOME_LABELS[entry.sessionOutcome as SessionOutcome]}
                      {entry.sessionOutcome === "PRESENT"
                        ? ` · ${entry.score} ${goal.unit}`
                        : ""}{" "}
                      · {entry.author.name}
                    </p>
                    <Badge tone="sky">
                      {SESSION_SETTING_LABELS[entry.setting as SessionSetting] ?? entry.setting}
                    </Badge>
                  </div>
                  {summary.total > 0 ? (
                    <p className="mt-1 text-sm text-muted">
                      Trials: {summary.independent} independent, {summary.prompted} prompted,{" "}
                      {summary.incorrect} incorrect
                    </p>
                  ) : null}
                  <p className="mt-1 text-sm">{entry.notes}</p>
                  {entry.objective ? (
                    <p className="mt-1 text-sm text-muted">Objective: {entry.objective.plainLanguageSummary}</p>
                  ) : null}
                  {entry.conditionTag ? (
                    <p className="mt-1 text-sm text-muted">
                      Condition: {CONDITION_TAG_LABELS[entry.conditionTag as ConditionTag] ?? entry.conditionTag}
                      {entry.accommodations ? ` · Accommodations: ${entry.accommodations}` : ""}
                      {entry.minutesDelivered ? ` · ${entry.minutesDelivered} minutes` : ""}
                    </p>
                  ) : null}
                  {entry.homeCarryover && user.role === "PARENT" ? (
                    <p className="mt-1 text-sm">At home: {entry.homeCarryover}</p>
                  ) : null}
                  {entry.homeCarryover && user.role !== "PARENT" ? (
                    <p className="mt-1 text-sm text-muted">Home carryover: {entry.homeCarryover}</p>
                  ) : null}
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
              );
            })}
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
            <div>
              <Label htmlFor="consecutiveSessionsNeeded">Consecutive sessions for mastery</Label>
              <Input
                id="consecutiveSessionsNeeded"
                name="consecutiveSessionsNeeded"
                type="number"
                min="1"
                max="10"
                defaultValue={goal.consecutiveSessionsNeeded}
              />
            </div>
            <div>
              <Label htmlFor="maxPromptForMastery">Max prompt that still counts</Label>
              <Select id="maxPromptForMastery" name="maxPromptForMastery" defaultValue={goal.maxPromptForMastery}>
                {PROMPT_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {PROMPT_LEVEL_LABELS[level]}
                  </option>
                ))}
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="officialWording">Official wording</Label>
              <Textarea id="officialWording" name="officialWording" defaultValue={goal.officialWording} />
            </div>
            <div>
              <Label htmlFor="baseline">Baseline</Label>
              <Textarea id="baseline" name="baseline" defaultValue={goal.baseline} />
            </div>
            <div>
              <Label htmlFor="measurableTarget">Measurable target</Label>
              <Textarea id="measurableTarget" name="measurableTarget" defaultValue={goal.measurableTarget} />
            </div>
            <div>
              <Label htmlFor="targetValue">Target value</Label>
              <Input id="targetValue" name="targetValue" type="number" step="0.1" defaultValue={goal.targetValue} />
            </div>
            <div>
              <Label htmlFor="unit">Unit</Label>
              <Input id="unit" name="unit" defaultValue={goal.unit} />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="plainLanguageSummary">Plain-language summary</Label>
              <Textarea
                id="plainLanguageSummary"
                name="plainLanguageSummary"
                defaultValue={goal.plainLanguageSummary}
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="changeReason">Reason if wording or mastery changes</Label>
              <Input
                id="changeReason"
                name="changeReason"
                placeholder="IEP amendment 9/3 — team updated the target"
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
            <p className="sm:col-span-2 text-sm text-muted">
              Reporting cadence: {PERIOD_LABELS[goal.reportingPeriod as ReportingPeriod]}.
            </p>
            <div>
              <Button type="submit">Save changes</Button>
            </div>
          </form>
          {goal.versions.length > 0 ? (
            <div className="mt-6">
              <h3 className="font-semibold">Previous versions</h3>
              <ol className="mt-2 space-y-2 text-sm">
                {goal.versions.map((version) => (
                  <li key={version.id} className="rounded-lg border border-border p-3">
                    <p className="font-semibold">
                      {formatDate(version.createdAt)} · {version.createdBy.name}
                    </p>
                    <p className="text-muted">{version.changeReason}</p>
                    <p className="mt-1">{version.officialWording}</p>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}
        </Card>
      ) : null}
    </div>
  );
}
