import { getTranslation } from '@payloadcms/translations';
import type { DefaultServerCellComponentProps, StaticLabel } from 'payload';
import { Badge } from '@/components/shared/badge';
import { adminStringsFor } from '@/modules/cms/admin/strings';

type Tone = 'accent' | 'success' | 'warning' | 'error' | 'muted';

/**
 * The colour of a status word (design system §2, ADR-060): green is live or done, amber is
 * a draft, a change waiting or a reply pending, red is failed, blue is a message nobody has
 * opened (ADR-061: the one that asks for a person; the accent on its tint, lifted for the
 * word, the panel's blue for text on dark, never `text-primary`); every other state is
 * neutral. A colour never
 * appears without its word, and never elsewhere than this pill and the `BoolCell` badge.
 */
export const STATUS_TONES: Record<string, Tone> = {
  published: 'success',
  draft: 'warning',
  changed: 'warning',
  failed: 'error',
  new: 'accent',
  following: 'warning',
  handled: 'success',
};

export const statusTone = (value: string): Tone => STATUS_TONES[value] ?? 'muted';

type Option = string | { value: string; label?: StaticLabel | string };

/**
 * A status in a list as a pill with its word: the document's `_status` (Published, Draft,
 * or Changed when Payload's list marks a draft over a published version) with the words of
 * the strings tree (the glossary's), and any other status select (a run's outcome) with
 * its option's label; the tone by `STATUS_TONES`. An unset value reads "Not yet".
 */
export function StatusCell({ cellData, field, i18n }: DefaultServerCellComponentProps) {
  const s = adminStringsFor(i18n.language).cells;
  const value = typeof cellData === 'string' ? cellData : '';
  if (!value) return <Badge tone="muted">{s.notYet}</Badge>;
  const name = 'name' in field ? String(field.name) : '';
  const word =
    name === '_status' ? s.status[value as keyof typeof s.status] : optionWord(field, value, i18n);
  return (
    <Badge tone={statusTone(value)} data-admin-status={value}>
      {word ?? value}
    </Badge>
  );
}

function optionWord(
  field: DefaultServerCellComponentProps['field'],
  value: string,
  i18n: DefaultServerCellComponentProps['i18n'],
): string | undefined {
  const options = ('options' in field ? field.options : []) as Option[];
  const option = options.find((o) => (typeof o === 'string' ? o : o.value) === value);
  if (!option || typeof option === 'string' || !option.label) return undefined;
  return getTranslation(option.label, i18n);
}
