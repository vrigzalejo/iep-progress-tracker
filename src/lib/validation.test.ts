import { describe, expect, it } from "vitest";
import { progressSchema, signInSchema, studentSchema } from "./validation";

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

  it("requires preferred name on student profiles", () => {
    expect(
      studentSchema.safeParse({
        preferredName: "  ",
        grade: "4",
        school: "Maple Ridge",
        caseManagerId: "u1",
      }).success,
    ).toBe(false);
  });
});
