import { describe, expect, it } from "vitest";
import { groupMessagesByDay, messageDayKey, nameInitial } from "./message-thread";

describe("message thread helpers", () => {
  it("groups consecutive messages on the same local day", () => {
    const groups = groupMessagesByDay([
      { id: "1", createdAt: new Date(2026, 8, 16, 9) },
      { id: "2", createdAt: new Date(2026, 8, 16, 18) },
      { id: "3", createdAt: new Date(2026, 8, 17, 8) },
    ]);
    expect(groups).toHaveLength(2);
    expect(groups[0]?.items.map((item) => item.id)).toEqual(["1", "2"]);
    expect(groups[1]?.items.map((item) => item.id)).toEqual(["3"]);
    expect(groups[0]?.key).toBe(messageDayKey(new Date(2026, 8, 16)));
  });

  it("uses the first letter of a preferred name", () => {
    expect(nameInitial("Jaime Santos")).toBe("J");
    expect(nameInitial("  carla")).toBe("C");
    expect(nameInitial("")).toBe("?");
  });
});
