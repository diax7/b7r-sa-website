import type { UIFieldServerComponent } from 'payload';
import { NOT_FOLLOWING_ITEMS } from '@/modules/brand/not-following';
import { adminStringsFor } from '@/modules/cms/admin/strings';

/**
 * What a change on this screen leaves behind (spec 010, phase 1b): every image or file that
 * keeps the shipped colours, and why, so an editor who changes the blue knows what still
 * shows the old one. The list is `NOT_FOLLOWING`, which a test holds against every file in
 * the repository that carries a shipped brand colour.
 */
export const NotFollowingPanel: UIFieldServerComponent = ({ i18n }) => {
  const s = adminStringsFor(i18n.language).appearance.notFollowing;
  return (
    <section
      aria-labelledby="appearance-not-following"
      className="mb-6 flex flex-col gap-3 rounded-base border border-border bg-surface p-4"
      data-admin-ui=""
      data-admin-not-following=""
    >
      <div className="flex flex-col gap-1">
        <h3 id="appearance-not-following" className="text-small font-medium text-text">
          {s.title}
        </h3>
        <p className="text-caption text-text-muted">{s.lead}</p>
      </div>
      <ul className="flex flex-col gap-3">
        {NOT_FOLLOWING_ITEMS.map((item) => (
          <li key={item} className="flex flex-col gap-0.5" data-admin-not-following-item={item}>
            <span className="text-small text-text">{s.items[item].name}</span>
            <span className="text-caption text-text-muted">{s.items[item].why}</span>
          </li>
        ))}
      </ul>
    </section>
  );
};
