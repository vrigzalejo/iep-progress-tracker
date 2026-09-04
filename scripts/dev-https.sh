#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
bash "$root/scripts/ensure-local-certs.sh"

exec npx next dev --port 43147 --hostname 127.0.0.1 \
  --experimental-https \
  --experimental-https-key "$root/.certs/local-key.pem" \
  --experimental-https-cert "$root/.certs/local.pem"
