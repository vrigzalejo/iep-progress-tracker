import { APP_NAME } from "@/lib/brand";
import { ROLE_LABELS, type Role } from "@/lib/constants";
import { helpArticles, type HelpArticle } from "@/lib/help-handbook";
import { can, isStaff } from "@/lib/permissions";

export const HELP_CHAT_MAX_QUESTION = 600;
export const HELP_CHAT_MAX_HISTORY = 8;
export const HELP_CHAT_MAX_HISTORY_CONTENT = 1500;

export function clipHelpHistory(history: HelpChatMessage[]): HelpChatMessage[] {
  return history.slice(-HELP_CHAT_MAX_HISTORY).map((message) => ({
    role: message.role,
    content: message.content.slice(0, HELP_CHAT_MAX_HISTORY_CONTENT),
  }));
}

export function normalizeHelpPathname(value: unknown) {
  if (typeof value !== "string") return "";
  const path = value.trim().split("?")[0]?.split("#")[0] ?? "";
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("://")) return "";
  const parts = path.split("/").filter(Boolean).map((segment) => {
    if (
      /^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(segment) ||
      /^c[a-z0-9]{20,}$/i.test(segment) ||
      /^[0-9]{6,}$/.test(segment)
    ) {
      return "id";
    }
    return segment.slice(0, 48);
  });
  return `/${parts.slice(0, 4).join("/")}`.slice(0, 120);
}

export function parseHelpChatRequest(json: unknown):
  | { ok: true; question: string; history: HelpChatMessage[]; pathname: string }
  | { ok: false; error: string } {
  if (!json || typeof json !== "object") {
    return { ok: false, error: "Send a JSON question." };
  }
  const record = json as Record<string, unknown>;
  const question = typeof record.question === "string" ? normalizeQuestion(record.question) : "";
  if (!question) {
    return { ok: false, error: "Ask a short how-to question." };
  }
  const rawHistory = Array.isArray(record.history) ? record.history : [];
  const history: HelpChatMessage[] = [];
  for (const item of rawHistory) {
    if (!item || typeof item !== "object") continue;
    const row = item as { role?: unknown; content?: unknown };
    if (row.role !== "user" && row.role !== "assistant") continue;
    if (typeof row.content !== "string") continue;
    history.push({ role: row.role, content: row.content });
  }
  return {
    ok: true,
    question,
    history: clipHelpHistory(history),
    pathname: normalizeHelpPathname(record.pathname),
  };
}

const STOP = new Set([
  "the",
  "and",
  "for",
  "this",
  "that",
  "with",
  "from",
  "what",
  "where",
  "when",
  "how",
  "can",
  "does",
  "did",
  "you",
  "your",
  "site",
  "app",
  "about",
  "please",
  "tell",
  "show",
  "need",
  "want",
  "using",
  "use",
]);

const REFUSE_PATTERNS = [
  /write (me |an? |the )?(iep )?goal/i,
  /generat(e|ing) .{0,60}goal/i,
  /draft .{0,40}(iep|goal|present levels)/i,
  /recommend .{0,50}(service|minutes|placement|therap|accommodation)/i,
  /should (we|i) (increase|decrease|discontinue|exit|qualify)/i,
  /is this (enough|compliant|legal|ferpa certified)/i,
  /diagnos(e|is)/i,
  /make (an? )?(iep|placement) decision/i,
];

export type HelpChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type HelpChatResult = {
  text: string;
  hrefs: string[];
  prompts: string[];
  refused: boolean;
  source: "handbook" | "model";
};

export function normalizeQuestion(value: string) {
  return value.replace(/\s+/g, " ").trim().slice(0, HELP_CHAT_MAX_QUESTION);
}

export function tokens(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOP.has(token));
}

export function refuseHelpQuestion(question: string) {
  const text = question.trim();
  if (!text) return "Ask a short question about how to use this site.";
  for (const pattern of REFUSE_PATTERNS) {
    if (pattern.test(text)) {
      return `${APP_NAME} does not generate IEP goals, recommend services, or make educational, legal, or clinical decisions. I can only explain which screens to use. Open the setup guide for the supported workflow.`;
    }
  }
  return null;
}

export function scoreArticle(
  article: HelpArticle,
  queryTokens: string[],
  role: Role,
  questionLower = "",
) {
  if (article.roles && !article.roles.includes(role)) return 0;
  const titleTokens = tokens(article.title);
  const bodyTokens = tokens(article.body);
  const keywordSet = new Set(article.keywords.map((word) => word.toLowerCase()));
  let score = 0;
  for (const token of queryTokens) {
    if (titleTokens.includes(token)) score += 3;
    if (keywordSet.has(token)) score += 2;
    if (bodyTokens.includes(token)) score += 1;
  }
  const haystack = questionLower || queryTokens.join(" ");
  for (const keyword of article.keywords) {
    const key = keyword.toLowerCase();
    if ((key.length < 4 && !key.includes(" ")) || !haystack.includes(key)) continue;
    score += key.includes(" ") ? 5 : 2;
  }
  return score;
}

export const HELP_ADMIN_PROMPTS = [
  "What can this app do?",
  "How do I add a school campus?",
  "How do I invite someone by email?",
  "How do I reset a forgotten password?",
  "How do I open the evidence gallery?",
  "How do I filter search by service area?",
  "How do I open meeting room on the projector?",
  "How does the Friday family email work?",
];

export const HELP_STAFF_PROMPTS = [
  "What can this app do?",
  "How do I add a student profile?",
  "How do I record an IEP goal?",
  "How do I log a session with trials?",
  "How do I open the evidence gallery?",
  "How do I filter search by service area?",
  "How do I print a meeting packet?",
  "How do I reset a forgotten password?",
];

export const HELP_PROVIDER_PROMPTS = [
  "What can this app do?",
  "How do I log a session with trials?",
  "How do I open the evidence gallery?",
  "How do I filter search by service area?",
  "How do I print a meeting packet?",
  "How do I reset a forgotten password?",
];

export const HELP_FAMILY_PROMPTS = [
  "What can I see in the family portal?",
  "How do I switch the site to Spanish?",
  "How do I open home practice cards?",
  "How do I message the team?",
  "How do I switch between children?",
  "How do I opt in to the weekly email digest?",
  "How do I install the app on my phone?",
  "How do I acknowledge the privacy notice?",
];

