import { AxeBuilder } from '@axe-core/playwright';
import {
  expect,
  request as playwrightRequest,
  test,
  type APIRequestContext,
  type Page,
} from '@playwright/test';
import { ADMIN, API, hasAdmin, login } from './helpers/cms';

/**
 * Bookings of our own (ADR-062) from the merchant's seat: `/book` in both languages books a
 * slot, the confirmation, the manage page's move and cancel, an off-grid start refused, the
 * contact card's inline picker, the `/contact` JS budget with the island out of the first
 * paint, axe at 1440 and 390 in both languages. Runs in the `cms-bookings` project (serial,
 * after the admin suite, never beside it: the one admin account's parallel logins race on
 * its sessions list): it switches the booking global on and restores it, and removes the
 * rows it made. The calendar is the mock connection where the kind exists (PR 4b phase 2), else
 * off: the booking then stands without a Meet link and says the link follows.
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

/** The free starts of the first open day within a week from today (Riyadh), from the API. */
async function firstFreeSlots(
  request: APIRequestContext,
): Promise<{ day: string; slots: string[] }> {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Riyadh' }).format(new Date());
  for (let offset = 1; offset <= 8; offset++) {
    const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Riyadh' }).format(
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

async function axeClean(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
    .analyze();
  const serious = results.violations.filter(
    (v) => v.impact === 'serious' || v.impact === 'critical',
  );
  expect(
    serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`),
  ).toEqual([]);
}

test.describe('bookings of our own (ADR-062)', () => {
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
    for (const id of made) {
      await admin.delete(`${API}/bookings/${id}`, { headers: auth });
    }
    if (calendarId !== null) {
      await admin.patch(`${API}/connections/${calendarId}`, {
        headers: { ...auth, ...json },
        data: { enabled: false, model: 'ok' },
      });
    }
    await writeGlobal(admin, auth, {
      enabled: before.enabled === true,
      noticeHours: before['noticeHours'] ?? 24,
    });
    await admin.dispose();
  });

  test('the contact card holds the picker inline while the switch is on; /book and /contact are in the sitemap', async ({
    request,
  }) => {
    await expect
      .poll(
        async () =>
          (await (await request.get('/contact')).text()).includes('data-booking-mode="inline"'),
        {
          timeout: 15_000,
        },
      )
      .toBe(true);
    const contact = await (await request.get('/contact')).text();
    expect(contact).toContain('data-booking-picker="fallback"');
    const sitemap = await (await request.get('/sitemap.xml')).text();
    expect(sitemap).toContain('/book</loc>');
    expect(sitemap).toContain('/en/book</loc>');
    expect(sitemap).not.toContain('/book/manage');
    const book = await (await request.get('/book')).text();
    expect(book).toContain(
      '<h1 id="book-title" class="text-h1 text-text">احجز استشارة مجانية</h1>',
    );
    expect(book).toContain('"@type":"WebPage"');
    expect(book).toContain('data-booking-picker="fallback"');
  });

  test('refuses an off-grid start with 400, a bad body with 400, and a foreign origin with 403', async ({
    request,
  }) => {
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
    // The slots route refuses a day beyond the horizon and a malformed one.
    expect(
      (await request.get('/api/bookings/slots?date=2099-01-01', { headers: ip(91) })).status(),
    ).toBe(400);
    expect((await request.get('/api/bookings/slots?date=nope', { headers: ip(91) })).status()).toBe(
      400,
    );
  });

  test('books a slot on /book in Arabic: the confirmation with the calendar file and the manage link', async ({
    page,
    request,
  }) => {
    await stubTurnstile(page);
    await page.setExtraHTTPHeaders(ip(92));
    const { day, slots } = await firstFreeSlots(request);
    await page.goto('/book');
    const island = page.locator('[data-booking-island]');
    await page.locator('[data-booking-strip]').scrollIntoViewIfNeeded();
    await expect(island).toBeVisible({ timeout: 15_000 });
    await island.locator(`[data-booking-day="${day}"]`).click();
    const slot = island.locator(`[data-booking-slot="${slots[0]}"]`);
    await expect(slot).toBeVisible({ timeout: 15_000 });
    await slot.click();
    await expect(island.locator('[data-booking-chosen]')).toBeVisible();
    const form = page.getByTestId('booking-form');
    await form.locator('input[name="name"]').fill(MERCHANT.name);
    await form.locator('input[name="phone"]').fill(MERCHANT.phone);
    await form.locator('input[name="email"]').fill(MERCHANT.email);
    await form.locator('textarea[name="note"]').fill('أرغب بربط متجري في سلة.');
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
    const manage = success.locator('[data-booking-manage]');
    const href = (await manage.getAttribute('href')) ?? '';
    expect(href).toMatch(/^\/book\/manage\?token=\d+\.[A-Za-z0-9_-]+$/);
    manageToken = new URL(href, 'http://x').searchParams.get('token') ?? '';
    made.push(Number(manageToken.split('.')[0]));
    // The calendar file downloads by the same token.
    const ics = await request.get(`/api/bookings/ics?token=${encodeURIComponent(manageToken)}`, {
      headers: ip(92),
    });
    expect(ics.status()).toBe(200);
    expect(ics.headers()['content-type']).toContain('text/calendar');
    expect(await ics.text()).toContain('BEGIN:VCALENDAR');
    // With the mock calendar the Meet link is there; without a calendar the link follows.
    if (calendarId !== null) {
      await expect(success.locator('[data-booking-meet]')).toHaveAttribute(
        'href',
        /meet\.google\.com/,
      );
    } else {
      await expect(success.locator('[data-booking-link-follows]')).toBeVisible();
    }
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

  test('the manage page: the booking, a move to another slot, then a cancel; the link then refuses', async ({
    page,
    request,
  }) => {
    test.skip(!manageToken, 'no booking was made');
    await page.setExtraHTTPHeaders(ip(94));
    const { day, slots } = await firstFreeSlots(request);
    await page.goto(`/book/manage?token=${encodeURIComponent(manageToken)}`);
    const card = page.locator('[data-manage-card]');
    await expect(card.locator('[data-booking-manage-state="active"]')).toBeVisible({
      timeout: 15_000,
    });
    await card.locator('[data-booking-reschedule]').click();
    await card.locator(`[data-booking-day="${day}"]`).click();
    const target = slots[0]!;
    const slot = card.locator(`[data-booking-slot="${target}"]`);
    await expect(slot).toBeVisible({ timeout: 15_000 });
    await slot.click();
    await card.locator('[data-booking-confirm-reschedule]').click();
    await expect(page.getByTestId('manage-message')).toHaveText(
      'تغيّر موعدك. أرسلنا التفاصيل الجديدة إلى بريدك.',
      { timeout: 15_000 },
    );
    await expect(card.locator('[data-booking-manage-status="rescheduled"]')).toBeVisible();
    await expect(card.locator('[data-booking-when]')).toHaveAttribute('data-booking-when', target);
    // Cancel, after the confirmation step.
    await card.locator('[data-booking-cancel]').click();
    await card.locator('[data-booking-confirm-cancel]').click();
    await expect(page.getByTestId('manage-message')).toContainText('أُلغي حجزك', {
      timeout: 15_000,
    });
    await expect(card.locator('[data-booking-manage-state="cancelled"]')).toBeVisible();
    await expect(card.locator('[data-booking-reschedule]')).toHaveCount(0);
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

  test('books a slot on /en/book in English, and the row reads its language', async ({
    page,
    request,
  }) => {
    await stubTurnstile(page);
    await page.setExtraHTTPHeaders(ip(95));
    const { day, slots } = await firstFreeSlots(request);
    await page.goto('/en/book');
    await expect(page.locator('h1')).toHaveText('Book a free consultation');
    const island = page.locator('[data-booking-island]');
    await page.locator('[data-booking-strip]').scrollIntoViewIfNeeded();
    await expect(island).toBeVisible({ timeout: 15_000 });
    await island.locator(`[data-booking-day="${day}"]`).click();
    const slot = island.locator(`[data-booking-slot="${slots[1]}"]`);
    await expect(slot).toBeVisible({ timeout: 15_000 });
    await slot.click();
    const form = page.getByTestId('booking-form');
    await form.locator('input[name="name"]').fill('Test Merchant');
    await form.locator('input[name="phone"]').fill('+971 50 123 4567');
    await form.locator('input[name="email"]').fill(`e2e-booking-en-${RUN}@example.com`);
    await page.getByRole('button', { name: 'Confirm the booking' }).click();
    const success = page.getByTestId('booking-success');
    await expect(success).toBeVisible({ timeout: 20_000 });
    await expect(success).toContainText('Your consultation is booked');
    const href = (await success.locator('[data-booking-manage]').getAttribute('href')) ?? '';
    expect(href).toMatch(/^\/en\/book\/manage\?token=/);
    const id = Number(new URL(href, 'http://x').searchParams.get('token')?.split('.')[0]);
    made.push(id);
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

  for (const width of [1440, 390]) {
    for (const [locale, path] of [
      ['ar', '/book'],
      ['en', '/en/book'],
    ] as const) {
      test(`axe on ${path} at ${width} with the picker mounted`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(path);
        await page.locator('[data-booking-strip]').scrollIntoViewIfNeeded();
        await expect(page.locator('[data-booking-island]')).toBeVisible({ timeout: 15_000 });
        await expect(
          page.locator('[data-booking-slots="ready"], [data-booking-slots="error"]').first(),
        ).toBeVisible({ timeout: 15_000 });
        expect(await page.locator('html').getAttribute('lang')).toBe(locale);
        await axeClean(page);
      });
    }
    test(`axe on /book/manage at ${width} with an invalid link`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/book/manage?token=1.nope');
      await expect(page.locator('[data-booking-manage-state="invalid"]')).toBeVisible({
        timeout: 15_000,
      });
      await axeClean(page);
    });
  }
});
