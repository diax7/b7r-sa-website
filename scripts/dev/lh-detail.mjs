// Prints LCP element, phases, image transfers and opportunities from Lighthouse JSON files.
//   node scripts/dev/lh-detail.mjs /tmp/lh-_products.json …
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const tmp = process.env.TEMP ?? process.env.TMP ?? '/tmp';
for (const arg of process.argv.slice(2)) {
  const file = arg.startsWith('/tmp/') ? join(tmp, arg.slice(5)) : arg;
  const r = JSON.parse(readFileSync(file, 'utf8'));
  const a = r.audits;
  const el = a['largest-contentful-paint-element'];
  console.log(file.split(/[\\/]/).pop(), 'perf', r.categories.performance.score);
  console.log(
    '  lcp element',
    JSON.stringify(el.details?.items?.[0]?.items?.[0]?.node?.snippet ?? null)?.slice(0, 140),
  );
  console.log(
    '  phases',
    JSON.stringify(
      el.details?.items?.[1]?.items?.map((i) => [i.phase, Math.round(i.timing)]) ?? null,
    ),
  );
  for (const k of [
    'first-contentful-paint',
    'largest-contentful-paint',
    'total-blocking-time',
    'speed-index',
    'interactive',
  ]) {
    console.log('  ', k, a[k].displayValue, a[k].score);
  }
  const images = a['network-requests'].details.items
    .filter((i) => i.resourceType === 'Image')
    .slice(0, 8)
    .map((i) => [i.url.split('/').pop().slice(0, 60), i.transferSize]);
  console.log('  images', JSON.stringify(images));
  const opp = Object.values(a)
    .filter((x) => x.details && x.details.type === 'opportunity' && x.details.overallSavingsMs > 50)
    .map((x) => [x.id, Math.round(x.details.overallSavingsMs)]);
  console.log('  opportunities', JSON.stringify(opp));
}