const PATH_PROMPTS: { match: string; prompts: string[] }[] = [
  { match: "/hallway", prompts: ["How do I log a session with trials?", "How does Hallway pick the next student?"] },
  { match: "/today", prompts: ["How do I log a session with trials?", "How does Hallway pick the next student?"] },
  { match: "/search", prompts: ["How do I filter search by service area?"] },
  { match: "/reports/studio", prompts: ["How do I print a meeting packet?"] },
  { match: "/reports", prompts: ["How do I print a meeting packet?", "How do I open meeting room on the projector?"] },
  { match: "/parent", prompts: ["What can I see in the family portal?", "How do I switch the site to Spanish?"] },
  { match: "/messages", prompts: ["How do I message the team?"] },
  { match: "/team", prompts: ["How do I invite someone by email?"] },
  { match: "/schools", prompts: ["How do I add a school campus?"] },
  { match: "/privacy", prompts: ["How do I acknowledge the privacy notice?"] },
  { match: "/guide", prompts: ["What can this app do?"] },
  { match: "/students", prompts: ["How do I add a student profile?", "How do I open the evidence gallery?"] },
  { match: "/sign-in", prompts: ["How do I reset a forgotten password?"] },
  { match: "/setup", prompts: ["How do I reset a forgotten password?"] },
];

function isCatalogArticle(article: HelpArticle) {
  return article.id === "catalog" || article.id === "catalog-family";
}

