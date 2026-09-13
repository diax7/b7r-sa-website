'use client';

import { useEffect } from 'react';
import { useReducedMotion } from '@/lib/reduced-motion';
import { activeStep, scrollProgress } from '@/modules/home/steps/progress';

/**
 * Maps scroll position through the pinned steps section to the active step (BRD 6.4.4).
 * A scroll listener exists only while the section intersects the viewport and only in the
 * pinned layout (`lg`, JS on, no reduced motion); the rect is read every frame, never cached.
 */
export function StepsProgress() {
  const reduced = useReducedMotion();

  useEffect(() => {
    const section = document.getElementById('steps');
    if (!section || reduced) return;
    const pinned = window.matchMedia('(min-width: 1024px)');
    let raf = 0;
    let listening = false;

    const update = () => {
      raf = 0;
      const rect = section.getBoundingClientRect();
      const progress = scrollProgress(rect.top, rect.height, window.innerHeight);
      const active = activeStep(progress);
      if (section.dataset['active'] !== String(active)) {
        section.dataset['active'] = String(active);
        section.querySelectorAll<HTMLElement>('.steps-item').forEach((item, i) => {
          if (i === active) item.setAttribute('aria-current', 'step');
          else item.removeAttribute('aria-current');
        });
      }
      section.style.setProperty('--progress', progress.toFixed(3));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    const start = () => {
      if (listening || !pinned.matches) return;
      listening = true;
      window.addEventListener('scroll', onScroll, { passive: true });
      update();
    };
    const stop = () => {
      if (!listening) return;
      listening = false;
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };

    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) start();
      else stop();
    });
    io.observe(section);
    const onLayoutChange = () => (pinned.matches ? start() : stop());
    pinned.addEventListener('change', onLayoutChange);
    return () => {
      io.disconnect();
      pinned.removeEventListener('change', onLayoutChange);
      stop();
    };
  }, [reduced]);

  return null;
}
