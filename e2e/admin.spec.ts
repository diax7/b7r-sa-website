import { randomBytes } from 'node:crypto';
import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

/**
 * The CMS from three seats (BRD 9.3, 9.6, ADR-028): the admin who signs in through the
 * Arabic RTL panel, the editor who must be refused users and settings, and the outsider
 * holding no credential at all. Needs the admin created by `pnpm admin:create`
 * (ADMIN_EMAIL / ADMIN_PASSWORD); skipped without them.
 */
const email = process.env['ADMIN_EMAIL'];
const password = process.env['ADMIN_PASSWORD'];
const API = '/api/payload';

declare global {
  interface Window {
    __cspViolations?: string[];
  }
}

async function login(request: APIRequestContext, credentials: { email: string; password: string }) {
  const res = await request.post(`${API}/users/login`, { data: credentials });
  expect(res.status(), 'login').toBe(200);
  const { token } = (await res.json()) as { token: string };
  return { Authorization: `JWT ${token}` };
}

/** Array rows carry their own ids; a copied document must not reuse them. */
const withoutRowIds = (rows: unknown) =>
  Array.isArray(rows) ? rows.map(({ id: _row, ...row }: Record<string, unknown>) => row) : rows;

async function recordViolations(page: Page) {
  await page.addInitScript(() => {
    window.__cspViolations = [];
    document.addEventListener('securitypolicyviolation', (e) => {
      window.__cspViolations?.push(`${e.violatedDirective} ${e.blockedURI}`);
    });
  });
}

test.describe('CMS admin', () => {
  // One admin account: parallel logins race on its sessions list (a later login can drop an
  // earlier session's id), and the publish test mutates shared content.
  test.describe.configure({ mode: 'serial' });
  test.skip(!email || !password, 'ADMIN_EMAIL / ADMIN_PASSWORD unset');
  test.skip(({ browserName, isMobile }) => browserName !== 'chromium' || isMobile, 'one project');
  const admin = { email: email ?? '', password: password ?? '' };

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

  test('signs in on an Arabic, right-to-left panel without a CSP violation', async ({ page }) => {
    await recordViolations(page);
    await page.goto('/admin/login');
    const html = page.locator('html');
    await expect(html).toHaveAttribute('lang', 'ar');
    await expect(html).toHaveAttribute('dir', /rtl/i);
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
    await expect(page.locator('#field-slug')).toHaveValue(/\w+/);
    expect(await page.evaluate(() => window.__cspViolations ?? [])).toEqual([]);
  });

  test('an editor edits content but is refused users, settings and published deletes', async ({
    request,
  }) => {
    const adminAuth = await login(request, admin);
    const editor = {
      email: `e2e-editor-${randomBytes(4).toString('hex')}@b7r.sa`,
      password: randomBytes(18).toString('base64url'),
    };
    const created = await request.post(`${API}/users`, {
      headers: adminAuth,
      data: { ...editor, name: 'محرر الاختبار', role: 'editor' },
    });
    expect(created.status()).toBe(201);
    const editorId = ((await created.json()) as { doc: { id: number } }).doc.id;
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

  // Mutates `tote-bag` while products.spec.ts may run on another worker: safe only because
  // no public assertion reads `material` or `sizesSummary` of that product.
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
    const shows = (path: string, text: string) => async () =>
      (await (await request.get(path)).text()).includes(text);
    const poll = { intervals: [1_000, 2_000, 3_000] };
    expect(
      (await publish({ material: `${doc.material} (${stamp})`, sizesSummary: stamp })).status(),
    ).toBe(200);
    try {
      // The publish hook regenerates the listing and the page (revalidatePath, ADR-030);
      // the 60 s timer is only the floor.
      await expect.poll(shows('/products', stamp), { ...poll, timeout: 15_000 }).toBe(true);
      await expect
        .poll(shows('/products/tote-bag', stamp), { ...poll, timeout: 15_000 })
        .toBe(true);
    } finally {
      expect(
        (await publish({ material: doc.material, sizesSummary: doc.sizesSummary })).status(),
      ).toBe(200);
    }
    await expect.poll(shows('/products', stamp), { ...poll, timeout: 15_000 }).toBe(false);
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
    const shows = (path: string, text: string) => async () =>
      (await (await request.get(path)).text()).includes(text);

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
      await expect.poll(shows('/products', newSlug), { ...poll, timeout: 15_000 }).toBe(true);
      await expect.poll(status(`/products/${newSlug}`), { ...poll, timeout: 15_000 }).toBe(200);
      await expect.poll(shows('/sitemap.xml', newSlug), { ...poll, timeout: 15_000 }).toBe(true);
      expect(await shows('/products', draftSlug)()).toBe(false);
      expect(await shows('/sitemap.xml', draftSlug)()).toBe(false);
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
    await expect.poll(shows('/products', newSlug), { ...poll, timeout: 15_000 }).toBe(false);
  });
});
