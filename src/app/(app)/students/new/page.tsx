import { createStudentAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { requirePermission, listTeam } from "@/lib/queries";

export const metadata = { title: "Add student" };

export default async function NewStudentPage() {
  const user = await requirePermission("student.create");
  const team = await listTeam(user);
  const educators = team.filter((member) => member.role === "EDUCATOR" || member.role === "ADMINISTRATOR");
  const providers = team.filter((member) => member.role === "PROVIDER" || member.role === "EDUCATOR");

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-serif text-3xl">Add a student profile</h1>
      <p className="mt-2 text-muted">
        Collect only what the team needs for IEP progress tracking. Do not add medical diagnoses,
        Social Security numbers, or full educational history here.
      </p>
      <Card className="mt-6">
        <CardTitle>Minimum profile</CardTitle>
        <form action={createStudentAction} className="mt-4 space-y-4">
          <div>
            <Label htmlFor="preferredName">Preferred name</Label>
            <Input id="preferredName" name="preferredName" required maxLength={80} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="grade">Grade</Label>
              <Input id="grade" name="grade" required maxLength={20} />
            </div>
            <div>
              <Label htmlFor="school">School</Label>
              <Input id="school" name="school" required maxLength={120} />
            </div>
          </div>
          <div>
            <Label htmlFor="caseManagerId">Case manager</Label>
            <Select id="caseManagerId" name="caseManagerId" defaultValue={user.id} required>
              {educators.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="iepAnnualReviewAt">Annual IEP review (optional)</Label>
              <Input id="iepAnnualReviewAt" name="iepAnnualReviewAt" type="date" />
            </div>
            <div>
              <Label htmlFor="iepTriennialAt">Triennial evaluation (optional)</Label>
              <Input id="iepTriennialAt" name="iepTriennialAt" type="date" />
            </div>
          </div>
          <div>
            <Label htmlFor="presentLevels">Present levels snapshot (optional)</Label>
            <Textarea
              id="presentLevels"
              name="presentLevels"
              placeholder="Only the present levels needed to understand current goals."
            />
          </div>
          <fieldset>
            <legend className="mb-2 text-sm font-semibold">Service providers</legend>
            <div className="space-y-2">
              {providers.map((member) => (
                <label key={member.id} className="flex min-h-11 items-center gap-2">
                  <input type="checkbox" name="providerIds" value={member.id} className="h-4 w-4" />
                  {member.name} {member.title ? `· ${member.title}` : ""}
                </label>
              ))}
            </div>
          </fieldset>
          <Button type="submit">Save profile</Button>
        </form>
      </Card>
    </div>
  );
}
