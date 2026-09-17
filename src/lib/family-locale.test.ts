import { describe, expect, it } from "vitest";
import { familyCopy } from "./family-copy";
import { familyGoalSummary, parseFamilyLocale, resolveFamilyLocale } from "./family-locale";

describe("family locale", () => {
  it("defaults unknown values to English", () => {
    expect(parseFamilyLocale(undefined)).toBe("en");
    expect(parseFamilyLocale("es")).toBe("es");
    expect(resolveFamilyLocale(undefined, "es")).toBe("es");
    expect(resolveFamilyLocale("en", "es")).toBe("en");
    expect(resolveFamilyLocale("es", "en")).toBe("es");
  });

  it("uses the staff-written Spanish summary only when locale is Spanish", () => {
    const goal = { plainLanguageSummary: "Ask for a break", plainLanguageSummaryEs: "Pedir un descanso" };
    expect(familyGoalSummary(goal, "en")).toBe("Ask for a break");
    expect(familyGoalSummary(goal, "es")).toBe("Pedir un descanso");
    expect(familyGoalSummary({ plainLanguageSummary: "Ask for a break" }, "es")).toBe("Ask for a break");
  });

  it("does not invent IEP wording in Spanish chrome", () => {
    expect(familyCopy("es").portalIntro).not.toMatch(/should|recommend/i);
    expect(familyCopy("es").digestDisclaimer).toMatch(/No sugiere/);
    expect(familyCopy("es").familyHomeNav).toBe("Inicio familiar");
    expect(familyCopy("es").headerLinked).toMatch(/Portal familiar/);
    expect(familyCopy("es").signOut).toBe("Cerrar sesión");
  });
});
