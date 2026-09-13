#!/usr/bin/env bash
# Build with the production origin, serve on :3004, run mobile Lighthouse on the five LHCI URLs
# (BRD 8.7 / 7.8) and print the four scores per URL. Windows-friendly (lhci's launcher EPERMs).
set -euo pipefail
cd "$(dirname "$0")/../.."
for pid in $(netstat -ano 2>/dev/null | grep ':3004' | grep LISTENING | awk '{print $NF}' | sort -u); do taskkill //PID "$pid" //F >/dev/null 2>&1 || true; done
rm -rf .next/cache/fetch-cache
NEXT_PUBLIC_SITE_URL=https://b7r.sa pnpm build >/tmp/b7r-build.log 2>&1 || {
  tail -30 /tmp/b7r-build.log
  exit 1
}
(NEXT_PUBLIC_SITE_URL=https://b7r.sa pnpm start >/tmp/b7r-start.log 2>&1 &)
for _ in $(seq 1 30); do curl -sf -o /dev/null http://localhost:3004/api/health && break; sleep 1; done
LH=$(ls -d node_modules/.pnpm/lighthouse@*/node_modules/lighthouse | head -1)
URLS="${*:-/ /products /products/tee-essential /contact /blog/how-to-price-printed-tshirt-saudi}"
mkdir -p .lighthouseci
# The first request for each next/image transform is slow (cold cache) and drags LCP; warm
# every page once so the runs measure the steady state LHCI sees with numberOfRuns: 2.
for path in $URLS; do
  (curl -s "http://localhost:3004$path" | grep -o '/_next/image[^" ]*' | sort -u || true) | while read -r img; do
    curl -s -o /dev/null "http://localhost:3004${img//&amp;/&}" || true
  done
done
for path in $URLS; do
  out=".lighthouseci/lh-$(echo "$path" | tr '/' '_').json"
  node "$LH/cli/index.js" "http://localhost:3004$path" --output=json --output-path="$out" --quiet \
    --chrome-flags="--headless=new --no-sandbox" --form-factor=mobile --throttling-method=simulate >/dev/null 2>&1 || true
  # MSYS would rewrite a leading "/" in the env value into a Windows path; disable that here.
  MSYS_NO_PATHCONV=1 MSYS2_ARG_CONV_EXCL="*" LH_PATH="$path" node -e '
const r=require("./"+process.argv[1]); const c=r.categories; const a=r.audits;
const s=(x)=>Math.round(x.score*100);
console.log(process.env.LH_PATH.padEnd(44),"perf",s(c.performance),"a11y",s(c.accessibility),"bp",s(c["best-practices"]),"seo",s(c.seo),
  "| LCP",a["largest-contentful-paint"].displayValue,"CLS",a["cumulative-layout-shift"].displayValue,"TBT",a["total-blocking-time"].displayValue);
' "$out"
done
