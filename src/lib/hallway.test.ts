import { describe, expect, it } from "vitest";
import { hallwayWorkHref, pickHallwayNext } from "./hallway";

const due = [
  { studentId: "a", goalId: "ga" },
  { studentId: "b", goalId: "gb" },
  { studentId: "c", goalId: "gc" },
];

describe("hallway next student", () => {
  it("builds a work URL with the next student on Today", () => {
    expect(hallwayWorkHref({ studentId: "a", goalId: "ga" }, { studentId: "b", goalId: "gb" })).toBe(
      "/hallway?studentId=a&goalId=ga&nextStudentId=b&nextGoalId=gb",
    );
    expect(hallwayWorkHref({ studentId: "c", goalId: "gc" })).toBe(
      "/hallway?studentId=c&goalId=gc",
    );
  });

  it("picks the next other student on the due list", () => {
    expect(pickHallwayNext(due, { studentId: "a", goalId: "ga" })).toEqual({
      studentId: "b",
      goalId: "gb",
    });
    expect(pickHallwayNext(due, { studentId: "c", goalId: "gc" })).toEqual({
      studentId: "a",
      goalId: "ga",
    });
  });

  it("honors a nextGoalId hint when that student is still due", () => {
    expect(
      pickHallwayNext(due, { studentId: "a", goalId: "ga" }, { nextGoalId: "gc" }),
    ).toEqual({ studentId: "c", goalId: "gc" });
  });

  it("returns null when nobody else is due", () => {
    expect(pickHallwayNext([{ studentId: "a", goalId: "ga" }], { studentId: "a", goalId: "ga" })).toBe(
      null,
    );
  });
});
