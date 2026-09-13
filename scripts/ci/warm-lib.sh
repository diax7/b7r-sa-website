#!/usr/bin/env bash
# Shared by the CI e2e and Lighthouse steps: `start_server` runs the production build on
# :3004, `warm_pages` requests the audited pages and every image transform they reference so
# ISR entries and the next/image cache are warm (a cold AVIF transform takes seconds on the
# runner and shows up as a slow LCP or a `load` event that never fires in a no-JS test).
# Production behaves the same after the first visitor per image size.
WARM_URLS="/ /products /products/tee-essential /contact /blog/how-to-price-printed-tshirt-saudi"

start_server() {
  pnpm start >/tmp/ci-server.log 2>&1 &
  SERVER_PID=$!
  for _ in $(seq 1 60); do curl -sf -o /dev/null http://localhost:3004/api/health && break; sleep 1; done
}

stop_server() {
  kill "${SERVER_PID:-0}" 2>/dev/null || true
  wait "${SERVER_PID:-0}" 2>/dev/null || true
}

warm_pages() {
  for round in 1 2; do
    for path in $WARM_URLS; do
      html=$(curl -s "http://localhost:3004$path")
      if [ "$round" = 2 ]; then
        echo "warm $path: $(curl -s -o /dev/null -D - "http://localhost:3004$path" | grep -i x-nextjs-cache | tr -d '\r' || echo 'no cache header')"
      fi
      (echo "$html" | grep -o '/_next/image[^" ]*' | sort -u || true) | while read -r img; do
        curl -s -o /dev/null "http://localhost:3004${img//&amp;/&}" || true
      done
    done
  done
}
