import { APPLE_ICON_SIZE, getAppearance, paintedColours } from '@/modules/brand';
import { appIcon } from '@/modules/core/app-icon';

/** Redrawn on an Appearance save (`APP_ICON_ROUTES`), and at most once a minute besides. */
export const revalidate = 60;

export const size = { width: APPLE_ICON_SIZE, height: APPLE_ICON_SIZE };
export const contentType = 'image/png';

/** The icon a phone keeps on its home screen: the mark on the page's white (spec 010). */
export default async function AppleIcon() {
  const colour = paintedColours(await getAppearance());
  return appIcon({
    size: APPLE_ICON_SIZE,
    fill: { accent: colour('accent'), primaryDark: colour('primary-dark') },
    background: colour('surface'),
  });
}
