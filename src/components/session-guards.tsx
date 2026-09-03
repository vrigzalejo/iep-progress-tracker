"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { signOutAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { idleTimeoutMs } from "@/lib/runtime";

export function MfaEnrollGuard({ required }: { required: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  useEffect(() => {
    if (required && pathname !== "/setup") {
      router.replace("/setup?mfa=required");
    }
  }, [required, pathname, router]);
  return null;
}

export function IdleTimeout() {
  const limit = idleTimeoutMs();
  const warnAt = Math.max(60_000, limit - 120_000);
  const [warning, setWarning] = useState(false);
  const lastRef = useRef(0);

  useEffect(() => {
    if (limit <= 0) return undefined;
    lastRef.current = Date.now();
    const bump = () => {
      lastRef.current = Date.now();
      setWarning(false);
    };
    const events: (keyof WindowEventMap)[] = ["pointerdown", "keydown", "scroll"];
    for (const event of events) window.addEventListener(event, bump, { passive: true });
    const timer = window.setInterval(() => {
      const idle = Date.now() - lastRef.current;
      if (idle >= limit) {
        void signOutAction();
        return;
      }
      setWarning(idle >= warnAt);
    }, 5_000);
    return () => {
      for (const event of events) window.removeEventListener(event, bump);
      window.clearInterval(timer);
    };
  }, [limit, warnAt]);

  if (limit <= 0 || !warning) return null;

  return (
    <div
      className="no-print fixed inset-x-0 bottom-4 z-50 mx-auto max-w-lg rounded-lg border border-gold bg-[#fff9e9] p-4"
      role="alertdialog"
      aria-labelledby="idle-title"
    >
      <p id="idle-title" className="font-semibold">
        You will be signed out soon
      </p>
      <p className="mt-1 text-sm text-muted">
        This shared session is idle. Move the pointer or press a key to stay signed in.
      </p>
      <form action={signOutAction} className="mt-3">
        <Button type="submit" variant="secondary">
          Sign out now
        </Button>
      </form>
    </div>
  );
}
