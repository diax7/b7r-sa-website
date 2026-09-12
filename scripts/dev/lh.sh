#!/usr/bin/env bash
# Build with the production origin, serve on :3004, run one mobile Lighthouse and print scores.
set -euo pipefail
cd "$(dirname "$0")/../.."
OUT="${1:-/tmp/lh.json}"
for pid in $(netstat -ano 2>/dev/null | grep ':3004' | grep LISTENING | awk '{print $NF}' | sort -u); do taskkill //PID "$pid" //F >/dev/null 2>&1 || true; done
NEXT_PUBLIC_SITE_URL=https://b7r.sa pnpm build > /tmp/b7r-build.log 2>&1 || { tail -30 /tmp/b7r-build.log; exit 1; }
(NEXT_PUBLIC_SITE_URL=https://b7r.sa pnpm start > /tmp/b7r-start.log 2>&1 &)
for _ in $(seq 1 30); do curl -sf -o /dev/null http://localhost:3004/api/health && break; sleep 1; done
LH=$(ls -d node_modules/.pnpm/lighthouse@*/node_modules/lighthouse | head -1)
node "$LH/cli/index.js" http://localhost:3004/ --output=json --output-path="$OUT" --quiet \
  --chrome-flags="--headless=new --no-sandbox" --form-factor=mobile --throttling-method=simulate >/dev/null 2>&1 || true
node -e '
const r=require(process.argv[1]); const c=r.categories; const a=r.audits;
console.log("perf",c.performance.score,"a11y",c.accessibility.score,"bp",c["best-practices"].score,"seo",c.seo.score);
for (const k of ["first-contentful-paint","largest-contentful-paint","cumulative-layout-shift","total-blocking-time","speed-index"]) console.log(" ",k, a[k].displayValue);
const el=a["largest-contentful-paint-element"]; console.log("  lcp element", JSON.stringify(el.details?.items?.[0]?.items?.[0]?.node?.snippet).slice(0,80), JSON.stringify(el.details?.items?.[1]?.items?.map(i=>[i.phase,Math.round(i.timing)])));
' "$OUT"
