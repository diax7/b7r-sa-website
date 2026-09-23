import { expect, type APIRequestContext, type Page, test } from '@playwright/test';
import sharp from 'sharp';
import { ADMIN, API, createEditor, hasAdmin, login, POLL } from './helpers/cms';

/**
 * A section's background (spec 010, phase 2): an editor picks a set for a home section in the
 * panel and the site paints it with its words; a page block takes one too; a key no set has is
 * refused, and so is deleting a set a section names; the picker passes axe at 1440 and 390 in
 * both languages. It writes the home global, a page and the Appearance global, so it runs in
 * a project of its own after the Appearance suite, one test at a time, and puts everything
 * back in `finally`.
 */
test.describe.configure({ mode: 'serial' });
test.skip(!hasAdmin, 'The suite signs in as the admin (ADMIN_EMAIL, ADMIN_PASSWORD)');

const HOME = `${API}/globals/home`;
const APPEARANCE = `${API}/globals/appearance`;
const INK = 'rgb(20, 24, 31)';
const WHITE = 'rgb(255, 255, 255)';
/** The home screen's FAQ tab: hero, strip, designer, steps, video, why us, reviews, stores, FAQ. */
const FAQ_TAB = 8;
const LONG = { ...POLL, timeout: 45_000 };

type Doc = Record<string, unknown> & { faq: Record<string, unknown> };

async function readHome(request: APIRequestContext, auth: Record<string, string>): Promise<Doc> {
  const res = await request.get(`${HOME}?depth=0&draft=true`, { headers: auth });
  expect(res.status()).toBe(200);
  return (await res.json()) as Doc;
}

function publishHome(request: APIRequestContext, auth: Record<string, string>, doc: Doc) {
  const { _status: _s, ...rest } = doc;
  return request.post(HOME, { headers: auth, data: { ...rest, _status: 'published' } });
}

/** The FAQ section's `data-surface` in the served home page. */
const faqSurface = (request: APIRequestContext) => async () =>
  /<section data-surface="([\w-]+)"[^>]*id="faq"/.exec(await (await request.get('/')).text())?.[1];

/** The home screen on the FAQ tab (Payload reopens the tab last left; a click before hydration is lost). */
async function openFaqTab(page: Page) {
  await page.goto('/admin/globals/home');
  const button = page.locator('.tabs-field__tab-button').nth(FAQ_TAB);
  await expect(async () => {
    await button.click();
    await expect(button).toHaveClass(/tabs-field__tab-button--active/, { timeout: 1_000 });
  }).toPass({ timeout: 20_000 });
  return page.locator('[data-admin-field="background"]').filter({ visible: true });
}

async function serious(page: Page, include: string): Promise<string[]> {
  const { AxeBuilder } = await import('@axe-core/playwright');
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .include(include)
    .analyze();
  return results.violations
    .filter((v) => ['serious', 'critical'].includes(v.impact ?? ''))
    .map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
}

/** The panel's language, through the header's switch (ADR-056). */
async function switchPanelLanguage(page: Page, code: 'ar' | 'en') {
  const actions = page.locator('[data-admin-actions]');
  const name = actions.locator(`[data-admin-language] button[lang="${code}"]`);
  if (await name.isVisible()) await name.click();
  else await actions.locator('[data-admin-language-toggle]').click();
  await expect(page.locator('html')).toHaveAttribute('lang', code);
}

/** The mean colour of a strip of the page, as `[r, g, b]`. */
async function meanColour(
  page: Page,
  clip: { x: number; y: number; width: number; height: number },
) {
  const { data, info } = await sharp(await page.screenshot({ clip }))
    .raw()
    .toBuffer({ resolveWithObject: true });
  const sum = [0, 0, 0];
  for (let i = 0; i < data.length; i += info.channels) {
    for (let c = 0; c < 3; c += 1) sum[c]! += data[i + c]!;
  }
  const pixels = data.length / info.channels;
  return sum.map((v) => v / pixels);
}

