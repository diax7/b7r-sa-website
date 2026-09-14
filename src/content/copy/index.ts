import { ar } from '@/content/copy/ar';
import { en } from '@/content/copy/en';
import type { Locale } from '@/lib/i18n';

/** The shape every locale's bank must match; the Arabic bank defines it. */
export type SiteCopy = typeof ar;

const BANKS: Record<Locale, SiteCopy> = { ar, en };

/** The interface copy of a locale (ADR-043): pages pass `locale`, components read from here. */
export function copyFor(locale: Locale): SiteCopy {
  return BANKS[locale];
}

/** What the shell's client islands need (header, menu, widget, consent): a small slice. */
export interface ShellCopy {
  a11y: SiteCopy['a11y'];
  socialAria: SiteCopy['footer']['socialAria'];
  whatsappWidget: SiteCopy['whatsappWidget'];
  consent: SiteCopy['consent'];
}

export function shellCopy(locale: Locale): ShellCopy {
  const c = copyFor(locale);
  return {
    a11y: c.a11y,
    socialAria: c.footer.socialAria,
    whatsappWidget: c.whatsappWidget,
    consent: c.consent,
  };
}
