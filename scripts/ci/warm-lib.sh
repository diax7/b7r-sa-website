#!/usr/bin/env bash
# Shared by the CI e2e and Lighthouse steps: `start_server` runs the production build on
# :3004, `warm_pages` requests the audited pages and every image transform they reference so
# ISR entries and the next/image cache are warm (a cold AVIF transform takes seconds on the
# runner and shows up as a slow LCP or a `load` event that never fires in a no-JS test).
# Production behaves the same after the first visitor per image size.
WARM_URLS="/ /products /products/tee-essential /contact /blog/how-to-price-printed-tshirt-saudi /en /en/products/tee-essential"

start_server() {
  pnpm start >/tmp/ci-server.log 2>&1 &
  SERVER_PID=$!
  for _ in $(seq 1 60); do
    curl -sf -o /dev/null http://localhost:3004/api/health && break
    sleep 1
  done
}

# `pnpm start` wraps `next start`, which keeps the port after its parent dies: kill the
# wrapper, then whatever still listens on :3004 (Linux runner or Windows Git Bash), and
# wait until the port is free so the next server can bind.
stop_server() {
  kill "${SERVER_PID:-0}" 2>/dev/null || true
  for _ in $(seq 1 20); do
    if command -v fuser >/dev/null 2>&1; then
      fuser -k -TERM 3004/tcp >/dev/null 2>&1 || true
    elif command -v taskkill >/dev/null 2>&1; then
      for pid in $(netstat -ano 2>/dev/null | grep ':3004' | grep -i LISTENING | awk '{print $NF}' | sort -u); do
        taskkill //PID "$pid" //F >/dev/null 2>&1 || true
      done
    fi
    if ! (command -v ss >/dev/null 2>&1 && ss -ltn 2>/dev/null | grep -q ':3004 ') &&
      ! (netstat -ano 2>/dev/null | grep ':3004' | grep -qi LISTENING); then
      return 0
    fi
    sleep 1
  done
  echo "stop_server: port 3004 still in use" >&2
  return 1
}

warm_pages() {
  for round in 1 2; do
    for path in $WARM_URLS; do
      html=$(curl -s "http://localhost:3004$path")
      if [ "$round" = 2 ]; then
        echo "warm $path: $(curl -s -o /dev/null -D - "http://localhost:3004$path" | grep -i x-nextjs-cache | tr -d '\r' || echo 'no cache header')"
      fi
      # The format follows the Accept header: Lighthouse's Chrome asks for AVIF, curl's `*/*`
      # would warm a JPEG nobody requests. The second round counts the transforms still cold.
      misses=0
      total=0
      for img in $(echo "$html" | grep -o '/_next/image[^" ]*' | sort -u || true); do
        total=$((total + 1))
        cache=$(curl -s -o /dev/null -D - -H 'Accept: image/avif,image/webp,*/*;q=0.8' \
          "http://localhost:3004${img//&amp;/&}" | grep -i x-nextjs-cache | tr -d '\r' || true)
        case "$cache" in *MISS*) misses=$((misses + 1)) ;; esac
      done
      if [ "$round" = 2 ]; then echo "warm $path images: $total, $misses miss"; fi
    done
  done
}
