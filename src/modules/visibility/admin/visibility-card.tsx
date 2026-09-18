import { Link } from '@payloadcms/ui';
import { Card } from '@/components/shared/card';
import { Icon } from '@/components/shared/icon';
import { ADMIN_VIEWS } from '@/modules/cms/admin/icons';
import { adminStringsFor } from '@/modules/cms/admin/strings';
import { Ring } from '@/modules/visibility/admin/ring';
import type { Score } from '@/modules/visibility/score';

const ScoreIcon = ADMIN_VIEWS.visibility.icon;

/**
 * The "Visibility score" card on the dashboard (ADR-049, admins): the ring, the two numbers,
 * and the three findings that weigh most among what is next or missing, each a link to the
 * page. No empty state: the rules always answer.
 */
export function VisibilityCard({
  score,
  href,
  language,
}: {
  score: Score;
  href: string;
  language: string;
}) {
  const s = adminStringsFor(language).visibility;
  const top = score.findings
    .filter((f) => f.status !== 'done')
    .toSorted((a, b) => b.weight - b.earned - (a.weight - a.earned))
    .slice(0, 3);
  return (
    <Card
      className="flex flex-col gap-4 p-5"
      data-admin-visibility=""
      data-admin-visibility-overall={score.overall}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-h4 text-text">
          <Icon icon={ScoreIcon} size={20} className="text-accent" />
          {s.card.title}
        </h2>
        <Link href={href} className="text-caption text-accent hover:underline">
          {s.card.link}
        </Link>
      </div>
      <div className="flex items-center gap-4">
        <Ring percent={score.overall} size={72} label={s.overall} />
        <div className="flex flex-col gap-0.5">
          <span className="text-small text-text">
            {s.page.siteOnly.replace('{n}', String(score.siteOnly))}
          </span>
          <span className="text-caption text-text-muted">{s.card.hint}</span>
        </div>
      </div>
      {top.length > 0 && (
        <ul className="flex flex-col gap-1.5" data-admin-visibility-next="">
          {top.map((f) => (
            <li key={f.key} className="flex items-start gap-2 text-small">
              <span className="mt-1.5 size-2 shrink-0 rounded-pill bg-warning" aria-hidden="true" />
              <Link href={`${href}#${f.section}`} className="text-text hover:underline">
                {f.title}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
