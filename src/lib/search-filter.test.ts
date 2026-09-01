import { describe, expect, it } from "vitest";
import { ilike } from "./search-filter";

describe("ilike", () => {
  it("asks Prisma for a case-insensitive substring match", () => {
    expect(ilike("Jaime")).toEqual({ contains: "Jaime", mode: "insensitive" });
    expect(ilike("  WCPM  ")).toEqual({ contains: "WCPM", mode: "insensitive" });
  });
});
