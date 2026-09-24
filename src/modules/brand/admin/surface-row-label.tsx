'use client';

import { useRowLabel } from '@payloadcms/ui';
import { useAdminStrings } from '@/modules/cms/admin/use-admin-strings';

/**
 * A library row's label (spec 010, phase 1c): the background's name and its key, so a list of
 * collapsed rows reads "Sea mist · sea-mist" rather than a number. The key is a code, kept
 * Latin inside Arabic.
 */
export function SurfaceRowLabel() {
  const s = useAdminStrings().appearance.surfaces;
  const { data, rowNumber } = useRowLabel<{ key?: unknown; label?: unknown }>();
  const name =
    typeof data?.label === 'string' && data.label
      ? data.label
      : s.untitled.replace('{n}', String((rowNumber ?? 0) + 1));
  const key = typeof data?.key === 'string' ? data.key : '';
  return (
    <span className="flex items-center gap-2" data-admin-surface-row={key}>
      <span>{name}</span>
      {key ? (
        <bdi dir="ltr" className="text-caption text-text-muted">
          {key}
        </bdi>
      ) : null}
    </span>
  );
}
