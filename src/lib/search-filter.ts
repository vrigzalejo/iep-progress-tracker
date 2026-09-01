/** Postgres `contains` is case-sensitive; Prisma `mode: insensitive` maps to ILIKE. */
export function ilike(query: string) {
  return { contains: query.trim(), mode: "insensitive" as const };
}
