export const FAMILY_LOCALES = ["en", "es"] as const;
export type FamilyLocale = (typeof FAMILY_LOCALES)[number];
export const FAMILY_LOCALE_COOKIE = "iep-family-locale";

export function parseFamilyLocale(value: string | null | undefined): FamilyLocale {
  return value === "es" ? "es" : "en";
}

export function familyGoalSummary(goal: {
  plainLanguageSummary: string;
  plainLanguageSummaryEs?: string | null;
}, locale: FamilyLocale) {
  const spanish = goal.plainLanguageSummaryEs?.trim();
  if (locale === "es" && spanish) return spanish;
  return goal.plainLanguageSummary;
}
