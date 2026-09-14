// Golden HTML for the Arabic site through a refactor (Level 5, CTO): `node scripts/dev/golden.mjs
// snap` saves the rendered HTML of the five Lighthouse URLs from :3004 into
// .golden/<slug>.html; `... diff` fetches them again and prints the first differing line per
// page (whitespace and Next's build ids aside), exit 1 on any difference. Not part of the gates.
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const BASE = process.env.BASE_URL ?? 'http://localhost:3004';
const PATHS = [
  '/',
  '/products',
  '/products/tee-essential',
  '/contact',
  '/blog/how-to-price-printed-tshirt-saudi',
];
const DIR = '.golden';
const [, , command = 'diff'] = process.argv;

const slug = (p) => (p === '/' ? 'home' : p.slice(1).replaceAll('/', '__'));

/** Strips what changes between builds and requests: build ids, hashed chunk names, nonces. */
function normalise(html) {
  return html
    .replace(/\/_next\/static\/[^"']+/g, '/_next/static/X')
    .replace(/nonce="[^"]+"/g, 'nonce="X"')
    .replace(/"buildId":"[^"]+"/g, '"buildId":"X"')
    .replace(/\s+/g, ' ')
    .replace(/>\s*</g, '>\n<');
}

async function fetchAll() {
  const out = new Map();
  for (const p of PATHS) {
    const res = await fetch(`${BASE}${p}`, { headers: { 'Accept-Language': 'ar' } });
    if (!res.ok) throw new Error(`${p} answered ${res.status}`);
    out.set(p, normalise(await res.text()));
  }
  return out;
}

const NL = String.fromCharCode(10);
// The intended Level 5 changes to the Arabic document (ADR-043): hreflang pairs, the OG
// alternate locale, the riyal symbol named once per document. Dropped before comparing.
// The RSC payload (`self.__next_f.push`) carries component props and module ids, which
// change with any refactor; the rendered document is what the diff guards.
const EXPECTED = [/hrefLang=/, /og:locale:alternate/, /id="sar-name"/, /self\.__next_f\.push/];
const intended = (line) => EXPECTED.some((re) => re.test(line));
const neutral = (line) =>
  line
    .replace(' aria-labelledby="sar-name"', '')
    .replace(' aria-label="ريال سعودي"', '')
    .replace(/_R_[a-z0-9]+_/g, '_R_X_')
    .replace('"availableLanguage":["ar","en"]', '"availableLanguage":"ar"')
    .replace('"inLanguage":["ar","en"]', '"inLanguage":"ar"');
const split = (html) => {
  const at = html.indexOf('<body');
  const clean = (part) =>
    part
      .split(NL)
      .filter((l) => !intended(l))
      .map(neutral);
  return { head: clean(html.slice(0, at)).toSorted(), body: clean(html.slice(at)) };
};

const pages = await fetchAll();
if (command === 'snap') {
  mkdirSync(DIR, { recursive: true });
  for (const [p, html] of pages) writeFileSync(join(DIR, `${slug(p)}.html`), html);
  console.log(`golden: ${pages.size} page(s) saved to ${DIR}/`);
} else {
  // The head is compared as a set (Next orders it freely); the body line by line.
  let failed = 0;
  for (const [p, html] of pages) {
    const file = join(DIR, `${slug(p)}.html`);
    if (!existsSync(file)) {
      console.log(`${p}: no snapshot (run snap first)`);
      failed += 1;
      continue;
    }
    const before = split(readFileSync(file, 'utf8'));
    const after = split(html);
    const gone = before.head.filter((l) => !after.head.includes(l));
    const added = after.head.filter((l) => !before.head.includes(l));
    const n = Math.max(before.body.length, after.body.length);
    let first = -1;
    for (let i = 0; i < n; i++) {
      if (before.body[i] !== after.body[i]) {
        first = i;
        break;
      }
    }
    const headNote = gone.length + added.length ? ` head: -${gone.length} +${added.length}` : '';
    if (first === -1 && !headNote) console.log(`${p}: same (${after.body.length} body lines)`);
    else {
      failed += 1;
      console.log(
        `${p}:${headNote}${first === -1 ? ' body same' : ` body differs at line ${first + 1}`}`,
      );
      for (const l of gone) console.log(`  head -: ${l.slice(0, 160)}`);
      for (const l of added) console.log(`  head +: ${l.slice(0, 160)}`);
      if (first !== -1) {
        console.log(`  before: ${(before.body[first] ?? '').slice(0, 160)}`);
        console.log(`  after:  ${(after.body[first] ?? '').slice(0, 160)}`);
      }
    }
  }
  process.exit(failed ? 1 : 0);
}
