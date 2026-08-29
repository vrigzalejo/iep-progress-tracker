#!/bin/sh
set -eu

: "${AUTH_SECRET:?AUTH_SECRET is required}"

if [ -z "${DATABASE_URL:-}" ] && [ -z "${POSTGRES_PASSWORD:-}" ]; then
  echo "Set DATABASE_URL, or set POSTGRES_USER, POSTGRES_PASSWORD, and POSTGRES_DB." >&2
  exit 1
fi

if [ "$(id -u)" = "0" ]; then
  mkdir -p /app/data/uploads
  chown -R nextjs:nodejs /app/data
  exec setpriv --reuid=1001 --regid=1001 --init-groups -- "$0" "$@"
fi

mkdir -p /app/data/uploads

attempt=0
until node ./node_modules/prisma/build/index.js migrate deploy; do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge 30 ]; then
    echo "Prisma migrate failed after ${attempt} attempts." >&2
    exit 1
  fi
  echo "Waiting for Postgres before migrating (${attempt}/30)..."
  sleep 2
done

exec node server.js
