export function normalizeSchoolName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function normalizeSchoolCode(value?: string | null) {
  const trimmed = value?.trim().replace(/\s+/g, " ") ?? "";
  return trimmed ? trimmed.slice(0, 20) : null;
}
