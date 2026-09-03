import { describe, expect, it } from "vitest";
import { isPastRetention, retentionCutoff } from "./retention";

describe("retention helpers", () => {
  it("computes the cutoff from retention days", () => {
    const now = new Date("2026-09-03T12:00:00Z");
    const cutoff = retentionCutoff(now, 30);
    expect(cutoff.toISOString()).toBe("2026-08-04T12:00:00.000Z");
  });

  it("flags archived records older than the cutoff", () => {
    const cutoff = new Date("2026-01-01T00:00:00Z");
    expect(isPastRetention("2025-12-01T00:00:00Z", cutoff)).toBe(true);
    expect(isPastRetention("2026-02-01T00:00:00Z", cutoff)).toBe(false);
  });
});
