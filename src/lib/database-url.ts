const DEFAULTS = {
  user: "iep",
  password: "iep",
  host: "127.0.0.1",
  port: "5432",
  database: "iep",
} as const;

/** Prisma/pgbouncer query params the `pg` driver does not understand. */
const PG_STRIP_PARAMS = ["pgbouncer", "connection_limit"] as const;

export type PostgresEnv = {
  user: string;
  password: string;
  host: string;
  port: string;
  database: string;
};

function firstNonEmpty(env: NodeJS.Dict<string>, keys: string[]) {
  for (const key of keys) {
    const value = env[key]?.trim();
    if (value) return value;
  }
  return undefined;
}

export function postgresEnv(
  env: NodeJS.Dict<string> = process.env,
): PostgresEnv {
  return {
    user: env.POSTGRES_USER?.trim() || DEFAULTS.user,
    password: env.POSTGRES_PASSWORD || DEFAULTS.password,
    host: env.POSTGRES_HOST?.trim() || DEFAULTS.host,
    port: env.POSTGRES_PORT?.trim() || DEFAULTS.port,
    database:
      env.POSTGRES_DB?.trim() ||
      env.POSTGRES_DATABASE?.trim() ||
      DEFAULTS.database,
  };
}

export function buildDatabaseUrl(parts: PostgresEnv) {
  const user = encodeURIComponent(parts.user);
  const password = encodeURIComponent(parts.password);
  const database = encodeURIComponent(parts.database);
  return `postgresql://${user}:${password}@${parts.host}:${parts.port}/${database}`;
}

function isSupabaseHost(host: string) {
  const hostname = host.toLowerCase();
  return (
    hostname === "supabase.com" ||
    hostname.endsWith(".supabase.com") ||
    hostname === "supabase.co" ||
    hostname.endsWith(".supabase.co")
  );
}

/** Supabase requires TLS; dashboard URLs sometimes omit sslmode. */
export function withSupabaseSsl(url: string) {
  try {
    const parsed = new URL(url);
    if (!isSupabaseHost(parsed.hostname)) return url;
    if (parsed.searchParams.has("sslmode")) return url;
    parsed.searchParams.set("sslmode", "require");
    return parsed.toString();
  } catch {
    return url;
  }
}

/**
 * Runtime URL: prefer a pooled connection on Vercel/Supabase/Neon.
 * DATABASE_URL, then POSTGRES_PRISMA_URL / POSTGRES_URL, then POSTGRES_* parts.
 */
export function databaseUrl(env: NodeJS.Dict<string> = process.env) {
  const explicit = firstNonEmpty(env, [
    "DATABASE_URL",
    "POSTGRES_PRISMA_URL",
    "POSTGRES_URL",
  ]);
  if (explicit) return withSupabaseSsl(explicit);
  return withSupabaseSsl(buildDatabaseUrl(postgresEnv(env)));
}

/**
 * Prisma CLI / migrations need a direct (non-pooled) connection.
 * Falls back to the runtime URL when no direct URL is set.
 */
export function migrateDatabaseUrl(env: NodeJS.Dict<string> = process.env) {
  const direct = firstNonEmpty(env, [
    "POSTGRES_URL_NON_POOLING",
    "DIRECT_URL",
    "DATABASE_URL_UNPOOLED",
  ]);
  if (direct) return withSupabaseSsl(direct);
  return databaseUrl(env);
}

/** Strip Prisma-only URI params so `pg.Pool` can connect. */
export function pgPoolConnectionString(url: string) {
  try {
    const parsed = new URL(url);
    for (const key of PG_STRIP_PARAMS) parsed.searchParams.delete(key);
    return parsed.toString();
  } catch {
    return url;
  }
}
