import { expect, test } from '@playwright/test';
import { NEWSLETTER_RATE_LIMIT } from '../src/modules/forms/newsletter/schema';

// One project, serial, one client IP per test: the in-memory limiter (5 per 10 min) must see
// deterministic traffic (plan 1b §H). The 429 test runs last and spends exactly its own budget.
test.describe.configure({ mode: 'serial' });

const json = { 'Content-Type': 'application/json' };
// Unique per run: a reused local server keeps its limiter state between runs.
const RUN = Date.now() % 65_536;
const ip = (n: number) => ({ 'x-forwarded-for': `10.${RUN >> 8}.${RUN & 255}.${n}` });

test.describe('newsletter API (BRD 6.14)', () => {
  test.skip(
    ({ browserName, isMobile }) => browserName !== 'chromium' || isMobile,
    'single project',
  );

  test('health reports the mock transport in this environment', async ({ request }) => {
    const body = (await (await request.get('/api/health')).json()) as { newsletter: string };
    expect(body.newsletter).toBe('mock');
  });

  test('subscribes a valid email and treats a duplicate as ok', async ({ request }) => {
    const email = `test-${Date.now()}@example.com`;
    const first = await request.post('/api/newsletter', {
      headers: { ...json, ...ip(10) },
      data: { email },
    });
    expect(first.status()).toBe(200);
    const second = await request.post('/api/newsletter', {
      headers: { ...json, ...ip(10) },
      data: { email },
    });
    expect(second.status()).toBe(200);
    expect(await second.json()).toEqual({ ok: true });
  });

  test('rejects an invalid email with 400', async ({ request }) => {
    const res = await request.post('/api/newsletter', {
      headers: { ...json, ...ip(11) },
      data: { email: 'nope' },
    });
    expect(res.status()).toBe(400);
  });

  test('honeypot returns 200 without subscribing', async ({ request }) => {
    const res = await request.post('/api/newsletter', {
      headers: { ...json, ...ip(12) },
      data: { email: 'bot@example.com', website: 'http://spam.example' },
    });
    expect(res.status()).toBe(200);
  });

  test('refuses non-JSON bodies and foreign origins', async ({ request }) => {
    const text = await request.post('/api/newsletter', {
      headers: { 'Content-Type': 'text/plain', ...ip(13) },
      data: 'email=a@b.co',
    });
    expect(text.status()).toBe(403);
    const foreign = await request.post('/api/newsletter', {
      headers: { ...json, Origin: 'https://evil.example', ...ip(13) },
      data: { email: 'a@b.co' },
    });
    expect(foreign.status()).toBe(403);
  });

  test('limits to five requests per IP per window, then 429 with Retry-After', async ({
    request,
  }) => {
    for (let i = 0; i < NEWSLETTER_RATE_LIMIT; i++) {
      const res = await request.post('/api/newsletter', {
        headers: { ...json, ...ip(14) },
        data: { email: `limit-${i}@example.com` },
      });
      expect(res.status(), `request ${i + 1}`).toBe(200);
    }
    const sixth = await request.post('/api/newsletter', {
      headers: { ...json, ...ip(14) },
      data: { email: 'limit-6@example.com' },
    });
    expect(sixth.status()).toBe(429);
    expect(Number(sixth.headers()['retry-after'])).toBeGreaterThan(0);
  });
});

test.describe('newsletter form (BRD 6.3.3)', () => {
  test.skip(
    ({ browserName, isMobile }) => browserName !== 'chromium' || isMobile,
    'single project',
  );

  test('shows the success and validation messages inline', async ({ page }) => {
    await page.goto('/');
    const form = page.getByTestId('newsletter-form');
    await form.scrollIntoViewIfNeeded();
    const input = form.getByRole('textbox');
    await input.fill('not-an-email');
    await form.getByRole('button', { name: 'اشترك' }).click();
    await expect(page.getByTestId('newsletter-message')).toHaveText('أدخل بريداً إلكترونياً صحيحاً.');
    await input.fill(`form-${Date.now()}@example.com`);
    await form.getByRole('button', { name: 'اشترك' }).click();
    await expect(page.getByTestId('newsletter-message')).toHaveText('اشتركت. سنرسل لك الجديد فقط.');
    await expect(form.getByRole('button', { name: 'اشترك' })).toBeDisabled();
    const events = await page.evaluate(
      () => (window as { __umamiEvents?: Array<{ name: string }> }).__umamiEvents ?? [],
    );
    expect(events.some((e) => e.name === 'newsletter_submit')).toBe(true);
  });

  test('shows the unavailable message when the API fails', async ({ page }) => {
    await page.route('**/api/newsletter', (route) =>
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: '{"ok":false,"error":"not_configured"}',
      }),
    );
    await page.goto('/');
    const form = page.getByTestId('newsletter-form');
    await form.scrollIntoViewIfNeeded();
    await form.getByRole('textbox').fill('x@example.com');
    await form.getByRole('button', { name: 'اشترك' }).click();
    await expect(page.getByTestId('newsletter-message')).toHaveText('تعذّر الاشتراك الآن، حاول لاحقاً.');
  });
});
