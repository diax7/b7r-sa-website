import { expect, type APIRequestContext, type Page, test } from '@playwright/test';
import { ADMIN, API, createEditor, hasAdmin, login, POLL, shows } from './helpers/cms';

/**
 * The Appearance global (spec 010, ADR-065): the outsider gets nothing, the screen works by
 * keyboard and passes axe in both languages at 1440 and 390, a failing colour is refused with
 * a sentence that says what to fix, and a saved change reaches every page. It mutates the
 * site's colours and typeface, so it runs in a project of its own after the other CMS suites,
 * one test at a time, and puts everything back in `finally`.
 */
test.describe.configure({ mode: 'serial' });
test.skip(!hasAdmin, 'The Appearance suite signs in as the admin (ADMIN_EMAIL, ADMIN_PASSWORD)');

const GLOBAL = `${API}/globals/appearance`;
const SCREEN = '/admin/globals/appearance';

type Stored = {
  sources: Record<string, string>;
  pins: unknown;
  typeface: string;
};

async function stored(request: APIRequestContext, auth: Record<string, string>): Promise<Stored> {
  const res = await request.get(`${GLOBAL}?depth=0`, { headers: auth });
  expect(res.status(), 'read the Appearance global').toBe(200);
  const { sources, pins, typeface } = (await res.json()) as Stored;
  return { sources, pins, typeface };
}

async function restore(request: APIRequestContext, auth: Record<string, string>, doc: Stored) {
  const res = await request.post(GLOBAL, { headers: auth, data: doc });
  expect(res.status(), `restore the Appearance global: ${await res.text()}`).toBe(200);
}

/** axe's serious and critical findings on our own surfaces of the screen. */
async function serious(page: Page): Promise<string[]> {
  const { AxeBuilder } = await import('@axe-core/playwright');
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .include('[data-admin-derived-strip]')
    .include('[data-admin-contrast-check]')
    .include('[data-admin-not-following]')
    .include('[data-admin-field="primary"]')
    .analyze();
  return results.violations
    .filter((v) => ['serious', 'critical'].includes(v.impact ?? ''))
    .map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
}

/** The header's language switch (ADR-056): the other name above 1024 px, the icon under it. */
async function switchPanelLanguage(page: Page, code: 'ar' | 'en') {
  const actions = page.locator('[data-admin-actions]');
  const name = actions.locator(`[data-admin-language] button[lang="${code}"]`);
  if (await name.isVisible()) await name.click();
  else await actions.locator('[data-admin-language-toggle]').click();
  await expect(page.locator('html')).toHaveAttribute('lang', code);
}

test('the outsider and an editor can neither read nor write the Appearance global', async ({
  playwright,
  request,
  baseURL,
}) => {
  const outsider = await playwright.request.newContext({ baseURL: baseURL! });
  try {
    expect([401, 403]).toContain((await outsider.get(`${GLOBAL}?depth=0`)).status());
    expect([401, 403]).toContain(
      (await outsider.post(GLOBAL, { data: { typeface: 'tajawal' } })).status(),
    );
  } finally {
    await outsider.dispose();
  }
  const adminAuth = await login(request, ADMIN);
  const before = await stored(request, adminAuth);
  const editor = await createEditor(request, adminAuth);
  const editorContext = await playwright.request.newContext({ baseURL: baseURL! });
  try {
    const editorAuth = await login(editorContext, editor);
    expect([401, 403]).toContain(
      (await editorContext.get(`${GLOBAL}?depth=0`, { headers: editorAuth })).status(),
    );
    expect([401, 403]).toContain(
      (
        await editorContext.post(GLOBAL, { headers: editorAuth, data: { typeface: 'tajawal' } })
      ).status(),
    );
    expect(await stored(request, adminAuth)).toEqual(before);
  } finally {
    await editorContext.dispose();
    await request.delete(`${API}/users/${editor.id}`, { headers: adminAuth });
  }
});

