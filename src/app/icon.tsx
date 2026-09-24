import { notFound } from 'next/navigation';
import { APP_ICON_SIZES, appIconSize, getAppearance, paintedColours } from '@/modules/brand';
import { appIcon } from '@/modules/core/app-icon';

/** Redrawn on an Appearance save (`APP_ICON_ROUTES`), and at most once a minute besides. */
export const revalidate = 60;

/** The browser tab's icon and the manifest's two (spec 010, phase 1d). */
export function generateImageMetadata() {
  return APP_ICON_SIZES.map((size) => ({
    id: String(size),
    size: { width: size, height: size },
    contentType: 'image/png',
  }));
}

export default async function Icon({ id }: { id: Promise<string> }) {
  const size = appIconSize(await id);
  if (!size) notFound();
  const colour = paintedColours(await getAppearance());
  return appIcon({ size, fill: { accent: colour('accent'), primaryDark: colour('primary-dark') } });
}
