'use client';

import { CalendarPlus, ChevronDown } from 'lucide-react';
import { Button } from '@/components/shared/button';
import { Icon } from '@/components/shared/icon';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AppleMark, GoogleCalendarMark, OutlookMark } from '@/modules/bookings/booker/brand-marks';
import {
  appleCalendarUrl,
  type CalendarEvent,
  googleCalendarUrl,
  outlookCalendarUrl,
} from '@/modules/bookings/booker/calendar-links';
import type { BookerCopy } from '@/modules/bookings/booker/copy';

export interface CalendarMenuProps {
  event: CalendarEvent;
  /** The booking's signed token, for the `.ics` route. */
  token: string;
  copy: BookerCopy;
  variant?: 'secondary' | 'ghost';
}

/**
 * «أضف إلى التقويم» (ADR-063): one button that opens a menu of three entries with their
 * marks, Google Calendar and Outlook in a new tab, Apple through the site's `.ics` (the
 * file opens Calendar on an iPhone or a Mac). Keyboard, typeahead, Escape, the focus return
 * and the close on an outside pointer come from the site's menu primitive (Radix).
 */
export function CalendarMenu({ event, token, copy, variant = 'secondary' }: CalendarMenuProps) {
  const entries = [
    {
      key: 'google',
      label: copy.booking.googleCalendar,
      href: googleCalendarUrl(event),
      Mark: GoogleCalendarMark,
      external: true,
    },
    {
      key: 'outlook',
      label: copy.booking.outlookCalendar,
      href: outlookCalendarUrl(event),
      Mark: OutlookMark,
      external: true,
    },
    {
      key: 'apple',
      label: copy.booking.appleCalendar,
      href: appleCalendarUrl(token),
      Mark: AppleMark,
      external: false,
    },
  ];
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} trailingArrow={false} data-booking-add-to-calendar="">
          <Icon icon={CalendarPlus} size={18} />
          {copy.booking.addToCalendar}
          <Icon icon={ChevronDown} size={16} className="opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" data-booking-calendar-menu="">
        {entries.map(({ key, label, href, Mark, external }) => (
          <DropdownMenuItem key={key} asChild>
            <a
              href={href}
              {...(external ? { target: '_blank', rel: 'noopener' } : {})}
              data-booking-calendar-link={key}
            >
              <Mark size={20} className="shrink-0 text-text-muted" />
              {label}
            </a>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
