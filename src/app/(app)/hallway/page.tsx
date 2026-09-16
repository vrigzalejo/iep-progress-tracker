import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff, getGoalDetail, getStudentDetail, getTodayCaseload } from "@/lib/queries";
import { SessionDataForm } from "@/components/session-data-form";
import { HallwayForm } from "@/components/hallway-form";
import { HallwayLock } from "@/components/hallway-lock";
import { HallwaySync } from "@/components/hallway-sync";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { hallwayWorkHref, pickHallwayNext } from "@/lib/hallway";
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

  let goalId = query.goalId;
  if (!goalId && query.studentId) {
    const student = await getStudentDetail(user, query.studentId);
    goalId =
      due.find((row) => row.studentId === student.id && row.goalId)?.goalId ??
      student.goals[0]?.id ??
      undefined;
  }
  if (!goalId) {
    goalId = due.find((row) => row.goalId)?.goalId ?? undefined;
  }
  if (!goalId) {
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <h1 className="font-serif text-3xl">Hallway</h1>
        <p className="text-muted">
          {query.studentId
            ? "This student has no IEP goal to log yet."
            : "No remaining sessions are on today’s list."}
        </p>
        <Button asChild>
          <Link href="/today">Today</Link>
        </Button>
      </div>
    );
  }

  const goal = await getGoalDetail(user, goalId);
  const student = await getStudentDetail(user, goal.studentId);
  const selected = { studentId: student.id, goalId: goal.id };
  const next = pickHallwayNext(due, selected, {
    nextStudentId: query.nextStudentId,
    nextGoalId: query.nextGoalId,
  });
  const nextAfter = next ? pickHallwayNext(due, next) : null;
  const nextHref = next ? hallwayWorkHref(next, nextAfter) : "/today";

  return (
    <div className="mx-auto max-w-xl space-y-4 pb-24 sm:pb-0">
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
          Session is on the record.{" "}
          {next?.goalId
            ? `Next on the list is ready — save again to move on, or open Today.`
            : "No other student remains on today’s list."}
        </Alert>
      ) : null}
      {next?.goalId ? (
        <p className="text-sm text-muted">
          After this save, Hallway opens the next student still owed a session on Today.
        </p>
      ) : (
        <p className="text-sm text-muted">
          After this save you return to Today.{" "}
          {query.studentId && !due.some((row) => row.studentId === student.id)
            ? "This student is not on today’s remaining list, so Hallway stays on them until you save."
            : null}
        </p>
      )}
      {query.queued ? (
        <Alert title="Saved on this device" tone="warning">
          You were offline. This session will sync when the network returns. It was not dropped.
          Evidence files are not queued offline — attach them when you have a network.
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
