import { expect, test, type Page } from '@playwright/test';

declare global {
  interface Window {
    Konva?: {
      stages: Array<{
        findOne: (sel: string) => {
          getAbsolutePosition: () => { x: number; y: number };
          getClientRect: () => { x: number; y: number; width: number; height: number };
          scaleX: () => number;
          position: (p?: { x: number; y: number }) => { x: number; y: number };
          fire: (evt: string, e?: unknown, bubbles?: boolean) => void;
          getStage: () => { container: () => HTMLElement };
          isVisible: () => boolean;
        } | null;
      }>;
    };
  }
}

async function openDesigner(page: Page) {
  // Decide consent up front so the card never overlaps the canvas during pointer tests.
  await page
    .context()
    .addCookies([{ name: 'b7r_consent', value: 'denied', url: 'http://localhost:3004' }]);
  await page.goto('/');
  await page.locator('#designer').scrollIntoViewIfNeeded();
  await page.waitForSelector('[data-designer-island] canvas', { timeout: 15_000 });
}

/** The print area starts empty (ADR-036); most tests want a design placed, the fixture PNG. */
async function placeSample(page: Page) {
  await page.getByLabel('ارفع ملف التصميم').setInputFiles('e2e/fixtures/design.png');
  await page.waitForFunction(() => !!window.Konva?.stages[0]?.findOne('#design'));
}

const digits = (page: Page, key: string) =>
  page.locator(`[data-result="${key}"] [data-sar-digits]`);

