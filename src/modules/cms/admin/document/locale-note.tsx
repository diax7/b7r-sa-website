'use client';

import { useLocale } from '@payloadcms/ui';
import { Languages } from 'lucide-react';
import { Icon } from '@/components/shared/icon';
import { useAdminStrings } from '@/modules/cms/admin/use-admin-strings';

/**
 * One line before the document controls of a document with per-language fields (ADR-044,
 * rewritten by ADR-057): which language is open, that a tagged text field has the other
 * language beside it and one Save writes both, and that rich text, lists and blocks stay on
 * the locale switch. The tag itself is `admin.css` on Payload's localized label suffix. Two
 * axes meet here (ADR-056): `code` is the CONTENT locale (which language of the document is
 * open) and picks the sentence; the strings tree is the UI language and decides what
 * language the sentence is written in.
 */
export function LocaleNote() {
  const s = useAdminStrings().locale;
  const { code } = useLocale();
  const editing = s.editing[code] ?? s.editing['ar'];
  const legend = s.legend[code] ?? s.legend['ar'];
  return (
    <p
      className="flex items-center gap-2 text-caption text-text-muted"
      data-admin-ui=""
      data-admin-locale-note={code}
    >
      <Icon icon={Languages} size={14} className="shrink-0" />
      <span>
        <span className="font-medium text-text">{editing}</span> {legend}
      </span>
    </p>
  );
}
