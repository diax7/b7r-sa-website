import { type FieldRef, type Refusal, refusalsFor } from '@/modules/brand/appearance';
import type { Brand } from '@/modules/brand/css';
import { formatNumber } from '@/modules/cms/admin/format';
import { adminStringsFor } from '@/modules/cms/admin/strings';

/**
 * A contrast ratio as the editor reads it, `4.49:1`, in the panel's digits (design system §5).
 * Floored, never rounded: a pair at 4.496 must not read "4.5:1, needs 4.5:1" while it is
 * being refused.
 */
export function formatRatio(ratio: number, language: string): string {
  const floored = Math.floor(ratio * 100) / 100;
  return `${formatNumber(floored, language, { maximumFractionDigits: 2 })}:1`;
}

const sameField = (a: FieldRef, b: FieldRef) => a.kind === b.kind && a.key === b.key;

/**
 * The sentence for one refusal on one field (spec 010, decision 4): the pair as the site
 * shows it, the ratio it reads, the ratio it needs, and the one change on this field that
 * fixes it. A colour set by hand is also told it can go back to being computed.
 */
export function refusalSentence(refusal: Refusal, field: FieldRef, language: string): string {
  const s = adminStringsFor(language).appearance;
  const direction = refusal.fields.find((f) => sameField(f.field, field))?.direction ?? 'darker';
  const template = (field.kind === 'pin' ? s.pinRefusal : s.refusal)[direction];
  const colour = field.kind === 'pin' ? s.derivedInSentence[field.key] : s.colours[field.key];
  return template
    .replace('{pair}', s.pairs[refusal.pair])
    .replace('{got}', formatRatio(refusal.got, language))
    .replace('{wanted}', formatRatio(refusal.wanted, language))
    .replace('{colour}', colour);
}

/**
 * What a field's validator returns: `true`, or its first refusal, pointing at the contrast
 * check when there are more (the check lists every pair beside the fields).
 */
export function fieldVerdict(brand: Brand, field: FieldRef, language: string): true | string {
  const [first, ...rest] = refusalsFor(brand, field);
  if (!first) return true;
  const sentence = refusalSentence(first, field, language);
  return rest.length > 0 ? `${sentence} ${adminStringsFor(language).appearance.more}` : sentence;
}