test('the screen: the pickers, the live strip, the contrast check, what does not follow; keyboard, and axe at 1440 and 390 in both languages', async ({
  page,
}) => {
  test.setTimeout(120_000);
  expect((await page.request.post(`${API}/users/login`, { data: ADMIN })).status()).toBe(200);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(SCREEN);

  const strip = page.locator('[data-admin-derived-strip]');
  await expect(strip.locator('[data-admin-derived]')).toHaveCount(6);
  await expect(page.locator('[data-admin-contrast-pair]')).toHaveCount(11);
  await expect(page.locator('[data-admin-contrast-summary]')).toHaveAttribute(
    'data-admin-contrast-summary',
    'pass',
  );
  await expect(page.locator('[data-admin-not-following-item]')).toHaveCount(8);
  const muted = strip.locator('[data-admin-derived="textMuted"]');
  await expect(muted).toHaveAttribute('data-admin-derived-state', 'designed');

  // Live: a new ink computes the secondary text; typing the ink back restores the designed
  // value, and nothing is lost on the way (the round trip the CTO's review caught).
  const ink = page.locator('[data-admin-color-text="sources.ink"]');
  const shippedInk = await ink.inputValue();
  await ink.fill('#1b1f27');
  await expect(muted).toHaveAttribute('data-admin-derived-state', 'computed');
  await ink.fill(shippedInk.toUpperCase());
  await expect(muted).toHaveAttribute('data-admin-derived-state', 'designed');
  await expect(muted).toContainText('#5b6470');
  await ink.fill(shippedInk);

  // Keyboard: Tab reaches the row's action, Enter sets it by hand, the ring shows.
  const setByHand = strip.locator('[data-admin-derived="border"] button', {
    hasText: 'Set it by hand',
  });
  await strip
    .locator('[data-admin-derived="ground"] button', { hasText: 'Set it by hand' })
    .focus();
  await page.keyboard.press('Tab');
  await expect(setByHand).toBeFocused();
  expect(await setByHand.evaluate((el) => getComputedStyle(el).outlineStyle)).toBe('solid');
  await page.keyboard.press('Enter');
  const border = strip.locator('[data-admin-derived="border"]');
  await expect(border).toHaveAttribute('data-admin-derived-state', 'byHand');
  // A hand-set colour that breaks nothing keeps the check green; the hairline has no pair.
  await expect(page.locator('[data-admin-contrast-summary]')).toHaveAttribute(
    'data-admin-contrast-summary',
    'pass',
  );
  await border.getByRole('button', { name: 'Reset it' }).press('Enter');
  // The hairline returns to its designed value: navy is still the shipped one.
  await expect(border).toHaveAttribute('data-admin-derived-state', 'designed');

  for (const language of ['en', 'ar'] as const) {
    if (language === 'ar') {
      await page.goto(SCREEN);
      await switchPanelLanguage(page, 'ar');
      await expect(page.locator('[data-admin-contrast-summary]')).toHaveText(
        'تنجح الأزواج كلها: يبقى الموقع مقروءاً بعد الحفظ.',
      );
    }
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await expect(strip).toBeVisible();
      expect(await serious(page), `axe: ${language} at ${width}`).toEqual([]);
      // Nothing of ours overflows the viewport sideways.
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `no sideways scroll at ${width} (${language})`).toBeLessThanOrEqual(0);
    }
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await switchPanelLanguage(page, 'en');
});

test('a colour that breaks a pair is refused on save, in a sentence that says what to change', async ({
  page,
  request,
}) => {
  const adminAuth = await login(request, ADMIN);
  const before = await stored(request, adminAuth);
  expect((await page.request.post(`${API}/users/login`, { data: ADMIN })).status()).toBe(200);
  await page.goto(SCREEN);
  const primary = page.locator('[data-admin-color-text="sources.primary"]');
  await primary.fill('#7fb2ff');
  // The check turns before the save: the editor sees every short pair at once.
  await expect(page.locator('[data-admin-contrast-summary]')).toHaveAttribute(
    'data-admin-contrast-summary',
    'fail',
  );
  await expect(page.locator('[data-admin-contrast-pair="buttonPrimary"]')).toHaveAttribute(
    'data-admin-contrast-verdict',
    'fail',
  );
  await page.locator('#action-save').click();
  const error = page.locator('[data-admin-field="primary"] [role="alert"]');
  await expect(error).toContainText('White text on the primary (the buttons, the bottom banner)');
  await expect(error).toContainText('needs 4.5:1. Choose a darker primary.');
  // Nothing was written.
  expect(await stored(request, adminAuth)).toEqual(before);
  // Through the API the same write answers 400 with the same sentence.
  const refused = await request.post(GLOBAL, {
    headers: adminAuth,
    data: { sources: { ...before.sources, primary: '#7fb2ff' } },
  });
  expect(refused.status()).toBe(400);
  expect(await refused.text()).toContain('Choose a darker primary');
  await primary.fill(before.sources['primary']!);
});

