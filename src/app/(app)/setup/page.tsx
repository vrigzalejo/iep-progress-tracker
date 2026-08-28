import { changePasswordAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Alert, FormError } from "@/components/ui/alert";
import { requireUser } from "@/lib/queries";
import Link from "next/link";

export const metadata = { title: "Account setup" };

export default async function SetupPage({
  searchParams,
}: {
  searchParams: Promise<{ updated?: string; error?: string }>;
}) {
  const user = await requireUser();
  const { updated, error } = await searchParams;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="font-serif text-3xl">Account setup</h1>
        <p className="mt-2 text-muted">
          Signed in as {user.name} ({user.email}). Change the demo passphrase before any real
          deployment.
        </p>
      </div>
      {updated ? (
        <Alert title="Password updated" tone="success">
          Use the new password at the next sign-in.
        </Alert>
      ) : null}
      <FormError error={error} />
      <Card>
        <CardTitle>Change password</CardTitle>
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
      </Card>
      <Link href="/guide" className="font-semibold text-forest underline">
        Continue to the setup guide
      </Link>
    </div>
  );
}
