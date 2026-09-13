'use client';

import { useEffect, useRef, useState } from 'react';
import { useTurnstile } from '@/components/shared/use-turnstile';

const REFRESH_MS = 8 * 60 * 1000;

/**
 * Executes the challenge as soon as the login page mounts and posts the token to
 * `/api/turnstile/login`, which sets the ten-minute gate cookie; refreshes before it
 * expires. Interaction-only: the box stays empty unless Cloudflare needs the visitor.
 */
export function LoginTurnstileWidget({ siteKey }: { siteKey: string }) {
  const { mount, getToken } = useTurnstile(siteKey);
  const [state, setState] = useState<'pending' | 'ok' | 'failed'>('pending');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const token = await getToken();
        const res = await fetch('/api/turnstile/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
          credentials: 'same-origin',
        });
        if (cancelled) return;
        setState(res.ok ? 'ok' : 'failed');
        if (res.ok) timer.current = setTimeout(() => void run(), REFRESH_MS);
      } catch {
        if (!cancelled) setState('failed');
      }
    };
    // The widget needs a frame to render before it can execute.
    const first = setTimeout(() => void run(), 300);
    return () => {
      cancelled = true;
      clearTimeout(first);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [getToken]);

  return (
    <div data-login-turnstile={state} style={{ marginBlockEnd: 16 }}>
      <div ref={mount} />
      {state === 'failed' && (
        <p role="alert" style={{ color: 'var(--theme-error-500)', margin: 0 }}>
          تعذّر التحقق من أنك لست روبوتاً. حدّث الصفحة وحاول مرة أخرى.
        </p>
      )}
    </div>
  );
}
