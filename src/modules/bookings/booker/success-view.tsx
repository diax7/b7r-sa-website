'use client';

import { CalendarCheck, Check, Clock, MessageSquareText, Users, Video } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/shared/button';
import { Icon } from '@/components/shared/icon';
import { cn } from '@/lib/cn';
import { type Locale, localePath } from '@/lib/i18n';
import { riyadhDayLabel, riyadhTimeLabel } from '@/lib/riyadh';
import { CalendarMenu } from '@/modules/bookings/booker/calendar-menu';
import type { CalendarEvent } from '@/modules/bookings/booker/calendar-links';
import type { BookerCopy } from '@/modules/bookings/booker/copy';
import type { BookerSettings } from '@/modules/bookings/booker/props';

/** What the API answers on a booking: the fields the views show. */
export interface BookedView {
  start: string;
  end: string;
  meetLink: string | null;
  token: string;
}

/** One row of the summary: the icon, the label, the value. */
export function SummaryRow({
  icon,
  label,
  children,
  testId,
}: {
  icon: typeof Clock;
  label: string;
  children: ReactNode;
  testId: string;
}) {
  return (
    <div className="flex items-start gap-3 py-3" data-booking-summary={testId}>
      <dt className="flex w-28 shrink-0 items-start gap-2 text-small font-medium text-text-muted">
        <Icon icon={icon} size={20} className="mt-0.5" />
        <span className="pt-0.5">{label}</span>
      </dt>
      <dd className="flex min-w-0 flex-1 flex-col items-start gap-2 pt-0.5 text-small text-text">
        {children}
      </dd>
    </div>
  );
}

/** «الاثنين، 21 سبتمبر 2026» and «10:00 ص إلى 10:30 ص»: the day, then the span, then the clock's name. */
export function whenLines(
  booking: Pick<BookedView, 'start' | 'end'>,
  copy: BookerCopy,
): { day: string; span: string; clock: string } {
  const start = new Date(booking.start);
  const end = new Date(booking.end);
  const joiner = copy.dateLocale.startsWith('ar') ? ' إلى ' : ' to ';
  return {
    day: riyadhDayLabel(start, copy.dateLocale),
    span: `${riyadhTimeLabel(start, copy.dateLocale)}${joiner}${riyadhTimeLabel(end, copy.dateLocale)}`,
    clock: `(${copy.booking.riyadhTime})`,
  };
}

/** The span and the clock's name, the name never broken across lines. */
export function WhenSpan({ when }: { when: ReturnType<typeof whenLines> }) {
  return (
    <span className="text-text-muted">
      {when.span} <span className="whitespace-nowrap">{when.clock}</span>
    </span>
  );
}

/** The event the calendar links carry: the title, the instants, the Meet link or the sentence. */
export function calendarEventOf(
  booking: Pick<BookedView, 'start' | 'end' | 'meetLink'>,
  settings: Pick<BookerSettings, 'title'>,
  copy: BookerCopy,
): CalendarEvent {
  return {
    title: settings.title,
    start: new Date(booking.start),
    end: new Date(booking.end),
    details: booking.meetLink ?? copy.booking.linkFollows,
    location: booking.meetLink ?? copy.booking.googleMeet,
  };
}

/** The place row's body: the Meet link as a button, or the sentence that says it follows. */
export function WhereRow({
  booking,
  copy,
}: {
  booking: Pick<BookedView, 'meetLink'>;
  copy: BookerCopy;
}) {
  return (
    <SummaryRow icon={Video} label={copy.booking.where} testId="where">
      <span>{copy.booking.googleMeet}</span>
      {booking.meetLink ? (
        <Button asChild variant="secondary" trailingArrow={false} className="h-9 px-3 text-small">
          <a href={booking.meetLink} target="_blank" rel="noopener" data-booking-meet="">
            <Icon icon={Video} size={16} />
            {copy.booking.meetLink}
          </a>
        </Button>
      ) : (
        <span className="text-text-muted" data-booking-link-follows="">
          {copy.booking.linkFollows}
        </span>
      )}
    </SummaryRow>
  );
}

export interface SuccessViewProps {
  locale: Locale;
  copy: BookerCopy;
  settings: BookerSettings;
  booking: BookedView;
  /** The merchant's name as typed in the form (never a later read). */
  merchant: string;
  note: string;
  className?: string;
}

/**
 * The success view (ADR-063, Cal.com's "This meeting is scheduled" in our brand): the check
 * disc that scales in once, «موعدك محجوز», then What / When / Who / Where and the note as
 * rows with icons, the add-to-calendar menu, and the way to the manage page.
 */
export function SuccessView({
  locale,
  copy,
  settings,
  booking,
  merchant,
  note,
  className,
}: SuccessViewProps) {
  const when = whenLines(booking, copy);
  const manage = `${localePath(locale, '/book/manage')}?token=${encodeURIComponent(booking.token)}`;
  return (
    <div
      role="status"
      className={cn('mx-auto flex w-full max-w-[560px] flex-col gap-6 animate-step-in', className)}
      data-testid="booking-success"
    >
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="grid size-14 place-items-center rounded-pill bg-success/10 text-success animate-pop-in">
          <Icon icon={Check} size={28} strokeWidth={2.25} />
        </span>
        <h2 className="text-h3 text-text">{copy.booking.confirmedTitle}</h2>
        <p className="text-body text-text-muted">{copy.booking.confirmedText}</p>
      </div>
      <dl className="flex flex-col divide-y divide-border border-y border-border">
        <SummaryRow icon={CalendarCheck} label={copy.booking.what} testId="what">
          <span className="font-medium">{settings.title}</span>
        </SummaryRow>
        <SummaryRow icon={Clock} label={copy.booking.when} testId="when">
          <span className="font-medium" data-booking-when={booking.start}>
            {when.day}
          </span>
          <WhenSpan when={when} />
        </SummaryRow>
        <SummaryRow icon={Users} label={copy.booking.who} testId="who">
          {settings.host && (
            <span className="font-medium">
              {settings.host.name}
              {settings.host.role ? (
                <span className="font-normal text-text-muted">{` · ${settings.host.role}`}</span>
              ) : null}
            </span>
          )}
          <span data-booking-merchant="">{merchant}</span>
        </SummaryRow>
        <WhereRow booking={booking} copy={copy} />
        {note.trim() && (
          <SummaryRow icon={MessageSquareText} label={copy.booking.notes} testId="note">
            <span className="whitespace-pre-line">{note.trim()}</span>
          </SummaryRow>
        )}
      </dl>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <CalendarMenu
          event={calendarEventOf(booking, settings, copy)}
          token={booking.token}
          copy={copy}
        />
        <p className="text-small text-text-muted">
          {copy.booking.needChange}{' '}
          <a
            href={manage}
            className="font-medium text-primary underline-offset-4 hover:underline"
            data-booking-manage=""
          >
            {copy.booking.manageLink}
          </a>
        </p>
      </div>
    </div>
  );
}
