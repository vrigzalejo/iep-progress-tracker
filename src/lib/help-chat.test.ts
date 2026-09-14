import { describe, expect, it } from "vitest";
import {
  answerFromHandbook,
  huggingFaceHelpConfig,
  parseHelpChatRequest,
  refuseHelpQuestion,
  retrieveArticles,
  sanitizeHelpReply,
  scoreArticle,
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
    expect(result.text).not.toMatch(/Ask about any staff screen/);
  });

  it("answers with in-app links", () => {
    const result = answerFromHandbook("where do I print a progress report", "EDUCATOR");
    expect(result.refused).toBe(false);
    expect(result.hrefs).toContain("/reports");
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
    }
  });
});
