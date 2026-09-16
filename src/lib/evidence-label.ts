export const EVIDENCE_MAX_BYTES = 5 * 1024 * 1024;

export function suggestEvidenceLabel(filename: string) {
  const base = filename.trim().replace(/^.*[/\\]/, "").replace(/\.[^.]+$/, "");
  return base.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 200);
}

export function formatEvidenceFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
