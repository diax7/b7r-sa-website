import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import { signPreview } from '../src/lib/preview-token';
import { riyadh } from '../src/lib/riyadh';
import {
  ADMIN,
  API,
  createEditor,
  hasAdmin,
  login,
  mockConnectionId,
  POLL,
  shows,
} from './helpers/cms';

/**
 * The CMS from three seats (BRD 9.3, 9.6, ADR-028): the admin who signs in through the
 * Arabic RTL panel, the editor who must be refused users and settings, and the outsider
 * holding no credential at all. Needs the admin created by `pnpm admin:create`
 * (ADMIN_EMAIL / ADMIN_PASSWORD); skipped without them.
 */
declare global {
  interface Window {
    __cspViolations?: string[];
  }
}

/** Array rows carry their own ids; a copied document must not reuse them. */
const withoutRowIds = (rows: unknown) =>
  Array.isArray(rows) ? rows.map(({ id: _row, ...row }: Record<string, unknown>) => row) : rows;

type Box = { x: number; y: number; width: number; height: number };

/** Two boxes that share no pixel. */
const disjoint = (a: Box, b: Box) =>
  a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y;

/** How far the document could scroll sideways: zero on a page that fits its screen. */
const sidewaysOverflow = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

/** The id of the first document of a collection, read with the admin's token. */
async function firstDocId(request: APIRequestContext, auth: Record<string, string>, slug: string) {
  const res = await request.get(`${API}/${slug}?limit=1&depth=0`, { headers: auth });
  expect(res.status(), `${slug} list`).toBe(200);
  const { docs } = (await res.json()) as { docs: Array<{ id: number }> };
  expect(docs[0], `a ${slug} document`).toBeDefined();
  return docs[0]!.id;
}

async function recordViolations(page: Page) {
  await page.addInitScript(() => {
    window.__cspViolations = [];
    document.addEventListener('securitypolicyviolation', (e) => {
      window.__cspViolations?.push(`${e.violatedDirective} ${e.blockedURI}`);
    });
  });
}

type HomeDoc = {
  ribbon: { lead: string };
  whyUs: { enabled?: boolean };
  _status?: string;
};

async function readHome(request: APIRequestContext, auth: Record<string, string>) {
  const res = await request.get(`${API}/globals/home?depth=0&draft=true`, { headers: auth });
  expect(res.status()).toBe(200);
  return (await res.json()) as HomeDoc & Record<string, unknown>;
}

function saveHome(
  request: APIRequestContext,
  auth: Record<string, string>,
  doc: HomeDoc,
  status: 'published' | 'draft',
) {
  const { _status: _s, ...rest } = doc as Record<string, unknown>;
  return request.post(`${API}/globals/home${status === 'draft' ? '?draft=true' : ''}`, {
    headers: auth,
    data: { ...rest, _status: status },
  });
}

/** A one-paragraph Lexical editor state, as the admin would save it (RTL). */
const paragraph = (text: string) => ({
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
        textStyle: '',
        children: [
          { type: 'text', text, format: 0, detail: 0, mode: 'normal', style: '', version: 1 },
        ],
      },
    ],
  },
});

/** A Lexical inline run: text, or a link around text. */
const run = (t: string) => ({
  type: 'text',
  text: t,
  format: 0,
  detail: 0,
  mode: 'normal',
  style: '',
  version: 1,
});
const link = (url: string, t: string) => ({
  type: 'link',
  version: 3,
  format: '',
  indent: 0,
  direction: 'rtl',
  fields: { linkType: 'custom', url, newTab: false },
  children: [run(t)],
});
const block = (type: 'paragraph' | 'heading', children: unknown[], tag?: 'h2') => ({
  type,
  ...(tag ? { tag } : {}),
  format: '',
  indent: 0,
  version: 1,
  direction: 'rtl',
  ...(type === 'paragraph' ? { textFormat: 0, textStyle: '' } : {}),
  children,
});
/** A post body with three H2s and the internal links the editorial rules ask for. */
const postBody = (extra: unknown[] = []) => ({
  root: {
    type: 'root',
    format: '',
    indent: 0,
    version: 1,
    direction: 'rtl',
    children: [
      block('paragraph', [run('مقدمة قصيرة عن الموضوع.')]),
      block('heading', [run('ما الفكرة؟')], 'h2'),
      block('paragraph', [run('اقرأ '), link('/how-it-works', 'كيف تعمل الخدمة'), run('.')]),
      block('heading', [run('كيف أبدأ؟')], 'h2'),
      block('paragraph', [run('ابدأ من '), link('/products', 'المنتجات'), run('.')]),
      block('heading', [run('ماذا بعد؟')], 'h2'),
      block('paragraph', [run('جرّب ثم عدّل.')]),
      ...extra,
    ],
  },
});

/** An English body for the translation pair (ADR-043): two internal links, one Arabic paragraph. */
const englishBody = () => ({
  root: {
    type: 'root',
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr',
    children: [
      block('paragraph', [run('A short introduction to the topic.')]),
      block('heading', [run('What is the idea?')], 'h2'),
      block('paragraph', [
        run('Read '),
        link('/en/how-it-works', 'how the service works'),
        run('.'),
      ]),
      block('paragraph', [
        run('ابدأ من '),
        link('/en/products', 'المنتجات'),
        run(' قبل أي شيء آخر.'),
      ]),
    ],
  },
});

