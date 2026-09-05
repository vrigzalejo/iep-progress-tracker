import { describe, expect, it } from "vitest";
import { progressSchema, schoolSchema, signInSchema, studentSchema, teamMemberSchema } from "./validation";

describe("validation", () => {
  it("rejects a present session without a note or trials", () => {
    const result = progressSchema.safeParse({
      goalId: "goal",
      recordedAt: "2026-08-01",
      score: 12,
      measurementType: "PERCENT_ACCURACY",
      notes: "",
      sessionOutcome: "PRESENT",
    });
    expect(result.success).toBe(false);
  });

  it("accepts a complete progress entry", () => {
    const result = progressSchema.safeParse({
      goalId: "goal",
      recordedAt: "2026-08-01",
      score: 12,
      measurementType: "RATE",
      notes: "Independent reading of a short passage.",
      sessionOutcome: "PRESENT",
    });
    expect(result.success).toBe(true);
  });

  it("accepts an absence without a numeric score", () => {
    const result = progressSchema.safeParse({
      goalId: "goal",
      recordedAt: "2026-08-01",
      measurementType: "PERCENT_ACCURACY",
      notes: "",
      sessionOutcome: "ABSENT",
    });
    expect(result.success).toBe(true);
  });

  it("accepts trial JSON in place of a typed score", () => {
    const result = progressSchema.safeParse({
      goalId: "goal",
      recordedAt: "2026-08-01",
      measurementType: "PERCENT_ACCURACY",
      notes: "Probe during reading group.",
      sessionOutcome: "PRESENT",
      trialsJson: JSON.stringify([
        { result: "INDEPENDENT", promptLevel: "INDEPENDENT" },
        { result: "PROMPTED", promptLevel: "VERBAL" },
      ]),
    });
    expect(result.success).toBe(true);
  });

  it("requires a valid email at sign-in", () => {
    expect(signInSchema.safeParse({ email: "not-an-email", password: "x" }).success).toBe(false);
  });

  it("allows creating a team member without a password for SSO", () => {
    expect(
      teamMemberSchema.safeParse({
        name: "Maricel Santos",
        email: "maya@district.edu",
        role: "EDUCATOR",
        password: "",
      }).success,
    ).toBe(true);
  });

  it("still enforces password complexity when a password is provided", () => {
    expect(
      teamMemberSchema.safeParse({
        name: "Maricel Santos",
        email: "maya@district.edu",
        role: "EDUCATOR",
        password: "short",
      }).success,
    ).toBe(false);
  });

  it("requires preferred name on student profiles", () => {
    expect(
      studentSchema.safeParse({
        preferredName: "  ",
        grade: "4",
        schoolId: "sch1",
        caseManagerId: "u1",
      }).success,
    ).toBe(false);
  });

  it("requires a campus name when adding a school", () => {
    expect(schoolSchema.safeParse({ name: " " }).success).toBe(false);
    expect(schoolSchema.safeParse({ name: "Liwanag Elementary", code: "ELEM" }).success).toBe(true);
  });
});
