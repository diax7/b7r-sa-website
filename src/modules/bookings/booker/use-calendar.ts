'use client';

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import type { Locale } from '@/lib/i18n';
import { riyadh } from '@/lib/riyadh';
import { firstOpen, monthBoundsOf, shiftMonth } from '@/modules/bookings/booker/month';
import { landedOutside, reduceSplit, SPLIT_IDLE } from '@/modules/bookings/booker/split';
import { skeletonRows, type SlotsView } from '@/modules/bookings/booker/times-pane';

type DaysLoaded = Record<string, number> | 'error';
type SlotsLoaded = { kind: 'error' } | { kind: 'ready'; starts: Date[] };

/** A read after a refusal carries the count, so the browser's minute-long cache is not what answers. */
const bust = (refresh: number) => (refresh > 0 ? `&refresh=${refresh}` : '');

async function fetchDays(month: string, locale: Locale, refresh: number): Promise<DaysLoaded> {
  try {
    const res = await fetch(`/api/bookings/days?month=${month}&locale=${locale}${bust(refresh)}`, {
      headers: { accept: 'application/json' },
    });
    if (!res.ok) return 'error';
    const body = (await res.json()) as { ok: boolean; days?: Record<string, number> };
    return body.ok && body.days ? body.days : 'error';
  } catch {
    return 'error';
  }
}

async function fetchSlots(day: string, locale: Locale, refresh: number): Promise<SlotsLoaded> {
  try {
    const res = await fetch(`/api/bookings/slots?date=${day}&locale=${locale}${bust(refresh)}`, {
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

export interface UseCalendarOptions {
  locale: Locale;
  horizonDays: number;
  /** Select the first open day once the month's counts arrive (the page; never the contact card). */
  autoSelect: boolean;
}

/**
 * The calendar's state, shared by the booking and the manage islands (ADR-063): the month
 * on show and its counts from the days route (each month read once), the selected day and
 * its free starts from the slots route (read again after a refusal), the split confirm and
 * its pointer rule. The page opens on today's month and, with `autoSelect`, on its first
 * open day (the next month's when this one has none), so the times column is never empty
 * on arrival.
 */
export function useCalendar({ locale, horizonDays, autoSelect }: UseCalendarOptions) {
  const [now] = useState(() => new Date());
  const today = riyadh(now).dateKey;
  const bounds = useMemo(() => monthBoundsOf(horizonDays, now), [horizonDays, now]);
  const [month, setMonth] = useState(bounds.first);
  const [daysByMonth, setDaysByMonth] = useState<Record<string, DaysLoaded>>({});
  const [day, setDay] = useState<string | null>(null);
  const [picked, setPicked] = useState(0);
  const [refresh, setRefresh] = useState(0);
  const [slotsByKey, setSlotsByKey] = useState<Record<string, SlotsLoaded>>({});
  const [split, dispatch] = useReducer(reduceSplit, SPLIT_IDLE);
  // The day whose rows have staggered in: a re-render of the same day (the return from the
  // form step, the read after a refusal) draws them standing, so nothing blinks.
  const [staggeredDay, setStaggeredDay] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const loaded = daysByMonth[month];
  useEffect(() => {
    if (loaded) return;
    let stale = false;
    void fetchDays(month, locale, refresh).then((result) => {
      if (!stale) setDaysByMonth((d) => ({ ...d, [month]: result }));
    });
    return () => {
      stale = true;
    };
  }, [month, locale, loaded, refresh]);

  useEffect(() => {
    if (!autoSelect || day || !loaded || loaded === 'error') return;
    const first = firstOpen(loaded);
    if (first) {
      // oxlint-disable-next-line react/set-state-in-effect -- the first open day is only known once the month's counts arrive
      setDay(first);
      return;
    }
    const next = shiftMonth(month, 1);
    if (next <= bounds.last) setMonth(next);
  }, [autoSelect, day, loaded, month, bounds.last]);

  const slotKey = day ? `${day}#${refresh}` : null;
  const slotsLoaded = slotKey ? slotsByKey[slotKey] : undefined;
  useEffect(() => {
    if (!day || !slotKey || slotsLoaded) return;
    let stale = false;
    void fetchSlots(day, locale, refresh).then((result) => {
      if (!stale) setSlotsByKey((s) => ({ ...s, [slotKey]: result }));
    });
    return () => {
      stale = true;
    };
  }, [day, slotKey, locale, slotsLoaded, refresh]);

  // The split collapses on a pointer anywhere but its own row; never on a focus-out.
  useEffect(() => {
    if (!split.armed) return;
    const armed = split.armed;
    const onPointerDown = (e: PointerEvent) => {
      const row = rootRef.current?.querySelector(`[data-booking-row="${armed}"]`) ?? null;
      if (landedOutside(row, e.target)) dispatch({ type: 'pointerOutside' });
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => document.removeEventListener('pointerdown', onPointerDown, true);
  }, [split.armed]);

  const days = loaded && loaded !== 'error' ? loaded : undefined;
  const count = day ? days?.[day] : undefined;
  const slots: SlotsView = slotsLoaded ?? { kind: 'loading', rows: skeletonRows(count) };

  const selectDay = useCallback((key: string) => {
    setDay(key);
    setPicked((n) => n + 1);
    dispatch({ type: 'dayChanged' });
  }, []);

  const turnMonth = useCallback((key: string) => {
    setMonth(key);
  }, []);

  /** After a refusal: the day's starts and the month's counts are read again. */
  const refreshDay = useCallback(() => {
    setRefresh((n) => n + 1);
    setDaysByMonth((d) => {
      const rest = { ...d };
      delete rest[month];
      return rest;
    });
    dispatch({ type: 'refreshed' });
  }, [month]);

  const press = useCallback((slot: string) => dispatch({ type: 'press', slot }), []);
  const clearSplit = useCallback(() => dispatch({ type: 'dayChanged' }), []);
  const markStaggered = useCallback(() => setStaggeredDay(day), [day]);

  return {
    rootRef,
    today,
    bounds,
    month,
    turnMonth,
    days,
    daysFailed: loaded === 'error',
    day,
    /** Bumped on every pick by the person (never on the auto-select), for the phone's scroll. */
    picked,
    selectDay,
    slots,
    refreshDay,
    armed: split.armed,
    press,
    clearSplit,
    /** The rows stagger in when the day changed since they last did; the last row says so. */
    stagger: day !== null && day !== staggeredDay,
    markStaggered,
  };
}
