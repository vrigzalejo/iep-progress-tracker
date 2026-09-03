import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
} from "node:crypto";
import { APP_NAME } from "@/lib/brand";

const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const STEP_SECONDS = 30;
const DIGITS = 6;

export function encodeBase32(buffer: Buffer) {
  let bits = 0;
  let value = 0;
  let output = "";
  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += BASE32[(value << (5 - bits)) & 31];
  return output;
}

export function decodeBase32(input: string) {
  const clean = input.replace(/=+$/g, "").toUpperCase().replace(/[\s-]/g, "");
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of clean) {
    const idx = BASE32.indexOf(ch);
    if (idx < 0) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

export function generateTotpSecret() {
  return encodeBase32(randomBytes(20));
}

function hotp(secret: Buffer, counter: number) {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));
  const hmac = createHmac("sha1", secret).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    (hmac[offset + 1] << 16) |
    (hmac[offset + 2] << 8) |
    hmac[offset + 3];
  return String(code % 10 ** DIGITS).padStart(DIGITS, "0");
}

export function totpCode(secretBase32: string, at = Date.now()) {
  const counter = Math.floor(at / 1000 / STEP_SECONDS);
  return hotp(decodeBase32(secretBase32), counter);
}

export function verifyTotp(secretBase32: string, token: string, at = Date.now()) {
  const code = token.replace(/\s/g, "");
  if (!/^\d{6}$/.test(code)) return false;
  for (const offset of [-1, 0, 1]) {
    const when = at + offset * STEP_SECONDS * 1000;
    if (totpCode(secretBase32, when) === code) return true;
  }
  return false;
}

export function otpauthUrl(secretBase32: string, accountName: string) {
  const issuer = encodeURIComponent(APP_NAME);
  const account = encodeURIComponent(accountName);
  return `otpauth://totp/${issuer}:${account}?secret=${secretBase32}&issuer=${issuer}&digits=${DIGITS}&period=${STEP_SECONDS}`;
}

function encryptionKey(secret = process.env.AUTH_SECRET) {
  return createHash("sha256").update(secret || "dev-only-auth-secret").digest();
}

export function encryptSecret(plain: string, secret = process.env.AUTH_SECRET) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(secret), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

export function decryptSecret(payload: string, secret = process.env.AUTH_SECRET) {
  const buf = Buffer.from(payload, "base64");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const enc = buf.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(secret), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
}
