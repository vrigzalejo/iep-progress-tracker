import { describe, expect, it } from "vitest";
import { zipUtf8Files } from "./zip";

describe("zipUtf8Files", () => {
  it("writes a zip local-file signature", () => {
    const zip = zipUtf8Files([
      { name: "readme.txt", content: "hello" },
      { name: "profile.json", content: "{\"ok\":true}\n" },
    ]);
    expect(zip.subarray(0, 2).toString()).toBe("PK");
    expect(zip.length).toBeGreaterThan(40);
  });
});
