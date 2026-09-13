import type { CollectionConfig, Field } from 'payload';
import { CODE_TOP_LEVEL } from '@/lib/site-routes';
import { hiddenUnlessAdmin, isAdmin } from '@/modules/cms/access';
import { Refused } from '@/modules/cms/refused';
import { revalidateRedirects } from '@/modules/cms/hooks/revalidate';

/** A redirect source: one top-level path segment (`/showcase`), never a code-owned one. */
export const FROM_PATTERN = /^\/[a-z0-9-]{1,64}$/;

export interface RedirectTarget {
  type: 'custom' | 'reference';
  url?: string | null;
  /** A page reference: its id (or the populated document) as the admin sends it. */
  reference?: { relationTo?: string; value?: number | string | { id?: number | string } } | null;
}

/** The page id a reference target points at, or undefined. */
export function referenceId(to: RedirectTarget | undefined): number | string | undefined {
  if (to?.type !== 'reference' || !to.reference?.value) return undefined;
  const value = to.reference.value;
  return typeof value === 'object' ? value.id : value;
}

/**
 * Why a redirect is refused, or null (ADR-032). Pure so the unit test needs no database:
 * `otherSources` are the other rows' `from` paths.
 */
export function redirectProblem(
  from: unknown,
  to: RedirectTarget | undefined,
  otherSources: readonly string[],
): string | null {
  if (typeof from !== 'string' || !FROM_PATTERN.test(from)) {
    return 'From: a one-segment path of lowercase letters and hyphens, like /showcase';
  }
  if ((CODE_TOP_LEVEL as readonly string[]).includes(from.slice(1))) {
    return `"${from}" is a live page on the site; it cannot be redirected`;
  }
  if (to?.type === 'custom') {
    const url = to.url?.trim() ?? '';
    const external = /^https:\/\/[^\s"'<>]+$/.test(url);
    const internal = url.startsWith('/') && !url.startsWith('//');
    if (!external && !internal) return 'To: a path starting with / or an https:// URL';
    if (url === from || url.startsWith(`${from}/`)) return 'To: the same as From';
    if (otherSources.includes(url)) return 'To: the From of another redirect; no chains';
  }
  return null;
}

const label = (name: string, ar: string, en: string) => (field: Field) =>
  'name' in field && field.name === name ? { ...field, label: { ar, en } } : field;

/**
 * Arabic labels on the plugin's fields (it ships no `ar` translations), and a permanent
 * redirect by default: the plugin's `type` select is required but starts empty.
 */
export function redirectFields(defaultFields: Field[]): Field[] {
  return defaultFields.map((field) => {
    const withLabel = label('from', 'المصدر (المسار القديم)', 'From (old path)')(field);
    if ('name' in withLabel && withLabel.name === 'type' && withLabel.type === 'select') {
      return {
        ...withLabel,
        defaultValue: '301',
        label: { ar: 'نوع التحويل', en: 'Redirect type' },
      };
    }
    if ('name' in withLabel && withLabel.name === 'to' && withLabel.type === 'group') {
      return {
        ...withLabel,
        label: { ar: 'الوجهة', en: 'To' },
        fields: withLabel.fields
          .map(label('type', 'نوع الوجهة', 'Target type'))
          .map(label('reference', 'صفحة في الموقع', 'A page'))
          .map(label('url', 'مسار أو رابط', 'Path or URL')),
      };
    }
    return withLabel;
  });
}

/**
 * The `redirects` collection the plugin builds, as this site shapes it (ADR-032): admin
 * only, hidden from editors like the settings globals, validated so a row can never loop or
 * shadow a code-owned route, and revalidating the source path and the proxy allowlist.
 */
export const REDIRECT_OVERRIDES: Omit<Partial<CollectionConfig>, 'fields'> & {
  fields: (args: { defaultFields: Field[] }) => Field[];
} = {
  labels: {
    singular: { ar: 'تحويل', en: 'Redirect' },
    plural: { ar: 'التحويلات', en: 'Redirects' },
  },
  admin: {
    group: { ar: 'الإعدادات', en: 'Settings' },
    hidden: hiddenUnlessAdmin,
    useAsTitle: 'from',
    defaultColumns: ['from', 'to.type', 'type', 'updatedAt'],
    listSearchableFields: ['from'],
    description: {
      ar: 'تحويل رابط قديم إلى صفحة أو رابط جديد. يعمل فور الحفظ.',
      en: 'Send an old URL to a page or a new URL. Live as soon as it is saved.',
    },
  },
  access: { read: () => true, create: isAdmin, update: isAdmin, delete: isAdmin },
  hooks: {
    beforeValidate: [
      async ({ data, originalDoc, req }) => {
        const from = data?.['from'] ?? originalDoc?.['from'];
        let to = (data?.['to'] ?? originalDoc?.['to']) as RedirectTarget | undefined;
        // A page reference is checked as the path it will resolve to (self and loops).
        const pageId = referenceId(to);
        if (pageId !== undefined) {
          const page = await req.payload.findByID({
            collection: 'pages',
            id: pageId,
            depth: 0,
            draft: true,
            req,
          });
          to = { type: 'custom', url: `/${page.slug}` };
        }
        const others = await req.payload.find({
          collection: 'redirects',
          where: originalDoc?.['id'] ? { id: { not_equals: originalDoc['id'] } } : {},
          limit: 500,
          depth: 0,
          req,
        });
        const problem = redirectProblem(
          from,
          to,
          others.docs.map((d) => d.from),
        );
        if (problem) throw new Refused(problem);
        return data;
      },
    ],
    afterChange: [revalidateRedirects],
    afterDelete: [revalidateRedirects],
  },
  fields: ({ defaultFields }) => redirectFields(defaultFields),
};