export function articleForPath(pathname: string, role: Role) {
  const path = pathname.split("?")[0] || "/";
  const slug = path.split("/").filter(Boolean)[0] ?? "";
  const ranked = helpArticles()
    .filter((article) => !article.roles || article.roles.includes(role))
    .map((article) => {
      let score = 0;
      for (const href of article.hrefs) {
        if (path === href) score = Math.max(score, href.length + 20);
        else if (path.startsWith(`${href}/`)) score = Math.max(score, href.length);
      }
      if (score === 0) return { article, score: 0 };
      const home = article.hrefs[0];
      if (home && (path === home || path.startsWith(`${home}/`))) score += 50;
      if (article.id === slug) score += 100;
      if (isCatalogArticle(article)) score -= 10;
      return { article, score };
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score);
  return ranked[0]?.article;
}

export function helpPagePath(pathname: string) {
  const top = (pathname.split("?")[0] || "/").split("/").filter(Boolean)[0];
  return top ? `/${top}` : "/";
}

export function helpPageLabel(pathname: string) {
  const path = helpPagePath(pathname);
  if (path === "/") return "";
  return helpHrefLabel(path);
}

export function helpHrefAllowed(href: string, role: Role) {
  const path = href.split("?")[0] || href;
  if (path === "/parent") return role === "PARENT";
  if (path === "/dashboard" || path === "/today" || path === "/hallway" || path === "/minutes" || path === "/search") {
    return isStaff(role);
  }
  if (path === "/students/new") return can(role, "student.create");
  if (/^\/students\/[^/]+\/carryover$/.test(path)) {
    return role === "PARENT" || isStaff(role);
  }
  if (path === "/students" || path.startsWith("/students/")) {
    return can(role, "student.list") && role !== "PARENT";
  }
  if (path === "/reports/studio" || path === "/reports") return isStaff(role);
  if (path.startsWith("/reports/")) return can(role, "report.create");
  if (path === "/team" || path === "/schools") return can(role, "team.manage");
  if (path === "/messages") return can(role, "message.send");
  return true;
}

const PROMPT_ACCESS: Record<string, (role: Role) => boolean> = {
  "What can this app do?": () => true,
  "How do I add a school campus?": (role) => can(role, "team.manage"),
  "How do I invite someone by email?": (role) => can(role, "team.manage"),
  "How do I add a student profile?": (role) => can(role, "student.create"),
  "How do I record an IEP goal?": (role) => can(role, "goal.create"),
  "How do I log a session with trials?": (role) => can(role, "progress.create"),
  "How does Hallway pick the next student?": (role) => can(role, "progress.create"),
  "How do I open the evidence gallery?": (role) => isStaff(role),
  "How do I filter search by service area?": (role) => can(role, "search.staff"),
  "How do I print a meeting packet?": (role) => can(role, "report.create"),
  "How do I open meeting room on the projector?": (role) => isStaff(role),
  "How does the Friday family email work?": () => true,
  "How do I reset a forgotten password?": () => true,
  "What can I see in the family portal?": (role) => role === "PARENT",
  "How do I switch the site to Spanish?": (role) => role === "PARENT",
  "How do I open home practice cards?": (role) => role === "PARENT" || isStaff(role),
  "How do I message the team?": (role) => can(role, "message.send"),
  "How do I switch between children?": (role) => role === "PARENT",
  "How do I opt in to the weekly email digest?": (role) => role === "PARENT",
  "How do I install the app on my phone?": () => true,
  "How do I acknowledge the privacy notice?": () => true,
};

export function helpPromptAllowed(prompt: string, role: Role) {
  const check = PROMPT_ACCESS[prompt];
  if (check) return check(role);
  if (HELP_FAMILY_PROMPTS.includes(prompt)) return role === "PARENT";
  return true;
}

export function suggestedHelpPrompts(role: Role, pathname = "", asked: string[] = []) {
  const defaults =
    role === "PARENT"
      ? HELP_FAMILY_PROMPTS
      : role === "ADMINISTRATOR"
        ? HELP_ADMIN_PROMPTS
        : role === "PROVIDER"
          ? HELP_PROVIDER_PROMPTS
          : HELP_STAFF_PROMPTS;
  const path = pathname.split("?")[0] || "";
  const extra =
    PATH_PROMPTS.filter((row) => path === row.match || path.startsWith(`${row.match}/`)).sort(
      (a, b) => b.match.length - a.match.length,
    )[0]?.prompts ?? [];
  const seen = new Set(asked.map((item) => item.trim().toLowerCase()));
  return [...extra, ...defaults].filter((prompt) => {
    if (!helpPromptAllowed(prompt, role)) return false;
    const key = prompt.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 3);
}

export function helpWelcome(role: Role, pathname = "") {
  const page = helpPageLabel(pathname);
  const where = page ? ` on **${page}**` : "";
  if (role === "PARENT") {
    return `I can walk you through this site — screens only. Need a hand${where}?`;
  }
  return `I can walk you through this site — screens only. What do you want to do${where}?`;
}

export function helpArrivedHint(pathname: string) {
  const label = helpPageLabel(pathname) || "this screen";
  return `Now on **${label}**. Walk through this page?`;
}

export function shortenHelpPrompt(question: string) {
  const key = question.trim().toLowerCase();
  const known: Record<string, string> = {
    "how do i log a session with trials?": "Log a session",
    "how does hallway pick the next student?": "Next student after save",
    "what can this app do?": "See what the app can do",
    "what can i see in the family portal?": "What's on Family home",
    "how do i switch the site to spanish?": "Switch to Spanish",
    "want how to switch to spanish?": "Switch to Spanish",
    "how do i add a student profile?": "Add a student",
    "how do i record an iep goal?": "Record an IEP goal",
    "how do i open the evidence gallery?": "Open the evidence gallery",
    "how do i print a meeting packet?": "Print a meeting packet",
    "how do i reset a forgotten password?": "Reset a password",
    "how do i invite someone by email?": "Invite someone",
    "how do i add a school campus?": "Add a campus",
    "how do i filter search by service area?": "Filter search",
    "how do i open meeting room on the projector?": "Open Meeting room",
    "how does the friday family email work?": "Friday family email",
    "how do i open home practice cards?": "Home practice cards",
    "how do i message the team?": "Message the team",
    "how do i switch between children?": "Switch children",
    "how do i opt in to the weekly email digest?": "Weekly email digest",
    "how do i install the app on my phone?": "Install on a phone",
    "how do i acknowledge the privacy notice?": "Privacy notice",
    "what happens after i save?": "After I save?",
    "then what?": "Then what?",
  };
  if (known[key]) return known[key];
  const trimmed = question.trim().replace(/\?+$/, "");
  const shortened = trimmed.replace(/^how do i /i, "").replace(/^how does /i, "");
  if (!shortened) return question.trim();
  return shortened.charAt(0).toUpperCase() + shortened.slice(1);
}

export function retrieveArticles(question: string, role: Role, limit = 3, pathname = "") {
  const questionLower = question.toLowerCase();
  const queryTokens = tokens(question);
  const pathArticle = pathname ? articleForPath(pathname, role) : undefined;
  const ranked = helpArticles()
    .map((article) => {
      let score = scoreArticle(article, queryTokens, role, questionLower);
      if (pathArticle && article.id === pathArticle.id && !isCatalogArticle(article)) score += 6;
      if (/\b(message|messages|thread)\b/.test(questionLower) && article.id === "messages") score += 8;
      if (
        role === "PARENT" &&
        /\b(spanish|español|espanol)\b/.test(questionLower) &&
        (article.id === "family" || article.id === "catalog-family")
      ) {
        score += 8;
      }
      return { article, score };
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score);
  if (ranked.length === 0) {
    return helpArticles()
      .filter(
        (article) =>
          (article.id === "catalog" || article.id === "catalog-family") &&
          (!article.roles || article.roles.includes(role)),
      )
      .slice(0, 1);
  }
  return ranked.slice(0, limit).map((row) => row.article);
}

export function helpHrefLabel(href: string) {
  const labels: Record<string, string> = {
    "/guide": "Setup guide",
    "/setup": "Account setup",
    "/sign-in": "Sign in",
    "/dashboard": "Dashboard",
    "/students": "Students",
    "/students/new": "Add student",
    "/reports": "Reports",
    "/reports/studio": "Report studio",
    "/today": "Today",
    "/hallway": "Hallway",
    "/minutes": "Minutes",
    "/search": "Search",
    "/messages": "Messages",
    "/team": "Team",
    "/schools": "Schools",
    "/privacy": "Privacy",
    "/privacy-notice": "Privacy notice",
    "/parent": "Family home",
    "/forgot-password": "Forgot password",
    "/set-password": "Set password",
  };
  return labels[href] ?? href.replace(/^\//, "").replace(/\//g, " ");
}

function conversationalBody(article: HelpArticle, question = "") {
  const paragraphs = article.body.split(/\n\n+/).map((para) => para.trim()).filter(Boolean);
  if (paragraphs.length <= 2) return article.body;
  if (isCatalogArticle(article)) {
    return paragraphs
      .filter(
        (para, index) =>
          index < 2 ||
          /^\*\*(Start|Work list|Family home|On that page)\*\*/.test(para),
      )
      .join("\n\n");
  }
  const query = tokens(question);
  const ranked = paragraphs.map((para, index) => {
    let score = index === 0 ? 3 : 0;
    if (para.split("\n").some((line) => /^\d+\.\s/.test(line))) score += 6;
    for (const token of query) {
      if (para.toLowerCase().includes(token)) score += 2;
    }
    return { para, index, score };
  });
  const picked = new Set<number>([0]);
  for (const row of [...ranked].sort((a, b) => b.score - a.score || a.index - b.index)) {
    if (picked.has(row.index)) continue;
    const isList = row.para.split("\n").some((line) => /^\d+\.\s/.test(line));
    if (picked.size >= 2 && !isList) continue;
    if (picked.size >= 3) break;
    picked.add(row.index);
  }
  return paragraphs.filter((_, index) => picked.has(index)).join("\n\n");
}

function hrefsForReply(article: HelpArticle, body: string, question = "", pathname = "", role: Role = "EDUCATOR") {
  const query = question.toLowerCase();
  const here = pathname.split("?")[0] || "";
  const ranked = [...article.hrefs]
    .filter((href) => helpHrefAllowed(href, role))
    .sort((a, b) => {
      const scoreB = hrefQuestionScore(b, query) + (body.includes(b) ? 4 + b.length : 0);
      const scoreA = hrefQuestionScore(a, query) + (body.includes(a) ? 4 + a.length : 0);
      return scoreB - scoreA;
    });
  if (role === "PARENT") {
    const family = ranked.find((href) => href === "/parent" || href.startsWith("/parent"));
    if (family && family !== here) return [family];
  }
  const next = ranked.find((href) => href !== here && !here.startsWith(`${href}/`)) ?? ranked[0];
  return next && next !== here ? [next] : next ? [next] : [];
}

const HELP_CONTINUE_REPLIES: Record<
  string,
  { lead: string; steps: string[]; closer: string; href: string; prompts: string[] }
> = {
  sessions: {
    lead: "After **Save**, Hallway does not stay on that student.",
    steps: [
      "It opens the next person still on **Today**.",
      "If the list is empty, you land back on **Today**.",
      "To stay on one student, use **Log a session** on their profile instead of Hallway.",
    ],
    closer: "Want how to attach evidence from that pad?",
    href: "/hallway",
    prompts: ["How do I open the evidence gallery?", "How do I add a student profile?"],
  },
  today: {
    lead: "From **Today**, logging is one tap.",
    steps: [
      "Tap **Log in hallway** on a row.",
      "Score trials, then **Save**.",
      "Hallway opens the next student still on the list.",
    ],
    closer: "Want the trial-button walkthrough?",
    href: "/hallway",
    prompts: ["How do I log a session with trials?", "How does Hallway pick the next student?"],
  },
  students: {
    lead: "After the profile exists, record the IEP wording.",
    steps: [
      "Open the student, then **Goals**.",
      "Tap **Add goal** and type the goal as written.",
      "This chat will not write the goal for you.",
    ],
    closer: "Want how to log a session against that goal?",
    href: "/students",
    prompts: ["How do I log a session with trials?", "How do I open the evidence gallery?"],
  },
};

const HELP_CONTINUE: Record<string, string> = {
  catalog: "How do I log a session with trials?",
  "catalog-family": "How do I switch the site to Spanish?",
  sessions: "How does Hallway pick the next student?",
  today: "How do I log a session with trials?",
  students: "How do I record an IEP goal?",
  goals: "How do I log a session with trials?",
  reports: "How do I print a meeting packet?",
  meeting: "How do I open meeting room on the projector?",
  family: "How do I switch the site to Spanish?",
  signin: "How do I reset a forgotten password?",
  team: "How do I add a school campus?",
  guide: "How do I log a session with trials?",
};

const HELP_LEADS: Record<string, string> = {
  catalog: "Here’s the short map of this site.",
  "catalog-family": "Here’s what Family home is for.",
  sessions: "Sure — logging a session is the Hallway pad.",
  today: "Today is the work list for this week.",
  students: "Adding a student is a short form — then stop.",
  goals: "Goals are typed as written on the IEP.",
  reports: "Period comments live in Reports.",
  meeting: "Meeting room is the projector view of a report.",
  family: "Family home is the guardian view.",
  signin: "Passwords are reset from Forgot password.",
  team: "Invites go out from Team.",
  guide: "The Setup guide is the six staff steps.",
};

const HELP_CLOSERS: Record<string, string> = {
  sessions: "Want what happens after **Save**?",
  today: "Want me to walk through logging a session?",
  students: "Want how to record an IEP goal next?",
  goals: "Want how to log a session against that goal?",
  reports: "Want the meeting packet steps?",
  meeting: "Want how to open Meeting room on a projector?",
  family: "Want how to switch to Spanish?",
  catalog: "Want the session walkthrough next?",
  "catalog-family": "Want how to switch to Spanish?",
};

const HELP_NEXT_PROMPTS: Record<string, string[]> = {
  sessions: ["How does Hallway pick the next student?", "How do I open the evidence gallery?"],
  today: ["How do I log a session with trials?", "How does Hallway pick the next student?"],
  students: ["How do I record an IEP goal?", "How do I open the evidence gallery?"],
  goals: ["How do I log a session with trials?"],
  reports: ["How do I print a meeting packet?", "How do I open meeting room on the projector?"],
  meeting: ["How do I print a meeting packet?"],
  family: ["How do I switch the site to Spanish?", "How do I message the team?"],
  catalog: ["How do I log a session with trials?", "How do I add a student profile?"],
  "catalog-family": ["How do I switch the site to Spanish?", "How do I message the team?"],
  team: ["How do I add a school campus?", "How do I reset a forgotten password?"],
  guide: ["How do I add a student profile?", "How do I log a session with trials?"],
  signin: ["How do I reset a forgotten password?"],
};

export function isHelpThanks(question: string) {
  return /^(thanks|thank you|thx|got it)(\s.*)?$/i.test(question.trim());
}

function isParentStaffTopic(question: string) {
  return /\b(hallway|log (an? )?session|log a session|add a student|create student|iep goal|evidence gallery|report studio|invite someone|school campus|minutes gap|filter search|caseload search)\b/i.test(
    question,
  );
}

export function isFamilySpanishHelp(question: string) {
  const q = question.trim().toLowerCase().replace(/[?!.]+$/g, "").trim();
  return /switch( the site)? to spanish/.test(q) || q === "switch to spanish";
}

export function promptFromHelpCloser(line: string) {
  const key = line
    .trim()
    .toLowerCase()
    .replace(/\*\*/g, "")
    .replace(/[?!.]+$/g, "")
    .trim();
  if (key === "want how to switch to spanish") return "How do I switch the site to Spanish?";
  return null;
}

export function isHelpFollowUp(question: string) {
  const q = question.trim().toLowerCase().replace(/[?!.]+$/g, "").trim();
  if (!q) return false;
  if (isHelpThanks(question)) return true;
  if (isFamilySpanishHelp(q)) return false;
  if (
    /^(ok|okay|yes|yeah|yep|sure|please|continue|go on|more|next|and then|then what|what next|after that|and after that|what about that|how about that)$/.test(
      q,
    )
  ) {
    return true;
  }
  return /^(then|and then|after that|what about|how about|and)\b/.test(q) && tokens(q).length <= 5;
}

export function resolveHelpQuestion(
  question: string,
  history: HelpChatMessage[] = [],
  role: Role = "EDUCATOR",
  pathname = "",
) {
  const asked = normalizeQuestion(question);
  if (isFamilySpanishHelp(asked)) return "How do I switch the site to Spanish?";
  if (!history.length || !isHelpFollowUp(asked) || isHelpThanks(asked)) return asked;
  const lastUser = [...history].reverse().find((message) => message.role === "user")?.content;
  if (!lastUser) return asked;
  const prior = retrieveArticles(lastUser, role, 1, pathname)[0];
  if (
    role === "PARENT" &&
    prior &&
    (prior.id === "messages" || prior.id === "family" || prior.id === "catalog-family")
  ) {
    return "How do I switch the site to Spanish?";
  }
  const continued = prior && HELP_CONTINUE[prior.id];
  if (continued && helpPromptAllowed(continued, role)) return continued;
  return `${lastUser} ${asked}`;
}

const HELP_SCRIPTS: Record<string, string[]> = {
  catalog: [
    "Start on **Today** for students still owed a session this week.",
    "Log trials in **Hallway**, then tap **Save**.",
    "Write period comments in **Reports**. Open **Setup guide** for the six staff steps.",
  ],
  "catalog-family": [
    "Open **Family home** to see this week’s progress.",
    "Switch **English / Español** at the top if you need Spanish.",
    "Use **Messages** to write the team. This box only explains screens.",
  ],
  sessions: [
    "On **Today**, tap **Log in hallway**.",
    "Choose **Present** (or Absent / Declined if the service did not happen).",
    "For trial goals, tap **Independent**, **Prompted**, or **Incorrect**.",
    "Tap **Save**. Hallway opens the next student still on Today.",
  ],
  today: [
    "This list is students still owed a session this week.",
    "Tap **Log in hallway** for the big trial buttons.",
    "After save, Hallway opens the next student on the list.",
  ],
  students: [
    "Open **Students**.",
    "Tap **Add student**.",
    "Enter preferred name, grade, a school, and case manager. Stop there.",
  ],
  goals: [
    "Open the student, then **Goals**.",
    "Tap **Add goal** and type the IEP wording as written on the document.",
    "This assistant will not write or rewrite the goal for you.",
  ],
  signin: [
    "Open **Forgot password**.",
    "If mail is on, you get a two-hour set-password link (no student records).",
    "If mail is off, an administrator sets a temporary password on **Team**.",
  ],
  guide: [
    "Open **Setup guide** for the six staff steps.",
    "Administrators add campuses on **Schools** and invite people on **Team** (set-password link if SMTP or Resend is on).",
    "Log sessions on **Today** or **Hallway**.",
    "Write the period report, then open Meeting room or file a PDF.",
  ],
  family: [
    "Open **Family home**.",
    "Switch **English / Español** at the top if you need Spanish.",
    "Use the name tabs if more than one child is linked.",
  ],
  meeting: [
    "Open **Reports** or **Report studio**.",
    "Print the meeting packet from the report.",
    "Open Meeting room when you need the projector view.",
  ],
  reports: [
    "Open **Reports** for one student, or **Report studio** for the caseload grid.",
    "Tap **Write** to enter the progress code and comment.",
    "Use **Print** in the browser, or **File PDF** to store a copy.",
  ],
  team: [
    "Open **Team**.",
    "Tap **Invite** and enter the person’s school email.",
    "They get a set-password link if mail is on.",
  ],
};

function helpScript(id: string, role: Role, question = "") {
  if (id === "family" && /home practice|carryover|try at home/i.test(question)) {
    return [
      "On **Family home**, tap **Home practice cards**.",
      "Print the notes staff already wrote for that child.",
      "This site does not invent home activities.",
    ];
  }
  if (id === "family" && /message|thread|write (to )?the team/i.test(question)) {
    return [
      "On **Family home**, scroll to **Messages with the team**.",
      "Type in **Write to the team**, then tap **Send**.",
      "Or open **Messages** in the sidebar for the same thread.",
    ];
  }
  if ((id === "family" || id === "catalog-family") && /spanish|español|idioma|language|switch the site/i.test(question)) {
    return role === "PARENT"
      ? [
          "Family pages (sidebar, Family home, reports) use **Español** after this offer.",
          "Official IEP wording and staff notes stay as the school typed them.",
          "Tap **English** at the top of Family home to switch back.",
        ]
      : [
          "On **Family home**, tap **Español** or **English** at the top.",
          "The same toggle is on the progress report.",
          "Weekly email chrome follows the language the guardian last saved.",
        ];
  }
  if (id === "messages" && role === "PARENT") {
    return [
      "On **Family home**, scroll to **Messages with the team**.",
      "Type in **Write to the team**, then tap **Send**.",
      "Or open **Messages** in the sidebar for the same thread.",
    ];
  }
  if (id === "students" && !can(role, "student.create")) {
    return [
      "Open **Students** for the profiles you can see.",
      "Tap a student to view goals and **Log a session**.",
      "You cannot tap **Add student**. Ask a case manager or administrator to add a profile.",
    ];
  }
  if (id === "reports" && role === "PARENT") {
    return [
      "Open **Family home**.",
      "Tap **Open progress report** for the child whose tab is selected.",
      "Switch **English / Español** on the report, then use **Print** in the browser.",
    ];
  }
  if (id === "meeting" && role === "PARENT") {
    return [
      "Open **Family home**.",
      "Tap **Meeting packet** for the selected child.",
      "Use **Print** in the browser. You do not open Meeting room on a projector.",
    ];
  }
  if (id === "guide" && role === "PARENT") {
    return [
      "Sign-in lands you on **Family home**, not Dashboard.",
      "Read shared goals, reports, and home practice cards for linked children.",
      "Use **Messages** and **Privacy** in the sidebar. The numbered staff steps on Setup guide are not your workflow.",
    ];
  }
  if (id === "catalog" && role === "PROVIDER") {
    return [
      "Start on **Today** for students still owed a session this week.",
      "Log trials in **Hallway**, then tap **Save**.",
      "Open **Students** to view profiles. You cannot add students or type IEP goals.",
    ];
  }
  if (id === "schools" && !can(role, "team.manage")) {
    return [
      "Only an administrator adds campuses on **Schools**.",
      "When you add a student, pick a school from that list.",
      "Ask an administrator if a campus name is missing.",
    ];
  }
  return HELP_SCRIPTS[id];
}

function helpLead(id: string, role: Role, question = "") {
  if (id === "family" && /home practice|carryover|try at home/i.test(question)) {
    return "Home practice cards print notes staff already wrote.";
  }
  if ((id === "family" || id === "catalog-family") && /spanish|español|idioma|language|switch the site/i.test(question)) {
    return role === "PARENT"
      ? "This offer switches family pages to Spanish. It does not translate official IEP wording."
      : "Families switch language with **Español** on Family home.";
  }
  if (id === "family" && /message|thread|write (to )?the team/i.test(question)) {
    return "You write the team from **Family home** — not Team.";
  }
  if (id === "messages" && role === "PARENT") {
    return "Family messages live on **Family home** and in **Messages**.";
  }
  if (id === "students" && !can(role, "student.create")) {
    return "You can open student profiles. You cannot add them.";
  }
  if (id === "reports" && role === "PARENT") {
    return "You read reports from **Family home** — not Report studio.";
  }
  if (id === "meeting" && role === "PARENT") {
    return "The meeting packet is on **Family home**.";
  }
  if (id === "guide" && role === "PARENT") {
    return "Setup guide’s six staff steps are not the family path.";
  }
  if (id === "catalog" && role === "PROVIDER") {
    return "Here’s the short map for a related-service provider.";
  }
  return HELP_LEADS[id];
}

function helpCloser(id: string, role: Role) {
  if (id === "students" && !can(role, "student.create")) {
    return "Want how to log a session on a profile?";
  }
  if (id === "reports" && role === "PARENT") {
    return "Want the meeting packet from Family home?";
  }
  if (id === "messages" && role === "PARENT") {
    return "Want how to switch to Spanish?";
  }
  if (id === "catalog" && role === "PROVIDER") {
    return "Want the session walkthrough next?";
  }
  return HELP_CLOSERS[id] ?? "What should we do next?";
}

function formatHandbookArticles(
  articles: HelpArticle[],
  question = "",
  role: Role = "EDUCATOR",
  pathname = "",
) {
  const primary = articles[0];
  if (!primary) return { text: "", hrefs: [] as string[], prompts: [] as string[] };
  const body = conversationalBody(primary, question);
  const hrefs =
    role === "PARENT" && (primary.id === "reports" || primary.id === "meeting" || primary.id === "digest")
      ? ["/parent"]
      : hrefsForReply(primary, body, question, pathname, role);
  const steps = helpScript(primary.id, role, question) ?? toHelpSteps(body);
  const stepBlock =
    steps.length > 0
      ? steps.map((step, index) => `${index + 1}. ${asTapLine(step)}`).join("\n")
      : asTapLine(body);
  const lead = helpLead(primary.id, role, question) ?? `Here’s how **${primary.title}** works.`;
  const closer = helpCloser(primary.id, role);
  const text = `${lead}\n\n${stepBlock}\n\n${closer}`;
  return {
    text,
    hrefs,
    prompts: followUpPrompts(articles, role, pathname, question),
  };
}

function asTapLine(text: string) {
  return text.replace(/\[([^\]]+)\]\([^)]+\)/g, "**$1**").replace(/^\d+\.\s+/, "");
}

function hrefQuestionScore(href: string, query: string) {
  let score = 0;
  for (const part of href.split("/").filter(Boolean)) {
    if (part.length > 2 && query.includes(part.replace(/-/g, " "))) score += 3;
    if (part.length > 2 && query.includes(part)) score += 3;
  }
  return score;
}

function toHelpSteps(body: string) {
  const numbered = body
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^\d+\.\s+\S/.test(line))
    .map((line) => line.replace(/^\d+\.\s+/, ""));
  if (numbered.length >= 2) return numbered.slice(0, 6);
  const sentences = body
    .replace(/\n+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 24 && sentence.length < 220);
  return sentences.slice(0, 4);
}

function followUpPrompts(articles: HelpArticle[], role: Role, pathname: string, question: string) {
  const next = (HELP_NEXT_PROMPTS[articles[0]?.id ?? ""] ?? []).filter((prompt) => helpPromptAllowed(prompt, role));
  return [...next, ...suggestedHelpPrompts(role, pathname, [question, ...next])].slice(0, 2);
}

export function chunkHelpReply(text: string) {
  const lines = text.split("\n");
  if (lines.filter((line) => /^\d+\.\s+\S/.test(line.trim())).length >= 2) {
    const chunks: string[] = [];
    let preface: string[] = [];
    for (const line of lines) {
      if (/^\d+\.\s+\S/.test(line.trim())) {
        if (preface.length) {
          chunks.push(`${preface.join("\n")}\n`);
          preface = [];
        }
        chunks.push(`${line}\n`);
      } else if (chunks.length === 0) {
        preface.push(line);
      } else {
        chunks[chunks.length - 1] += `${line}\n`;
      }
    }
    if (preface.length) chunks.unshift(`${preface.join("\n")}\n`);
    return chunks.filter((chunk) => chunk.trim().length > 0);
  }
  const blocks = text.split(/\n\n+/).filter((block) => block.length > 0);
  if (blocks.length > 1) {
    return blocks.map((block, index) => (index < blocks.length - 1 ? `${block}\n\n` : block));
  }
  const sentences = text.split(/(?<=[.!?])\s+/).filter((block) => block.length > 0);
  if (sentences.length > 1) {
    return sentences.map((sentence, index) => (index < sentences.length - 1 ? `${sentence} ` : sentence));
  }
  return [text];
}

export function helpTypeUnits(text: string, maxFrames = 40) {
  const words = text.split(/(\s+)/).filter((part) => part.length > 0);
  if (words.length <= maxFrames) return words;
  const size = Math.ceil(words.length / maxFrames);
  const units: string[] = [];
  for (let i = 0; i < words.length; i += size) {
    units.push(words.slice(i, i + size).join(""));
  }
  return units;
}

export function answerFromHandbook(
  question: string,
  role: Role,
  pathname = "",
  history: HelpChatMessage[] = [],
): HelpChatResult {
  const refused = refuseHelpQuestion(question);
  if (refused) {
    return {
      text: refused,
      hrefs: ["/guide"],
      prompts: ["What can this app do?"],
      refused: true,
      source: "handbook",
    };
  }
  if (isHelpThanks(question)) {
    return {
      text: "Anytime. Ask about another screen whenever you want.",
      hrefs: [],
      prompts: suggestedHelpPrompts(role, pathname).slice(0, 2),
      refused: false,
      source: "handbook",
    };
  }
  if (role === "PARENT" && isParentStaffTopic(question)) {
    return {
      text: "This login is **Family home** only. You don’t have Today, Hallway, Students, or Team.\n\n1. Open **Family home** for the linked child.\n2. Use the name tabs if more than one child is linked.\n3. Open a progress report, meeting packet, or messages from there.\n\nWant how to switch to Spanish?",
      hrefs: ["/parent"],
      prompts: ["How do I switch the site to Spanish?", "How do I open home practice cards?"],
      refused: false,
      source: "handbook",
    };
  }
  if (!can(role, "student.create") && isStaff(role) && /\b(add a student|create student|new student|add a student profile)\b/i.test(question)) {
    return {
      text: "Related-service providers can open **Students** and log sessions. They cannot add profiles.\n\n1. Open **Students**.\n2. Tap a student you are assigned to.\n3. Use **Log a session** or Hallway from **Today**.\n\nAsk a case manager or administrator to add a new student.",
      hrefs: ["/students"],
      prompts: ["How do I log a session with trials?", "How do I open the evidence gallery?"],
      refused: false,
      source: "handbook",
    };
  }
  if (!can(role, "goal.create") && isStaff(role) && /\b(record an iep goal|add (an? )?(iep )?goal|create (an? )?goal)\b/i.test(question)) {
    return {
      text: "Providers view goals; they don’t type IEP wording. Ask the case manager or an administrator.\n\n1. Open **Students** and the student.\n2. Open a goal to read it.\n3. Log trials from **Today** or Hallway.\n\nWant how to log a session?",
      hrefs: ["/students"],
      prompts: ["How do I log a session with trials?", "How do I open the evidence gallery?"],
      refused: false,
      source: "handbook",
    };
  }
  if (history.length && isHelpFollowUp(question)) {
    const lastUser = [...history].reverse().find((message) => message.role === "user")?.content;
    const prior = lastUser ? retrieveArticles(lastUser, role, 1, pathname)[0] : undefined;
  if (prior?.id === "students" && !can(role, "goal.create")) {
    // fall through — providers should not be walked into Add goal
  } else {
    const continued = prior ? HELP_CONTINUE_REPLIES[prior.id] : undefined;
    if (continued) {
      const prompts = continued.prompts.filter((prompt) => helpPromptAllowed(prompt, role));
      const here = pathname.split("?")[0] || "";
      const hrefs =
        helpHrefAllowed(continued.href, role) && continued.href !== here ? [continued.href] : [];
      const stepBlock = continued.steps
        .map((step, index) => `${index + 1}. ${asTapLine(step)}`)
        .join("\n");
      return {
        text: `${continued.lead}\n\n${stepBlock}\n\n${continued.closer}`,
        hrefs,
        prompts,
        refused: false,
        source: "handbook",
      };
    }
  }
  }
  const search = resolveHelpQuestion(question, history, role, pathname);
  const articles = retrieveArticles(search, role, 3, pathname);
  if (articles.length === 0) {
    const overview =
      helpArticles().find(
        (article) =>
          (article.id === "catalog" || article.id === "catalog-family") &&
          (!article.roles || article.roles.includes(role)),
      ) ?? helpArticles()[0];
    return {
      text:
        role === "PARENT"
          ? `I can explain Family home, reports, messages, and privacy for a ${ROLE_LABELS[role]}. Ask about Spanish, home practice cards, or the weekly email.`
          : role === "PROVIDER"
            ? `I can explain Today, Hallway, Students (view only), reports, and messages for a ${ROLE_LABELS[role]}. You cannot add students or IEP goals.`
            : `I can explain every ${APP_NAME} screen for your role (${ROLE_LABELS[role]}). Ask about students, goals, sessions, reports, search, messages, team, or privacy — or say “what can this app do?”`,
      hrefs: overview.hrefs.filter((href) => helpHrefAllowed(href, role)).slice(0, 1),
      prompts: suggestedHelpPrompts(role, pathname),
      refused: false,
      source: "handbook",
    };
  }
  const formatted = formatHandbookArticles(articles, search, role, pathname);
  return {
    text: formatted.text,
    hrefs: formatted.hrefs,
    prompts: formatted.prompts,
    refused: false,
    source: "handbook",
  };
}

export function helpSystemPrompt(role: Role, articles: HelpArticle[], walkthrough = "") {
  const handbook = articles
    .map((article) => `### ${article.title}\n${article.body}\nScreens: ${article.hrefs.join(", ")}`)
    .join("\n\n");
  return [
    `You are the in-app how-to chat for ${APP_NAME}. Talk like a helpful teammate, not a manual.`,
    `The signed-in person is a ${ROLE_LABELS[role]}. Answer only how to use this website.`,
    role === "PARENT"
      ? "Never send them to Today, Hallway, Students, Team, Schools, Search, or Report studio. Family home, reports they can read, messages, and privacy only."
      : role === "PROVIDER"
        ? "They can log sessions and view assigned students. They cannot add students, type IEP goals, or open Team or Schools."
        : role === "EDUCATOR"
          ? "They cannot open Team or Schools. An administrator adds campuses and invites people."
          : "Administrators can open Team and Schools.",
    "Use only the handbook excerpts below. If they are not enough, say so and point to /guide.",
    "Use the prior messages as context. If they say “then what”, “ok”, or “yes”, continue from the last task. Do not repeat the same steps unless they ask.",
    "Reply in a short chat: one friendly sentence, then 3 or 4 numbered taps (1. 2. 3.). End with one question about what to do next.",
    "Do not paste the whole handbook. Do not add a closing essay. Do not greet again if you already greeted.",
    "Use markdown links only to in-app paths that start with /.",
    "Never generate IEP goals, present levels, services, minutes, placements, or progress narratives.",
    "Never make educational, legal, or clinical decisions. Never ask for student names or record details.",
    "If the person describes a specific student, refuse to interpret the record and tell them to open Students, Search, or Family home.",
    walkthrough
      ? `Rephrase this walkthrough. Keep the numbered taps and the next-step question:\n${walkthrough}`
      : "",
    "",
    handbook || "No handbook excerpts matched. Direct the person to /guide.",
  ]
    .filter(Boolean)
    .join("\n");
}

function firstToken(env: NodeJS.Dict<string>, keys: string[]) {
  for (const key of keys) {
    const value = env[key]?.trim();
    if (value) return value;
  }
  return undefined;
}

/** Hugging Face Inference Providers (monthly free credits with a HF token). */
export function huggingFaceHelpConfig(env: NodeJS.Dict<string> = process.env) {
  const apiKey = firstToken(env, ["HF_TOKEN", "HUGGINGFACE_HUB_TOKEN", "HUGGINGFACE_API_KEY"]);
  if (!apiKey) return null;
  return {
    apiKey,
    baseUrl: (env.HF_CHAT_BASE_URL?.trim() || "https://router.huggingface.co/v1").replace(/\/$/, ""),
    model: env.HF_CHAT_MODEL?.trim() || "Qwen/Qwen2.5-3B-Instruct:cheapest",
  };
}

export function sanitizeHelpReply(text: string) {
  return text
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\((https?:[^)]+)\)/gi, "$1")
    .replace(/https?:\/\/\S+/gi, "")
    .trim();
}

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export async function completeHelpChat(messages: ChatMessage[]) {
  const config = huggingFaceHelpConfig();
  if (!config) return null;
  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      temperature: 0.2,
      max_tokens: 800,
      messages,
    }),
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) return null;
  const payload = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = payload.choices?.[0]?.message?.content?.trim();
  return text ? sanitizeHelpReply(text) : null;
}

