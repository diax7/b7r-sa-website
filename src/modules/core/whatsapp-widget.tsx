'use client';

import Image from 'next/image';
import { X } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { WhatsAppIcon } from '@/components/shared/brand-icons';
import { Icon } from '@/components/shared/icon';
import { whatsappWidgetCopy as copy } from '@/content/pages';
import { cn } from '@/lib/cn';
import { whatsappUrl } from '@/lib/utm';

const PULSE_KEY = 'b7r_wa_pulse';

// The dock lifts above the designer's sticky results bar on phones via --bottom-dock.
const dockClass =
  'fixed bottom-[calc(24px+var(--bottom-dock,0px))] right-6 z-40 flex flex-col items-end gap-3 transition-[bottom] duration-(--duration-base)'; // rtl-allow: BRD 6.15 fixes the widget at the physical bottom-right even in RTL

/**
 * Floating WhatsApp entry point (BRD 6.15). Mounted 1.5 s after load by the layout; a dot
 * pulses once 6 s after load, once per session. The button sits at the PHYSICAL bottom-right
 * in RTL too (Dhia's explicit choice) — the one sanctioned physical placement.
 */
export function WhatsAppWidget({ number }: { number: string }) {
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(false);
  const [pulse, setPulse] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const href = whatsappUrl(number, copy.prefilled);

  useEffect(() => {
    const show = window.setTimeout(() => setShown(true), 50);
    let pulsed = true;
    try {
      pulsed = window.sessionStorage.getItem(PULSE_KEY) === '1';
    } catch {
      pulsed = false;
    }
    const dot = window.setTimeout(() => {
      if (pulsed) return;
      setPulse(true);
      try {
        window.sessionStorage.setItem(PULSE_KEY, '1');
      } catch {
        // Session storage unavailable; the dot may pulse again next load.
      }
    }, 4500);
    return () => {
      window.clearTimeout(show);
      window.clearTimeout(dot);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onPointer = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!panelRef.current?.contains(t) && !buttonRef.current?.contains(t)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    panelRef.current?.querySelector<HTMLElement>('a[data-track="whatsapp_click"]')?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [open]);

  return (
    <div className={dockClass}>
      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-labelledby={titleId}
          className="w-[320px] max-w-[calc(100vw-32px)] overflow-hidden rounded-base bg-surface shadow-popover animate-rise-in motion-reduce:animate-none"
          data-testid="whatsapp-panel"
        >
          <div className="flex items-center gap-3 bg-primary px-4 py-3 text-white">
            <Image
              src="/images/logo/icon.png"
              alt=""
              width={36}
              height={36}
              className="size-9 rounded-pill bg-white p-0.5"
            />
            <div className="flex flex-col leading-tight">
              <span id={titleId} className="font-medium">
                {copy.title}
              </span>
              <span className="text-caption text-white/80">{copy.subtitle}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                buttonRef.current?.focus();
              }}
              aria-label={copy.closeAria}
              className="ms-auto grid size-9 place-items-center rounded-pill text-white/90 hover:bg-white/10"
            >
              <Icon icon={X} size={18} />
            </button>
          </div>
          <div className="bg-ground p-4">
            <p className="relative inline-block max-w-[85%] rounded-base rounded-ss-none bg-surface px-4 py-3 text-small text-text shadow-card">
              {copy.greeting}
            </p>
          </div>
          <div className="p-4">
            <a
              href={href}
              target="_blank"
              rel="noopener"
              data-track="whatsapp_click"
              data-location="widget"
              className="flex h-11 w-full items-center justify-center gap-2 rounded-base bg-whatsapp font-medium text-white transition-[filter] duration-(--duration-fast) hover:brightness-95"
            >
              <WhatsAppIcon size={18} />
              {copy.action}
            </a>
          </div>
        </div>
      )}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={copy.buttonAria}
        aria-expanded={open}
        aria-haspopup="dialog"
        data-testid="whatsapp-button"
        className={cn(
          'relative grid size-14 place-items-center rounded-pill bg-whatsapp text-white shadow-popover transition-transform duration-(--duration-base) ease-(--ease-standard) hover:scale-105',
          shown ? 'scale-100 opacity-100' : 'scale-75 opacity-0',
        )}
      >
        <WhatsAppIcon size={28} />
        {pulse && (
          <span
            aria-hidden="true"
            className="absolute top-0 end-0 size-3 rounded-pill bg-accent ring-2 ring-white animate-dot-pulse motion-reduce:animate-none"
          />
        )}
      </button>
    </div>
  );
}
