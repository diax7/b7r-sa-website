'use client';

import type { AcceptedLanguages } from '@payloadcms/translations';
import { useTranslation, useWindowInfo } from '@payloadcms/ui';
import { Languages } from 'lucide-react';
import { useTransition } from 'react';
import { Icon } from '@/components/shared/icon';
import { cn } from '@/lib/cn';
import { control, IconTooltip } from '@/modules/cms/admin/header/control';
import { useAdminLanguage, useAdminStrings } from '@/modules/cms/admin/use-admin-strings';

const option =
  'flex items-center justify-center rounded-inner text-small transition-colors duration-(--duration-fast) focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent/40 disabled:cursor-wait';

/**
 * The panel's language: one control, two placements (ADR-056, amended 2026-09-19; ADR-058).
 * `header` sits at the trailing end of the header's actions (top right in English, top left
 * in Arabic): the two names above 1024 px, one labelled icon that toggles to the other
 * language at and under it, with a tooltip like its neighbours. `drawer` is the two names
 * at the foot of the phone drawer, shown by the stylesheet in the drawer alone.
 *
 * Both go through Payload's own `switchLanguage` (`useTranslation`): its server action
 * writes the `payload-lng` cookie for a year on `/`, then `router.refresh()` re-renders the
 * root layout, which reads the cookie for `<html lang dir>`; no cookie of ours. The names
 * are Payload's `languageOptions` (each language's own `general.thisLanguage`: «العربية»,
 * "English"), never translated. The control is disabled while the switch is pending. It
 * changes the UI language only, never the content locale (ADR-057).
 */
export function LanguageSwitch({ placement }: { placement: 'header' | 'drawer' }) {
  const s = useAdminStrings().nav;
  const { language } = useAdminLanguage();
  const { languageOptions, switchLanguage } = useTranslation();
  const [pending, startTransition] = useTransition();
  // Payload's `m` (1024 px): at or under it the header shows the icon alone (undefined,
  // before the first measurement, counts as the icon; the tooltip is harmless beside text).
  const iconsOnly = useWindowInfo().breakpoints['m'] !== false;
  const inHeader = placement === 'header';
  const options = languageOptions ?? [];
  const other = options.find((o) => o.value !== language);
  const choose = (code: AcceptedLanguages) => {
    if (code === language) return;
    startTransition(async () => {
      await switchLanguage?.(code);
    });
  };
  return (
    <>
      <div
        role="group"
        aria-label={s.language}
        aria-busy={pending || undefined}
        className={cn(
          'hidden items-center gap-1 rounded-inner p-1',
          inHeader ? 'h-9 border border-border bg-surface min-[1025px]:flex' : 'bg-ground',
        )}
        data-admin-language=""
        data-admin-drawer-only={inHeader ? undefined : ''}
      >
        {options.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            lang={value}
            aria-pressed={language === value}
            disabled={pending}
            onClick={() => choose(value)}
            className={cn(
              option,
              inHeader ? 'h-full px-2.5' : 'h-[36px] flex-1',
              language === value
                ? 'bg-surface-2 font-medium text-text'
                : 'text-text-muted hover:text-text',
            )}
          >
            {label}
          </button>
        ))}
      </div>
      {inHeader && other && (
        <IconTooltip label={s.switchLanguage} when={iconsOnly}>
          <button
            type="button"
            aria-label={s.switchLanguage}
            disabled={pending}
            onClick={() => choose(other.value)}
            className={cn(
              control,
              'w-9 justify-center px-0 disabled:cursor-wait min-[1025px]:hidden',
            )}
            data-admin-language-toggle=""
          >
            <Icon icon={Languages} size={16} className="shrink-0" />
          </button>
        </IconTooltip>
      )}
    </>
  );
}
