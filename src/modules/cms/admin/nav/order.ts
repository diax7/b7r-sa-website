import type { NavEntity, NavGroup, NavGroupSection } from '@/modules/cms/admin/nav/groups';

/**
 * A group's rows in document order (ADR-058, ADR-061), pure: the sections placed first
 * (the inbox in Site), then the primary entries with their secondary ones, then the
 * sections placed last (the content engine in Blog). The tree, the rail's flyout, the
 * keyboard model and the active-row rule all read this one order, so they never disagree.
 */
export type NavBlock =
  | { kind: 'entity'; entity: NavEntity }
  | { kind: 'section'; section: NavGroupSection };

export function groupBlocks(group: NavGroup): NavBlock[] {
  const sections = (place: NavGroupSection['place']): NavBlock[] =>
    group.sections
      .filter((s) => s.place === place)
      .map((section) => ({ kind: 'section', section }));
  return [
    ...sections('first'),
    ...group.entities.map((entity): NavBlock => ({ kind: 'entity', entity })),
    ...sections('last'),
  ];
}