test.describe('CMS admin', () => {
  // One admin account: parallel logins race on its sessions list (a later login can drop an
  // earlier session's id), and the publish test mutates shared content.
  test.describe.configure({ mode: 'serial' });
  test.skip(!hasAdmin, 'ADMIN_EMAIL / ADMIN_PASSWORD unset');
  const admin = ADMIN;

  // The suite owns its starting state: a stray autosave draft on `home` (an admin session
  // left open mid-edit) would make every home publish below a 400. Republish the live doc.
  test.beforeAll(async ({ request }) => {
    const auth = await login(request, admin);
    const live = await request.get(`${API}/globals/home?depth=0&draft=false`, { headers: auth });
    if (live.status() !== 200) return;
    const { _status, updatedAt, createdAt, globalType, id, ...data } =
      (await live.json()) as Record<string, unknown>;
    void _status;
    void updatedAt;
    void createdAt;
    void globalType;
    void id;
    const res = await request.post(`${API}/globals/home?depth=0`, {
      headers: auth,
      data: { ...data, _status: 'published' },
    });
    expect(res.status(), 'home reset').toBe(200);
  });

  test('the panel and its API are noindex, uncached and under the admin CSP', async ({
    request,
  }) => {
    for (const path of ['/admin/login', `${API}/users/me`]) {
      const res = await request.get(path);
      const headers = res.headers();
      expect(headers['x-robots-tag'], path).toBe('noindex, nofollow');
      expect(headers['cache-control'], path).toContain('no-store');
      const csp = headers['content-security-policy'] ?? '';
      expect(csp, path).toContain("default-src 'self'");
      expect(csp, path).not.toContain('googletagmanager');
      expect(csp, path).toContain('https://challenges.cloudflare.com');
    }
    const sitemap = await (await request.get('/sitemap.xml')).text();
    expect(sitemap).not.toContain('/admin');
  });

  test('signs in on an English panel whose Arabic content reads right-to-left, without a CSP violation', async ({
    page,
    request,
  }) => {
    await recordViolations(page);
    await page.goto('/admin/login');
    const html = page.locator('html');
    await expect(html).toHaveAttribute('lang', 'en');
    await expect(html).toHaveAttribute('dir', /ltr/i);
    // The login gate (ADR-034): the widget renders with a site key and opens the gate; the
    // verify endpoint answers 204 with no cookie while the Turnstile secret is unset.
    if (process.env['NEXT_PUBLIC_TURNSTILE_SITE_KEY']) {
      await expect(page.locator('[data-login-turnstile]')).toBeAttached();
      await expect(page.locator('[data-login-turnstile="ok"]')).toBeAttached({ timeout: 20_000 });
    }
    const gate = await request.post('/api/turnstile/login', {
      data: { token: 'x' },
      headers: { Origin: new URL(page.url()).origin },
    });
    expect(gate.status()).toBe(204);
    await page.locator('#field-email').fill(admin.email);
    await page.locator('#field-password').fill(admin.password);
    await page.locator('form button[type="submit"]').click();
    await page.waitForURL(/\/admin\/?$/);
    await page.goto('/admin/collections/products');
    await page
      .getByRole('link', { name: /هودي|Hoodie/ })
      .first()
      .click();
    await page.waitForURL(/\/admin\/collections\/products\/\d+/);
    // The slug sits in the Basics tab (the product's tabs run in site order, photos first).
    await page.locator('.tabs-field__tab-button', { hasText: 'Basics' }).click();
    await expect(page.locator('#field-slug')).toHaveValue(/\w+/);
    // The pages editor: the About document opens with its blocks in place, and a rich-text
    // block's Lexical editor follows the text it holds (`unicode-bidi: plaintext`, ADR-039), so
    // Arabic reads right-to-left inside the English panel.
    const auth = await login(request, admin);
    const about = await request.get(`${API}/pages?where[slug][equals]=about&depth=0`, {
      headers: auth,
    });
    const aboutId = ((await about.json()) as { docs: Array<{ id: number }> }).docs[0]?.id;
    expect(aboutId).toBeDefined();
    await page.goto(`/admin/collections/pages/${aboutId}`);
    await expect(page.locator('#field-slug')).toHaveValue('about');
    await expect(page.getByRole('textbox', { name: /Story heading/ })).toHaveValue(/حكاية/);
    await page.goto('/admin/collections/pages/create');
    await page.getByRole('button', { name: /أضف قسم|Add Section/ }).click();
    await page
      .getByRole('button', { name: /نص منسّق|Rich text/ })
      .first()
      .click();
    const editor = page.locator('[data-lexical-editor="true"]').first();
    await expect(editor).toBeVisible({ timeout: 15_000 });
    expect(await editor.evaluate((el) => getComputedStyle(el).unicodeBidi)).toBe('plaintext');
    expect(
      await page.locator('#field-title').evaluate((el) => getComputedStyle(el).unicodeBidi),
    ).toBe('plaintext');
    expect(await page.evaluate(() => window.__cspViolations ?? [])).toEqual([]);
    // Autosave turns the open create form into an empty draft document: remove it.
    await page.goto('/admin');
    const drafts = await request.get(
      `${API}/pages?where[and][0][slug][exists]=false&where[and][1][_status][equals]=draft&draft=true&depth=0&limit=50`,
      { headers: auth },
    );
    for (const doc of ((await drafts.json()) as { docs: Array<{ id: number }> }).docs) {
      await request.delete(`${API}/pages/${doc.id}`, { headers: auth });
    }
  });

  test('the shell (ADR-039, ADR-058): the dashboard entry, group rows, the active bar, the keyboard model, the rail and its flyout, one breakpoint, the drawer, the palette, the account menu', async ({
    page,
    browser,
    request,
  }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 1600, height: 900 });
    expect((await page.request.post(`${API}/users/login`, { data: admin })).status()).toBe(200);
    // Start from an open sidebar with every group open (the `nav` preference is per user).
    const adminAuth = await login(request, admin);
    expect(
      (
        await request.post(`${API}/payload-preferences/nav`, {
          headers: adminAuth,
          data: { value: { open: true, groups: {} } },
        })
      ).status(),
    ).toBe(200);
    await page.goto('/admin/collections/pages');
    const nav = page.locator('[data-admin-nav]');
    await expect(nav).toHaveClass(/nav--nav-open/);
    // axe on OUR surfaces (Payload's own edit-view chrome has known gaps: unnamed drag handles
    // and popup buttons, its engine, not the shell).
    const { AxeBuilder } = await import('@axe-core/playwright');
    const serious = async (...include: string[]) => {
      let builder = new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']);
      for (const sel of include) builder = builder.include(sel);
      return (await builder.analyze()).violations
        .filter((v) => ['serious', 'critical'].includes(v.impact ?? ''))
        .map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
    };
    // Every entity link carries its icon; the current section is marked.
    const links = nav.locator('a[id^="nav-"]');
    expect(await links.count()).toBeGreaterThanOrEqual(12);
    for (const entry of await links.all()) await expect(entry.locator('svg')).toHaveCount(1);
    await expect(nav.locator('a[aria-current="page"]')).toHaveText(/Pages/);
    // A sidebar click navigates inside the app: the page is not reloaded.
    await page.evaluate(() => {
      (window as unknown as { b7rMarker?: number }).b7rMarker = 1;
    });
    await nav.locator('#nav-products').click();
    await page.waitForURL(/\/admin\/collections\/products/);
    expect(await page.evaluate(() => (window as unknown as { b7rMarker?: number }).b7rMarker)).toBe(
      1,
    );
    await expect(nav.locator('a[aria-current="page"]')).toHaveText(/Products/);
    await page.goto('/admin/collections/pages');
    // The five task groups in order, each with its hue (ADR-046); the home page first in Site.
    await expect(nav.locator('[data-admin-group]')).toHaveText([
      /Site/,
      /Catalogue/,
      /Blog/,
      /Visibility/,
      /Admin/,
    ]);
    const groupHues = await nav
      .locator('[data-admin-group]')
      .evaluateAll((els) => els.map((el) => el.getAttribute('data-hue')));
    expect(groupHues).toEqual(['blue', 'teal', 'violet', 'pink', 'slate']);
    await expect(nav.locator('[data-admin-group="Site"] a[id^="nav-"]').first()).toHaveAttribute(
      'id',
      'nav-global-home',
    );
    // Secondary entries sit under their parent; the engine is a section inside Blog; no
    // entry shows a document count, a badge only asks for action (red or amber); the
    // active entry wears its group's hue; the dashboard is a real entry, active on /admin.
    await expect(nav.locator('#nav-categories')).toHaveAttribute('data-admin-entry', 'secondary');
    await expect(
      nav.locator('[data-admin-group="Blog"] [data-admin-section="engine"] #nav-ai-topics'),
    ).toBeVisible();
    await expect(nav.locator('[data-admin-count]')).toHaveCount(0);
    for (const badge of await nav.locator('[data-admin-badge]').all()) {
      await expect(badge).toHaveAttribute('data-admin-badge', /^(error|warning)$/);
      await expect(badge).toHaveText(/^\d+/);
    }
    await expect(nav.locator('a[aria-current="page"]')).toHaveAttribute('data-hue', 'blue');
    await expect(nav.locator('#nav-dashboard')).not.toHaveAttribute('aria-current', 'page');
    await page.goto('/admin');
    await expect(nav.locator('#nav-dashboard')).toHaveAttribute('aria-current', 'page');
    await page.goto('/admin/collections/pages');
    // A group row is a button with aria-expanded owning a role="group" labelled by it; the
    // whole row toggles, and a collapsed group stays collapsed across a reload (the `nav` pref).
    const visibilityGroup = () => page.locator('[data-admin-group="Visibility"]');
    const visibilityToggle = () => visibilityGroup().locator('[data-admin-group-toggle]');
    await expect(visibilityToggle()).toHaveAttribute('aria-expanded', 'true');
    const toggleId = await visibilityToggle().getAttribute('id');
    await expect(
      visibilityGroup().locator(`[role="group"][aria-labelledby="${toggleId}"]`),
    ).toBeVisible();
    expect((await visibilityToggle().boundingBox())!.height).toBe(40);
    expect((await nav.locator('#nav-pages').boundingBox())!.height).toBe(36);
    expect((await nav.locator('#nav-categories').boundingBox())!.height).toBe(32);
    await visibilityToggle().click();
    await expect(visibilityToggle()).toHaveAttribute('aria-expanded', 'false');
    await expect(visibilityGroup().locator('#nav-redirects')).toBeHidden();
    await expect
      .poll(async () => {
        const res = await request.get(`${API}/payload-preferences/nav`, { headers: adminAuth });
        return ((await res.json()) as { value?: { groups?: Record<string, { open?: boolean }> } })
          .value?.groups?.['visibility']?.open;
      })
      .toBe(false);
    await page.reload();
    await expect(page.locator('[data-admin-nav]')).toHaveClass(/nav--nav-open/);
    await expect(visibilityGroup().locator('#nav-redirects')).toBeHidden();
    await visibilityToggle().click();
    await expect(visibilityGroup().locator('#nav-redirects')).toBeVisible();
    // The active entry's group is forced open: close Site here, open Home (in Site), and the
    // group is open again with Home marked.
    await page.locator('[data-admin-group="Site"] [data-admin-group-toggle]').click();
    await expect(nav.locator('#nav-pages')).toBeHidden();
    await page.goto('/admin/globals/home');
    await expect(nav.locator('#nav-global-home')).toHaveAttribute('aria-current', 'page');
    await page.goto('/admin/collections/pages');
    // The keyboard model: one tab stop on the current entry; arrows, Home, End and a typed
    // letter move between rows; Enter toggles a group; Tab leaves the tree.
    const focusedRow = () =>
      page.evaluate(() => (document.activeElement as HTMLElement | null)?.dataset['adminRow']);
    await expect(nav.locator('#nav-pages')).toHaveAttribute('tabindex', '0');
    await expect(nav.locator('#nav-global-home')).toHaveAttribute('tabindex', '-1');
    await nav.locator('#nav-pages').focus();
    await page.keyboard.press('ArrowDown');
    expect(await focusedRow()).toBe('globals:site-settings');
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowUp');
    expect(await focusedRow()).toBe('globals:home');
    await page.keyboard.press('Home');
    expect(await focusedRow()).toBe('dashboard');
    await page.keyboard.press('p');
    expect(await focusedRow()).toBe('collections:pages');
    await page.keyboard.press('p');
    expect(await focusedRow()).toBe('collections:products');
    await page.keyboard.press('End');
    expect(await focusedRow()).toBe('collections:connections');
    await page.keyboard.press('Home');
    await page.keyboard.press('ArrowDown');
    expect(await focusedRow()).toBe('group:site');
    await page.keyboard.press('Enter');
    await expect(
      page.locator('[data-admin-group="Site"] [data-admin-group-toggle]'),
    ).toHaveAttribute('aria-expanded', 'false');
    await page.keyboard.press('Space');
    await expect(
      page.locator('[data-admin-group="Site"] [data-admin-group-toggle]'),
    ).toHaveAttribute('aria-expanded', 'true');
    await nav.locator('#nav-pages').focus();
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-admin-collapse]')).toBeFocused();
    // The page header (the description slot): the entity's disc and bar in its hue, where the
    // thing shows on the site, and the public listing on a list view.
    const header = page.locator('[data-admin-header="pages"]');
    await expect(header).toHaveAttribute('data-hue', 'blue');
    await expect(header.locator('[data-admin-shows]')).toContainText(/Shows on:/);
    await page.goto('/admin/collections/products');
    await expect(page.locator('[data-admin-header="products"]')).toHaveAttribute(
      'data-hue',
      'teal',
    );
    await expect(
      page.locator('[data-admin-header="products"] [data-admin-listing]'),
    ).toHaveAttribute('href', '/products');
    await page.goto('/admin/globals/home');
    await expect(page.locator('[data-admin-header="home"] [data-admin-sections-on]')).toHaveText(
      /10 sections, \d+ on/,
    );
    await page.goto('/admin/collections/pages');
    // Collapsed on a desktop the sidebar is the 64 px rail of groups: the dashboard's icon,
    // the five group icons (the active group with the bar) and the avatar; a click on a
    // group opens its flyout with focus inside, Esc closes it and hands focus back. The
    // state survives a reload; the one button at the foot brings the tree back.
    await page.locator('[data-admin-collapse]').click();
    await expect(nav).toHaveAttribute('data-admin-rail', '');
    await expect(nav.locator('#nav-pages')).toBeHidden();
    await expect(nav.locator('[data-admin-rail-group]')).toHaveCount(5);
    await expect(nav.locator('[data-admin-rail-dashboard]')).toBeVisible();
    await expect(nav.locator('[data-admin-account]')).toBeVisible();
    expect(Math.round((await nav.boundingBox())!.width)).toBe(64);
    await nav.locator('[data-admin-rail-group="Site"]').click();
    const flyout = page.locator('[data-admin-flyout="Site"]');
    await expect(flyout).toBeVisible();
    expect(Math.round((await flyout.boundingBox())!.width)).toBe(224);
    await expect(flyout.locator('[data-admin-flyout-entry="pages"]')).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(flyout.locator('[role="menuitem"]')).toHaveCount(4);
    expect(
      await page.evaluate(() => document.activeElement?.closest('[data-admin-flyout]') !== null),
    ).toBe(true);
    await page.keyboard.press('ArrowDown');
    await expect(flyout.locator('[data-admin-flyout-entry="home"]')).toBeFocused();
    expect(
      await serious('[data-admin-nav]', '[data-admin-flyout]'),
      'axe: the rail with a flyout open',
    ).toEqual([]);
    await page.keyboard.press('Escape');
    await expect(flyout).toBeHidden();
    await expect(nav.locator('[data-admin-rail-group="Site"]')).toBeFocused();
    // The collapse writes the `nav` preference; wait for it before the reload reads it.
    await expect
      .poll(async () => {
        const res = await request.get(`${API}/payload-preferences/nav`, { headers: adminAuth });
        return ((await res.json()) as { value?: { open?: boolean } }).value?.open;
      })
      .toBe(false);
    await page.reload();
    await expect(page.locator('[data-admin-nav]')).toHaveAttribute('data-admin-rail', '');
    // One breakpoint: a 1440 px laptop is a desktop like 1600, the rail and the button stay,
    // no hamburger.
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.reload();
    await expect(page.locator('[data-admin-nav]')).toHaveAttribute('data-admin-rail', '');
    await expect(page.locator('[data-admin-menu]')).toBeHidden();
    await page.locator('[data-admin-expand]').click();
    await expect(nav).toHaveClass(/nav--nav-open/);
    await expect(nav.locator('#nav-pages')).toContainText(/Pages/);
    expect(Math.round((await nav.boundingBox())!.width)).toBe(264);
    await expect
      .poll(async () => {
        const res = await request.get(`${API}/payload-preferences/nav`, { headers: adminAuth });
        return ((await res.json()) as { value?: { open?: boolean } }).value?.open;
      })
      .toBe(true);
    await page.reload();
    await expect(nav).toHaveClass(/nav--nav-open/);
    await expect(nav.locator('#nav-pages')).toBeVisible();
    await page.setViewportSize({ width: 1600, height: 900 });
    // The header: a 240 px search box and the site link, both with text on a desktop;
    // Payload's avatar is gone (our account block is the one door).
    await expect(page.locator('[data-admin-palette-trigger]')).toContainText(/Search or jump/);
    expect(
      Math.round((await page.locator('[data-admin-palette-trigger]').boundingBox())!.width),
    ).toBe(240);
    await expect(page.locator('[data-admin-view-site]')).toContainText(/View website/);
    await expect(page.locator('.app-header__account')).toBeHidden();
    // The palette: Ctrl+K, a document by title, Enter opens it.
    await page.keyboard.press('Control+k');
    const palette = page.locator('[data-admin-palette]');
    await expect(palette).toBeVisible();
    await page.keyboard.type('سياسة');
    await expect(palette.getByRole('option', { name: /سياسة الخصوصية/ })).toBeVisible({
      timeout: 10_000,
    });
    expect(await serious('[data-admin-palette]', '.app-header'), 'axe: palette open').toEqual([]);
    await page.keyboard.press('Enter');
    await page.waitForURL(/\/admin\/collections\/pages\/\d+/);
    await expect(page.locator('#field-slug')).toHaveValue('privacy');
    // The account menu at the foot of the sidebar.
    await page.locator('[data-admin-account]').click();
    await expect(page.getByRole('menuitem', { name: /Log out/ })).toBeVisible();
    await page.keyboard.press('Escape');
    // Radix hides the rest of the page from assistive tech while a menu is open; wait for it
    // to be gone before the audit.
    await expect(page.getByRole('menuitem', { name: /Log out/ })).toHaveCount(0);
    await expect(page.locator('body > [aria-hidden="true"]')).toHaveCount(0);
    // The locale note (ADR-044) sits in the document controls of this localized page.
    await expect(page.locator('[data-admin-locale-note]')).toContainText('Editing the Arabic');
    await expect(page.locator('label[for="field-title"] .localized')).toHaveCount(1);
    await expect(page.locator('label[for="field-slug"] .localized')).toHaveCount(0);
    expect(
      await serious(
        '[data-admin-nav]',
        '.app-header',
        '[data-admin-locale-note]',
        '[data-admin-header]',
      ),
      'axe: shell on an edit view',
    ).toEqual([]);
    // An editor never sees the settings entries.
    const editor = await createEditor(request, adminAuth);
    const editorContext = await browser.newContext({ viewport: { width: 1600, height: 900 } });
    try {
      const editorPage = await editorContext.newPage();
      expect((await editorPage.request.post(`${API}/users/login`, { data: editor })).status()).toBe(
        200,
      );
      await editorPage.goto('/admin');
      const editorNav = editorPage.locator('[data-admin-nav]');
      await expect(editorNav.locator('#nav-pages')).toBeVisible();
      await expect(editorNav.locator('#nav-redirects')).toHaveCount(0);
      await expect(editorNav.locator('#nav-global-site-settings')).toHaveCount(0);
      await expect(editorNav.locator('[data-admin-group="Visibility"]')).toHaveCount(0);
      // Users stays (an editor opens their own account), so Admin still lists it.
      await expect(editorNav.locator('[data-admin-group="Admin"] #nav-users')).toBeVisible();
    } finally {
      await editorContext.close();
      await request.delete(`${API}/users/${editor.id}`, { headers: adminAuth });
    }
    // At 1024 px and under the sidebar is a drawer over the page: the hamburger opens it,
    // focus lands on its X, the X, Esc or a tap outside closes it and focus comes back; the
    // full tree at 44 px rows, the language switch at the foot, no collapse control.
    await page.setViewportSize({ width: 1024, height: 800 });
    await page.goto('/admin/collections/pages');
    await expect(nav).not.toHaveClass(/nav--nav-open/);
    await expect(page.locator('[data-admin-collapse]')).toBeHidden();
    const menu = page.locator('[data-admin-menu]');
    await expect(menu).toBeVisible();
    await expect(menu).toHaveAttribute('aria-label', 'Open the menu');
    await expect(menu).toHaveAttribute('aria-expanded', 'false');
    // Icon-only at this width, the two header controls keep their labels.
    await expect(page.locator('[data-admin-palette-trigger]')).toHaveAttribute(
      'aria-label',
      /Search or jump/,
    );
    await expect(page.locator('[data-admin-view-site]')).toHaveAttribute(
      'aria-label',
      'View website',
    );
    await menu.click();
    await expect(nav).toHaveClass(/nav--nav-open/);
    await expect(menu).toHaveAttribute('aria-expanded', 'true');
    await expect(menu).toHaveAttribute('aria-label', 'Close the menu');
    await expect(nav.locator('[data-admin-menu-close]')).toBeFocused();
    await expect(nav.locator('#nav-pages')).toBeVisible();
    expect((await nav.locator('#nav-pages').boundingBox())!.height).toBe(44);
    expect(Math.round((await nav.boundingBox())!.width)).toBe(320);
    await expect(nav.locator('[data-admin-language] [aria-pressed="true"]')).toHaveText('English');
    await expect(nav.locator('[data-admin-toggle]')).toBeHidden();
    expect(await serious('[data-admin-nav]'), 'axe: the drawer open').toEqual([]);
    await nav.locator('[data-admin-menu-close]').click();
    await expect(nav).not.toHaveClass(/nav--nav-open/);
    await expect(menu).toBeFocused();
    await menu.click();
    await expect(nav).toHaveClass(/nav--nav-open/);
    await page.keyboard.press('Escape');
    await expect(nav).not.toHaveClass(/nav--nav-open/);
    await expect(menu).toBeFocused();
    await menu.click();
    await expect(nav).toHaveClass(/nav--nav-open/);
    await page.mouse.click(900, 600);
    await expect(nav).not.toHaveClass(/nav--nav-open/);
    // A navigation from the drawer closes it.
    await menu.click();
    await nav.locator('#nav-products').click();
    await page.waitForURL(/\/admin\/collections\/products/);
    await expect(nav).not.toHaveClass(/nav--nav-open/);
    // On a phone the drawer is the full width, the two header controls are icons.
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/admin/collections/pages');
    await expect(nav).not.toHaveClass(/nav--nav-open/);
    expect((await page.locator('[data-admin-palette-trigger]').boundingBox())!.width).toBeLessThan(
      60,
    );
    await menu.click();
    await expect(nav).toHaveClass(/nav--nav-open/);
    expect(Math.round((await nav.boundingBox())!.width)).toBe(390);
    await expect(nav.locator('#nav-pages')).toBeVisible();
    await nav.locator('[data-admin-menu-close]').click();
    await expect(nav).not.toHaveClass(/nav--nav-open/);
    // At every width the shell fits its screen: a localized document (the header's crumbs
    // and locale switcher), a global (the locale note beside Save) and a list (the table
    // scrolls inside its wrapper) never scroll the page sideways.
    const pageId = await firstDocId(request, adminAuth, 'pages');
    for (const width of [390, 1024, 1280, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const path of [
        `/admin/collections/pages/${pageId}`,
        '/admin/globals/site-settings',
        '/admin/collections/pages',
      ]) {
        await page.goto(path);
        await expect(page.locator('.app-header__localizer')).toBeVisible();
        expect(await sidewaysOverflow(page), `${path} at ${width} px`).toBe(0);
      }
    }
  });

  test("the dashboard (ADR-039, ADR-059): the seven sections, the range, the figures as links, the editor's view", async ({
    page,
    request,
  }) => {
    await page.setViewportSize({ width: 1600, height: 1000 });
    expect((await page.request.post(`${API}/users/login`, { data: admin })).status()).toBe(200);
    // A save stamps «آخر حفظ» and lands at the top of the saves.
    const auth = await login(request, admin);
    const faq = await request.get(`${API}/faqs?limit=1&depth=0`, { headers: auth });
    const entry = ((await faq.json()) as { docs: Array<{ id: number; question: string }> }).docs[0];
    expect(entry).toBeDefined();
    expect(
      (
        await request.patch(`${API}/faqs/${entry!.id}`, {
          headers: auth,
          data: { question: entry!.question },
        })
      ).status(),
    ).toBe(200);
    await page.goto('/admin');
    const dashboard = page.locator('[data-admin-dashboard]');
    await expect(dashboard).toBeVisible();
    // 1. The greeting by the Riyadh hour, the week by default, the "needs a hand" line.
    await expect(dashboard.locator('h1')).toContainText(/Good (morning|afternoon|evening)/);
    await expect(dashboard).toHaveAttribute('data-admin-dashboard-days', '7');
    await expect(dashboard.locator('[data-admin-dashboard-hand]')).toBeVisible();
    // 2. Four tiles for an admin, each with a number and each a link.
    await expect(dashboard.locator('[data-admin-tile]')).toHaveCount(4);
    for (const key of ['visits', 'cited', 'score', 'published']) {
      const tile = dashboard.locator(`[data-admin-tile="${key}"]`);
      await expect(tile).toBeVisible();
      await expect(tile).toHaveAttribute('data-admin-tile-value', /^[\d,]+%?$/);
      await expect(tile).toHaveAttribute('href', /\/admin\//);
    }
    await expect(dashboard.locator('[data-admin-tile="visits"]')).toHaveAttribute(
      'href',
      /\/admin\/traffic\?days=7$/,
    );
    // The hint names the category prompts once a ledger run exists; a fresh database (CI's
    // seed) has none yet and says so instead.
    await expect(dashboard.locator('[data-admin-tile="cited"]')).toContainText(
      /category prompts|No ledger run/,
    );
    // 3 to 7, top to bottom, each with its hook.
    for (const hook of ['visits', 'assistants', 'content', 'engine', 'server']) {
      await expect(dashboard.locator(`[data-admin-dashboard-${hook}]`)).toBeVisible();
    }
    // 5. The content: the home tile, the figures as links (the drafts to the list filtered on
    // `_status`), the saves by people, the two actions in their entity's hue.
    for (const key of ['home', 'add-product', 'add-post']) {
      await expect(dashboard.locator(`[data-admin-action="${key}"]`)).toBeVisible();
    }
    await expect(dashboard.locator('[data-admin-action="add-page"]')).toHaveCount(0);
    await expect(
      dashboard.locator('[data-admin-figures="posts"] [data-admin-figure="drafts"]'),
    ).toHaveAttribute('href', /where(\[|%5B)_status(\]|%5D)(\[|%5B)equals(\]|%5D)=draft/);
    await expect(
      dashboard.locator('[data-admin-figures="posts"] [data-admin-figure="published"]'),
    ).toHaveAttribute('href', /\/admin\/collections\/posts/);
    const first = dashboard.locator('[data-admin-recent] li').first();
    await expect(first).toContainText(entry!.question);
    await expect(first).toContainText(/by /);
    // Hues are the group's (ADR-046): a FAQ entry is Catalogue teal, a post is Blog violet.
    await expect(first.locator('[data-hue]')).toHaveAttribute('data-hue', 'teal');
    await expect(dashboard.locator('[data-admin-action="add-post"]')).toHaveAttribute(
      'data-hue',
      'violet',
    );
    // 7. The server: collapsed unless a row is red; the rows keep their tones inside.
    const server = dashboard.locator('[data-admin-dashboard-server]');
    const worst = await server.getAttribute('data-admin-dashboard-server');
    if (worst === 'error') await expect(server.locator('details')).toHaveAttribute('open', '');
    else await expect(server.locator('details')).not.toHaveAttribute('open', '');
    await expect(dashboard.locator('[data-health-row="db"]')).toHaveAttribute(
      'data-tone',
      'success',
    );
    await expect(dashboard.locator('[data-health-row="jobs"]')).toHaveAttribute(
      'data-tone',
      'success',
    );
    await server.locator('summary').click();
    await expect(dashboard.locator('[data-health-row="db"]')).toBeVisible();
    await expect(dashboard.locator('[data-admin-dashboard-queue]')).toContainText(/Riyadh/);
    // 1. The range control is a link: the server renders the chosen range, no client state.
    await dashboard.locator('[data-admin-dashboard-range] a[href$="days=30"]').click();
    await page.waitForURL(/\/admin\?days=30/);
    await expect(dashboard).toHaveAttribute('data-admin-dashboard-days', '30');
    await expect(
      dashboard.locator('[data-admin-dashboard-range] a[aria-current="page"]'),
    ).toHaveText(/30 days/);
    await expect(dashboard.locator('[data-admin-tile="visits"]')).toHaveAttribute(
      'href',
      /\/admin\/traffic\?days=30$/,
    );
    await expect(dashboard.locator('[data-admin-tile="published"]')).toContainText(/30 days/);
    await page.goto('/admin?days=12');
    await expect(dashboard).toHaveAttribute('data-admin-dashboard-days', '7');
    // The home tile navigates inside the app: no reload.
    await page.evaluate(() => {
      (window as unknown as { b7rMarker?: number }).b7rMarker = 1;
    });
    await dashboard.locator('[data-admin-action="home"]').click();
    await page.waitForURL(/\/admin\/globals\/home/);
    expect(await page.evaluate(() => (window as unknown as { b7rMarker?: number }).b7rMarker)).toBe(
      1,
    );
    await page.goto('/admin');
    const { AxeBuilder } = await import('@axe-core/playwright');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .include('[data-admin-dashboard]')
      .analyze();
    expect(
      results.violations
        .filter((v) => ['serious', 'critical'].includes(v.impact ?? ''))
        .map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`),
    ).toEqual([]);
    // An editor sees what an editor may open: the published tile, the content, the server; no
    // traffic, no assistants, no engine, no spend, and nothing refused in their place.
    const editor = await createEditor(request, auth);
    const editorContext = await page.context().browser()!.newContext();
    try {
      const editorPage = await editorContext.newPage();
      expect((await editorPage.request.post(`${API}/users/login`, { data: editor })).status()).toBe(
        200,
      );
      await editorPage.goto('/admin');
      const theirs = editorPage.locator('[data-admin-dashboard]');
      await expect(theirs).toBeVisible();
      await expect(theirs.locator('[data-admin-tile]')).toHaveCount(1);
      await expect(theirs.locator('[data-admin-tile="published"]')).toBeVisible();
      await expect(theirs.locator('[data-admin-dashboard-content]')).toBeVisible();
      await expect(theirs.locator('[data-admin-dashboard-server]')).toBeVisible();
      await expect(theirs.locator('[data-admin-dashboard-hand]')).toBeVisible();
      for (const hook of ['visits', 'assistants', 'engine']) {
        await expect(theirs.locator(`[data-admin-dashboard-${hook}]`)).toHaveCount(0);
      }
      await expect(theirs.locator('[data-admin-view-refused]')).toHaveCount(0);
      await expect(theirs.locator('[data-admin-action="home"]')).toBeVisible();
    } finally {
      await editorContext.close();
      await request.delete(`${API}/users/${editor.id}`, { headers: auth });
    }
    // The field widgets: a section switch with its consequence, and the platform tiles. The
    // section's switch lives in its tab (ADR-046), which Payload opens only on a click (a
    // remembered tab is a per-user preference, never assumed).
    await page.goto('/admin/globals/home');
    await page.locator('.tabs-field__tab-button', { hasText: 'Three steps' }).click();
    const stepsSwitch = page.locator('[data-admin-switch="steps.enabled"]');
    await expect(stepsSwitch).toHaveAttribute('role', 'switch');
    await expect(stepsSwitch).toHaveAttribute('aria-checked', 'true');
    await expect(
      page.locator('[data-admin-field="enabled"]').filter({ has: stepsSwitch }),
    ).toContainText(/hides the “Three steps” section/);
    // Payload's locale suffix on localized labels (an em dash) is hidden; the header's locale
    // switcher carries that information.
    await expect(page.locator('.field-label .localized').first()).toBeHidden();
    await page.goto('/admin/collections/integrations/create');
    await expect(page.locator('[data-admin-choice="salla"]')).toHaveAttribute('role', 'radio');
    await page.locator('[data-admin-choice="zid"]').click();
    await expect(page.locator('[data-admin-choice="zid"]')).toHaveAttribute('aria-checked', 'true');
    // "Last saved" is one line on an edit view and absent from the create form.
    await expect(page.locator('[data-admin-saved-by]')).toHaveCount(0);
    await page.goto(`/admin/collections/faqs/${entry!.id}`);
    await expect(page.locator('[data-admin-saved-by]')).toContainText(/by .+ · /);
  });

  test("the admin in Arabic (ADR-056): the account view switches the panel, it reads right-to-left in our strings and Payload's, the content locale stays put, axe is clean, English comes back", async ({
    page,
    request,
    baseURL,
  }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 1600, height: 1000 });
    expect((await page.request.post(`${API}/users/login`, { data: admin })).status()).toBe(200);
    const html = page.locator('html');
    // Payload keeps the choice in its `payload-lng` cookie (a year, path `/`), written by the
    // account view's language select through a server action, then `router.refresh()`.
    const pickLanguage = async (name: string) => {
      await page.goto('/admin/account');
      const select = page.locator('#language-select');
      await select.click();
      await page.keyboard.type(name);
      await page.keyboard.press('Enter');
    };
    const languageCookie = async () =>
      (await page.context().cookies()).find((c) => c.name === 'payload-lng')?.value;
    try {
      // An Arabic browser with no choice saved opens the Arabic panel at the login page.
      const arabicBrowser = await page.context().browser()!.newContext({ locale: 'ar-SA' });
      const loginPage = await arabicBrowser.newPage();
      await loginPage.goto('/admin/login');
      await expect(loginPage.locator('html')).toHaveAttribute('lang', 'ar');
      await expect(loginPage.locator('html')).toHaveAttribute('dir', /rtl/i);
      await arabicBrowser.close();
      await pickLanguage('العربية');
      await expect(html).toHaveAttribute('dir', /rtl/i);
      await expect(html).toHaveAttribute('lang', 'ar');
      await expect.poll(languageCookie).toBe('ar');
      // The dashboard and the sidebar in our Arabic: the five groups in order, the greeting.
      await page.goto('/admin');
      const nav = page.locator('[data-admin-nav]');
      await expect(nav.locator('[data-admin-group]')).toHaveText([
        /الموقع/,
        /الكتالوج/,
        /المدونة/,
        /الظهور/,
        /الإدارة/,
      ]);
      const dashboard = page.locator('[data-admin-dashboard]');
      await expect(dashboard.locator('h1')).toContainText(/صباح الخير|مساء الخير/);
      await expect(dashboard.locator('[data-admin-health] h2')).toContainText('الخادم');
      await expect(dashboard.locator('[data-admin-tile]')).toHaveCount(4);
      await expect(dashboard.locator('[data-admin-dashboard-range] a').first()).toContainText(
        /أيام/,
      );
      // The digits stay Western in Arabic (design system §5): no Eastern digit on the dashboard.
      expect(await dashboard.innerText()).not.toMatch(/[٠-٩]/);
      await expect(page.locator('[data-admin-palette-trigger]')).toContainText('ابحث');
      await expect(page.locator('[data-admin-view-site]')).toContainText('عرض الموقع');
      // The sidebar sits at the start edge: on the right now, so its box starts past the middle.
      const navBox = (await nav.boundingBox())!;
      const viewport = page.viewportSize()!;
      expect(navBox.x + navBox.width / 2).toBeGreaterThan(viewport.width / 2);
      // Collapsed, the rail's flyout opens away from the rail: to the left; the groups keep
      // their Arabic names on the icons (ADR-058).
      await page.locator('[data-admin-collapse]').click();
      await expect(nav).toHaveAttribute('data-admin-rail', '');
      await nav.locator('[data-admin-rail-group="الموقع"]').click();
      const flyout = page.locator('[data-admin-flyout="الموقع"]');
      await expect(flyout).toBeVisible();
      await expect(flyout).toHaveAttribute('data-side', 'left');
      await expect(flyout.locator('[data-admin-flyout-entry="pages"]')).toHaveText(/الصفحات/);
      await page.keyboard.press('Escape');
      await expect(flyout).toBeHidden();
      await page.locator('[data-admin-expand]').click();
      await expect(nav).toHaveClass(/nav--nav-open/);
      const { AxeBuilder } = await import('@axe-core/playwright');
      const serious = async (...include: string[]) => {
        let builder = new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']);
        for (const sel of include) builder = builder.include(sel);
        return (await builder.analyze()).violations
          .filter((v) => ['serious', 'critical'].includes(v.impact ?? ''))
          .map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
      };
      expect(
        await serious('[data-admin-nav]', '.app-header', '[data-admin-dashboard]'),
        'axe: the Arabic dashboard',
      ).toEqual([]);
      // A list view: our header in Arabic, Payload's own "Create New" in our Arabic over its pack.
      await page.goto('/admin/collections/pages');
      await expect(page.locator('[data-admin-header="pages"] [data-admin-shows]')).toContainText(
        'يظهر في:',
      );
      await expect(page.getByText('إنشاء جديد').first()).toBeVisible();
      await expect(nav.locator('a[aria-current="page"]')).toHaveText(/الصفحات/);
      // An edit view: Payload's controls in Arabic; the content locale is untouched by the
      // UI language (the note still says which content language is open, in Arabic now).
      const auth = await login(request, admin);
      const about = await request.get(`${API}/pages?where[slug][equals]=about&depth=0`, {
        headers: auth,
      });
      const aboutId = ((await about.json()) as { docs: Array<{ id: number }> }).docs[0]?.id;
      expect(aboutId).toBeDefined();
      await page.goto(`/admin/collections/pages/${aboutId}`);
      await expect(page.locator('#field-slug')).toHaveValue('about');
      await expect(page.locator('[data-admin-locale-note]')).toHaveAttribute(
        'data-admin-locale-note',
        'ar',
      );
      await expect(page.locator('[data-admin-locale-note]')).toContainText('تحرير المحتوى العربي');
      await expect(html).toHaveAttribute('data-content-locale', 'ar');
      await expect(page.locator('#action-save')).toContainText(/نشر|حفظ/);
      // Opening the English content changes the pills and the note, never the panel's language.
      await page.goto(`/admin/collections/pages/${aboutId}?locale=en`);
      await expect(html).toHaveAttribute('data-content-locale', 'en');
      await expect(html).toHaveAttribute('dir', /rtl/i);
      await expect(page.locator('[data-admin-locale-note]')).toContainText(
        'تحرير المحتوى الإنجليزي',
      );
      // The note about the English content is itself written in Arabic: the UI language.
      await expect(page.locator('[data-admin-locale-note]')).toContainText(/[؀-ۿ]/);
      expect(
        await serious(
          '[data-admin-nav]',
          '.app-header',
          '[data-admin-locale-note]',
          '[data-admin-header]',
        ),
        'axe: the Arabic shell on an edit view',
      ).toEqual([]);
      // `?locale=` is remembered per user (Payload's `locale` preference): back to Arabic content.
      await page.goto(`/admin/collections/pages/${aboutId}?locale=ar`);
      await expect(html).toHaveAttribute('data-content-locale', 'ar');
      // Our two views, titled in Arabic, inside the shell.
      await page.goto('/admin/traffic');
      await expect(page.locator('[data-admin-traffic-page] h1')).toContainText('مصادر الزيارات');
      await expect(page.locator('[data-admin-nav]')).toBeAttached();
      await page.goto('/admin/visibility');
      await expect(page.locator('[data-admin-visibility-page] h1')).toContainText('درجة الظهور');
      // The rules' own sentences read in Arabic too (the Phase 2 text review): the first open
      // finding's title and guide are Arabic script, and the guide names a place in words.
      const openFinding = page.locator('[data-admin-finding]:not([data-status="done"])').first();
      await expect(openFinding.locator('[data-admin-finding-title]')).toContainText(/[؀-ۿ]/);
      await expect(openFinding.locator('[data-admin-finding-guide]')).toContainText(/[؀-ۿ]/);
      await expect(openFinding.locator('[data-admin-finding-guide]')).not.toContainText('→');
      // A listed document's label is a pair too («عنوان (مقال)», the checklist's boxes): the
      // first item of the first rule that lists any reads Arabic script. A database on which
      // no rule lists a document has nothing to assert here.
      const listedItems = page.locator('[data-admin-finding-items] li a');
      if ((await listedItems.count()) > 0) {
        await expect(listedItems.first()).toContainText(/[؀-ۿ]/);
      }
      expect(
        await serious('[data-admin-nav]', '.app-header', '[data-admin-visibility-page]'),
        'axe: the Arabic Score page',
      ).toEqual([]);
      // The digits stay Western in Arabic (design system §5): no Eastern digit anywhere on the page.
      expect(await page.locator('[data-admin-visibility-page]').innerText()).not.toMatch(/[٠-٩]/);
      // On a phone the drawer reads right-to-left, its language switch marks Arabic.
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto('/admin');
      await page.locator('[data-admin-menu]').click();
      await expect(nav).toHaveClass(/nav--nav-open/);
      await expect(nav.locator('[data-admin-language] [aria-pressed="true"]')).toHaveText(
        'العربية',
      );
      await expect(nav.locator('[data-admin-group]').first()).toContainText('الموقع');
      expect(await serious('[data-admin-nav]'), 'axe: the Arabic drawer').toEqual([]);
      await page.keyboard.press('Escape');
      await expect(nav).not.toHaveClass(/nav--nav-open/);
      // A document on an Arabic phone: the page fits its screen and the locale switcher sits
      // at the leading gutter (Payload's physical `right` once stretched it over the crumbs).
      await page.goto(`/admin/collections/pages/${aboutId}`);
      const switcher = page.locator('.app-header__localizer .popup__trigger-wrap');
      await expect(switcher).toBeVisible();
      expect(await sidewaysOverflow(page), 'no horizontal overflow on an Arabic phone').toBe(0);
      expect((await switcher.boundingBox())!.x, 'the switcher at the leading edge').toBeLessThan(
        60,
      );
      await page.setViewportSize({ width: 1600, height: 1000 });
      // Back to English through the same control.
      await pickLanguage('English');
      await expect(html).toHaveAttribute('dir', /ltr/i);
      await expect(html).toHaveAttribute('lang', 'en');
      await expect.poll(languageCookie).toBe('en');
      await page.goto('/admin');
      await expect(page.locator('[data-admin-dashboard] h1')).toContainText(/Good /);
    } finally {
      // Whatever happened above, the context leaves the panel in English for the next test.
      await page.context().addCookies([{ name: 'payload-lng', value: 'en', url: baseURL! }]);
    }
  });

  test('preview (ADR-039): a signed link shows a draft page that the public never sees', async ({
    page,
    request,
  }) => {
    test.setTimeout(120_000);
    const secret = process.env['PAYLOAD_SECRET'];
    test.skip(!secret, 'PAYLOAD_SECRET unset');
    const auth = await login(request, admin);
    const slug = `preview-e2e-${Date.now()}`;
    const title = `مسودة معاينة ${Date.now()}`;
    const created = await request.post(`${API}/pages?draft=true`, {
      headers: auth,
      data: {
        title,
        slug,
        _status: 'draft',
        blocks: [
          {
            blockType: 'richText',
            content: {
              root: {
                type: 'root',
                children: [],
                direction: 'rtl',
                format: '',
                indent: 0,
                version: 1,
              },
            },
          },
        ],
      },
    });
    expect(created.status(), await created.text()).toBe(201);
    const id = ((await created.json()) as { doc: { id: number } }).doc.id;
    try {
      // (b) Without the cookie the unpublished slug is the full-document 404.
      const anonymous = await request.get(`/${slug}`, { maxRedirects: 0 });
      expect(anonymous.status()).toBe(404);
      // A forged or foreign token is refused.
      expect((await request.get(`/api/preview?path=/${slug}&token=1.x`)).status()).toBe(403);
      // (a) The signed link turns on draft mode and lands on the draft, with the bar.
      const token = signPreview(`/${slug}`, secret!);
      await page.goto(`/api/preview?path=/${encodeURIComponent(slug)}&token=${token}`);
      await expect(page).toHaveURL(new RegExp(`/${slug}$`));
      await expect(page.locator('[data-draft-bar]')).toBeVisible();
      await expect(page.locator('h1')).toHaveText(title);
      // (d) A draft edit to a published page: visible in the preview, absent in public.
      const about = await request.get(`${API}/pages?where[slug][equals]=about&depth=0&draft=true`, {
        headers: auth,
      });
      const aboutDoc = ((await about.json()) as { docs: Array<Record<string, unknown>> }).docs[0]!;
      const stamp = `معاينة ${Date.now()}`;
      expect(
        (
          await request.patch(`${API}/pages/${aboutDoc['id']}?draft=true`, {
            headers: auth,
            data: { title: `${aboutDoc['title']} ${stamp}`, _status: 'draft' },
          })
        ).status(),
      ).toBe(200);
      try {
        await page.goto('/about');
        await expect(page.locator('[data-draft-bar]')).toBeVisible();
        expect(await page.locator('body').textContent()).toContain(stamp);
        expect(await (await request.get('/about')).text()).not.toContain(stamp);
      } finally {
        expect(
          (
            await request.patch(`${API}/pages/${aboutDoc['id']}`, {
              headers: auth,
              data: { title: aboutDoc['title'], _status: 'published' },
            })
          ).status(),
        ).toBe(200);
      }
      // (c) Leaving draft mode returns to the page, which is the 404 again.
      await page.locator('[data-draft-bar] a').click();
      await expect(page.locator('[data-draft-bar]')).toHaveCount(0);
      const gone = await page.goto(`/${slug}`);
      expect(gone?.status()).toBe(404);
      // (e) Constitution II: the public pages still come from the cache.
      await request.get('/about');
      const cached = await request.get('/about');
      expect(cached.headers()['x-nextjs-cache']).toMatch(/HIT|STALE/);
    } finally {
      expect((await request.delete(`${API}/pages/${id}`, { headers: auth })).status()).toBe(200);
    }
  });

  test('a short password is refused with the reason (ADR-027)', async ({ request }) => {
    const adminAuth = await login(request, admin);
    const refused = await request.post(`${API}/users`, {
      headers: adminAuth,
      data: { email: 'short@b7r.sa', password: 'abc123d', name: 'x', role: 'editor' },
    });
    expect(refused.status()).toBe(400);
    expect(await refused.text()).toContain('too short');
  });

  test('an editor edits content but is refused users, settings and published deletes', async ({
    request,
  }) => {
    const adminAuth = await login(request, admin);
    const editor = await createEditor(request, adminAuth);
    const editorId = editor.id;
    try {
      const auth = await login(request, editor);
      const settings = await request.post(`${API}/globals/site-settings`, {
        headers: auth,
        data: { tagline: 'x' },
      });
      expect(settings.status(), 'editor updating site settings').toBe(403);
      const users = await request.get(`${API}/users`, { headers: auth });
      expect(((await users.json()) as { totalDocs: number }).totalDocs, 'sees self only').toBe(1);
      const newUser = await request.post(`${API}/users`, {
        headers: auth,
        data: { email: 'x@b7r.sa', password: editor.password, name: 'x', role: 'admin' },
      });
      expect(newUser.status(), 'editor creating a user').toBe(403);
      const promote = await request.patch(`${API}/users/${editorId}`, {
        headers: auth,
        data: { role: 'admin' },
      });
      const promoted = (await promote.json()) as { doc?: { role?: string } };
      expect(promoted.doc?.role, 'editor promoting themselves').toBe('editor');
      const products = await request.get(`${API}/products?limit=1`, { headers: auth });
      const product = ((await products.json()) as { docs: Array<{ id: number }> }).docs[0];
      expect(product).toBeDefined();
      const del = await request.delete(`${API}/products/${product?.id}`, { headers: auth });
      expect(del.status(), 'editor deleting a published product').toBe(403);
    } finally {
      const removed = await request.delete(`${API}/users/${editorId}`, { headers: adminAuth });
      expect(removed.status()).toBe(200);
    }
  });

  // The menus are the site settings' `menu` group (ADR-046, PR B1): the six header links and
  // the four policy links live there, and a change to the CTA label reaches every page.
  test('the menus live in the site settings and a saved CTA label reaches the header', async ({
    page,
    request,
  }) => {
    test.setTimeout(120_000);
    const auth = await login(request, admin);
    type Settings = {
      menu: { primary: unknown[]; policies: unknown[]; ctaLabel: string };
      ctaShiny?: boolean;
    };
    const en = (await (
      await request.get(`${API}/globals/site-settings?locale=en`, { headers: auth })
    ).json()) as Settings;
    expect(en.menu.primary).toHaveLength(6);
    expect(en.menu.policies).toHaveLength(4);
    await page.goto('/admin/login');
    await page.locator('#field-email').fill(admin.email);
    await page.locator('#field-password').fill(admin.password);
    await page.locator('form button[type="submit"]').first().click();
    await page.waitForURL((u) => !u.pathname.endsWith('/login'));
    await page.goto('/admin/globals/site-settings');
    // The menus are the "Menus & footer" tab (PR B2).
    await page.locator('.tabs-field__tab-button', { hasText: 'Menus & footer' }).click();
    await expect(page.getByText('Primary 06')).toBeVisible();
    await expect(page.getByText('Policy 04')).toBeVisible();
    const stamp = `Start e2e ${Date.now()}`;
    const save = (ctaLabel: string, ctaShiny = false) =>
      request.post(`${API}/globals/site-settings?locale=en`, {
        headers: auth,
        data: { menu: { ...en.menu, ctaLabel }, ctaShiny },
      });
    const poll = { intervals: [1_000, 2_000, 3_000] };
    // The shiny switch (ADR-054) rides along: the header's button carries data-shiny.
    expect((await save(stamp, true)).status()).toBe(200);
    try {
      await expect.poll(shows(request, '/en', stamp), { ...poll, timeout: 15_000 }).toBe(true);
      await expect
        .poll(shows(request, '/en', 'data-shiny="true"'), { ...poll, timeout: 15_000 })
        .toBe(true);
    } finally {
      expect((await save(en.menu.ctaLabel, Boolean(en.ctaShiny))).status()).toBe(200);
    }
    await expect.poll(shows(request, '/en', stamp), { ...poll, timeout: 15_000 }).toBe(false);
  });

  // The big forms are tabs, one per section in site order (ADR-046, PR B2); sidebar fields
  // stay in the sidebar; every field an editor sees says what it does under it.
  test('the big forms are tabs in site order and every field says what it does', async ({
    page,
    request,
  }) => {
    test.setTimeout(120_000);
    const auth = await login(request, admin);
    await page.goto('/admin/login');
    await page.locator('#field-email').fill(admin.email);
    await page.locator('#field-password').fill(admin.password);
    await page.locator('form button[type="submit"]').first().click();
    await page.waitForURL((u) => !u.pathname.endsWith('/login'));
    const tabsOf = async (url: string) => {
      await page.goto(url);
      await expect(page.locator('.tabs-field__tab-button').first()).toBeVisible();
      return page.locator('.tabs-field__tab-button').allTextContents();
    };
    expect(await tabsOf('/admin/globals/home')).toEqual([
      'Opening slides',
      'Product strip',
      'Designer',
      'Three steps',
      'Video',
      'Why us',
      'Testimonials',
      'Connected stores',
      'FAQ',
      'Bottom banner',
    ]);
    // A section tab opens on its switch, whose description says what "off" hides.
    await page.locator('.tabs-field__tab-button', { hasText: 'Three steps' }).click();
    await expect(page.locator('[data-admin-switch="steps.enabled"]')).toBeVisible();
    await expect(page.locator('[data-admin-field="enabled"]').first()).toContainText(/hides/);
    expect(await tabsOf('/admin/globals/site-settings')).toEqual([
      'Brand',
      'Contact & social',
      'Menus & footer',
      'Numbers and delivery',
      'Analytics',
    ]);
    const products = (await (
      await request.get(`${API}/products?limit=1`, { headers: auth })
    ).json()) as { docs: Array<{ id: number }> };
    expect(await tabsOf(`/admin/collections/products/${products.docs[0]?.id}`)).toEqual([
      'Photos & colours',
      'Basics',
      'Sizes',
      'Print area',
    ]);
    // The order is a per-document number: the sidebar (audit 2026-09-18, 3.3).
    await expect(page.locator('.document-fields__sidebar #field-sortOrder')).toBeVisible();
    // Every field on a tab says what it does on the site (the description line under it).
    await page.locator('.tabs-field__tab-button', { hasText: 'Sizes' }).click();
    await expect(page.locator('#field-sizesSummary')).toBeVisible();
    await expect(
      page
        .locator('.field-description-sizesSummary, [id="field-description-sizesSummary"]')
        .first(),
    ).toContainText(/product card/);
    const posts = (await (await request.get(`${API}/posts?limit=1`, { headers: auth })).json()) as {
      docs: Array<{ id: number }>;
    };
    expect(await tabsOf(`/admin/collections/posts/${posts.docs[0]?.id}`)).toEqual([
      'Content',
      'Summary & cover',
      'Search',
    ]);
    // The post's sidebar keeps the author and the dates, in three groups (3.5).
    await expect(page.locator('.document-fields__sidebar #field-author')).toBeVisible();
    await expect(page.locator('.document-fields__sidebar #field-publishedAt')).toBeVisible();
    await expect(page.locator('.document-fields__sidebar .collapsible-field')).toHaveCount(3);
    // The body has a toolbar (2.3), and a read-only number reads as a line (2.11).
    await page.locator('.tabs-field__tab-button', { hasText: 'Content' }).click();
    await expect(page.locator('.fixed-toolbar').first()).toBeVisible();
    await expect(page.locator('[data-admin-read-only="readingMinutes"]')).toHaveCount(1);
    const pages = (await (await request.get(`${API}/pages?limit=1`, { headers: auth })).json()) as {
      docs: Array<{ id: number }>;
    };
    expect(await tabsOf(`/admin/collections/pages/${pages.docs[0]?.id}`)).toEqual([
      'Content',
      'Search',
    ]);
  });

  test('a desktop form: Save and Publish stay on the screen beside the locale note, nothing scrolls sideways', async ({
    page,
  }) => {
    // The note is a nowrap pill in Payload's controls row; the row's wrapper sized itself to
    // the whole sentence and pushed Save past the right edge of a 1440 px screen
    // (2026-09-18, on the temporary domain). The bar grows by a line instead.
    expect((await page.request.post(`${API}/users/login`, { data: admin })).status()).toBe(200);
    for (const [width, path] of [
      [1440, '/admin/globals/site-settings'],
      [1280, '/admin/globals/home'],
    ] as const) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(path);
      const save = page.locator('.doc-controls #action-save');
      const note = page.locator('[data-admin-locale-note]');
      await expect(save).toBeVisible();
      await expect(note).toBeVisible();
      const [saveBox, noteBox] = await Promise.all([save.boundingBox(), note.boundingBox()]);
      expect(saveBox!.x + saveBox!.width, `Save inside the ${width} px screen`).toBeLessThanOrEqual(
        width,
      );
      expect(noteBox!.x + noteBox!.width, 'the note inside the screen').toBeLessThanOrEqual(width);
      expect(noteBox!.height, 'the note is one line').toBeLessThan(40);
      expect(saveBox && noteBox && disjoint(saveBox, noteBox), 'the note over Save').toBe(true);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        ),
        'no sideways scroll',
      ).toBe(0);
    }
  });

  test('a phone form (audit 2026-09-18, 3.1): the locale note stays clear of Publish, the tab strip scrolls, nothing overflows', async ({
    page,
    request,
  }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 390, height: 844 });
    expect((await page.request.post(`${API}/users/login`, { data: admin })).status()).toBe(200);
    const auth = await login(request, admin);
    await page.goto('/admin/globals/home');
    const note = page.locator('[data-admin-locale-note]');
    const publish = page.locator('.doc-controls #action-save');
    await expect(note).toBeVisible();
    await expect(publish).toBeVisible();
    // The note is a one-line pill under the buttons: its box never crosses Publish's or the
    // status line's, and the controls bar grew to hold it instead of letting it spill.
    const [noteBox, publishBox, statusBox] = await Promise.all([
      note.boundingBox(),
      publish.boundingBox(),
      page.locator('.doc-controls__status').boundingBox(),
    ]);
    expect(noteBox && publishBox && disjoint(noteBox, publishBox), 'note over Publish').toBe(true);
    expect(noteBox && statusBox && disjoint(noteBox, statusBox), 'note over the status').toBe(true);
    expect(noteBox!.height, 'the note is one line').toBeLessThan(40);
    expect(noteBox!.y, 'the note sits under the buttons').toBeGreaterThanOrEqual(
      publishBox!.y + publishBox!.height - 1,
    );
    // Ten tabs at 390 px: the strip is a horizontal scroller, the active tab is marked in the
    // accent, and the page itself never scrolls sideways.
    const strip = page.locator('.tabs-field__tabs-wrap').first();
    const scrollable = await strip.evaluate((el) => el.scrollWidth > el.clientWidth + 8);
    expect(scrollable, 'the tab strip overflows into a scroller').toBe(true);
    // The strip scrolls smoothly, so the position is read once the scroll has moved.
    await strip.evaluate((el) => {
      el.scrollLeft = el.scrollWidth;
    });
    await expect.poll(() => strip.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
    const active = page.locator('.tabs-field__tab-button--active').first();
    await expect(active).toHaveCSS('color', 'rgb(0, 152, 224)');
    await active.scrollIntoViewIfNeeded();
    await expect(active).toBeInViewport();
    expect(await sidewaysOverflow(page), 'no horizontal overflow on the home form').toBe(0);
    // No entity shows the API tab any more (3.10).
    await expect(page.locator('.doc-tab', { hasText: /^API$/ })).toHaveCount(0);
    // A document with a long title: the header's crumbs shrink, the locale switcher stays at
    // the gutter, and the page never scrolls sideways (the CTO's 390 px check, 2026-09-18).
    for (const slug of ['products', 'pages', 'posts']) {
      await page.goto(`/admin/collections/${slug}/${await firstDocId(request, auth, slug)}`);
      await expect(page.locator('.app-header__localizer')).toBeVisible();
      expect(await sidewaysOverflow(page), `no horizontal overflow on a ${slug} form`).toBe(0);
      const [switcher, viewSite] = await Promise.all([
        page.locator('.app-header__localizer').boundingBox(),
        page.locator('[data-admin-view-site]').boundingBox(),
      ]);
      expect(switcher!.x + switcher!.width, 'the switcher inside the screen').toBeLessThanOrEqual(
        390,
      );
      expect(disjoint(switcher!, viewSite!), 'the switcher over "View website"').toBe(true);
    }
  });

  test('an outsider holding no credential reads published content and nothing else', async ({
    request,
  }) => {
    const users = await request.get(`${API}/users`);
    expect(users.status()).toBeGreaterThanOrEqual(401);
    const me = await request.get(`${API}/users/me`);
    expect(((await me.json()) as { user: unknown }).user).toBeNull();
    const drafts = await request.get(`${API}/products?draft=true&limit=100`);
    const docs = ((await drafts.json()) as { docs: Array<{ _status?: string }> }).docs;
    expect(docs.length).toBeGreaterThan(0);
    expect(docs.every((d) => d._status === 'published')).toBe(true);
    const seo = (await (await request.get(`${API}/globals/seo-defaults`)).json()) as Record<
      string,
      unknown
    >;
    expect(seo['titleTemplate']).toBeTruthy();
    expect(seo['verification'], 'admin-only field hidden from the public').toBeUndefined();
    const create = await request.post(`${API}/products`, { data: { name: 'x', slug: 'x' } });
    expect(create.status()).toBeGreaterThanOrEqual(401);
  });

  // Mutates `tote-bag`; the `cms` project runs after the device projects, so no public
  // assertion is reading it meanwhile.
  test('a publish is live on the listing and the product page at once', async ({ request }) => {
    test.setTimeout(150_000);
    const auth = await login(request, admin);
    const list = await request.get(`${API}/products?where[slug][equals]=tote-bag`, {
      headers: auth,
    });
    type Doc = { id: number; material: string; sizesSummary: string };
    const doc = ((await list.json()) as { docs: Doc[] }).docs[0];
    expect(doc).toBeDefined();
    if (!doc) return;
    const stamp = `e2e ${Date.now()}`;
    const publish = (data: Partial<Doc>) =>
      request.patch(`${API}/products/${doc.id}`, {
        headers: auth,
        data: { ...data, _status: 'published' },
      });
    const showsText = (path: string, text: string) => shows(request, path, text);
    const poll = { intervals: [1_000, 2_000, 3_000] };
    expect(
      (await publish({ material: `${doc.material} (${stamp})`, sizesSummary: stamp })).status(),
    ).toBe(200);
    try {
      // The publish hook regenerates the listing and the page (revalidatePath, ADR-030);
      // the 60 s timer is only the floor.
      await expect.poll(showsText('/products', stamp), { ...poll, timeout: 15_000 }).toBe(true);
      await expect
        .poll(showsText('/products/tote-bag', stamp), { ...poll, timeout: 15_000 })
        .toBe(true);
    } finally {
      expect(
        (await publish({ material: doc.material, sizesSummary: doc.sizesSummary })).status(),
      ).toBe(200);
    }
    await expect.poll(showsText('/products', stamp), { ...poll, timeout: 15_000 }).toBe(false);
  });

  test('a draft never reaches the site; a new product gets its page; a deleted one turns 404', async ({
    request,
  }) => {
    test.setTimeout(150_000);
    const auth = await login(request, admin);
    const stamp = Date.now();
    const source = await request.get(`${API}/products?where[slug][equals]=tote-bag&depth=0`, {
      headers: auth,
    });
    const tote = ((await source.json()) as { docs: Array<Record<string, unknown>> }).docs[0];
    expect(tote).toBeDefined();
    if (!tote) return;
    const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = tote;
    const fields = {
      ...rest,
      colors: withoutRowIds(rest['colors']),
      sizes: withoutRowIds(rest['sizes']),
    };
    const poll = { intervals: [1_000, 2_000, 3_000] };
    const status = (path: string) => async () => (await request.get(path)).status();
    const showsText = (path: string, text: string) => shows(request, path, text);

    // 1. A draft (never published) must not be listed, even though it is a complete document.
    const draftSlug = `e2e-draft-${stamp}`;
    const draft = await request.post(`${API}/products?draft=true`, {
      headers: auth,
      data: { ...fields, slug: draftSlug, name: `مسودة ${stamp}`, _status: 'draft' },
    });
    expect(draft.status()).toBe(201);
    const draftId = ((await draft.json()) as { doc: { id: number } }).doc.id;
    // 2. A new published product gets its page without a deploy.
    const newSlug = `e2e-new-${stamp}`;
    const created = await request.post(`${API}/products`, {
      headers: auth,
      data: { ...fields, slug: newSlug, name: `منتج ${stamp}`, _status: 'published' },
    });
    expect(created.status()).toBe(201);
    const newId = ((await created.json()) as { doc: { id: number } }).doc.id;
    try {
      await expect.poll(showsText('/products', newSlug), { ...poll, timeout: 15_000 }).toBe(true);
      await expect.poll(status(`/products/${newSlug}`), { ...poll, timeout: 15_000 }).toBe(200);
      await expect
        .poll(showsText('/sitemap.xml', newSlug), { ...poll, timeout: 15_000 })
        .toBe(true);
      expect(await showsText('/products', draftSlug)()).toBe(false);
      expect(await showsText('/sitemap.xml', draftSlug)()).toBe(false);
      expect(await status(`/products/${draftSlug}`)()).toBe(404);
    } finally {
      expect((await request.delete(`${API}/products/${newId}`, { headers: auth })).status()).toBe(
        200,
      );
      expect((await request.delete(`${API}/products/${draftId}`, { headers: auth })).status()).toBe(
        200,
      );
    }
    // 3. Deleting regenerates the page (404) and the listing.
    await expect.poll(status(`/products/${newSlug}`), { ...poll, timeout: 15_000 }).toBe(404);
    await expect.poll(showsText('/products', newSlug), { ...poll, timeout: 15_000 }).toBe(false);
  });

  /**
   * The home page and its small collections (BRD 9.4, 9.6; 2b phase 1, ADR-031): a publish
   * is live at once, a draft never reaches the site, a section switches off, the FAQ home
   * limit holds, and the editor / outsider seats see exactly what BRD 9.3 allows. This file
   * runs alone after every other project (the `cms` project), so the mutations below never
   * overlap a public assertion on another worker.
   */
  test.describe('content: home, faqs, testimonials, integrations', () => {
    test('a published ribbon line is live at once; a draft never reaches the site', async ({
      request,
    }) => {
      test.setTimeout(150_000);
      const auth = await login(request, ADMIN);
      const original = await readHome(request, auth);
      // The ribbon's lead line is on every page; no other suite asserts on it.
      const lead = original.ribbon.lead;
      expect(lead).toBeTruthy();
      const stamp = `e2e ${Date.now()}`;
      const withLead = (text: string): HomeDoc => ({
        ...original,
        ribbon: { ...original.ribbon, lead: text },
      });
      try {
        expect(
          (await saveHome(request, auth, withLead(`${lead} ${stamp}`), 'published')).status(),
        ).toBe(200);
        await expect.poll(shows(request, '/', stamp), POLL).toBe(true);
        // A draft autosave on top of the published copy: the site keeps the published line.
        const draftStamp = `${stamp} draft`;
        expect((await saveHome(request, auth, withLead(draftStamp), 'draft')).status()).toBe(200);
        await new Promise((r) => setTimeout(r, 2_500));
        expect(await shows(request, '/', draftStamp)()).toBe(false);
        expect(await shows(request, '/', stamp)()).toBe(true);
      } finally {
        expect((await saveHome(request, auth, withLead(lead), 'published')).status()).toBe(200);
      }
      await expect.poll(shows(request, '/', stamp), POLL).toBe(false);
    });

    test('switching «why us» off removes the section and keeps the tones alternating', async ({
      request,
    }) => {
      test.setTimeout(150_000);
      const auth = await login(request, ADMIN);
      const original = await readHome(request, auth);
      const html = async () => (await request.get('/')).text();
      expect(await html()).toContain('id="why-us"');
      try {
        const off = { ...original, whyUs: { ...original.whyUs, enabled: false } };
        expect((await saveHome(request, auth, off, 'published')).status()).toBe(200);
        await expect.poll(async () => (await html()).includes('id="why-us"'), POLL).toBe(false);
        // Video (ground) is now followed by the next rendered section on surface.
        const page = await html();
        const afterVideo = page.slice(page.indexOf('id="video"'));
        const next = afterVideo.match(
          /<section data-tone="(\w+)"[^>]*id="(testimonials|integrations)"/,
        );
        expect(next?.[1]).toBe('surface');
      } finally {
        const on = { ...original, whyUs: { ...original.whyUs, enabled: true } };
        expect((await saveHome(request, auth, on, 'published')).status()).toBe(200);
      }
      await expect.poll(async () => (await html()).includes('id="why-us"'), POLL).toBe(true);
    });

    test('a strip product unpublished later drops out of the strip; the home stays up', async ({
      request,
    }) => {
      test.setTimeout(150_000);
      const auth = await login(request, ADMIN);
      const list = await request.get(`${API}/products?where[slug][equals]=tote-bag&depth=0`, {
        headers: auth,
      });
      const tote = ((await list.json()) as { docs: Array<{ id: number }> }).docs[0];
      expect(tote).toBeDefined();
      if (!tote) return;
      const setStatus = (status: 'draft' | 'published') =>
        request.patch(`${API}/products/${tote.id}`, { headers: auth, data: { _status: status } });
      const panel = async () =>
        (await (await request.get('/')).text()).includes('data-strip-panel="tote-bag"');
      expect(await panel()).toBe(true);
      try {
        expect((await setStatus('draft')).status()).toBe(200);
        await expect.poll(panel, POLL).toBe(false);
        expect((await request.get('/')).status(), 'home renders the four other panels').toBe(200);
      } finally {
        expect((await setStatus('published')).status()).toBe(200);
      }
      await expect.poll(panel, POLL).toBe(true);
    });

    test('a sixth «show on home» FAQ entry is refused with the Arabic message', async ({
      request,
    }) => {
      const auth = await login(request, ADMIN);
      const list = await request.get(`${API}/faqs?limit=100&depth=0`, { headers: auth });
      type Faq = { id: number; showOnHome?: boolean; question: string };
      const docs = ((await list.json()) as { docs: Faq[] }).docs;
      expect(docs.filter((d) => d.showOnHome)).toHaveLength(5);
      const spare = docs.find((d) => !d.showOnHome);
      expect(spare).toBeDefined();
      if (!spare) return;
      const refused = await request.patch(`${API}/faqs/${spare.id}`, {
        headers: auth,
        data: { showOnHome: true, homeOrder: 1 },
      });
      expect(refused.status()).toBe(400);
      expect(await refused.text()).toContain('at most');
      const after = await request.get(`${API}/faqs/${spare.id}?depth=0`, { headers: auth });
      expect(((await after.json()) as Faq).showOnHome).toBeFalsy();
      // Editing a flagged entry itself is fine: the count excludes the document being saved.
      const flagged = docs.find((d) => d.showOnHome);
      const kept = await request.patch(`${API}/faqs/${flagged?.id}`, {
        headers: auth,
        data: { showOnHome: true },
      });
      expect(kept.status()).toBe(200);
    });

    test('an editor edits the home page and the FAQ, never deletes a published testimonial', async ({
      request,
    }) => {
      const adminAuth = await login(request, ADMIN);
      const editor = await createEditor(request, adminAuth);
      try {
        const auth = await login(request, editor);
        expect((await request.get(`${API}/globals/home?depth=0`, { headers: auth })).status()).toBe(
          200,
        );
        const faqs = await request.get(`${API}/faqs?limit=1&depth=0`, { headers: auth });
        const faq = ((await faqs.json()) as { docs: Array<{ id: number; order: number }> }).docs[0];
        expect(faq).toBeDefined();
        const edit = await request.patch(`${API}/faqs/${faq?.id}`, {
          headers: auth,
          data: { order: faq?.order },
        });
        expect(edit.status(), 'editor editing a FAQ entry').toBe(200);
        const created = await request.post(`${API}/faqs`, {
          headers: auth,
          data: {
            question: `سؤال اختبار ${Date.now()}`,
            answer: 'إجابة.',
            group: 'البداية',
            order: 99,
          },
        });
        expect(created.status(), 'editor adding a FAQ entry').toBe(201);
        const newId = ((await created.json()) as { doc: { id: number } }).doc.id;
        // Live the moment it exists: only an admin deletes it (BRD 9.3).
        expect((await request.delete(`${API}/faqs/${newId}`, { headers: auth })).status()).toBe(
          403,
        );
        expect(
          (await request.delete(`${API}/faqs/${newId}`, { headers: adminAuth })).status(),
        ).toBe(200);
        const testimonials = await request.get(`${API}/testimonials?limit=1`, { headers: auth });
        const t = ((await testimonials.json()) as { docs: Array<{ id: number }> }).docs[0];
        expect(t).toBeDefined();
        const del = await request.delete(`${API}/testimonials/${t?.id}`, { headers: auth });
        expect(del.status(), 'editor deleting a published testimonial').toBe(403);
        const redirect = await request.post(`${API}/redirects`, {
          headers: auth,
          data: { from: '/editor-e2e', to: { type: 'custom', url: '/products' }, type: '301' },
        });
        expect(redirect.status(), 'editor adding a redirect').toBe(403);
        const integration = await request.post(`${API}/integrations`, {
          headers: auth,
          data: { platform: 'salla', name: 'x', nameLatin: 'x', order: 9 },
        });
        expect(integration.status(), 'editor adding a platform (a deploy, not content)').toBe(403);
      } finally {
        expect(
          (await request.delete(`${API}/users/${editor.id}`, { headers: adminAuth })).status(),
        ).toBe(200);
      }
    });

    test('a page published in the admin gets its route and its sitemap entry; deleted, it is a full 404', async ({
      request,
    }) => {
      test.setTimeout(150_000);
      const auth = await login(request, ADMIN);
      const slug = 'creators-e2e';
      const status = async () => (await request.get(`/${slug}`)).status();
      const created = await request.post(`${API}/pages`, {
        headers: auth,
        data: {
          title: 'صفحة المبدعين',
          slug,
          lead: 'للاختبار',
          blocks: [
            {
              blockType: 'cards',
              items: [{ icon: 'Zap', title: 'بطاقة', text: 'نص البطاقة.' }],
            },
          ],
          seo: { title: 'صفحة المبدعين', description: 'وصف للاختبار.' },
          _status: 'published',
        },
      });
      expect(created.status()).toBe(201);
      const id = ((await created.json()) as { doc: { id: number } }).doc.id;
      try {
        await expect.poll(status, POLL).toBe(200);
        const html = await (await request.get(`/${slug}`)).text();
        expect(html).toContain('<h1');
        expect(html).toContain('صفحة المبدعين');
        expect(html).toContain('نص البطاقة.');
        await expect.poll(shows(request, '/sitemap.xml', `/${slug}`), POLL).toBe(true);
        const slugs = (await (
          await request.get(`${API.replace('/payload', '')}/pages/slugs`)
        ).json()) as {
          slugs: string[];
        };
        expect(slugs.slugs).toContain(slug);
      } finally {
        expect((await request.delete(`${API}/pages/${id}`, { headers: auth })).status()).toBe(200);
      }
      await expect.poll(status, POLL).toBe(404);
      // The page's own entry is regenerated at once (a bare 404 from the route); the proxy's
      // allowlist follows within its 20 s stale-while-revalidate window, after which the
      // URL is answered by the global 404 with the full document (B0).
      const fullDocument = async () => {
        const html = await (await request.get(`/${slug}`)).text();
        return html.includes('<html lang="ar" dir="rtl"') && !html.includes('__next_error__');
      };
      await expect
        .poll(fullDocument, { intervals: [1_000, 2_000, 5_000], timeout: 45_000 })
        .toBe(true);
      expect(await (await request.get(`/${slug}`)).text()).toContain('الصفحة غير موجودة');
      await expect.poll(shows(request, '/sitemap.xml', `/${slug}`), POLL).toBe(false);
    });

    test('page slugs the code owns are refused; the seven designed pages cannot be deleted', async ({
      request,
    }) => {
      const auth = await login(request, ADMIN);
      for (const slug of ['products', 'Creators', 'a/b']) {
        const refused = await request.post(`${API}/pages`, {
          headers: auth,
          data: {
            title: 'x',
            slug,
            blocks: [{ blockType: 'miskCredential', title: 'x', text: 'y' }],
            seo: { title: 'x', description: 'y' },
          },
        });
        expect(refused.status(), slug).toBe(400);
      }
      const about = await request.get(`${API}/pages?where[slug][equals]=about&depth=0`, {
        headers: auth,
      });
      const doc = ((await about.json()) as { docs: Array<{ id: number }> }).docs[0];
      expect(doc).toBeDefined();
      const del = await request.delete(`${API}/pages/${doc?.id}`, { headers: auth });
      expect(del.status(), 'deleting a designed page').toBe(400);
      const rename = await request.patch(`${API}/pages/${doc?.id}`, {
        headers: auth,
        data: { slug: 'about-us' },
      });
      expect(rename.status(), 'renaming a designed page').toBe(400);
      expect(await (await request.get('/about')).text()).toContain('حكاية بدأت');
    });

    test('a designed page cannot be unpublished; a draft save on it still passes', async ({
      request,
    }) => {
      const auth = await login(request, ADMIN);
      const about = await request.get(`${API}/pages?where[slug][equals]=about&depth=0`, {
        headers: auth,
      });
      const doc = ((await about.json()) as { docs: Array<{ id: number; title: string }> }).docs[0];
      expect(doc).toBeDefined();
      if (!doc) return;
      const unpublish = await request.patch(`${API}/pages/${doc.id}`, {
        headers: auth,
        data: { _status: 'draft' },
      });
      expect(unpublish.status(), 'unpublishing a designed page').toBe(400);
      expect(await unpublish.text()).toContain('cannot be unpublished');
      expect((await request.get('/about')).status()).toBe(200);
      // A draft on top of the published copy is fine: the site keeps the published title.
      const draft = await request.patch(`${API}/pages/${doc.id}?draft=true`, {
        headers: auth,
        data: { title: `${doc.title} (مسودة)`, _status: 'draft' },
      });
      expect(draft.status(), 'saving a draft of a designed page').toBe(200);
      await new Promise((r) => setTimeout(r, 2_000));
      expect(await (await request.get('/about')).text()).not.toContain('(مسودة)');
      const restore = await request.patch(`${API}/pages/${doc.id}`, {
        headers: auth,
        data: { title: doc.title, _status: 'published' },
      });
      expect(restore.status()).toBe(200);
    });

    // Side-by-side bilingual editing (ADR-057): a localized text field shows both languages,
    // one Save writes both through the second write of the apply hook, and the rest of the
    // document is untouched.
    test('a page title edited in both languages is written by one Publish (ADR-057)', async ({
      page,
      request,
    }) => {
      test.setTimeout(150_000);
      const auth = await login(request, ADMIN);
      const slug = 'bilingual-e2e';
      const created = await request.post(`${API}/pages?locale=ar`, {
        headers: auth,
        data: {
          title: 'صفحة ثنائية اللغة',
          slug,
          blocks: [{ blockType: 'richText', title: 'المقدمة', content: paragraph('فقرة.') }],
          seo: { title: 'صفحة ثنائية اللغة', description: 'وصف للاختبار.' },
          _status: 'published',
        },
      });
      expect(created.status()).toBe(201);
      const createdDoc = (
        (await created.json()) as { doc: { id: number; blocks: Array<{ id: string }> } }
      ).doc;
      const id = createdDoc.id;
      const blockId = createdDoc.blocks[0]!.id;
      const both = async () => {
        const res = await request.get(`${API}/pages/${id}?locale=all&depth=0`, { headers: auth });
        expect(res.status()).toBe(200);
        return (await res.json()) as {
          title: { ar?: string; en?: string };
          lead?: { ar?: string; en?: string };
          seo: { title: { ar?: string; en?: string } };
          translations?: unknown;
        };
      };
      try {
        // The English side: a published page validates every English field on a write, so
        // the block's body (required, localized) is given too, on the same block row.
        const english = await request.patch(`${API}/pages/${id}?locale=en`, {
          headers: auth,
          data: {
            title: 'Bilingual page',
            blocks: [
              {
                id: blockId,
                blockType: 'richText',
                title: 'Introduction',
                content: paragraph('A paragraph.'),
              },
            ],
            seo: { title: 'Bilingual page', description: 'For the test.' },
          },
        });
        expect(english.status()).toBe(200);
        await page.goto('/admin/login');
        await page.locator('#field-email').fill(admin.email);
        await page.locator('#field-password').fill(admin.password);
        await page.locator('form button[type="submit"]').first().click();
        await page.waitForURL((u) => !u.pathname.endsWith('/login'));
        await page.goto(`/admin/collections/pages/${id}?locale=ar`);
        // The title sits in the Content tab; Payload restores the last active tab from the
        // user's preferences after the first render, so the tab is chosen explicitly.
        await page.locator('.tabs-field__tab-button', { hasText: 'Content' }).click();
        // The note says what is side by side; the title carries both inputs, the English one
        // tagged EN and prefilled from the stored English.
        await expect(page.locator('[data-admin-locale-note="ar"]')).toContainText(
          'one Save writes both',
        );
        const pair = page.locator('[data-admin-bilingual="title"]');
        await expect(pair.locator('[data-admin-locale-tag="en"]')).toHaveText('EN');
        const arabic = page.locator('#field-title');
        const other = page.locator('#field-translations__en__title');
        // The twin's first read lands after the form; a loaded runner needs the longer wait.
        await expect(other).toHaveValue('Bilingual page', { timeout: 15_000 });
        // Rich text stays on the switch: the block's body has no pair.
        expect(await page.locator('[data-admin-bilingual^="blocks."]').count()).toBe(0);
        await arabic.fill('صفحة ثنائية اللغة (محدّثة)');
        await other.fill('Bilingual page (updated)');
        await page.locator('#action-save').click();
        await expect(page.locator('.payload-toast-container')).toContainText(
          /updated successfully/i,
        );
        await expect
          .poll(async () => (await both()).title, POLL)
          .toEqual({ ar: 'صفحة ثنائية اللغة (محدّثة)', en: 'Bilingual page (updated)' });
        const doc = await both();
        // The pending JSON is cleared by the second write; the untouched fields keep both languages.
        expect(doc.translations ?? null).toBeNull();
        expect(doc.seo.title).toEqual({ ar: 'صفحة ثنائية اللغة', en: 'Bilingual page' });
        // After the save the English input shows the applied text, not the old prefill.
        await expect(other).toHaveValue('Bilingual page (updated)');
        // Blanking a required English field is refused with the field and the language named,
        // and the Arabic change of the same save does not land either.
        await other.fill('');
        await arabic.fill('لا تُحفظ');
        await page.locator('#action-save').click();
        await expect(page.locator('.payload-toast-container')).toContainText(/Title.*in English/);
        expect((await both()).title).toEqual({
          ar: 'صفحة ثنائية اللغة (محدّثة)',
          en: 'Bilingual page (updated)',
        });
      } finally {
        expect((await request.delete(`${API}/pages/${id}`, { headers: auth })).status()).toBe(200);
      }
    });

    test("the site settings' tagline edited in both languages is written by one Save (ADR-057)", async ({
      page,
      request,
    }) => {
      test.setTimeout(120_000);
      const auth = await login(request, ADMIN);
      const both = async () => {
        const res = await request.get(`${API}/globals/site-settings?locale=all&depth=0`, {
          headers: auth,
        });
        expect(res.status()).toBe(200);
        return (await res.json()) as {
          tagline: { ar?: string; en?: string };
          translations?: unknown;
        };
      };
      const before = (await both()).tagline;
      const restore = async (locale: 'ar' | 'en') =>
        request.post(`${API}/globals/site-settings?locale=${locale}`, {
          headers: auth,
          data: { tagline: before[locale] },
        });
      try {
        await page.goto('/admin/login');
        await page.locator('#field-email').fill(admin.email);
        await page.locator('#field-password').fill(admin.password);
        await page.locator('form button[type="submit"]').first().click();
        await page.waitForURL((u) => !u.pathname.endsWith('/login'));
        await page.goto('/admin/globals/site-settings?locale=ar');
        // The tagline sits in the Brand tab; Payload restores the last active tab from the
        // user's preferences after the first render, so the tab is chosen explicitly.
        await page.locator('.tabs-field__tab-button', { hasText: 'Brand' }).click();
        const arabic = page.locator('#field-tagline');
        const other = page.locator('#field-translations__en__tagline');
        await expect(arabic).toBeVisible();
        await expect(other).toBeEnabled({ timeout: 15_000 });
        await expect(other).toHaveValue(before.en ?? '');
        const stamp = Date.now();
        await arabic.fill(`شعار الاختبار ${stamp}`);
        await other.fill(`Tagline e2e ${stamp}`);
        await page.locator('#action-save').click();
        await expect(page.locator('.payload-toast-container')).toContainText(
          /updated successfully/i,
        );
        await expect
          .poll(async () => (await both()).tagline, POLL)
          .toEqual({ ar: `شعار الاختبار ${stamp}`, en: `Tagline e2e ${stamp}` });
        expect((await both()).translations ?? null).toBeNull();
      } finally {
        expect((await restore('ar')).status()).toBe(200);
        expect((await restore('en')).status()).toBe(200);
      }
      expect((await both()).tagline).toEqual(before);
    });

    test('two blocks of one type on a page get distinct ids and pass axe', async ({
      page,
      request,
    }) => {
      test.setTimeout(150_000);
      const auth = await login(request, ADMIN);
      const slug = 'two-blocks-e2e';
      const created = await request.post(`${API}/pages`, {
        headers: auth,
        data: {
          title: 'صفحة بقسمين',
          slug,
          blocks: [
            { blockType: 'richText', title: 'المقدمة', content: paragraph('فقرة أولى.') },
            { blockType: 'richText', title: 'التفاصيل', content: paragraph('فقرة ثانية.') },
            { blockType: 'miskCredential', title: 'شهادة', text: 'نص الشهادة.' },
          ],
          seo: { title: 'صفحة بقسمين', description: 'وصف للاختبار.' },
          _status: 'published',
        },
      });
      expect(created.status()).toBe(201);
      const id = ((await created.json()) as { doc: { id: number } }).doc.id;
      try {
        await expect.poll(async () => (await request.get(`/${slug}`)).status(), POLL).toBe(200);
        await page.goto(`/${slug}`);
        const labelled = page.locator('main section[aria-labelledby]');
        const ids = await labelled.evaluateAll((els) =>
          els.map((el) => el.getAttribute('aria-labelledby') ?? ''),
        );
        expect(ids).toEqual(['text-title', 'text-2-title', 'misk-title', 'cta-ribbon-title']);
        for (const target of ids) expect(await page.locator(`#${target}`).count(), target).toBe(1);
        await expect(page.locator('h1')).toHaveText('صفحة بقسمين');
        await expect(page.locator('#text-2-title')).toHaveText('التفاصيل');
        const { AxeBuilder } = await import('@axe-core/playwright');
        const results = await new AxeBuilder({ page }).analyze();
        const serious = results.violations.filter((v) =>
          ['serious', 'critical'].includes(v.impact ?? ''),
        );
        expect(
          serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`),
        ).toEqual([]);
      } finally {
        expect((await request.delete(`${API}/pages/${id}`, { headers: auth })).status()).toBe(200);
      }
    });

    test('a redirect added in the admin answers live: 301 rows as 308, 302 rows as 307', async ({
      request,
    }) => {
      test.setTimeout(150_000);
      const auth = await login(request, ADMIN);
      const created: number[] = [];
      const add = async (from: string, url: string, type: '301' | '302') => {
        const res = await request.post(`${API}/redirects`, {
          headers: auth,
          data: { from, to: { type: 'custom', url }, type },
        });
        if (res.status() === 201)
          created.push(((await res.json()) as { doc: { id: number } }).doc.id);
        return res;
      };
      const status = (path: string) => async () =>
        (await request.get(path, { maxRedirects: 0 })).status();
      try {
        expect((await add('/old-e2e', '/products', '301')).status()).toBe(201);
        expect((await add('/temp-e2e', 'https://example.com/promo', '302')).status()).toBe(201);
        await expect.poll(status('/old-e2e'), POLL).toBe(308);
        expect((await request.get('/old-e2e', { maxRedirects: 0 })).headers()['location']).toMatch(
          /\/products$/,
        );
        await expect.poll(status('/temp-e2e'), POLL).toBe(307);
        expect((await request.get('/temp-e2e', { maxRedirects: 0 })).headers()['location']).toBe(
          'https://example.com/promo',
        );
        // The rules: a code-owned source, a loop and an http target are refused.
        expect((await add('/about', '/products', '301')).status()).toBe(400);
        expect((await add('/loop-e2e', '/old-e2e', '301')).status()).toBe(400);
        expect((await add('/http-e2e', 'http://example.com', '301')).status()).toBe(400);
      } finally {
        for (const id of created) {
          expect((await request.delete(`${API}/redirects/${id}`, { headers: auth })).status()).toBe(
            200,
          );
        }
      }
      await expect
        .poll(status('/old-e2e'), { intervals: [1_000, 2_000, 5_000], timeout: 45_000 })
        .toBe(404);
    });

    test('a post written in the admin: refused until it meets the rules, then live on every blog route; deleted, gone (BRD 10.1, ADR-041)', async ({
      request,
      page,
    }) => {
      test.setTimeout(120_000);
      const auth = await login(request, ADMIN);
      const stamp = Date.now();
      const slug = `post-e2e-${stamp}`;
      const title = `مقال اختبار ${stamp}`;
      const hubs = (await (
        await request.get(`${API}/categories?limit=1`, { headers: auth })
      ).json()) as {
        docs: Array<{ id: number; slug: string }>;
      };
      const hub = hubs.docs[0]!;
      const media = (await (
        await request.get(`${API}/media?limit=1`, { headers: auth })
      ).json()) as {
        docs: Array<{ id: number }>;
      };
      const cover = media.docs[0]!.id;
      const base = {
        title,
        slug,
        excerpt: 'مقتطف قصير للاختبار.',
        hub: hub.id,
        cover,
        takeaways: [{ text: 'أولاً' }, { text: 'ثانياً' }, { text: 'ثالثاً' }],
      };
      // A draft with no links saves; publishing it is refused with the reason.
      const created = await request.post(`${API}/posts?draft=true`, {
        headers: auth,
        data: { ...base, _status: 'draft', body: paragraph('لا روابط هنا.') },
      });
      expect(created.status()).toBe(201);
      const id = ((await created.json()) as { doc: { id: number } }).doc.id;
      try {
        const refused = await request.patch(`${API}/posts/${id}`, {
          headers: auth,
          data: { _status: 'published' },
        });
        expect(refused.status()).toBe(400);
        expect(await refused.text()).toContain('at least 2 links');
        // A competitor link is a warning, not a refusal; the warning is written on save.
        const warned = await request.patch(`${API}/posts/${id}?draft=true`, {
          headers: auth,
          data: {
            body: postBody([block('paragraph', [link('https://www.printful.com/x', 'Printful')])]),
          },
        });
        expect(warned.status()).toBe(200);
        const warnings = ((await warned.json()) as { doc: { warnings: Array<{ text: string }> } })
          .doc.warnings;
        expect(warnings.map((w) => w.text)).toEqual(['A link to a competitor: printful.com']);
        // With the links, the publish goes through and every route shows the post.
        const published = await request.patch(`${API}/posts/${id}`, {
          headers: auth,
          data: { body: postBody(), _status: 'published' },
        });
        expect(published.status()).toBe(200);
        const doc = ((await published.json()) as { doc: Record<string, unknown> }).doc;
        expect(doc['readingMinutes']).toBe(1);
        expect(doc['publishedAt']).toBeTruthy();
        // A localised array with no rows reads back empty or null (ADR-043).
        expect(doc['warnings'] ?? []).toEqual([]);
        const status = async () => (await request.get(`/blog/${slug}`)).status();
        await expect.poll(status, POLL).toBe(200);
        const html = await (await request.get(`/blog/${slug}`)).text();
        expect(html).toContain(title);
        expect(html).toContain('id="section-1"');
        for (const route of ['/blog', `/blog/category/${hub.slug}`, '/author/dhia', '/feed.xml']) {
          await expect.poll(async () => (await request.get(route)).text(), POLL).toContain(title);
        }
        await expect
          .poll(async () => (await request.get('/sitemap.xml')).text(), POLL)
          .toContain(`/blog/${slug}`);
        // Nothing public says a machine was involved (D-47), on the page or in the feed.
        for (const surface of [html, await (await request.get('/feed.xml')).text()]) {
          expect(surface).not.toMatch(/ذكاء اصطناعي|generated by|\bAI\b/);
        }
        // Arabic only so far (ADR-043): absent from the English site, no pair, and the
        // switch on its page sends the reader to the English blog's listing (ADR-044), not
        // to a 404.
        expect((await request.get(`/en/blog/${slug}`)).status()).toBe(404);
        expect(await (await request.get('/en/blog')).text()).not.toContain(slug);
        expect(html).not.toContain('<link rel="alternate" hrefLang="en"');
        await page.goto(`/blog/${slug}`);
        await expect(page.locator('[data-language-switch="en"]').first()).toHaveAttribute(
          'href',
          '/en/blog',
        );
        // The English values, judged by the English rules: Arabic prose is the warning there,
        // the reading time follows the English pace, and the pair links both ways.
        const englishTitle = `Test post ${stamp}`;
        const enSaved = await request.patch(`${API}/posts/${id}?locale=en`, {
          headers: auth,
          data: {
            title: englishTitle,
            excerpt: 'A short excerpt for the test.',
            takeaways: [{ text: 'First' }, { text: 'Second' }, { text: 'Third' }],
            body: englishBody(),
          },
        });
        expect(enSaved.status()).toBe(200);
        const enDoc = ((await enSaved.json()) as { doc: Record<string, unknown> }).doc;
        expect((enDoc['warnings'] as Array<{ text: string }>).map((w) => w.text)).toEqual([
          '1 paragraph in Arabic script',
        ]);
        expect(enDoc['readingMinutes']).toBe(1);
        await expect
          .poll(async () => (await request.get(`/en/blog/${slug}`)).status(), POLL)
          .toBe(200);
        const enHtml = await (await request.get(`/en/blog/${slug}`)).text();
        expect(enHtml).toContain(englishTitle);
        expect(enHtml).toContain(`hrefLang="ar" href="https://b7r.sa/blog/${slug}"`);
        expect(enHtml).toContain(`hrefLang="en" href="https://b7r.sa/en/blog/${slug}"`);
        await expect
          .poll(async () => (await request.get(`/blog/${slug}`)).text(), POLL)
          .toContain(`hrefLang="en" href="https://b7r.sa/en/blog/${slug}"`);
        await expect
          .poll(async () => (await request.get('/en/feed.xml')).text(), POLL)
          .toContain(englishTitle);
        // The Arabic version kept its own warnings and reading time.
        const arDoc = (await (
          await request.get(`${API}/posts/${id}?locale=ar&depth=0`, { headers: auth })
        ).json()) as Record<string, unknown>;
        expect(arDoc['warnings'] ?? []).toEqual([]);
        expect(arDoc['title']).toBe(title);
      } finally {
        expect((await request.delete(`${API}/posts/${id}`, { headers: auth })).status()).toBe(200);
      }
      await expect.poll(async () => (await request.get(`/blog/${slug}`)).status(), POLL).toBe(404);
      await expect
        .poll(async () => (await request.get(`/en/blog/${slug}`)).status(), POLL)
        .toBe(404);
    });

    test('the visibility score (ADR-049): the page for the three roles, a change that moves the number, the card', async ({
      page,
      request,
    }) => {
      const auth = await login(request, ADMIN);
      const json = { ...auth, 'Content-Type': 'application/json' };
      // A visitor is sent to the login; an editor sees the sentence and no sidebar entry.
      await page.context().clearCookies();
      await page.goto('/admin/visibility');
      await expect(page).toHaveURL(/\/admin\/login\?redirect=%2Fadmin%2Fvisibility/);
      const editor = await createEditor(request, auth);
      try {
        expect((await page.request.post(`${API}/users/login`, { data: editor })).status()).toBe(
          200,
        );
        await page.goto('/admin/visibility');
        await expect(page.locator('[data-admin-view-refused]')).toContainText(/Admins only/);
        await page.goto('/admin');
        await expect(page.locator('#nav-view-visibility')).toHaveCount(0);
        await expect(page.locator('[data-admin-visibility]')).toHaveCount(0);
      } finally {
        await page.context().clearCookies();
        await request.delete(`${API}/users/${editor.id}`, { headers: auth });
      }
      // The admin: six sections, every finding with its status, the two numbers, axe.
      expect((await page.request.post(`${API}/users/login`, { data: ADMIN })).status()).toBe(200);
      await request.post(`${API}/globals/visibility-checklist`, {
        headers: json,
        data: {
          linkedinCompany: false,
          linkedinFounder: false,
          youtube: false,
          xProfile: false,
          firstMention: false,
        },
      });
      await page.goto('/admin/visibility?fresh=1');
      const report = page.locator('[data-admin-visibility-page]');
      await expect(report).toBeVisible();
      // Inside the admin shell: the sidebar with this page's own entry, the header, the step nav.
      await expect(page.locator('nav #nav-view-visibility')).toHaveAttribute(
        'href',
        '/admin/visibility',
      );
      await expect(page.locator('.app-header')).toBeVisible();
      await expect(page.locator('.step-nav')).toContainText('Visibility score');
      await expect(report.locator('[data-admin-section]')).toHaveCount(6);
      await expect(page.locator('[data-admin-finding]')).toHaveCount(24);
      const before = Number(await report.getAttribute('data-admin-visibility-overall'));
      expect(before).toBeGreaterThan(0);
      expect(before).toBeLessThan(100);
      const siteOnly = Number(
        await page
          .locator('[data-admin-visibility-site-only]')
          .getAttribute('data-admin-visibility-site-only'),
      );
      expect(siteOnly).toBeGreaterThanOrEqual(before);
      // C1 follows the host: CI builds with the production origin (done), the review server
      // does not (missing, in red, and the guide says why: noindex).
      const robots = await (await request.get('/robots.txt')).text();
      const production = robots.includes('Sitemap: https://b7r.sa/sitemap.xml');
      await expect(page.locator('[data-admin-finding="C1"]')).toHaveAttribute(
        'data-status',
        production ? 'done' : 'missing',
      );
      // A done item shows no guide; an open one says why.
      await expect(page.locator('[data-admin-finding="C1"]')).toContainText(
        production ? /production address/ : /noindex/,
      );
      // The FAQ schema and the comparison read done from the seeded pages (ADR-050, BRD 4.18);
      // the checklist is missing with its five items.
      await expect(page.locator('[data-admin-finding="E6"]')).toHaveAttribute(
        'data-status',
        'done',
      );
      await expect(page.locator('[data-admin-finding="E7"]')).toHaveAttribute(
        'data-status',
        'done',
      );
      await expect(page.locator('[data-admin-finding="R1"]')).toHaveAttribute(
        'data-status',
        'missing',
      );
      await expect(
        page.locator('[data-admin-finding="R1"] [data-admin-finding-items] li'),
      ).toHaveCount(5);
      const { AxeBuilder } = await import('@axe-core/playwright');
      const axe = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .include('[data-admin-visibility-page]')
        .analyze();
      expect(
        axe.violations
          .filter((v) => ['serious', 'critical'].includes(v.impact ?? ''))
          .map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`),
      ).toEqual([]);
      // A change that can happen: one checklist box ticked earns two points of ten, pro-rata.
      try {
        expect(
          (
            await request.post(`${API}/globals/visibility-checklist`, {
              headers: json,
              data: { linkedinCompany: true },
            })
          ).status(),
        ).toBe(200);
        await page.goto('/admin/visibility?fresh=1');
        expect(
          Number(
            await page
              .locator('[data-admin-visibility-page]')
              .getAttribute('data-admin-visibility-overall'),
          ),
        ).toBe(before + 2);
        await expect(page.locator('[data-admin-finding="R1"]')).toHaveAttribute(
          'data-status',
          'next',
        );
        await expect(page.locator('[data-admin-finding="R1"]')).toContainText(/1 of 5/);
        const left = page.locator('[data-admin-finding="R1"] [data-admin-finding-items] li');
        await expect(left).toHaveCount(4);
        expect(await left.allTextContents()).not.toContain('LinkedIn company page');
      } finally {
        await request.post(`${API}/globals/visibility-checklist`, {
          headers: json,
          data: { linkedinCompany: false },
        });
      }
      // The dashboard card reads the minute's cache: recompute once after the reset, then look.
      await page.goto('/admin/visibility?fresh=1');
      await page.goto('/admin');
      const card = page.locator('[data-admin-visibility]');
      await expect(card).toBeVisible();
      await expect(card).toHaveAttribute('data-admin-visibility-overall', String(before));
      await expect(card).toHaveAttribute('data-admin-tile', 'score');
      await expect(page.locator('#nav-view-visibility')).toHaveAttribute(
        'href',
        '/admin/visibility',
      );
    });

    test('the visibility services (ADR-049 3b): one service connection per kind, the key validated and masked by kind, "Pull now" once per ten minutes, the snapshot row, the page', async ({
      page,
      request,
    }) => {
      // The `ai` queue serves the pull within the minute; the poll below waits up to 150 s.
      test.setTimeout(240_000);
      const auth = await login(request, ADMIN);
      const json = { ...auth, 'Content-Type': 'application/json' };
      const today = riyadh(new Date()).dateKey;
      const ids: number[] = [];
      const scoreRow = async () => {
        const res = await request.get(
          `${API}/metrics?depth=0&limit=5&where[source][equals]=score&where[date][equals]=${today}`,
          { headers: auth },
        );
        return ((await res.json()) as { docs: Array<Record<string, unknown>> }).docs;
      };
      try {
        // A PageSpeed connection needs no key; a second enabled one of the kind is refused, a
        // disabled one is not.
        const psi = await request.post(`${API}/connections`, {
          headers: json,
          data: { label: 'PageSpeed, e2e', kind: 'pagespeed' },
        });
        expect(psi.status()).toBe(201);
        const psiDoc = ((await psi.json()) as { doc: Record<string, unknown> }).doc;
        ids.push(psiDoc['id'] as number);
        expect(psiDoc['apiKey']).toBeNull();
        expect(psiDoc['model']).toBe('');
        const second = await request.post(`${API}/connections`, {
          headers: json,
          data: { label: 'PageSpeed, e2e (second)', kind: 'pagespeed' },
        });
        expect(second.status()).toBe(400);
        expect(await second.text()).toMatch(/One connection of the kind .*PageSpeed Insights/);
        const off = await request.post(`${API}/connections`, {
          headers: json,
          data: { label: 'PageSpeed, e2e (off)', kind: 'pagespeed', enabled: false },
        });
        expect(off.status()).toBe(201);
        ids.push(((await off.json()) as { doc: { id: number } }).doc.id);
        // A Search Console row takes a service account key file, nothing else, and masks as
        // the account's e-mail.
        const bad = await request.post(`${API}/connections`, {
          headers: json,
          data: { label: 'Search Console, e2e', kind: 'google-search-console', apiKey: 'sk-x' },
        });
        expect(bad.status()).toBe(400);
        expect(await bad.text()).toMatch(/Service account key: not JSON/);
        const { generateKeyPairSync } = await import('node:crypto');
        const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
        const keyFile = JSON.stringify({
          type: 'service_account',
          client_email: 'seo-e2e@b7r-e2e.iam.gserviceaccount.com',
          private_key: privateKey.export({ type: 'pkcs8', format: 'pem' }),
          private_key_id: 'e2e',
        });
        const google = await request.post(`${API}/connections`, {
          headers: json,
          data: { label: 'Search Console, e2e', kind: 'google-search-console', apiKey: keyFile },
        });
        expect(google.status()).toBe(201);
        const googleDoc = ((await google.json()) as { doc: Record<string, unknown> }).doc;
        ids.push(googleDoc['id'] as number);
        expect(googleDoc['apiKey']).toBe('••••@b7r-e2e.iam.gserviceaccount.com');
        // A partial update carries no kind; the stored row still says the key is a key file.
        const partial = await request.patch(`${API}/connections/${googleDoc['id']}`, {
          headers: json,
          data: { apiKey: 'sk-x' },
        });
        expect(partial.status()).toBe(400);
        expect(await partial.text()).toMatch(/Service account key: not JSON/);
        // The page: the three panels, PageSpeed and Search Console connected without a
        // snapshot yet, Bing with its Connect link; the Snapshots entry under the Score.
        expect((await page.request.post(`${API}/users/login`, { data: ADMIN })).status()).toBe(200);
        await page.goto('/admin/visibility?fresh=1');
        const signals = page.locator('[data-admin-visibility-signals]');
        await expect(signals).toBeVisible();
        await expect(signals.locator('[data-admin-signal="PageSpeed"]')).toHaveAttribute(
          'data-signal-state',
          'waiting',
        );
        await expect(signals.locator('[data-admin-signal="Search Console"]')).toHaveAttribute(
          'data-signal-state',
          'waiting',
        );
        const bing = signals.locator('[data-admin-signal="Bing Webmaster"]');
        await expect(bing).toHaveAttribute('data-signal-state', 'absent');
        await expect(bing.locator('a', { hasText: 'Connect' })).toHaveAttribute(
          'href',
          '/admin/collections/connections',
        );
        // The two service rows go before the pull, so the job hits no outside service from
        // here: the score row is what it writes.
        for (const id of ids.splice(0)) {
          expect(
            (await request.delete(`${API}/connections/${id}`, { headers: auth })).status(),
          ).toBe(200);
        }
        // "Pull now": an outsider is refused; the button queues the job once; a second call
        // within ten minutes is told to wait.
        expect(
          (
            await request.post('/api/visibility/pull', {
              headers: { 'Content-Type': 'application/json' },
              data: {},
            })
          ).status(),
        ).toBe(403);
        const before = (await scoreRow())[0]?.['updatedAt'] as string | undefined;
        await page.locator('[data-admin-action="visibility-pull"]').click();
        await expect(page.locator('[data-admin-action-result="done"]')).toHaveText(/Queued/);
        const again = await request.post('/api/visibility/pull', { headers: json, data: {} });
        expect(again.status()).toBe(429);
        expect(Number(again.headers()['retry-after'])).toBeGreaterThan(0);
        // The `ai` queue serves it within the minute: one score row for today, replaced
        // rather than doubled when the day already had one.
        await expect
          .poll(
            async () => {
              const rows = await scoreRow();
              const stamp = rows[0]?.['updatedAt'] as string | undefined;
              return rows.length === 1 && stamp !== undefined && stamp !== before;
            },
            { intervals: [2_000, 5_000], timeout: 150_000 },
          )
          .toBe(true);
        const row = (await scoreRow())[0]!;
        const data = row['data'] as { overall: number; siteOnly: number; sections: object };
        expect(data.overall).toBeGreaterThan(0);
        expect(data.siteOnly).toBeGreaterThanOrEqual(data.overall);
        expect(Object.keys(data.sections).toSorted()).toEqual([
          'corroboration',
          'crawl',
          'extractability',
          'identity',
          'measurement',
          'signals',
        ]);
        // Snapshots are read-only and admin-only.
        expect((await request.post(`${API}/metrics`, { headers: json, data: row })).status()).toBe(
          403,
        );
        const editor = await createEditor(request, auth);
        try {
          const editorAuth = await login(request, editor);
          expect((await request.get(`${API}/metrics`, { headers: editorAuth })).status()).toBe(403);
        } finally {
          await request.delete(`${API}/users/${editor.id}`, { headers: auth });
        }
        expect((await request.get(`${API}/metrics`)).status()).toBe(403);
        // Snapshots sit under the Score page in the sidebar.
        await page.goto('/admin');
        await expect(page.locator('#nav-metrics')).toHaveAttribute(
          'href',
          '/admin/collections/metrics',
        );
        await expect(page.locator('#nav-metrics')).toHaveAttribute('data-admin-entry', 'secondary');
      } finally {
        for (const id of ids) await request.delete(`${API}/connections/${id}`, { headers: auth });
      }
    });

    test('the citation ledger (ADR-049 3c): the prompts, "Run now" once per ten minutes, a mock run writing one citation per prompt and one run, the page', async ({
      page,
      request,
    }) => {
      // The `ai` queue serves the batch within the minute; the poll below waits up to 150 s.
      test.setTimeout(240_000);
      const auth = await login(request, ADMIN);
      const json = { ...auth, 'Content-Type': 'application/json' };
      const ids: number[] = [];
      try {
        // The seed's fifteen prompts, admins only; a new one is a plain create.
        const seeded = (await (
          await request.get(`${API}/prompts?limit=0&where[enabled][equals]=true`, { headers: auth })
        ).json()) as { totalDocs: number; docs: Array<{ language: string; namesBrand: boolean }> };
        expect(seeded.totalDocs).toBeGreaterThanOrEqual(15);
        const editor = await createEditor(request, auth);
        try {
          const editorAuth = await login(request, editor);
          expect((await request.get(`${API}/prompts`, { headers: editorAuth })).status()).toBe(403);
          expect((await request.get(`${API}/citations`, { headers: editorAuth })).status()).toBe(
            403,
          );
        } finally {
          await request.delete(`${API}/users/${editor.id}`, { headers: auth });
        }
        // A mock AI connection for the batch (AI_CONTENT_MOCK=1 on the review server and CI).
        const made = await request.post(`${API}/connections`, {
          headers: json,
          data: { label: 'Mock, ledger e2e', kind: 'mock' },
        });
        expect(made.status()).toBe(201);
        const mockId = ((await made.json()) as { doc: { id: number } }).doc.id;
        ids.push(mockId);
        // "Run now": an outsider is refused; the button queues once; the second call waits.
        expect(
          (
            await request.post('/api/visibility/ledger', {
              headers: { 'Content-Type': 'application/json' },
              data: {},
            })
          ).status(),
        ).toBe(403);
        expect((await page.request.post(`${API}/users/login`, { data: ADMIN })).status()).toBe(200);
        await page.goto('/admin/visibility');
        const ledger = page.locator('[data-admin-visibility-ledger]');
        await expect(ledger).toBeVisible();
        await page.locator('[data-admin-action="visibility-ledger"]').click();
        await expect(
          page.locator(
            '[data-admin-action="visibility-ledger"] ~ [data-admin-action-result="done"]',
          ),
        ).toHaveText(/Queued/);
        const again = await request.post('/api/visibility/ledger', { headers: json, data: {} });
        expect(again.status()).toBe(429);
        // One `citation` run on the mock connection, done, with the label saying how many.
        const latestRun = async () => {
          const res = await request.get(
            `${API}/ai-runs?sort=-createdAt&limit=1&depth=0&where[connection][equals]=${mockId}&where[kind][equals]=citation`,
            { headers: auth },
          );
          return ((await res.json()) as { docs: Array<Record<string, unknown>> }).docs[0];
        };
        await expect
          .poll(async () => (await latestRun())?.['status'] ?? 'none', {
            intervals: [2_000, 5_000],
            timeout: 150_000,
          })
          .not.toMatch(/running|none/);
        const batch = (await latestRun())!;
        expect(batch['status'], JSON.stringify(batch['steps'])).toBe('done');
        expect(batch['label']).toMatch(
          /^Citation ledger, Mock, ledger e2e: \d+ prompts, \d+ cited$/,
        );
        expect(batch['costUsd']).toBe(0);
        // One citation per enabled prompt, the Arabic ones named and linked (the mock's rule),
        // the brand-naming prompts flagged as such.
        const rows = (await (
          await request.get(`${API}/citations?limit=0&depth=0&where[run][equals]=${batch['id']}`, {
            headers: auth,
          })
        ).json()) as {
          totalDocs: number;
          docs: Array<{
            id: number;
            mentioned: boolean;
            linked: boolean;
            namesBrand: boolean;
            mode: string;
            provider: string;
            promptText: string;
            title: string;
          }>;
        };
        expect(rows.totalDocs).toBe(seeded.totalDocs);
        expect(rows.docs.filter((r) => r.mentioned).length).toBe(
          seeded.docs.filter((p) => p.language === 'ar').length,
        );
        expect(rows.docs.filter((r) => r.namesBrand).length).toBe(
          seeded.docs.filter((p) => p.namesBrand).length,
        );
        expect(rows.docs.every((r) => r.provider === 'mock' && r.mode === 'plain')).toBe(true);
        // The row keeps what was asked and reads in the list by day and connection.
        expect(rows.docs.every((r) => r.promptText.length > 0)).toBe(true);
        expect(rows.docs[0]!.title).toMatch(/^\d{4}-\d{2}-\d{2} · Mock, ledger e2e$/);
        expect(rows.docs.filter((r) => r.linked).length).toBe(
          rows.docs.filter((r) => r.mentioned).length,
        );
        // Citations are read-only.
        expect(
          (await request.post(`${API}/citations`, { headers: json, data: rows.docs[0] })).status(),
        ).toBe(403);
        // The page: the engine's rate card, a check on an Arabic prompt, a cross on an English
        // one, the competitors line; the score's M3 and P4 read the run.
        await page.goto('/admin/visibility?fresh=1');
        await expect(ledger.locator(`[data-admin-ledger-engine="${mockId}"]`)).toContainText(
          /Mock, ledger e2e/,
        );
        expect(await ledger.locator('[data-admin-cited="true"]').count()).toBeGreaterThan(0);
        expect(await ledger.locator('[data-admin-cited="false"]').count()).toBeGreaterThan(0);
        await expect(ledger.locator('[data-admin-ledger-competitors]')).toContainText(/printful/);
        await expect(page.locator('[data-admin-finding="M3"]')).toHaveAttribute(
          'data-status',
          'done',
        );
        await expect(page.locator('[data-admin-finding="M2"]')).toHaveAttribute(
          'data-status',
          'done',
        );
        // P4 has rows to read: done or next by the rate (real engines' rows may share the window).
        expect(await page.locator('[data-admin-finding="P4"]').getAttribute('data-status')).toMatch(
          /done|next/,
        );
        // The whole answer opens in a dialog, formatted; the badge reads the verdict in words.
        await expect(ledger.locator('[data-admin-cited="true"]').first()).toContainText(
          'Named B7R',
        );
        await ledger.locator('[data-admin-answer-open]').first().click();
        const dialog = page.locator('[data-admin-answer]');
        await expect(dialog).toBeVisible();
        await expect(dialog.locator('.prose')).toContainText(/بحر برنت|Printful/);
        await page.keyboard.press('Escape');
        await expect(dialog).toBeHidden();
        // A wrong batch can be removed: the rows and the run go, the prompts stay.
        const gone = await request.delete(`${API}/citations?where[run][equals]=${batch['id']}`, {
          headers: auth,
        });
        expect(gone.status()).toBe(200);
        expect(
          (
            (await (
              await request.get(`${API}/citations?limit=0&where[run][equals]=${batch['id']}`, {
                headers: auth,
              })
            ).json()) as { totalDocs: number }
          ).totalDocs,
        ).toBe(0);
        expect(
          (await request.delete(`${API}/ai-runs/${batch['id']}`, { headers: auth })).status(),
        ).toBe(200);
      } finally {
        // Whatever failed above, the mock leaves nothing behind: its rows, its runs, its row.
        await request.delete(`${API}/citations?where[provider][equals]=mock&limit=0`, {
          headers: auth,
        });
        await request.delete(`${API}/ai-runs?where[provider][equals]=mock&limit=0`, {
          headers: auth,
        });
        for (const id of ids) await request.delete(`${API}/connections/${id}`, { headers: auth });
      }
    });

    test('the compare page (ADR-050): the seeded comparison is live in both languages; a comparison of its own renders its table and lists, passes axe, and E7 reads done', async ({
      page,
      request,
    }) => {
      const auth = await login(request, ADMIN);
      const json = { ...auth, 'Content-Type': 'application/json' };
      const stamp = Date.now();
      const slug = `compare-e2e-${stamp}`;
      // The seeded comparison (BRD 4.18) is published: both routes answer with the block.
      const seeded = (await (
        await request.get(`${API}/pages?where[slug][equals]=compare-printful&depth=0`, {
          headers: auth,
        })
      ).json()) as {
        docs: Array<{ id: number; _status: string; blocks: Array<{ blockType: string }> }>;
      };
      expect(seeded.docs[0]?._status).toBe('published');
      expect(seeded.docs[0]?.blocks[0]?.blockType).toBe('compare');
      for (const path of ['/compare-printful', '/en/compare-printful']) {
        const res = await request.get(path);
        expect(res.status(), path).toBe(200);
        expect(await res.text()).toContain('data-block="compare"');
      }
      // A published comparison of its own, with the seeded block's shape.
      const comparison = {
        blockType: 'compare',
        intro: 'مقارنة للاختبار.',
        ours: 'بحر برنت',
        theirs: 'Printful',
        asOf: '2026-09-16T00:00:00.000Z',
        rows: [
          { criterion: 'أين تُطبع القطعة', ours: 'جدة', theirs: 'أوروبا' },
          { criterion: 'مدة التوصيل', ours: 'حتى 5 أيام', theirs: 'أسبوعان إلى أربعة' },
          { criterion: 'الحد الأدنى', ours: 'قطعة واحدة', theirs: 'قطعة واحدة' },
        ],
        bestFor: [{ text: 'تاجراً على سلة أو زد' }],
        notBestFor: [{ text: 'طلبيات كبيرة' }],
        closing: 'الخلاصة للاختبار.',
      };
      const created = await request.post(`${API}/pages`, {
        headers: json,
        data: {
          slug,
          title: `مقارنة الاختبار ${stamp}`,
          blocks: [comparison],
          seo: { title: 'مقارنة الاختبار', description: 'مقارنة للاختبار بين بحر برنت وغيره.' },
          _status: 'published',
        },
      });
      expect(created.status(), await created.text()).toBe(201);
      const createdDoc = (
        (await created.json()) as { doc: { id: number; blocks: Array<{ id: string }> } }
      ).doc;
      const id = createdDoc.id;
      const blockId = createdDoc.blocks[0]!.id;
      try {
        // The proxy's allowlist of published slugs refreshes within seconds (ADR-032).
        await expect.poll(async () => (await request.get(`/${slug}`)).status(), POLL).toBe(200);
        await page.goto(`/${slug}`);
        const section = page.locator('[data-block="compare"]');
        await expect(section).toBeVisible();
        await expect(section.locator('h1')).toHaveText(`مقارنة الاختبار ${stamp}`);
        await expect(section.locator('tbody th[scope="row"]')).toHaveCount(3);
        await expect(section.locator('thead th').nth(1)).toHaveText('بحر برنت');
        await expect(section.locator('[data-compare-list="best"] li')).toHaveCount(1);
        await expect(section.locator('[data-compare-list="not"] li')).toHaveCount(1);
        await expect(section.locator('time')).toHaveAttribute('datetime', '2026-09-16');
        // No link leaves the site from the block (BRD 7.9).
        await expect(section.locator('a')).toHaveCount(0);
        const { AxeBuilder } = await import('@axe-core/playwright');
        const axe = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa'])
          .include('[data-block="compare"]')
          .analyze();
        expect(
          axe.violations
            .filter((v) => ['serious', 'critical'].includes(v.impact ?? ''))
            .map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`),
        ).toEqual([]);
        // The English form of the same page renders the same table: the same block row (its
        // id) takes the English values, so the Arabic side keeps its own.
        const english = await request.patch(`${API}/pages/${id}?locale=en`, {
          headers: json,
          data: {
            title: `Test comparison ${stamp}`,
            blocks: [
              {
                ...comparison,
                id: blockId,
                intro: 'A test comparison.',
                ours: 'B7R Print',
                rows: [
                  { criterion: 'Printed where', ours: 'Jeddah', theirs: 'Europe' },
                  { criterion: 'Delivery', ours: 'Up to 5 days', theirs: 'Two to four weeks' },
                  { criterion: 'Minimum', ours: 'One piece', theirs: 'One piece' },
                ],
                bestFor: [{ text: 'a Salla or Zid merchant' }],
                notBestFor: [{ text: 'large runs' }],
                closing: 'The verdict, for the test.',
              },
            ],
            seo: { title: 'Test comparison', description: 'A test comparison of B7R Print.' },
          },
        });
        expect(english.status(), await english.text()).toBe(200);
        // The English page carries the block's table once the publish has revalidated it (the
        // header names the brand on every page, so the table is the marker).
        await expect
          .poll(
            async () =>
              (await (await request.get(`/en/${slug}`)).text()).includes('data-block="compare"'),
            POLL,
          )
          .toBe(true);
        await page.goto(`/en/${slug}`);
        await expect(page.locator('[data-block="compare"] thead th').nth(1)).toHaveText(
          'B7R Print',
        );
        await expect(page.locator('[data-block="compare"] tbody th').first()).toHaveText(
          'Printed where',
        );
        // E7 reads done while a compare page is published (and E6 from the FAQ page).
        expect((await page.request.post(`${API}/users/login`, { data: ADMIN })).status()).toBe(200);
        await page.goto('/admin/visibility?fresh=1');
        await expect(page.locator('[data-admin-finding="E7"]')).toHaveAttribute(
          'data-status',
          'done',
        );
        await expect(page.locator('[data-admin-finding="E6"]')).toHaveAttribute(
          'data-status',
          'done',
        );
      } finally {
        await request.delete(`${API}/pages/${id}`, { headers: auth });
        await page.goto('/admin/visibility?fresh=1');
      }
    });

    test('traffic (ADR-048): landings and crawls are counted by day, source and page; the beacon fires once; outsiders and editors are refused', async ({
      page,
      request,
    }) => {
      const auth = await login(request, ADMIN);
      // The request fixture resolves paths against the base URL; the beacon's Origin must match it.
      const origin = new URL((await request.get('/api/health')).url()).origin;
      const site = {
        'Content-Type': 'application/json',
        Origin: origin,
        'User-Agent': 'Mozilla/5.0 Chrome/129.0',
      };
      const today = riyadh(new Date()).dateKey;
      const rowsOf = async (where: Record<string, string>) => {
        const query = Object.entries({ ...where, date: today })
          .map(([k, v]) => `where[${k}][equals]=${encodeURIComponent(v)}`)
          .join('&');
        const res = await request.get(`${API}/traffic?limit=50&depth=0&${query}`, {
          headers: auth,
        });
        return ((await res.json()) as { docs: Array<{ hits: number }> }).docs;
      };
      const hitsOf = async (where: Record<string, string>) =>
        (await rowsOf(where)).reduce((n, r) => n + r.hits, 0);
      // A stamp makes this run's page its own row.
      const path = `/blog/e2e-${Date.now()}`;
      const chatgptBefore = await hitsOf({ kind: 'landing', source: 'chatgpt.com', path });
      // Two landings, one by referrer and one by the token ChatGPT appends: one row, two hits.
      for (const body of [
        { path, referrer: 'https://chatgpt.com/c/abc', utmSource: '' },
        { path, referrer: '', utmSource: 'chatgpt.com' },
      ]) {
        expect(
          (await request.post('/api/traffic/landing', { headers: site, data: body })).status(),
        ).toBe(204);
      }
      // A bot that runs scripts sends nothing worth storing; the crawler counter saw it already.
      expect(
        (
          await request.post('/api/traffic/landing', {
            headers: { ...site, 'User-Agent': 'Mozilla/5.0 (compatible; GPTBot/1.2)' },
            data: { path, referrer: 'https://bot-check.example.com/', utmSource: '' },
          })
        ).status(),
      ).toBe(204);
      // A foreign origin, no origin at all, and a body that is not a landing.
      expect(
        (
          await request.post('/api/traffic/landing', {
            headers: { ...site, Origin: 'https://evil.example.com' },
            data: { path, referrer: '', utmSource: '' },
          })
        ).status(),
      ).toBe(403);
      expect(
        (
          await request.post('/api/traffic/landing', {
            headers: { 'Content-Type': 'application/json', 'User-Agent': site['User-Agent'] },
            data: { path, referrer: '', utmSource: '' },
          })
        ).status(),
      ).toBe(403);
      expect(
        (
          await request.post('/api/traffic/landing', {
            headers: site,
            data: { path: 'https://evil.example.com/', referrer: '', utmSource: '' },
          })
        ).status(),
      ).toBe(400);
      // A crawler's document GET of a page and of llms.txt is counted by the proxy; a crawl
      // report without the internal token is refused.
      const bot = {
        'User-Agent': 'Mozilla/5.0 (compatible; GPTBot/1.2; +https://openai.com/gptbot)',
      };
      expect((await request.get(path, { headers: bot })).status()).toBe(404);
      expect((await request.get('/llms.txt', { headers: bot })).status()).toBe(200);
      expect(
        (
          await request.post('/api/traffic/crawl', {
            headers: { 'Content-Type': 'application/json' },
            data: { bot: 'gptbot', path },
          })
        ).status(),
      ).toBe(403);
      // The client beacon: a page opened from ChatGPT posts once; a move inside the site posts nothing.
      const posts: string[] = [];
      page.on('request', (r) => {
        if (r.url().endsWith('/api/traffic/landing') && r.method() === 'POST')
          posts.push(r.postData() ?? '');
      });
      await page.goto('/products', { referer: 'https://chatgpt.com/' });
      await expect.poll(() => posts.length, { timeout: 10_000 }).toBe(1);
      expect(posts[0]).toContain('"referrer":"https://chatgpt.com/"');
      await page.locator('main a[href^="/products/"]').first().click();
      await page.waitForURL(/\/products\/[^/]+$/);
      await page.waitForTimeout(1_500);
      expect(posts).toHaveLength(1);
      // The batcher lands within its ten seconds: the rows say so.
      await expect
        .poll(() => hitsOf({ kind: 'landing', source: 'chatgpt.com', path }), { timeout: 25_000 })
        .toBe(chatgptBefore + 2);
      expect(await rowsOf({ kind: 'landing', source: 'bot-check.example.com' })).toEqual([]);
      expect(await hitsOf({ kind: 'crawl', source: 'gptbot', path })).toBeGreaterThanOrEqual(1);
      expect(
        await hitsOf({ kind: 'crawl', source: 'gptbot', path: '/llms.txt' }),
      ).toBeGreaterThanOrEqual(1);
      // Editors cannot read the count; the rows cannot be written through the API.
      const editor = await createEditor(request, auth);
      try {
        const editorAuth = await login(request, editor);
        expect((await request.get(`${API}/traffic`, { headers: editorAuth })).status()).toBe(403);
      } finally {
        await request.delete(`${API}/users/${editor.id}`, { headers: auth });
      }
      expect(
        (
          await request.post(`${API}/traffic`, {
            headers: { ...auth, 'Content-Type': 'application/json' },
            data: {
              date: today,
              kind: 'landing',
              source: 'forged.example.com',
              path: '/',
              hits: 99,
            },
          })
        ).status(),
      ).toBe(403);
      // The Traffic page: a visitor is sent to the login with the way back; an editor sees the
      // sentence; an admin sees the ranges, the tables and the honesty lines, and reaches it
      // from the sidebar. The dashboard card links to it and shows the week.
      await page.context().clearCookies();
      await page.goto('/admin/traffic');
      await expect(page).toHaveURL(/\/admin\/login\?redirect=%2Fadmin%2Ftraffic/);
      const pageEditor = await createEditor(request, auth);
      try {
        expect((await page.request.post(`${API}/users/login`, { data: pageEditor })).status()).toBe(
          200,
        );
        await page.goto('/admin/traffic');
        await expect(page.locator('[data-admin-view-refused]')).toContainText(/Admins only/);
        await expect(page.locator('[data-admin-traffic-page]')).toHaveCount(0);
        await page.goto('/admin');
        await expect(page.locator('#nav-view-traffic')).toHaveCount(0);
      } finally {
        await page.context().clearCookies();
        await request.delete(`${API}/users/${pageEditor.id}`, { headers: auth });
      }
      expect((await page.request.post(`${API}/users/login`, { data: ADMIN })).status()).toBe(200);
      await page.goto('/admin');
      const card = page.locator('[data-admin-traffic]');
      await expect(card).toBeVisible();
      expect(Number(await card.getAttribute('data-admin-traffic-landings'))).toBeGreaterThanOrEqual(
        2,
      );
      await expect(card.locator('[data-admin-traffic-groups] li')).toHaveCount(5);
      await expect(card).toContainText(/AI assistants/);
      // The sidebar carries the page (a drawer at this width, so the address is typed).
      await expect(page.locator('#nav-view-traffic')).toHaveAttribute('href', '/admin/traffic');
      await page.goto('/admin/traffic');
      const report = page.locator('[data-admin-traffic-page]');
      await expect(report).toHaveAttribute('data-admin-traffic-page', '30');
      // Inside the admin shell: the sidebar, the header, the step nav naming the page.
      await expect(page.locator('nav #nav-view-traffic')).toHaveCount(1);
      await expect(page.locator('.app-header')).toBeVisible();
      await expect(page.locator('.step-nav')).toContainText('Traffic');
      await expect(page.locator('[data-admin-traffic-range] a[aria-current="page"]')).toHaveText(
        /30 days/,
      );
      await expect(page.locator('[data-admin-traffic-section="channels"]')).toContainText(
        /ChatGPT/,
      );
      await expect(page.locator('[data-admin-traffic-section="sources"]')).toContainText(
        /chatgpt\.com/,
      );
      // The pages table holds the top twenty; the suites' own landings can crowd this run's page
      // out (CI runs the public projects first), so the home page is the row that is always there.
      await expect(page.locator('[data-admin-traffic-section="pages"]')).toContainText('/');
      await expect(page.locator('[data-admin-traffic-section="crawlers"]')).toContainText(/GPTBot/);
      await expect(page.locator('footer')).toContainText(/not an audit/);
      const { AxeBuilder } = await import('@axe-core/playwright');
      const axe = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .include('[data-admin-traffic-page]')
        .analyze();
      expect(
        axe.violations
          .filter((v) => ['serious', 'critical'].includes(v.impact ?? ''))
          .map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`),
      ).toEqual([]);
      await page.goto('/admin/traffic?days=7');
      await expect(page.locator('[data-admin-traffic-page]')).toHaveAttribute(
        'data-admin-traffic-page',
        '7',
      );
      await page.goto('/admin/traffic?days=999');
      await expect(page.locator('[data-admin-traffic-page]')).toHaveAttribute(
        'data-admin-traffic-page',
        '30',
      );
    });

    test('connections (ADR-047): a key is stored masked, a test records its outcome, the limit and the guard hold; editors are refused', async ({
      page,
      request,
    }) => {
      const auth = await login(request, ADMIN);
      const json = { ...auth, 'Content-Type': 'application/json' };
      const ids: number[] = [];
      try {
        // A new connection: the key comes back as a mask, the empty model and rates as the
        // service's usual ones (the cheap model since Phase 3, 2026-09-18).
        const made = await request.post(`${API}/connections`, {
          headers: json,
          data: { label: 'OpenAI, e2e', kind: 'openai', apiKey: 'sk-e2e-not-a-real-key-7890' },
        });
        expect(made.status()).toBe(201);
        const openai = ((await made.json()) as { doc: Record<string, unknown> }).doc;
        ids.push(openai['id'] as number);
        expect(openai['apiKey']).toBe('••••7890');
        expect(openai['model']).toBe('gpt-4.1-mini');
        expect(openai['inputPerMillionUsd']).toBe(0.4);
        expect(openai['outputPerMillionUsd']).toBe(1.6);
        expect(openai['spentThisMonthUsd']).toBe(0);
        expect(openai['callsThisMonth']).toBe(0);
        // Saving the mask keeps the key; the list never shows it either.
        const kept = await request.patch(`${API}/connections/${openai['id']}`, {
          headers: json,
          data: { apiKey: '••••7890', label: 'OpenAI, e2e (kept)' },
        });
        expect(((await kept.json()) as { doc: { apiKey: string } }).doc.apiKey).toBe('••••7890');
        const listed = await (
          await request.get(`${API}/connections?limit=50`, { headers: auth })
        ).text();
        expect(listed).not.toContain('sk-e2e-not-a-real-key');
        // A compatible endpoint needs an https address; a test against a closed port fails
        // with the reason, never the key, and the outcome is recorded on the row.
        const badUrl = await request.post(`${API}/connections`, {
          headers: json,
          data: { label: 'Local', kind: 'openai-compatible', baseUrl: 'http://localhost:9/v1' },
        });
        expect(badUrl.status()).toBe(400);
        const local = await request.post(`${API}/connections`, {
          headers: json,
          data: {
            label: 'Local, e2e',
            kind: 'openai-compatible',
            baseUrl: 'https://127.0.0.1:9/v1',
            model: 'llama',
            apiKey: 'local-secret-key-abcdef',
          },
        });
        expect(local.status()).toBe(201);
        const localId = ((await local.json()) as { doc: { id: number } }).doc.id;
        ids.push(localId);
        const failed = await request.post('/api/connections/test', {
          headers: json,
          data: { id: localId },
        });
        expect(failed.status()).toBe(502);
        const failedBody = (await failed.json()) as { error: string };
        expect(failedBody.error).not.toContain('local-secret-key');
        expect(failedBody.error.length).toBeLessThanOrEqual(200);
        const afterFail = (await (
          await request.get(`${API}/connections/${localId}?depth=0`, { headers: auth })
        ).json()) as Record<string, unknown>;
        expect(afterFail['lastTestOk']).toBe(false);
        expect(afterFail['lastTestMessage']).toBe(failedBody.error);
        expect(typeof afterFail['lastTestAt']).toBe('string');
        // The test's own write omitted the key; the row still holds it (the secret field reads
        // the stored ciphertext, never the mask a hook is handed).
        expect(afterFail['apiKey']).toBe('••••cdef');
        // The mock answers without a call; a second test within ten seconds is refused.
        const mockId = await mockConnectionId(request, auth);
        const ok = await request.post('/api/connections/test', {
          headers: json,
          data: { id: mockId },
        });
        expect(ok.status()).toBe(200);
        expect(await ok.json()).toEqual({ ok: true, message: 'mock' });
        const tooSoon = await request.post('/api/connections/test', {
          headers: json,
          data: { id: mockId },
        });
        expect(tooSoon.status()).toBe(429);
        const afterOk = (await (
          await request.get(`${API}/connections/${mockId}?depth=0`, { headers: auth })
        ).json()) as Record<string, unknown>;
        expect(afterOk['lastTestOk']).toBe(true);
        expect(afterOk['lastTestMessage']).toBe('mock');
        // The stored test outcome cannot be written through the API.
        await request.patch(`${API}/connections/${mockId}`, {
          headers: json,
          data: { lastTestOk: false, lastTestMessage: 'forged' },
        });
        const notForged = (await (
          await request.get(`${API}/connections/${mockId}?depth=0`, { headers: auth })
        ).json()) as Record<string, unknown>;
        expect(notForged['lastTestMessage']).toBe('mock');
        // Editors and outsiders: no list, no test.
        const editor = await createEditor(request, auth);
        try {
          const editorAuth = await login(request, editor);
          expect((await request.get(`${API}/connections`, { headers: editorAuth })).status()).toBe(
            403,
          );
          expect(
            (
              await request.post('/api/connections/test', {
                headers: { ...editorAuth, 'Content-Type': 'application/json' },
                data: { id: mockId },
              })
            ).status(),
          ).toBe(403);
        } finally {
          await request.delete(`${API}/users/${editor.id}`, { headers: auth });
        }
        expect(
          (
            await request.post('/api/connections/test', {
              headers: { 'Content-Type': 'application/json' },
              data: { id: mockId },
            })
          ).status(),
        ).toBe(403);
        // The panel: Connections under Admin, the Test button on a saved row, held while dirty.
        expect((await page.request.post(`${API}/users/login`, { data: ADMIN })).status()).toBe(200);
        await page.goto(`/admin/collections/connections/${mockId}`);
        await expect(page.locator('[data-admin-action="test-connection"]')).toBeVisible();
        await page.locator('#field-label').fill('Mock (edited)');
        await expect(page.locator('[data-admin-action-result="disabled"]')).toHaveText(
          /Save, then test/,
        );
        await page.goto('/admin/collections/connections/create');
        await expect(page.locator('[data-admin-action="test-connection"]')).toHaveCount(0);
        await page.goto('/admin/collections/connections');
        await expect(page.locator('.collection-list')).toContainText('OpenAI, e2e (kept)');
      } finally {
        for (const id of ids) await request.delete(`${API}/connections/${id}`, { headers: auth });
      }
    });

    test('the content engine (BRD 10.2, ADR-042): a run with the mock provider publishes a post that meets the rules; editors and outsiders are refused', async ({
      page,
      request,
    }) => {
      // Two runs and two refusals, each picked up by the queue within a minute.
      test.setTimeout(360_000);
      const auth = await login(request, ADMIN);
      const json = { ...auth, 'Content-Type': 'application/json' };
      // A mock connection is only accepted with AI_CONTENT_MOCK=1 (CI and the review server
      // set it). Its rates are set so the runs cost something the monthly limit can refuse.
      const mockId = await mockConnectionId(request, auth);
      expect(
        (
          await request.patch(`${API}/connections/${mockId}`, {
            headers: json,
            data: { enabled: true, inputPerMillionUsd: 10, outputPerMillionUsd: 10 },
          })
        ).status(),
      ).toBe(200);
      const settings = await request.post(`${API}/globals/ai-settings`, {
        headers: auth,
        data: { connection: mockId, enabled: true, reviewFirstRuns: 3, postsPerDay: 5 },
      });
      expect(settings.status()).toBe(200);
      const hubs = (await (
        await request.get(`${API}/categories?limit=1&where[slug][equals]=design`, { headers: auth })
      ).json()) as {
        docs: Array<{ id: number }>;
      };
      const stamp = Date.now();
      const topic = await request.post(`${API}/ai-topics`, {
        headers: auth,
        data: {
          // A title no seed topic shares (the dedupe refuses a 60 % overlap with a published post).
          title: `اختيار خامة التيشيرت المناسبة للطباعة ${stamp}`,
          hub: hubs.docs[0]!.id,
          primaryKeyword: `خامة التيشيرت للطباعة ${stamp}`,
          intent: 'informational',
          priority: 5,
          status: 'backlog',
          source: 'manual',
        },
      });
      expect(topic.status()).toBe(201);
      const topicId = ((await topic.json()) as { doc: { id: number } }).doc.id;
      let postId: number | null = null;
      let englishTopicId: number | null = null;
      let englishPostId: number | null = null;
      try {
        // Editors and outsiders cannot start a run or read the log.
        const editor = await createEditor(request, auth);
        try {
          const editorAuth = await login(request, editor);
          expect(
            (
              await request.post('/api/ai/generate', {
                headers: { ...editorAuth, 'Content-Type': 'application/json' },
                data: { topicId },
              })
            ).status(),
          ).toBe(403);
          expect((await request.get(`${API}/ai-runs`, { headers: editorAuth })).status()).toBe(403);
          expect(
            (await request.get(`${API}/globals/ai-settings`, { headers: editorAuth })).status(),
          ).toBe(403);
        } finally {
          await request.delete(`${API}/users/${editor.id}`, { headers: auth });
        }
        expect(
          (
            await request.post('/api/ai/generate', {
              headers: { 'Content-Type': 'application/json' },
              data: { topicId },
            })
          ).status(),
        ).toBe(403);
        // "Generate now": the run is queued and served by the `ai` queue within a minute.
        const queued = await request.post('/api/ai/generate', { headers: json, data: { topicId } });
        expect(queued.status()).toBe(202);
        const latestRun = async () => {
          const res = await request.get(
            `${API}/ai-runs?sort=-createdAt&limit=1&where[topic][equals]=${topicId}`,
            { headers: auth },
          );
          return ((await res.json()) as { docs: Array<Record<string, unknown>> }).docs[0];
        };
        await expect
          .poll(async () => (await latestRun())?.['status'] ?? 'none', {
            intervals: [2_000, 5_000],
            timeout: 150_000,
          })
          .not.toMatch(/running|none/);
        const engineRun = (await latestRun())!;
        expect(engineRun['status'], JSON.stringify(engineRun['steps'])).toBe('done');
        expect(engineRun['score'] as number).toBeGreaterThanOrEqual(80);
        // The run names its connection and cost it something (ADR-047).
        expect(
          typeof engineRun['connection'] === 'object'
            ? (engineRun['connection'] as { id: number }).id
            : engineRun['connection'],
        ).toBe(mockId);
        expect(engineRun['costUsd'] as number).toBeGreaterThan(0);
        expect(
          (engineRun['steps'] as Array<{ name: string; ok: boolean }>).map((s) => s.name),
        ).toEqual(['pickTopic', 'brief', 'outline', 'draft', 'review', 'seo', 'image', 'publish']);
        // The run keeps the outline a freshness pass rewrites from.
        expect((engineRun['outline'] as { headings: unknown[] }).headings.length).toBeGreaterThan(
          3,
        );
        // The seeded backlog (BRD Appendix E): thirty Arabic and fifteen English topics, the
        // three Level 1 posts linked in each language (ADR-043).
        const seeded = (await (
          await request.get(`${API}/ai-topics?limit=0&where[source][equals]=seed`, {
            headers: auth,
          })
        ).json()) as { totalDocs: number };
        expect(seeded.totalDocs).toBe(45);
        const linked = (await (
          await request.get(
            `${API}/ai-topics?limit=0&where[source][equals]=seed&where[status][equals]=published&where[post][exists]=true`,
            { headers: auth },
          )
        ).json()) as { totalDocs: number };
        expect(linked.totalDocs).toBe(6);
        const englishSeeded = (await (
          await request.get(
            `${API}/ai-topics?limit=0&where[source][equals]=seed&where[language][equals]=en`,
            { headers: auth },
          )
        ).json()) as { totalDocs: number };
        expect(englishSeeded.totalDocs).toBe(15);
        postId =
          typeof engineRun['post'] === 'object' && engineRun['post']
            ? (engineRun['post'] as { id: number }).id
            : (engineRun['post'] as number);
        const post = (await (
          await request.get(`${API}/posts/${postId}?depth=0`, { headers: auth })
        ).json()) as Record<string, unknown>;
        expect(post['_status']).toBe('published');
        expect(post['origin']).toBe('ai');
        expect(post['takeaways']).toHaveLength(3);
        expect(post['warnings'] ?? []).toEqual([]);
        // The facts of the day travel with the post: the freshness job's baseline.
        expect(
          (post['factsBaseline'] as Array<{ unit: string; value: number }>).some(
            (n) => n.unit === 'days',
          ),
        ).toBe(true);
        const slug = post['slug'] as string;
        await expect
          .poll(async () => (await request.get(`/blog/${slug}`)).status(), POLL)
          .toBe(200);
        const html = await (await request.get(`/blog/${slug}`)).text();
        expect(html).not.toMatch(/ذكاء اصطناعي|generated by|\bAI\b/);
        expect(html).toContain('id="section-1"');
        // The topic points at its post; the dashboard card and the health row show the engine.
        const topicDoc = (await (
          await request.get(`${API}/ai-topics/${topicId}?depth=0`, { headers: auth })
        ).json()) as Record<string, unknown>;
        expect(topicDoc['status']).toBe('published');
        expect((await page.request.post(`${API}/users/login`, { data: ADMIN })).status()).toBe(200);
        await page.setViewportSize({ width: 1600, height: 1200 });
        await page.goto('/admin');
        await expect(page.locator('[data-admin-engine]')).toHaveAttribute(
          'data-admin-engine-state',
          'mock',
        );
        await expect(page.locator('[data-health-row="engine"]')).toHaveAttribute(
          'data-tone',
          'warning',
        );
        // The spend table has a row per AI connection: the engine's one is marked, it names the
        // connection, what it has cost this month, and the amber "no monthly limit" badge (ADR-059).
        const connectionRow = page.locator(`[data-admin-connection="${mockId}"]`);
        await expect(connectionRow).toHaveAttribute('data-admin-engine-connection', String(mockId));
        await expect(connectionRow).toContainText(/Mock/);
        await expect(connectionRow).toContainText(/\$\d+\.\d\d/);
        await expect(connectionRow.locator('[data-admin-no-limit]')).toContainText(
          /No monthly limit/,
        );
        await expect(page.locator('[data-admin-engine-cap="posts"]')).toContainText(/\d+ of \d+/);
        // The topic's edit view carries "Generate now"; the post's sidebar carries "Regenerate".
        await page.goto(`/admin/collections/ai-topics/${topicId}`);
        await expect(page.locator('[data-admin-action="generate-now"]')).toBeVisible();
        await page.goto(`/admin/collections/posts/${postId}`);
        await expect(page.locator('[data-admin-action="regenerate"]')).toBeVisible();
        // An English topic (ADR-043): English prompts, facts and rules; the post lands on the
        // English blog only, in the English feed, with no Arabic in its body.
        const englishTopic = await request.post(`${API}/ai-topics`, {
          headers: auth,
          data: {
            title: `Choosing the right T-shirt fabric for printing ${stamp}`,
            language: 'en',
            hub: hubs.docs[0]!.id,
            primaryKeyword: `t-shirt fabric for printing ${stamp}`,
            intent: 'informational',
            priority: 5,
            status: 'backlog',
            source: 'manual',
          },
        });
        expect(englishTopic.status()).toBe(201);
        englishTopicId = ((await englishTopic.json()) as { doc: { id: number } }).doc.id;
        const englishQueued = await request.post('/api/ai/generate', {
          headers: json,
          data: { topicId: englishTopicId },
        });
        expect(englishQueued.status()).toBe(202);
        const latestEnglishRun = async () => {
          const res = await request.get(
            `${API}/ai-runs?sort=-createdAt&limit=1&where[topic][equals]=${englishTopicId}`,
            { headers: auth },
          );
          return ((await res.json()) as { docs: Array<Record<string, unknown>> }).docs[0];
        };
        await expect
          .poll(async () => (await latestEnglishRun())?.['status'] ?? 'none', {
            intervals: [2_000, 5_000],
            timeout: 150_000,
          })
          .not.toMatch(/running|none/);
        const englishRun = (await latestEnglishRun())!;
        expect(englishRun['status'], JSON.stringify(englishRun['steps'])).toBe('done');
        expect(englishRun['label']).toMatch(/^generate \[en\]: /);
        englishPostId =
          typeof englishRun['post'] === 'object' && englishRun['post']
            ? (englishRun['post'] as { id: number }).id
            : (englishRun['post'] as number);
        const englishPost = (await (
          await request.get(`${API}/posts/${englishPostId}?depth=0&locale=en`, { headers: auth })
        ).json()) as Record<string, unknown>;
        expect(englishPost['warnings'] ?? []).toEqual([]);
        expect(englishPost['readingMinutes'] as number).toBeGreaterThanOrEqual(3);
        const englishSlug = englishPost['slug'] as string;
        expect(englishSlug).toMatch(/^[a-z0-9-]+$/);
        await expect
          .poll(async () => (await request.get(`/en/blog/${englishSlug}`)).status(), POLL)
          .toBe(200);
        const englishHtml = await (await request.get(`/en/blog/${englishSlug}`)).text();
        const englishMain = englishHtml
          .slice(englishHtml.indexOf('<main'), englishHtml.indexOf('</main>'))
          .replace(/<script[\s\S]*?<\/script>/g, '');
        expect(englishMain.replace(/العربية|ريال سعودي/g, '')).not.toMatch(/[؀-ۿ]/);
        expect(englishHtml).toContain('href="/en/how-it-works"');
        expect(englishHtml).not.toContain('<link rel="alternate" hrefLang="ar"');
        expect((await request.get(`/blog/${englishSlug}`)).status()).toBe(404);
        await expect
          .poll(async () => (await request.get('/en/feed.xml')).text(), POLL)
          .toContain(`/en/blog/${englishSlug}`);
        expect(await (await request.get('/feed.xml')).text()).not.toContain(englishSlug);
        // With the daily cap back at one, a manual run is refused and says so in a skipped row.
        await request.post(`${API}/globals/ai-settings`, {
          headers: auth,
          data: { postsPerDay: 1 },
        });
        const skippedRun = async (match: RegExp) => {
          const before = (await latestRun())?.['id'];
          const again = await request.post('/api/ai/generate', {
            headers: json,
            data: { topicId },
          });
          expect(again.status()).toBe(202);
          await expect
            .poll(
              async () => {
                const r = await latestRun();
                return r && r['id'] !== before && r['status'] !== 'running' ? r['status'] : 'wait';
              },
              { intervals: [2_000, 5_000], timeout: 150_000 },
            )
            .not.toBe('wait');
          const row = (await latestRun())!;
          expect(row['status']).toBe('skipped');
          expect(row['error']).toMatch(match);
        };
        await skippedRun(/today/);
        // The connection's monthly limit (ADR-047): below what the runs cost, a run is refused
        // with the reason; the card and the health row say so. The connection's own numbers
        // come from the runs log.
        const spent = (await (
          await request.get(`${API}/connections/${mockId}?depth=0`, { headers: auth })
        ).json()) as { spentThisMonthUsd: number; callsThisMonth: number };
        expect(spent.spentThisMonthUsd).toBeGreaterThan(0);
        expect(spent.callsThisMonth).toBeGreaterThanOrEqual(2);
        await request.post(`${API}/globals/ai-settings`, {
          headers: auth,
          data: { postsPerDay: 5 },
        });
        await request.patch(`${API}/connections/${mockId}`, {
          headers: json,
          data: { monthlyLimitUsd: 0.01 },
        });
        await skippedRun(/reached its limit 0.01 USD/);
        await request.patch(`${API}/connections/${mockId}`, {
          headers: json,
          data: { monthlyLimitUsd: null },
        });
        // An off connection refuses every run (the rule is unit-tested; the queue picks a job
        // up once a minute, so the e2e reads the dashboard) and says so in amber.
        await request.patch(`${API}/connections/${mockId}`, {
          headers: json,
          data: { enabled: false },
        });
        await page.goto('/admin');
        await expect(page.locator('[data-admin-engine]')).toHaveAttribute(
          'data-admin-engine-state',
          'connectionOff',
        );
        await expect(page.locator('[data-health-row="engine"]')).toHaveAttribute(
          'data-tone',
          'warning',
        );
        await request.patch(`${API}/connections/${mockId}`, {
          headers: json,
          data: { enabled: true },
        });
        // The engine's connection cannot be deleted from under it.
        const guarded = await request.delete(`${API}/connections/${mockId}`, { headers: auth });
        expect(guarded.status()).toBe(400);
        expect(await guarded.text()).toMatch(/pick another/);
        // No connection: the engine refuses in red.
        await request.post(`${API}/globals/ai-settings`, {
          headers: auth,
          data: { connection: null },
        });
        await page.goto('/admin');
        await expect(page.locator('[data-admin-engine]')).toHaveAttribute(
          'data-admin-engine-state',
          'noConnection',
        );
        await expect(page.locator('[data-health-row="engine"]')).toHaveAttribute(
          'data-tone',
          'error',
        );
        await request.post(`${API}/globals/ai-settings`, {
          headers: auth,
          data: { connection: mockId },
        });
      } finally {
        await request.post(`${API}/globals/ai-settings`, {
          headers: auth,
          data: { enabled: false, postsPerDay: 1 },
        });
        await request.patch(`${API}/connections/${mockId}`, {
          headers: json,
          data: {
            enabled: true,
            monthlyLimitUsd: null,
            inputPerMillionUsd: 0,
            outputPerMillionUsd: 0,
          },
        });
        if (postId) await request.delete(`${API}/posts/${postId}`, { headers: auth });
        if (englishPostId) await request.delete(`${API}/posts/${englishPostId}`, { headers: auth });
        for (const id of [topicId, englishTopicId]) {
          if (id === null) continue;
          const runs = (await (
            await request.get(`${API}/ai-runs?limit=50&where[topic][equals]=${id}`, {
              headers: auth,
            })
          ).json()) as { docs: Array<{ id: number }> };
          for (const r of runs.docs)
            await request.delete(`${API}/ai-runs/${r.id}`, { headers: auth });
          await request.delete(`${API}/ai-topics/${id}`, { headers: auth });
        }
      }
      await expect
        .poll(
          async () =>
            (await request.get(`${API}/ai-topics/${topicId}`, { headers: auth })).status(),
          POLL,
        )
        .toBe(404);
    });

    test('the jobs run endpoint answers nobody; health reports the cron', async ({ request }) => {
      const adminAuth = await login(request, ADMIN);
      for (const headers of [undefined, adminAuth]) {
        const res = await request.get(`${API}/payload-jobs/run`, headers ? { headers } : {});
        expect(res.status(), headers ? 'admin' : 'outsider').toBeGreaterThanOrEqual(401);
      }
      const health = (await (await request.get('/api/health')).json()) as { jobs: string };
      expect(['on', 'off']).toContain(health.jobs);
    });

    test('a log row reads its JSON (audit 2026-09-18, 2.1): a run and a citation open without a page error and show the JsonView block', async ({
      page,
      request,
    }) => {
      const auth = await login(request, ADMIN);
      expect((await page.request.post(`${API}/users/login`, { data: ADMIN })).status()).toBe(200);
      await page.setViewportSize({ width: 1440, height: 1000 });
      // Payload's own JSON field loaded Monaco from a CDN the admin CSP refuses: two page
      // errors on every run, snapshot and citation page, and an empty field. Ours is a <pre>.
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      const rows: Array<{ slug: string; field: string; query: string }> = [
        // A finished post run carries its steps; a citation-ledger run carries none.
        {
          slug: 'ai-runs',
          field: 'steps',
          query: 'where[kind][not_equals]=citation&where[status][in]=done,failed',
        },
        { slug: 'citations', field: 'urls', query: '' },
        { slug: 'metrics', field: 'data', query: '' },
      ];
      let opened = 0;
      for (const { slug, field, query } of rows) {
        const list = (await (
          await request.get(`${API}/${slug}?limit=1&sort=-createdAt&depth=0&${query}`, {
            headers: auth,
          })
        ).json()) as { docs: Array<{ id: number }> };
        const id = list.docs[0]?.id;
        if (id === undefined) {
          // The engine and ledger tests delete their rows; a fresh database has none.
          test.info().annotations.push({
            type: 'skipped part',
            description: `no ${slug} row on the database`,
          });
          continue;
        }
        await page.goto(`/admin/collections/${slug}/${id}`);
        const jsonView = page.locator(`[data-admin-json-view="${field}"]`);
        await expect(jsonView, `${slug}.${field}`).toBeVisible();
        expect(
          (await jsonView.textContent())?.trim().length ?? 0,
          `${slug}.${field}`,
        ).toBeGreaterThan(0);
        await expect(page.locator('.monaco-editor'), `${slug}: no Monaco`).toHaveCount(0);
        opened += 1;
      }
      expect(errors, 'page errors').toEqual([]);
      test.info().annotations.push({ type: 'opened', description: `${opened} of ${rows.length}` });
    });

    test('an outsider reads the FAQ and published testimonials, never the home drafts', async ({
      request,
    }) => {
      const home = await request.get(`${API}/globals/home`);
      expect(home.status(), 'home global carries drafts: staff only').toBe(403);
      const faqs = await request.get(`${API}/faqs?limit=100`);
      expect(((await faqs.json()) as { totalDocs: number }).totalDocs).toBeGreaterThanOrEqual(16);
      const drafts = await request.get(`${API}/testimonials?draft=true&limit=100`);
      const docs = ((await drafts.json()) as { docs: Array<{ _status?: string }> }).docs;
      expect(docs.length).toBeGreaterThan(0);
      expect(docs.every((d) => d._status === 'published')).toBe(true);
      expect(
        (await request.post(`${API}/faqs`, { data: { question: 'x' } })).status(),
      ).toBeGreaterThanOrEqual(401);
    });
  });
});
