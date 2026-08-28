/**
 * Product branding. Change these in `.env.local` (then restart the dev server):
 *
 *   NEXT_PUBLIC_APP_NAME="Spedgress"
 *   NEXT_PUBLIC_APP_SLUG="spedgress"
 *
 * Leave SLUG blank to derive it from the name (lowercase, hyphenated).
 */
function slugify(value: string) {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "app"
  );
}

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME?.trim() || "IEP Progress Tracker";

export const APP_SLUG =
  process.env.NEXT_PUBLIC_APP_SLUG?.trim() || slugify(APP_NAME);

export const DEMO_EMAIL_DOMAIN =
  process.env.NEXT_PUBLIC_DEMO_EMAIL_DOMAIN?.trim() || `demo.${APP_SLUG}.school`;

export const DEMO_PASSPHRASE =
  process.env.NEXT_PUBLIC_DEMO_PASSPHRASE?.trim() || "Iep-progress-tracker!Demo26";

export const APP_TAGLINE = `${APP_NAME} helps special education teams track IEP goals and share clear, parent-friendly progress.`;

export function demoEmail(localPart: string) {
  return `${localPart}@${DEMO_EMAIL_DOMAIN}`;
}

export const DEMO_USER_LOCAL_PARTS = [
  "chris.okonkwo",
  "maya.ellis",
  "priya.shah",
  "luis.navarro",
  "dana.hale",
  "alex.rivera",
  "morgan.chen",
  "taylor.brooks",
] as const;

export function isDemoLocalPart(value: string): value is (typeof DEMO_USER_LOCAL_PARTS)[number] {
  return (DEMO_USER_LOCAL_PARTS as readonly string[]).includes(value);
}
