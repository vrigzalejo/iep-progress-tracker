import { afterEach, describe, expect, it } from "vitest";
import { buildDatabaseUrl, databaseUrl, postgresEnv } from "./database-url";

const KEYS = [
  "DATABASE_URL",
  "POSTGRES_USER",
  "POSTGRES_PASSWORD",
  "POSTGRES_HOST",
  "POSTGRES_PORT",
  "POSTGRES_DB",
] as const;

const original = new Map<string, string | undefined>();

function setEnv(values: Partial<Record<(typeof KEYS)[number], string | undefined>>) {
  for (const key of KEYS) {
    if (!original.has(key)) original.set(key, process.env[key]);
    const next = values[key];
    if (next === undefined) delete process.env[key];
    else process.env[key] = next;
  }
}

afterEach(() => {
  for (const [key, value] of original) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  original.clear();
});

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
});

describe("databaseUrl", () => {
  it("returns DATABASE_URL when set", () => {
    expect(
      databaseUrl({
        DATABASE_URL: "postgresql://cloud:pw@db.example:5432/iep",
        POSTGRES_PASSWORD: "ignored",
      }),
    ).toBe("postgresql://cloud:pw@db.example:5432/iep");
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
    setEnv({
      DATABASE_URL: "   ",
      POSTGRES_USER: "sped",
      POSTGRES_PASSWORD: "s3cret",
      POSTGRES_HOST: "db",
      POSTGRES_DB: "iep",
    });
    expect(databaseUrl()).toBe("postgresql://sped:s3cret@db:5432/iep");
  });
});
