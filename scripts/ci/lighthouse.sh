#!/usr/bin/env bash
# Lighthouse CI against the steady state (BRD 8.7): warm the audited pages, then run
# `lhci autorun` against the same server with three runs. The booking is switched on first
# (ADR-063): `/book` is a 404 while it is off, and the e2e before this step leaves it off
# (the public projects assert the contact card's WhatsApp fallback).
set -euo pipefail
cd "$(dirname "$0")/../.."
# shellcheck source=scripts/ci/warm-lib.sh
. scripts/ci/warm-lib.sh
pnpm exec tsx scripts/ci/booking-on.ts
start_server
trap stop_server EXIT
warm_pages
pnpm lhci
