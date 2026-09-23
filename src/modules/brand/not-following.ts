import type { AdminStrings } from '@/modules/cms/admin/strings';

type Item = keyof AdminStrings['appearance']['notFollowing']['items'];

/**
 * What keeps the shipped colours after the Appearance screen changes them (spec 010, phase
 * 1b): every file that holds a brand colour and cannot read the global, listed on the screen
 * so nothing stale goes unnamed. The keys are the string trees' own, so an item without its
 * sentence in both languages is a type error, and `tests/brand-not-following.test.ts` fails
 * when a shipped brand colour turns up in a file no item names.
 *
 * Phase 1d shortens the list (the logo, the app icons, the theme colour, the e-mails).
 */
export const NOT_FOLLOWING = {
  icons3d: ['public/images/icons-3d'],
  logo: ['public/images/logo'],
  appIcons: ['src/app/favicon.ico', 'src/app/icon.png', 'src/app/apple-icon.png', 'public/icons'],
  themeColour: ['src/lib/tokens.ts'],
  gonePage: ['src/lib/gone-page.ts'],
  shareImages: ['scripts/build-og.ts'],
  videoPoster: ['scripts/prepare-assets.ts', 'public/video/printer-marketing-poster.jpg'],
  emails: [
    'src/lib/booking-mail.ts',
    'src/lib/contact-transport.ts',
    'src/modules/cms/auth/reset-email.ts',
  ],
  seaMist: ['src/modules/brand/surfaces.ts'],
} as const satisfies Record<Item, readonly string[]>;

export type NotFollowingItem = keyof typeof NOT_FOLLOWING;

export const NOT_FOLLOWING_ITEMS = Object.keys(NOT_FOLLOWING) as NotFollowingItem[];
