#!/usr/bin/env bash
# Writes gitignored certs in .certs/ for npm run dev:https and Docker Caddy.
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
certs="$root/.certs"
mkdir -p "$certs"

if command -v mkcert >/dev/null 2>&1; then
  if [[ ! -f "$certs/127.0.0.1+1.pem" || ! -f "$certs/127.0.0.1+1-key.pem" ]]; then
    (cd "$certs" && mkcert 127.0.0.1 localhost)
  fi
  src_cert="$certs/127.0.0.1+1.pem"
  src_key="$certs/127.0.0.1+1-key.pem"
else
  src_cert="$certs/localhost.pem"
  src_key="$certs/localhost-key.pem"
  if [[ ! -f "$src_cert" || ! -f "$src_key" ]]; then
    openssl req -x509 -newkey rsa:2048 -nodes -days 825 \
      -keyout "$src_key" \
      -out "$src_cert" \
      -subj "/CN=127.0.0.1" \
      -addext "subjectAltName=IP:127.0.0.1,DNS:localhost"
  fi
fi

cp -f "$src_cert" "$certs/local.pem"
cp -f "$src_key" "$certs/local-key.pem"
chmod 644 "$certs/local.pem" "$certs/local-key.pem"
