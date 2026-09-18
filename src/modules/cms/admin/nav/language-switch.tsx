'use client';

import { useTranslation } from '@payloadcms/ui';
import { cn } from '@/lib/cn';
import { useAdminLanguage, useAdminStrings } from '@/modules/cms/admin/use-admin-strings';

const LANGUAGES = ['en', 'ar'] as const;

/**
 * The panel's language at the foot of the drawer (ADR-058): the same switch the account
 * view offers, one tap away on a phone. It is Payload's `switchLanguage` (the `payload-lng`
 * cookie, then a refresh), so it changes the UI language only, never the content locale
 * (ADR-056). Rendered always; the stylesheet shows it in the drawer alone.
 */
export function LanguageSwitch() {
  const s = useAdminStrings().nav;
  const { language } = useAdminLanguage();
  const { switchLanguage } = useTranslation();
  return (
    <div
      role="group"
      aria-label={s.language}
      className="hidden gap-1 rounded-inner bg-ground p-1"
      data-admin-language=""
      data-admin-drawer-only=""
    >
      {LANGUAGES.map((code) => (
        <button
          key={code}
          type="button"
          lang={code}
          aria-pressed={language === code}
          onClick={() => void switchLanguage?.(code)}
          className={cn(
            'flex h-[36px] flex-1 items-center justify-center rounded-inner text-small transition-colors duration-(--duration-fast) focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent/40',
            language === code
              ? 'bg-surface-2 font-medium text-text'
              : 'text-text-muted hover:text-text',
          )}
        >
          {s.languages[code]}
        </button>
      ))}
    </div>
  );
}
