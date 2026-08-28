import Link from "next/link";
import { requireStaff, searchRecords } from "@/lib/queries";
import { Card, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/alert";

export const metadata = { title: "Search" };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await requireStaff();
  const { q = "" } = await searchParams;
  const results = q.trim() ? await searchRecords(user, q.trim()) : { students: [], goals: [] };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="font-serif text-3xl">Search</h1>
      <p className="text-muted">Results stay inside your permitted caseload.</p>
      {!q.trim() ? (
        <EmptyState title="Type a name or goal phrase in the header">
          Search looks at preferred names, schools, and goal summaries you are allowed to see.
        </EmptyState>
      ) : results.students.length === 0 && results.goals.length === 0 ? (
        <EmptyState title="No matches">Try a preferred name, school, or a few words from a goal.</EmptyState>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}
