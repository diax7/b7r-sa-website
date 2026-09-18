import { isArabic } from '@/modules/cms/admin/strings';

/** A sentence in both languages of the panel (a type alias, so it satisfies Payload's `Record<string, string>` labels). */
export type Bilingual = { ar: string; en: string };

/** What a validate function or a hook receives: the request, with the panel's language on it. */
export type LanguageSource = { i18n?: { language?: string } } | undefined;

/**
 * The version of a validation message the editor reads (admin audit 2026-09-18, 2.6): the
 * panel's UI language on the request (`req.i18n.language`, the account's choice, ADR-056),
 * never the content locale being edited.
 */
export function inLanguage(req: LanguageSource, message: Bilingual): string {
  return isArabic(req?.i18n?.language) ? message.ar : message.en;
}
