#!/usr/bin/env bash
# Warm the ISR and image caches on disk before Playwright starts its own server.
set -euo pipefail
cd "$(dirname "$0")/../.."
# shellcheck source=scripts/ci/warm-lib.sh
. scripts/ci/warm-lib.sh
start_server
trap stop_server EXIT
warm_pages
