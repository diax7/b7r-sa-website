import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SarAmount, formatSarDigits } from '@/components/shared/sar-amount';

describe('formatSarDigits', () => {
  it('renders integers without decimals and fractions with two', () => {
    expect(formatSarDigits(89)).toBe('89');
    expect(formatSarDigits(47.5)).toBe('47.50');
    expect(formatSarDigits(49.999)).toBe('50');
    expect(formatSarDigits(0)).toBe('0');
    expect(formatSarDigits(13200)).toBe('13,200');
    expect(formatSarDigits(1234567.5)).toBe('1,234,567.50');
    expect(formatSarDigits(999)).toBe('999');
  });
  it('never renders NaN or Infinity in a money position', () => {
    expect(formatSarDigits(Number.NaN)).toBe('0');
    expect(formatSarDigits(Number.POSITIVE_INFINITY)).toBe('0');
  });
});

describe('SarAmount', () => {
  it('puts the official symbol before the digits inside an LTR bdi', () => {
    const { container } = render(<SarAmount value={89} />);
    const bdi = container.querySelector('bdi');
    expect(bdi?.getAttribute('dir')).toBe('ltr');
    const children = Array.from(bdi?.children ?? []);
    expect(children[0]?.tagName.toLowerCase()).toBe('svg');
    expect(children[0]?.getAttribute('aria-label')).toBe('ريال سعودي');
    expect(children[0]?.getAttribute('fill')).toBe('currentColor');
    expect(children[1]?.textContent).toBe('89');
  });
  it('uses tabular figures', () => {
    const { container } = render(<SarAmount value={5} />);
    expect(container.querySelector('bdi')?.className).toContain('tabular');
  });
});
