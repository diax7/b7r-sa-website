'use client';

import { type LucideIcon, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Icon } from '@/components/shared/icon';
import { cn } from '@/lib/cn';

type State =
  | { kind: 'idle' }
  | { kind: 'busy' }
  | { kind: 'done'; text: string }
  | { kind: 'error'; text: string };

/**
 * One admin action that POSTs JSON to an `/api/ai/*` route and says what happened beside
 * the button (design system: one primary action, the outcome in words, never a bare
 * spinner). The cookie signs the request; the route answers 403 to anyone else.
 */
export function EngineAction({
  label,
  busyLabel,
  doneLabel,
  icon,
  endpoint,
  body,
  className,
  testId,
}: {
  label: string;
  busyLabel: string;
  doneLabel: string;
  icon: LucideIcon;
  endpoint: string;
  body: Record<string, unknown>;
  className?: string;
  testId: string;
}) {
  const [state, setState] = useState<State>({ kind: 'idle' });
  async function act() {
    setState({ kind: 'busy' });
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        jobId?: number | string;
      };
      if (!res.ok) {
        setState({ kind: 'error', text: json.error ?? `The server answered ${res.status}` });
        return;
      }
      setState({ kind: 'done', text: doneLabel });
    } catch (error) {
      setState({ kind: 'error', text: error instanceof Error ? error.message : String(error) });
    }
  }
  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)} data-admin-ui="">
      <button
        type="button"
        onClick={act}
        disabled={state.kind === 'busy'}
        className="inline-flex h-10 items-center gap-2 rounded-base bg-primary px-4 text-small font-medium text-white transition-colors duration-(--duration-fast) hover:bg-primary-hover disabled:opacity-60 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent/40"
        data-admin-action={testId}
      >
        <Icon
          icon={state.kind === 'busy' ? Loader2 : icon}
          size={16}
          className={state.kind === 'busy' ? 'animate-spin' : ''}
        />
        {state.kind === 'busy' ? busyLabel : label}
      </button>
      {state.kind === 'done' && (
        <span className="text-small text-success" role="status" data-admin-action-result="done">
          {state.text}
        </span>
      )}
      {state.kind === 'error' && (
        <span className="text-small text-error" role="alert" data-admin-action-result="error">
          {state.text}
        </span>
      )}
    </div>
  );
}
