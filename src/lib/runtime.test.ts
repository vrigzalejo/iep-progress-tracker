import { describe, expect, it } from "vitest";
import { idleTimeoutMs, isDemoMode, requiresObjectStorage } from "./runtime";

describe("runtime flags", () => {
  it("treats unset DEMO_MODE as demonstration on", () => {
    expect(isDemoMode({})).toBe(true);
    expect(isDemoMode({ NEXT_PUBLIC_DEMO_MODE: "true" })).toBe(true);
    expect(isDemoMode({ NEXT_PUBLIC_DEMO_MODE: "false" })).toBe(false);
  });

  it("requires object storage only when demo mode is off", () => {
    expect(requiresObjectStorage({})).toBe(false);
    expect(requiresObjectStorage({ NEXT_PUBLIC_DEMO_MODE: "false" })).toBe(true);
  });

  it("defaults idle timeout to 20 minutes and allows disable", () => {
    expect(idleTimeoutMs({})).toBe(20 * 60_000);
    expect(idleTimeoutMs({ NEXT_PUBLIC_IDLE_MINUTES: "0" })).toBe(0);
    expect(idleTimeoutMs({ NEXT_PUBLIC_IDLE_MINUTES: "15" })).toBe(15 * 60_000);
  });
});
