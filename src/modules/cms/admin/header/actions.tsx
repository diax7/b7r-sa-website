import { getTranslation } from '@payloadcms/translations';
import type { ServerProps } from 'payload';
import { HeaderActionsClient } from '@/modules/cms/admin/header/actions-client';
import type { PaletteEntity, SearchableCollection } from '@/modules/cms/admin/header/palette';
import { flattenNav, navGroups } from '@/modules/cms/admin/nav/groups';

/**
 * Header actions (`admin.components.actions`): the palette trigger and the site link. The
 * palette itself mounts here, once per page; the sidebar's search row only fires its event.
 * The searchable collections are the ones the user may read that declare
 * `listSearchableFields`, the palette searches exactly those fields.
 */
export async function HeaderActions(props: ServerProps) {
  const { payload, permissions, user, i18n } = props;
  const groups = await navGroups({ payload, permissions, user, i18n });
  const entities: PaletteEntity[] = flattenNav(groups).map(
    ({ type, slug, label, href, group }) => ({ type, slug, label, href, group }),
  );
  const searchable: SearchableCollection[] = payload.config.collections.flatMap((c) => {
    const entity = entities.find((e) => e.type === 'collections' && e.slug === c.slug);
    const fields = c.admin.listSearchableFields ?? [];
    if (!entity || fields.length === 0 || !c.admin.useAsTitle) return [];
    return [
      {
        slug: c.slug,
        label: getTranslation(c.labels.plural, i18n),
        fields,
        titleField: c.admin.useAsTitle,
        href: entity.href,
      },
    ];
  });
  return (
    <HeaderActionsClient
      entities={entities}
      searchable={searchable}
      apiRoute={payload.config.routes.api}
    />
  );
}
