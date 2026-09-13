import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { formatNumber } from '@/components/shared/format-number';
import { SarAmount } from '@/components/shared/sar-amount';

describe('formatNumber (BRD 3.11)', () => {
  it('renders integers without decimals and fractions with two', () => {
    expect(formatNumber(89)).toBe('89');
    expect(formatNumber(47.5)).toBe('47.50');
    expect(formatNumber(49.999)).toBe('50');
    expect(formatNumber(0)).toBe('0');
    expect(formatNumber(13200)).toBe('13,200');
    expect(formatNumber(1234567.5)).toBe('1,234,567.50');
    expect(formatNumber(999)).toBe('999');
  });
  it('never renders NaN or Infinity in a money position', () => {
    expect(formatNumber(Number.NaN)).toBe('0');
    expect(formatNumber(Number.POSITIVE_INFINITY)).toBe('0');
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
