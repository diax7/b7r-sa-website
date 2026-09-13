#!/usr/bin/env bash
# Rebuild and restart the production server on :3004 (dev helper, Windows-friendly).
set -euo pipefail
cd "$(dirname "$0")/../.."
kill_port() {
  for pid in $(netstat -ano 2>/dev/null | grep ':3004' | grep -i LISTENING | awk '{print $NF}' | sort -u); do
    taskkill //PID "$pid" //F >/dev/null 2>&1 || true
  done
}
kill_port
for _ in $(seq 1 20); do
  [ "$(netstat -ano 2>/dev/null | grep ':3004' | grep -ci LISTENING)" = "0" ] && break
  kill_port; sleep 0.5
done
# The data cache (unstable_cache entries) survives rebuilds under .next/cache; clear it so a
# rebuild reads the CMS again, as a fresh container would.
rm -rf .next/cache/fetch-cache
pnpm build > /tmp/b7r-build.log 2>&1 || { tail -40 /tmp/b7r-build.log; exit 1; }
(pnpm start > /tmp/b7r-start.log 2>&1 &)
for _ in $(seq 1 30); do curl -sf -o /dev/null http://localhost:3004/api/health && break; sleep 1; done
# Prove the running server serves the fresh build: its stylesheet must resolve.
css=$(curl -s http://localhost:3004/ | grep -o '/_next/static/[^"]*\.css' | head -1)
code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3004$css")
[ "$code" = "200" ] && { echo "ready"; exit 0; }
echo "stale server: stylesheet $css returned $code"; tail -20 /tmp/b7r-start.log; exit 1
