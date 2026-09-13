import { Container } from '@/components/shared/container';
import { SarAmount } from '@/components/shared/sar-amount';
import { Section } from '@/components/shared/section';
import { cn } from '@/lib/cn';
import type { BlockProps } from '@/modules/pages/blocks/types';

/** «مثال: تيشيرت تبيعه بـ 89 وتكلفته 45، ربحك 44 لكل قطعة.» with every number as `SarAmount`. */
export function ExampleLine({ text }: { text: string }) {
  // Static content: the segment text plus its offset is a stable key.
  const parts = text.split(/(\d+)/).map((part, i) => ({ part, key: `${i}-${part}` }));
  return (
    <p className="lead text-text">
      {parts.map(({ part, key }) =>
        /^\d+$/.test(part) ? (
          <SarAmount key={key} value={Number(part)} className="font-medium text-primary" />
        ) : (
          <span key={key}>{part}</span>
        ),
      )}
    </p>
  );
}

/** The profit equation as a highlighted card (BRD 6.7): three tiles that stack on phones. */
export function ProfitEquationBlock({
  block,
  tone,
  anchor,
  heading,
}: BlockProps<'profitEquation'>) {
  const tiles = [block.sell, block.base, block.profit];
  const Heading = heading ? 'h1' : 'h2';
  return (
    <Section
      tone={tone}
      className={heading ? 'pt-10 md:pt-16' : undefined}
      aria-labelledby={`${anchor}-title`}
      data-block="profitEquation"
    >
      <Container>
        <div className="flex flex-col items-center gap-8 rounded-lg border border-border bg-surface p-6 text-center shadow-card md:p-10">
          <Heading
            id={`${anchor}-title`}
            className={cn(heading ? 'text-h1' : 'text-h2', 'text-text')}
          >
            {heading?.title ?? block.title}
          </Heading>
          <ol
            className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap sm:gap-4"
            data-equation=""
          >
            {tiles.map((label, i) => (
              <li key={label} className="contents">
                <span
                  className={cn(
                    'rounded-base border px-6 py-4 text-h4',
                    i === tiles.length - 1
                      ? 'border-primary bg-accent-tint text-primary'
                      : 'border-border bg-ground text-text',
                  )}
                >
                  {label}
                </span>
                {i < tiles.length - 1 && (
                  <span aria-hidden="true" className="text-h3 text-text-muted">
                    {i === 0 ? '−' : '='}
                  </span>
                )}
              </li>
            ))}
          </ol>
          <ExampleLine text={block.exampleLine} />
        </div>
      </Container>
    </Section>
  );
}
