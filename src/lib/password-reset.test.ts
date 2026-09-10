import { describe, expect, it } from "vitest";
import {
  createPasswordResetSecret,
  hashPasswordResetSecret,
  passwordResetExpiry,
  passwordResetMatches,
  PASSWORD_RESET_TTL_MS,
} from "./password-reset";

describe("password-reset", () => {
  it("hashes a secret so the raw value is not stored", () => {
    const secret = createPasswordResetSecret();
    const hash = hashPasswordResetSecret(secret);
    expect(hash).not.toBe(secret);
    expect(passwordResetMatches(secret, hash)).toBe(true);
    expect(passwordResetMatches("other", hash)).toBe(false);
  });

  it("expires in two hours", () => {
    const now = new Date("2026-09-09T18:00:00Z");
    expect(passwordResetExpiry(now).getTime() - now.getTime()).toBe(PASSWORD_RESET_TTL_MS);
  });
});
