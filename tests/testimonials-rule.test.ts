import { describe, expect, it } from 'vitest';
import { testimonials } from '@/content/seed/testimonials';
import { shouldRenderTestimonials } from '@/modules/home/testimonials/rule';

describe('testimonials rendering rule (BRD 6.4.7, ADR-013 amended 2026-10-03)', () => {
  it('renders the sample entries, each of which carries its badge flag', () => {
    expect(testimonials.every((t) => t.placeholder)).toBe(true);
    expect(shouldRenderTestimonials(testimonials)).toBe(true);
  });
  it('renders a real entry beside the samples', () => {
    const real = [...testimonials, { quote: 'x', name: 'y', store: 'z', placeholder: false }];
    expect(shouldRenderTestimonials(real)).toBe(true);
  });
  it('never renders an empty list', () => {
    expect(shouldRenderTestimonials([])).toBe(false);
  });
});
