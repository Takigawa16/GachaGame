#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# GACHA DEBT — one-line launcher
#   ./start.sh              -> normal server on :3000
#   ./start.sh dev          -> also enables the DEV REFILL button in System
#   PORT=8080 ./start.sh    -> custom port
#   ./start.sh dev 8080     -> both
# Requires Node 18+ (no npm install needed: zero dependencies).
# ---------------------------------------------------------------------------
set -e
cd "$(dirname "$0")"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is required (v18 or newer). https://nodejs.org" >&2
  exit 1
fi

NODE_MAJOR=$(node -p 'process.versions.node.split(".")[0]')
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "Node 18+ required, found $(node -v)." >&2
  exit 1
fi

MODE="${1:-}"
if [ "$MODE" = "dev" ]; then
  export GD_DEV=1
else
  [ -n "$MODE" ] && export PORT="$MODE"
fi
[ -n "$2" ] && export PORT="$2"

echo "──────────────────────────────────────────────"
echo " GACHA DEBT"
echo "  sanity regen : 1 per 90s (demo pace)"
echo "  dev tools    : ${GD_DEV:-0}"
echo "  port         : ${PORT:-3000}"
echo "──────────────────────────────────────────────"
exec node server/index.js
