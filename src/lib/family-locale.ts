export const FAMILY_LOCALES = ["en", "es"] as const;
export type FamilyLocale = (typeof FAMILY_LOCALES)[number];
export const FAMILY_LOCALE_COOKIE = "iep-family-locale";

export function parseFamilyLocale(value: string | null | undefined): FamilyLocale {
  return value === "es" ? "es" : "en";
}

/** Cookie wins when present; otherwise the last language saved on the guardian row. */
export function resolveFamilyLocale(
  cookieValue: string | null | undefined,
  storedValue?: string | null,
): FamilyLocale {
  if (cookieValue === "es" || cookieValue === "en") return cookieValue;
  return parseFamilyLocale(storedValue);
}

export function familyGoalSummary(goal: {
  plainLanguageSummary: string;
  plainLanguageSummaryEs?: string | null;
}, locale: FamilyLocale) {
  const spanish = goal.plainLanguageSummaryEs?.trim();
  if (locale === "es" && spanish) return spanish;
  return goal.plainLanguageSummary;
}
