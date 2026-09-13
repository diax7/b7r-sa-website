import { describe, expect, it } from 'vitest';
import { testimonials } from '@/content/seed/testimonials';
import { shouldRenderTestimonials } from '@/modules/home/testimonials/rule';

describe('testimonials rendering rule (BRD 6.4.7, ADR-013)', () => {
  it('renders placeholders on preview hosts', () => {
    expect(shouldRenderTestimonials(testimonials, false)).toBe(true);
  });
  it('omits the section on the production host while all entries are placeholders', () => {
    expect(shouldRenderTestimonials(testimonials, true)).toBe(false);
  });
  it('renders on production once one real entry exists', () => {
    const real = [...testimonials, { quote: 'x', name: 'y', store: 'z', placeholder: false }];
    expect(shouldRenderTestimonials(real, true)).toBe(true);
  });
  it('never renders an empty list', () => {
    expect(shouldRenderTestimonials([], false)).toBe(false);
  });
});
