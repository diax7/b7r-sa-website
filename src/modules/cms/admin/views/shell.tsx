import { DefaultTemplate } from '@payloadcms/next/templates';
import { Gutter, SetStepNav } from '@payloadcms/ui';
import type { AdminViewServerProps } from 'payload';
import type { ReactNode } from 'react';

/**
 * The admin shell around a custom view of ours (ADR-048, ADR-049): Payload hands a custom
 * view the shell's data and expects the view to render the shell itself, so without this a
 * page stands alone with no sidebar and no way back. `DefaultTemplate` is the same template
 * every collection and the dashboard render in (our sidebar, the header, the account menu);
 * the step nav names the page under the dashboard the way a collection's list does; the
 * content sits in a `Gutter` like every other page.
 */
export function AdminShell({
  props,
  title,
  children,
}: {
  props: AdminViewServerProps;
  /** The page's name in the step nav; the dashboard is the step before it. */
  title: string;
  children: ReactNode;
}) {
  const { initPageResult, params, searchParams } = props;
  const { req } = initPageResult;
  return (
    <DefaultTemplate
      i18n={req.i18n}
      payload={req.payload}
      permissions={initPageResult.permissions}
      req={req}
      visibleEntities={initPageResult.visibleEntities}
      // The header's own actions (the palette, "View website") come from the config; Payload
      // passes them only to the views it wraps itself.
      viewActions={req.payload.config.admin.components?.actions ?? []}
      {...(initPageResult.locale ? { locale: initPageResult.locale } : {})}
      {...(params ? { params } : {})}
      {...(searchParams ? { searchParams } : {})}
      {...(req.user ? { user: req.user } : {})}
    >
      <SetStepNav nav={[{ label: title }]} />
      <Gutter>{children}</Gutter>
    </DefaultTemplate>
  );
}
