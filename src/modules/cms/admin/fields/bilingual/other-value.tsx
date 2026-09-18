'use client';

import type { ReactNode } from 'react';
import { LocaleTag } from '@/modules/cms/admin/fields/bilingual/locale-tag';
import type { OtherLocaleState } from '@/modules/cms/admin/fields/bilingual/other-locale';
import type { LocaleInfo } from '@/modules/cms/admin/fields/bilingual/use-other-language';
import { useAdminStrings } from '@/modules/cms/admin/use-admin-strings';

/**
 * The other language of a read-only fact, under its own pill (ADR-057): the value once the
 * shared read has landed, the loading line while it is on its way, the failure line when it
 * did not. A read-only fact with two languages shows both, like every other localized
 * field; nothing here is edited.
 */
export function OtherValue({
  other,
  stored,
  hook,
  children,
}: {
  other: LocaleInfo;
  stored: OtherLocaleState;
  /** The field's name, carried on the block as `data-admin-other` for the e2e. */
  hook: string;
  /** The value rendered from `stored.doc`; only used once the read is ready. */
  children: (doc: Record<string, unknown>) => ReactNode;
}) {
  const strings = useAdminStrings().bilingual;
  const language = strings.languages[other.code] ?? other.code;
  return (
    <div className="flex items-start gap-2" data-admin-other={hook} data-admin-locale={other.code}>
      <LocaleTag code={other.code} />
      {stored.status === 'ready' ? (
        children(stored.doc)
      ) : (
        <span className="text-small text-text-muted">
          {(stored.status === 'loading' ? strings.loading : strings.unavailable).replace(
            '{language}',
            language,
          )}
        </span>
      )}
    </div>
  );
}
