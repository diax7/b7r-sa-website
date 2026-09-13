#!/usr/bin/env bash
# Lighthouse CI against the steady state (BRD 8.7): warm the audited pages, then run
# `lhci autorun` against the same server with three runs.
set -euo pipefail
cd "$(dirname "$0")/../.."
# shellcheck source=scripts/ci/warm-lib.sh
. scripts/ci/warm-lib.sh
start_server
trap stop_server EXIT
warm_pages
pnpm lhci
