import { describe, expect, it } from "vitest";
import {
  buildDatabaseUrl,
  databaseUrl,
  migrateDatabaseUrl,
  pgPoolConnectionString,
  postgresEnv,
  withSupabaseSsl,
} from "./database-url";

describe("postgresEnv", () => {
  it("uses demo defaults when nothing is set", () => {
    expect(postgresEnv({})).toEqual({
      user: "iep",
      password: "iep",
      host: "127.0.0.1",
      port: "5432",
      database: "iep",
    });
  });

  it("reads each credential from env", () => {
    expect(
      postgresEnv({
        POSTGRES_USER: "sped",
        POSTGRES_PASSWORD: "s3cret",
        POSTGRES_HOST: "db",
        POSTGRES_PORT: "5433",
        POSTGRES_DB: "iep_prod",
      }),
    ).toEqual({
      user: "sped",
      password: "s3cret",
      host: "db",
      port: "5433",
      database: "iep_prod",
    });
  });

  it("accepts POSTGRES_DATABASE as a Vercel alias for POSTGRES_DB", () => {
    expect(
      postgresEnv({
        POSTGRES_USER: "iep",
        POSTGRES_PASSWORD: "iep",
        POSTGRES_HOST: "host",
        POSTGRES_DATABASE: "neondb",
      }),
    ).toMatchObject({ database: "neondb" });
  });
});

describe("databaseUrl", () => {
  it("returns DATABASE_URL when set", () => {
    expect(
      databaseUrl({
        DATABASE_URL: "postgresql://cloud:pw@db.example:5432/iep",
        POSTGRES_PASSWORD: "ignored",
        POSTGRES_URL: "postgresql://ignored@db.example:5432/iep",
      }),
    ).toBe("postgresql://cloud:pw@db.example:5432/iep");
  });

  it("uses Vercel POSTGRES_URL when DATABASE_URL is unset", () => {
    expect(
      databaseUrl({
        POSTGRES_URL: "postgresql://iep:pw@pooler.neon.tech/iep?sslmode=require",
      }),
    ).toBe("postgresql://iep:pw@pooler.neon.tech/iep?sslmode=require");
  });

  it("prefers POSTGRES_PRISMA_URL over POSTGRES_URL", () => {
    expect(
      databaseUrl({
        POSTGRES_PRISMA_URL: "postgresql://iep:pw@pooler/iep?pgbouncer=true",
        POSTGRES_URL: "postgresql://iep:pw@pooler/iep",
      }),
    ).toBe("postgresql://iep:pw@pooler/iep?pgbouncer=true");
  });

  it("builds a URL from POSTGRES_* parts", () => {
    expect(
      databaseUrl({
        POSTGRES_USER: "sped",
        POSTGRES_PASSWORD: "s3cret",
        POSTGRES_HOST: "db",
        POSTGRES_PORT: "5432",
        POSTGRES_DB: "iep_prod",
      }),
    ).toBe("postgresql://sped:s3cret@db:5432/iep_prod");
  });

  it("percent-encodes special characters in the password", () => {
    expect(
      buildDatabaseUrl({
        user: "iep",
        password: "p@ss/w:rd",
        host: "127.0.0.1",
        port: "5432",
        database: "iep",
      }),
    ).toBe("postgresql://iep:p%40ss%2Fw%3Ard@127.0.0.1:5432/iep");
  });

  it("ignores a blank DATABASE_URL", () => {
    expect(
      databaseUrl({
        DATABASE_URL: "   ",
        POSTGRES_USER: "sped",
        POSTGRES_PASSWORD: "s3cret",
        POSTGRES_HOST: "db",
        POSTGRES_DB: "iep",
      }),
    ).toBe("postgresql://sped:s3cret@db:5432/iep");
  });

  it("adds sslmode=require for Supabase hosts", () => {
    expect(
      databaseUrl({
        DATABASE_URL:
          "postgresql://postgres:pw@db.abcd.supabase.co:5432/postgres",
      }),
    ).toContain("sslmode=require");
  });
});

describe("withSupabaseSsl", () => {
  it("leaves local URLs unchanged", () => {
    expect(withSupabaseSsl("postgresql://iep:iep@127.0.0.1:5432/iep")).toBe(
      "postgresql://iep:iep@127.0.0.1:5432/iep",
    );
  });

  it("does not duplicate sslmode", () => {
    const url =
      "postgresql://postgres:pw@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true";
    expect(withSupabaseSsl(url)).toBe(url);
  });
});

describe("migrateDatabaseUrl", () => {
  it("prefers a direct non-pooling URL for Prisma CLI", () => {
    expect(
      migrateDatabaseUrl({
        DATABASE_URL: "postgresql://iep:pw@pooler/iep?pgbouncer=true",
        POSTGRES_URL_NON_POOLING: "postgresql://iep:pw@ep-direct/iep",
      }),
    ).toBe("postgresql://iep:pw@ep-direct/iep");
  });

  it("falls back to the runtime URL", () => {
    expect(
      migrateDatabaseUrl({
        DATABASE_URL: "postgresql://iep:pw@db.example/iep",
      }),
    ).toBe("postgresql://iep:pw@db.example/iep");
  });
});

describe("pgPoolConnectionString", () => {
  it("strips Prisma pgbouncer query params", () => {
    const next = pgPoolConnectionString(
      "postgresql://iep:pw@pooler.example/iep?pgbouncer=true&sslmode=require&connection_limit=1",
    );
    expect(next).not.toContain("pgbouncer");
    expect(next).not.toContain("connection_limit");
    expect(next).toContain("sslmode=require");
  });
});
