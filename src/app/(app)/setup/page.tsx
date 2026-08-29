import { changePasswordAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Alert, FormError } from "@/components/ui/alert";
import { requireUser } from "@/lib/queries";
import { prisma } from "@/lib/db";
import Link from "next/link";

export const metadata = { title: "Account setup" };

export default async function SetupPage({
  searchParams,
}: {
  searchParams: Promise<{ updated?: string; error?: string }>;
}) {
  const user = await requireUser();
  const { updated, error } = await searchParams;
  const record = await prisma.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true },
  });
  const hasPassword = Boolean(record?.passwordHash);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="font-serif text-3xl">Account setup</h1>
        <p className="mt-2 text-muted">
          Signed in as {user.name} ({user.email}).
          {hasPassword
            ? " Change the demo passphrase before any real deployment."
            : " This account signs in with school SSO."}
        </p>
      </div>
      {updated ? (
        <Alert title="Password updated" tone="success">
          Use the new password at the next sign-in.
        </Alert>
      ) : null}
      <FormError error={error} />
      <Card>
        <CardTitle>{hasPassword ? "Change password" : "School SSO"}</CardTitle>
        {hasPassword ? (
          <form action={changePasswordAction} className="mt-4 space-y-4">
            <div>
              <Label htmlFor="currentPassword">Current password</Label>
              <Input id="currentPassword" name="currentPassword" type="password" required />
            </div>
            <div>
              <Label htmlFor="newPassword">New password</Label>
              <Input id="newPassword" name="newPassword" type="password" required minLength={12} />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <Input id="confirmPassword" name="confirmPassword" type="password" required />
            </div>
            <Button type="submit">Update password</Button>
          </form>
        ) : (
          <p className="mt-3 text-sm text-muted">
            Password sign-in is not set for this account. Use your district Microsoft, Google, or
            school SSO provider. An administrator can add a temporary password if you need a
            break-glass login.
          </p>
        )}
      </Card>
      <Link href="/guide" className="font-semibold text-forest underline">
        Continue to the setup guide
      </Link>
    </div>
  );
}
