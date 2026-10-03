import type { Testimonial } from '@/content/schema';

/**
 * BRD 6.4.7: the section shows whenever it has an entry, on every host. A sample entry
 * (`placeholder`) carries its visible «نموذج» badge wherever it shows, so it never reads as a
 * real merchant's words (ADR-013, amended 2026-10-03: the samples show on b7r.sa too).
 */
export function shouldRenderTestimonials(entries: Testimonial[]): boolean {
  return entries.length > 0;
}
