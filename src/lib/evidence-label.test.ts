import { describe, expect, it } from "vitest";
import { formatEvidenceFileSize, suggestEvidenceLabel } from "./evidence-label";

describe("evidence label", () => {
  it("turns a filename into a short caption", () => {
    expect(suggestEvidenceLabel("weekly_probe_4.jpg")).toBe("weekly probe 4");
    expect(suggestEvidenceLabel("C:\\scans\\Work-sample.pdf")).toBe("Work sample");
    expect(suggestEvidenceLabel("  fluency-probe-8-21.png  ")).toBe("fluency probe 8 21");
  });

  it("keeps captions inside 200 characters", () => {
    expect(suggestEvidenceLabel(`${"a".repeat(250)}.png`)).toHaveLength(200);
  });

  it("formats file sizes for the preview", () => {
    expect(formatEvidenceFileSize(900)).toBe("900 B");
    expect(formatEvidenceFileSize(12_288)).toBe("12 KB");
    expect(formatEvidenceFileSize(1_572_864)).toBe("1.5 MB");
  });
});
