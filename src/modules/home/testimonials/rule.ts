import type { Testimonial } from '@/content/schema';

/**
 * BRD 6.4.7: while every entry is a placeholder, the section renders with «نموذج» badges on
 * preview hosts and is omitted entirely on the production host (ADR-013).
 */
export function shouldRenderTestimonials(
  entries: Testimonial[],
  isProductionSite: boolean,
): boolean {
  if (entries.length === 0) return false;
  const allPlaceholders = entries.every((t) => t.placeholder);
  return !(allPlaceholders && isProductionSite);
}
