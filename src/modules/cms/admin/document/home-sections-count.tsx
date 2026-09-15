'use client';

import { useDocumentInfo } from '@payloadcms/ui';
import { adminStrings } from '@/modules/cms/admin/strings';

/** The home page's sections in site order; the ones with a switch are counted as on or off. */
export const HOME_SECTIONS = [
  'hero',
  'productStrip',
  'designer',
  'steps',
  'video',
  'whyUs',
  'testimonials',
  'integrations',
  'faq',
  'ribbon',
] as const;

const SWITCHED = ['steps', 'video', 'whyUs', 'testimonials', 'integrations', 'faq'] as const;

/**
 * "10 sections, N on" in the home page's header (ADR-046). The header renders outside
 * Payload's form (the document header, above the controls), so it reads the saved document
 * from the document context, not the live switches: the number follows a save or a publish.
 */
export function HomeSectionsCount() {
  const { savedDocumentData, initialData } = useDocumentInfo();
  const doc = (savedDocumentData ?? initialData ?? {}) as Record<
    string,
    { enabled?: boolean } | undefined
  >;
  const on = SWITCHED.filter((key) => doc[key]?.enabled !== false).length;
  const total = HOME_SECTIONS.length;
  const enabled = total - SWITCHED.length + on;
  return (
    <span data-admin-sections-on={enabled}>
      {' '}
      · {adminStrings.entityHeader.sectionsOn(total, enabled)}
    </span>
  );
}
