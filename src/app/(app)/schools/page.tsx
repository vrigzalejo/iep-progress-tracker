import { archiveSchoolAction, createSchoolAction } from "@/app/actions";
import { ConfirmSubmit } from "@/components/confirm-submit";
import { FormError } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { requirePermission, listSchools } from "@/lib/queries";

export const metadata = { title: "Schools" };

export default async function SchoolsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const user = await requirePermission("team.manage");
  const schools = await listSchools(user, { includeArchived: true });
  const { saved, error } = await searchParams;
  const active = schools.filter((school) => !school.archivedAt);
  const archived = schools.filter((school) => school.archivedAt);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="font-serif text-3xl">Schools</h1>
        <p className="mt-2 text-muted">
          Add campus names this organization uses. Students pick from this list. This is not a
          district SIS roster and does not import IEP goals.
        </p>
      </header>
      {saved ? (
        <p className="rounded-lg border border-forest bg-[#eef6f2] px-4 py-3" role="status">
          {saved === "archived" ? "School archived." : "School saved."}
        </p>
      ) : null}
      <FormError error={error} />

      <Card>
        <CardTitle>Add a school</CardTitle>
        <form action={createSchoolAction} className="mt-4 space-y-4">
          <div>
            <Label htmlFor="name">Campus name</Label>
            <Input id="name" name="name" required minLength={2} maxLength={120} placeholder="Liwanag Elementary" />
          </div>
          <div>
            <Label htmlFor="code">Short code (optional)</Label>
            <Input id="code" name="code" maxLength={20} placeholder="ELEM" />
          </div>
          <Button type="submit">Save school</Button>
        </form>
      </Card>

      <Card>
        <CardTitle>Active campuses</CardTitle>
        {active.length === 0 ? (
          <p className="mt-3 text-sm text-muted">None yet. Add the schools this team serves.</p>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {active.map((school) => (
              <li key={school.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-semibold">{school.name}</p>
                  <p className="text-sm text-muted">
                    {school.code ? `${school.code} · ` : ""}
                    {school._count.students} student{school._count.students === 1 ? "" : "s"}
                  </p>
                </div>
                <form action={archiveSchoolAction}>
                  <input type="hidden" name="schoolId" value={school.id} />
                  <ConfirmSubmit
                    message="Archive this school? Existing student profiles keep the campus name. New profiles cannot pick it."
                    label="Archive"
                    variant="secondary"
                  />
                </form>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {archived.length > 0 ? (
        <Card>
          <CardTitle>Archived</CardTitle>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            {archived.map((school) => (
              <li key={school.id}>
                {school.name}
                {school.code ? ` · ${school.code}` : ""}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-muted">Add the same name again to restore it to the picker.</p>
        </Card>
      ) : null}
    </div>
  );
}
