import { NextResponse } from 'next/server';
import { cms } from '@/lib/cms/payload';
import { isLocale } from '@/lib/i18n';
import { clientIp, createRateLimiter } from '@/lib/rate-limit';
import {
  bookingPorts,
  daysFor,
  daysQuerySchema,
  routeFailure,
  SLOTS_RATE_LIMIT,
  SLOTS_WINDOW_MS,
} from '@/modules/bookings';

export const dynamic = 'force-dynamic';

const limiter = createRateLimiter(SLOTS_RATE_LIMIT, SLOTS_WINDOW_MS);

/**
 * The month's open days for the booker's grid (ADR-063): `?month=YYYY-MM` in Riyadh, each
 * day within the horizon with its free count from the rules, the closed dates, the notice
 * and the day's bookings against the cap; never the host calendar (the day click asks it).
 * Public, sixty a minute per address like the slots, cached a minute. A month outside
 * today's..the horizon's, or the switch off, is a 400: the pattern cannot be read for a year.
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
  const parsed = daysQuerySchema.safeParse({ month: url.searchParams.get('month') });
  if (!parsed.success) return NextResponse.json({ ok: false, error: 'invalid' }, { status: 400 });
  const localeParam = url.searchParams.get('locale');
  const locale = isLocale(localeParam) ? localeParam : 'ar';
  const payload = await cms();
  try {
    const result = await daysFor(await bookingPorts(payload), parsed.data.month, locale);
    if (!result.ok) return NextResponse.json({ ok: false, error: result.reason }, { status: 400 });
    return NextResponse.json(
      { ok: true, month: parsed.data.month, days: result.days },
      { headers: { 'Cache-Control': 'public, max-age=60' } },
    );
  } catch (error) {
    return routeFailure(payload.logger, 'GET /api/bookings/days', error);
  }
}
