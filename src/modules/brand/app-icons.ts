/**
 * The app icons Next draws from the mark in the brand's colours (spec 010, phase 1d): the
 * browser tab's and the manifest's by width (`src/app/icon.tsx`), and the one a phone keeps
 * on its home screen (`src/app/apple-icon.tsx`).
 */
export const MANIFEST_ICON_SIZES = [192, 512] as const;

export const APP_ICON_SIZES = [32, ...MANIFEST_ICON_SIZES] as const;

export type AppIconSize = (typeof APP_ICON_SIZES)[number];

export const APPLE_ICON_SIZE = 180;

/** Their routes, which an Appearance save regenerates. */
export const APP_ICON_ROUTES = [...APP_ICON_SIZES.map((size) => `/icon/${size}`), '/apple-icon'];

/** The size an icon route was asked for, or `null` for any other: no size is drawn on demand. */
export function appIconSize(id: string): AppIconSize | null {
  return APP_ICON_SIZES.find((size) => String(size) === id) ?? null;
}
