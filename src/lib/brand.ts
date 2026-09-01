/**
 * Product branding. Change these in `.env.local` (then restart the dev server):
 *
 *   NEXT_PUBLIC_APP_NAME="IEP Progress Tracker"
 *   NEXT_PUBLIC_APP_SLUG="iep-progress-tracker"
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

export const DEMO_ORG_NAME = "Mabuhay Demonstration School";
export const DEMO_ELEMENTARY_SCHOOL = "Liwanag Elementary";
export const DEMO_MIDDLE_SCHOOL = "Katipunan Middle School";

export const DEMO_USER_LOCAL_PARTS = [
  "crisanto.reyes",
  "maricel.santos",
  "patricia.cruz",
  "lorenzo.bautista",
  "diana.santos",
  "andres.villanueva",
  "mikaela.tan",
  "teresa.bautista",
] as const;

/** Previous demo emails still remap onto the current Filipino cast. */
export const DEMO_LOCAL_PART_ALIASES: Record<string, (typeof DEMO_USER_LOCAL_PARTS)[number]> = {
  "chris.okonkwo": "crisanto.reyes",
  "maya.ellis": "maricel.santos",
  "priya.shah": "patricia.cruz",
  "luis.navarro": "lorenzo.bautista",
  "dana.hale": "diana.santos",
  "alex.rivera": "andres.villanueva",
  "morgan.chen": "mikaela.tan",
  "taylor.brooks": "teresa.bautista",
};

export const DEMO_USER_DISPLAY_NAMES: Record<(typeof DEMO_USER_LOCAL_PARTS)[number], string> = {
  "crisanto.reyes": "Crisanto Reyes",
  "maricel.santos": "Maricel Santos",
  "patricia.cruz": "Patricia Cruz",
  "lorenzo.bautista": "Lorenzo Bautista",
  "diana.santos": "Diana Santos",
  "andres.villanueva": "Andres Villanueva",
  "mikaela.tan": "Mikaela Tan",
  "teresa.bautista": "Teresa Bautista",
};

const DEMO_TEXT_REPLACEMENTS: [string, string][] = [
  ["Jordan Hale", "Jaime Santos"],
  ["Casey Hale", "Carla Santos"],
  ["Sam Rivera", "Samuel Villanueva"],
  ["Avery Chen", "Andrea Tan"],
  ["Riley Brooks", "Rafael Bautista"],
  ["Chris Okonkwo", "Crisanto Reyes"],
  ["Maya Ellis", "Maricel Santos"],
  ["Priya Shah", "Patricia Cruz"],
  ["Luis Navarro", "Lorenzo Bautista"],
  ["Dana Hale", "Diana Santos"],
  ["Alex Rivera", "Andres Villanueva"],
  ["Morgan Chen", "Mikaela Tan"],
  ["Taylor Brooks", "Teresa Bautista"],
  ["Maple Ridge Demonstration School", DEMO_ORG_NAME],
  ["Maple Ridge Elementary", DEMO_ELEMENTARY_SCHOOL],
  ["Cedar Grove Middle School", DEMO_MIDDLE_SCHOOL],
  ["Jordan", "Jaime"],
  ["Casey", "Carla"],
  ["Avery", "Andrea"],
  ["Riley", "Rafael"],
  ["Sam’s", "Samuel’s"],
  ["Sam's", "Samuel's"],
  ["Sam will", "Samuel will"],
  ["Sam is", "Samuel is"],
  ["Sam writes", "Samuel writes"],
];

export function isDemoLocalPart(value: string): value is (typeof DEMO_USER_LOCAL_PARTS)[number] {
  return (DEMO_USER_LOCAL_PARTS as readonly string[]).includes(value);
}

export function canonicalDemoLocalPart(value: string) {
  if (isDemoLocalPart(value)) return value;
  return DEMO_LOCAL_PART_ALIASES[value];
}

export function applyDemoTextReplacements(text: string) {
  return DEMO_TEXT_REPLACEMENTS.reduce(
    (next, [from, to]) => next.split(from).join(to),
    text,
  );
}
