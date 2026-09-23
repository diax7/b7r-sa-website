import { expect, type Page, test } from '@playwright/test';

/**
 * The background sets on real sections (spec 010, phase 1c). Until the section picker lands
 * (phase 2) nothing on the site names a themed set, so this suite names one on existing home
 * sections through `data-surface`, the attribute `Section` writes, and asserts what the head's
 * rules paint: the background, the words on it, the cards inside keeping the page's ink, the
 * link colour, the white button on a dark set, and axe, at 1440 and 390 in both languages.
 * It reads the site and never writes the CMS, so it runs with the public projects, once.
 */
test.beforeEach(() => {
  test.skip(
    test.info().project.name !== 'desktop-chrome',
    'Viewport sizes are set per test; one project is enough',
  );
});

const INK = 'rgb(20, 24, 31)';
const WHITE = 'rgb(255, 255, 255)';

/** What each set must paint: its background, its text, its links. */
const SETS = {
  'deep-sea': {
    background: 'rgb(10, 47, 94)',
    text: WHITE,
    link: 'rgb(230, 245, 252)',
    gradient: false,
  },
  'sea-mist': {
    background: 'rgb(187, 208, 217)',
    text: INK,
    link: 'rgb(10, 42, 80)',
    gradient: true,
  },
} as const;

type SetKey = keyof typeof SETS;

/**
 * Names the set on the sections of a live page. A visitor gets `data-surface` from the server
 * and never sees it change, but here it flips after the render, so the buttons' and links'
 * `transition-colors` would animate from the old colour: transitions are stopped first, and
 * every read after the flip is an assertion that retries.
 */
async function paint(page: Page, key: SetKey) {
  await page.addStyleTag({ content: '*,*::before,*::after{transition:none!important}' });
  await page.evaluate((surface) => {
    for (const id of ['why-us', 'faq', 'video', 'integrations']) {
      const section = document.getElementById(id);
      if (section) section.dataset['surface'] = surface;
    }
  }, key);
}

const first = (page: Page, selector: string) => page.locator(selector).first();

async function serious(page: Page): Promise<string[]> {
  const { AxeBuilder } = await import('@axe-core/playwright');
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .include('#why-us')
    .include('#faq')
    .include('#video')
    .include('#integrations')
    .analyze();
  return results.violations
    .filter((v) => ['serious', 'critical'].includes(v.impact ?? ''))
    .map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
}

test('the shipped keys keep today’s look: every section is white or light grey with ink words', async ({
  page,
}) => {
  await page.goto('/');
  const sections = page.locator('section[data-surface]');
  expect(await sections.count()).toBeGreaterThan(4);
  for (const section of await sections.all()) {
    const surface = await section.getAttribute('data-surface');
    expect(['surface', 'ground']).toContain(surface);
    const { background, color } = await section.evaluate((el) => ({
      background: getComputedStyle(el).backgroundColor,
      color: getComputedStyle(el).color,
    }));
    expect(background, `${surface} background`).toBe(
      surface === 'ground' ? 'rgb(246, 248, 251)' : WHITE,
    );
    expect(color, `${surface} text`).toBe(INK);
  }
});

for (const path of ['/', '/en']) {
  for (const key of Object.keys(SETS) as SetKey[]) {
    test(`${key} on ${path}: the section, its words, the cards inside, the link, the button, axe at 1440 and 390`, async ({
      page,
    }) => {
      const want = SETS[key];
      for (const width of [1440, 390]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(path);
        await paint(page, key);
        const tag = `${key} ${path} ${width}`;

        const section = first(page, '#why-us');
        await expect(section, tag).toHaveCSS('background-color', want.background);
        await expect(section, tag).toHaveCSS(
          'background-image',
          want.gradient ? /radial-gradient/ : 'none',
        );
        // The section's own words: its heading and the eyebrow over it.
        await expect(first(page, '#why-us-title'), tag).toHaveCSS('color', want.text);
        await expect(first(page, '#why-us .eyebrow'), tag).toHaveCSS('color', want.link);
        // A card inside keeps the page's white and ink, whatever the set.
        const card = '#why-us .bg-surface';
        await expect(first(page, card), tag).toHaveCSS('background-color', WHITE);
        await expect(first(page, `${card} h3`), tag).toHaveCSS('color', INK);
        // The FAQ's link reads the set's link colour.
        await expect(first(page, '#faq a.text-primary'), tag).toHaveCSS('color', want.link);
        // The call to action: the primary blue with white words on a light set, the white
        // button with primary words on a dark one. The shiny variant (Site settings) paints its
        // fill as a gradient, so the fill is read from whichever of the two it uses.
        const button = page.locator('#video a[data-location="video"]');
        const [fill, words] =
          key === 'deep-sea' ? [WHITE, 'rgb(0, 88, 176)'] : ['rgb(0, 88, 176)', WHITE];
        await expect(button, tag).toHaveCSS('color', words);
        await expect
          .poll(
            () =>
              button.evaluate((el) => {
                const style = getComputedStyle(el);
                return `${style.backgroundColor} ${style.backgroundImage}`;
              }),
            { message: tag },
          )
          .toContain(fill);
        expect(await serious(page), `axe: ${tag}`).toEqual([]);
      }
    });
  }
}

test('the grain paints: Sea mist with its grain differs from Sea mist without it', async ({
  page,
}) => {
  await page.goto('/');
  await paint(page, 'sea-mist');
  const section = page.locator('#why-us');
  await section.scrollIntoViewIfNeeded();
  const clip = await section.boundingBox();
  // A patch of the field near the top, where no card sits.
  const patch = { x: clip!.x + 8, y: clip!.y + 8, width: 160, height: 24 };
  const withGrain = await page.screenshot({ clip: patch });
  // The same section with the grain layer (the first) taken away, the blooms kept.
  await section.evaluate((el) => {
    const image = getComputedStyle(el).backgroundImage;
    el.style.backgroundImage = image.slice(image.indexOf('radial-gradient'));
  });
  const without = await page.screenshot({ clip: patch });
  expect(withGrain.equals(without), 'the grain changed nothing').toBe(false);
});
