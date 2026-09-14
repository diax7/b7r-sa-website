import { Eye, Heart, ShieldCheck, Target, Workflow, Zap, type LucideIcon } from 'lucide-react';
import Image from 'next/image';
import { Card } from '@/components/shared/card';
import { Container } from '@/components/shared/container';
import { Icon } from '@/components/shared/icon';
import { Reveal } from '@/components/shared/reveal';
import { Section } from '@/components/shared/section';
import { SectionHeader } from '@/components/shared/section-header';
import type { Block } from '@/content/schema';
import { copyFor } from '@/content/copy';
import type { BlockProps } from '@/modules/pages/blocks/types';

type CardIcon = Extract<Block, { blockType: 'cards' }>['items'][number]['icon'];

const ICONS: Record<CardIcon, LucideIcon> = { ShieldCheck, Workflow, Zap, Target, Eye, Heart };
// Static class names: Tailwind only emits what it can read.
const COLUMNS: Record<number, string> = {
  1: 'md:grid-cols-1',
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-3',
};

/**
 * Value cards (BRD 6.8): a staggered grid, each with an icon circle and optional 3D art on
 * top. Labelled by the card titles when the block has no title of its own.
 */
export function CardsBlock({ block, locale, tone, anchor, heading }: BlockProps<'cards'>) {
  const cols = Math.min(block.items.length, 3);
  const separator = copyFor(locale).productsPage.listSeparator;
  const title = heading?.title ?? block.title;
  return (
    <Section
      tone={tone}
      className={heading ? 'pt-10 md:pt-16' : undefined}
      {...(title
        ? { 'aria-labelledby': `${anchor}-title` }
        : { 'aria-label': block.items.map((c) => c.title).join(separator) })}
      data-block="cards"
    >
      <Container className="flex flex-col gap-10">
        {title && (
          <SectionHeader
            as={heading ? 'h1' : 'h2'}
            id={`${anchor}-title`}
            title={title}
            {...(heading?.lead ? { lead: heading.lead } : {})}
          />
        )}
        <ul className={`grid gap-6 ${COLUMNS[cols] ?? COLUMNS[3]}`}>
          {block.items.map((card, i) => (
            <Reveal
              as="li"
              key={card.title}
              index={i}
              className={i === 1 && cols === 3 ? 'h-full md:translate-y-6' : 'h-full'}
            >
              <Card className="flex h-full flex-col overflow-hidden">
                {card.art && (
                  <div className="relative aspect-[16/9] bg-ground">
                    <Image
                      src={card.art}
                      alt=""
                      fill
                      sizes="(min-width: 768px) 400px, 100vw"
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="flex flex-1 flex-col gap-3 p-6">
                  <span className="grid size-11 place-items-center rounded-pill bg-accent-tint text-primary">
                    <Icon icon={ICONS[card.icon]} size={22} />
                  </span>
                  <h2 className="text-h4 text-text">{card.title}</h2>
                  <p className="text-body text-text-muted">{card.text}</p>
                </div>
              </Card>
            </Reveal>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
