#!/usr/bin/env bash
# Lighthouse CI against the steady state (BRD 8.7): start the production server, request every
# audited page and its image transforms once so ISR entries and the next/image cache are warm
# (a cold first transform alone costs a point, docs/IDEAS.md), then run `lhci autorun` against
# that server. Production behaves the same after the first visitor per image size.
set -euo pipefail
cd "$(dirname "$0")/../.."
URLS="/ /products /products/tee-essential /contact /blog/how-to-price-printed-tshirt-saudi"
pnpm start >/tmp/lh-server.log 2>&1 &
server=$!
trap 'kill "$server" 2>/dev/null || true' EXIT
for _ in $(seq 1 60); do curl -sf -o /dev/null http://localhost:3004/api/health && break; sleep 1; done
for round in 1 2; do
  for path in $URLS; do
    html=$(curl -s "http://localhost:3004$path")
    if [ "$round" = 2 ]; then
      echo "warm $path: $(curl -s -o /dev/null -D - "http://localhost:3004$path" | grep -i x-nextjs-cache || echo 'no cache header')"
    fi
    (echo "$html" | grep -o '/_next/image[^" ]*' | sort -u || true) | while read -r img; do
      curl -s -o /dev/null "http://localhost:3004${img//&amp;/&}" || true
    done
  done
done
pnpm lhci
