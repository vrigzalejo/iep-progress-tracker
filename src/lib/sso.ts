import { ROLES, type Role } from "@/lib/constants";

export type SsoProviderButton = {
  id: string;
  label: string;
};

export function parseAllowedDomains(raw = process.env.AUTH_SSO_ALLOWED_DOMAINS) {
  return (raw ?? "")
    .split(",")
    .map((domain) => domain.trim().toLowerCase())
    .filter(Boolean);
}

export function isAllowedSsoEmail(email: string, domains = parseAllowedDomains()) {
  if (domains.length === 0) return true;
  const host = email.split("@")[1]?.toLowerCase();
  return Boolean(host && domains.includes(host));
}

export function isJitProvisionEnabled() {
  return process.env.AUTH_SSO_JIT_PROVISION === "true";
}

export function jitDefaultRole(): Role {
  const role = process.env.AUTH_SSO_JIT_ROLE?.trim();
  if (role && (ROLES as readonly string[]).includes(role)) return role as Role;
  return "EDUCATOR";
}

export function listSsoProviders(): SsoProviderButton[] {
  const providers: SsoProviderButton[] = [];
  if (
    process.env.AUTH_MICROSOFT_ENTRA_ID_ID?.trim() &&
    process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET?.trim() &&
    process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER?.trim()
  ) {
    providers.push({ id: "microsoft-entra-id", label: "Sign in with Microsoft" });
  }
  if (process.env.AUTH_GOOGLE_ID?.trim() && process.env.AUTH_GOOGLE_SECRET?.trim()) {
    providers.push({ id: "google", label: "Sign in with Google" });
  }
  if (
    process.env.AUTH_OIDC_ISSUER?.trim() &&
    process.env.AUTH_OIDC_ID?.trim() &&
    process.env.AUTH_OIDC_SECRET?.trim()
  ) {
    const name = process.env.AUTH_OIDC_NAME?.trim() || "school SSO";
    providers.push({ id: "oidc", label: `Sign in with ${name}` });
  }
  return providers;
}

export function isSsoConfigured() {
  return listSsoProviders().length > 0;
}

export function isCredentialsSignInEnabled() {
  if (process.env.AUTH_CREDENTIALS_ENABLED === "false" && isSsoConfigured()) {
    return false;
  }
  return true;
}

export function googleHostedDomain() {
  const explicit = process.env.AUTH_GOOGLE_HOSTED_DOMAIN?.trim();
  if (explicit) return explicit;
  const domains = parseAllowedDomains();
  return domains.length === 1 ? domains[0] : undefined;
}

export function signInErrorMessage(code: string | null) {
  switch (code) {
    case "AccessDenied":
      return "No matching school account. Ask an administrator to add your email first.";
    case "OAuthAccountNotLinked":
      return "This email already has another sign-in method. Use email and password, or ask an administrator for help.";
    case "Configuration":
      return "School sign-in is not configured yet.";
    case "OAuthCallback":
    case "Callback":
      return "School sign-in did not complete. Try again, or use email and password.";
    case null:
    case "":
      return "";
    default:
      return "Sign-in was not successful.";
  }
}
