import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AuthenticatedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireUser();
  return <AppShell user={user}>{children}</AppShell>;
}
