import { firstOpenDay, type PickerSettings, stripMonths } from '@/modules/bookings/picker/days';
import type { PickerCopy } from '@/modules/bookings/picker/validate';

/**
 * The picker's server-rendered stand-in: the same strip of days, its chips `aria-disabled`
 * rather than `disabled` so a Tab or a tap on one mounts the island (`NearViewport`), and
 * the loading line where the slots go. The island draws its own strip from the same helper,
 * so the swap moves nothing; the fallback's "today" is the render's, harmless since it is
 * inert.
 */
export function PickerFallback({ copy, settings }: { copy: PickerCopy; settings: PickerSettings }) {
  const months = stripMonths(settings, copy.dateLocale, new Date());
  const selected = firstOpenDay(months);
  return (
    <div className="flex flex-col gap-6" data-booking-picker="fallback">
      <div className="flex flex-col gap-3">
        <p className="text-small font-medium text-text">{copy.booking.pickDay}</p>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {months.map((month) => (
            <div key={month.label} className="flex shrink-0 flex-col gap-2">
              <p className="text-caption text-text-muted">{month.label}</p>
              <ul className="flex gap-2">
                {month.days.map((day) => (
                  <li key={day.key}>
                    <button
                      type="button"
                      aria-disabled="true"
                      aria-pressed={selected === day.key}
                      className={
                        day.closed
                          ? 'flex h-16 w-14 cursor-not-allowed flex-col items-center justify-center rounded-base border border-border/60 text-text-muted/60'
                          : selected === day.key
                            ? 'flex h-16 w-14 flex-col items-center justify-center rounded-base border border-primary bg-primary text-white'
                            : 'flex h-16 w-14 flex-col items-center justify-center rounded-base border border-border bg-surface text-text'
                      }
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
      <div className="flex flex-col gap-3">
        <p className="flex flex-wrap items-baseline gap-x-2 text-small font-medium text-text">
          {copy.booking.pickTime}
          <span className="text-caption font-normal text-text-muted">
            {copy.booking.duration.replace('{minutes}', String(settings.durationMinutes))} ·{' '}
            {copy.booking.riyadhTime}
          </span>
        </p>
        <p className="min-h-11 text-small text-text-muted">{copy.booking.loadingSlots}</p>
      </div>
    </div>
  );
}
