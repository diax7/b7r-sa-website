import { describe, expect, it } from 'vitest';
import { activeStep, scrollProgress } from '@/modules/home/steps/progress';

describe('steps scroll progress (BRD 6.4.4)', () => {
  const vh = 800;
  const h = 2400; // 300 vh

  it('is 0 before the section pins and 1 when it releases', () => {
    expect(scrollProgress(200, h, vh)).toBe(0);
    expect(scrollProgress(0, h, vh)).toBe(0);
    expect(scrollProgress(-(h - vh), h, vh)).toBe(1);
    expect(scrollProgress(-5000, h, vh)).toBe(1);
  });

  it('maps 0 / 33 / 66 % to steps 0 / 1 / 2', () => {
    expect(activeStep(0)).toBe(0);
    expect(activeStep(0.32)).toBe(0);
    expect(activeStep(0.34)).toBe(1);
    expect(activeStep(0.65)).toBe(1);
    expect(activeStep(0.67)).toBe(2);
    expect(activeStep(1)).toBe(2);
  });

  it('is safe for degenerate inputs', () => {
    expect(scrollProgress(0, 500, 800)).toBe(0);
    expect(activeStep(Number.NaN)).toBe(0);
    expect(activeStep(-1)).toBe(0);
    expect(activeStep(7)).toBe(2);
  });
});
