export function isDemoMode(env: NodeJS.Dict<string> = process.env) {
  return env.NEXT_PUBLIC_DEMO_MODE !== "false";
}

export function requiresObjectStorage(env: NodeJS.Dict<string> = process.env) {
  return !isDemoMode(env);
}

export function idleTimeoutMs(env: NodeJS.Dict<string> = process.env) {
  const raw = env.NEXT_PUBLIC_IDLE_MINUTES?.trim();
  if (raw === "0") return 0;
  const minutes = raw ? Number(raw) : 20;
  if (!Number.isFinite(minutes) || minutes <= 0) return 20 * 60_000;
  return minutes * 60_000;
}

export function appOrigin(env: NodeJS.Dict<string> = process.env) {
  return env.AUTH_URL?.trim() || "http://127.0.0.1:43147";
}
