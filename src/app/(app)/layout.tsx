import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { PwaRegister } from "@/components/pwa-register";
import { countUnreadMessages, requireUser } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AuthenticatedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireUser();
  const unreadMessages = await countUnreadMessages(user);
  return (
    <AppShell user={user} unreadMessages={unreadMessages}>
      <PwaRegister />
      {children}
    </AppShell>
  );
}
