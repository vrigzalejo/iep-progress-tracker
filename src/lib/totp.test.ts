import { describe, expect, it } from "vitest";
import {
  decryptSecret,
  encryptSecret,
  generateTotpSecret,
  totpCode,
  verifyTotp,
} from "./totp";

describe("totp", () => {
  it("round-trips encryption with AUTH_SECRET material", () => {
    const secret = "JBSWY3DPEHPK3PXP";
    const sealed = encryptSecret(secret, "unit-test-auth-secret");
    expect(sealed).not.toBe(secret);
    expect(decryptSecret(sealed, "unit-test-auth-secret")).toBe(secret);
  });

  it("accepts the current code and a neighboring window", () => {
    const secret = generateTotpSecret();
    const now = Date.parse("2026-09-03T18:00:00Z");
    const code = totpCode(secret, now);
    expect(code).toMatch(/^\d{6}$/);
    expect(verifyTotp(secret, code, now)).toBe(true);
    expect(verifyTotp(secret, code, now + 30_000)).toBe(true);
    expect(verifyTotp(secret, "000000", now)).toBe(false);
  });
});
