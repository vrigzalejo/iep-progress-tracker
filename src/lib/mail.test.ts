import { describe, expect, it } from "vitest";
import { mailConfigured, resendConfigured, smtpConfigured } from "./mail";

describe("mail", () => {
  it("is off until SMTP or Resend and a from-address are set", () => {
    expect(mailConfigured({})).toBe(false);
    expect(mailConfigured({ SMTP_HOST: "smtp.district.edu" })).toBe(false);
    expect(
      mailConfigured({ SMTP_HOST: "smtp.district.edu", MAIL_FROM: "noreply@district.edu" }),
    ).toBe(true);
  });

  it("treats Resend as configured when a real API key and from-address are set", () => {
    expect(resendConfigured({ RESEND_API_KEY: "re_xxxxxxxxx", MAIL_FROM: "onboarding@resend.dev" })).toBe(
      false,
    );
    expect(resendConfigured({ RESEND_API_KEY: "re_live_example", MAIL_FROM: "onboarding@resend.dev" })).toBe(
      true,
    );
    expect(mailConfigured({ RESEND_API_KEY: "re_live_example", MAIL_FROM: "onboarding@resend.dev" })).toBe(
      true,
    );
  });

  it("keeps local SMTP independent of Resend", () => {
    expect(smtpConfigured({ SMTP_HOST: "127.0.0.1", MAIL_FROM: "noreply@localhost" })).toBe(true);
    expect(smtpConfigured({ RESEND_API_KEY: "re_live_example", MAIL_FROM: "onboarding@resend.dev" })).toBe(
      false,
    );
  });
});
