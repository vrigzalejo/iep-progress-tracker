#!/bin/sh
# Create local TLS certs on first start, then run Caddy.
set -eu

cert=/certs/local.pem
key=/certs/local-key.pem
mkcert_cert=/certs/127.0.0.1+1.pem
mkcert_key=/certs/127.0.0.1+1-key.pem

mkdir -p /certs

if [ ! -f "$cert" ] || [ ! -f "$key" ]; then
  if [ -f "$mkcert_cert" ] && [ -f "$mkcert_key" ]; then
    cp "$mkcert_cert" "$cert"
    cp "$mkcert_key" "$key"
    echo "Using existing mkcert files as .certs/local.pem"
  else
    echo "Generating self-signed TLS certs for https://127.0.0.1:43147"
    apk add --no-cache openssl
    openssl req -x509 -newkey rsa:2048 -nodes -days 825 \
      -keyout "$key" \
      -out "$cert" \
      -subj "/CN=127.0.0.1" \
      -addext "subjectAltName=IP:127.0.0.1,DNS:localhost"
  fi
  chmod 644 "$cert" "$key"
fi

exec caddy run --config /etc/caddy/Caddyfile --adapter caddyfile
