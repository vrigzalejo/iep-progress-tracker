import { describe, expect, it } from "vitest";
import { normalizeSchoolCode, normalizeSchoolName } from "./schools";

describe("schools", () => {
  it("collapses campus name spacing", () => {
    expect(normalizeSchoolName("  Liwanag   Elementary ")).toBe("Liwanag Elementary");
  });

  it("stores an optional short code or nothing", () => {
    expect(normalizeSchoolCode(" ELEM ")).toBe("ELEM");
    expect(normalizeSchoolCode("")).toBeNull();
  });
});
