'use client';

import { useTranslation } from '@payloadcms/ui';
import { adminDirection, type AdminStrings, adminStringsFor } from '@/modules/cms/admin/strings';

/**
 * The UI language of this render, from Payload's translation context (the language it
 * resolved for the request: the `payload-lng` cookie, else the browser's, else English), and
 * the direction it gives the document. A client component reads these per render; a server
 * component has `i18n.language` in its props and calls `adminStringsFor` itself.
 */
export function useAdminLanguage(): { language: string; direction: 'ltr' | 'rtl' } {
  const { i18n } = useTranslation();
  return { language: i18n.language, direction: adminDirection(i18n.language) };
}

/** Our strings in the UI language of this render (ADR-056). */
export function useAdminStrings(): AdminStrings {
  return adminStringsFor(useAdminLanguage().language);
}
