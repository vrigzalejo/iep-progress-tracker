import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import type { Provider } from "next-auth/providers";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/db";
import { signInSchema } from "@/lib/validation";
import type { Role } from "@/lib/constants";
import { writeAudit } from "@/lib/audit";
import { isDemoMode } from "@/lib/runtime";
import { decryptSecret, verifyTotp } from "@/lib/totp";
import {
  googleHostedDomain,
  isAllowedSsoEmail,
  isCredentialsSignInEnabled,
  isJitProvisionEnabled,
  jitDefaultRole,
} from "@/lib/sso";

const MAX_FAILED = 8;
const LOCK_MINUTES = 15;

class MfaRequiredError extends CredentialsSignin {
  code = "mfa_required";
}

const credentialsProvider = Credentials({
  name: "Email and password",
  credentials: {
    email: { label: "Email", type: "email" },
    password: { label: "Password", type: "password" },
    totp: { label: "Authenticator code", type: "text" },
  },
  async authorize(raw) {
    const parsed = signInSchema.safeParse(raw);
    if (!parsed.success) return null;
    const email = parsed.data.email.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.deactivatedAt || !user.passwordHash) return null;

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return null;
    }

    const valid = await compare(parsed.data.password, user.passwordHash);
    if (!valid) {
      const failed = user.failedSignIns + 1;
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedSignIns: failed,
          lockedUntil:
            failed >= MAX_FAILED ? new Date(Date.now() + LOCK_MINUTES * 60_000) : null,
        },
      });
      return null;
    }

    if (user.totpEnabledAt && user.totpSecret) {
      const totp = typeof raw?.totp === "string" ? raw.totp.replace(/\s/g, "") : "";
      if (!totp) throw new MfaRequiredError();
      try {
        const secret = decryptSecret(user.totpSecret);
        if (!verifyTotp(secret, totp)) return null;
      } catch {
        return null;
      }
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { failedSignIns: 0, lockedUntil: null, lastLoginAt: new Date() },
    });

    await writeAudit({
      organizationId: user.organizationId,
      userId: user.id,
      action: "auth.sign_in",
      resourceType: "user",
      resourceId: user.id,
      details: "provider=credentials",
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as Role,
      organizationId: user.organizationId,
    };
  },
});

function ssoProviders(): Provider[] {
  const providers: Provider[] = [];
  const microsoftId = process.env.AUTH_MICROSOFT_ENTRA_ID_ID?.trim();
  const microsoftSecret = process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET?.trim();
  const microsoftIssuer = process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER?.trim();
  if (microsoftId && microsoftSecret && microsoftIssuer) {
    providers.push(
      MicrosoftEntraID({
        clientId: microsoftId,
        clientSecret: microsoftSecret,
        issuer: microsoftIssuer,
        allowDangerousEmailAccountLinking: true,
      }),
    );
  }

  const googleId = process.env.AUTH_GOOGLE_ID?.trim();
  const googleSecret = process.env.AUTH_GOOGLE_SECRET?.trim();
  if (googleId && googleSecret) {
    const hostedDomain = googleHostedDomain();
    providers.push(
      Google({
        clientId: googleId,
        clientSecret: googleSecret,
        allowDangerousEmailAccountLinking: true,
        ...(hostedDomain ? { authorization: { params: { hd: hostedDomain } } } : {}),
      }),
    );
  }

  const oidcIssuer = process.env.AUTH_OIDC_ISSUER?.trim();
  const oidcId = process.env.AUTH_OIDC_ID?.trim();
  const oidcSecret = process.env.AUTH_OIDC_SECRET?.trim();
  if (oidcIssuer && oidcId && oidcSecret) {
    providers.push({
      id: "oidc",
      name: process.env.AUTH_OIDC_NAME?.trim() || "School SSO",
      type: "oidc",
      issuer: oidcIssuer,
      clientId: oidcId,
      clientSecret: oidcSecret,
      allowDangerousEmailAccountLinking: true,
    });
  }

  return providers;
}

function authProviders(): Provider[] {
  const oauthProviders = ssoProviders();
  return [
    ...(isCredentialsSignInEnabled() || oauthProviders.length === 0
      ? [credentialsProvider]
      : []),
    ...oauthProviders,
  ];
}

async function provisionSsoUser(email: string, name: string) {
  const orgId = process.env.AUTH_SSO_ORGANIZATION_ID?.trim();
  const org = orgId
    ? await prisma.organization.findUnique({ where: { id: orgId } })
    : await prisma.organization.findFirst({ orderBy: { createdAt: "asc" } });
  if (!org) return null;
  return prisma.user.create({
    data: {
      email,
      name,
      role: jitDefaultRole(),
      passwordHash: null,
      organizationId: org.id,
    },
  });
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60,
    updateAge: 30 * 60,
  },
  pages: {
    signIn: "/sign-in",
    error: "/sign-in",
  },
  providers: authProviders(),
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!account || account.provider === "credentials") return true;
      const email = user.email?.toLowerCase().trim();
      if (!email || !isAllowedSsoEmail(email)) return false;
      if (
        account.provider === "google" &&
        profile &&
        "email_verified" in profile &&
        profile.email_verified !== true
      ) {
        return false;
      }

      let record = await prisma.user.findUnique({ where: { email } });
      if (!record && isJitProvisionEnabled()) {
        record = await provisionSsoUser(email, user.name?.trim() || email);
      }
      if (!record || record.deactivatedAt) return false;

      await prisma.user.update({
        where: { id: record.id },
        data: { failedSignIns: 0, lockedUntil: null, lastLoginAt: new Date() },
      });
      await writeAudit({
        organizationId: record.organizationId,
        userId: record.id,
        action: "auth.sign_in",
        resourceType: "user",
        resourceId: record.id,
        details: `provider=${account.provider}`,
      });
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        const email = user.email?.toLowerCase().trim();
        const record = email
          ? await prisma.user.findUnique({ where: { email } })
          : user.id
            ? await prisma.user.findUnique({ where: { id: user.id } })
            : null;
        if (!record || record.deactivatedAt) {
          throw new Error("No matching school account.");
        }
        token.id = record.id;
        token.role = record.role as Role;
        token.organizationId = record.organizationId;
        token.mfaEnrollRequired =
          !isDemoMode() && Boolean(record.passwordHash) && !record.totpEnabledAt;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.organizationId = token.organizationId as string;
        session.user.mfaEnrollRequired = Boolean(token.mfaEnrollRequired);
      }
      return session;
    },
  },
});