export type HelpStreamEvent = {
  delta?: string;
  text?: string;
  hrefs?: string[];
  prompts?: string[];
  refused?: boolean;
  done?: boolean;
  error?: string;
};

export function encodeHelpSse(event: HelpStreamEvent) {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export function parseHelpSseBlock(block: string): HelpStreamEvent | null {
  const line = block
    .split("\n")
    .map((row) => row.trim())
    .find((row) => row.startsWith("data:"));
  if (!line) return null;
  const data = line.replace(/^data:\s*/, "");
  if (!data || data === "[DONE]") return null;
  try {
    return JSON.parse(data) as HelpStreamEvent;
  } catch {
    return null;
  }
}

export function parseHelpModelStreamChunk(chunk: string) {
  let out = "";
  for (const line of chunk.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("data:")) continue;
    const data = trimmed.slice(5).trim();
    if (!data || data === "[DONE]") continue;
    try {
      const json = JSON.parse(data) as { choices?: { delta?: { content?: string } }[] };
      out += json.choices?.[0]?.delta?.content ?? "";
    } catch {
      /* ignore a partial JSON frame */
    }
  }
  return out;
}

async function* streamCompleteHelpChat(messages: ChatMessage[]) {
  const config = huggingFaceHelpConfig();
  if (!config) return;
  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      temperature: 0.2,
      max_tokens: 800,
      stream: true,
      messages,
    }),
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok || !response.body) return;
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const frames = buffer.split("\n\n");
    buffer = frames.pop() ?? "";
    for (const frame of frames) {
      const piece = parseHelpModelStreamChunk(frame);
      if (piece) yield piece;
    }
  }
  const tail = parseHelpModelStreamChunk(buffer);
  if (tail) yield tail;
}

