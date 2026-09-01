import Link from "next/link";
import { savePeriodStatementAction } from "@/app/actions";
import { ProgressCodeBadge } from "@/components/progress-code-badge";
import { Alert, FormError } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Label, Select, Textarea } from "@/components/ui/input";
import {
  currentReportingPeriod,
  getStudentDetail,
  listReportingPeriods,
  requireStaff,
} from "@/lib/queries";
import { PROGRESS_CODE_LABELS, PROGRESS_CODES, type ProgressCode } from "@/lib/constants";

export const metadata = { title: "Period comments" };

export default async function PeriodCommentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ studentId: string }>;
  searchParams: Promise<{ periodId?: string; saved?: string; error?: string }>;
}) {
  const user = await requireStaff();
  const { studentId } = await params;
  const query = await searchParams;
  const student = await getStudentDetail(user, studentId);
  const periods = await listReportingPeriods(user);
  const period =
    periods.find((item) => item.id === query.periodId) ?? currentReportingPeriod(periods);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <p className="text-sm">
        <Link href={`/reports?studentId=${student.id}`} className="text-forest hover:underline">
          ← Reports
        </Link>
      </p>
      <div>
        <h1 className="font-serif text-3xl">Period comments for {student.preferredName}</h1>
        <p className="mt-2 text-muted">
          Choose the IEP progress code the team will send home. The chart does not pick this for
          you.
        </p>
      </div>
      {query.saved ? (
        <Alert title="Period comment saved" tone="success">
          Families will see this on the period report.
        </Alert>
      ) : null}
      <FormError error={query.error} />
      {periods.length > 1 ? (
        <form className="flex flex-wrap items-end gap-3">
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
          <Button formAction={`/reports/${student.id}/period`} formMethod="get" variant="secondary">
            Switch period
          </Button>
        </form>
      ) : null}
      {!period ? (
        <p>No reporting windows have been set up for this school yet.</p>
      ) : (
        <ul className="space-y-4">
          {student.goals.map((goal) => {
            const existing = goal.periodStatements.find((item) => item.periodId === period.id);
            return (
              <li key={goal.id}>
                <Card>
                  <CardTitle className="text-lg">{goal.plainLanguageSummary}</CardTitle>
                  {existing ? (
                    <div className="mt-2">
                      <ProgressCodeBadge code={existing.progressCode as ProgressCode} />
                    </div>
                  ) : null}
                  <form action={savePeriodStatementAction} className="mt-4 space-y-3">
                    <input type="hidden" name="goalId" value={goal.id} />
                    <input type="hidden" name="periodId" value={period.id} />
                    <input type="hidden" name="studentId" value={student.id} />
                    <input
                      type="hidden"
                      name="returnTo"
                      value={`/reports/${student.id}/period?periodId=${period.id}`}
                    />
                    <div>
                      <Label htmlFor={`progressCode-${goal.id}`}>Progress code</Label>
                      <Select
                        id={`progressCode-${goal.id}`}
                        name="progressCode"
                        defaultValue={existing?.progressCode ?? "SUFFICIENT"}
                      >
                        {PROGRESS_CODES.map((code) => (
                          <option key={code} value={code}>
                            {PROGRESS_CODE_LABELS[code]}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor={`narrative-${goal.id}`}>Period narrative</Label>
                      <Textarea
                        id={`narrative-${goal.id}`}
                        name="narrative"
                        required
                        minLength={10}
                        defaultValue={existing?.narrative ?? ""}
                        placeholder="This quarter Jaime practiced… with this support… next we will…"
                      />
                    </div>
                    <Button type="submit">Save comment</Button>
                  </form>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
