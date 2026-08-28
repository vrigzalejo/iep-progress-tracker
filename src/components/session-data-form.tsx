"use client";

import { useMemo, useState } from "react";
import { createProgressAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Alert, FormError } from "@/components/ui/alert";
import {
  CONDITION_TAG_LABELS,
  CONDITION_TAGS,
  COUNT_MEASUREMENTS,
  MEASUREMENT_LABELS,
  PROMPT_LEVEL_LABELS,
  PROMPT_LEVELS,
  SESSION_OUTCOME_LABELS,
  SESSION_OUTCOMES,
  SESSION_SETTING_LABELS,
  SESSION_SETTINGS,
  type MeasurementType,
  type PromptLevel,
  type SessionOutcome,
  type TrialResult,
} from "@/lib/constants";
import { scoreFromTrials, trialSummary, usesTrialPad } from "@/lib/progress";
import { isoDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

type Trial = { result: TrialResult; promptLevel: PromptLevel };

export function SessionDataForm({
  goal,
  error,
}: {
  goal: {
    id: string;
    plainLanguageSummary: string;
    measurableTarget: string;
    measurementMethod: string;
    unit: string;
    maxPromptForMastery: string;
    consecutiveSessionsNeeded: number;
    targetValue: number;
    objectives: { id: string; plainLanguageSummary: string }[];
  };
  error?: string;
}) {
  const [outcome, setOutcome] = useState<SessionOutcome>("PRESENT");
  const [promptLevel, setPromptLevel] = useState<PromptLevel>("VERBAL");
  const [trials, setTrials] = useState<Trial[]>([]);
  const [count, setCount] = useState(0);
  const measurement = goal.measurementMethod as MeasurementType;
  const trialMode = usesTrialPad(measurement);
  const countMode = COUNT_MEASUREMENTS.includes(measurement);
  const present = outcome === "PRESENT";
  const summary = trialSummary(trials);
  const computed = useMemo(
    () => scoreFromTrials(trials, goal.maxPromptForMastery),
    [trials, goal.maxPromptForMastery],
  );

  function addTrial(result: TrialResult) {
    setTrials((current) => [
      ...current,
      {
        result,
        promptLevel: result === "PROMPTED" ? promptLevel : "INDEPENDENT",
      },
    ]);
  }

  const scoreValue = present ? (trialMode ? computed ?? "" : countMode ? count : "") : 0;

  return (
    <Card>
      <CardTitle className="text-lg">{goal.plainLanguageSummary}</CardTitle>
      <p className="mt-1 text-sm text-muted">
        Target: {goal.measurableTarget} · Method: {MEASUREMENT_LABELS[measurement]} · Mastery:{" "}
        {goal.targetValue} {goal.unit} across {goal.consecutiveSessionsNeeded} consecutive session
        {goal.consecutiveSessionsNeeded === 1 ? "" : "s"}
        {goal.maxPromptForMastery === "INDEPENDENT"
          ? ", independent"
          : `, with no more than a ${PROMPT_LEVEL_LABELS[goal.maxPromptForMastery as PromptLevel].toLowerCase()} prompt`}
        .
      </p>
      <FormError error={error} />
      <form action={createProgressAction} className="mt-4 space-y-5" encType="multipart/form-data">
        <input type="hidden" name="goalId" value={goal.id} />
        <input type="hidden" name="returnTo" value={`/goals/${goal.id}/progress/new`} />
        <input type="hidden" name="measurementType" value={goal.measurementMethod} />
        <input type="hidden" name="maxPromptForMastery" value={goal.maxPromptForMastery} />
        <input type="hidden" name="sessionOutcome" value={outcome} />
        <input type="hidden" name="trialsJson" value={JSON.stringify(trials)} />
        {trialMode || countMode ? <input type="hidden" name="score" value={scoreValue} /> : null}

        <fieldset>
          <legend className="mb-2 text-sm font-semibold">Session outcome</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {SESSION_OUTCOMES.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setOutcome(value)}
                className={cn(
                  "min-h-11 rounded-md border px-3 text-sm font-semibold",
                  outcome === value
                    ? "border-forest bg-forest text-white"
                    : "border-border bg-white hover:bg-paper",
                )}
              >
                {SESSION_OUTCOME_LABELS[value]}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="recordedAt">Date</Label>
            <Input id="recordedAt" name="recordedAt" type="date" defaultValue={isoDate(new Date())} required />
          </div>
          <div>
            <Label htmlFor="setting">Setting</Label>
            <Select id="setting" name="setting" defaultValue="CLASSROOM">
              {SESSION_SETTINGS.map((setting) => (
                <option key={setting} value={setting}>
                  {SESSION_SETTING_LABELS[setting]}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {present && trialMode ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Tap trials</p>
                <p className="text-sm text-muted" aria-live="polite">
                  {summary.total === 0
                    ? "No trials yet."
                    : `${summary.independent} independent · ${summary.prompted} prompted · ${summary.incorrect} incorrect · ${computed}% toward mastery`}
                </p>
              </div>
              <div>
                <Label htmlFor="promptLevel">Prompt if not independent</Label>
                <Select
                  id="promptLevel"
                  value={promptLevel}
                  onChange={(event) => setPromptLevel(event.target.value as PromptLevel)}
                >
                  {PROMPT_LEVELS.filter((level) => level !== "INDEPENDENT").map((level) => (
                    <option key={level} value={level}>
                      {PROMPT_LEVEL_LABELS[level]}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Button type="button" className="min-h-16 text-base" onClick={() => addTrial("INDEPENDENT")}>
                Independent
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="min-h-16 text-base"
                onClick={() => addTrial("PROMPTED")}
              >
                Prompted
              </Button>
              <Button
                type="button"
                variant="danger"
                className="min-h-16 text-base"
                onClick={() => addTrial("INCORRECT")}
              >
                Incorrect
              </Button>
            </div>
            {trials.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2">
                <ol className="flex flex-wrap gap-1">
                  {trials.map((trial, index) => (
                    <li
                      key={`${trial.result}-${index}`}
                      className="rounded-full border border-border bg-paper px-2 py-0.5 text-xs"
                    >
                      {index + 1}. {trial.result === "PROMPTED" ? PROMPT_LEVEL_LABELS[trial.promptLevel] : trial.result.toLowerCase()}
                    </li>
                  ))}
                </ol>
                <Button type="button" variant="ghost" size="sm" onClick={() => setTrials((current) => current.slice(0, -1))}>
                  Undo last
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}

        {present && countMode ? (
          <div>
            <p className="text-sm font-semibold">Frequency count</p>
            <div className="mt-2 flex items-center gap-3">
              <Button type="button" variant="secondary" onClick={() => setCount((value) => Math.max(0, value - 1))}>
                −
              </Button>
              <p className="min-w-16 text-center font-serif text-3xl" aria-live="polite">
                {count}
              </p>
              <Button type="button" onClick={() => setCount((value) => value + 1)}>
                +
              </Button>
            </div>
          </div>
        ) : null}

        {present && !trialMode && !countMode ? (
          <div>
            <Label htmlFor="score">Score / value</Label>
            <Input id="score" name="score" type="number" step="0.1" min="0" required={present} />
            <p className="mt-1 text-sm text-muted">Unit: {goal.unit}</p>
          </div>
        ) : null}

        {!present ? (
          <Alert title="This session will not change the mastery streak" tone="info">
            Absent, declined, and makeup records stay on the service log. They do not count as a
            consecutive probe.
          </Alert>
        ) : null}

        {goal.objectives.length > 0 ? (
          <div>
            <Label htmlFor="objectiveId">Short-term objective (optional)</Label>
            <Select id="objectiveId" name="objectiveId" defaultValue="">
              <option value="">Whole annual goal</option>
              {goal.objectives.map((objective) => (
                <option key={objective.id} value={objective.id}>
                  {objective.plainLanguageSummary}
                </option>
              ))}
            </Select>
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="minutesDelivered">Minutes delivered</Label>
            <Input id="minutesDelivered" name="minutesDelivered" type="number" min="0" placeholder="e.g. 30" />
          </div>
          <div>
            <Label htmlFor="groupSize">Group size</Label>
            <Input id="groupSize" name="groupSize" type="number" min="1" placeholder="1 for 1:1" />
          </div>
          <div>
            <Label htmlFor="conditionTag">Condition</Label>
            <Select id="conditionTag" name="conditionTag" defaultValue="TYPICAL_SUPPORTS">
              {CONDITION_TAGS.map((tag) => (
                <option key={tag} value={tag}>
                  {CONDITION_TAG_LABELS[tag]}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="accommodations">Accommodations provided</Label>
            <Input
              id="accommodations"
              name="accommodations"
              placeholder="Extra time, visual schedule, scribe"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="notes">Session notes {present && !trialMode ? "" : "(optional)"}</Label>
          <Textarea
            id="notes"
            name="notes"
            minLength={present && !trialMode ? 3 : undefined}
            required={present && !trialMode}
            placeholder="What was practiced, what support was used, and what the student did."
          />
        </div>
        <div>
          <Label htmlFor="homeCarryover">Home carryover (optional, shared with family)</Label>
          <Input
            id="homeCarryover"
            name="homeCarryover"
            placeholder="Practice the break request before homework."
          />
        </div>
        <div>
          <Label htmlFor="evidenceLabel">Evidence label (optional)</Label>
          <Input id="evidenceLabel" name="evidenceLabel" placeholder="Weekly probe 4, work sample, session log" />
        </div>
        <div>
          <Label htmlFor="evidence">Attach evidence (optional, 5 MB max)</Label>
          <Input id="evidence" name="evidence" type="file" />
        </div>
        <Button type="submit" className="w-full">
          Save progress
        </Button>
      </form>
    </Card>
  );
}