test('an editor gives the home FAQ Sea mist in the picker; the site paints it, words and all, and the ribbon’s wave shows it behind', async ({
  page,
  request,
}) => {
  test.setTimeout(150_000);
  const adminAuth = await login(request, ADMIN);
  const editor = await createEditor(request, adminAuth);
  const before = await readHome(request, adminAuth);
  try {
    expect(
      (await page.request.post(`${API}/users/login`, { data: editor })).status(),
      'the editor signs in',
    ).toBe(200);
    const picker = await openFaqTab(page);
    // The editor reads a library only the admin can edit: the sets arrive through the picker.
    const choice = picker.locator('[data-admin-choice="sea-mist"]');
    await expect(picker.locator('[data-admin-choice=""]')).toHaveAttribute('aria-checked', 'true');
    await choice.click();
    await expect(choice).toHaveAttribute('aria-checked', 'true');
    await page.locator('.doc-controls #action-save').click();
    await expect.poll(faqSurface(request), LONG).toBe('sea-mist');

    await page.goto('/');
    const faq = page.locator('#faq');
    await faq.scrollIntoViewIfNeeded();
    await expect(faq).toHaveCSS('background-color', 'rgb(187, 208, 217)');
    await expect(faq).toHaveCSS('background-image', /radial-gradient/);
    await expect(page.locator('#faq-title')).toHaveCSS('color', INK);
    expect(await serious(page, '#faq')).toEqual([]);
    // The ribbon's top strip is see-through but for its wave: just above the wave, the strip
    // shows the FAQ's own field, not a solid colour of the ribbon's.
    const ribbon = page.locator('section[aria-labelledby="cta-ribbon-title"]');
    await ribbon.scrollIntoViewIfNeeded();
    const box = (await ribbon.boundingBox())!;
    const inStrip = await meanColour(page, { x: box.x + 40, y: box.y + 1, width: 200, height: 2 });
    const aboveIt = await meanColour(page, { x: box.x + 40, y: box.y - 3, width: 200, height: 2 });
    for (let c = 0; c < 3; c += 1) {
      expect(Math.abs(inStrip[c]! - aboveIt[c]!), `channel ${c}`).toBeLessThan(12);
    }
  } finally {
    expect((await publishHome(request, adminAuth, before)).status()).toBe(200);
    await request.delete(`${API}/users/${editor.id}`, { headers: adminAuth });
  }
  await expect.poll(faqSurface(request), LONG).not.toBe('sea-mist');
});

test('the picker: the section’s own first, every set as a swatch, keyboard, and axe at 1440 and 390 in both languages', async ({
  page,
}) => {
  test.setTimeout(120_000);
  expect((await page.request.post(`${API}/users/login`, { data: ADMIN })).status()).toBe(200);
  for (const language of ['en', 'ar'] as const) {
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 900 });
      const picker = await openFaqTab(page);
      await switchPanelLanguage(page, language);
      const choices = picker.locator('[role="radio"]');
      await expect(choices.first()).toHaveAttribute('data-admin-choice', '');
      for (const key of ['surface', 'ground', 'deep-sea', 'sea-mist']) {
        await expect(picker.locator(`[data-admin-choice="${key}"]`)).toBeVisible();
      }
      // Every choice is a button in the tab order, with a ring when the keyboard reaches it.
      await choices.first().focus();
      await page.keyboard.press('Tab');
      await expect(choices.nth(1)).toBeFocused();
      expect(await choices.nth(1).evaluate((el) => getComputedStyle(el).boxShadow)).not.toBe(
        'none',
      );
      expect(
        await serious(page, '[data-admin-field="background"]'),
        `${language} ${width}`,
      ).toEqual([]);
    }
  }
  await switchPanelLanguage(page, 'en');
});

