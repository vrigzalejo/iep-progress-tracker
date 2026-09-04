"use client";

import { useRouter } from "next/navigation";
import type { FormEvent, ReactNode } from "react";
import { enqueueSession } from "@/lib/hallway-queue";

export function HallwayForm({
  children,
  nextHref,
}: {
  children: ReactNode;
  nextHref: string;
}) {
  const router = useRouter();

  async function onSubmit(event: FormEvent<HTMLDivElement>) {
    if (navigator.onLine) return;
    event.preventDefault();
    const form = (event.target as HTMLElement | null)?.closest("form");
    if (!form) return;
    const data = new FormData(form);
    const payload: Record<string, unknown> = {};
    for (const [key, value] of data.entries()) {
      if (typeof value === "string") {
        if (key === "standingAccommodation") {
          const current = typeof payload.accommodations === "string" ? payload.accommodations : "";
          payload.accommodations = current ? `${current}, ${value}` : value;
        } else {
          payload[key] = value;
        }
      }
    }
    await enqueueSession(payload);
    router.push(nextHref.includes("?") ? `${nextHref}&queued=1` : `${nextHref}?queued=1`);
  }

  return (
    <div onSubmitCapture={onSubmit}>{children}</div>
  );
}
