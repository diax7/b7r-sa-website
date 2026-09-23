import type { Described } from '@/modules/cms/admin/descriptions/describe';

/**
 * The Appearance global, field by field (ADR-046, spec 010): what each value does on the
 * site. No hex appears here: `tests/brand-not-following.test.ts` treats a shipped brand
 * colour in a file as a copy that cannot follow the screen.
 */
export const APPEARANCE_DESCRIPTIONS: Described = {
  sources: {
    ar: 'تختارها بنفسك، ويُحسب منها كل لون آخر في الموقع.',
    en: 'Chosen by hand; every other colour of the site is computed from these five.',
  },
  'sources.primary': {
    ar: 'يملأ الأزرار والروابط وشريط الدعوة، ويُكتب عليه النص الأبيض.',
    en: 'Fills the buttons, the links and the bottom banner, with white text on it.',
  },
  'sources.primaryDark': {
    ar: 'يظهر أزرقَ ثانياً في الشعار، ومنه تُمزج خلفية الأقسام الرمادية.',
    en: "The logo's second blue; the grey sections are a faint wash of it.",
  },
  'sources.accent': {
    ar: 'يلوّن الشارات وحلقة التركيز، ومنه اللون الفاتح خلف الزر عند مرور المؤشر.',
    en: 'Colours the badges and the focus ring, and gives the light fill behind a button under the pointer.',
  },
  'sources.navy': {
    ar: 'يلوّن التذييل تحت النص الأبيض، ومنه الخطوط الفاصلة بين الأقسام.',
    en: 'Colours the footer under white text, and gives the hairlines between sections.',
  },
  'sources.ink': {
    ar: 'يلوّن نص المحتوى في كل صفحة، ومنه يُحسب النص الثانوي.',
    en: 'Colours the body text of every page; the secondary text is computed from it.',
  },
  pins: {
    ar: 'تُحسب من ألوان العلامة؛ ثبّت لوناً يدوياً فقط إذا لم يناسب الموقع لونه المحسوب.',
    en: 'Computed from the brand colours; set one by hand only when its computed colour is wrong.',
  },
  typeface: {
    ar: 'تُكتب به عناوين الموقع واللوحة وفقراتهما. ترخيص ITF Rayat Round يقتصر على b7r.sa.',
    en: 'Sets every heading and paragraph of the site and the panel. ITF Rayat Round is licensed for b7r.sa only.',
  },
  logoPrimary: {
    ar: 'يحلّ محل الشعار الملوّن في الترويسة؛ فارغ يُبقي الشعار الأصلي. صورة عريضة.',
    en: 'Replaces the colour logo in the header; empty keeps the shipped one. A wide image.',
  },
  logoOnDark: {
    ar: 'يحلّ محل الشعار الأبيض في التذييل؛ فارغ يُبقي الشعار الأصلي.',
    en: 'Replaces the white logo in the footer; empty keeps the shipped one.',
  },
};
