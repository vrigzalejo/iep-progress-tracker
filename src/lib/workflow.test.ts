import { describe, expect, it } from "vitest";
import {
  buildMinutesLedger,
  buildTodayCaseload,
  goalWordingChanged,
  promptLevelShares,
  versionActiveAt,
} from "./workflow";

const monday = new Date("2026-08-31T12:00:00Z");

describe("buildTodayCaseload", () => {
  it("lists students still owed sessions this week", () => {
    const rows = buildTodayCaseload(
      [
        {
          studentId: "jaime",
          studentName: "Jaime Santos",
          serviceArea: "SPEECH_LANGUAGE",
          providerUserId: "speech",
          providerName: "Patricia",
          minutesPerWeek: 60,
          sessionsPerWeek: 2,
          goalId: "g1",
          goalSummary: "Ask for a break",
          entries: [
            {
              recordedAt: "2026-08-31T15:00:00Z",
              sessionOutcome: "PRESENT",
              minutesDelivered: 30,
            },
          ],
        },
        {
          studentId: "carla",
          studentName: "Carla Santos",
          serviceArea: "OCCUPATIONAL_THERAPY",
          providerUserId: "ot",
          providerName: "Noah",
          minutesPerWeek: 30,
          sessionsPerWeek: 1,
          goalId: "g2",
          goalSummary: "Grasp a pencil",
          entries: [
            {
              recordedAt: "2026-09-01T15:00:00Z",
              sessionOutcome: "PRESENT",
              minutesDelivered: 30,
            },
          ],
        },
      ],
      monday,
    );
    expect(rows.map((row) => row.studentId)).toEqual(["jaime"]);
    expect(rows[0]?.sessionsRemaining).toBe(1);
  });

  it("does not treat absent sessions as delivered", () => {
    const rows = buildTodayCaseload(
      [
        {
          studentId: "jaime",
          studentName: "Jaime Santos",
          serviceArea: "SPEECH_LANGUAGE",
          providerUserId: "speech",
          providerName: "Patricia",
          minutesPerWeek: 60,
          sessionsPerWeek: 1,
          goalId: "g1",
          goalSummary: "Ask for a break",
          entries: [
            { recordedAt: "2026-08-31T15:00:00Z", sessionOutcome: "ABSENT", minutesDelivered: 30 },
          ],
        },
      ],
      monday,
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]?.minutesDelivered).toBe(0);
  });
});

describe("buildMinutesLedger", () => {
  it("describes delivered vs prescribed minutes without a compliance label", () => {
    const [row] = buildMinutesLedger(
      [
        {
          studentId: "jaime",
          studentName: "Jaime Santos",
          serviceArea: "SPEECH_LANGUAGE",
          providerUserId: "speech",
          providerName: "Patricia",
          minutesPerWeek: 60,
          sessionsPerWeek: 2,
          goalId: "g1",
          goalSummary: "Ask for a break",
          entries: [
            { recordedAt: "2026-08-31T15:00:00Z", sessionOutcome: "PRESENT", minutesDelivered: 30 },
            { recordedAt: "2026-09-01T15:00:00Z", sessionOutcome: "ABSENT" },
            {
              recordedAt: "2026-09-02T15:00:00Z",
              sessionOutcome: "MAKEUP_SCHEDULED",
              minutesDelivered: 0,
              makeupScheduledFor: "2026-09-04T15:00:00Z",
              makeupLocation: "Room 12",
            },
          ],
        },
      ],
      monday,
    );
    expect(row.delivered).toBe(30);
    expect(row.gap).toBe(30);
    expect(row.absent).toBe(1);
    expect(row.makeupScheduled).toBe(1);
    expect(row.days[0]?.presentMinutes).toBe(30);
  });
});

describe("promptLevelShares", () => {
  it("reports share of successful trials by prompt level", () => {
    const points = promptLevelShares([
      {
        recordedAt: "2026-08-31T15:00:00Z",
        sessionOutcome: "PRESENT",
        trials: [
          { result: "INDEPENDENT", promptLevel: "INDEPENDENT" },
          { result: "PROMPTED", promptLevel: "VERBAL" },
          { result: "INCORRECT", promptLevel: "INDEPENDENT" },
        ],
      },
    ]);
    expect(points[0]?.independent).toBe(50);
    expect(points[0]?.verbal).toBe(50);
    expect(points[0]?.total).toBe(2);
  });
});

describe("goal versions", () => {
  it("detects wording or mastery changes", () => {
    const base = {
      officialWording: "Read 90 WCPM",
      plainLanguageSummary: "Read smoothly",
      baseline: "62 WCPM",
      measurableTarget: "90 WCPM",
      targetValue: 90,
      unit: "WCPM",
      measurementMethod: "RATE",
      consecutiveSessionsNeeded: 3,
      maxPromptForMastery: "INDEPENDENT",
    };
    expect(goalWordingChanged(base, { ...base, officialWording: "Read 95 WCPM" })).toBe(true);
    expect(goalWordingChanged(base, { ...base })).toBe(false);
  });

  it("pins the version that was current at a period end", () => {
    const versions = [
      { id: "v1", createdAt: "2026-01-01T00:00:00Z" },
      { id: "v2", createdAt: "2026-06-01T00:00:00Z" },
    ];
    expect(versionActiveAt(versions, new Date("2026-03-01T00:00:00Z"))?.id).toBe("v1");
    expect(versionActiveAt(versions, new Date("2026-09-01T00:00:00Z"))?.id).toBe("v2");
  });
});
