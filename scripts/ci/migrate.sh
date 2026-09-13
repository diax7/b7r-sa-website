#!/usr/bin/env bash
# `payload migrate` with a check that it did something. The Payload CLI loads the TypeScript
# config through tsx's loader worker; once in CI (run 34781832486, 2026-09-13) the process
# exited 0 in two seconds with no log line and no migration applied, and the seed step
# failed on a missing table. Before a deploy that silence would start the new image against
# the old schema, so every migration file must show as ran in `migrate:status`; three
# attempts. Needs DATABASE_URL and PAYLOAD_SECRET.
set -euo pipefail
cd "$(dirname "$0")/../.."

expected=$(find src/migrations -maxdepth 1 -name '2*.ts' | wc -l | tr -d ' ')
for attempt in 1 2 3; do
  pnpm migrate
  ran=$(pnpm migrate:status 2>&1 | grep -c 'Yes' || true)
  if [ "$ran" -ge "$expected" ]; then
    echo "migrate: $ran of $expected migrations ran"
    exit 0
  fi
  echo "migrate: attempt $attempt, $ran of $expected migrations ran; retrying" >&2
done
echo "migrate: gave up after 3 attempts" >&2
exit 1
