'use client';

import { useCallback, useEffect, useRef } from 'react';

/** The parts of Cloudflare's client API this island uses. */
interface TurnstileApi {
  render(
    container: HTMLElement,
    options: {
      sitekey: string;
      execution: 'execute';
      appearance: 'interaction-only';
      callback: (token: string) => void;
      'error-callback': () => void;
      'expired-callback': () => void;
    },
  ): string;
  execute(widgetId: string): void;
  reset(widgetId: string): void;
  remove(widgetId: string): void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
    b7rTurnstileReady?: () => void;
  }
}

export const TURNSTILE_SCRIPT =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=b7rTurnstileReady';

let scriptPromise: Promise<TurnstileApi> | null = null;

/** Loads the explicit-render script once per page and resolves with the API. */
function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (!scriptPromise) {
    scriptPromise = new Promise<TurnstileApi>((resolve, reject) => {
      window.b7rTurnstileReady = () => {
        if (window.turnstile) resolve(window.turnstile);
        else reject(new Error('Turnstile script loaded without an API'));
      };
      const script = document.createElement('script');
      script.src = TURNSTILE_SCRIPT;
      script.async = true;
      script.addEventListener('error', () => reject(new Error('Turnstile script failed to load')));
      document.head.append(script);
    });
  }
  return scriptPromise;
}

export interface TurnstileHandle {
  /** Runs the challenge now and resolves with a fresh token (tokens expire after ~300 s). */
  getToken(): Promise<string>;
}

/**
 * Turnstile (BRD 6.9, ADR-019): renders only with a site key, executes at submit time so a
 * merchant who writes a long message never posts a stale token, resets on expiry. The
 * container stays empty (`interaction-only`) unless Cloudflare needs the visitor to interact.
 */
export function useTurnstile(siteKey: string | undefined): {
  /** Callback ref for the widget container. */
  mount: (el: HTMLDivElement | null) => void;
  getToken: () => Promise<string>;
} {
  const container = useRef<HTMLDivElement | null>(null);
  const widgetId = useRef<string | null>(null);
  const pending = useRef<{ resolve: (t: string) => void; reject: (e: Error) => void } | null>(null);

  useEffect(() => {
    if (!siteKey || !container.current) return;
    let cancelled = false;
    const el = container.current;
    loadTurnstile()
      .then((api) => {
        if (cancelled) return;
        widgetId.current = api.render(el, {
          sitekey: siteKey,
          execution: 'execute',
          appearance: 'interaction-only',
          callback: (token) => {
            pending.current?.resolve(token);
            pending.current = null;
          },
          'error-callback': () => {
            pending.current?.reject(new Error('challenge_failed'));
            pending.current = null;
          },
          'expired-callback': () => {
            if (widgetId.current) api.reset(widgetId.current);
          },
        });
      })
      .catch(() => {
        // Script blocked or offline: submit proceeds without a token and the API decides.
      });
    return () => {
      cancelled = true;
      if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current);
      widgetId.current = null;
    };
  }, [siteKey]);

  const getToken = useCallback(() => {
    const api = window.turnstile;
    const id = widgetId.current;
    if (!siteKey || !api || !id) return Promise.resolve('');
    return new Promise<string>((resolve, reject) => {
      pending.current = { resolve, reject };
      api.reset(id);
      api.execute(id);
    });
  }, [siteKey]);

  const mount = useCallback((el: HTMLDivElement | null) => {
    container.current = el;
  }, []);

  return { mount, getToken };
}
