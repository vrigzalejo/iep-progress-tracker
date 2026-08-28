import Link from "next/link";
import { requireUser, listVisibleStudents } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Label, Select } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";

export const metadata = { title: "Progress reports" };

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ studentId?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const students = await listVisibleStudents(user);
  const selected = students.find((student) => student.id === params.studentId) ?? students[0];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-serif text-3xl">Progress report builder</h1>
        <p className="mt-2 text-muted">
          Create a parent-friendly report that keeps official goal wording and adds a plain-language
          summary. Print or save as PDF from your browser.
        </p>
      </div>
      <Alert title="Reports are written by people" tone="info">
        ProgressPath formats the data you already recorded. It does not invent narrative comments.
      </Alert>
      {students.length === 0 ? (
        <p>No students are available for reporting.</p>
      ) : (
        <Card>
          <CardTitle>Choose a student</CardTitle>
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
            <Button formAction="/reports" formMethod="get">
              Load goals
            </Button>
          </form>
          {selected ? (
            <div className="mt-6">
              <p className="text-sm text-muted">
                {selected.goals.length} goal{selected.goals.length === 1 ? "" : "s"} will be included.
                Parents only see goals marked as shared.
              </p>
              <Button asChild className="mt-4">
                <Link href={`/reports/${selected.id}`}>Open print preview</Link>
              </Button>
            </div>
          ) : null}
        </Card>
      )}
    </div>
  );
}
