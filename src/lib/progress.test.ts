import { describe, expect, it } from "vitest";
import { computeDataSignal, trendSlope } from "./progress";

const day = (offset: number) => {
  const date = new Date("2026-08-28T12:00:00Z");
  date.setUTCDate(date.getUTCDate() + offset);
  return date;
};

describe("computeDataSignal", () => {
  it("returns needs data when there are no entries", () => {
    expect(
      computeDataSignal(
        {
          targetValue: 80,
          startDate: day(-30),
          nextReportDue: day(10),
          status: "ACTIVE",
          entries: [],
        },
        day(0),
      ),
    ).toBe("NEEDS_DATA");
  });

  it("returns goal met when the latest score reaches the target", () => {
    expect(
      computeDataSignal(
        {
          targetValue: 80,
          startDate: day(-30),
          nextReportDue: day(10),
          status: "ACTIVE",
          entries: [
            { recordedAt: day(-14), score: 60 },
            { recordedAt: day(-2), score: 82 },
          ],
        },
        day(0),
      ),
    ).toBe("GOAL_MET");
  });

  it("returns needs data when the latest entry is stale", () => {
    expect(
      computeDataSignal(
        {
          targetValue: 80,
          startDate: day(-40),
          nextReportDue: day(10),
          status: "ACTIVE",
          entries: [{ recordedAt: day(-20), score: 70 }],
        },
        day(0),
      ),
    ).toBe("NEEDS_DATA");
  });

  it("returns needs attention when scores decline", () => {
    expect(
      computeDataSignal(
        {
          targetValue: 90,
          startDate: day(-30),
          nextReportDue: day(14),
          status: "ACTIVE",
          entries: [
            { recordedAt: day(-10), score: 70 },
            { recordedAt: day(-2), score: 60 },
          ],
        },
        day(0),
      ),
    ).toBe("NEEDS_ATTENTION");
  });

  it("returns on track when recent scores improve toward the target", () => {
    expect(
      computeDataSignal(
        {
          targetValue: 90,
          startDate: day(-30),
          nextReportDue: day(20),
          status: "ACTIVE",
          entries: [
            { recordedAt: day(-12), score: 70 },
            { recordedAt: day(-3), score: 78 },
          ],
        },
        day(0),
      ),
    ).toBe("ON_TRACK");
  });
});

describe("trendSlope", () => {
  it("is positive when scores increase", () => {
    expect(
      trendSlope([
        { recordedAt: day(-10), score: 40 },
        { recordedAt: day(0), score: 50 },
      ]),
    ).toBeGreaterThan(0);
  });
});
