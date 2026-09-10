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
  return (
    <form action={setFamilyLocaleAction} className="flex flex-wrap items-center gap-2 text-sm">
      <input type="hidden" name="returnTo" value={returnTo} />
      <span className="text-muted">{copy.language}</span>
      <button
        type="submit"
        name="locale"
        value="en"
        className={cn(
          "min-h-11 rounded-full border px-3 py-1 font-semibold",
          locale === "en" ? "border-forest bg-forest text-white" : "border-border bg-white",
        )}
      >
        {copy.english}
      </button>
      <button
        type="submit"
        name="locale"
        value="es"
        className={cn(
          "min-h-11 rounded-full border px-3 py-1 font-semibold",
          locale === "es" ? "border-forest bg-forest text-white" : "border-border bg-white",
        )}
      >
        {copy.spanish}
      </button>
    </form>
  );
}
