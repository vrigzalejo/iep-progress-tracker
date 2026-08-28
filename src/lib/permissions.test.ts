import { describe, expect, it } from "vitest";
import { can, canAccessStudent, isStaff } from "./permissions";

describe("permissions", () => {
  it("gives administrators team and privacy management", () => {
    expect(can("ADMINISTRATOR", "team.manage")).toBe(true);
    expect(can("EDUCATOR", "team.manage")).toBe(false);
    expect(can("PARENT", "progress.create")).toBe(false);
  });

  it("treats parents as non-staff", () => {
    expect(isStaff("PARENT")).toBe(false);
    expect(isStaff("PROVIDER")).toBe(true);
  });

  it("limits providers to assigned students", () => {
    const ctx = {
      userId: "provider-1",
      role: "PROVIDER" as const,
      organizationId: "org",
      caseManagerId: "teacher-1",
      providerIds: ["provider-1"],
      guardianUserIds: ["parent-1"],
    };
    expect(canAccessStudent(ctx)).toBe(true);
    expect(canAccessStudent({ ...ctx, providerIds: ["someone-else"] })).toBe(false);
  });

  it("only shows parents shared goals", () => {
    const ctx = {
      userId: "parent-1",
      role: "PARENT" as const,
      organizationId: "org",
      caseManagerId: "teacher-1",
      providerIds: [],
      guardianUserIds: ["parent-1"],
    };
    expect(canAccessStudent(ctx)).toBe(true);
    expect(canAccessStudent(ctx, { goalId: "g1", goalShared: false })).toBe(false);
    expect(canAccessStudent(ctx, { goalId: "g1", goalShared: true })).toBe(true);
  });

  it("keeps educators on their own caseload", () => {
    const ctx = {
      userId: "teacher-1",
      role: "EDUCATOR" as const,
      organizationId: "org",
      caseManagerId: "teacher-1",
      providerIds: [],
      guardianUserIds: [],
    };
    expect(canAccessStudent(ctx)).toBe(true);
    expect(canAccessStudent({ ...ctx, caseManagerId: "other" })).toBe(false);
  });
});
