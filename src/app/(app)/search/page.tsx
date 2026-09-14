import Link from "next/link";
import { requireStaff, searchRecords, listSchools } from "@/lib/queries";
import { Card, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { SERVICE_AREA_LABELS, SERVICE_AREAS, SIGNAL_LABELS, DATA_SIGNALS } from "@/lib/constants";

export const metadata = { title: "Search" };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    school?: string;
    grade?: string;
    serviceArea?: string;
    signal?: string;
    reportDue?: string;
  }>;
}) {
  const user = await requireStaff();
  const filters = await searchParams;
  const schools = await listSchools(user);
  const grades = ["K", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
  const hasFilter = Boolean(
    filters.q?.trim() ||
      filters.school ||
      filters.grade ||
      filters.serviceArea ||
      filters.signal ||
      filters.reportDue,
  );
  const results = hasFilter ? await searchRecords(user, filters) : { students: [], goals: [] };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="font-serif text-3xl">Search</h1>
      <p className="text-muted">Results stay inside your permitted caseload.</p>
      <form method="get" className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="q">Name or goal phrase</Label>
          <Input id="q" name="q" defaultValue={filters.q ?? ""} />
        </div>
        <div>
          <Label htmlFor="school">School</Label>
          <Select id="school" name="school" defaultValue={filters.school ?? ""}>
            <option value="">Any school</option>
            {schools.map((school) => (
              <option key={school.id} value={school.name}>
                {school.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="grade">Grade</Label>
          <Select id="grade" name="grade" defaultValue={filters.grade ?? ""}>
            <option value="">Any grade</option>
            {grades.map((grade) => (
              <option key={grade} value={grade}>
                {grade}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="serviceArea">Service area</Label>
          <Select id="serviceArea" name="serviceArea" defaultValue={filters.serviceArea ?? ""}>
            <option value="">Any area</option>
            {SERVICE_AREAS.map((area) => (
              <option key={area} value={area}>
                {SERVICE_AREA_LABELS[area]}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="signal">Data signal</Label>
          <Select id="signal" name="signal" defaultValue={filters.signal ?? ""}>
            <option value="">Any signal</option>
            {DATA_SIGNALS.map((signal) => (
              <option key={signal} value={signal}>
                {SIGNAL_LABELS[signal]}
              </option>
            ))}
          </Select>
        </div>
        <label className="flex min-h-11 items-center gap-2 sm:col-span-2">
          <input type="checkbox" name="reportDue" value="overdue" defaultChecked={filters.reportDue === "overdue"} />
          Report date is overdue
        </label>
        <div>
          <Button type="submit">Apply filters</Button>
        </div>
      </form>
      {!hasFilter ? (
        <EmptyState title="Search or filter the caseload">
          Type a preferred name or choose school, grade, service area, data signal, or overdue
          reports.
        </EmptyState>
      ) : results.students.length === 0 && results.goals.length === 0 ? (
        <EmptyState title="No matches">Try a preferred name, school, or a few words from a goal.</EmptyState>
      ) : (
        <>
          {results.students.length > 0 ? (
            <Card>
              <CardTitle>Students</CardTitle>
              <ul className="mt-3 space-y-2">
                {results.students.map((student) => (
                  <li key={student.id}>
                    <Link className="font-semibold text-forest underline" href={`/students/${student.id}`}>
                      {student.preferredName}
                    </Link>
                    <span className="text-sm text-muted">
                      {" "}
                      · Grade {student.grade} · {student.school}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
          {results.goals.length > 0 ? (
            <Card>
              <CardTitle>Goals</CardTitle>
              <ul className="mt-3 space-y-2">
                {results.goals.map((goal) => (
                  <li key={goal.id}>
                    <Link className="font-semibold text-forest underline" href={`/goals/${goal.id}`}>
                      {goal.student.preferredName}
                    </Link>
                    <p className="text-sm text-muted">{goal.plainLanguageSummary}</p>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
        </>
      )}
    </div>
  );
}
