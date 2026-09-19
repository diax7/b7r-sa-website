// Smoke of the temporary domain after the pre-launch programme (Phase 4): the admin in both
// languages (sidebar, dashboard, a bilingual twin), one publish and one upload, both undone.
// Credentials come from .env.local (the production database was restored from the review
// one); nothing is printed but outcomes. Usage: node scripts/dev/cranl-smoke.mjs [origin]
import { chromium } from '@playwright/test';
import fs from 'node:fs';

const origin = process.argv[2] ?? 'https://b7r-sa-website-dkrtv6.cranl.net';
const env = Object.fromEntries(
  fs
    .readFileSync('.env.local', 'utf8')
    .split(/\r?\n/)
    .filter((l) => l.includes('=') && !l.startsWith('#'))
    .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]),
);
const API = `${origin}/api/payload`;
const results = [];
const ok = (name, pass, detail = '') => {
  results.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
};

const paragraph = (text) => ({
  root: {
    type: 'root',
    format: '',
    indent: 0,
    version: 1,
    direction: 'rtl',
    children: [
      {
        type: 'paragraph',
        format: '',
        indent: 0,
        version: 1,
        direction: 'rtl',
        textFormat: 0,
        children: [
          { type: 'text', text, format: 0, style: '', mode: 'normal', detail: 0, version: 1 },
        ],
      },
    ],
  },
});

const browser = await chromium.launch();
try {
  for (const [language, locale] of [
    ['en', 'en-US'],
    ['ar', 'ar-SA'],
  ]) {
    const ctx = await browser.newContext({ locale, viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    const login = await page.request.post(`${API}/users/login`, {
      data: { email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD },
    });
    ok(`${language}: admin login`, login.status() === 200, String(login.status()));
    await page.goto(`${origin}/admin`, { waitUntil: 'networkidle' });
    const html = page.locator('html');
    ok(
      `${language}: panel language and direction`,
      (await html.getAttribute('lang')) === language &&
        ((await html.getAttribute('dir')) ?? '').toLowerCase() ===
          (language === 'ar' ? 'rtl' : 'ltr'),
      `${await html.getAttribute('lang')} ${await html.getAttribute('dir')}`,
    );
    const groups = await page.locator('[data-admin-nav] [data-admin-group]').count();
    ok(`${language}: sidebar groups`, groups === 5, String(groups));
    const tiles = await page.locator('[data-admin-dashboard] [data-admin-tile]').count();
    ok(`${language}: dashboard tiles`, tiles === 4, String(tiles));
    const sections = await Promise.all(
      ['visits', 'assistants', 'content', 'engine', 'server'].map((h) =>
        page.locator(`[data-admin-dashboard-${h}]`).count(),
      ),
    );
    ok(
      `${language}: dashboard sections`,
      sections.every((n) => n === 1),
      sections.join(','),
    );
    const greeting = await page.locator('[data-admin-dashboard] h1').first().innerText();
    ok(
      `${language}: greeting in the panel's language`,
      language === 'ar' ? /[؀-ۿ]/.test(greeting) : /Good /.test(greeting),
      greeting.slice(0, 30),
    );
    // A page's edit view: the bilingual twin beside the title.
    await page.goto(`${origin}/admin/collections/pages`, { waitUntil: 'networkidle' });
    // An existing document (the list's "Create New" link would open a fresh draft).
    const first = page
      .locator('.collection-list a[href*="/admin/collections/pages/"]:not([href$="/create"])')
      .first();
    await first.click();
    await page.waitForURL(/\/admin\/collections\/pages\/\d+/);
    await page.locator('.tabs-field__tab-button').first().click();
    const twin = page.locator('[data-admin-bilingual="title"] input').nth(1);
    await twin.waitFor({ state: 'visible', timeout: 15000 });
    await page.waitForFunction(
      () => !document.querySelector('[data-admin-bilingual="title"] input:disabled'),
      null,
      { timeout: 20000 },
    );
    ok(`${language}: bilingual twin on the page title`, (await twin.inputValue()).length > 0);
    ok(`${language}: no page errors`, errors.length === 0, errors.slice(0, 2).join(' | '));
    await ctx.close();
  }

  // One publish and one upload through the API, both undone.
  const ctx = await browser.newContext();
  const login = await ctx.request.post(`${API}/users/login`, {
    data: { email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD },
  });
  const { token } = await login.json();
  const auth = { Authorization: `JWT ${token}` };
  const slug = `smoke-${Date.now()}`;
  const created = await ctx.request.post(`${API}/pages?locale=ar`, {
    headers: auth,
    data: {
      slug,
      title: 'صفحة تجربة النشر',
      blocks: [{ blockType: 'richText', title: 'تجربة', content: paragraph('فقرة تجريبية.') }],
      seo: { title: 'صفحة تجربة', description: 'صفحة تجريبية تُحذف بعد الفحص.' },
      _status: 'published',
    },
  });
  ok('publish: page created', created.status() === 201, String(created.status()));
  const id = (await created.json()).doc?.id;
  let live = 0;
  for (let i = 0; i < 20 && live !== 200; i++) {
    live = (await ctx.request.get(`${origin}/${slug}`)).status();
    if (live !== 200) await new Promise((r) => setTimeout(r, 3000));
  }
  ok('publish: the page answers 200 on the site', live === 200, String(live));
  if (id) {
    const del = await ctx.request.delete(`${API}/pages/${id}`, { headers: auth });
    ok('publish: page removed', del.status() === 200, String(del.status()));
  }
  const upload = await ctx.request.post(`${API}/media`, {
    headers: auth,
    multipart: {
      file: {
        name: `smoke-${Date.now()}.png`,
        mimeType: 'image/png',
        buffer: fs.readFileSync('public/images/logo/icon.png'),
      },
      _payload: JSON.stringify({ alt: 'صورة تجريبية', altEn: 'Smoke image' }),
    },
  });
  ok('upload: media created', upload.status() === 201, String(upload.status()));
  const media = (await upload.json()).doc;
  if (media?.url) {
    const served = await ctx.request.get(
      media.url.startsWith('http') ? media.url : `${origin}${media.url}`,
    );
    ok(
      'upload: file served',
      served.status() === 200,
      `${served.status()} ${media.url.slice(0, 60)}`,
    );
    const del = await ctx.request.delete(`${API}/media/${media.id}`, { headers: auth });
    ok('upload: media removed', del.status() === 200, String(del.status()));
  }
  await ctx.close();
} finally {
  await browser.close();
}
const failed = results.filter((r) => !r.pass).length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
