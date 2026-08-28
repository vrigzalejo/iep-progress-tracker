import { createProgressAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Alert, FormError } from "@/components/ui/alert";
import { requireStaff, getGoalDetail } from "@/lib/queries";
import { MEASUREMENT_LABELS, MEASUREMENT_TYPES, type MeasurementType } from "@/lib/constants";
import { isoDate } from "@/lib/utils";

export const metadata = { title: "Add progress" };

export default async function NewProgressPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireStaff();
  const { id } = await params;
  const { error } = await searchParams;
  const goal = await getGoalDetail(user, id);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="font-serif text-3xl">Add a progress entry</h1>
        <p className="mt-2 text-muted">
          For {goal.student.preferredName}. Keep notes factual and supportive. This screen is sized
          for use during or right after a session.
        </p>
      </div>
      <Alert title="Write what you observed" tone="info">
        Describe the task, the support used, and the score. Avoid deficit-focused labels.
      </Alert>
      <FormError error={error} />
      <Card>
        <CardTitle className="text-lg">{goal.plainLanguageSummary}</CardTitle>
        <p className="mt-1 text-sm text-muted">
          Target: {goal.measurableTarget} · Method:{" "}
          {MEASUREMENT_LABELS[goal.measurementMethod as MeasurementType]}
        </p>
        <form action={createProgressAction} className="mt-4 space-y-4" encType="multipart/form-data">
          <input type="hidden" name="goalId" value={goal.id} />
          <input type="hidden" name="returnTo" value={`/goals/${goal.id}/progress/new`} />
          <div>
            <Label htmlFor="recordedAt">Date</Label>
            <Input id="recordedAt" name="recordedAt" type="date" defaultValue={isoDate(new Date())} required />
          </div>
          <div>
            <Label htmlFor="score">Score / value</Label>
            <Input id="score" name="score" type="number" step="0.1" min="0" required />
            <p className="mt-1 text-sm text-muted">Unit: {goal.unit}</p>
          </div>
          <div>
            <Label htmlFor="measurementType">Measurement type</Label>
            <Select id="measurementType" name="measurementType" defaultValue={goal.measurementMethod}>
              {MEASUREMENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {MEASUREMENT_LABELS[type]}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="notes">Session notes</Label>
            <Textarea
              id="notes"
              name="notes"
              required
              minLength={3}
              placeholder="What was practiced, what support was used, and what the student did."
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
    </div>
  );
}
