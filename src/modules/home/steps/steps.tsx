import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Container } from '@/components/shared/container';
import { Icon } from '@/components/shared/icon';
import { Photo } from '@/components/shared/photo';
import { Section, type SectionTone } from '@/components/shared/section';
import { SectionHeader } from '@/components/shared/section-header';
import { getHome } from '@/lib/cms';
import { type Locale, localePath } from '@/lib/i18n';
import { StepsProgress } from '@/modules/home/steps/steps-progress';

/**
 * Three steps (BRD 6.4.4). The list layout is the default CSS (mobile, no-JS, reduced
 * motion); under `html.js` at `lg` the section becomes 300 vh with a pinned inner grid and
 * `StepsProgress` maps scroll position to the active step. Native scroll only.
 */
export async function Steps({ locale, tone = 'surface' }: { locale: Locale; tone?: SectionTone }) {
  const { steps } = await getHome(locale);
  if (!steps.enabled) return null;
  const homeSteps = steps.items;
  return (
    <Section id="steps" tone={tone} aria-labelledby="steps-title" className="steps" data-active="0">
      <div className="steps-pin">
        <Container className="flex flex-col gap-10">
          <SectionHeader id="steps-title" eyebrow={steps.eyebrow} title={steps.title} />
          <div className="steps-grid">
            <ol className="steps-list">
              {homeSteps.map((step, i) => (
                <li
                  key={step.order}
                  className="steps-item"
                  data-step={i}
                  aria-current={i === 0 ? 'step' : undefined}
                >
                  <Photo
                    src={step.icon}
                    alt=""
                    width={96}
                    height={96}
                    className="steps-item-icon size-24 shrink-0 rounded-base"
                  />
                  <span className="steps-badge" aria-hidden="true">
                    {step.order}
                  </span>
                  <div className="flex flex-col gap-1">
                    <h3 className="text-h3">{step.title}</h3>
                    <p className="text-text-muted">{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="steps-panel" aria-hidden="true">
              {homeSteps.map((step, i) => (
                <Photo
                  key={step.order}
                  src={step.icon}
                  alt=""
                  width={480}
                  height={480}
                  className="steps-panel-icon"
                  data-step={i}
                />
              ))}
            </div>
          </div>
          <Link
            href={localePath(locale, '/how-it-works')}
            className="steps-link inline-flex items-center gap-2 self-start py-2 font-medium text-primary hover:text-primary-hover"
          >
            {steps.link}
            <Icon icon={ArrowRight} size={18} />
          </Link>
        </Container>
      </div>
      <StepsProgress />
    </Section>
  );
}
