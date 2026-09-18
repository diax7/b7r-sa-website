'use client';

import { useLocale } from '@payloadcms/ui';
import { Languages } from 'lucide-react';
import { Icon } from '@/components/shared/icon';
import { adminStrings } from '@/modules/cms/admin/strings';

const s = adminStrings.locale;

/**
 * A compact pill in the document controls of a document with per-language fields (ADR-044):
 * which language is open and what the AR/EN pill on a field label means. One line that never
 * wraps: on a desktop it sits before the Preview and Publish buttons and shrinks with an
 * ellipsis before anything else does; on a phone `admin.css` moves it to its own line under
 * the buttons, so it never covers the status line or the Publish button. The full sentence
 * stays in `title`. The pill on a field label itself is `admin.css` on Payload's localized
 * label suffix.
 */
export function LocaleNote() {
  const { code } = useLocale();
  const editing = s.editing[code] ?? s.editing['ar'];
  const legend = s.legend[code] ?? s.legend['ar'];
  return (
    <p
      className="inline-flex min-w-0 shrink items-center gap-2 rounded-pill border border-border bg-surface px-3 py-1 text-caption whitespace-nowrap text-text-muted"
      data-admin-ui=""
      data-admin-locale-note={code}
      title={`${editing} ${legend}`}
    >
      <Icon icon={Languages} size={14} className="shrink-0" />
      <span className="min-w-0 truncate">
        <span className="font-medium text-text">{editing}</span> {legend}
      </span>
    </p>
  );
}
