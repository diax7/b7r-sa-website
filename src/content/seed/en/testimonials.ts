/**
 * The three sample testimonials in English, by the Arabic merchant name (ADR-023): they stay
 * `placeholder: true` in both languages until Dhia publishes real ones (BRD 3.14).
 */
export const testimonialsEn: Record<string, { quote: string; name: string; store: string }> = {
  'سارة العتيبي': {
    quote:
      'I connected my Salla store in minutes, and the first order reached my customer in Jeddah three days later. I never touched a single piece.',
    name: 'Sarah Al-Otaibi',
    store: 'Naqsh Store',
  },
  'فيصل الحربي': {
    quote:
      'I started with one design and no stock. Today I have ten designs selling every week, and every parcel arrives under my store name.',
    name: 'Faisal Al-Harbi',
    store: 'Hoodie Riyadh',
  },
  'ريم القحطاني': {
    quote:
      'The print quality on the onesies is better than I expected, and the packaging is clean and carries my store name. My customers have no idea anyone but me prints them.',
    name: 'Reem Al-Qahtani',
    store: 'Baby Cute',
  },
};