test.describe('designer and profit calculator (BRD 6.4.3)', () => {
  test('is not loaded before the section approaches the viewport', async ({ page }) => {
    const chunks: string[] = [];
    page.on('request', (r) => {
      if (r.resourceType() === 'script') chunks.push(r.url());
    });
    await page.goto('/');
    await page.waitForLoadState('load');
    const before = chunks.length;
    await expect(page.locator('[data-designer-fallback]')).toBeVisible();
    expect(await page.evaluate(() => typeof window.Konva)).toBe('undefined');
    await page.locator('#designer').scrollIntoViewIfNeeded();
    await page.waitForSelector('[data-designer-island] canvas', { timeout: 15_000 });
    expect(chunks.length).toBeGreaterThan(before);
    expect(await page.evaluate(() => typeof window.Konva)).toBe('object');
  });

  test('starts with the upload prompt on the print area, white only, and the BRD example figures', async ({
    page,
  }) => {
    await openDesigner(page);
    await expect(digits(page, 'per-piece')).toHaveText('44');
    await expect(digits(page, 'monthly')).toHaveText('13,200');
    const prompt = page.locator('[data-print-area-prompt]');
    await expect(prompt).toContainText('اضغط لرفع شعارك أو صورتك');
    // The prompt fits inside the print area on every stage size (nothing spills past it).
    expect(await prompt.locator('label').evaluate((el) => el.scrollHeight - el.clientHeight)).toBe(
      0,
    );
    await expect(page.locator('[data-designer-island] input[name="designer-color"]')).toHaveCount(
      0,
    );
    expect(
      await page.evaluate(() => window.Konva?.stages[0]?.findOne('#design') ?? null),
    ).toBeNull();
    await placeSample(page);
    const rect = await page.evaluate(() =>
      window.Konva!.stages[0]!.findOne('#design')!.getClientRect(),
    );
    expect(rect.width).toBeGreaterThan(40);
    await expect(page.locator('[data-print-area-prompt]')).toHaveCount(0);
  });

  test('warns below cost and shows zero at cost', async ({ page }) => {
    await openDesigner(page);
    const input = page.getByLabel('سعر البيع بالريال');
    await input.fill('40');
    await input.press('Enter');
    await expect(page.locator('[data-result="warning"]')).toHaveText(
      'سعر البيع أقل من التكلفة. ارفع السعر لتربح.',
    );
    await expect(digits(page, 'per-piece')).toHaveText('-5');
    await input.fill('45');
    await input.press('Enter');
    await expect(page.locator('[data-result="warning"]')).toHaveCount(0);
    await expect(digits(page, 'per-piece')).toHaveText('0');
    await input.fill('999');
    await input.press('Enter');
    await expect(input).toHaveValue('180');
  });

  test('changing product resets the price to its suggestion; daily sales stepper works', async ({
    page,
  }) => {
    await openDesigner(page);
    await page.locator('label', { hasText: 'هودي' }).click();
    await expect(page.getByLabel('سعر البيع بالريال')).toHaveValue('189');
    await expect(digits(page, 'per-piece')).toHaveText('94');
    await page.getByRole('button', { name: 'زد المبيعات اليومية' }).click();
    await expect(digits(page, 'monthly')).toHaveText('31,020');
    await expect(
      page.locator('[data-designer-island] a[data-location="designer"]').first(),
    ).toHaveAttribute('href', /utm_campaign=designer&product=hoodie/);
  });

  test('uploads a PNG through the print area in memory, removes it with «×», rejects bad files', async ({
    page,
    isMobile,
  }) => {
    await openDesigner(page);
    const uploads: string[] = [];
    page.on('request', (r) => {
      if (r.method() !== 'GET') uploads.push(r.url());
    });
    await page.getByLabel('ارفع ملف التصميم').setInputFiles('e2e/fixtures/design.png');
    await page.waitForFunction(() => !!window.Konva?.stages[0]?.findOne('#design'));
    await expect(page.locator('[data-print-area-prompt]')).toHaveCount(0);
    expect(uploads).toEqual([]);
    // The «×» shows with the edit chrome: hover on desktop, a tap on the design on touch.
    const remove = page.locator('[data-design-remove]');
    const canvas = page.locator('[data-designer-island] canvas').last();
    if (isMobile) {
      await expect(remove).toHaveCSS('opacity', '0');
      await canvas.tap();
    } else {
      await canvas.hover();
    }
    await expect(remove).toHaveCSS('opacity', '1');
    const box = (await remove.boundingBox())!;
    expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(44);
    await remove.click();
    await expect(page.locator('[data-print-area-prompt]')).toBeVisible();
    await page.getByLabel('ارفع ملف التصميم').setInputFiles('e2e/fixtures/not-an-image.txt');
    const alert = page.locator('[data-print-area-prompt] [role="alert"]');
    await expect(alert).toHaveText('الملف غير مدعوم أو أكبر من 10 ميجابايت.');
    await expect(alert).toBeInViewport({ ratio: 1 });
  });

  test('edit chrome shows only while the pointer is inside the print area, and hides on its own', async ({
    page,
    isMobile,
  }) => {
    await openDesigner(page);
    await placeSample(page);
    const canvas = page.locator('[data-designer-island] canvas').last();
    const host = page.locator('[data-design-dropzone]');
    const remove = page.locator('[data-design-remove]');
    // Centre the canvas so neither the sticky header nor the results bar covers a tap.
    await canvas.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
    await page.waitForTimeout(300);
    await page.mouse.move(0, 0);
    await expect(host).toHaveAttribute('data-chrome', 'false');
    await expect(remove).toHaveCSS('opacity', '0');
    if (isMobile) {
      const box = (await canvas.boundingBox())!;
      const pos = await page.evaluate(() =>
        window.Konva!.stages[0]!.findOne('#design')!.getAbsolutePosition(),
      );
      await page.touchscreen.tap(box.x + pos.x, box.y + pos.y);
      await expect(host).toHaveAttribute('data-chrome', 'true');
      // A finger lifted inside the area keeps the chrome for a moment (long enough for the «×»),
      // then it hides on its own; nothing else has to be tapped.
      await expect(host).toHaveAttribute('data-chrome', 'false', { timeout: 6_000 });
      // A tap on the mockup outside the area shows nothing.
      await page.touchscreen.tap(box.x + 12, box.y + box.height / 2);
      await page.waitForTimeout(300);
      await expect(host).toHaveAttribute('data-chrome', 'false');
    } else {
      await canvas.hover();
      await expect(host).toHaveAttribute('data-chrome', 'true');
      // The stage's corner is outside the area: the chrome hides without a click anywhere.
      const box = (await canvas.boundingBox())!;
      await page.mouse.move(box.x + 12, box.y + box.height - 12);
      await expect(host).toHaveAttribute('data-chrome', 'false');
      await page.mouse.move(0, 0);
      await expect(host).toHaveAttribute('data-chrome', 'false');
    }
  });

  test('the wheel scrolls the page and never scales the design', async ({ page, isMobile }) => {
    test.skip(isMobile, 'a mouse wheel');
    await openDesigner(page);
    await placeSample(page);
    const canvas = page.locator('[data-designer-island] canvas').last();
    await canvas.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
    await page.waitForTimeout(300);
    const scale = () => page.evaluate(() => window.Konva!.stages[0]!.findOne('#design')!.scaleX());
    const before = await scale();
    const y0 = await page.evaluate(() => window.scrollY);
    await canvas.hover();
    await page.mouse.wheel(0, 240);
    await page.waitForTimeout(300);
    expect(await scale()).toBe(before);
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(y0);
  });

  test('drag moves the design and it snaps back when dragged mostly outside the area', async ({
    page,
  }) => {
    await openDesigner(page);
    await placeSample(page);
    const canvas = page.locator('[data-designer-island] canvas').last();
    // Centre the canvas so neither the sticky results bar nor the widget sits under the pointer.
    await canvas.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
    await page.waitForTimeout(300);
    const box = (await canvas.boundingBox())!;
    const start = await page.evaluate(() =>
      window.Konva!.stages[0]!.findOne('#design')!.getAbsolutePosition(),
    );
    // Small drag: 40 px to the left.
    await page.mouse.move(box.x + start.x, box.y + start.y);
    await page.mouse.down();
    await page.mouse.move(box.x + start.x - 20, box.y + start.y, { steps: 4 });
    await page.mouse.move(box.x + start.x - 40, box.y + start.y, { steps: 4 });
    await page.mouse.up();
    await page.waitForTimeout(300);
    const moved = await page.evaluate(() =>
      window.Konva!.stages[0]!.findOne('#design')!.getAbsolutePosition(),
    );
    expect(Math.abs(moved.x - (start.x - 40))).toBeLessThan(3);
    await expect(page.locator('[data-canvas-hint]')).toHaveCount(0);

    // Large drag: far outside the print area → snaps back to the last valid position.
    await page.mouse.move(box.x + moved.x, box.y + moved.y);
    await page.mouse.down();
    await page.mouse.move(box.x + moved.x - 200, box.y + moved.y - 200, { steps: 8 });
    await page.mouse.move(box.x + 8, box.y + 8, { steps: 8 });
    await page.mouse.up();
    await page.waitForTimeout(400);
    const settled = await page.evaluate(() =>
      window.Konva!.stages[0]!.findOne('#design')!.getAbsolutePosition(),
    );
    expect(Math.abs(settled.x - moved.x)).toBeLessThan(3);
    expect(Math.abs(settled.y - moved.y)).toBeLessThan(3);
  });

  test('deep link preselects the product and scrolls to the section', async ({ page }) => {
    await page.goto('/#designer?product=hoodie');
    await page.waitForSelector('[data-designer-island] canvas', { timeout: 15_000 });
    await expect(page.getByRole('radio', { name: 'هودي' })).toBeChecked();
    const top = await page.locator('#designer').evaluate((el) => el.getBoundingClientRect().top);
    expect(top).toBeLessThan(200);
  });
});
