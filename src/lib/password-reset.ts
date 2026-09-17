import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { appOrigin } from "@/lib/runtime";

export const PASSWORD_RESET_TTL_MS = 2 * 60 * 60 * 1000;

export function createPasswordResetSecret() {
  return randomBytes(32).toString("base64url");
}

export function hashPasswordResetSecret(secret: string) {
  return createHash("sha256").update(secret).digest("hex");
}

export function passwordResetMatches(secret: string, tokenHash: string) {
  const left = Buffer.from(hashPasswordResetSecret(secret), "utf8");
  const right = Buffer.from(tokenHash, "utf8");
  return left.length === right.length && timingSafeEqual(left, right);
}

export function passwordSetUrl(userId: string, secret: string) {
  return `${appOrigin()}/set-password?uid=${encodeURIComponent(userId)}&t=${encodeURIComponent(secret)}`;
}

export function passwordResetExpiry(now = new Date()) {
  return new Date(now.getTime() + PASSWORD_RESET_TTL_MS);
}
