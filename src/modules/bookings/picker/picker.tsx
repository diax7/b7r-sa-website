'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';
import type { Locale } from '@/lib/i18n';
import { riyadhDayLabel, riyadhTimeLabel } from '@/lib/riyadh';
import {
  firstOpenDay,
  type PickerSettings,
  stripMonths,
  type StripMonth,
} from '@/modules/bookings/picker/days';
import type { PickerCopy } from '@/modules/bookings/picker/validate';

export interface PickerProps {
  locale: Locale;
  copy: PickerCopy;
  settings: PickerSettings;
  /** The start the person picked; the host owns it, so it can clear it on a refusal. */
  chosen: Date | null;
  onChoose(start: Date | null): void;
  /** Bumped by the host when a slot was refused: the day's list is read again. */
  refresh?: number;
  idPrefix: string;
}

type Loaded = { kind: 'error' } | { kind: 'ready'; starts: Date[] };
type Slots = { kind: 'loading' } | Loaded;

async function fetchSlots(day: string, locale: Locale): Promise<Loaded> {
  try {
    const res = await fetch(`/api/bookings/slots?date=${day}&locale=${locale}`, {
      headers: { accept: 'application/json' },
    });
    if (!res.ok) return { kind: 'error' };
    const body = (await res.json()) as { ok: boolean; slots?: string[] };
    if (!body.ok || !body.slots) return { kind: 'error' };
    return { kind: 'ready', starts: body.slots.map((s) => new Date(s)) };
  } catch {
    return { kind: 'error' };
  }
}

/** The strip of days: a row per month, a chip per day, the closed ones greyed with their reason. */
function DayStrip({
  months,
  selected,
  onSelect,
  copy,
  idPrefix,
}: {
  months: StripMonth[];
  selected: string | null;
  onSelect(day: string): void;
  copy: PickerCopy;
  idPrefix: string;
}) {
  return (
    <div className="flex flex-col gap-3" data-booking-strip="">
      <p id={`${idPrefix}-days`} className="text-small font-medium text-text">
        {copy.booking.pickDay}
      </p>
      <div
        className="flex gap-4 overflow-x-auto pb-2"
        role="group"
        aria-labelledby={`${idPrefix}-days`}
      >
        {months.map((month) => (
          <div key={month.label} className="flex shrink-0 flex-col gap-2">
            <p className="text-caption text-text-muted">{month.label}</p>
            <ul className="flex gap-2">
              {month.days.map((day) => (
                <li key={day.key}>
                  <button
                    type="button"
                    disabled={day.closed}
                    aria-pressed={selected === day.key}
                    title={
                      day.reason ? copy.booking.closed.replace('{reason}', day.reason) : undefined
                    }
                    onClick={() => onSelect(day.key)}
                    data-booking-day={day.key}
                    className={cn(
                      'flex h-16 w-14 flex-col items-center justify-center rounded-base border text-text transition-colors duration-(--duration-fast)',
                      'disabled:cursor-not-allowed disabled:border-border/60 disabled:text-text-muted/60',
                      'focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent/40',
                      selected === day.key
                        ? 'border-primary bg-primary text-white'
                        : 'border-border bg-surface hover:border-primary',
                    )}
                  >
                    <span className="text-caption">{day.weekday}</span>
                    <span className="text-body font-semibold tabular-nums">{day.day}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * The picker (ADR-062, design system §3.10): the strip of days on the Riyadh clock, then the
 * day's free starts from the API, Western digits in both languages; the chosen start is
 * announced to the host, which shows the form (a booking) or posts the move (the manage
 * page). States: loading, no free time that day, an error line.
 */
export function Picker({
  locale,
  copy,
  settings,
  chosen,
  onChoose,
  refresh = 0,
  idPrefix,
}: PickerProps) {
  const [months] = useState(() => stripMonths(settings, copy.dateLocale, new Date()));
  const [day, setDay] = useState<string | null>(() => firstOpenDay(months));
  // The answer for a day and a refresh count; anything else on screen is "loading".
  const [loaded, setLoaded] = useState<{ day: string; refresh: number; result: Loaded } | null>(
    null,
  );

  useEffect(() => {
    if (!day) return;
    let stale = false;
    void fetchSlots(day, locale).then((result) => {
      if (!stale) setLoaded({ day, refresh, result });
    });
    return () => {
      stale = true;
    };
  }, [day, locale, refresh]);

  const slots: Slots =
    loaded && loaded.day === day && loaded.refresh === refresh
      ? loaded.result
      : { kind: 'loading' };

  const select = (key: string) => {
    setDay(key);
    onChoose(null);
  };

  const times = slots.kind === 'ready' ? slots.starts : [];
  return (
    <div className="flex flex-col gap-6" data-booking-picker="">
      <DayStrip months={months} selected={day} onSelect={select} copy={copy} idPrefix={idPrefix} />
      <div className="flex flex-col gap-3" data-booking-slots={slots.kind}>
        <p
          id={`${idPrefix}-times`}
          className="flex flex-wrap items-baseline gap-x-2 text-small font-medium text-text"
        >
          {copy.booking.pickTime}
          <span className="text-caption font-normal text-text-muted">
            {copy.booking.duration.replace('{minutes}', String(settings.durationMinutes))} ·{' '}
            {copy.booking.riyadhTime}
          </span>
        </p>
        <div aria-live="polite" className="min-h-11">
          {slots.kind === 'loading' && (
            <p className="text-small text-text-muted">{copy.booking.loadingSlots}</p>
          )}
          {slots.kind === 'error' && (
            <p className="text-small text-error">{copy.booking.failure}</p>
          )}
          {slots.kind === 'ready' && times.length === 0 && (
            <p className="text-small text-text-muted">{copy.booking.noSlots}</p>
          )}
          {slots.kind === 'ready' && times.length > 0 && (
            <ul className="flex flex-wrap gap-2" aria-labelledby={`${idPrefix}-times`}>
              {times.map((start) => {
                const active = chosen?.getTime() === start.getTime();
                return (
                  <li key={start.toISOString()}>
                    <button
                      type="button"
                      aria-pressed={active}
                      onClick={() => onChoose(active ? null : start)}
                      data-booking-slot={start.toISOString()}
                      className={cn(
                        'h-11 rounded-pill border px-4 text-body tabular-nums transition-colors duration-(--duration-fast)',
                        'focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent/40',
                        active
                          ? 'border-primary bg-primary text-white'
                          : 'border-border bg-surface text-text hover:border-primary',
                      )}
                    >
                      <bdi dir="ltr">{riyadhTimeLabel(start, copy.dateLocale)}</bdi>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
      {chosen && day && (
        <p className="text-body text-text" data-booking-chosen="">
          {copy.booking.chosen
            .replace('{day}', riyadhDayLabel(chosen, copy.dateLocale))
            .replace('{time}', riyadhTimeLabel(chosen, copy.dateLocale))}
        </p>
      )}
    </div>
  );
}
