import { ArrowLeft, CalendarCheck, Clock, Globe, Video } from 'lucide-react';
import Image from 'next/image';
import type { ReactNode } from 'react';
import { Icon } from '@/components/shared/icon';
import { cn } from '@/lib/cn';
import { riyadhDayShortLabel, riyadhTimeLabel } from '@/lib/riyadh';
import { type BookerCopy, fill } from '@/modules/bookings/booker/copy';
import type { BookerSettings } from '@/modules/bookings/booker/props';
import { type BookerMode, EVENT_PANE } from '@/modules/bookings/booker/styles';

/** The host's photo, or the initial in the accent tint when the record has none. */
export function HostAvatar({ host, size }: { host: BookerSettings['host']; size: 40 | 56 }) {
  const box = size === 56 ? 'size-14' : 'size-10';
  if (host?.photo) {
    return (
      <Image
        src={host.photo}
        alt=""
        width={size}
        height={size}
        className={cn(box, 'shrink-0 rounded-pill object-cover')}
        data-booking-host-photo=""
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className={cn(
        box,
        'grid shrink-0 place-items-center rounded-pill bg-accent-tint font-medium text-primary',
        size === 56 ? 'text-h4' : 'text-body',
      )}
      data-booking-host-initial=""
    >
      {(host?.name ?? '').trim().slice(0, 1)}
    </span>
  );
}

/** The meta rows: the length, the place, the clock; monochrome icons, one line each. */
export function EventMeta({
  settings,
  copy,
  inline,
}: {
  settings: BookerSettings;
  copy: BookerCopy;
  inline?: boolean;
}) {
  const rows: Array<[typeof Clock, string]> = [
    [Clock, fill(copy.booking.duration, { minutes: settings.durationMinutes })],
    [Video, copy.booking.googleMeet],
    [Globe, copy.booking.timezone],
  ];
  return (
    <ul
      className={cn(
        'text-small text-text-muted',
        inline ? 'flex flex-wrap gap-x-4 gap-y-1' : 'flex flex-wrap gap-x-4 gap-y-2 md:flex-col',
      )}
      data-booking-meta=""
    >
      {rows.map(([icon, text]) => (
        <li key={text} className="flex items-center gap-2">
          <Icon icon={icon} size={18} />
          <span>{text}</span>
        </li>
      ))}
    </ul>
  );
}

export interface EventPaneProps {
  settings: BookerSettings;
  copy: BookerCopy;
  mode: BookerMode;
  /** The card's own title in `inline` mode (the contact card's), the consultation's name otherwise. */
  heading?: string;
  /** From the form step on: the chosen start, as a row with the calendar icon. */
  chosen?: Date | null;
  /** Beside the chosen row: back to the times. */
  onBack?: () => void;
  /** After the meta rows: the manage page's summary (the status pill, the time). */
  children?: ReactNode;
}

/**
 * The event pane (ADR-063, Cal.com's meta column in our brand): who the merchant meets, the
 * consultation's name and blurb, the length, the place and the clock; from the form step on
 * the chosen time and the way back. No hook and no browser API: the server renders it as the
 * stand-in, the island renders the same markup, and the swap moves nothing.
 */
export function EventPane({
  settings,
  copy,
  mode,
  heading,
  chosen,
  onBack,
  children,
}: EventPaneProps) {
  const { host } = settings;
  const comma = copy.dateLocale.startsWith('ar') ? '،' : ',';
  const chosenLine = chosen
    ? `${riyadhDayShortLabel(chosen, copy.dateLocale)}${comma} ${riyadhTimeLabel(chosen, copy.dateLocale)}`
    : null;
  const back = onBack ? (
    <button
      type="button"
      onClick={onBack}
      className="inline-flex h-9 items-center gap-1.5 self-start rounded-inner text-small font-medium text-primary transition-colors duration-(--duration-fast) hover:text-primary-hover focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent/40"
      data-booking-back=""
    >
      <Icon icon={ArrowLeft} size={16} />
      {copy.booking.back}
    </button>
  ) : null;

  if (mode === 'inline') {
    return (
      <div className={EVENT_PANE.inline} data-booking-event="">
        <div className="flex items-center gap-3">
          <HostAvatar host={host} size={40} />
          <div className="flex min-w-0 flex-col">
            <h2 className="text-h4 text-text">{heading ?? settings.title}</h2>
            {host && (
              <p className="text-caption text-text-muted" data-booking-host="">
                {host.name}
                {host.role ? ` · ${host.role}` : ''}
              </p>
            )}
          </div>
        </div>
        {chosenLine ? (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="flex items-center gap-2 text-small text-text" data-booking-chosen="">
              <Icon icon={CalendarCheck} size={18} className="text-primary" />
              <span>{chosenLine}</span>
            </p>
            {back}
          </div>
        ) : (
          <EventMeta settings={settings} copy={copy} inline />
        )}
      </div>
    );
  }

  return (
    <div className={EVENT_PANE[mode]} data-booking-event="">
      <div className="flex items-center gap-3">
        <HostAvatar host={host} size={56} />
        {host && (
          <div className="flex min-w-0 flex-col">
            <p className="text-body font-medium text-text" data-booking-host="">
              {host.name}
            </p>
            {host.role && <p className="text-caption text-text-muted">{host.role}</p>}
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <h2 className="text-h4 text-text">{heading ?? settings.title}</h2>
        {settings.blurb && (
          <p className="text-small text-text-muted" data-booking-blurb="">
            {settings.blurb}
          </p>
        )}
      </div>
      <EventMeta settings={settings} copy={copy} />
      {chosenLine && (
        <div className="flex flex-col gap-2 border-t border-border pt-4">
          <p className="flex items-start gap-2 text-small text-text" data-booking-chosen="">
            <Icon icon={CalendarCheck} size={18} className="mt-0.5 text-primary" />
            <span>{chosenLine}</span>
          </p>
          {back}
        </div>
      )}
      {children}
    </div>
  );
}
