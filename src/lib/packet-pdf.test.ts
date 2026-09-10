import { describe, expect, it } from "vitest";
import { buildPacketLines, encodeSimplePdf, packetFromStudent } from "./packet-pdf";

describe("packet pdf", () => {
  it("builds a data packet without recommendations", () => {
    const lines = buildPacketLines({
      title: "IEP meeting packet",
      studentName: "Jaime Santos",
      subtitle: "Grade 4 · Sample School",
      sections: [{ heading: "Ask for a break", body: ["Latest present session: 80 % independent."] }],
    });
    expect(lines.join("\n")).toMatch(/Jaime Santos/);
    expect(lines.join("\n")).toMatch(/does not recommend/);
  });

  it("builds a report from student session data only", () => {
    const lines = packetFromStudent({
      kind: "REPORT",
      studentName: "Jaime Santos",
      grade: "4",
      school: "Sample School",
      periodLabel: "Fall",
      goals: [
        {
          plainLanguageSummary: "Ask for a break",
          officialWording: "Given a visual, Jaime will request a break.",
          unit: "% independent",
          entries: [{ sessionOutcome: "PRESENT", score: 80, recordedAt: "2026-09-03", notes: "" }],
          periodStatements: [{ narrative: "Staff wrote this.", progressCode: "SUFFICIENT" }],
        },
      ],
    });
    expect(lines.join("\n")).toMatch(/Progress report/);
    expect(lines.join("\n")).toMatch(/Staff progress code: SUFFICIENT/);
    expect(lines.join("\n")).not.toMatch(/should receive/i);
  });

  it("encodes a PDF that starts with the PDF header", () => {
    const pdf = encodeSimplePdf(["IEP meeting packet", "Jaime Santos"]);
    expect(pdf.subarray(0, 5).toString("utf8")).toBe("%PDF-");
    expect(pdf.toString("utf8")).toMatch(/Jaime Santos/);
  });
});
