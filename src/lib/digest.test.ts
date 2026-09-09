import { describe, expect, it } from "vitest";
import {
  buildFamilyDigest,
  digestSubject,
  digestUnsubscribeToken,
  formatDigestText,
  parseDigestUnsubscribeToken,
  shouldSendWeeklyDigest,
} from "./digest";

describe("family digest", () => {
  it("uses a subject with the preferred name and no scores", () => {
    expect(digestSubject("Jaime")).toBe("Weekly update for Jaime");
    expect(digestSubject("Jaime")).not.toMatch(/\d/);
  });

  it("only includes shared goals and staff-written carryover", () => {
    const digest = buildFamilyDigest(
      {
        preferredName: "Jaime",
        goals: [
          {
            sharedWithGuardians: true,
            plainLanguageSummary: "Ask for a break",
            unit: "% independent",
            entries: [
              {
                recordedAt: "2026-09-03T15:00:00Z",
                sessionOutcome: "PRESENT",
                score: 80,
                homeCarryover: "Practice the break card at snack.",
              },
            ],
          },
          {
            sharedWithGuardians: false,
            plainLanguageSummary: "Staff-only goal",
            unit: "trials",
            entries: [
              {
                recordedAt: "2026-09-03T15:00:00Z",
                sessionOutcome: "PRESENT",
                score: 4,
              },
            ],
          },
        ],
      },
      new Date("2026-09-04T12:00:00Z"),
    );
    expect(digest.sections).toHaveLength(1);
    expect(digest.sections[0]?.scores).toContain("80");
    expect(digest.sections[0]?.carryover).toMatch(/break card/);
  });

  it("sends on Friday or when DIGEST_SEND=1", () => {
    expect(shouldSendWeeklyDigest(new Date("2026-09-04T12:00:00Z"), {})).toBe(true);
    expect(shouldSendWeeklyDigest(new Date("2026-09-03T12:00:00Z"), {})).toBe(false);
    expect(shouldSendWeeklyDigest(new Date("2026-09-03T12:00:00Z"), { DIGEST_SEND: "1" })).toBe(true);
  });

  it("formats a portal link, unsubscribe, and visibility sentence", () => {
    const text = formatDigestText({
      preferredName: "Jaime",
      weekLabel: "Aug 28 – Sep 4",
      sections: [{ summary: "Ask for a break", scores: "80 % independent", carryover: "Snack card" }],
      portalUrl: "https://example.test/parent",
      unsubscribeUrl: "https://example.test/api/digest/unsubscribe?t=x",
      productName: "IEP Progress Tracker",
    });
    expect(text).toMatch(/Who can see this/);
    expect(text).toMatch(/Unsubscribe/);
    expect(text).not.toMatch(/recommend services|you should/i);
  });

  it("rejects a tampered unsubscribe token", () => {
    const token = digestUnsubscribeToken("contact-1", "secret");
    expect(parseDigestUnsubscribeToken(token, "secret")).toBe("contact-1");
    expect(parseDigestUnsubscribeToken(`${token}x`, "secret")).toBeNull();
  });
});
