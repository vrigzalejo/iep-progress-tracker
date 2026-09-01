import { describe, expect, it } from "vitest";
import {
  applyDemoTextReplacements,
  canonicalDemoLocalPart,
  isDemoLocalPart,
} from "./brand";

describe("demo cast", () => {
  it("maps former demo emails onto the Filipino local parts", () => {
    expect(canonicalDemoLocalPart("maya.ellis")).toBe("maricel.santos");
    expect(canonicalDemoLocalPart("maricel.santos")).toBe("maricel.santos");
    expect(canonicalDemoLocalPart("someone.else")).toBeUndefined();
  });

  it("does not treat retired local parts as current demo emails", () => {
    expect(isDemoLocalPart("chris.okonkwo")).toBe(false);
    expect(isDemoLocalPart("crisanto.reyes")).toBe(true);
  });

  it("rewrites leftover English demo names in narrative text", () => {
    expect(
      applyDemoTextReplacements("Jordan Hale read with Dana Hale at Maple Ridge Elementary."),
    ).toBe("Jaime Santos read with Diana Santos at Liwanag Elementary.");
    expect(applyDemoTextReplacements("Jaime Santos")).toBe("Jaime Santos");
  });
});
