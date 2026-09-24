import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { AxeBuilder } from '@axe-core/playwright';
import {
  expect,
  request as playwrightRequest,
  test,
  type APIRequestContext,
  type Locator,
  type Page,
} from '@playwright/test';
import { ADMIN, API, createEditor, hasAdmin, login } from './helpers/cms';

/**
 * The booker (ADR-063) from the merchant's seat: `/book` in both languages with the month
 * navigation, a day with slots, the split confirm, the form, the success rows and the
 * add-to-calendar menu; the manage page's inline reschedule and the cancel dialog; the
 * contact card's inline mode; the slot-taken refusal returning to the times; a booking made
 * with the keyboard alone in both languages; the budgets of `/book` and `/contact` with the
 * island's own chunks measured; axe at 390, 768, 1024 and 1440 in both languages; then the
 * panel's side (ADR-062 phase 2): the row in the inbox section with its pill, the dashboard
 * card and the badge, the WhatsApp reminder, the editor's limits. Runs in the `cms-bookings`
 * project (serial, after the admin suite, never beside it: the one admin account's parallel
 * logins race on its sessions list): it switches the booking global on and restores it, and
 * removes the rows it made. The calendar is the mock connection (its fail flag drives the
 * failed path), else off: the booking then stands without a Meet link and says the link
 * follows. With `BOOKER_SHOTS=<folder>` the steps are screenshotted at 1440 and 390 in both
 * languages into that folder (outside the repository; never committed).
 */
declare global {
  interface Window {
    __umamiEvents?: Array<{ name: string; data: Record<string, unknown> }>;
  }
}

const json = { 'Content-Type': 'application/json' };
const RUN = Date.now() % 65_536;
const ip = (n: number) => ({ 'x-forwarded-for': `10.${RUN >> 8}.${RUN & 255}.${n}` });

const MERCHANT = {
  name: 'ضياء الاختبار',
  phone: '0501699572',
  email: `e2e-booking-${RUN}@example.com`,
};

const SHOTS = process.env['BOOKER_SHOTS'];
if (SHOTS) mkdirSync(SHOTS, { recursive: true });

/** A screenshot of the card at the current viewport, when a folder is named. */
async function shot(target: Locator | Page, name: string) {
  if (!SHOTS) return;
  await target.screenshot({ path: join(SHOTS, `${name}.png`) });
}

/** Serves a stand-in for Cloudflare's widget script: the same API surface, no network. */
async function stubTurnstile(page: Page) {
  await page.route('https://challenges.cloudflare.com/turnstile/v0/api.js*', (route) =>
    route.fulfill({
      contentType: 'application/javascript',
      body: `
        (function(){
          var widgets = {};
          window.turnstile = {
            render: function(el, opts){ var id = 'w' + Object.keys(widgets).length; widgets[id] = opts; el.setAttribute('data-stub-widget', id); return id; },
            execute: function(id){ setTimeout(function(){ widgets[id].callback('stub-token-' + id); }, 0); },
            reset: function(){},
            remove: function(id){ delete widgets[id]; }
          };
          var onload = new URL(document.currentScript.src).searchParams.get('onload');
          if (onload && window[onload]) window[onload]();
        })();`,
    }),
  );
}

type Global = Record<string, unknown> & { enabled?: boolean; hours?: unknown[] };

/** The booking global as it was, so the suite can put it back. */
async function readGlobal(request: APIRequestContext, auth: Record<string, string>) {
  const res = await request.get(`${API}/globals/booking?depth=0`, { headers: auth });
  expect(res.status()).toBe(200);
  return (await res.json()) as Global;
}

async function writeGlobal(
  request: APIRequestContext,
  auth: Record<string, string>,
  data: Record<string, unknown>,
) {
  const res = await request.post(`${API}/globals/booking?depth=0`, {
    headers: { ...auth, ...json },
    data,
  });
  expect(res.status(), 'booking global write').toBe(200);
}

const riyadhDay = (date: Date) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Riyadh' }).format(date);

/** The free starts of the first open day with four of them within eight days from today (Riyadh). */
async function firstFreeSlots(
  request: APIRequestContext,
): Promise<{ day: string; slots: string[] }> {
  const today = riyadhDay(new Date());
  for (let offset = 1; offset <= 8; offset++) {
    const day = riyadhDay(
      new Date(new Date(`${today}T12:00:00+03:00`).getTime() + offset * 86_400_000),
    );
    const res = await request.get(`/api/bookings/slots?date=${day}`, { headers: ip(90) });
    expect(res.status(), `slots for ${day}`).toBe(200);
    const body = (await res.json()) as { slots: string[] };
    if (body.slots.length >= 4) return { day, slots: body.slots };
  }
  throw new Error('no open day with four free slots in the coming week');
}

/** The mock calendar connection where the kind exists (phase 2), else null. */
async function mockCalendar(
  request: APIRequestContext,
  auth: Record<string, string>,
  fail: boolean,
): Promise<number | null> {
  const found = (await (
    await request.get(`${API}/connections?where[kind][equals]=mock-calendar&limit=1&depth=0`, {
      headers: auth,
    })
  ).json()) as { docs?: Array<{ id: number }>; errors?: unknown };
  if (found.errors) return null;
  const model = fail ? 'fail' : 'ok';
  if (found.docs?.[0]) {
    await request.patch(`${API}/connections/${found.docs[0].id}`, {
      headers: { ...auth, ...json },
      data: { model, enabled: true },
    });
    return found.docs[0].id;
  }
  const made = await request.post(`${API}/connections`, {
    headers: { ...auth, ...json },
    data: { label: 'Mock calendar', kind: 'mock-calendar', model, enabled: true },
  });
  if (made.status() !== 201) return null;
  return ((await made.json()) as { doc: { id: number } }).doc.id;
}

