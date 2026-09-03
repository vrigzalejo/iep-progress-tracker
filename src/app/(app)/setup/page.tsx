import {
  beginMfaAction,
  changePasswordAction,
  confirmMfaAction,
  disableMfaAction,
} from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Alert, FormError } from "@/components/ui/alert";
import { requireUser } from "@/lib/queries";
import { prisma } from "@/lib/db";
import { decryptSecret, otpauthUrl } from "@/lib/totp";
import { isDemoMode } from "@/lib/runtime";
import Link from "next/link";

export const metadata = { title: "Account setup" };

export default async function SetupPage({
  searchParams,
}: {
  searchParams: Promise<{ updated?: string; error?: string; mfa?: string }>;
}) {
  const user = await requireUser();
  const { updated, error, mfa } = await searchParams;
  const record = await prisma.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true, totpSecret: true, totpEnabledAt: true },
  });
  const hasPassword = Boolean(record?.passwordHash);
  const mfaEnabled = Boolean(record?.totpEnabledAt);
  let enrollSecret = "";
  if (mfa === "enroll" && record?.totpSecret && !mfaEnabled) {
    try {
      enrollSecret = decryptSecret(record.totpSecret);
    } catch {
      enrollSecret = "";
    }
  }
  const mfaRequired = mfa === "required" || Boolean(user.mfaEnrollRequired);

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
      {mfaRequired && hasPassword && !mfaEnabled ? (
        <Alert title="Authenticator required" tone="warning">
          Password sign-in is on while demonstration mode is off. Enroll an authenticator before
          using other screens, or turn on school SSO and set AUTH_CREDENTIALS_ENABLED=false.
        </Alert>
      ) : null}
      {updated === "1" ? (
        <Alert title="Password updated" tone="success">
          Use the new password at the next sign-in.
        </Alert>
      ) : null}
      {updated === "mfa" ? (
        <Alert title="Authenticator enabled" tone="success">
          Sign in next time with your password and a 6-digit code.
        </Alert>
      ) : null}
      {updated === "mfa-off" ? (
        <Alert title="Authenticator turned off" tone="success">
          This account now signs in with email and password only.
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
      {hasPassword ? (
        <Card>
          <CardTitle>Authenticator app (MFA)</CardTitle>
          <p className="mt-2 text-sm text-muted">
            Optional in demonstration mode. Required for password accounts when demonstration mode
            is off. School SSO accounts do not need this.
          </p>
          {mfaEnabled ? (
            <form action={disableMfaAction} className="mt-4 space-y-4">
              <div>
                <Label htmlFor="disablePassword">Current password</Label>
                <Input id="disablePassword" name="currentPassword" type="password" required />
              </div>
              <div>
                <Label htmlFor="disableTotp">Authenticator code</Label>
                <Input id="disableTotp" name="totp" inputMode="numeric" autoComplete="one-time-code" required />
              </div>
              <Button type="submit" variant="secondary">
                Turn off authenticator
              </Button>
            </form>
          ) : enrollSecret ? (
            <div className="mt-4 space-y-4">
              <p className="text-sm">
                Add this account in your authenticator app using the key below, then enter a code to
                confirm.
              </p>
              <p className="break-all rounded-lg bg-paper p-3 font-mono text-sm">{enrollSecret}</p>
              <p className="break-all text-xs text-muted">{otpauthUrl(enrollSecret, user.email)}</p>
              <form action={confirmMfaAction} className="space-y-4">
                <div>
                  <Label htmlFor="confirmTotp">Authenticator code</Label>
                  <Input id="confirmTotp" name="totp" inputMode="numeric" autoComplete="one-time-code" required />
                </div>
                <Button type="submit">Confirm authenticator</Button>
              </form>
            </div>
          ) : (
            <form action={beginMfaAction} className="mt-4">
              <Button type="submit">{isDemoMode() ? "Set up authenticator" : "Set up authenticator (required)"}</Button>
            </form>
          )}
        </Card>
      ) : null}
      <Link href="/guide" className="font-semibold text-forest underline">
        Continue to the setup guide
      </Link>
    </div>
  );
}
