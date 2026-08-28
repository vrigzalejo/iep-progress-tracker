"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FieldError, Input, Label } from "@/components/ui/input";
import { DEMO_ACCOUNTS } from "@/lib/demo-accounts";
import { APP_NAME, DEMO_PASSPHRASE } from "@/lib/brand";
import { signInErrorMessage, type SsoProviderButton } from "@/lib/sso";

export function SignInForm({
  ssoProviders,
  credentialsEnabled,
}: {
  ssoProviders: SsoProviderButton[];
  credentialsEnabled: boolean;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(signInErrorMessage(params.get("error")));
  const [pending, setPending] = useState<"credentials" | string | null>(null);
  const showDemo = credentialsEnabled && process.env.NEXT_PUBLIC_DEMO_MODE !== "false";

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending("credentials");
    setError("");
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setPending(null);
    if (result?.error) {
      setError("Email or password is not correct, or the account is temporarily locked.");
      return;
    }
    router.push("/");
    router.refresh();
  }

  async function onSso(providerId: string) {
    setPending(providerId);
    setError("");
    await signIn(providerId, { callbackUrl: "/" });
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <Card>
        <h1 className="font-serif text-3xl">Sign in to {APP_NAME}</h1>
        <p className="mt-2 text-muted">
          Use your school-issued or family account. Sessions expire after eight hours.
        </p>
        {ssoProviders.length > 0 ? (
          <div className="mt-6 space-y-3">
            {ssoProviders.map((provider) => (
              <Button
                key={provider.id}
                type="button"
                variant="secondary"
                className="w-full"
                disabled={Boolean(pending)}
                onClick={() => onSso(provider.id)}
              >
                {pending === provider.id ? "Redirecting…" : provider.label}
              </Button>
            ))}
          </div>
        ) : null}
        {ssoProviders.length > 0 && credentialsEnabled ? (
          <p className="my-5 text-center text-sm font-semibold uppercase tracking-wide text-muted">
            or use email
          </p>
        ) : null}
        {credentialsEnabled ? (
          <form className={ssoProviders.length > 0 ? "space-y-4" : "mt-6 space-y-4"} onSubmit={onSubmit}>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            <FieldError>{error}</FieldError>
            <Button type="submit" disabled={Boolean(pending)} className="w-full">
              {pending === "credentials" ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        ) : (
          <FieldError>{error}</FieldError>
        )}
        <p className="mt-4 text-sm text-muted">
          {credentialsEnabled
            ? "After eight failed password attempts, sign-in is paused for 15 minutes. "
            : "School SSO signs you in with your district account. "}
          Read the{" "}
          <a className="font-semibold text-forest underline" href="/privacy-notice">
            privacy notice
          </a>{" "}
          before using real records in a production deployment.
        </p>
      </Card>
      <div className="space-y-4">
        {showDemo ? (
          <Card className="border-[#c9b45c] bg-[#fff9e9]">
            <p className="text-xs font-semibold uppercase tracking-wide text-gold">Demo mode</p>
            <h2 className="mt-1 font-serif text-2xl">Fictional sample school</h2>
            <p className="mt-2 text-sm text-muted">
              Shared passphrase for every demo account:{" "}
              <code className="rounded bg-white px-1.5 py-0.5">{DEMO_PASSPHRASE}</code>
            </p>
            <ul className="mt-4 space-y-2">
              {DEMO_ACCOUNTS.map((account) => (
                <li key={account.email}>
                  <button
                    type="button"
                    className="w-full rounded-lg border border-border bg-white px-3 py-3 text-left hover:border-forest"
                    onClick={() => {
                      setEmail(account.email);
                      setPassword(DEMO_PASSPHRASE);
                    }}
                  >
                    <span className="block text-sm font-semibold">{account.role}</span>
                    <span className="block text-sm text-muted">{account.name}</span>
                    <span className="block text-xs text-muted">{account.email}</span>
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        ) : (
          <Card>
            <h2 className="font-serif text-2xl">School accounts</h2>
            <p className="mt-2 text-sm text-muted">
              An administrator must add your work or family email before you can sign in. Roles stay
              in this app; your identity provider only proves who you are.
            </p>
          </Card>
        )}
        <p className="text-sm text-muted">
          {APP_NAME} is designed around FERPA-aligned practices: least privilege, audit logs, and
          data minimization. This demonstration is not a legal compliance certification.
        </p>
      </div>
    </div>
  );
}
