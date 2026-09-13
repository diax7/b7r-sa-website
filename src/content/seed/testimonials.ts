import type { Testimonial } from '@/content/schema';

/**
 * Three sample cards written on Dhia's instruction (2026-09-13, ADR-023) under BRD 4.1 with
 * facts from BRD 1.1 only. They stay `placeholder: true`: previews show them with the «نموذج»
 * badge and the production host omits the section (BRD 6.4.7, ADR-013). Publishing them on
 * b7r.sa is a one-line decision, set `placeholder: false`, that Dhia makes, because these
 * are not the words of real merchants (BRD 3.14: no fake reviews).
 */
export const testimonials: Testimonial[] = [
  {
    quote:
      'ربطت متجري في سلة خلال دقائق، وأول طلب وصل عميلتي في جدة بعد ثلاثة أيام. ما لمست قطعة واحدة بيدي.',
    name: 'سارة العتيبي',
    store: 'متجر نقش',
    placeholder: true,
  },
  {
    quote:
      'بدأت بتصميم واحد وبدون مخزون. اليوم عندي عشرة تصاميم تبيع كل أسبوع، وكل شحنة تصل باسم متجري.',
    name: 'فيصل الحربي',
    store: 'هودي الرياض',
    placeholder: true,
  },
  {
    quote:
      'جودة الطباعة على البربتوز أفضل مما توقعت، والتغليف نظيف وباسم متجري. عملائي لا يعرفون أن أحداً غيري يطبع.',
    name: 'ريم القحطاني',
    store: 'بيبي كيوت',
    placeholder: true,
  },
];