export async function* streamHelpAnswer(
  question: string,
  role: Role,
  history: HelpChatMessage[] = [],
  pathname = "",
): AsyncGenerator<HelpStreamEvent> {
  const asked = normalizeQuestion(question);
  const handbook = answerFromHandbook(asked, role, pathname, history);
  if (handbook.refused || !huggingFaceHelpConfig()) {
    for (const piece of chunkHelpReply(handbook.text)) {
      yield { delta: piece };
    }
    yield {
      text: handbook.text,
      hrefs: handbook.hrefs,
      prompts: handbook.prompts,
      refused: handbook.refused,
      done: true,
    };
    return;
  }
  const search = resolveHelpQuestion(asked, history, role, pathname);
  const articles = retrieveArticles(search, role, 4, pathname);
  const prior = history.slice(-HELP_CHAT_MAX_HISTORY).map((message) => ({
    role: message.role,
    content: normalizeQuestion(message.content),
  }));
  try {
    let raw = "";
    for await (const piece of streamCompleteHelpChat([
      { role: "system", content: helpSystemPrompt(role, articles, handbook.text) },
      ...prior,
      { role: "user", content: asked },
    ])) {
      raw += piece;
      yield { delta: piece };
    }
    const text = sanitizeHelpReply(raw);
    if (!text) {
      yield {
        text: handbook.text,
        hrefs: handbook.hrefs,
        prompts: handbook.prompts,
        refused: false,
        done: true,
      };
      return;
    }
    yield { text, hrefs: handbook.hrefs, prompts: handbook.prompts, refused: false, done: true };
  } catch {
    yield {
      text: handbook.text,
      hrefs: handbook.hrefs,
      prompts: handbook.prompts,
      refused: false,
      done: true,
    };
  }
}

export async function answerHelpQuestion(
  question: string,
  role: Role,
  history: HelpChatMessage[] = [],
  pathname = "",
): Promise<HelpChatResult> {
  const asked = normalizeQuestion(question);
  const handbook = answerFromHandbook(asked, role, pathname, history);
  if (handbook.refused) return handbook;
  if (!huggingFaceHelpConfig()) return handbook;
  const search = resolveHelpQuestion(asked, history, role, pathname);
  const articles = retrieveArticles(search, role, 4, pathname);
  const prior = history.slice(-HELP_CHAT_MAX_HISTORY).map((message) => ({
    role: message.role,
    content: normalizeQuestion(message.content),
  }));
  try {
    const text = await completeHelpChat([
      { role: "system", content: helpSystemPrompt(role, articles, handbook.text) },
      ...prior,
      { role: "user", content: asked },
    ]);
    if (!text) return handbook;
    return { text, hrefs: handbook.hrefs, prompts: handbook.prompts, refused: false, source: "model" };
  } catch {
    return handbook;
  }
}
