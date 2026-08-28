import { describe, expect, it } from "vitest";
import { progressSchema, signInSchema, studentSchema } from "./validation";

describe("validation", () => {
  it("rejects an empty progress note", () => {
    const result = progressSchema.safeParse({
      goalId: "goal",
      recordedAt: "2026-08-01",
      score: 12,
      measurementType: "PERCENT_ACCURACY",
      notes: "",
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
