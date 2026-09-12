'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { DesignerIslandProps } from '@/modules/designer/designer-island';

const DesignerIsland = dynamic(
  () => import('@/modules/designer/designer-island').then((m) => m.DesignerIsland),
  { ssr: false },
);

/**
 * Mounts the Konva-powered island only when the section approaches the viewport (400 px
 * root margin), so the home page's initial JS stays under the BRD 7.8 budget. Until then the
 * server-rendered static shell (mockup photo + copy) is what the visitor sees.
 */
export function DesignerLoader(props: DesignerIslandProps & { fallback: ReactNode }) {
  const { fallback, ...islandProps } = props;
  const host = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  const [slug, setSlug] = useState(islandProps.initialSlug);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    // Deep link `/#designer?product={slug}` (BRD 6.4.3): preselect and scroll into view. The
    // fragment is not a plain id, so the browser does not scroll on its own.
    const hash = window.location.hash;
    if (hash.startsWith('#designer')) {
      const product = new URLSearchParams(hash.split('?')[1] ?? '').get('product');
      // oxlint-disable-next-line react/set-state-in-effect -- the hash exists only after hydration
      if (product && islandProps.products.some((p) => p.slug === product)) setSlug(product);
      setNear(true);
      document.getElementById('designer')?.scrollIntoView({ block: 'start' });
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: '400px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [islandProps.products]);

  return (
    <div ref={host}>{near ? <DesignerIsland {...islandProps} initialSlug={slug} /> : fallback}</div>
  );
}
