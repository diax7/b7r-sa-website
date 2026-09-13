import { CalendarCheck, Mail, Phone } from 'lucide-react';
import type { ReactNode } from 'react';
import { InstagramIcon, TikTokIcon, WhatsAppIcon, XIcon } from '@/components/shared/brand-icons';
import { Button } from '@/components/shared/button';
import { Card } from '@/components/shared/card';
import { Container } from '@/components/shared/container';
import { Icon } from '@/components/shared/icon';
import { Section, type SectionTone } from '@/components/shared/section';
import { SectionHeader } from '@/components/shared/section-header';
import { contactForm, footerCopy } from '@/content/pages';
import type { BlockOf } from '@/content/schema';
import { getSiteSettings } from '@/lib/cms';
import { env } from '@/lib/env';
import { bookingUrl } from '@/lib/env-server';
import { whatsappUrl } from '@/lib/utm';
import { ContactForm } from '@/modules/contact/contact-form';

function ContactCard({
  icon,
  title,
  children,
  tone = 'primary',
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
  tone?: 'primary' | 'whatsapp';
}) {
  return (
    <Card className="flex items-start gap-4 p-5">
      <span
        className={
          tone === 'whatsapp'
            ? 'grid size-11 shrink-0 place-items-center rounded-pill bg-whatsapp/10 text-whatsapp'
            : 'grid size-11 shrink-0 place-items-center rounded-pill bg-accent-tint text-primary'
        }
      >
        {icon}
      </span>
      <div className="flex min-w-0 flex-col gap-1">
        <h2 className="text-h4 text-text">{title}</h2>
        {children}
      </div>
    </Card>
  );
}

interface ContactSectionProps {
  block: BlockOf<'contact'>;
  tone: Extract<SectionTone, 'surface' | 'ground'>;
  /** Unique per page (`contact`, `contact-2`); element ids derive from it. */
  anchor: string;
  heading?: { title: string; lead?: string | undefined } | undefined;
}

/**
 * The contact section (BRD 6.9) as a page block: the form card at the start (its strings
 * are interface copy in code, ADR-031), the contact cards and the booking card at the end;
 * on phones the cards come first (WhatsApp is the fastest path), then booking, then the form.
 */
export async function ContactSection({ block, tone, anchor, heading }: ContactSectionProps) {
  const site = await getSiteSettings();
  const whatsapp = whatsappUrl(site.contact.whatsapp);
  const booking = site.bookingUrl ?? bookingUrl();
  const bookingHref = booking ?? whatsappUrl(site.contact.whatsapp, block.booking.whatsappMessage);
  const social = [
    { href: site.social.x, label: footerCopy.socialAria.x, Icon: XIcon },
    { href: site.social.instagram, label: footerCopy.socialAria.instagram, Icon: InstagramIcon },
    { href: site.social.tiktok, label: footerCopy.socialAria.tiktok, Icon: TikTokIcon },
  ];

  return (
    <Section
      tone={tone}
      className={heading ? 'pt-10 md:pt-16' : undefined}
      {...(heading
        ? { 'aria-labelledby': `${anchor}-title` }
        : { 'aria-label': block.whatsappTitle })}
      data-block="contact"
    >
      <Container className="flex flex-col gap-12">
        {heading && (
          <SectionHeader
            as="h1"
            id={`${anchor}-title`}
            title={heading.title}
            {...(heading.lead ? { lead: heading.lead } : {})}
          />
        )}
        <div className="grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-12">
          <Card className="order-last p-6 md:p-8 lg:order-first" radius="lg">
            <ContactForm
              copy={{
                labels: contactForm.labels,
                placeholders: contactForm.placeholders,
                submit: contactForm.submit,
                sending: contactForm.sending,
                success: contactForm.success,
                successWhatsapp: contactForm.successWhatsapp,
                failure: contactForm.failure,
              }}
              whatsappHref={whatsapp}
              turnstileSiteKey={env.turnstileSiteKey}
            />
          </Card>
          <div className="flex flex-col gap-4">
            <ContactCard
              tone="whatsapp"
              icon={<WhatsAppIcon className="size-6" />}
              title={block.whatsappTitle}
            >
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener"
                className="text-body text-primary hover:text-primary-hover"
                data-track="whatsapp_click"
                data-location="contact"
              >
                {block.whatsappText}
              </a>
            </ContactCard>
            <ContactCard icon={<Icon icon={Mail} size={22} />} title={block.emailTitle}>
              <a
                href={`mailto:${site.contact.email}`}
                className="text-body text-primary hover:text-primary-hover"
              >
                <bdi dir="ltr">{site.contact.email}</bdi>
              </a>
            </ContactCard>
            <ContactCard icon={<Icon icon={Phone} size={22} />} title={block.phoneTitle}>
              <a
                href={`tel:${site.contact.phoneIntl}`}
                className="text-body text-primary hover:text-primary-hover"
              >
                <bdi dir="ltr" className="tabular">
                  {site.contact.phone}
                </bdi>
              </a>
            </ContactCard>
            <Card className="flex items-center justify-between gap-4 p-5">
              <h2 className="text-h4 text-text">{block.followTitle}</h2>
              <ul className="flex items-center gap-2">
                {social.map(({ href, label, Icon: Brand }) => (
                  <li key={href}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener"
                      aria-label={label}
                      className="grid size-11 place-items-center rounded-pill border border-border text-text transition-colors duration-(--duration-fast) hover:border-primary hover:text-primary"
                    >
                      <Brand className="size-5" />
                    </a>
                  </li>
                ))}
              </ul>
            </Card>
            <Card className="flex flex-col gap-4 bg-accent-tint/60 p-6" data-booking="">
              <span className="grid size-11 place-items-center rounded-pill bg-surface text-primary">
                <Icon icon={CalendarCheck} size={22} />
              </span>
              <div className="flex flex-col gap-1">
                <h2 className="text-h4 text-text">{block.booking.title}</h2>
                <p className="text-body text-text-muted">{block.booking.text}</p>
              </div>
              <Button asChild className="self-start" trailingArrow={false}>
                <a
                  href={bookingHref}
                  target="_blank"
                  rel="noopener"
                  data-booking-mode={booking ? 'calendar' : 'whatsapp'}
                  {...(booking
                    ? {}
                    : { 'data-track': 'whatsapp_click', 'data-location': 'contact' })}
                >
                  {block.booking.button}
                </a>
              </Button>
            </Card>
          </div>
        </div>
      </Container>
    </Section>
  );
}
