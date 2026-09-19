import { Link } from '@payloadcms/ui';
import { Icon } from '@/components/shared/icon';
import type { InboxReading } from '@/modules/cms/admin/dashboard/readers';
import { DashboardSection, SectionLink } from '@/modules/cms/admin/dashboard/section';
import { relativeTime } from '@/modules/cms/admin/format';
import { COLLECTION_ICONS, NAV_SECTIONS } from '@/modules/cms/admin/icons';
import { adminStringsFor } from '@/modules/cms/admin/strings';
import { excerptOf } from '@/modules/inbox/excerpt';

/** A neutral disc behind the entity's icon: the card's one hue is its title's (ADR-060). */
const disc = 'grid size-8 shrink-0 place-items-center rounded-inner bg-surface-2 text-text';

/**
 * "Inbox" on the dashboard (ADR-061): the sentence with the count of messages nobody has
 * opened (the sidebar's badge reads the same number and says the same words), linked to
 * the list filtered on New; the newest three of them with the sender, the inquiry and the
 * first words, each a link to its form; "All messages" into the list. The Site blue on the
 * title icon is the card's one hue; an inbox with nothing new says so and lists nothing.
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
  const s = adminStringsFor(language).dashboard.inbox;
  const list = `${adminRoute}/collections/messages`;
  const MessageIcon = COLLECTION_ICONS.messages;
  const sentence = s.newMessages(reading.newCount);
  return (
    <DashboardSection
      hook="inbox"
      title={s.title}
      icon={NAV_SECTIONS.inbox.icon}
      hue="blue"
      end={<SectionLink href={list}>{s.link}</SectionLink>}
      data-admin-inbox-new={reading.newCount}
    >
      {reading.newCount === 0 ? (
        <p className="flex items-center gap-2 text-small text-text-muted" data-admin-inbox-empty="">
          <Icon icon={MessageIcon} size={16} />
          {sentence}
        </p>
      ) : (
        <Link
          href={`${list}?where[status][equals]=new`}
          className="self-start text-small font-medium text-text hover:underline focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent/40"
          data-admin-figure="new-messages"
          data-admin-figure-value={reading.newCount}
        >
          {sentence}
        </Link>
      )}
      {reading.newest.length > 0 && (
        <ul className="flex flex-col divide-y divide-border" data-admin-inbox-newest="">
          {reading.newest.map((m) => (
            <li key={m.id}>
              <Link
                href={`${list}/${m.id}`}
                className="flex items-center gap-3 py-2 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent/40"
                data-admin-inbox-message={m.id}
              >
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
    </DashboardSection>
  );
}
