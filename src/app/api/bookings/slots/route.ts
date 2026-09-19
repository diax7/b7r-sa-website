import { NextResponse } from 'next/server';
import { cms } from '@/lib/cms/payload';
import { isLocale } from '@/lib/i18n';
import { clientIp, createRateLimiter } from '@/lib/rate-limit';
import {
  bookingPorts,
  SLOTS_RATE_LIMIT,
  SLOTS_WINDOW_MS,
  slotsFor,
  slotsQuerySchema,
} from '@/modules/bookings';

export const dynamic = 'force-dynamic';

const limiter = createRateLimiter(SLOTS_RATE_LIMIT, SLOTS_WINDOW_MS);

/**
 * The free starts of a day (ADR-062): `?date=YYYY-MM-DD` in Riyadh, public, sixty a minute
 * per address, cached a minute (a slot taken in that minute answers 409 at the booking).
 * A date outside today..the horizon, or the switch off, is a 400: the host's pattern
 * cannot be scraped for months.
 */
export async function GET(req: Request) {
  const hit = limiter.hit(clientIp(req.headers));
  if (!hit.allowed) {
    return NextResponse.json(
      { ok: false, error: 'rate_limited' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(hit.retryAfterMs / 1000)) } },
    );
  }
  const url = new URL(req.url);
  const parsed = slotsQuerySchema.safeParse({ date: url.searchParams.get('date') });
  if (!parsed.success) return NextResponse.json({ ok: false, error: 'invalid' }, { status: 400 });
  const localeParam = url.searchParams.get('locale');
  const locale = isLocale(localeParam) ? localeParam : 'ar';
  const ports = await bookingPorts(await cms());
  const result = await slotsFor(ports, parsed.data.date, locale);
  if (!result.ok) return NextResponse.json({ ok: false, error: result.reason }, { status: 400 });
  return NextResponse.json(
    { ok: true, date: parsed.data.date, slots: result.slots.map((s) => s.toISOString()) },
    { headers: { 'Cache-Control': 'public, max-age=60' } },
  );
}
