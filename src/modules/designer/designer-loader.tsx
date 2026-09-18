'use client';

import { lazy, useCallback, useEffect, useState, type ReactNode } from 'react';
import { NearViewport } from '@/modules/core/lazy-mount';
import type { DesignerIslandProps } from '@/modules/designer/designer-island';

// `NearViewport` keeps the static designer on screen while the Konva chunk downloads.
const DesignerIsland = lazy(() =>
  import('@/modules/designer/designer-island').then((m) => ({ default: m.DesignerIsland })),
);

function readDeepLink(products: DesignerIslandProps['products']): {
  wanted: boolean;
  slug: string | null;
} {
  const hash = window.location.hash;
  if (!hash.startsWith('#designer')) return { wanted: false, slug: null };
  const product = new URLSearchParams(hash.split('?')[1] ?? '').get('product');
  return {
    wanted: true,
    slug: product && products.some((p) => p.slug === product) ? product : null,
  };
}

// A landing on a fragment jumps, as the browser's own does: the page's smooth scrolling is for
// moves within a page a person is already reading, and a smooth 1,500 px scroll at load
// would still be running when the island mounts (PR #38's CI measured the section 277 px
// short of the top at that moment).
const scrollToSection = () =>
  document.getElementById('designer')?.scrollIntoView({ block: 'start', behavior: 'instant' });

/**
 * Mounts the Konva-powered island only when the section approaches the viewport (or at once
 * for the `/#designer?product={slug}` deep link, BRD 6.4.3). The fragment is not a plain id,
 * so the loader scrolls the section into view itself: once at hydration, and once more when
 * the island has replaced the stand-in, so the section sits at the top whatever the swap did
 * to the scroll position.
 */
export function DesignerLoader(props: DesignerIslandProps & { fallback: ReactNode }) {
  const { fallback, ...islandProps } = props;
  const [deepLink, setDeepLink] = useState<{ wanted: boolean; slug: string | null }>({
    wanted: false,
    slug: null,
  });

  useEffect(() => {
    const link = readDeepLink(islandProps.products);
    if (!link.wanted) return;
    // oxlint-disable-next-line react/set-state-in-effect -- the hash exists only after hydration
    setDeepLink(link);
    scrollToSection();
  }, [islandProps.products]);

  const settle = useCallback(() => {
    if (deepLink.wanted) scrollToSection();
  }, [deepLink.wanted]);

  return (
    <NearViewport fallback={fallback} eager={deepLink.wanted} onMounted={settle}>
      <DesignerIsland {...islandProps} initialSlug={deepLink.slug ?? islandProps.initialSlug} />
    </NearViewport>
  );
}
