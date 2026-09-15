import { getTranslation } from '@payloadcms/translations';
import { ExternalLink } from 'lucide-react';
import type { StaticLabel, ViewDescriptionServerProps } from 'payload';
import { Icon } from '@/components/shared/icon';
import { cn } from '@/lib/cn';
import { HomeSectionsCount } from '@/modules/cms/admin/document/home-sections-count';
import {
  ADMIN_GROUPS,
  type EntityRef,
  entityIcon,
  HUE_BAR_CLASSES,
  HUE_CLASSES,
  navPlacement,
} from '@/modules/cms/admin/icons';
import { adminStrings } from '@/modules/cms/admin/strings';

const s = adminStrings.entityHeader;

/**
 * The block under a document's or a list's title (the `Description` slot, ADR-046): the
 * entity's icon in a disc of its group's hue behind a bar of the same hue, the description
 * sentence, then where on the site the thing shows (`admin.custom.shows` on the config) and,
 * for a collection with a public listing, a link to it. The slot renders on the list view
 * too, so nothing here depends on a document. The language note (ADR-044) stays before the
 * document controls.
 */
export function EntityHeader(props: ViewDescriptionServerProps & { entity: EntityRef }) {
  const { entity, description, i18n, payload } = props;
  const placement = navPlacement(entity.type, entity.slug);
  const hue = placement ? ADMIN_GROUPS[placement.group].hue : 'blue';
  const EntityIcon = entityIcon(entity.type, entity.slug);
  const config =
    entity.type === 'collections'
      ? payload.config.collections.find((c) => c.slug === entity.slug)
      : payload.config.globals.find((g) => g.slug === entity.slug);
  const shows = config?.admin?.custom?.['shows'] as StaticLabel | undefined;
  const label =
    entity.type === 'collections'
      ? getTranslation(
          payload.config.collections.find((c) => c.slug === entity.slug)?.labels.plural ?? '',
          i18n,
        )
      : '';
  return (
    <div
      className={cn('flex items-start gap-3 border-s-2 ps-3', HUE_BAR_CLASSES[hue])}
      data-admin-ui=""
      data-admin-header={entity.slug}
      data-hue={hue}
    >
      <span
        className={cn('grid size-10 shrink-0 place-items-center rounded-base', HUE_CLASSES[hue])}
      >
        {EntityIcon && <Icon icon={EntityIcon} size={20} />}
      </span>
      <div className="flex min-w-0 flex-col gap-0.5">
        {description && <p className="text-body text-text">{getTranslation(description, i18n)}</p>}
        {shows && (
          <p className="text-small text-text-muted" data-admin-shows="">
            <span className="font-medium text-text">{s.shows}</span> {getTranslation(shows, i18n)}
            {entity.slug === 'home' && <HomeSectionsCount />}
          </p>
        )}
        {placement?.listing && (
          <a
            href={placement.listing}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-small text-accent hover:underline"
            data-admin-listing=""
          >
            {s.listing(label)}
            <Icon icon={ExternalLink} size={12} />
          </a>
        )}
      </div>
    </div>
  );
}
