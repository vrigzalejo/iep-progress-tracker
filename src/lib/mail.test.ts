import { describe, expect, it } from "vitest";
import { mailConfigured } from "./mail";

describe("mail", () => {
  it("is off until SMTP host and from-address are set", () => {
    expect(mailConfigured({})).toBe(false);
    expect(mailConfigured({ SMTP_HOST: "smtp.district.edu" })).toBe(false);
    expect(
      mailConfigured({ SMTP_HOST: "smtp.district.edu", MAIL_FROM: "noreply@district.edu" }),
    ).toBe(true);
  });
});
