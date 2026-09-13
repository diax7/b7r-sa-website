import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import { ADMIN, API, createEditor, hasAdmin, login, POLL, shows } from './helpers/cms';

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

test.describe('CMS admin', () => {
  // One admin account: parallel logins race on its sessions list (a later login can drop an
  // earlier session's id), and the publish test mutates shared content.
  test.describe.configure({ mode: 'serial' });
  test.skip(!hasAdmin, 'ADMIN_EMAIL / ADMIN_PASSWORD unset');
  const admin = ADMIN;

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

  test('signs in on an Arabic, right-to-left panel without a CSP violation', async ({
    page,
    request,
  }) => {
    await recordViolations(page);
    await page.goto('/admin/login');
    const html = page.locator('html');
    await expect(html).toHaveAttribute('lang', 'ar');
    await expect(html).toHaveAttribute('dir', /rtl/i);
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
    await expect(page.locator('#field-slug')).toHaveValue(/\w+/);
    // The pages editor: the About document opens right-to-left with its blocks in place, and
    // a rich-text block's Lexical editor is an RTL surface (2b phase 2).
    const auth = await login(request, admin);
    const about = await request.get(`${API}/pages?where[slug][equals]=about&depth=0`, {
      headers: auth,
    });
    const aboutId = ((await about.json()) as { docs: Array<{ id: number }> }).docs[0]?.id;
    expect(aboutId).toBeDefined();
    await page.goto(`/admin/collections/pages/${aboutId}`);
    await expect(page.locator('#field-slug')).toHaveValue('about');
    await expect(page.getByRole('textbox', { name: /عنوان الحكاية/ })).toHaveValue(/حكاية/);
    await page.goto('/admin/collections/pages/create');
    await page.getByRole('button', { name: /أضف قسم|Add Section/ }).click();
    await page
      .getByRole('button', { name: /نص منسّق|Rich text/ })
      .first()
      .click();
    const editor = page.locator('[data-lexical-editor="true"]').first();
    await expect(editor).toBeVisible({ timeout: 15_000 });
    expect(await editor.evaluate((el) => getComputedStyle(el).direction)).toBe('rtl');
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

  test('a short password is refused with the Arabic reason (ADR-027)', async ({ request }) => {
    const adminAuth = await login(request, admin);
    const refused = await request.post(`${API}/users`, {
      headers: adminAuth,
      data: { email: 'short@b7r.sa', password: 'abc123def', name: 'x', role: 'editor' },
    });
    expect(refused.status()).toBe(400);
    expect(await refused.text()).toContain('قصيرة');
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
      expect(await refused.text()).toContain('فقط');
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
      expect(await unpublish.text()).toContain('إلغاء نشرها');
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

    test('the jobs run endpoint answers nobody; health reports the cron', async ({ request }) => {
      const adminAuth = await login(request, ADMIN);
      for (const headers of [undefined, adminAuth]) {
        const res = await request.get(`${API}/payload-jobs/run`, headers ? { headers } : {});
        expect(res.status(), headers ? 'admin' : 'outsider').toBeGreaterThanOrEqual(401);
      }
      const health = (await (await request.get('/api/health')).json()) as { jobs: string };
      expect(['on', 'off']).toContain(health.jobs);
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
