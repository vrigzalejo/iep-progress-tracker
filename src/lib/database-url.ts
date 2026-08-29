const DEFAULTS = {
  user: "iep",
  password: "iep",
  host: "127.0.0.1",
  port: "5432",
  database: "iep",
} as const;

export type PostgresEnv = {
  user: string;
  password: string;
  host: string;
  port: string;
  database: string;
};

export function postgresEnv(
  env: NodeJS.Dict<string> = process.env,
): PostgresEnv {
  return {
    user: env.POSTGRES_USER?.trim() || DEFAULTS.user,
    password: env.POSTGRES_PASSWORD || DEFAULTS.password,
    host: env.POSTGRES_HOST?.trim() || DEFAULTS.host,
    port: env.POSTGRES_PORT?.trim() || DEFAULTS.port,
    database: env.POSTGRES_DB?.trim() || DEFAULTS.database,
  };
}

export function buildDatabaseUrl(parts: PostgresEnv) {
  const user = encodeURIComponent(parts.user);
  const password = encodeURIComponent(parts.password);
  const database = encodeURIComponent(parts.database);
  return `postgresql://${user}:${password}@${parts.host}:${parts.port}/${database}`;
}

/** Prefer DATABASE_URL when set; otherwise build it from POSTGRES_* variables. */
export function databaseUrl(env: NodeJS.Dict<string> = process.env) {
  const explicit = env.DATABASE_URL?.trim();
  if (explicit) return explicit;
  return buildDatabaseUrl(postgresEnv(env));
}
