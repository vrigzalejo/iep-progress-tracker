import { SessionDataForm } from "@/components/session-data-form";
import { Alert } from "@/components/ui/alert";
import { requireStaff, getGoalDetail, getStudentDetail } from "@/lib/queries";

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
  const student = await getStudentDetail(user, goal.studentId);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="font-serif text-3xl">Log a session</h1>
        <p className="mt-2 text-muted">
          For {goal.student.preferredName}. Tap trials during the session, or mark absent / declined
          if the service was not delivered. Notes stay factual and supportive.
        </p>
      </div>
      <Alert title="Write what you observed" tone="info">
        Describe the task, the support used, and the score. Avoid deficit-focused labels. Indicators
        on the chart are data snapshots, not IEP decisions.
      </Alert>
      <SessionDataForm
        standingAccommodations={student.accommodations}
        goal={{
          id: goal.id,
          plainLanguageSummary: goal.plainLanguageSummary,
          measurableTarget: goal.measurableTarget,
          measurementMethod: goal.measurementMethod,
          unit: goal.unit,
          maxPromptForMastery: goal.maxPromptForMastery,
          consecutiveSessionsNeeded: goal.consecutiveSessionsNeeded,
          targetValue: goal.targetValue,
          objectives: goal.objectives,
        }}
        error={error}
      />
    </div>
  );
}
