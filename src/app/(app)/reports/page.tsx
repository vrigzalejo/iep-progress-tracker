import Link from "next/link";
import { requireUser, listVisibleStudents, listReportingPeriods, currentReportingPeriod } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Label, Select } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { isStaff } from "@/lib/permissions";
import { APP_NAME } from "@/lib/brand";

export const metadata = { title: "Progress reports" };

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ studentId?: string; periodId?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const students = await listVisibleStudents(user);
  const periods = await listReportingPeriods(user);
  const selected = students.find((student) => student.id === params.studentId) ?? students[0];
  const period =
    periods.find((item) => item.id === params.periodId) ?? currentReportingPeriod(periods);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-serif text-3xl">Progress report builder</h1>
        <p className="mt-2 text-muted">
          Create a parent-friendly report for a reporting period. Staff choose the IEP progress
          code; {APP_NAME} formats the scores you already recorded.
        </p>
      </div>
      <Alert title="Reports are written by people" tone="info">
        {APP_NAME} does not invent narrative comments or recommend services.
      </Alert>
      {students.length === 0 ? (
        <p>No students are available for reporting.</p>
      ) : (
        <Card>
          <CardTitle>Choose a student and period</CardTitle>
          <form className="mt-4 space-y-4">
            <div>
              <Label htmlFor="studentId">Student</Label>
              <Select id="studentId" name="studentId" defaultValue={selected?.id}>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.preferredName} · Grade {student.grade}
                  </option>
                ))}
              </Select>
            </div>
            {periods.length > 0 ? (
              <div>
                <Label htmlFor="periodId">Reporting period</Label>
                <Select id="periodId" name="periodId" defaultValue={period?.id}>
                  {periods.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </Select>
              </div>
            ) : null}
            <Button formAction="/reports" formMethod="get">
              Load goals
            </Button>
          </form>
          {selected ? (
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild>
                <Link
                  href={
                    period
                      ? `/reports/${selected.id}?periodId=${period.id}`
                      : `/reports/${selected.id}`
                  }
                >
                  Open print preview
                </Link>
              </Button>
              {isStaff(user.role) && period ? (
                <>
                  <Button asChild variant="secondary">
                    <Link href={`/reports/studio?periodId=${period.id}`}>Open report studio</Link>
                  </Button>
                  <Button asChild variant="secondary">
                    <Link href={`/reports/${selected.id}/period?periodId=${period.id}`}>
                      Write period comments
                    </Link>
                  </Button>
                </>
              ) : null}
              <Button asChild variant="secondary">
                <Link href={`/reports/${selected.id}/meeting`}>Meeting packet</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href={`/reports/${selected.id}/meeting/room`}>Meeting room</Link>
              </Button>
            </div>
          ) : null}
        </Card>
      )}
    </div>
  );
}
