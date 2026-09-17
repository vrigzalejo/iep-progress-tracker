import Link from "next/link";
import { requestPasswordResetAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, FormError } from "@/components/ui/alert";
import { Input, Label } from "@/components/ui/input";
import { APP_NAME } from "@/lib/brand";
import { mailConfigured } from "@/lib/mail";

export const metadata = { title: "Forgot password" };

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const { sent, error } = await searchParams;
  return (
    <div className="min-h-screen px-4 py-10 pt-[max(2.5rem,env(safe-area-inset-top))]">
      <Card className="mx-auto max-w-md">
        <h1 className="font-serif text-3xl">Set or reset a password</h1>
        <p className="mt-2 text-muted">
          Enter the work or family email on file. If it matches an account, {APP_NAME} sends a
          link. The message does not include student records.
        </p>
        {sent ? (
          <Alert title="Check your email" tone="success">
            If that email is on a school account and mail is configured, a link is on the way. The
            link expires in two hours. An administrator can also set a temporary password on Team.
          </Alert>
        ) : null}
        <FormError error={error} />
        {!mailConfigured() ? (
          <Alert title="Mail is not configured" tone="warning">
            Ask an administrator to set a temporary password on Team, or use school SSO.
          </Alert>
        ) : (
          <form action={requestPasswordResetAction} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" autoComplete="username" required />
            </div>
            <Button type="submit" className="w-full">
              Send password link
            </Button>
          </form>
        )}
        <p className="mt-4 text-sm">
          <Link className="font-semibold text-forest underline" href="/sign-in">
            Back to sign in
          </Link>
        </p>
      </Card>
    </div>
  );
}
