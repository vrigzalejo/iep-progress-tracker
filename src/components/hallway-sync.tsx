"use client";

import { useEffect, useState } from "react";
import { flushQueuedSessions, listQueuedSessions } from "@/lib/hallway-queue";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function HallwaySync() {
  const [pending, setPending] = useState(0);
  const [status, setStatus] = useState<string | null>(null);

  async function refresh() {
    if (typeof indexedDB === "undefined") return;
    const items = await listQueuedSessions();
    setPending(items.length);
  }

  useEffect(() => {
    void refresh();
    const onOnline = () => {
      void flushQueuedSessions().then((result) => {
        setStatus(
          result.failed.length
            ? `${result.failed.length} session${result.failed.length === 1 ? "" : "s"} still waiting to sync.`
            : result.flushed
              ? `Synced ${result.flushed} queued session${result.flushed === 1 ? "" : "s"}.`
              : null,
        );
        void refresh();
      });
    };
    window.addEventListener("online", onOnline);
    if (navigator.onLine) onOnline();
    return () => window.removeEventListener("online", onOnline);
  }, []);

  if (pending === 0 && !status) return null;

  return (
    <Alert title={pending ? "Offline sessions waiting" : "Sync"} tone={pending ? "warning" : "success"}>
      {status ??
        `${pending} session${pending === 1 ? "" : "s"} saved on this device. They will upload when the hallway Wi‑Fi returns.`}
      {pending > 0 ? (
        <Button type="button" variant="secondary" size="sm" className="mt-3" onClick={() => void flushQueuedSessions().then(refresh)}>
          Try sync now
        </Button>
      ) : null}
    </Alert>
  );
}
