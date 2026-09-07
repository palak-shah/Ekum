#!/bin/sh
set -eu

cd /app/apps/api

echo "Waiting for database and applying migrations…"
n=0
until pnpm exec prisma migrate deploy; do
  n=$((n + 1))
  if [ "$n" -ge 30 ]; then
    echo "prisma migrate deploy failed after retries" >&2
    exit 1
  fi
  echo "Database not ready (attempt $n/30); retrying in 2s…"
  sleep 2
done

echo "Starting API…"
exec node dist/main.js
