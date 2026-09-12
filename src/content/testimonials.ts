import type { Testimonial } from '@/content/schema';

/**
 * BRD 4.4 sample cards. Every entry is a placeholder: rendered with a visible «نموذج» tag in
 * preview builds and omitted entirely in production until real testimonials exist (BRD 0.4.9,
 * 12.4 item 1).
 */
export const testimonials: Testimonial[] = [
  {
    quote: 'ربطت متجري في سلة خلال دقائق، وأول طلب وصل عميلي خلال أربعة أيام.',
    name: 'اسم التاجر',
    store: 'اسم المتجر',
    placeholder: true,
  },
  {
    quote: 'بدأت بدون أي مخزون، والآن عندي 12 تصميماً تبيع كل أسبوع.',
    name: 'اسم التاجر',
    store: 'اسم المتجر',
    placeholder: true,
  },
  {
    quote: 'جودة الطباعة أفضل مما توقعت، والتغليف باسم متجري.',
    name: 'اسم التاجر',
    store: 'اسم المتجر',
    placeholder: true,
  },
];
