'use client';

import { useLocale, useTranslation } from '@payloadcms/ui';
import { Languages } from 'lucide-react';
import { Icon } from '@/components/shared/icon';
import { bilingualStrings, pick } from '@/modules/cms/admin/fields/bilingual/strings';

/**
 * One line before the document controls of a document with per-language fields (ADR-044,
 * rewritten by ADR-057): which language is open, that a tagged text field has the other
 * language beside it and one Save writes both, and that rich text, lists and blocks stay on
 * the locale switch. The tag itself is `admin.css` on Payload's localized label suffix.
 */
export function LocaleNote() {
  const { code } = useLocale();
  const { i18n } = useTranslation();
  const note = bilingualStrings.note[code] ?? bilingualStrings.note['ar']!;
  return (
    <p
      className="flex items-center gap-2 text-caption text-text-muted"
      data-admin-ui=""
      data-admin-locale-note={code}
    >
      <Icon icon={Languages} size={14} className="shrink-0" />
      <span>
        <span className="font-medium text-text">{pick(note.editing, i18n.language)}</span>{' '}
        {pick(note.legend, i18n.language)}
      </span>
    </p>
  );
}
