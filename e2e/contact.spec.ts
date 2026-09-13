import { expect, test, type Page } from '@playwright/test';
import { CONTACT_RATE_LIMIT } from '../src/modules/contact/schema';

// One project, serial, one client IP per test: the in-memory limiter (5 per 10 min) must see
// deterministic traffic (the newsletter lesson). The 429 test runs last.
test.describe.configure({ mode: 'serial' });

const json = { 'Content-Type': 'application/json' };
const RUN = Date.now() % 65_536;
const ip = (n: number) => ({ 'x-forwarded-for': `10.${RUN >> 8}.${RUN & 255}.${n}` });

const VALID = {
  name: 'ضياء',
  phone: '0501699572',
  email: 'merchant@example.com',
  inquiry: 'تاجر',
  message: 'أرغب بربط متجري.',
};

/**
 * Serves a stand-in for Cloudflare's widget script: the same API surface, no network.
 * `execute` resolves the callback with a fake token on the next tick.
 */
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

test.describe('contact API (BRD 6.9)', () => {
  test.skip(({ browserName, isMobile }) => browserName !== 'chromium' || isMobile, 'one project');

  test('health reports the mock contact transport and Turnstile off', async ({ request }) => {
    const body = (await (await request.get('/api/health')).json()) as {
      contact: string;
      turnstile: string;
    };
    expect(body.contact).toBe('mock');
    expect(body.turnstile).toBe('off');
  });

  test('accepts a valid message', async ({ request }) => {
    const res = await request.post('/api/contact', {
      headers: { ...json, ...ip(20) },
      data: VALID,
    });
    expect(res.status()).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  test('rejects invalid fields with a generic 400', async ({ request }) => {
    const res = await request.post('/api/contact', {
      headers: { ...json, ...ip(21) },
      data: { ...VALID, phone: '12345', inquiry: 'غير موجود' },
    });
    expect(res.status()).toBe(400);
    expect(await res.json()).toEqual({ ok: false, error: 'invalid' });
  });

  test('honeypot answers 200 without sending', async ({ request }) => {
    const res = await request.post('/api/contact', {
      headers: { ...json, ...ip(22) },
      data: { ...VALID, website: 'http://spam.example' },
    });
    expect(res.status()).toBe(200);
  });

  test('refuses non-JSON bodies and foreign origins', async ({ request }) => {
    const form = await request.post('/api/contact', {
      headers: { 'Content-Type': 'text/plain', ...ip(23) },
      data: 'name=x',
    });
    expect(form.status()).toBe(403);
    const foreign = await request.post('/api/contact', {
      headers: { ...json, Origin: 'https://evil.example', ...ip(23) },
      data: VALID,
    });
    expect(foreign.status()).toBe(403);
  });

  test('limits to five requests per IP per window, then 429 with Retry-After', async ({
    request,
  }) => {
    for (let i = 0; i < CONTACT_RATE_LIMIT; i++) {
      const res = await request.post('/api/contact', {
        headers: { ...json, ...ip(24) },
        data: VALID,
      });
      expect(res.status(), `request ${i + 1}`).toBe(200);
    }
    const blocked = await request.post('/api/contact', {
      headers: { ...json, ...ip(24) },
      data: VALID,
    });
    expect(blocked.status()).toBe(429);
    expect(Number(blocked.headers()['retry-after'])).toBeGreaterThan(0);
  });
});

test.describe('contact form (BRD 6.9, 4.11)', () => {
  test.skip(({ browserName, isMobile }) => browserName !== 'chromium' || isMobile, 'one project');

  test('validates every field with the BRD messages and focuses the first error', async ({
    page,
  }) => {
    await stubTurnstile(page);
    await page.goto('/contact');
    await page.getByRole('button', { name: 'أرسل الرسالة' }).click();
    const form = page.getByTestId('contact-form');
    for (const message of [
      'أدخل اسمك',
      'أدخل رقم جوال صحيح',
      'أدخل بريداً إلكترونياً صحيحاً',
      'اكتب رسالتك',
    ]) {
      await expect(form.getByText(message, { exact: true })).toBeVisible();
    }
    await expect(page.locator('input[name="name"]')).toBeFocused();
    await expect(page.locator('input[name="name"]')).toHaveAttribute('aria-invalid', 'true');
    // The API must not have been called.
    expect(
      await page.evaluate(() =>
        performance.getEntriesByType('resource').some((e) => e.name.includes('/api/contact')),
      ),
    ).toBe(false);
  });

  test('submits through the Turnstile stub, shows the success card and tracks the event', async ({
    page,
  }) => {
    await stubTurnstile(page);
    await page.setExtraHTTPHeaders(ip(30));
    await page.goto('/contact');
    // The widget rendered (site key present) and the container is empty until interaction.
    await expect(page.locator('[data-turnstile][data-stub-widget]')).toBeAttached();

    let sent: Record<string, unknown> | null = null;
    page.on('request', (r) => {
      if (r.url().endsWith('/api/contact')) sent = r.postDataJSON() as Record<string, unknown>;
    });
    const form = page.getByTestId('contact-form');
    await form.locator('input[name="name"]').fill(VALID.name);
    await form.locator('input[name="phone"]').fill('050 169 9572');
    await form.locator('input[name="email"]').fill(VALID.email);
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: 'شراكة' }).click();
    await page.locator('textarea[name="message"]').fill(VALID.message);
    await page.getByRole('button', { name: 'أرسل الرسالة' }).click();

    await expect(page.getByTestId('contact-success')).toBeVisible();
    await expect(page.getByTestId('contact-success')).toContainText(
      'وصلتنا رسالتك. سنرد عليك قريباً.',
    );
    await expect(
      page.getByTestId('contact-success').getByRole('link', { name: 'راسلنا على واتساب' }),
    ).toHaveAttribute('href', /wa\.me\/966501699572/);
    expect(sent).toMatchObject({
      inquiry: 'شراكة',
      turnstileToken: expect.stringMatching(/^stub-token-/),
    });
    const events = await page.evaluate(
      () =>
        (window as { __umamiEvents?: Array<{ name: string; data: { inquiry?: string } }> })
          .__umamiEvents ?? [],
    );
    expect(events.filter((e) => e.name === 'contact_submit')).toEqual([
      { name: 'contact_submit', data: { inquiry: 'شراكة' } },
    ]);
  });

  test('accepts a non-Saudi number for a partner or investor (BRD 4.11 lead)', async ({ page }) => {
    await stubTurnstile(page);
    await page.setExtraHTTPHeaders(ip(31));
    await page.goto('/contact');
    let sent: Record<string, unknown> | null = null;
    page.on('request', (r) => {
      if (r.url().endsWith('/api/contact')) sent = r.postDataJSON() as Record<string, unknown>;
    });
    const form = page.getByTestId('contact-form');
    await form.locator('input[name="name"]').fill('Investor');
    await form.locator('input[name="phone"]').fill('+971 50 123 4567');
    await form.locator('input[name="email"]').fill('investor@example.ae');
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: 'استثمار' }).click();
    await form.locator('textarea[name="message"]').fill(VALID.message);
    await page.getByRole('button', { name: 'أرسل الرسالة' }).click();
    await expect(page.getByTestId('contact-success')).toBeVisible();
    expect(sent).toMatchObject({ phone: '+971 50 123 4567', inquiry: 'استثمار' });
  });

  test('keeps the values and shows the failure line when the API fails', async ({ page }) => {
    await stubTurnstile(page);
    await page.route('**/api/contact', (route) =>
      route.fulfill({ status: 500, contentType: 'application/json', body: '{"ok":false}' }),
    );
    await page.goto('/contact');
    const form = page.getByTestId('contact-form');
    await form.locator('input[name="name"]').fill(VALID.name);
    await form.locator('input[name="phone"]').fill(VALID.phone);
    await form.locator('input[name="email"]').fill(VALID.email);
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: 'تاجر' }).click();
    await page.locator('textarea[name="message"]').fill(VALID.message);
    await page.getByRole('button', { name: 'أرسل الرسالة' }).click();
    await expect(page.getByTestId('contact-message')).toHaveText(
      'تعذّر الإرسال. حاول مرة أخرى أو راسلنا على واتساب.',
    );
    await expect(page.locator('textarea[name="message"]')).toHaveValue(VALID.message);
    await expect(page.getByTestId('contact-form')).toBeVisible();
  });

  test('booking button opens WhatsApp with the BRD message when BOOKING_URL is unset', async ({
    page,
  }) => {
    await page.goto('/contact');
    const button = page.locator('[data-booking] a');
    await expect(button).toHaveAttribute('data-booking-mode', 'whatsapp');
    await expect(button).toHaveAttribute(
      'href',
      `https://wa.me/966501699572?text=${encodeURIComponent('مرحباً، أرغب بحجز استشارة مجانية.')}`,
    );
    await expect(button).toHaveAttribute('target', '_blank');
    await expect(button).toHaveAttribute('rel', 'noopener');
  });
});