test('a page block takes a set, and only that block changes', async ({ page, request }) => {
  test.setTimeout(120_000);
  const auth = await login(request, ADMIN);
  const found = await request.get(
    `${API}/pages?depth=0&limit=1&where[slug][equals]=about&draft=true`,
    { headers: auth },
  );
  const about = ((await found.json()) as { docs: Array<Record<string, unknown>> }).docs[0]!;
  const blocks = about['blocks'] as Array<Record<string, unknown>>;
  expect(blocks.length).toBeGreaterThan(1);
  const save = (next: Array<Record<string, unknown>>) =>
    request.patch(`${API}/pages/${String(about['id'])}`, {
      headers: auth,
      data: { blocks: next, _status: 'published' },
    });
  const surfaces = async () =>
    [
      ...(await (await request.get('/about')).text()).matchAll(
        /<section data-surface="([\w-]+)"[^>]*data-block=/g,
      ),
    ].map((m) => m[1]);
  const designed = await surfaces();
  try {
    const picked = blocks.map((block, i) =>
      i === 1 ? { ...block, background: 'deep-sea' } : block,
    );
    expect((await save(picked)).status()).toBe(200);
    await expect
      .poll(surfaces, LONG)
      .toEqual(designed.map((tone, i) => (i === 1 ? 'deep-sea' : tone)));
    await page.goto('/about');
    // The section's own words turn white; a card inside keeps the page's ink.
    const section = page.locator('section[data-surface="deep-sea"]');
    await expect(section).toHaveCSS('background-color', 'rgb(10, 47, 94)');
    await expect(section).toHaveCSS('color', WHITE);
  } finally {
    expect((await save(blocks)).status()).toBe(200);
  }
  await expect.poll(surfaces, LONG).toEqual(designed);
});

test('a key no set has is refused; a saved set keeps its key; a deleted set leaves its sections their own background, and the picker says so', async ({
  page,
  request,
}) => {
  test.setTimeout(150_000);
  const auth = await login(request, ADMIN);
  const home = await readHome(request, auth);
  const designed = await faqSurface(request)();
  const appearance = (await (
    await request.get(`${APPEARANCE}?depth=0`, { headers: auth })
  ).json()) as Record<string, unknown>;
  const { id: _id, globalType: _g, updatedAt: _u, createdAt: _c, ...stored } = appearance;
  // Saved as read, so the library is stored with its row ids.
  expect((await request.post(APPEARANCE, { headers: auth, data: stored })).status()).toBe(200);
  const saved = (await (await request.get(`${APPEARANCE}?depth=0`, { headers: auth })).json()) as {
    surfaces: Array<Record<string, unknown>>;
  };
  try {
    const unknown = await publishHome(request, auth, {
      ...home,
      faq: { ...home.faq, background: 'no-such-set' },
    });
    expect(unknown.status()).toBe(400);
    expect(await unknown.text()).toContain('No background has the key “no-such-set”');

    const rekeyed = await request.post(APPEARANCE, {
      headers: auth,
      data: { ...stored, surfaces: saved.surfaces.map((row) => ({ ...row, key: 'mist' })) },
    });
    expect(rekeyed.status()).toBe(400);
    expect(await rekeyed.text()).toContain('A saved background keeps its key');

    const named = await publishHome(request, auth, {
      ...home,
      faq: { ...home.faq, background: 'sea-mist' },
    });
    expect(named.status()).toBe(200);
    await expect.poll(faqSurface(request), LONG).toBe('sea-mist');
    const deleted = await request.post(APPEARANCE, {
      headers: auth,
      data: { ...stored, surfaces: [] },
    });
    expect(deleted.status(), await deleted.text()).toBe(200);
    // The FAQ goes back to the background it was designed with, never a blank one.
    await expect.poll(faqSurface(request), LONG).toBe(designed);
    expect((await page.request.post(`${API}/users/login`, { data: ADMIN })).status()).toBe(200);
    const picker = await openFaqTab(page);
    await expect(picker.locator('[data-admin-background-gone]')).toContainText('“sea-mist”');
  } finally {
    expect((await publishHome(request, auth, home)).status()).toBe(200);
    expect((await request.post(APPEARANCE, { headers: auth, data: stored })).status()).toBe(200);
  }
});
