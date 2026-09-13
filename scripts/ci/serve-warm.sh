#!/usr/bin/env bash
# Playwright's web server in CI: start the production server, warm the audited pages and their
# image transforms on that same process, then stay attached so Playwright owns its lifetime.
set -euo pipefail
cd "$(dirname "$0")/../.."
# shellcheck source=scripts/ci/warm-lib.sh
. scripts/ci/warm-lib.sh
start_server
trap stop_server EXIT
warm_pages
wait "$SERVER_PID"
