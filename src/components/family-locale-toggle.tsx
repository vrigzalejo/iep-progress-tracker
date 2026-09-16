"use client";

import { useTransition } from "react";
import { setFamilyLocaleAction } from "@/app/actions";
import type { FamilyLocale } from "@/lib/family-locale";
import { familyCopy } from "@/lib/family-copy";
import { cn } from "@/lib/utils";

export function FamilyLocaleToggle({
  locale,
  returnTo,
}: {
  locale: FamilyLocale;
  returnTo: string;
}) {
  const copy = familyCopy(locale);
  const [pending, startTransition] = useTransition();

  function switchTo(value: FamilyLocale) {
    const formData = new FormData();
    formData.set("locale", value);
    formData.set("returnTo", returnTo);
    startTransition(() => {
      setFamilyLocaleAction(formData);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="text-muted">{copy.language}</span>
      {(["en", "es"] as const).map((value) => (
        <button
          key={value}
          type="button"
          disabled={pending}
          aria-pressed={locale === value}
          onClick={() => switchTo(value)}
          className={cn(
            "min-h-11 rounded-full border px-3 py-1 font-semibold",
            locale === value ? "border-forest bg-forest text-white" : "border-border bg-white",
          )}
        >
          {value === "en" ? copy.english : copy.spanish}
        </button>
      ))}
    </div>
  );
}
