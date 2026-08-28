import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/db";
import { seedDemoData } from "@/lib/seed";
import { signInSchema } from "@/lib/validation";
import type { Role } from "@/lib/constants";
import { writeAudit } from "@/lib/audit";

const MAX_FAILED = 8;
const LOCK_MINUTES = 15;

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
  },
  providers: [
    Credentials({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        await seedDemoData();
        const parsed = signInSchema.safeParse(raw);
        if (!parsed.success) return null;
        const email = parsed.data.email.toLowerCase().trim();
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || user.deactivatedAt) return null;

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
                failed >= MAX_FAILED
                  ? new Date(Date.now() + LOCK_MINUTES * 60_000)
                  : null,
            },
          });
          return null;
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
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role as Role,
          organizationId: user.organizationId,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.organizationId = user.organizationId;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.organizationId = token.organizationId as string;
      }
      return session;
    },
  },
});
