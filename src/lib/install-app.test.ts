import { describe, expect, it } from "vitest";
import { installInstructions, isStandaloneDisplay, shouldShowInstallHint } from "./install-app";

describe("install-app", () => {
  it("hides the hint in standalone or after dismiss", () => {
    expect(
      shouldShowInstallHint({ displayModeStandalone: true, dismissed: false }),
    ).toBe(false);
    expect(
      shouldShowInstallHint({
        displayModeStandalone: false,
        navigatorStandalone: true,
        dismissed: false,
      }),
    ).toBe(false);
    expect(
      shouldShowInstallHint({ displayModeStandalone: false, dismissed: true }),
    ).toBe(false);
    expect(
      shouldShowInstallHint({ displayModeStandalone: false, dismissed: false }),
    ).toBe(true);
  });

  it("detects iOS and Android install copy", () => {
    expect(installInstructions("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)")).toBe("ios");
    expect(installInstructions("Mozilla/5.0 (Linux; Android 14)")).toBe("android");
    expect(installInstructions("Mozilla/5.0 (Macintosh)")).toBe("other");
    expect(isStandaloneDisplay({ displayModeStandalone: false })).toBe(false);
  });
});
