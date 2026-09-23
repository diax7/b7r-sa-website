/* eslint-disable @next/next/no-img-element -- the icon is drawn by ImageResponse, not the browser */
import { ImageResponse } from 'next/og';
import { MARK } from '@/modules/core/logo-paths';

type MarkLayer = keyof typeof MARK.paths;

/** The square mark as a standalone SVG image, each layer in the colour given. */
function markImage(fill: Record<MarkLayer, string>): string {
  const paths = (Object.entries(MARK.paths) as Array<[MarkLayer, string]>)
    .map(([layer, d]) => `<path d="${d}" fill-rule="evenodd" fill="${fill[layer]}"/>`)
    .join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${MARK.width} ${MARK.height}">${paths}</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

/**
 * An app icon (spec 010, phase 1d): the mark in the brand's colours, as a PNG of `size`
 * pixels, on the background given (the Apple icon's, which a phone would otherwise fill with
 * black) or on none.
 */
export function appIcon({
  size,
  fill,
  background,
}: {
  size: number;
  fill: Record<MarkLayer, string>;
  background?: string;
}): ImageResponse {
  return new ImageResponse(
    // Satori fails on a style key that is present but undefined, so no background is no key.
    <div
      style={{ display: 'flex', width: '100%', height: '100%', ...(background && { background }) }}
    >
      <img src={markImage(fill)} width={size} height={size} alt="" />
    </div>,
    { width: size, height: size },
  );
}
