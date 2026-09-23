import type { AdminStrings } from '@/modules/cms/admin/strings';

type Item = keyof AdminStrings['appearance']['notFollowing']['items'];

/**
 * What keeps the shipped colours after the Appearance screen changes them (spec 010, phase
 * 1b): every file that holds a brand colour and cannot read the global, listed on the screen
 * so nothing stale goes unnamed. The keys are the string trees' own, so an item without its
 * sentence in both languages is a type error, and `tests/brand-not-following.test.ts` fails
 * when a shipped brand colour turns up in a file no item names.
 *
 * Since phase 1d the site's logo, the app icons, the browser bar and the e-mails follow; what
 * is left is an image, a file format or a page drawn before the site loads.
 */
export const NOT_FOLLOWING = {
  icons3d: ['public/images/icons-3d'],
  panelLogo: ['public/images/logo'],
  favicon: ['public/favicon.ico'],
  gonePage: ['src/lib/gone-page.ts', 'src/lib/tokens.ts'],
  shareImages: ['scripts/build-og.ts', 'src/lib/tokens.ts'],
  videoPoster: ['scripts/prepare-assets.ts', 'public/video/printer-marketing-poster.jpg'],
  seaMist: ['src/modules/brand/surfaces.ts'],
} as const satisfies Record<Item, readonly string[]>;

export type NotFollowingItem = keyof typeof NOT_FOLLOWING;

export const NOT_FOLLOWING_ITEMS = Object.keys(NOT_FOLLOWING) as NotFollowingItem[];
