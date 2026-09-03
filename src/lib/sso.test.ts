import { afterEach, describe, expect, it } from "vitest";
import {
  googleHostedDomain,
  isAllowedSsoEmail,
  isCredentialsSignInEnabled,
  isJitProvisionEnabled,
  isSsoConfigured,
  jitDefaultRole,
  listSsoProviders,
  parseAllowedDomains,
  signInErrorMessage,
} from "./sso";

const SSO_KEYS = [
  "AUTH_MICROSOFT_ENTRA_ID_ID",
  "AUTH_MICROSOFT_ENTRA_ID_SECRET",
  "AUTH_MICROSOFT_ENTRA_ID_ISSUER",
  "AUTH_GOOGLE_ID",
  "AUTH_GOOGLE_SECRET",
  "AUTH_OIDC_ISSUER",
  "AUTH_OIDC_ID",
  "AUTH_OIDC_SECRET",
  "AUTH_OIDC_NAME",
  "AUTH_SSO_ALLOWED_DOMAINS",
  "AUTH_SSO_JIT_PROVISION",
  "AUTH_SSO_JIT_ROLE",
  "AUTH_CREDENTIALS_ENABLED",
  "AUTH_GOOGLE_HOSTED_DOMAIN",
  "NEXT_PUBLIC_DEMO_MODE",
] as const;

const original = new Map<string, string | undefined>();

function setEnv(values: Partial<Record<(typeof SSO_KEYS)[number], string | undefined>>) {
  for (const key of SSO_KEYS) {
    if (!original.has(key)) original.set(key, process.env[key]);
    const next = values[key];
    if (next === undefined) delete process.env[key];
    else process.env[key] = next;
  }
}

afterEach(() => {
  for (const [key, value] of original) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  original.clear();
});

describe("sso helpers", () => {
  it("parses allowed domains and ignores blanks", () => {
    expect(parseAllowedDomains(" District.edu, school.org , ")).toEqual([
      "district.edu",
      "school.org",
    ]);
  });

  it("allows any email when no domain list is set", () => {
    expect(isAllowedSsoEmail("anyone@example.com", [])).toBe(true);
  });

  it("restricts SSO emails to the allowlist", () => {
    const domains = ["district.edu"];
    expect(isAllowedSsoEmail("maya@district.edu", domains)).toBe(true);
    expect(isAllowedSsoEmail("maya@gmail.com", domains)).toBe(false);
  });

  it("defaults JIT off and educator role", () => {
    setEnv({ AUTH_SSO_JIT_PROVISION: undefined, AUTH_SSO_JIT_ROLE: "NOT_A_ROLE" });
    expect(isJitProvisionEnabled()).toBe(false);
    expect(jitDefaultRole()).toBe("EDUCATOR");
  });

  it("accepts a valid JIT role", () => {
    setEnv({ AUTH_SSO_JIT_PROVISION: "true", AUTH_SSO_JIT_ROLE: "PROVIDER" });
    expect(isJitProvisionEnabled()).toBe(true);
    expect(jitDefaultRole()).toBe("PROVIDER");
  });

  it("lists only fully configured providers", () => {
    setEnv({
      AUTH_MICROSOFT_ENTRA_ID_ID: "id",
      AUTH_MICROSOFT_ENTRA_ID_SECRET: "secret",
      AUTH_MICROSOFT_ENTRA_ID_ISSUER: "https://login.microsoftonline.com/tenant/v2.0",
      AUTH_GOOGLE_ID: "g",
      AUTH_OIDC_ISSUER: "https://sso.example.edu",
      AUTH_OIDC_ID: "oidc",
      AUTH_OIDC_SECRET: "oidc-secret",
      AUTH_OIDC_NAME: "ClassLink",
    });
    expect(listSsoProviders()).toEqual([
      { id: "microsoft-entra-id", label: "Sign in with Microsoft" },
      { id: "oidc", label: "Sign in with ClassLink" },
    ]);
    expect(isSsoConfigured()).toBe(true);
  });

  it("keeps credentials when SSO is missing even if they were turned off", () => {
    setEnv({ AUTH_CREDENTIALS_ENABLED: "false" });
    expect(isCredentialsSignInEnabled()).toBe(true);
  });

  it("hides credentials only when SSO is configured", () => {
    setEnv({
      AUTH_CREDENTIALS_ENABLED: "false",
      AUTH_GOOGLE_ID: "g",
      AUTH_GOOGLE_SECRET: "s",
    });
    expect(isCredentialsSignInEnabled()).toBe(false);
  });

  it("defaults production with SSO to SSO-only unless credentials are explicitly on", () => {
    setEnv({
      NEXT_PUBLIC_DEMO_MODE: "false",
      AUTH_GOOGLE_ID: "g",
      AUTH_GOOGLE_SECRET: "s",
      AUTH_CREDENTIALS_ENABLED: undefined,
    });
    expect(isCredentialsSignInEnabled()).toBe(false);
    setEnv({
      NEXT_PUBLIC_DEMO_MODE: "false",
      AUTH_GOOGLE_ID: "g",
      AUTH_GOOGLE_SECRET: "s",
      AUTH_CREDENTIALS_ENABLED: "true",
    });
    expect(isCredentialsSignInEnabled()).toBe(true);
  });

  it("uses an explicit Google hosted domain or a single allowlist domain", () => {
    setEnv({ AUTH_GOOGLE_HOSTED_DOMAIN: "schools.k12.us", AUTH_SSO_ALLOWED_DOMAINS: "a.edu,b.edu" });
    expect(googleHostedDomain()).toBe("schools.k12.us");
    setEnv({ AUTH_GOOGLE_HOSTED_DOMAIN: undefined, AUTH_SSO_ALLOWED_DOMAINS: "district.edu" });
    expect(googleHostedDomain()).toBe("district.edu");
  });

  it("maps Auth.js error codes for the sign-in page", () => {
    expect(signInErrorMessage("AccessDenied")).toMatch(/administrator/i);
    expect(signInErrorMessage(null)).toBe("");
  });
});
