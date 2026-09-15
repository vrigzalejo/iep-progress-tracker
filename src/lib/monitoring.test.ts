import { describe, expect, it } from "vitest";
import {
  assertNeverStudentInLogs,
  formatLogLine,
  isNoisyLogPath,
  redactRequestPath,
  shouldLogRequests,
} from "./monitoring";

describe("monitoring", () => {
  it("redacts record ids and drops query strings", () => {
    expect(redactRequestPath("/students/clh1234567890abcdefghijkl/carryover")).toBe(
      "/students/:id/carryover",
    );
    expect(
      redactRequestPath("/api/evidence/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee?inline=1"),
    ).toBe("/api/evidence/:id");
  });

  it("skips health and icon noise", () => {
    expect(isNoisyLogPath("/api/health")).toBe(true);
    expect(isNoisyLogPath("/today")).toBe(false);
  });

  it("refuses student fields and scrubs them from JSON lines", () => {
    expect(() => assertNeverStudentInLogs({ preferredName: "Jaime" })).toThrow(/student/i);
    const line = formatLogLine("info", "request", {
      method: "GET",
      path: "/students/:id",
      preferredName: "Jaime",
      email: "parent@example.com",
    });
    expect(line).toContain('"event":"request"');
    expect(line).toContain('"redacted":true');
    expect(line).not.toContain("Jaime");
    expect(line).not.toContain("parent@example.com");
  });

  it("turns request logs off only when LOG_REQUESTS is false", () => {
    expect(shouldLogRequests({})).toBe(true);
    expect(shouldLogRequests({ LOG_REQUESTS: "true" })).toBe(true);
    expect(shouldLogRequests({ LOG_REQUESTS: "false" })).toBe(false);
  });
});
