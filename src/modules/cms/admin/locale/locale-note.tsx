'use client';

import { useLocale } from '@payloadcms/ui';
import { Languages } from 'lucide-react';
import { Icon } from '@/components/shared/icon';
import { adminStrings } from '@/modules/cms/admin/strings';

const s = adminStrings.locale;

/**
 * One line before the document controls of a document with per-language fields (ADR-044):
 * which language is open and what the AR/EN pill on a field label means. The pill itself is
 * `admin.css` on Payload's localized label suffix.
 */
export function LocaleNote() {
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
