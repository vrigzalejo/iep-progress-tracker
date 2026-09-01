import { APP_NAME } from "@/lib/brand";
import { ROLE_LABELS, type Role } from "@/lib/constants";
import { helpArticles, type HelpArticle } from "@/lib/help-handbook";

export const HELP_CHAT_MAX_QUESTION = 600;
export const HELP_CHAT_MAX_HISTORY = 8;
export const HELP_CHAT_MAX_HISTORY_CONTENT = 1500;

export function clipHelpHistory(history: HelpChatMessage[]): HelpChatMessage[] {
  return history.slice(-HELP_CHAT_MAX_HISTORY).map((message) => ({
    role: message.role,
    content: message.content.slice(0, HELP_CHAT_MAX_HISTORY_CONTENT),
  }));
}

export function parseHelpChatRequest(json: unknown):
  | { ok: true; question: string; history: HelpChatMessage[] }
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
  return { ok: true, question, history: clipHelpHistory(history) };
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

export function scoreArticle(article: HelpArticle, queryTokens: string[], role: Role) {
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
  return score;
}

export function retrieveArticles(question: string, role: Role, limit = 3) {
  const queryTokens = tokens(question);
  if (queryTokens.length === 0) {
    return helpArticles()
      .filter((article) => !article.roles || article.roles.includes(role))
      .slice(0, 1);
  }
  return helpArticles()
    .map((article) => ({ article, score: scoreArticle(article, queryTokens, role) }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((row) => row.article);
}

function uniqueHrefs(articles: HelpArticle[]) {
  return [...new Set(articles.flatMap((article) => article.hrefs))];
}

export function answerFromHandbook(question: string, role: Role): HelpChatResult {
  const refused = refuseHelpQuestion(question);
  if (refused) {
    return { text: refused, hrefs: ["/guide"], refused: true, source: "handbook" };
  }
  const articles = retrieveArticles(question, role);
  if (articles.length === 0) {
    const overview = helpArticles()[0];
    return {
      text: `I can explain how to use ${APP_NAME} for your role (${ROLE_LABELS[role]}). Try asking about logging a session, writing a report, search, or who can see records. The setup guide walks through the full path.`,
      hrefs: overview.hrefs,
      refused: false,
      source: "handbook",
    };
  }
  const shown = articles[0];
  const hrefs = uniqueHrefs([shown]);
  const links = hrefs.map((href) => `[${href.replace(/^\//, "")}](${href})`).join(" · ");
  return {
    text: `${shown.body} Open ${links}.`,
    hrefs,
    refused: false,
    source: "handbook",
  };
}

export function helpSystemPrompt(role: Role, articles: HelpArticle[]) {
  const handbook = articles
    .map((article) => `### ${article.title}\n${article.body}\nScreens: ${article.hrefs.join(", ")}`)
    .join("\n\n");
  return [
    `You are the in-app how-to assistant for ${APP_NAME}.`,
    `The signed-in person is a ${ROLE_LABELS[role]}. Answer only how to use this website.`,
    "Use only the handbook excerpts below. If they are not enough, say so and point to /guide.",
    "Never generate IEP goals, present levels, services, minutes, placements, or progress narratives.",
    "Never make educational, legal, or clinical decisions. Never ask for student names or record details.",
    "If the person describes a specific student, refuse to interpret the record and tell them to open Students, Search, or Family home.",
    "Keep answers short. Use markdown links only to in-app paths that start with /.",
    "",
    handbook || "No handbook excerpts matched. Direct the person to /guide.",
  ].join("\n");
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
      max_tokens: 450,
      messages,
    }),
  });
  if (!response.ok) return null;
  const payload = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = payload.choices?.[0]?.message?.content?.trim();
  return text ? sanitizeHelpReply(text) : null;
}

export async function answerHelpQuestion(
  question: string,
  role: Role,
  history: HelpChatMessage[] = [],
): Promise<HelpChatResult> {
  const asked = normalizeQuestion(question);
  const handbook = answerFromHandbook(asked, role);
  if (handbook.refused) return handbook;
  if (!huggingFaceHelpConfig()) return handbook;
  const articles = retrieveArticles(asked, role);
  const prior = history.slice(-HELP_CHAT_MAX_HISTORY).map((message) => ({
    role: message.role,
    content: normalizeQuestion(message.content),
  }));
  try {
    const text = await completeHelpChat([
      { role: "system", content: helpSystemPrompt(role, articles) },
      ...prior,
      { role: "user", content: asked },
    ]);
    if (!text) return handbook;
    return { text, hrefs: handbook.hrefs, refused: false, source: "model" };
  } catch {
    return handbook;
  }
}
