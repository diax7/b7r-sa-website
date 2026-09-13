'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState, type ReactNode } from 'react';
import { NearViewport } from '@/modules/core';
import type { DesignerIslandProps } from '@/modules/designer/designer-island';

const DesignerIsland = dynamic(
  () => import('@/modules/designer/designer-island').then((m) => m.DesignerIsland),
  { ssr: false },
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

/**
 * Mounts the Konva-powered island only when the section approaches the viewport (or at once
 * for the `/#designer?product={slug}` deep link, BRD 6.4.3). The fragment is not a plain id,
 * so the loader scrolls the section into view itself.
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
    document.getElementById('designer')?.scrollIntoView({ block: 'start' });
  }, [islandProps.products]);

  return (
    <NearViewport fallback={fallback} eager={deepLink.wanted}>
      <DesignerIsland {...islandProps} initialSlug={deepLink.slug ?? islandProps.initialSlug} />
    </NearViewport>
  );
}