async function axeClean(page: Page, label: string) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
    .analyze();
  const serious = results.violations.filter(
    (v) => v.impact === 'serious' || v.impact === 'critical',
  );
  expect(
    serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`),
    label,
  ).toEqual([]);
}

/** Opens `/book` (or its English twin), waits for the island and a day's times. */
async function openBooker(page: Page, path: string) {
  await page.goto(path);
  const island = page.locator('[data-booking-island]');
  await expect(island).toBeVisible({ timeout: 15_000 });
  await expect(island.locator('[data-booking-days="ready"]')).toBeVisible({ timeout: 15_000 });
  await expect(island.locator('[data-booking-slots="ready"]')).toBeVisible({ timeout: 15_000 });
  return island;
}

/** The three entries of the add-to-calendar menu: opens it, reads the hrefs, closes it with Escape. */
async function calendarMenu(page: Page, scope: Locator, token: string) {
  const trigger = scope.locator('[data-booking-add-to-calendar]');
  await trigger.click();
  const menu = page.locator('[data-booking-calendar-menu]');
  await expect(menu).toBeVisible();
  const links = menu.locator('[data-booking-calendar-link]');
  await expect(links).toHaveCount(3);
  const google = (await links.nth(0).getAttribute('href')) ?? '';
  const outlook = (await links.nth(1).getAttribute('href')) ?? '';
  const apple = (await links.nth(2).getAttribute('href')) ?? '';
  expect(google).toMatch(/^https:\/\/calendar\.google\.com\/calendar\/r\/eventedit\?/);
  expect(google).toContain('dates=');
  expect(google).toContain('ctz=Asia%2FRiyadh');
  expect(outlook).toMatch(/^https:\/\/outlook\.live\.com\/calendar\/0\/deeplink\/compose\?/);
  expect(outlook).toContain('startdt=');
  expect(apple).toBe(`/api/bookings/ics?token=${encodeURIComponent(token)}`);
  await expect(links.nth(0)).toHaveAttribute('target', '_blank');
  await expect(links.nth(2)).not.toHaveAttribute('target', '_blank');
  // The keyboard: the arrows walk the entries, Escape closes and the focus returns.
  await page.keyboard.press('ArrowDown');
  await expect(links.nth(0)).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(links.nth(1)).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(menu).toHaveCount(0);
  await expect(trigger).toBeFocused();
}

type Script = { url: string; bytes: number };
const sumOf = (rows: Script[]) => rows.reduce((n, r) => n + r.bytes, 0);
const listOf = (rows: Script[]) => rows.map((r) => `${r.bytes}\t${r.url}`).join('\n');

/** The scripts a route loads: what the server HTML references (the first paint) and the rest. */
async function scriptsOf(page: Page, baseURL: string, path: string) {
  const js: Script[] = [];
  await page.route('**/*', (route) => {
    const headers = route.request().headers();
    if (headers['next-router-prefetch'] || headers['rsc']) return route.abort();
    return route.continue();
  });
  page.on('response', async (r) => {
    if (r.request().resourceType() !== 'script' || !r.url().includes('/_next/static/')) return;
    try {
      js.push({ url: r.url(), bytes: (await r.request().sizes()).responseBodySize });
    } catch {
      // Cached or aborted responses have no sizes; ignore.
    }
  });
  await page.goto(path);
  await page.waitForLoadState('load');
  const html = await (await page.request.get(`${baseURL}${path}`)).text();
  const referenced = new Set(
    [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((m) => new URL(m[1]!, baseURL).href),
  );
  expect(referenced.size).toBeGreaterThan(0);
  return {
    js,
    referenced,
    firstPaint: () => sumOf(js.filter((r) => referenced.has(r.url))),
    later: () => js.filter((r) => !referenced.has(r.url)),
    sum: sumOf,
    list: listOf,
  };
}

/** Tabs until the focus lands on an element matching `selector`, at most `max` times. */
async function tabTo(page: Page, selector: string, max = 60) {
  for (let i = 0; i < max; i++) {
    await page.keyboard.press('Tab');
    const matched = await page.evaluate(
      (sel) => document.activeElement?.matches(sel) ?? false,
      selector,
    );
    if (matched) return;
  }
  throw new Error(`Tab never reached ${selector}`);
}

test.describe('the booker (ADR-063)', () => {
  test.describe.configure({ mode: 'serial' });
  test.skip(!hasAdmin, 'ADMIN_EMAIL / ADMIN_PASSWORD unset');

  let auth: Record<string, string>;
  let before: Global;
  let calendarId: number | null = null;
  const made: number[] = [];
  let manageToken = '';
  /**
   * The admin's own request context: the worker's shared one may hold the cookie of a
   * session another spec signed in with (the admin suite's editor), and a cookie beside
   * the JWT header made the global's write a 403.
   */
  let admin: APIRequestContext;

  test.beforeAll(async ({ baseURL }) => {
    admin = await playwrightRequest.newContext({ baseURL: baseURL! });
    auth = await login(admin, ADMIN);
    before = await readGlobal(admin, auth);
    calendarId = await mockCalendar(admin, auth, false);
    await writeGlobal(admin, auth, { enabled: true, noticeHours: 0 });
  });

  test.afterAll(async () => {
    // The switch goes back whatever the rows' clean-up did: the review database is shared.
    try {
      for (const id of made) {
        await admin.delete(`${API}/bookings/${id}`, { headers: auth });
      }
      if (calendarId !== null) {
        await admin.patch(`${API}/connections/${calendarId}`, {
          headers: { ...auth, ...json },
          data: { enabled: false, model: 'ok' },
        });
      }
    } finally {
      await writeGlobal(admin, auth, {
        enabled: before.enabled === true,
        noticeHours: before['noticeHours'] ?? 24,
      });
      await admin.dispose();
    }
  });

  test('the server renders the event pane as the stand-in on /book and inline in the contact card; the pages are in the sitemap', async ({
    request,
  }) => {
    await expect
      .poll(
        async () =>
          (await (await request.get('/contact')).text()).includes('data-booking-mode="inline"'),
        { timeout: 15_000 },
      )
      .toBe(true);
    const contact = await (await request.get('/contact')).text();
    expect(contact).toContain('data-booking-stand-in=""');
    expect(contact).toContain('data-booking-mode="inline"');
    const sitemap = await (await request.get('/sitemap.xml')).text();
    expect(sitemap).toContain('/book</loc>');
    expect(sitemap).toContain('/en/book</loc>');
    expect(sitemap).not.toContain('/book/manage');
    const book = await (await request.get('/book')).text();
    expect(book).toContain(
      '<h1 id="book-title" class="text-h1 text-text">احجز استشارة مجانية</h1>',
    );
    expect(book).toContain('"@type":"WebPage"');
    // The stand-in is the real event pane: the host, the title, the blurb, the meta rows.
    expect(book).toContain('data-booking-stand-in=""');
    expect(book).toContain('data-booking-host=""');
    expect(book).toContain('توقيت الرياض (GMT+3)');
    expect(book).toContain('data-booking-days="loading"');
    const en = await (await request.get('/en/book')).text();
    expect(en).toContain('Riyadh time (GMT+3)');
    expect(en).toContain('data-booking-stand-in=""');
  });

  test('the days route answers the month with its counts and refuses a month outside today..the horizon; the slots and booking routes refuse as before', async ({
    request,
  }) => {
    const month = riyadhDay(new Date()).slice(0, 7);
    const days = await request.get(`/api/bookings/days?month=${month}`, { headers: ip(89) });
    expect(days.status()).toBe(200);
    expect(days.headers()['cache-control']).toContain('max-age=60');
    const body = (await days.json()) as {
      ok: boolean;
      month: string;
      days: Record<string, number>;
    };
    expect(body.ok).toBe(true);
    expect(body.month).toBe(month);
    expect(Object.values(body.days).some((n) => n > 0)).toBe(true);
    for (const bad of ['2020-01', '2099-12', 'nope', '']) {
      expect(
        (await request.get(`/api/bookings/days?month=${bad}`, { headers: ip(89) })).status(),
        bad,
      ).toBe(400);
    }
    const { slots } = await firstFreeSlots(request);
    const offGrid = new Date(new Date(slots[0]!).getTime() + 5 * 60_000).toISOString();
    const res = await request.post('/api/bookings', {
      headers: { ...json, ...ip(91) },
      data: { ...MERCHANT, start: offGrid, locale: 'ar' },
    });
    expect(res.status()).toBe(400);
    expect(await res.json()).toEqual({ ok: false, error: 'off_grid' });
    const bad = await request.post('/api/bookings', {
      headers: { ...json, ...ip(91) },
      data: { ...MERCHANT, start: 'tomorrow' },
    });
    expect(bad.status()).toBe(400);
    const foreign = await request.post('/api/bookings', {
      headers: { ...json, Origin: 'https://evil.example', ...ip(91) },
      data: { ...MERCHANT, start: slots[0], locale: 'ar' },
    });
    expect(foreign.status()).toBe(403);
    expect(
      (await request.get('/api/bookings/slots?date=2099-01-01', { headers: ip(91) })).status(),
    ).toBe(400);
    expect((await request.get('/api/bookings/slots?date=nope', { headers: ip(91) })).status()).toBe(
      400,
    );
  });

  test('books on /book in Arabic: the month navigation, the day, the split confirm, the form, the success rows, the calendar menu and the manage link', async ({
    page,
    request,
  }) => {
    test.setTimeout(120_000);
    await stubTurnstile(page);
    await page.setExtraHTTPHeaders(ip(92));
    await page.setViewportSize({ width: 1440, height: 900 });
    const { day, slots } = await firstFreeSlots(request);
    const island = await openBooker(page, '/book');
    const card = page.locator('[data-book-card]');
    // The event pane: the host, the title, the meta rows.
    await expect(island.locator('[data-booking-host]')).toBeVisible();
    await expect(island.locator('[data-booking-meta]')).toContainText('Google Meet');
    await expect(island.locator('[data-booking-meta]')).toContainText('توقيت الرياض (GMT+3)');
    // The month grid opens on today's month with its first open day selected and the times loaded.
    const grid = island.locator('[role="grid"]');
    const month = island.locator('[data-booking-month]');
    const thisMonth = riyadhDay(new Date()).slice(0, 7);
    await expect(month).toHaveAttribute('data-booking-month', thisMonth);
    await expect(island.locator('[data-booking-day-state="selected"]')).toHaveCount(1);
    await expect(island.locator('[data-booking-month-previous]')).toBeDisabled();
    // The next month opens and the previous returns; the arrows stop at the horizon.
    const next = island.locator('[data-booking-month-next]');
    if (await next.isEnabled()) {
      await next.click();
      await expect(month).not.toHaveAttribute('data-booking-month', thisMonth);
      await expect(island.locator('[data-booking-days="ready"]')).toBeVisible({ timeout: 15_000 });
      await island.locator('[data-booking-month-previous]').click();
      await expect(month).toHaveAttribute('data-booking-month', thisMonth);
    }
    // A closed weekday is muted and not focusable; an open day is a button with its date as the name.
    await expect(grid.locator('[data-booking-day-state="off"]').first()).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    const dayButton = island.locator(`button[data-booking-day="${day}"]`);
    await expect(dayButton).toHaveAttribute('aria-label', /\d{4}/);
    await dayButton.click();
    await expect(dayButton).toHaveAttribute('data-booking-day-state', 'selected');
    await expect(island.locator('[data-booking-times-day]')).toHaveAttribute(
      'data-booking-times-day',
      day,
    );
    const slot = island.locator(`[data-booking-slot="${slots[0]}"]`);
    await expect(slot).toBeVisible({ timeout: 15_000 });
    await shot(card, 'ar-1440-1-calendar');
    // The split: the time is pressed, «أكّد» appears as a real button; a pointer elsewhere collapses it.
    await slot.click();
    await expect(slot).toHaveAttribute('aria-pressed', 'true');
    const confirm = island.locator(`[data-booking-confirm="${slots[0]}"]`);
    await expect(confirm).toBeVisible();
    await expect(confirm).toHaveText('أكّد');
    await shot(card, 'ar-1440-2-split');
    await island.locator('[data-booking-event]').click({ position: { x: 10, y: 10 } });
    await expect(slot).toHaveAttribute('aria-pressed', 'false');
    await expect(confirm).toHaveCount(0);
    await slot.click();
    await island.locator(`[data-booking-confirm="${slots[0]}"]`).click();
    // The form step: the event pane keeps the chosen time and the way back; the name is focused.
    const form = page.getByTestId('booking-form');
    await expect(form).toBeVisible();
    await expect(island.locator('[data-booking-chosen]')).toBeVisible();
    await expect(form.locator('input[name="name"]')).toBeFocused();
    await island.locator('[data-booking-back]').click();
    await expect(island.locator('[data-booking-slots="ready"]')).toBeVisible();
    await expect(page.getByTestId('booking-form')).toHaveCount(0);
    await slot.click();
    await island.locator(`[data-booking-confirm="${slots[0]}"]`).click();
    // The rules under the fields, then the values.
    await page.getByRole('button', { name: 'أكّد الحجز' }).click();
    await expect(form.locator('input[name="name"]')).toHaveAttribute('aria-invalid', 'true');
    await expect(form).toContainText('أدخل اسمك');
    await form.locator('input[name="name"]').fill(MERCHANT.name);
    await form.locator('input[name="phone"]').fill(MERCHANT.phone);
    await form.locator('input[name="email"]').fill(MERCHANT.email);
    await form.locator('textarea[name="note"]').fill('أرغب بربط متجري في سلة.');
    await shot(card, 'ar-1440-3-form');
    let sent: Record<string, unknown> | null = null;
    page.on('request', (r) => {
      if (r.url().endsWith('/api/bookings') && r.method() === 'POST') {
        sent = r.postDataJSON() as Record<string, unknown>;
      }
    });
    await page.getByRole('button', { name: 'أكّد الحجز' }).click();
    const success = page.getByTestId('booking-success');
    await expect(success).toBeVisible({ timeout: 20_000 });
    await expect(success).toContainText('موعدك محجوز');
    expect(sent).toMatchObject({
      start: slots[0],
      locale: 'ar',
      page: '/book',
      turnstileToken: expect.stringMatching(/^stub-token-/),
    });
    // The rows: what, when, who (the host and the merchant as typed), where, the note.
    await expect(success.locator('[data-booking-summary="what"]')).toContainText('استشارة مجانية');
    await expect(success.locator('[data-booking-when]')).toHaveAttribute(
      'data-booking-when',
      slots[0]!,
    );
    await expect(success.locator('[data-booking-summary="when"]')).toContainText('بتوقيت الرياض');
    await expect(success.locator('[data-booking-merchant]')).toHaveText(MERCHANT.name);
    await expect(success.locator('[data-booking-summary="where"]')).toContainText('Google Meet');
    await expect(success.locator('[data-booking-summary="note"]')).toContainText('أرغب بربط متجري');
    if (calendarId !== null) {
      await expect(success.locator('[data-booking-meet]')).toHaveAttribute(
        'href',
        /meet\.google\.com/,
      );
    } else {
      await expect(success.locator('[data-booking-link-follows]')).toBeVisible();
    }
    const manage = success.locator('[data-booking-manage]');
    const href = (await manage.getAttribute('href')) ?? '';
    expect(href).toMatch(/^\/book\/manage\?token=\d+\.[A-Za-z0-9_-]+$/);
    manageToken = new URL(href, 'http://x').searchParams.get('token') ?? '';
    made.push(Number(manageToken.split('.')[0]));
    await shot(card, 'ar-1440-4-success');
    await page.setViewportSize({ width: 390, height: 844 });
    await shot(card, 'ar-390-4-success');
    await page.setViewportSize({ width: 1440, height: 900 });
    await calendarMenu(page, success, manageToken);
    await success.locator('[data-booking-add-to-calendar]').click();
    await expect(page.locator('[data-booking-calendar-menu]')).toBeVisible();
    await page.waitForTimeout(400);
    await shot(page, 'ar-1440-4b-calendar-menu');
    await page.keyboard.press('Escape');
    // The calendar file downloads by the same token.
    const ics = await request.get(`/api/bookings/ics?token=${encodeURIComponent(manageToken)}`, {
      headers: ip(92),
    });
    expect(ics.status()).toBe(200);
    expect(ics.headers()['content-type']).toContain('text/calendar');
    expect(await ics.text()).toContain('BEGIN:VCALENDAR');
    // The slot is gone from the day's free list; the same start answers 409.
    const after = (await (
      await request.get(`/api/bookings/slots?date=${day}`, { headers: ip(92) })
    ).json()) as { slots: string[] };
    expect(after.slots).not.toContain(slots[0]);
    const twice = await request.post('/api/bookings', {
      headers: { ...json, ...ip(93) },
      data: { ...MERCHANT, start: slots[0], locale: 'ar' },
    });
    expect(twice.status()).toBe(409);
    const events = await page.evaluate(() => window.__umamiEvents ?? []);
    expect(events.filter((e) => e.name === 'booking_submit')).toEqual([
      { name: 'booking_submit', data: { page: '/book' } },
    ]);
  });

  test('the manage page: the summary with its pill and the calendar menu, an inline reschedule with the current slot marked, the cancel dialog, then the link refuses', async ({
    page,
    request,
  }) => {
    test.skip(!manageToken, 'no booking was made');
    test.setTimeout(120_000);
    await page.setExtraHTTPHeaders(ip(94));
    await page.setViewportSize({ width: 1440, height: 900 });
    const { day, slots } = await firstFreeSlots(request);
    await page.goto(`/book/manage?token=${encodeURIComponent(manageToken)}`);
    const card = page.locator('[data-manage-card]');
    const island = card.locator('[data-booking-island]');
    await expect(island).toHaveAttribute('data-booking-manage-state', 'active', {
      timeout: 15_000,
    });
    await expect(island.locator('[data-booking-status="booked"]')).toHaveText('محجوز');
    await expect(island.locator('[data-booking-host]')).toBeVisible();
    await shot(card, 'ar-1440-5-manage');
    await page.setViewportSize({ width: 390, height: 844 });
    await shot(card, 'ar-390-5-manage');
    await page.setViewportSize({ width: 1440, height: 900 });
    await calendarMenu(page, island, manageToken);
    // The reschedule opens the calendar and the times inside the card; the current slot is marked.
    await island.locator('[data-booking-reschedule]').click();
    await expect(island).toHaveAttribute('data-booking-step', 'reschedule');
    await expect(island.locator('[data-booking-days="ready"]')).toBeVisible({ timeout: 15_000 });
    await island.locator(`button[data-booking-day="${day}"]`).click();
    await expect(island.locator('[data-booking-slots="ready"]')).toBeVisible({ timeout: 15_000 });
    const target = slots[0]!;
    const slot = island.locator(`[data-booking-slot="${target}"]`);
    await expect(slot).toBeVisible({ timeout: 15_000 });
    await shot(card, 'ar-1440-5b-reschedule');
    await slot.click();
    const confirm = island.locator(`[data-booking-confirm="${target}"]`);
    await expect(confirm).toHaveText('أكّد التغيير');
    await confirm.click();
    await expect(page.getByTestId('manage-message')).toHaveText(
      'تغيّر موعدك. أرسلنا التفاصيل الجديدة إلى بريدك.',
      { timeout: 15_000 },
    );
    await expect(island).toHaveAttribute('data-booking-step', 'view');
    await expect(island.locator('[data-booking-status="rescheduled"]')).toHaveText('مُعاد جدولته');
    await expect(island.locator('[data-booking-when]')).toHaveAttribute(
      'data-booking-when',
      target,
    );
    // Opened again, the current slot is marked and cannot be picked.
    await island.locator('[data-booking-reschedule]').click();
    await island.locator(`button[data-booking-day="${day}"]`).click();
    const current = island.locator(`[data-booking-slot="${target}"]`);
    await expect(current).toHaveAttribute('data-booking-slot-state', 'current', {
      timeout: 15_000,
    });
    await expect(current).toBeDisabled();
    await island.locator('[data-booking-back]').click();
    await expect(island).toHaveAttribute('data-booking-step', 'view');
    // The cancel dialog: the consequence, «أبقِ الموعد» keeps it and returns the focus, then the cancel.
    const cancelButton = island.locator('[data-booking-cancel]');
    await cancelButton.click();
    const dialog = page.locator('[data-booking-cancel-dialog]');
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('إلغاء الحجز؟');
    await expect(dialog).toContainText('يُلغى موعدك');
    await page.waitForTimeout(400);
    await shot(page, 'ar-1440-5c-cancel-dialog');
    await dialog.locator('[data-booking-keep]').click();
    await expect(dialog).toHaveCount(0);
    await expect(cancelButton).toBeFocused();
    await cancelButton.click();
    await page.locator('[data-booking-cancel-dialog] [data-booking-confirm-cancel]').click();
    await expect(island).toHaveAttribute('data-booking-manage-state', 'cancelled', {
      timeout: 15_000,
    });
    await expect(island).toContainText('أُلغي حجزك');
    await expect(island.locator('[data-booking-book-again]')).toHaveAttribute('href', '/book');
    await expect(island.locator('[data-booking-reschedule]')).toHaveCount(0);
    await shot(card, 'ar-1440-5d-cancelled');
    // The API refuses every further action on the cancelled row; a wrong token is a 404.
    const again = await request.post('/api/bookings/manage', {
      headers: { ...json, ...ip(94) },
      data: { action: 'cancel', token: manageToken },
    });
    expect(again.status()).toBe(410);
    expect(await again.json()).toEqual({ ok: false, error: 'cancelled' });
    const forged = await request.get(`/api/bookings/manage?token=${manageToken.slice(0, -3)}abc`, {
      headers: ip(94),
    });
    expect(forged.status()).toBe(404);
    expect(
      (
        await request.get(`/api/bookings/ics?token=${encodeURIComponent(manageToken)}`, {
          headers: ip(94),
        })
      ).status(),
    ).toBe(404);
  });

  test('books on /en/book in English with the same steps, and the row reads its language', async ({
    page,
    request,
  }) => {
    test.setTimeout(120_000);
    await stubTurnstile(page);
    await page.setExtraHTTPHeaders(ip(95));
    await page.setViewportSize({ width: 1440, height: 900 });
    const { day, slots } = await firstFreeSlots(request);
    const island = await openBooker(page, '/en/book');
    const card = page.locator('[data-book-card]');
    await expect(page.locator('h1')).toHaveText('Book a free consultation');
    await expect(island.locator('[data-booking-meta]')).toContainText('Riyadh time (GMT+3)');
    await island.locator(`button[data-booking-day="${day}"]`).click();
    const slot = island.locator(`[data-booking-slot="${slots[1]}"]`);
    await expect(slot).toBeVisible({ timeout: 15_000 });
    await shot(card, 'en-1440-1-calendar');
    await slot.click();
    const confirm = island.locator(`[data-booking-confirm="${slots[1]}"]`);
    await expect(confirm).toHaveText('Confirm');
    await shot(card, 'en-1440-2-split');
    await confirm.click();
    const form = page.getByTestId('booking-form');
    await form.locator('input[name="name"]').fill('Test Merchant');
    await form.locator('input[name="phone"]').fill('+971 50 123 4567');
    await form.locator('input[name="email"]').fill(`e2e-booking-en-${RUN}@example.com`);
    await shot(card, 'en-1440-3-form');
    await page.getByRole('button', { name: 'Confirm the booking' }).click();
    const success = page.getByTestId('booking-success');
    await expect(success).toBeVisible({ timeout: 20_000 });
    await expect(success).toContainText('Your consultation is booked');
    await expect(success.locator('[data-booking-summary="when"]')).toContainText('Riyadh time');
    await expect(success.locator('[data-booking-merchant]')).toHaveText('Test Merchant');
    await expect(success.locator('[data-booking-summary="note"]')).toHaveCount(0);
    const href = (await success.locator('[data-booking-manage]').getAttribute('href')) ?? '';
    expect(href).toMatch(/^\/en\/book\/manage\?token=/);
    const token = new URL(href, 'http://x').searchParams.get('token') ?? '';
    const id = Number(token.split('.')[0]);
    made.push(id);
    await shot(card, 'en-1440-4-success');
    await page.setViewportSize({ width: 390, height: 844 });
    await shot(card, 'en-390-4-success');
    await page.setViewportSize({ width: 1440, height: 900 });
    await calendarMenu(page, success, token);
    const row = (await (
      await admin.get(`${API}/bookings/${id}?depth=0`, { headers: auth })
    ).json()) as {
      locale: string;
      status: string;
      page: string;
      calendar: string;
    };
    expect(row).toMatchObject({ locale: 'en', status: 'booked', page: '/en/book' });
    expect(row.calendar).toBe(calendarId === null ? 'off' : 'synced');
    // The English manage page, for the screenshot.
    await page.goto(`/en/book/manage?token=${encodeURIComponent(token)}`);
    const manageCard = page.locator('[data-manage-card]');
    await expect(manageCard.locator('[data-booking-island]')).toHaveAttribute(
      'data-booking-manage-state',
      'active',
      { timeout: 15_000 },
    );
    await expect(manageCard.locator('[data-booking-status="booked"]')).toHaveText('Booked');
    await shot(manageCard, 'en-1440-5-manage');
    await page.setViewportSize({ width: 390, height: 844 });
    await shot(manageCard, 'en-390-5-manage');
  });

  test('a slot taken meanwhile returns the merchant to the times with the day refreshed and a line saying so', async ({
    page,
    request,
  }) => {
    test.setTimeout(120_000);
    await stubTurnstile(page);
    await page.setExtraHTTPHeaders(ip(96));
    const { day, slots } = await firstFreeSlots(request);
    const island = await openBooker(page, '/book');
    await island.locator(`button[data-booking-day="${day}"]`).click();
    const target = slots[2]!;
    const slot = island.locator(`[data-booking-slot="${target}"]`);
    await expect(slot).toBeVisible({ timeout: 15_000 });
    await slot.click();
    await island.locator(`[data-booking-confirm="${target}"]`).click();
    const form = page.getByTestId('booking-form');
    await form.locator('input[name="name"]').fill(MERCHANT.name);
    await form.locator('input[name="phone"]').fill(MERCHANT.phone);
    await form.locator('input[name="email"]').fill(`e2e-booking-taken-${RUN}@example.com`);
    // Someone else takes the slot while the form is open.
    const other = await request.post('/api/bookings', {
      headers: { ...json, ...ip(97) },
      data: {
        ...MERCHANT,
        email: `e2e-booking-other-${RUN}@example.com`,
        start: target,
        locale: 'ar',
      },
    });
    expect(other.status()).toBe(201);
    made.push(((await other.json()) as { booking: { id: number } }).booking.id);
    await page.getByRole('button', { name: 'أكّد الحجز' }).click();
    // Back to the times: the line, the day read again without the taken slot, nothing armed.
    await expect(page.getByTestId('booking-message')).toHaveText(
      'حُجز هذا الموعد للتو. اختر موعداً آخر.',
      { timeout: 15_000 },
    );
    await expect(island).toHaveAttribute('data-booking-step', 'pick');
    await expect(island.locator('[data-booking-slots="ready"]')).toBeVisible({ timeout: 15_000 });
    // The same day again: the rows stand at once, no stagger (it would read as a blink).
    expect(
      await island.locator('[data-booking-row]').evaluateAll((rows) =>
        rows.every((row) => {
          const style = getComputedStyle(row);
          return style.opacity === '1' && style.animationName === 'none';
        }),
      ),
    ).toBe(true);
    await expect(island.locator(`[data-booking-slot="${target}"]`)).toHaveCount(0);
    await expect(island.locator('[data-booking-confirm]')).toHaveCount(0);
    await expect(page.getByTestId('booking-form')).toHaveCount(0);
  });

  for (const [locale, path, key] of [
    ['ar', '/book', 'ArrowLeft'],
    ['en', '/en/book', 'ArrowRight'],
  ] as const) {
    test(`books with the keyboard alone in ${locale}: Tab to the grid, the arrows by reading direction, Enter, Tab to the confirm, the form, Enter`, async ({
      page,
      request,
    }) => {
      test.setTimeout(120_000);
      await stubTurnstile(page);
      await page.setExtraHTTPHeaders(ip(locale === 'ar' ? 98 : 99));
      const { day, slots } = await firstFreeSlots(request);
      const island = await openBooker(page, path);
      // The selected day (the first open one) is the grid's tab stop.
      await tabTo(page, 'button[data-booking-day][tabindex="0"]');
      const focusedDay = async () =>
        page.evaluate(() => (document.activeElement as HTMLElement).dataset['bookingDay']);
      const from = await focusedDay();
      // The arrow toward the end of the line moves to the next open day (skipping closed ones).
      await page.keyboard.press(key);
      const to = await focusedDay();
      expect(to).not.toBe(from);
      expect(to! > from!).toBe(true);
      // Back, then walk to the target day with the same arrow.
      await page.keyboard.press(key === 'ArrowLeft' ? 'ArrowRight' : 'ArrowLeft');
      expect(await focusedDay()).toBe(from);
      for (let i = 0; i < 40 && (await focusedDay()) !== day; i++) await page.keyboard.press(key);
      expect(await focusedDay()).toBe(day);
      await page.keyboard.press('Enter');
      await expect(island.locator(`button[data-booking-day="${day}"]`)).toHaveAttribute(
        'data-booking-day-state',
        'selected',
      );
      await expect(island.locator('[data-booking-slots="ready"]')).toBeVisible({ timeout: 15_000 });
      // Tab to the target time, Enter arms it, Tab reaches the confirm, Enter opens the form.
      const target = slots[locale === 'ar' ? 0 : 1]!;
      await tabTo(page, `[data-booking-slot="${target}"]`);
      await page.keyboard.press('Enter');
      await expect(island.locator(`[data-booking-slot="${target}"]`)).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      await page.keyboard.press('Tab');
      await expect(island.locator(`[data-booking-confirm="${target}"]`)).toBeFocused();
      await page.keyboard.press('Enter');
      const form = page.getByTestId('booking-form');
      await expect(form.locator('input[name="name"]')).toBeFocused();
      await page.keyboard.type(locale === 'ar' ? 'مستخدم لوحة المفاتيح' : 'Keyboard Merchant');
      await page.keyboard.press('Tab');
      await page.keyboard.type('0501699572');
      await page.keyboard.press('Tab');
      await page.keyboard.type(`e2e-booking-keys-${locale}-${RUN}@example.com`);
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await expect(form.locator('[data-booking-submit]')).toBeFocused();
      await page.keyboard.press('Enter');
      const success = page.getByTestId('booking-success');
      await expect(success).toBeVisible({ timeout: 20_000 });
      const href = (await success.locator('[data-booking-manage]').getAttribute('href')) ?? '';
      made.push(Number(new URL(href, 'http://x').searchParams.get('token')?.split('.')[0]));
      // The menu opens from the keyboard too.
      await tabTo(page, '[data-booking-add-to-calendar]');
      await page.keyboard.press('Enter');
      await expect(page.locator('[data-booking-calendar-menu]')).toBeVisible();
      await page.keyboard.press('Escape');
    });
  }

  test('the contact card holds the booker inline: the header row, the grid, the times unfolding under it on a pick, the form inside the card', async ({
    page,
  }) => {
    await page.setExtraHTTPHeaders(ip(100));
    await page.goto('/contact');
    const card = page.locator('[data-booking-mode="inline"]').first();
    await card.scrollIntoViewIfNeeded();
    const island = card.locator('[data-booking-island]');
    await expect(island).toBeVisible({ timeout: 15_000 });
    await expect(island.locator('[data-booking-event] h2')).toHaveText('احجز استشارة مجانية');
    await expect(island.locator('[data-booking-host]')).toBeVisible();
    await expect(island.locator('[data-booking-days="ready"]')).toBeVisible({ timeout: 15_000 });
    // No day is chosen for the merchant: the times wait for a pick.
    await expect(island.locator('[data-booking-times]')).toHaveCount(0);
    await island.locator('[data-booking-day-state="open"]').first().click();
    await expect(island.locator('[data-booking-times]')).toBeVisible();
    await expect(island.locator('[data-booking-slots="ready"]')).toBeVisible({ timeout: 15_000 });
    await shot(card, 'ar-1440-contact-inline');
    const slot = island.locator('[data-booking-slot]').first();
    await slot.click();
    await island.locator('[data-booking-confirm]').click();
    await expect(island.getByTestId('booking-form')).toBeVisible();
    await expect(island.locator('[data-booking-chosen]')).toBeVisible();
  });

  test('budgets: /book and /contact first paints as today, the island out of both, its own chunks measured', async ({
    page,
    baseURL,
  }) => {
    const book = await scriptsOf(page, baseURL!, '/book');
    await page.waitForTimeout(1500);
    // The first paint is the site's shared bundle and the route: the island is never in it.
    expect(book.firstPaint(), book.list(book.js)).toBeLessThanOrEqual(180 * 1024);
    for (const url of book.referenced) {
      const body = await (await page.request.get(url)).text();
      expect(body, url).not.toContain('data-booking-island');
    }
    await expect(page.locator('[data-booking-island]')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('[data-booking-slots="ready"]')).toBeVisible({ timeout: 15_000 });
    await page.waitForTimeout(1000);
    // The island's own chunks (the grid, the times, the form, the success view, the menu and
    // its positioning): 49,359 B on 2026-09-20, of which 16,764 B are the site's menu
    // primitive and its positioning for the add-to-calendar menu. The line holds a margin.
    const island = book.later();
    expect(island.length).toBeGreaterThan(0);
    expect(book.sum(island), book.list(island)).toBeLessThanOrEqual(52 * 1024);
    const contact = await scriptsOf(await page.context().newPage(), baseURL!, '/contact');
    expect(contact.firstPaint(), contact.list(contact.js)).toBeLessThanOrEqual(180 * 1024);
    for (const url of contact.referenced) {
      const body = await (await page.request.get(url)).text();
      expect(body, url).not.toContain('data-booking-island');
    }
  });

  for (const width of [1440, 390] as const) {
    test(`the steps at ${width} on a phone in both languages, for the eye: the calendar, the split, the form`, async ({
      page,
    }) => {
      test.skip(
        !SHOTS || width !== 390,
        'screenshots only, and the desktop ones come from the flows',
      );
      for (const [locale, path] of [
        ['ar', '/book'],
        ['en', '/en/book'],
      ] as const) {
        await page.setViewportSize({ width, height: 844 });
        await page.setExtraHTTPHeaders(ip(locale === 'ar' ? 101 : 102));
        const island = await openBooker(page, path);
        const card = page.locator('[data-book-card]');
        await shot(card, `${locale}-${width}-1-calendar`);
        const slot = island.locator('[data-booking-slot]').first();
        await slot.scrollIntoViewIfNeeded();
        await slot.click();
        await shot(card, `${locale}-${width}-2-split`);
        await island.locator('[data-booking-confirm]').click();
        await expect(page.getByTestId('booking-form')).toBeVisible();
        await shot(card, `${locale}-${width}-3-form`);
      }
    });
  }

  test('the panel: the row in the inbox section with its pill, the dashboard card and the badge, the WhatsApp reminder, the editor and the cancelled seats, axe in both languages at 1440 and 390', async ({
    page,
    baseURL,
  }) => {
    test.setTimeout(240_000);
    test.skip(made.length < 2, 'no booking was made');
    const id = made[1]!;
    const cancelledId = made[0]!;
    expect((await page.request.post(`${API}/users/login`, { data: ADMIN })).status()).toBe(200);
    const row = (await (
      await admin.get(`${API}/bookings/${id}?depth=0`, { headers: auth })
    ).json()) as { name: string; phone: string; start: string; status: string };
    expect(row.status).toBe('booked');
    const { AxeBuilder: Axe } = await import('@axe-core/playwright');
    const seriousIn = async (...include: string[]) => {
      let builder = new Axe({ page }).withTags(['wcag2a', 'wcag2aa']);
      for (const sel of include) builder = builder.include(sel);
      return (await builder.analyze()).violations
        .filter((v) => ['serious', 'critical'].includes(v.impact ?? ''))
        .map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
    };
    const speak = async (lang: 'ar' | 'en') => {
      await page.context().addCookies([{ name: 'payload-lng', value: lang, url: baseURL! }]);
    };
    const editor = await createEditor(admin, auth);
    try {
      // The dashboard: the card's second line counts today's bookings, the next three list
      // this one when it is among them, and the badge on Bookings reads the second line.
      await speak('en');
      await page.goto('/admin');
      const card = page.locator('[data-admin-dashboard-inbox]');
      await expect(card).toBeVisible();
      const newCount = Number(await card.getAttribute('data-admin-inbox-new'));
      const todayCount = Number(await card.getAttribute('data-admin-inbox-today'));
      const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Riyadh' });
      const starts = new Date(row.start).toLocaleDateString('en-CA', { timeZone: 'Asia/Riyadh' });
      if (starts === today) expect(todayCount).toBeGreaterThanOrEqual(1);
      if (todayCount > 0) {
        await expect(card.locator('[data-admin-figure="today-bookings"]')).toHaveText(
          todayCount === 1 ? '1 booking today' : `${todayCount} bookings today`,
        );
      } else {
        await expect(card.locator('[data-admin-inbox-no-bookings]')).toHaveText(
          'No bookings today',
        );
      }
      const soonest = (await (
        await admin.get(
          `${API}/bookings?where[status][in]=booked,rescheduled&where[end][greater_than]=${encodeURIComponent(new Date().toISOString())}&sort=start&limit=3&depth=0`,
          { headers: auth },
        )
      ).json()) as { docs: Array<{ id: number }> };
      if (soonest.docs.some((d) => d.id === id)) {
        const line = card.locator(`[data-admin-inbox-booking="${id}"]`);
        await expect(line).toBeVisible();
        await expect(line).toContainText(row.name);
        await expect(line.locator('[data-admin-status="booked"]')).toHaveText('Booked');
        await expect(line).toContainText('Riyadh');
      }
      // One badge per entry (ADR-062 amended): the new messages on Messages, today's
      // bookings on Bookings, each the card's own line; zero is no badge.
      for (const [entry, count] of [
        ['messages', newCount],
        ['bookings', todayCount],
      ] as const) {
        const badge = page.locator(`#nav-${entry} [data-admin-badge]`);
        if (count > 0) {
          await expect(badge.locator('[aria-hidden="true"]'), entry).toHaveText(String(count));
          await expect(badge, entry).toHaveAttribute('data-admin-badge', 'error');
        } else {
          await expect(badge, entry).toHaveCount(0);
        }
      }
      // The section: the bookings entry after the messages, inside Site.
      const nav = page.locator('[data-admin-nav]');
      await expect(
        nav.locator('[data-admin-group="Site"] [data-admin-section="inbox"] #nav-bookings'),
      ).toBeVisible();
      const words = {
        en: { booked: 'Booked', cancelled: 'Cancelled', remind: 'Remind on WhatsApp' },
        ar: { booked: 'محجوز', cancelled: 'ملغى', remind: 'ذكّر على WhatsApp' },
      } as const;
      for (const width of [1440, 390] as const) {
        await page.setViewportSize({ width, height: 900 });
        for (const lang of ['en', 'ar'] as const) {
          const at = `at ${width} in ${lang}`;
          await speak(lang);
          // The list: the pills with their words, green and red.
          await page.goto('/admin/collections/bookings');
          await expect(page.locator('html')).toHaveAttribute('lang', lang);
          // The rows by their id (several rows carry the merchant's name in this run).
          const rowOf = (bookingId: number) =>
            page.locator('.collection-list tr', {
              has: page.locator(`a[href$="/collections/bookings/${bookingId}"]`),
            });
          const listRow = rowOf(id);
          await expect(listRow.first()).toBeVisible();
          await expect(listRow.first()).toContainText(row.name);
          await expect(
            listRow.first().locator('td.cell-status [data-admin-status="booked"]'),
          ).toHaveText(words[lang].booked);
          await expect(
            rowOf(cancelledId).first().locator('td.cell-status [data-admin-status="cancelled"]'),
          ).toHaveText(words[lang].cancelled);
          expect(
            await seriousIn('[data-admin-header]', 'td.cell-status'),
            `axe: the list ${at}`,
          ).toEqual([]);
          // The document: the reminder in the merchant's language, whatever the panel's.
          await page.goto(`/admin/collections/bookings/${id}`);
          const actions = page.locator('[data-admin-booking-actions]');
          await expect(actions).toBeVisible();
          const wa = actions.locator('[data-admin-action="remind-whatsapp"]');
          await expect(wa).toHaveText(words[lang].remind);
          await expect(wa).toHaveAttribute('target', '_blank');
          const href = (await wa.getAttribute('href')) ?? '';
          expect(href).toMatch(
            new RegExp(`^https://wa\\.me/${row.phone.replace(/^\\+/, '')}\\?text=`),
          );
          const text = decodeURIComponent(href.split('?text=')[1] ?? '');
          expect(text).toContain(`Hello ${row.name}, this is B7R Print`);
          expect(text).toContain('Riyadh time');
          if (calendarId !== null) expect(text).toMatch(/Meet link: https:\/\/meet\.google\.com\//);
          expect(
            await seriousIn(
              '[data-admin-header]',
              '[data-admin-booking-actions]',
              '.document-fields__main',
            ),
            `axe: the document ${at}`,
          ).toEqual([]);
          if (width === 1440) {
            await page.goto('/admin');
            expect(await seriousIn('[data-admin-dashboard-inbox]'), `axe: the card ${at}`).toEqual(
              [],
            );
          }
        }
      }
      // The cancelled row: no reminder (nothing to remind), and the status stays cancelled.
      await page.goto(`/admin/collections/bookings/${cancelledId}`);
      await expect(page.locator('#field-status')).toBeVisible();
      await expect(page.locator('[data-admin-booking-actions]')).toHaveCount(0);
      const back = await admin.patch(`${API}/bookings/${cancelledId}`, {
        headers: { ...auth, ...json },
        data: { status: 'booked' },
      });
      expect(back.status(), await back.text()).toBe(400);
      // The editor: sees the bookings, changes the status and the notes, never the
      // merchant's name (the field's rule drops it), never deletes, never creates.
      const editorAuth = await login(admin, editor);
      const seen = await admin.get(`${API}/bookings/${id}?depth=0`, { headers: editorAuth });
      expect(seen.status(), 'the editor reads it').toBe(200);
      const worked = await admin.patch(`${API}/bookings/${id}`, {
        headers: { ...editorAuth, ...json },
        data: { status: 'rescheduled', notes: 'اتصلت به', name: 'Somebody Else' },
      });
      expect(worked.status(), await worked.text()).toBe(200);
      const after = (await (
        await admin.get(`${API}/bookings/${id}?depth=0`, { headers: auth })
      ).json()) as { status: string; notes: string; name: string };
      expect(after).toMatchObject({ status: 'rescheduled', notes: 'اتصلت به', name: row.name });
      expect((await admin.delete(`${API}/bookings/${id}`, { headers: editorAuth })).status()).toBe(
        403,
      );
      expect(
        (
          await admin.post(`${API}/bookings`, {
            headers: { ...editorAuth, ...json },
            data: { ...MERCHANT, start: row.start, end: row.start, locale: 'ar' },
          })
        ).status(),
        'nobody creates through the API',
      ).toBe(403);
    } finally {
      await page.setViewportSize({ width: 1280, height: 800 });
      await speak('en');
      await admin.delete(`${API}/users/${editor.id}`, { headers: auth });
    }
  });

  test('the fail flag on the mock calendar: the booking stands as failed and the merchant hears the link follows', async ({
    request,
  }) => {
    test.skip(calendarId === null, 'the mock calendar kind is not in the table yet');
    await mockCalendar(admin, auth, true);
    const { slots } = await firstFreeSlots(request);
    const res = await request.post('/api/bookings', {
      headers: { ...json, ...ip(96) },
      data: { ...MERCHANT, start: slots[2], locale: 'ar' },
    });
    expect(res.status()).toBe(201);
    const { booking } = (await res.json()) as { booking: { id: number; meetLink: string | null } };
    made.push(booking.id);
    expect(booking.meetLink).toBeNull();
    const row = (await (
      await admin.get(`${API}/bookings/${booking.id}?depth=0`, { headers: auth })
    ).json()) as {
      calendar: string;
      calendarAttempts: number;
    };
    expect(row.calendar).toBe('failed');
    expect(row.calendarAttempts).toBe(0);
    await mockCalendar(admin, auth, false);
  });

  test('the outsider reads, lists and creates nothing on the bookings', async ({ baseURL }) => {
    // A context of its own: the worker's may hold a session's cookie from another spec.
    const outsider = await playwrightRequest.newContext({ baseURL: baseURL! });
    try {
      for (const path of [`${API}/bookings`, `${API}/bookings/1`, `${API}/globals/booking`]) {
        expect((await outsider.get(path)).status(), path).toBe(403);
      }
      const create = await outsider.post(`${API}/bookings`, {
        headers: json,
        data: { ...MERCHANT, start: new Date().toISOString(), end: new Date().toISOString() },
      });
      expect(create.status()).toBe(403);
    } finally {
      await outsider.dispose();
    }
  });

  test('switched off, /book is a 404 in both languages and out of the sitemap; the manage page and the contact card stand', async ({
    request,
  }) => {
    await writeGlobal(admin, auth, { enabled: false });
    for (const path of ['/book', '/en/book']) {
      await expect
        .poll(async () => (await request.get(path)).status(), { timeout: 15_000 })
        .toBe(404);
    }
    await expect
      .poll(
        async () => (await (await request.get('/sitemap.xml')).text()).includes('/book</loc>'),
        {
          timeout: 15_000,
        },
      )
      .toBe(false);
    expect((await request.get('/book/manage?token=1.nope')).status()).toBe(200);
    await expect
      .poll(
        async () =>
          (await (await request.get('/contact')).text()).includes('data-booking-mode="whatsapp"'),
        {
          timeout: 15_000,
        },
      )
      .toBe(true);
    expect(await (await request.get('/contact')).text()).not.toContain('data-booking-stand-in');
    await writeGlobal(admin, auth, { enabled: true });
  });

  for (const width of [390, 768, 1024, 1440] as const) {
    for (const [locale, path] of [
      ['ar', '/book'],
      ['en', '/en/book'],
    ] as const) {
      test(`axe on ${path} at ${width} with the booker mounted, a time armed`, async ({
        page,
        baseURL,
      }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.setExtraHTTPHeaders(ip(110 + (width % 100)));
        // The consent bar would lie over the times on a phone; the scan reads the page beneath it.
        await page.context().addCookies([{ name: 'b7r_consent', value: 'denied', url: baseURL! }]);
        const island = await openBooker(page, path);
        expect(await page.locator('html').getAttribute('lang')).toBe(locale);
        // The rows have staggered in by now.
        await page.waitForTimeout(800);
        await axeClean(page, `${path} at ${width}`);
        await island.locator('[data-booking-slot]').first().click();
        await expect(island.locator('[data-booking-confirm]')).toBeVisible();
        await axeClean(page, `${path} at ${width}, armed`);
      });
    }
    if (width === 1440 || width === 390) {
      test(`axe on /book/manage at ${width} with an invalid link`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto('/book/manage?token=1.nope');
        await expect(page.locator('[data-booking-manage-state="invalid"]')).toBeVisible({
          timeout: 15_000,
        });
        await axeClean(page, `/book/manage at ${width}`);
      });
    }
  }
});
