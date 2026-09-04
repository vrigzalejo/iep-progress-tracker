import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff, getGoalDetail, getStudentDetail, getTodayCaseload } from "@/lib/queries";
import { SessionDataForm } from "@/components/session-data-form";
import { HallwayForm } from "@/components/hallway-form";
import { HallwayLock } from "@/components/hallway-lock";
import { HallwaySync } from "@/components/hallway-sync";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { can } from "@/lib/permissions";

export const metadata = { title: "Hallway" };

export default async function HallwayPage({
  searchParams,
}: {
  searchParams: Promise<{
    studentId?: string;
    goalId?: string;
    nextStudentId?: string;
    nextGoalId?: string;
    error?: string;
    saved?: string;
    queued?: string;
  }>;
}) {
  const user = await requireStaff();
  if (!can(user.role, "progress.create")) notFound();
  const query = await searchParams;
  const { due } = await getTodayCaseload(user);
  const selected =
    due.find((row) => row.goalId === query.goalId) ??
    due.find((row) => row.studentId === query.studentId) ??
    due[0];
  if (!selected?.goalId) {
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <h1 className="font-serif text-3xl">Hallway</h1>
        <p className="text-muted">No remaining sessions are on today’s list.</p>
        <Button asChild>
          <Link href="/today">Back to Today</Link>
        </Button>
      </div>
    );
  }
  const goal = await getGoalDetail(user, selected.goalId);
  const student = await getStudentDetail(user, goal.studentId);
  const next =
    (query.nextGoalId
      ? due.find((row) => row.goalId === query.nextGoalId)
      : undefined) ?? due.find((row) => row.studentId !== selected.studentId && row.goalId);
  const nextHref = next?.goalId
    ? `/hallway?studentId=${next.studentId}&goalId=${next.goalId}`
    : "/today";

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-forest">Hallway</p>
          <h1 className="font-serif text-3xl">{student.preferredName}</h1>
          <p className="text-muted">{goal.plainLanguageSummary}</p>
        </div>
        <Button asChild variant="secondary">
          <Link href="/today">Today</Link>
        </Button>
      </div>
      {query.saved ? (
        <Alert title="Saved" tone="success">
          Session is on the record. Opening the next student when one remains.
        </Alert>
      ) : null}
      {query.queued ? (
        <Alert title="Saved on this device" tone="warning">
          You were offline. This session will sync when the network returns. It was not dropped.
        </Alert>
      ) : null}
      <HallwaySync />
      <HallwayLock />
      <HallwayForm nextHref={nextHref}>
        <SessionDataForm
          compact
          nextHref={nextHref}
          returnTo={`/hallway?studentId=${student.id}&goalId=${goal.id}`}
          standingAccommodations={student.accommodations}
          error={query.error}
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
        />
      </HallwayForm>
    </div>
  );
}
