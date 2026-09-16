import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { AppShell } from "@/components/app-shell";
import { countUnreadMessages, requireUser } from "@/lib/queries";
import { prisma } from "@/lib/db";
import { FAMILY_LOCALE_COOKIE, resolveFamilyLocale } from "@/lib/family-locale";

export const dynamic = "force-dynamic";

export default async function AuthenticatedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireUser();
  const unreadMessages = await countUnreadMessages(user);
  const locale =
    user.role === "PARENT"
      ? resolveFamilyLocale(
          (await cookies()).get(FAMILY_LOCALE_COOKIE)?.value,
          (
            await prisma.guardianContact.findFirst({
              where: { userId: user.id },
              select: { familyLocale: true },
            })
          )?.familyLocale,
        )
      : "en";
  return (
    <AppShell user={user} unreadMessages={unreadMessages} locale={locale}>
      {children}
    </AppShell>
  );
}