test('a saved colour and typeface reach every page: the static ones and a product page', async ({
  page,
  request,
}) => {
  test.setTimeout(120_000);
  const adminAuth = await login(request, ADMIN);
  const before = await stored(request, adminAuth);
  const products = await request.get(
    `${API}/products?limit=1&depth=0&where[_status][equals]=published`,
    { headers: adminAuth },
  );
  const slug = ((await products.json()) as { docs: Array<{ slug: string }> }).docs[0]?.slug;
  expect(slug, 'a published product').toBeTruthy();
  try {
    const res = await request.post(GLOBAL, {
      headers: adminAuth,
      data: { sources: { ...before.sources, primary: '#1a5caf' }, typeface: 'tajawal' },
    });
    expect(res.status(), await res.text()).toBe(200);
    for (const path of ['/', '/faq', `/products/${slug}`, '/en']) {
      await expect.poll(shows(request, path, '--color-primary:#1a5caf'), POLL).toBe(true);
    }
    const home = await (await request.get('/')).text();
    expect(home).toContain("--font-sans:'Tajawal', 'Tajawal Fallback'");
    expect(home).toContain('/fonts/Tajawal-Regular.woff2');
    expect(home).toContain('/fonts/Tajawal-Black.woff2');
    expect(home).not.toContain('/fonts/ITFRayatRound-Regular.woff2');
    await page.goto('/');
    const button = page.locator('main .bg-primary').first();
    await expect(button).toHaveCSS('background-color', 'rgb(26, 92, 175)');
    await expect(page.locator('body')).toHaveCSS('font-family', /^Tajawal, "Tajawal Fallback"/);
    // The panel follows the typeface too (decision 7), and only the typeface.
    expect((await page.request.post(`${API}/users/login`, { data: ADMIN })).status()).toBe(200);
    await page.goto('/admin');
    await expect(page.locator('body')).toHaveCSS('font-family', /^Tajawal, "Tajawal Fallback"/);
  } finally {
    await restore(request, adminAuth, before);
  }
  await expect
    .poll(shows(request, '/', `--color-primary:${before.sources['primary']}`), POLL)
    .toBe(true);
});

test('every curated typeface keeps the home page under the CLS budget', async ({
  page,
  request,
}) => {
  test.setTimeout(180_000);
  const adminAuth = await login(request, ADMIN);
  const before = await stored(request, adminAuth);
  // The regular file each family's page preloads (`src/modules/brand/typefaces.ts`).
  const regular = {
    rayat: 'ITFRayatRound-Regular',
    baloo: 'BalooBhaijaan2-Variable',
    plex: 'IBMPlexSansArabic-Regular',
    tajawal: 'Tajawal-Regular',
  };
  try {
    for (const [typeface, file] of Object.entries(regular)) {
      const res = await request.post(GLOBAL, { headers: adminAuth, data: { typeface } });
      expect(res.status(), await res.text()).toBe(200);
      await expect.poll(shows(request, '/', `/fonts/${file}.woff2`), POLL).toBe(true);
      // Locally the files arrive before the first paint and the fallback never shows; held
      // back 800 ms, the page paints in the fallback and swaps, which is what CLS measures.
      await page.route('**/fonts/*.woff2', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 800));
        await route.continue();
      });
      await page.goto('/', { waitUntil: 'load' });
      const shift = await page.evaluate(
        () =>
          new Promise<number>((resolve) => {
            let total = 0;
            new PerformanceObserver((list) => {
              for (const entry of list.getEntries() as Array<
                PerformanceEntry & { value: number; hadRecentInput: boolean }
              >) {
                if (!entry.hadRecentInput) total += entry.value;
              }
            }).observe({ type: 'layout-shift', buffered: true });
            void document.fonts.ready.then(() => setTimeout(() => resolve(total), 1_000));
          }),
      );
      test
        .info()
        .annotations.push({ type: 'cls', description: `${typeface}: ${shift.toFixed(4)}` });
      expect(shift, `CLS on the home page in ${typeface}`).toBeLessThanOrEqual(0.1);
      await page.unroute('**/fonts/*.woff2');
    }
  } finally {
    await restore(request, adminAuth, before);
  }
});
