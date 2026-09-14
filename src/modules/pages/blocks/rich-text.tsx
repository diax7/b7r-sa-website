import { Container } from '@/components/shared/container';
import { Section } from '@/components/shared/section';
import { SectionHeader } from '@/components/shared/section-header';
import type { LexicalState } from '@/lib/lexical';
import { LexicalProse } from '@/modules/core/rich-text/lexical-prose';
import type { BlockProps } from '@/modules/pages/blocks/types';

/** A rich-text section: the shared Lexical renderer (`modules/core/rich-text`) inside a section. */
export function RichTextBlock({ block, tone, anchor, heading, locale }: BlockProps<'richText'>) {
  const title = heading?.title ?? block.title;
  return (
    <Section
      tone={tone}
      className={heading ? 'pt-10 md:pt-16' : undefined}
      {...(title ? { 'aria-labelledby': `${anchor}-title` } : {})}
      data-block="richText"
    >
      <Container className="flex flex-col gap-8">
        {title && (
          <SectionHeader
            as={heading ? 'h1' : 'h2'}
            id={`${anchor}-title`}
            title={title}
            {...(heading?.lead ? { lead: heading.lead } : {})}
          />
        )}
        <LexicalProse data={block.content as unknown as LexicalState} locale={locale} />
      </Container>
    </Section>
  );
}
