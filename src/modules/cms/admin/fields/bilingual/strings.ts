/**
 * The strings of side-by-side bilingual editing (ADR-057), each in the panel's two languages:
 * `en` for the English panel, `ar` under the ux-araby rules (nominal labels, verb-first
 * instructions, the Arabic comma, no «تم», no «!»). No em dashes (.claude/rules/writing.md).
 * `pick(pair, language)` reads one by the panel's language.
 */
export interface Pair {
  en: string;
  ar: string;
}

export function pick(pair: Pair, language: string): string {
  return language === 'ar' ? pair.ar : pair.en;
}

/** The two content locales by code: the name (a noun) and the "<name> text" phrasing. */
const LANGUAGE: Record<string, { name: Pair; text: Pair }> = {
  ar: {
    name: { en: 'Arabic', ar: 'العربية' },
    text: { en: 'the Arabic text', ar: 'النص العربي' },
  },
  en: {
    name: { en: 'English', ar: 'الإنجليزية' },
    text: { en: 'the English text', ar: 'النص الإنجليزي' },
  },
};

export function languageName(code: string): Pair {
  return LANGUAGE[code]?.name ?? { en: code, ar: code };
}

export const bilingualStrings = {
  /** The other language's input while its stored text is on its way. */
  loading: (code: string): Pair => ({
    en: `Loading ${pick(languageName(code), 'en')}…`,
    ar: `تحميل ${pick(languageName(code), 'ar')}…`,
  }),
  /** The other language's input when the read failed: what happened, then the way out. */
  failed: (code: string): Pair => ({
    en: `${capital(pick(LANGUAGE[code]?.text ?? languageName(code), 'en'))} could not be loaded. Reload the page to edit it.`,
    ar: `تعذّر تحميل ${pick(LANGUAGE[code]?.text ?? languageName(code), 'ar')}. أعد تحميل الصفحة لتحريره.`,
  }),
  /**
   * The locale note (ADR-044, rewritten by ADR-057): one line before the document controls
   * of anything with per-language fields, keyed by the open content locale. The first
   * sentence names the open language; the rest says what is side by side and what stays on
   * the switch.
   */
  note: {
    ar: {
      editing: { en: 'Editing the Arabic content.', ar: 'تحرير المحتوى العربي.' },
      legend: {
        en: 'A field tagged AR has its English beside it: type the English next to the Arabic, one Save writes both. Rich text, lists and blocks stay per language: switch the locale at the top to edit their English. Fields without a tag are shared.',
        ar: 'الحقل المعلَّم AR إلى جانبه نصه الإنجليزي: اكتب الإنجليزية بجانب العربية، وحفظ واحد يكتب اللغتين. النص المنسّق والقوائم والأقسام لكل لغة على حدة: بدّل اللغة من أعلى الصفحة لتحرير الإنجليزية فيها. الحقول بلا علامة مشتركة بين اللغتين.',
      },
    },
    en: {
      editing: { en: 'Editing the English content.', ar: 'تحرير المحتوى الإنجليزي.' },
      legend: {
        en: 'A field tagged EN has its Arabic beside it: type the Arabic next to the English, one Save writes both. Rich text, lists and blocks stay per language: switch the locale at the top to edit their Arabic. Fields without a tag are shared.',
        ar: 'الحقل المعلَّم EN إلى جانبه نصه العربي: اكتب العربية بجانب الإنجليزية، وحفظ واحد يكتب اللغتين. النص المنسّق والقوائم والأقسام لكل لغة على حدة: بدّل اللغة من أعلى الصفحة لتحرير العربية فيها. الحقول بلا علامة مشتركة بين اللغتين.',
      },
    },
  } as Record<string, { editing: Pair; legend: Pair }>,
};

function capital(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
