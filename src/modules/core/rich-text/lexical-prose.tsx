import {
  type JSXConvertersFunction,
  LinkJSXConverter,
  RichText,
} from '@payloadcms/richtext-lexical/react';
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';
import { Photo } from '@/components/shared/photo';
import { mediaUrl } from '@/lib/cms/mappers';
import { cn } from '@/lib/cn';
import type { Locale } from '@/lib/i18n';
import { docHref, headingIds, type LexicalNode, type LexicalState } from '@/lib/lexical';
import { safeHref } from '@/lib/markdown';
import type { Media } from '@/payload-types';

/**
 * Lexical → the design system's Prose markup on the server (no client JS): links go through
 * the same allowlist as Markdown (`https?:`, `mailto:`, site paths; off-site opens safely),
 * internal links resolve to the linked page, product or post, upload nodes render through
 * `next/image` from the media library (ADR-029), and every H2/H3 carries its `section-n` id
 * (`lib/lexical`) so a table of contents can point at it. Shared by the pages' rich-text
 * block and the blog post template.
 */
function converters(ids: Map<LexicalNode, string>, locale: Locale): JSXConvertersFunction {
  return ({ defaultConverters }) => ({
    ...defaultConverters,
    ...LinkJSXConverter({
      internalDocToHref: ({ linkNode }) => docHref(linkNode.fields.doc, locale) ?? '/',
    }),
    heading: ({ node, nodesToJSX }) => {
      const Tag = node.tag;
      const id = ids.get(node as unknown as LexicalNode);
      return <Tag {...(id ? { id } : {})}>{nodesToJSX({ nodes: node.children })}</Tag>;
    },
    link: ({ node, nodesToJSX }) => {
      const target =
        node.fields.linkType === 'internal'
          ? docHref(node.fields.doc, locale)
          : (node.fields.url ?? '');
      const href = target ? safeHref(target) : null;
      if (!href) return nodesToJSX({ nodes: node.children });
      const external = /^https?:\/\//.test(href);
      return (
        <a href={href} {...(external ? { target: '_blank', rel: 'noopener' } : {})}>
          {nodesToJSX({ nodes: node.children })}
        </a>
      );
    },
    autolink: ({ node, nodesToJSX }) => {
      const href = safeHref(node.fields.url ?? '');
      if (!href) return nodesToJSX({ nodes: node.children });
      return (
        <a href={href} target="_blank" rel="noopener">
          {nodesToJSX({ nodes: node.children })}
        </a>
      );
    },
    upload: ({ node }) => {
      const value = node.value as Media | number | null;
      const src = mediaUrl(value);
      if (!src || typeof value !== 'object' || !value) return null;
      return (
        <Photo
          src={src}
          alt={value.alt}
          width={value.width ?? 1200}
          height={value.height ?? 800}
          blur={value.blur ?? undefined}
          sizes="(min-width: 1024px) 760px, 100vw"
          className="rounded-base"
        />
      );
    },
  });
}

export function LexicalProse({
  data,
  locale,
  ids,
  className,
}: {
  data: LexicalState;
  /** Internal document links resolve under this locale's prefix (ADR-043). */
  locale: Locale;
  /** Heading ids from `headingIds()` over the whole body, so a split half keeps its numbering. */
  ids?: Map<LexicalNode, string>;
  className?: string;
}) {
  return (
    <RichText
      data={data as unknown as SerializedEditorState}
      converters={converters(ids ?? headingIds(data), locale)}
      className={cn('prose', className)}
    />
  );
}
