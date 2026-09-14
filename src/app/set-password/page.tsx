import Link from "next/link";
import { setPasswordFromTokenAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormError } from "@/components/ui/alert";
import { Input, Label } from "@/components/ui/input";

export const metadata = { title: "Set password" };

export default async function SetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ uid?: string; t?: string; error?: string }>;
}) {
  const { uid = "", t = "", error } = await searchParams;
  return (
    <div className="min-h-screen px-4 py-10 pt-[max(2.5rem,env(safe-area-inset-top))]">
      <Card className="mx-auto max-w-md">
        <h1 className="font-serif text-3xl">Choose a password</h1>
        <p className="mt-2 text-muted">
          Use at least 12 characters with upper and lower case, a number, and a symbol.
        </p>
        <FormError error={error} />
        <form action={setPasswordFromTokenAction} className="mt-6 space-y-4">
          <input type="hidden" name="userId" value={uid} />
          <input type="hidden" name="token" value={t} />
          <div>
            <Label htmlFor="newPassword">New password</Label>
            <Input
              id="newPassword"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              required
            />
          </div>
          <div>
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
            />
          </div>
          <Button type="submit" className="w-full">
            Save password
          </Button>
        </form>
        <p className="mt-4 text-sm">
          <Link className="font-semibold text-forest underline" href="/sign-in">
            Back to sign in
          </Link>
        </p>
      </Card>
    </div>
  );
}
