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

  it("answers with in-app links", () => {
    const result = answerFromHandbook("where do I print a progress report", "EDUCATOR");
    expect(result.refused).toBe(false);
    expect(result.hrefs).toContain("/reports");
    expect(result.text.toLowerCase()).toMatch(/report/);
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
