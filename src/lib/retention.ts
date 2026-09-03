export function retentionCutoff(now: Date, retentionDays: number) {
  return new Date(now.getTime() - retentionDays * 86_400_000);
}

export function isPastRetention(archivedAt: Date | string, cutoff: Date) {
  const at = typeof archivedAt === "string" ? new Date(archivedAt) : archivedAt;
  return at.getTime() < cutoff.getTime();
}
