import { expect, test, type Page } from '@playwright/test';

declare global {
  interface Window {
    Konva?: {
      stages: Array<{
        findOne: (sel: string) => {
          getAbsolutePosition: () => { x: number; y: number };
          getClientRect: () => { x: number; y: number; width: number; height: number };
          position: (p?: { x: number; y: number }) => { x: number; y: number };
          fire: (evt: string, e?: unknown, bubbles?: boolean) => void;
          getStage: () => { container: () => HTMLElement };
        } | null;
      }>;
    };
  }
}

async function openDesigner(page: Page) {
  await page.goto('/');
  await page.locator('#designer').scrollIntoViewIfNeeded();
  await page.waitForSelector('[data-designer-island] canvas', { timeout: 15_000 });
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

  test('shows the sample design by default and the BRD example figures', async ({ page }) => {
    await openDesigner(page);
    await expect(digits(page, 'per-piece')).toHaveText('44');
    await expect(digits(page, 'monthly')).toHaveText('13200');
    const rect = await page.evaluate(() =>
      window.Konva!.stages[0]!.findOne('#design')!.getClientRect(),
    );
    expect(rect.width).toBeGreaterThan(40);
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
    await expect(digits(page, 'monthly')).toHaveText(String(94 * 11 * 30));
    await expect(
      page.locator('[data-designer-island] a[data-location="designer"]').first(),
    ).toHaveAttribute('href', /utm_campaign=designer&product=hoodie/);
  });

  test('uploads a PNG in memory, rejects unsupported files, resets to the sample', async ({
    page,
  }) => {
    await openDesigner(page);
    const uploads: string[] = [];
    page.on('request', (r) => {
      if (r.method() !== 'GET') uploads.push(r.url());
    });
    await page.getByLabel('ارفع ملف التصميم').setInputFiles('e2e/fixtures/design.png');
    await expect(page.getByRole('button', { name: 'غيّر التصميم' })).toBeVisible();
    expect(uploads).toEqual([]);
    await page.getByRole('button', { name: 'إعادة الضبط' }).click();
    await expect(page.getByRole('button', { name: 'جرّب تصميماً جاهزاً' })).toBeVisible();
    await page.getByLabel('ارفع ملف التصميم').setInputFiles('e2e/fixtures/not-an-image.txt');
    await expect(page.locator('p[role="alert"]')).toHaveText(
      'الملف غير مدعوم أو أكبر من 10 ميجابايت.',
    );
  });

  test('drag moves the design and it snaps back when dragged mostly outside the area', async ({
    page,
  }) => {
    await openDesigner(page);
    const canvas = page.locator('[data-designer-island] canvas').last();
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
