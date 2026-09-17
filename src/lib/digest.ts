import { createHmac, timingSafeEqual } from "node:crypto";
import { familyCopy } from "@/lib/family-copy";
import { familyGoalSummary, type FamilyLocale } from "@/lib/family-locale";
import { formatDate } from "@/lib/utils";

export type DigestGoal = {
  sharedWithGuardians: boolean;
  plainLanguageSummary: string;
  plainLanguageSummaryEs?: string | null;
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

export function digestSubject(preferredName: string, locale: FamilyLocale = "en") {
  const copy = familyCopy(locale);
  return locale === "es" ? copy.digestSubjectEs(preferredName) : copy.digestSubject(preferredName);
}

export function buildFamilyDigest(
  student: DigestStudent,
  now: Date = new Date(),
  locale: FamilyLocale = "en",
) {
  const copy = familyCopy(locale);
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
      summary: familyGoalSummary(goal, locale),
      scores: scores || copy.noPresent,
      carryover: carryover?.trim() || null,
    };
  });
  return {
    subject: digestSubject(student.preferredName, locale),
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
  locale?: FamilyLocale;
}) {
  const copy = familyCopy(input.locale ?? "en");
  const lines = [
    copy.digestOpener(input.preferredName, input.weekLabel),
    copy.digestDisclaimer,
    "",
  ];
  if (input.sections.length === 0) {
    lines.push(copy.digestEmpty);
  }
  for (const section of input.sections) {
    lines.push(section.summary);
    lines.push(`${copy.digestScores} ${section.scores}`);
    if (section.carryover) lines.push(`${copy.tryAtHome} ${section.carryover}`);
    lines.push("");
  }
  lines.push(copy.digestWho(input.preferredName));
  lines.push(`${copy.digestReadMore} ${input.portalUrl}`);
  lines.push(`${copy.digestUnsub} ${input.unsubscribeUrl}`);
  lines.push(copy.digestNoLabels(input.productName));
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
