'use client';

import { useConfig, useDocumentInfo, useLocale } from '@payloadcms/ui';
import {
  type OtherLocaleState,
  useOtherLocale,
} from '@/modules/cms/admin/fields/bilingual/other-locale';

export interface LocaleInfo {
  code: string;
  rtl?: boolean | undefined;
}

/** The locale that is not open; null with one locale or more than two (nothing to pair). */
export function otherOf(
  localization: { locales: LocaleInfo[] } | false | undefined,
  current: string,
): LocaleInfo | null {
  if (!localization) return null;
  const others = localization.locales.filter((l) => l.code !== current);
  return others.length === 1 ? (others[0] ?? null) : null;
}

/**
 * The open document in its other language, as every widget that shows both reads it
 * (ADR-057): the locale that is not open and the shared store's state for it, one REST read
 * per document view however many fields share it, read again after each save. The bilingual
 * inputs prefill from it; a read-only fact (the post's warnings and reading time) shows its
 * English from it under the Arabic.
 */
export function useOtherLanguage(): { other: LocaleInfo | null; stored: OtherLocaleState } {
  const locale = useLocale();
  const { config } = useConfig();
  const info = useDocumentInfo();
  const other = otherOf(config.localization, locale.code);
  const stored = useOtherLocale({
    apiRoute: config.routes.api,
    collection: info.collectionSlug,
    global: info.globalSlug,
    id: info.id,
    locale: other?.code ?? locale.code,
    lastUpdateTime: info.lastUpdateTime,
  });
  return { other, stored };
}
