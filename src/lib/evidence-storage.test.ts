import { describe, expect, it } from "vitest";
import {
  blobPathname,
  evidenceBackend,
  evidenceSizeLimitBytes,
  isBlobEvidencePath,
  isSupabaseEvidencePath,
  supabaseObjectPath,
  toBlobEvidencePath,
  toSupabaseEvidencePath,
  usesObjectStorage,
} from "./evidence-storage";

const supabaseEnv = {
  SUPABASE_URL: "https://abcd.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "service-role",
};

describe("evidence storage", () => {
  it("uses disk locally unless object storage is configured", () => {
    expect(evidenceBackend({})).toBe("disk");
    expect(usesObjectStorage({})).toBe(false);
  });

  it("prefers Supabase Storage when the service role is set", () => {
    expect(evidenceBackend({ ...supabaseEnv, VERCEL: "1" })).toBe("supabase");
    expect(usesObjectStorage(supabaseEnv)).toBe(true);
  });

  it("uses Vercel Blob when no Supabase Storage is configured", () => {
    expect(evidenceBackend({ VERCEL: "1" })).toBe("blob");
    expect(
      evidenceBackend({ BLOB_READ_WRITE_TOKEN: "vercel_blob_rw_x" }),
    ).toBe("blob");
  });

  it("caps uploads at 4 MB on object storage", () => {
    expect(evidenceSizeLimitBytes({})).toBe(5 * 1024 * 1024);
    expect(evidenceSizeLimitBytes({ VERCEL: "1" })).toBe(4 * 1024 * 1024);
    expect(evidenceSizeLimitBytes(supabaseEnv)).toBe(4 * 1024 * 1024);
  });

  it("round-trips blob and Supabase pathnames", () => {
    const blob = toBlobEvidencePath("evidence/goal-1.pdf");
    expect(isBlobEvidencePath(blob)).toBe(true);
    expect(blobPathname(blob)).toBe("evidence/goal-1.pdf");
    expect(isBlobEvidencePath("goal-1.pdf")).toBe(false);

    const stored = toSupabaseEvidencePath("evidence/goal-1.pdf");
    expect(isSupabaseEvidencePath(stored)).toBe(true);
    expect(supabaseObjectPath(stored)).toBe("evidence/goal-1.pdf");
  });
});
