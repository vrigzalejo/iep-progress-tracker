import { describe, expect, it } from "vitest";
import {
  answerFromHandbook,
  articleForPath,
  chunkHelpReply,
  encodeHelpSse,
  helpArrivedHint,
  helpHrefAllowed,
  helpWelcome,
  huggingFaceHelpConfig,
  isHelpFollowUp,
  isHelpThanks,
  isFamilySpanishHelp,
  parseHelpChatRequest,
  parseHelpModelStreamChunk,
  parseHelpSseBlock,
  promptFromHelpCloser,
  refuseHelpQuestion,
  retrieveArticles,
  resolveHelpQuestion,
  sanitizeHelpReply,
  scoreArticle,
  shortenHelpPrompt,
  streamHelpAnswer,
  suggestedHelpPrompts,
  normalizeHelpPathname,
} from "./help-chat";
import { helpArticles } from "./help-handbook";

describe("help chat", () => {
  it("refuses IEP generation and service recommendations", () => {
    expect(refuseHelpQuestion("Write an IEP goal for reading fluency")).toMatch(/does not generate/i);
    expect(refuseHelpQuestion("recommend more OT minutes")).toMatch(/does not generate/i);
  });

  it("finds session logging without matching case", () => {
    const hits = retrieveArticles("how do I LOG a session", "EDUCATOR");
    expect(hits[0]?.id).toBe("sessions");
  });

  it("keeps family portal articles for parents", () => {
    const hits = retrieveArticles("switch children in the family portal", "PARENT");
    expect(hits[0]?.id).toBe("family");
  });

  it("does not score staff-only articles for parents", () => {
    const sessions = helpArticles().find((article) => article.id === "sessions");
    expect(sessions).toBeDefined();
    expect(scoreArticle(sessions!, ["session"], "PARENT")).toBe(0);
  });

  it("maps feature-wide questions to the catalog", () => {
    expect(retrieveArticles("what can this app do", "EDUCATOR")[0]?.id).toBe("catalog");
    expect(retrieveArticles("what can this app do", "PARENT")[0]?.id).toBe("catalog-family");
  });

  it("explains CSV export and meeting packets", () => {
    expect(retrieveArticles("download csv export", "EDUCATOR")[0]?.id).toBe("export");
    expect(retrieveArticles("print the IEP meeting packet", "EDUCATOR")[0]?.id).toBe("meeting");
    expect(retrieveArticles("open meeting room on the projector", "EDUCATOR")[0]?.id).toBe("meeting");
  });

  it("explains installing the home-screen app", () => {
    expect(retrieveArticles("add to home screen on iphone", "EDUCATOR")[0]?.id).toBe("install-app");
    expect(retrieveArticles("install the mobile app", "PARENT")[0]?.id).toBe("install-app");
  });

  it("explains adding a campus", () => {
    expect(retrieveArticles("add a school campus", "ADMINISTRATOR")[0]?.id).toBe("schools");
  });

  it("maps the site tutorial to the setup guide", () => {
    expect(retrieveArticles("first time walkthrough tutorial", "EDUCATOR")[0]?.id).toBe("guide");
    const result = answerFromHandbook("what are the setup guide steps", "ADMINISTRATOR");
    expect(result.text).toMatch(/Schools/);
    expect(result.text).toMatch(/Hallway/);
    expect(result.text).toMatch(/Meeting room/);
    expect(result.text).toMatch(/Resend/);
  });

  it("explains the family weekly email", () => {
    expect(retrieveArticles("opt in to the weekly email digest", "PARENT")[0]?.id).toBe("digest");
    expect(retrieveArticles("How does the Friday family email work?", "EDUCATOR")[0]?.id).toBe(
      "digest",
    );
  });

  it("explains team invite email", () => {
    expect(retrieveArticles("How do I invite someone by email?", "ADMINISTRATOR")[0]?.id).toBe(
      "team",
    );
  });

  it("maps forgot password to sign-in", () => {
    expect(retrieveArticles("How do I reset a forgotten password?", "EDUCATOR")[0]?.id).toBe(
      "signin",
    );
    expect(retrieveArticles("forgot password", "PARENT")[0]?.id).toBe("signin");
    const result = answerFromHandbook("forgot password", "EDUCATOR");
    expect(result.hrefs).toContain("/forgot-password");
    expect(result.text).toMatch(/set-password/i);
  });

  it("maps Spanish family chrome to the family portal", () => {
    expect(retrieveArticles("How do I switch the site to Spanish?", "PARENT")[0]?.id).toBe("family");
    expect(retrieveArticles("cambiar a español", "PARENT")[0]?.id).toBe("family");
    expect(retrieveArticles("spanish plain-language summary", "EDUCATOR")[0]?.id).toBe("goals");
  });

  it("maps evidence gallery and search filters", () => {
    expect(retrieveArticles("How do I open the evidence gallery?", "EDUCATOR")[0]?.id).toBe(
      "evidence",
    );
    expect(retrieveArticles("How do I filter search by service area?", "EDUCATOR")[0]?.id).toBe(
      "search",
    );
    expect(retrieveArticles("How do I open home practice cards?", "PARENT")[0]?.id).toBe("family");
    expect(retrieveArticles("How do I open home practice cards?", "EDUCATOR")[0]?.id).toBe(
      "students",
    );
  });

  it("describes adding a student profile in detail", () => {
    const result = answerFromHandbook("how to create student", "EDUCATOR");
    expect(result.text.toLowerCase()).toMatch(/preferred name/);
    expect(result.hrefs).toContain("/students/new");
    expect(result.text).toMatch(/^1\. /m);
    expect(result.prompts.length).toBeGreaterThan(0);
    expect(result.text).not.toMatch(/Ask about any staff screen/);
  });

  it("answers with in-app links", () => {
    const result = answerFromHandbook("where do I print a progress report", "EDUCATOR");
    expect(result.refused).toBe(false);
    expect(result.hrefs.some((href) => href.startsWith("/reports"))).toBe(true);
    expect(result.text.toLowerCase()).toMatch(/report/);
  });

  it("explains dashboard minutes, objectives, and sign out", () => {
    expect(retrieveArticles("minutes gap on the dashboard", "EDUCATOR")[0]?.id).toBe("minutes");
    expect(retrieveArticles("add a short-term objective", "EDUCATOR")[0]?.id).toBe("objectives");
    expect(retrieveArticles("where is sign out", "EDUCATOR")[0]?.id).toBe("navigation");
  });

  it("points refused questions at the setup guide", () => {
    const result = answerFromHandbook("generate an IEP goal for math", "EDUCATOR");
    expect(result.refused).toBe(true);
    expect(result.hrefs).toContain("/guide");
  });

  it("strips external URLs from model replies", () => {
    expect(sanitizeHelpReply("See [docs](https://evil.example) and /reports")).toBe(
      "See docs and /reports",
    );
  });

  it("uses a Hugging Face token and cheapest-router default", () => {
    expect(huggingFaceHelpConfig({})).toBeNull();
    expect(
      huggingFaceHelpConfig({
        HF_TOKEN: "hf_test",
      }),
    ).toEqual({
      apiKey: "hf_test",
      baseUrl: "https://router.huggingface.co/v1",
      model: "Qwen/Qwen2.5-3B-Instruct:cheapest",
    });
    expect(huggingFaceHelpConfig({ HUGGINGFACE_HUB_TOKEN: "hf_alt" })?.apiKey).toBe("hf_alt");
  });

  it("accepts follow-up questions after a long handbook reply", () => {
    const parsed = parseHelpChatRequest({
      question: "how to create student",
      history: [
        { role: "user", content: "test" },
        { role: "assistant", content: "x".repeat(4000) },
      ],
    });
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.question).toBe("how to create student");
      expect(parsed.history[1]?.content.length).toBe(1500);
      expect(parsed.pathname).toBe("");
    }
  });

  it("maps the current path to a handbook article and chips", () => {
    expect(articleForPath("/today", "EDUCATOR")?.id).toBe("today");
    expect(articleForPath("/students/abc", "EDUCATOR")?.id).toBe("students");
    expect(articleForPath("/parent", "PARENT")?.id).toBe("family");
    expect(suggestedHelpPrompts("EDUCATOR", "/hallway")[0]).toMatch(/session|Hallway/i);
    expect(suggestedHelpPrompts("EDUCATOR", "/hallway", ["How do I log a session with trials?"])[0]).toMatch(
      /attach|Hallway pick/i,
    );
    expect(helpWelcome("EDUCATOR", "/today")).toMatch(/Today/i);
    expect(helpWelcome("EDUCATOR", "/today")).toMatch(/What do you want to do/i);
    expect(helpArrivedHint("/hallway")).toMatch(/Hallway/i);
    expect(shortenHelpPrompt("How do I log a session with trials?")).toBe("Log a session");
    expect(shortenHelpPrompt("What can this app do?")).toBe("See what the app can do");
    expect(chunkHelpReply("**Hi**\n\n1. First step.\n2. Second step.").length).toBeGreaterThan(1);
    expect(retrieveArticles("what is this page", "EDUCATOR", 3, "/today")[0]?.id).toBe("today");
    expect(retrieveArticles("how do I LOG a session", "EDUCATOR", 3, "/search")[0]?.id).toBe("sessions");
    expect(normalizeHelpPathname("/students/clxxxxxxxxxxxxxxxxxxxxx1/goals?x=1")).toBe(
      "/students/id/goals",
    );
    expect(normalizeHelpPathname("https://example.com/today")).toBe("");
  });

  it("keeps prompts, steps, and Go-to links on screens each role can open", () => {
    expect(suggestedHelpPrompts("PARENT", "/parent").join(" ")).not.toMatch(/Hallway|session with trials|Add a student/i);
    expect(helpHrefAllowed("/students/abc/carryover", "PARENT")).toBe(true);
    expect(helpHrefAllowed("/students/abc", "PARENT")).toBe(false);
    expect(helpHrefAllowed("/reports", "PARENT")).toBe(false);
    expect(helpHrefAllowed("/reports/abc", "PARENT")).toBe(true);
    expect(helpHrefAllowed("/reports/studio", "PARENT")).toBe(false);
    expect(suggestedHelpPrompts("PROVIDER", "/students").join(" ")).not.toMatch(/Add a student|IEP goal/i);
    expect(suggestedHelpPrompts("PROVIDER", "/today")[0]).toMatch(/session|Hallway/i);
    expect(suggestedHelpPrompts("ADMINISTRATOR", "/team")[0]).toMatch(/invite/i);

    const parentSession = answerFromHandbook("how do I LOG a session", "PARENT", "/parent");
    expect(parentSession.hrefs).toEqual(["/parent"]);
    expect(parentSession.text).toMatch(/Family home/i);
    expect(parentSession.text).not.toMatch(/Log in hallway/);

    const parentReport = answerFromHandbook("where do I print a progress report", "PARENT", "/parent");
    expect(parentReport.hrefs).toEqual(["/parent"]);
    expect(parentReport.text).toMatch(/Open progress report/);
    expect(parentReport.hrefs).not.toContain("/reports/studio");

    const parentSpanish = answerFromHandbook("How do I switch the site to Spanish?", "PARENT", "/parent");
    expect(parentSpanish.text).toMatch(/Español/);
    expect(parentSpanish.text).not.toMatch(/Hallway|Add student/i);
    expect(answerFromHandbook("Want how to switch to Spanish?", "PARENT", "/parent").text).toMatch(/Español/);
    expect(promptFromHelpCloser("Want how to switch to Spanish?")).toBe("How do I switch the site to Spanish?");
    expect(resolveHelpQuestion("yes", [{ role: "user", content: "How do I message the team?" }], "PARENT", "/parent")).toMatch(
      /spanish/i,
    );
    expect(isFamilySpanishHelp("Want how to switch to Spanish?")).toBe(true);

    const parentCards = answerFromHandbook("How do I open home practice cards?", "PARENT", "/parent");
    expect(parentCards.text).toMatch(/Home practice cards/);
    expect(parentCards.text).not.toMatch(/Add student|Hallway|Students/);
    expect(parentCards.hrefs).not.toContain("/students");

    const parentMessage = answerFromHandbook("How do I message the team?", "PARENT", "/parent");
    expect(retrieveArticles("How do I message the team?", "PARENT", 3, "/parent")[0]?.id).toBe("messages");
    expect(parentMessage.text).toMatch(/Write to the team|Messages with the team/i);
    expect(parentMessage.text).not.toMatch(/Hallway|Add student|invite/i);
    expect(parentMessage.text).not.toMatch(/staff-only note \(parents see it\)/i);
    expect(parentMessage.hrefs).toEqual(["/messages"]);

    const providerAdd = answerFromHandbook("how to create student", "PROVIDER");
    expect(providerAdd.hrefs).toEqual(["/students"]);
    expect(providerAdd.text).toMatch(/cannot add/i);
    expect(providerAdd.prompts.join(" ")).not.toMatch(/IEP goal|Add a student/i);

    const providerGoal = answerFromHandbook("How do I record an IEP goal?", "PROVIDER");
    expect(providerGoal.text).toMatch(/don’t type IEP|cannot add|view goals/i);
    expect(providerGoal.hrefs).not.toContain("/students/new");

    const educatorAdd = answerFromHandbook("how to create student", "EDUCATOR");
    expect(educatorAdd.hrefs).toContain("/students/new");
  });

  it("answers session logging with tap steps, not handbook prose", () => {
    const result = answerFromHandbook("how do I LOG a session", "EDUCATOR");
    expect(result.text).toMatch(/Log in hallway/);
    expect(result.text).toMatch(/^1\. /m);
    expect(result.text).not.toMatch(/On a profile, Hallway is that same pad/);
    expect(result.hrefs).toHaveLength(1);
  });

  it("continues a follow-up like a chat instead of restarting the FAQ", () => {
    expect(isHelpFollowUp("then what?")).toBe(true);
    expect(isHelpThanks("thanks")).toBe(true);
    const next = resolveHelpQuestion("then what?", [{ role: "user", content: "How do I log a session with trials?" }], "EDUCATOR", "/today");
    expect(next).toMatch(/Hallway pick/i);
    const continued = answerFromHandbook("then what?", "EDUCATOR", "/today", [
      { role: "user", content: "How do I log a session with trials?" },
      { role: "assistant", content: "Tap Save." },
    ]);
    expect(continued.text.toLowerCase()).toMatch(/next person|next student|does not stay/);
    expect(answerFromHandbook("thanks", "EDUCATOR").text).toMatch(/Anytime/);
  });

  it("covers each signed-in role on the screens they can open", () => {
    expect(articleForPath("/goals/goal-1", "EDUCATOR")?.id).toBe("goals");
    expect(articleForPath("/goals/goal-1/progress/new", "EDUCATOR")?.id).toBe("sessions");
    expect(articleForPath("/goals/goal-1", "PROVIDER")?.id).toBe("sessions");
    expect(articleForPath("/dashboard", "EDUCATOR")?.id).toBe("dashboard");
    expect(articleForPath("/minutes", "PROVIDER")?.id).toBe("minutes");
    expect(articleForPath("/reports/stu-1/meeting", "ADMINISTRATOR")?.id).toBe("meeting");
    expect(articleForPath("/students/stu-1/carryover", "PARENT")?.id).toBe("family");
    expect(articleForPath("/students/stu-1/carryover", "EDUCATOR")?.id).toBe("students");
    expect(articleForPath("/setup", "PARENT")?.id).toBe("setup");

    expect(helpWelcome("EDUCATOR", "/goals/goal-1")).toMatch(/Goal/i);
    expect(helpWelcome("EDUCATOR", "/minutes")).toMatch(/Minutes/i);
    expect(helpArrivedHint("/goals/goal-1/progress/new")).toMatch(/Log a session/i);

    expect(suggestedHelpPrompts("EDUCATOR", "/dashboard")[0]).toMatch(/dashboard/i);
    expect(suggestedHelpPrompts("PROVIDER", "/minutes")[0]).toMatch(/minutes/i);
    expect(suggestedHelpPrompts("ADMINISTRATOR", "/schools")[0]).toMatch(/campus/i);
    expect(suggestedHelpPrompts("PARENT", "/students/stu-1/carryover")[0]).toMatch(/home practice/i);
    expect(suggestedHelpPrompts("PROVIDER", "/goals/goal-1").join(" ")).not.toMatch(/record an IEP goal/i);
    expect(suggestedHelpPrompts("PROVIDER", "/goals/goal-1")[0]).toMatch(/session/i);

    expect(retrieveArticles("How do I attach session evidence?", "EDUCATOR")[0]?.id).toBe("evidence");
    expect(retrieveArticles("What's on the dashboard?", "EDUCATOR", 3, "/dashboard")[0]?.id).toBe(
      "dashboard",
    );
    expect(retrieveArticles("what is this page", "EDUCATOR", 3, "/minutes")[0]?.id).toBe("minutes");
    expect(retrieveArticles("who can see student records", "PARENT")[0]?.id).toBe("roles");

    const attach = answerFromHandbook("How do I attach session evidence?", "EDUCATOR", "/hallway");
    expect(attach.text).toMatch(/Choose a photo or PDF/i);

    const parentRoles = answerFromHandbook("who can see what", "PARENT", "/parent");
    expect(parentRoles.text).toMatch(/parent or guardian/i);
    expect(parentRoles.text).not.toMatch(/Open \[Team\]/i);
    expect(parentRoles.prompts.join(" ")).not.toMatch(/Hallway|Add a student/i);

    expect(promptFromHelpCloser("Want how to attach evidence from that pad?")).toBe(
      "How do I attach session evidence?",
    );
    expect(promptFromHelpCloser("Want what happens after **Save**?")).toBe(
      "How does Hallway pick the next student?",
    );
    expect(promptFromHelpCloser("Want the minutes ledger next?")).toBe(
      "How do I check the minutes ledger?",
    );

    const minutes = answerFromHandbook("How do I check the minutes ledger?", "ADMINISTRATOR", "/minutes");
    expect(minutes.text).toMatch(/prescribed vs delivered/i);
  });

  it("streams a handbook answer over SSE when no model token is set", async () => {
    const events = [];
    for await (const event of streamHelpAnswer("how do I LOG a session", "EDUCATOR")) {
      events.push(event);
    }
    expect(events.length).toBeGreaterThan(1);
    expect(events.at(-1)?.done).toBe(true);
    expect(events.at(-1)?.text?.toLowerCase()).toMatch(/hallway/);
    const parsed = parseHelpSseBlock(encodeHelpSse({ delta: "Hi", done: false }));
    expect(parsed?.delta).toBe("Hi");
    expect(parseHelpModelStreamChunk('data: {"choices":[{"delta":{"content":"Hello"}}]}')).toBe(
      "Hello",
    );
  });
});
