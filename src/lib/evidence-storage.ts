import { requiresObjectStorage } from "@/lib/runtime";

const BLOB_PREFIX = "blob:";
const SUPABASE_PREFIX = "supabase:";
const DEFAULT_SUPABASE_BUCKET = "iep-evidence";

export type EvidenceBackend = "supabase" | "blob" | "disk";

function firstNonEmpty(env: NodeJS.Dict<string>, keys: string[]) {
  for (const key of keys) {
    const value = env[key]?.trim();
    if (value) return value;
  }
  return undefined;
}

export function supabaseUrl(env: NodeJS.Dict<string> = process.env) {
  return firstNonEmpty(env, ["SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL"]);
}

export function supabaseConfigured(env: NodeJS.Dict<string> = process.env) {
  return Boolean(supabaseUrl(env) && env.SUPABASE_SERVICE_ROLE_KEY?.trim());
}

export function evidenceBackend(
  env: NodeJS.Dict<string> = process.env,
): EvidenceBackend {
  if (supabaseConfigured(env)) return "supabase";
  if (env.BLOB_READ_WRITE_TOKEN?.trim() || env.VERCEL === "1") return "blob";
  return "disk";
}

export function usesObjectStorage(
  env: NodeJS.Dict<string> = process.env,
) {
  return evidenceBackend(env) !== "disk";
}

export function isBlobEvidencePath(evidencePath: string) {
  return evidencePath.startsWith(BLOB_PREFIX);
}

export function isSupabaseEvidencePath(evidencePath: string) {
  return evidencePath.startsWith(SUPABASE_PREFIX);
}

export function blobPathname(evidencePath: string) {
  return evidencePath.slice(BLOB_PREFIX.length);
}

export function supabaseObjectPath(evidencePath: string) {
  return evidencePath.slice(SUPABASE_PREFIX.length);
}

export function toBlobEvidencePath(pathname: string) {
  return `${BLOB_PREFIX}${pathname}`;
}

export function toSupabaseEvidencePath(pathname: string) {
  return `${SUPABASE_PREFIX}${pathname}`;
}

function evidenceBucket(env: NodeJS.Dict<string> = process.env) {
  return env.SUPABASE_EVIDENCE_BUCKET?.trim() || DEFAULT_SUPABASE_BUCKET;
}

async function supabaseAdmin(env: NodeJS.Dict<string> = process.env) {
  const url = supabaseUrl(env);
  const key = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    throw new Error("Supabase Storage is not configured.");
  }
  const { createClient } = await import("@supabase/supabase-js");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function ensurePrivateBucket(
  client: Awaited<ReturnType<typeof supabaseAdmin>>,
  bucket: string,
) {
  const existing = await client.storage.getBucket(bucket);
  if (existing.data) return;
  const created = await client.storage.createBucket(bucket, {
    public: false,
    fileSizeLimit: 4 * 1024 * 1024,
  });
  if (created.error && !/already exists/i.test(created.error.message)) {
    throw created.error;
  }
}

async function storeSupabaseFile(safeName: string, file: File) {
  const client = await supabaseAdmin();
  const bucket = evidenceBucket();
  await ensurePrivateBucket(client, bucket);
  const pathname = `evidence/${safeName}`;
  const uploaded = await client.storage.from(bucket).upload(pathname, file, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });
  if (uploaded.error) throw uploaded.error;
  return toSupabaseEvidencePath(pathname);
}

async function storeBlobFile(safeName: string, file: File) {
  const { put } = await import("@vercel/blob");
  const pathname = `evidence/${safeName}`;
  await put(pathname, file, {
    access: "private",
    addRandomSuffix: false,
    contentType: file.type || "application/octet-stream",
  });
  return toBlobEvidencePath(pathname);
}

export async function storeEvidenceFile(safeName: string, file: File) {
  const backend = evidenceBackend();
  if (backend === "disk" && requiresObjectStorage()) {
    throw new Error(
      "Object storage is required when demonstration mode is off. Configure Supabase Storage or a private Blob store.",
    );
  }
  if (backend === "supabase") return storeSupabaseFile(safeName, file);
  if (backend === "blob") return storeBlobFile(safeName, file);

  const { mkdir, writeFile } = await import("node:fs/promises");
  const path = await import("node:path");
  const dir = path.join(process.cwd(), "data", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, safeName), Buffer.from(await file.arrayBuffer()));
  return safeName;
}

export async function readEvidenceFile(evidencePath: string) {
  if (isSupabaseEvidencePath(evidencePath)) {
    const client = await supabaseAdmin();
    const downloaded = await client.storage
      .from(evidenceBucket())
      .download(supabaseObjectPath(evidencePath));
    if (downloaded.error || !downloaded.data) return null;
    return new Uint8Array(await downloaded.data.arrayBuffer());
  }

  if (isBlobEvidencePath(evidencePath)) {
    const { get } = await import("@vercel/blob");
    const result = await get(blobPathname(evidencePath), { access: "private" });
    if (result?.statusCode !== 200 || !result.stream) return null;
    return result.stream;
  }

  const { readFile } = await import("node:fs/promises");
  const path = await import("node:path");
  const filePath = path.join(process.cwd(), "data", "uploads", evidencePath);
  return readFile(filePath).catch(() => null);
}

export async function deleteEvidenceFile(evidencePath: string) {
  try {
    if (isSupabaseEvidencePath(evidencePath)) {
      const client = await supabaseAdmin();
      const removed = await client.storage
        .from(evidenceBucket())
        .remove([supabaseObjectPath(evidencePath)]);
      return !removed.error;
    }
    if (isBlobEvidencePath(evidencePath)) {
      const { del } = await import("@vercel/blob");
      await del(blobPathname(evidencePath));
      return true;
    }
    const { unlink } = await import("node:fs/promises");
    const path = await import("node:path");
    await unlink(path.join(process.cwd(), "data", "uploads", evidencePath));
    return true;
  } catch {
    return false;
  }
}

export function evidenceSizeLimitBytes(
  env: NodeJS.Dict<string> = process.env,
) {
  return usesObjectStorage(env) ? 4 * 1024 * 1024 : 5 * 1024 * 1024;
}
