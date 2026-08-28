import {
  createTeamMemberAction,
  deactivateUserAction,
  setUserRoleAction,
} from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/input";
import { FormError } from "@/components/ui/alert";
import { requirePermission, listTeam } from "@/lib/queries";
import { PERMISSION_MATRIX } from "@/lib/permissions";
import { ConfirmSubmit } from "@/components/confirm-submit";
import { formatDate } from "@/lib/utils";
import { ROLE_LABELS, ROLES } from "@/lib/constants";

export const metadata = { title: "Team and permissions" };

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const user = await requirePermission("team.manage");
  const team = await listTeam(user);
  const { saved, error } = await searchParams;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-serif text-3xl">Team and permissions</h1>
        <p className="mt-2 text-muted">
          Least privilege is the default. Parents only see their linked student. Providers only see
          assigned students.
        </p>
      </div>
      {saved ? (
        <p className="rounded-lg border border-forest bg-[#eef6f2] px-4 py-3" role="status">
          Team change saved.
        </p>
      ) : null}
      <FormError error={error} />

      <Card className="overflow-x-auto">
        <CardTitle>Role matrix</CardTitle>
        <table className="mt-4 min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="py-2 pr-3">Capability</th>
              <th className="py-2 pr-3">Administrator</th>
              <th className="py-2 pr-3">Educator</th>
              <th className="py-2 pr-3">Provider</th>
              <th className="py-2">Parent / guardian</th>
            </tr>
          </thead>
          <tbody>
            {PERMISSION_MATRIX.map((row) => (
              <tr key={row.capability} className="border-b border-border/70">
                <td className="py-2 pr-3 font-medium">{row.capability}</td>
                <td className="py-2 pr-3">{row.administrator}</td>
                <td className="py-2 pr-3">{row.educator}</td>
                <td className="py-2 pr-3">{row.provider}</td>
                <td className="py-2">{row.parent}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card>
        <CardTitle>People in this school</CardTitle>
        <ul className="mt-4 divide-y divide-border">
          {team.map((member) => (
            <li key={member.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold">{member.name}</p>
                <p className="text-sm text-muted">
                  {member.email} · {ROLE_LABELS[member.role as keyof typeof ROLE_LABELS]}
                  {member.deactivatedAt ? " · deactivated" : ""}
                </p>
                <p className="text-xs text-muted">
                  Last sign-in: {member.lastLoginAt ? formatDate(member.lastLoginAt) : "Not yet"}
                </p>
              </div>
              {member.id !== user.id && !member.deactivatedAt ? (
                <div className="flex flex-wrap gap-2">
                  <form action={setUserRoleAction} className="flex gap-2">
                    <input type="hidden" name="userId" value={member.id} />
                    <Label htmlFor={`role-${member.id}`} className="sr-only">
                      Role for {member.name}
                    </Label>
                    <Select id={`role-${member.id}`} name="role" defaultValue={member.role}>
                      {ROLES.map((role) => (
                        <option key={role} value={role}>
                          {ROLE_LABELS[role]}
                        </option>
                      ))}
                    </Select>
                    <Button type="submit" variant="secondary" size="sm">
                      Update
                    </Button>
                  </form>
                  <form action={deactivateUserAction}>
                    <input type="hidden" name="userId" value={member.id} />
                    <ConfirmSubmit
                      message={`Deactivate ${member.name}? They will not be able to sign in.`}
                      label="Deactivate"
                    />
                  </form>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <CardTitle>Add a team member</CardTitle>
        <form action={createTeamMemberAction} className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" />
          </div>
          <div>
            <Label htmlFor="role">Role</Label>
            <Select id="role" name="role" defaultValue="EDUCATOR">
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role]}
                </option>
              ))}
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="password">Temporary password</Label>
            <Input id="password" name="password" type="password" required minLength={12} />
            <p className="mt-1 text-sm text-muted">
              At least 12 characters with upper, lower, number, and symbol.
            </p>
          </div>
          <div>
            <Button type="submit">Create account</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
