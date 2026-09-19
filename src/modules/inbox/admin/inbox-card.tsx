import { Link } from '@payloadcms/ui';
import { Badge } from '@/components/shared/badge';
import { Icon } from '@/components/shared/icon';
import { riyadhDayWindow } from '@/lib/riyadh';
import { BOOKING_STATUS_LABELS, BOOKINGS } from '@/modules/bookings/status';
import type { InboxReading } from '@/modules/cms/admin/dashboard/readers';
import { DashboardSection, SectionLink } from '@/modules/cms/admin/dashboard/section';
import { statusTone } from '@/modules/cms/admin/fields/status-cell';
import { formatSlot, relativeTime } from '@/modules/cms/admin/format';
import { COLLECTION_ICONS, NAV_SECTIONS } from '@/modules/cms/admin/icons';
import { adminStringsFor, isArabic } from '@/modules/cms/admin/strings';
import { excerptOf } from '@/modules/inbox/excerpt';

/** A neutral disc behind the entity's icon: the card's one hue is its title's (ADR-060). */
const disc = 'grid size-8 shrink-0 place-items-center rounded-inner bg-surface-2 text-text';

const figure =
  'self-start text-small font-medium text-text hover:underline focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent/40';
const row =
  'flex items-center gap-3 py-2 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent/40';

/** The bookings list narrowed to the Riyadh day, soonest first: the same window the reader counts. */
export function todayQuery(now: Date): string {
  const [from, to] = riyadhDayWindow(now);
  return new URLSearchParams({
    'where[start][greater_than_equal]': from.toISOString(),
    'where[start][less_than]': to.toISOString(),
    sort: 'start',
  }).toString();
}

/**
 * "Inbox" on the dashboard (ADR-061, ADR-062): two sentences, the count of messages nobody
 * has opened (linked to the list filtered on New) and the count of bookings still ahead
 * today (linked to the bookings of the day); the sidebar's badge reads the two added. Under
 * them the newest three new messages with the sender, the inquiry and the first words, then
 * the next three bookings with the merchant, the moment on the Riyadh clock and the status
 * word, each a link to its form; "All messages" and "All bookings" into the lists. The
 * Site blue on the title icon is the card's one hue; an inbox with nothing waiting says so
 * in both sentences and lists nothing.
 */
export function InboxCard({
  reading,
  adminRoute,
  language,
  now,
}: {
  reading: InboxReading;
  adminRoute: string;
  language: string;
  /** The render's clock, one for every section. */
  now: Date;
}) {
  const strings = adminStringsFor(language);
  const s = strings.dashboard.inbox;
  const list = `${adminRoute}/collections/messages`;
  const bookings = `${adminRoute}/collections/${BOOKINGS}`;
  const MessageIcon = COLLECTION_ICONS.messages;
  const BookingIcon = COLLECTION_ICONS.bookings;
  const word = isArabic(language) ? 'ar' : 'en';
  return (
    <DashboardSection
      hook="inbox"
      title={s.title}
      icon={NAV_SECTIONS.inbox.icon}
      hue="blue"
      end={
        <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <SectionLink href={list}>{s.link}</SectionLink>
          <SectionLink href={bookings}>{s.bookingsLink}</SectionLink>
        </span>
      }
      data-admin-inbox-new={reading.newCount}
      data-admin-inbox-today={reading.todayCount}
      data-admin-inbox-waiting={reading.waiting}
    >
      <div className="flex flex-col gap-1">
        {reading.newCount === 0 ? (
          <p
            className="flex items-center gap-2 text-small text-text-muted"
            data-admin-inbox-empty=""
          >
            <Icon icon={MessageIcon} size={16} />
            {s.newMessages(0)}
          </p>
        ) : (
          <Link
            href={`${list}?where[status][equals]=new`}
            className={figure}
            data-admin-figure="new-messages"
            data-admin-figure-value={reading.newCount}
          >
            {s.newMessages(reading.newCount)}
          </Link>
        )}
        {reading.todayCount === 0 ? (
          <p
            className="flex items-center gap-2 text-small text-text-muted"
            data-admin-inbox-no-bookings=""
          >
            <Icon icon={BookingIcon} size={16} />
            {s.todayBookings(0)}
          </p>
        ) : (
          <Link
            href={`${bookings}?${todayQuery(now)}`}
            className={figure}
            data-admin-figure="today-bookings"
            data-admin-figure-value={reading.todayCount}
          >
            {s.todayBookings(reading.todayCount)}
          </Link>
        )}
      </div>
      {reading.newest.length > 0 && (
        <ul className="flex flex-col divide-y divide-border" data-admin-inbox-newest="">
          {reading.newest.map((m) => (
            <li key={m.id}>
              <Link href={`${list}/${m.id}`} className={row} data-admin-inbox-message={m.id}>
                <span className={disc}>
                  <Icon icon={MessageIcon} size={16} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-small font-medium text-text">{m.name}</span>
                  <span className="block truncate text-caption text-text-muted">
                    {[m.inquiry, excerptOf(m.message)].filter(Boolean).join(' · ')}
                  </span>
                </span>
                <time dateTime={m.createdAt} className="shrink-0 text-caption text-text-muted">
                  {relativeTime(m.createdAt, language, now)}
                </time>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {reading.next.length > 0 && (
        <ul className="flex flex-col divide-y divide-border" data-admin-inbox-next="">
          {reading.next.map((b) => (
            <li key={b.id}>
              <Link href={`${bookings}/${b.id}`} className={row} data-admin-inbox-booking={b.id}>
                <span className={disc}>
                  <Icon icon={BookingIcon} size={16} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-small font-medium text-text">{b.name}</span>
                  <time dateTime={b.start} className="block truncate text-caption text-text-muted">
                    {strings.time.riyadh.replace(
                      '{when}',
                      formatSlot(new Date(b.start), language, now),
                    )}
                  </time>
                </span>
                <Badge
                  tone={statusTone(b.status)}
                  className="shrink-0 whitespace-nowrap"
                  data-admin-status={b.status}
                >
                  {BOOKING_STATUS_LABELS[b.status][word]}
                </Badge>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </DashboardSection>
  );
}
