import { describe, expect, it } from "vitest";
import { hasCurrentConsent } from "./consent";

describe("consent", () => {
  it("requires the current notice version for that guardian", () => {
    const consents = [
      { guardianName: "Diana Santos", noticeVersion: "2026-01", withdrawnAt: null },
      { guardianName: "Diana Santos", noticeVersion: "2026-08", withdrawnAt: null },
    ];
    expect(hasCurrentConsent(consents, "2026-08", "Diana Santos")).toBe(true);
    expect(hasCurrentConsent(consents, "2026-09", "Diana Santos")).toBe(false);
    expect(hasCurrentConsent(consents, "2026-08", "Other Parent")).toBe(false);
  });

  it("ignores withdrawn acknowledgments", () => {
    expect(
      hasCurrentConsent(
        [{ guardianName: "Diana Santos", noticeVersion: "2026-08", withdrawnAt: new Date() }],
        "2026-08",
        "Diana Santos",
      ),
    ).toBe(false);
  });
});
