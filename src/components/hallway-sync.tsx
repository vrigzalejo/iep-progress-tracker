"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import {
  flushQueuedSessions,
  getQueuedCountServerSnapshot,
  getQueuedCountSnapshot,
  refreshQueuedCount,
  subscribeQueuedCount,
} from "@/lib/hallway-queue";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function HallwaySync() {
  const pending = useSyncExternalStore(
    subscribeQueuedCount,
    getQueuedCountSnapshot,
    getQueuedCountServerSnapshot,
  );
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    const onOnline = () => {
      void flushQueuedSessions().then((result) => {
        setStatus(
          result.failed.length
            ? `${result.failed.length} session${result.failed.length === 1 ? "" : "s"} still waiting to sync.`
            : result.flushed
              ? `Synced ${result.flushed} queued session${result.flushed === 1 ? "" : "s"}.`
              : null,
        );
      });
    };
    window.addEventListener("online", onOnline);
    void refreshQueuedCount().then(() => {
      if (navigator.onLine) onOnline();
    });
    return () => window.removeEventListener("online", onOnline);
  }, []);

  if (pending === 0 && !status) return null;

  return (
    <Alert title={pending ? "Offline sessions waiting" : "Sync"} tone={pending ? "warning" : "success"}>
      {status ??
        `${pending} session${pending === 1 ? "" : "s"} saved on this device. They will upload when the hallway Wi‑Fi returns.`}
      {pending > 0 ? (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="mt-3"
          onClick={() => void flushQueuedSessions()}
        >
          Try sync now
        </Button>
      ) : null}
    </Alert>
  );
}
