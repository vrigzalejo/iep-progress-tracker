import { createGoalAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { requirePermission, assertStudentAccess } from "@/lib/queries";
import { prisma } from "@/lib/db";
import {
  GOAL_STATUSES,
  GOAL_STATUS_LABELS,
  MEASUREMENT_LABELS,
  MEASUREMENT_TYPES,
  PERIOD_LABELS,
  REPORTING_PERIODS,
  SERVICE_AREA_LABELS,
  SERVICE_AREAS,
} from "@/lib/constants";
import { isoDate } from "@/lib/utils";

export const metadata = { title: "Add IEP goal" };

export default async function NewGoalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePermission("goal.create");
  const { id } = await params;
  await assertStudentAccess(user, id);
  const student = await prisma.student.findUnique({ where: { id } });
  const today = isoDate(new Date());

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-serif text-3xl">Add an IEP goal for {student?.preferredName}</h1>
        <p className="mt-2 text-muted">
          Keep the official wording exactly as the IEP team wrote it, then add a plain-language
          summary families can follow.
        </p>
      </div>
      <Alert title="ProgressPath does not write IEP goals" tone="warning">
        Staff enter goals from the IEP. This product does not generate goals or recommend services.
      </Alert>
      <Card>
        <form action={createGoalAction} className="space-y-4">
          <input type="hidden" name="studentId" value={id} />
          <div>
            <Label htmlFor="officialWording">Official IEP goal wording</Label>
            <Textarea id="officialWording" name="officialWording" required minLength={10} />
          </div>
          <div>
            <Label htmlFor="plainLanguageSummary">Plain-language summary</Label>
            <Textarea id="plainLanguageSummary" name="plainLanguageSummary" required minLength={10} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="baseline">Baseline</Label>
              <Input id="baseline" name="baseline" required />
            </div>
            <div>
              <Label htmlFor="measurableTarget">Measurable target</Label>
              <Input id="measurableTarget" name="measurableTarget" required />
            </div>
            <div>
              <Label htmlFor="targetValue">Target value (number)</Label>
              <Input id="targetValue" name="targetValue" type="number" step="0.1" required />
            </div>
            <div>
              <Label htmlFor="unit">Unit</Label>
              <Input id="unit" name="unit" required placeholder="% accuracy, WCPM, minutes" />
            </div>
            <div>
              <Label htmlFor="serviceArea">Service area</Label>
              <Select id="serviceArea" name="serviceArea" required>
                {SERVICE_AREAS.map((area) => (
                  <option key={area} value={area}>
                    {SERVICE_AREA_LABELS[area]}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="measurementMethod">Progress-measurement method</Label>
              <Select id="measurementMethod" name="measurementMethod" required>
                {MEASUREMENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {MEASUREMENT_LABELS[type]}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="reportingPeriod">Reporting period</Label>
              <Select id="reportingPeriod" name="reportingPeriod" required>
                {REPORTING_PERIODS.map((period) => (
                  <option key={period} value={period}>
                    {PERIOD_LABELS[period]}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="nextReportDue">Next report due</Label>
              <Input id="nextReportDue" name="nextReportDue" type="date" required />
            </div>
            <div>
              <Label htmlFor="startDate">Start date</Label>
              <Input id="startDate" name="startDate" type="date" defaultValue={today} required />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select id="status" name="status" defaultValue="ACTIVE">
                {GOAL_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {GOAL_STATUS_LABELS[status]}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <label className="flex min-h-11 items-center gap-2">
            <input type="checkbox" name="sharedWithGuardians" defaultChecked className="h-4 w-4" />
            Share this goal with linked parents and guardians
          </label>
          <Button type="submit">Save goal</Button>
        </form>
      </Card>
    </div>
  );
}
