import Link from "next/link";
import { StatusIndicator } from "@/components/status-indicator";
import { EmptyState } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/input";
import { requireStaff, listVisibleStudents } from "@/lib/queries";
import { can } from "@/lib/permissions";
import { computeDataSignal } from "@/lib/progress";

export const metadata = { title: "Students" };

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; school?: string; grade?: string }>;
}) {
  const user = await requireStaff();
  const params = await searchParams;
  let students = await listVisibleStudents(user, params.q);
  if (params.school) students = students.filter((student) => student.school === params.school);
  if (params.grade) students = students.filter((student) => student.grade === params.grade);
  const schools = [...new Set((await listVisibleStudents(user)).map((student) => student.school))];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl">Students</h1>
          <p className="text-muted">
            Profiles keep only preferred name, grade, school, case manager, providers, and guardian
            contacts.
          </p>
        </div>
        {can(user.role, "student.create") ? (
          <Button asChild>
            <Link href="/students/new">Add student</Link>
          </Button>
        ) : null}
      </header>

      <Card>
        <form className="grid gap-3 md:grid-cols-4" method="get">
          <div className="md:col-span-2">
            <Label htmlFor="q">Search</Label>
            <Input id="q" name="q" defaultValue={params.q} placeholder="Preferred name, school, or grade" />
          </div>
          <div>
            <Label htmlFor="school">School</Label>
            <Select id="school" name="school" defaultValue={params.school ?? ""}>
              <option value="">All schools</option>
              {schools.map((school) => (
                <option key={school}>{school}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="grade">Grade</Label>
            <Input id="grade" name="grade" defaultValue={params.grade} placeholder="Any" />
          </div>
          <div className="md:col-span-4">
            <Button type="submit" variant="secondary">
              Apply filters
            </Button>
          </div>
        </form>
      </Card>

      {students.length === 0 ? (
        <EmptyState
          title="No students match these filters"
          action={
            can(user.role, "student.create") ? (
              <Button asChild>
                <Link href="/students/new">Add a student profile</Link>
              </Button>
            ) : null
          }
        >
          Try a different search, or add a profile if this student is on your caseload.
        </EmptyState>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {students.map((student) => {
            const signals = student.goals.map((goal) => computeDataSignal(goal));
            const attention = signals.find((signal) => signal === "NEEDS_ATTENTION" || signal === "NEEDS_DATA");
            return (
              <li key={student.id}>
                <Card className="h-full">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link href={`/students/${student.id}`} className="font-serif text-2xl hover:underline">
                        {student.preferredName}
                      </Link>
                      <p className="text-sm text-muted">
                        Grade {student.grade} · {student.school}
                      </p>
                      <p className="text-sm text-muted">Case manager: {student.caseManager.name}</p>
                    </div>
                    {attention ? <StatusIndicator signal={attention} /> : <StatusIndicator signal="ON_TRACK" />}
                  </div>
                  <p className="mt-3 text-sm">
                    {student.goals.length} IEP goal{student.goals.length === 1 ? "" : "s"}
                  </p>
                  <Button asChild variant="secondary" className="mt-4">
                    <Link href={`/students/${student.id}`}>Open profile</Link>
                  </Button>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
