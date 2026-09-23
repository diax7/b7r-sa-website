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
  surfaces: {
    ar: 'تختارها الأقسام إلى جانب الخلفيات الثلاث من ألوان العلامة، ولكل منها نصها وروابطها وزرها.',
    en: 'Sets a section can pick besides the three built from the brand, each with its own text, links and button.',
  },
  'surfaces.label': {
    ar: 'يظهر للمحررين في قائمة خلفيات الأقسام: رذاذ البحر.',
    en: "Shown to editors in a section's background list: Sea mist.",
  },
  'surfaces.key': {
    ar: 'يعرّف الخلفية في الشيفرة وفي اختيار الأقسام؛ حروف لاتينية صغيرة وشرطات: sea-mist.',
    en: 'Names the background in the code and in the section picker; lowercase with hyphens: sea-mist.',
  },
  'surfaces.kind': {
    ar: 'لون واحد مسطّح، أو تدرّج من بقع لون ناعمة فوقه.',
    en: 'One flat colour, or a gradient of soft blooms over it.',
  },
  'surfaces.background': {
    ar: 'يملأ القسم؛ وفي التدرّج يكون الأرضية التي تستقر عليها بقع اللون.',
    en: 'Fills the section; under a gradient it is the field the blooms sit on.',
  },
  'surfaces.button': {
    ar: 'يحدّد زر الدعوة عليها: الأزرق الأساسي، أو الزر الأبيض للخلفية الداكنة.',
    en: 'Sets the call to action on it: the primary blue, or the white button for a dark background.',
  },
  'surfaces.text': {
    ar: 'يلوّن العناوين ونص المحتوى عليها، ويُفحص عند كل نقطة من الخلفية.',
    en: 'Colours the headings and body text on it; checked at every point of the background.',
  },
  'surfaces.textMuted': {
    ar: 'يلوّن النص الثانوي عليها، بالحد نفسه 4.5:1 في كل مكان منها.',
    en: 'Colours the secondary text on it, held to the same 4.5:1 everywhere.',
  },
  'surfaces.link': {
    ar: 'يلوّن الروابط والكلمات الملوّنة بالأساسي عليها، وحلقة التركيز.',
    en: 'Colours the links and the primary-coloured words on it, and the keyboard focus ring.',
  },
  'surfaces.blooms': {
    ar: 'تضع بقعاً ناعمة من اللون فوق الأرضية، بالنسبة المئوية من القسم: أربع على الأكثر.',
    en: 'Soft patches of colour over the field, in percent of the section: up to four.',
  },
  'surfaces.blooms.colour': {
    ar: 'يظهر في مركز البقعة ويتلاشى عند حافتها.',
    en: "Shows at the bloom's centre and fades to nothing at its edge.",
  },
  'surfaces.blooms.x': {
    ar: 'يحدّد موضع المركز أفقياً: 0 الحافة اليسرى و100 اليمنى.',
    en: 'Where the centre sits across the section: 0 is the left edge, 100 the right.',
  },
  'surfaces.blooms.y': {
    ar: 'يحدّد موضع المركز رأسياً: 0 الأعلى و100 الأسفل.',
    en: 'Where the centre sits down the section: 0 is the top, 100 the bottom.',
  },
  'surfaces.blooms.width': {
    ar: 'يحدّد امتداد البقعة أفقياً، بالنسبة المئوية من عرض القسم.',
    en: "How far the bloom reaches across, in percent of the section's width.",
  },
  'surfaces.blooms.height': {
    ar: 'يحدّد امتداد البقعة رأسياً، بالنسبة المئوية من ارتفاع القسم.',
    en: "How far the bloom reaches down, in percent of the section's height.",
  },
  'surfaces.grain': {
    ar: 'يضيف ملمساً ناعماً فوق التدرّج، من 0 إلى 0.2، ويدخل في فحص التباين.',
    en: 'A fine texture over the gradient, from 0 to 0.2; counted in the contrast check.',
  },
};
