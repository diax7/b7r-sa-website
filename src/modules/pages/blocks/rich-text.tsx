import {
  type JSXConvertersFunction,
  LinkJSXConverter,
  RichText,
} from '@payloadcms/richtext-lexical/react';
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';
import Image from 'next/image';
import { Container } from '@/components/shared/container';
import { Section } from '@/components/shared/section';
import { SectionHeader } from '@/components/shared/section-header';
import { mediaUrl } from '@/lib/cms/mappers';
import { safeHref } from '@/lib/markdown';
import type { Media } from '@/payload-types';
import type { BlockProps } from '@/modules/pages/blocks/types';

/**
 * Lexical → the design system's Prose markup on the server (no client JS): links go through
 * the same allowlist as Markdown (`https?:`, `mailto:`, site paths; off-site opens safely),
 * upload nodes render through `next/image` from the media library (ADR-029).
 */
const converters: JSXConvertersFunction = ({ defaultConverters }) => ({
  ...defaultConverters,
  ...LinkJSXConverter({ internalDocToHref: () => '/' }),
  link: ({ node, nodesToJSX }) => {
    const href = safeHref(node.fields.url ?? '');
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
      <Image
        src={src}
        alt={value.alt}
        width={value.width ?? 1200}
        height={value.height ?? 800}
        sizes="(min-width: 1024px) 760px, 100vw"
        className="rounded-base"
      />
    );
  },
});

export function RichTextBlock({ block, tone, heading }: BlockProps<'richText'>) {
  const title = heading?.title ?? block.title;
  return (
    <Section
      tone={tone}
      className={heading ? 'pt-10 md:pt-16' : undefined}
      {...(title ? { 'aria-labelledby': 'rich-text-title' } : {})}
    >
      <Container className="flex flex-col gap-8">
        {title && (
          <SectionHeader
            as={heading ? 'h1' : 'h2'}
            id="rich-text-title"
            title={title}
            {...(heading?.lead ? { lead: heading.lead } : {})}
          />
        )}
        <RichText
          data={block.content as unknown as SerializedEditorState}
          converters={converters}
          className="prose"
        />
      </Container>
    </Section>
  );
}
