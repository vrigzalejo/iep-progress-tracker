export type HallwayDueRow = {
  studentId: string;
  goalId: string | null;
};

export type HallwayTarget = {
  studentId: string;
  goalId: string;
};

export function hallwayWorkHref(current: HallwayTarget, next?: HallwayTarget | null) {
  const base = `/hallway?studentId=${encodeURIComponent(current.studentId)}&goalId=${encodeURIComponent(current.goalId)}`;
  if (!next?.goalId) return base;
  return `${base}&nextStudentId=${encodeURIComponent(next.studentId)}&nextGoalId=${encodeURIComponent(next.goalId)}`;
}

export function pickHallwayNext(
  due: HallwayDueRow[],
  selected: HallwayTarget,
  hint?: { nextStudentId?: string; nextGoalId?: string },
): HallwayTarget | null {
  const withGoals = due.filter((row): row is HallwayDueRow & { goalId: string } => Boolean(row.goalId));
  if (hint?.nextGoalId) {
    const hinted = withGoals.find((row) => row.goalId === hint.nextGoalId);
    if (hinted && hinted.studentId !== selected.studentId) {
      return { studentId: hinted.studentId, goalId: hinted.goalId };
    }
  }
  const index = withGoals.findIndex(
    (row) => row.goalId === selected.goalId || row.studentId === selected.studentId,
  );
  if (index >= 0) {
    const after = withGoals.slice(index + 1).find((row) => row.studentId !== selected.studentId);
    if (after) return { studentId: after.studentId, goalId: after.goalId };
  }
  const other = withGoals.find((row) => row.studentId !== selected.studentId);
  return other ? { studentId: other.studentId, goalId: other.goalId } : null;
}
