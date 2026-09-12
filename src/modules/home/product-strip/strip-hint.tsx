'use client';

import { ChevronLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Icon } from '@/components/shared/icon';

const KEY = 'b7r_strip_hint';

/**
 * «اسحب» hint on the mobile strip (BRD 6.4.2): shown on the first visit only, dismissed on
 * the first scroll of the strip. Desktop never shows it (the strip does not scroll there).
 */
export function StripHint({ label }: { label: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let seen = false;
    try {
      seen = window.localStorage.getItem(KEY) === '1';
    } catch {
      seen = false;
    }
    if (seen || !window.matchMedia('(max-width: 1023px)').matches) return;
    // oxlint-disable-next-line react/set-state-in-effect -- server-rendered hidden; storage and viewport exist only after mount
    setVisible(true);
    const strip = document.querySelector<HTMLElement>('.strip');
    const dismiss = () => {
      setVisible(false);
      try {
        window.localStorage.setItem(KEY, '1');
      } catch {
        // Storage may be unavailable (private mode); the hint simply shows again next time.
      }
    };
    strip?.addEventListener('scroll', dismiss, { once: true, passive: true });
    return () => strip?.removeEventListener('scroll', dismiss);
  }, []);

  if (!visible) return null;
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-y-0 end-0 flex items-center pe-3 lg:hidden"
    >
      <span className="inline-flex items-center gap-1 rounded-pill bg-navy/80 px-3 py-1.5 text-caption font-medium text-white shadow-popover backdrop-blur-sm">
        {label}
        <Icon icon={ChevronLeft} size={14} mirror={false} />
      </span>
    </div>
  );
}
