import { createHmac, timingSafeEqual } from "node:crypto";
import { formatDate } from "@/lib/utils";

export type DigestGoal = {
  sharedWithGuardians: boolean;
  plainLanguageSummary: string;
  unit: string;
  entries: {
    recordedAt: string | Date;
    sessionOutcome: string;
    score: number;
    homeCarryover?: string | null;
  }[];
};

export type DigestStudent = {
  preferredName: string;
  goals: DigestGoal[];
};

export function isFridayUtc(now: Date = new Date()) {
  return now.getUTCDay() === 5;
}

export function shouldSendWeeklyDigest(
  now: Date = new Date(),
  env: NodeJS.Dict<string> = process.env,
) {
  return env.DIGEST_SEND === "1" || isFridayUtc(now);
}

export function digestWeekRange(now: Date = new Date()) {
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const start = new Date(end.getTime() - 7 * 86_400_000);
  return { start, end };
}

export function digestSubject(preferredName: string) {
  return `Weekly update for ${preferredName}`;
}

export function buildFamilyDigest(student: DigestStudent, now: Date = new Date()) {
  const { start, end } = digestWeekRange(now);
  const goals = student.goals.filter((goal) => goal.sharedWithGuardians);
  const sections = goals.map((goal) => {
    const weekEntries = goal.entries.filter((entry) => {
      const at = new Date(entry.recordedAt);
      return at >= start && at < end && entry.sessionOutcome === "PRESENT";
    });
    const scores = weekEntries.map((entry) => `${entry.score} ${goal.unit}`).join(", ");
    const carryover = [...weekEntries].reverse().find((entry) => entry.homeCarryover)?.homeCarryover;
    return {
      summary: goal.plainLanguageSummary,
      scores: scores || "No present session this week.",
      carryover: carryover?.trim() || null,
    };
  });
  return {
    subject: digestSubject(student.preferredName),
    weekLabel: `${formatDate(start)} – ${formatDate(end)}`,
    sections,
  };
}

export function formatDigestText(input: {
  preferredName: string;
  weekLabel: string;
  sections: { summary: string; scores: string; carryover: string | null }[];
  portalUrl: string;
  unsubscribeUrl: string;
  productName: string;
}) {
  const lines = [
    `This is a weekly update for ${input.preferredName} (${input.weekLabel}).`,
    "It uses scores and home-carryover notes the school already wrote. It does not suggest services or placement.",
    "",
  ];
  if (input.sections.length === 0) {
    lines.push("No shared goals are on this update.");
  }
  for (const section of input.sections) {
    lines.push(section.summary);
    lines.push(`Last week’s scores: ${section.scores}`);
    if (section.carryover) lines.push(`To try at home: ${section.carryover}`);
    lines.push("");
  }
  lines.push(`Who can see this: guardians linked to ${input.preferredName} who opted in.`);
  lines.push(`Read more in the family portal: ${input.portalUrl}`);
  lines.push(`Unsubscribe: ${input.unsubscribeUrl}`);
  lines.push(`${input.productName} does not include disability labels or official IEP wording in this email.`);
  return lines.join("\n");
}

export function digestUnsubscribeToken(contactId: string, secret: string) {
  const hmac = createHmac("sha256", secret).update(`digest:${contactId}`).digest("hex");
  return `${contactId}.${hmac}`;
}

export function parseDigestUnsubscribeToken(token: string, secret: string) {
  const [contactId, hmac] = token.split(".");
  if (!contactId || !hmac) return null;
  const expected = digestUnsubscribeToken(contactId, secret).split(".")[1];
  const left = Buffer.from(hmac, "utf8");
  const right = Buffer.from(expected, "utf8");
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;
  return contactId;
}
