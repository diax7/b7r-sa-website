#!/usr/bin/env bash
# Rebuild and restart the production server on :3004 (dev helper, Windows-friendly).
set -euo pipefail
cd "$(dirname "$0")/../.."
for pid in $(netstat -ano 2>/dev/null | grep ':3004' | grep LISTENING | awk '{print $NF}' | sort -u); do
  taskkill //PID "$pid" //F >/dev/null 2>&1 || true
done
sleep 1
pnpm build > /tmp/b7r-build.log 2>&1 || { tail -40 /tmp/b7r-build.log; exit 1; }
(pnpm start > /tmp/b7r-start.log 2>&1 &)
for _ in $(seq 1 30); do curl -sf -o /dev/null http://localhost:3004/api/health && { echo "ready"; exit 0; }; sleep 1; done
echo "server did not start"; tail -20 /tmp/b7r-start.log; exit 1
