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

async function paint(page: Page, key: SetKey) {
  await page.evaluate((surface) => {
    for (const id of ['why-us', 'faq', 'video', 'integrations']) {
      const section = document.getElementById(id);
      if (section) section.dataset['surface'] = surface;
    }
  }, key);
}

const colourOf = (page: Page, selector: string, property = 'color') =>
  page
    .locator(selector)
    .first()
    .evaluate((el, p) => getComputedStyle(el).getPropertyValue(p), property);

async function serious(page: Page): Promise<string[]> {
  const { AxeBuilder } = await import('@axe-core/playwright');
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .include('#why-us')
    .include('#faq')
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

        expect(await colourOf(page, '#why-us', 'background-color'), tag).toBe(want.background);
        const image = await colourOf(page, '#why-us', 'background-image');
        if (want.gradient) expect(image, tag).toContain('radial-gradient');
        else expect(image, tag).toBe('none');
        // The section's own words: its heading and the eyebrow over it.
        expect(await colourOf(page, '#why-us-title'), tag).toBe(want.text);
        expect(await colourOf(page, '#why-us .eyebrow'), tag).toBe(want.link);
        // A card inside keeps the page's white and ink, whatever the set.
        const card = '#why-us .bg-surface';
        expect(await colourOf(page, card, 'background-color'), tag).toBe(WHITE);
        expect(await colourOf(page, `${card} h3`), tag).toBe(INK);
        // The FAQ's link reads the set's link colour.
        expect(await colourOf(page, '#faq a.text-primary'), tag).toBe(want.link);
        // The call to action: the primary blue with white words on a light set, the white
        // button with primary words on a dark one. The shiny variant (Site settings) paints its
        // fill as a gradient, so the fill is read from whichever of the two it uses.
        const button = page.locator('#video a[data-location="video"]');
        const [fill, words] =
          key === 'deep-sea' ? [WHITE, 'rgb(0, 88, 176)'] : ['rgb(0, 88, 176)', WHITE];
        const painted = await button.evaluate((el) => {
          const style = getComputedStyle(el);
          return { colour: style.color, fill: `${style.backgroundColor} ${style.backgroundImage}` };
        });
        expect(painted.colour, tag).toBe(words);
        expect(painted.fill, tag).toContain(fill);
        expect(await serious(page), `axe: ${tag}`).toEqual([]);
      }
    });
  }
}
