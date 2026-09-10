"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { APP_NAME } from "@/lib/brand";
import { INSTALL_HINT_KEY, installInstructions, shouldShowInstallHint } from "@/lib/install-app";
import { cn } from "@/lib/utils";

export function InstallHint({ className }: { className?: string }) {
  const [visible, setVisible] = useState(false);
  const [kind, setKind] = useState<ReturnType<typeof installInstructions>>("other");

  useEffect(() => {
    const dismissed = window.localStorage.getItem(INSTALL_HINT_KEY) === "1";
    const displayModeStandalone = window.matchMedia("(display-mode: standalone)").matches;
    const navigatorStandalone = "standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
    setKind(installInstructions(navigator.userAgent));
    setVisible(shouldShowInstallHint({ displayModeStandalone, navigatorStandalone, dismissed }));
  }, []);

  function dismiss() {
    window.localStorage.setItem(INSTALL_HINT_KEY, "1");
    setVisible(false);
  }

  if (!visible) return null;

  const copy =
    kind === "ios"
      ? "On iPhone or iPad: tap Share, then Add to Home Screen. You get the same school account in its own icon."
      : kind === "android"
        ? "On Android Chrome: open the browser menu and tap Install app. You get the same school account in its own icon."
        : "On a phone, use the browser menu to Add to Home Screen or Install app. Same school account — this is not a second product.";

  return (
    <aside className={cn("rounded-lg border border-border bg-surface px-3 py-3 text-sm text-muted", className)}>
      <div className="flex items-start gap-2">
        <p className="min-w-0 flex-1">
          <span className="font-semibold text-ink">Install {APP_NAME}.</span> {copy}
        </p>
        <button
          type="button"
          className="rounded-md p-1 text-ink hover:bg-paper"
          onClick={dismiss}
          aria-label="Dismiss install hint"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}
