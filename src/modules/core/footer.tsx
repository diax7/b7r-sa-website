import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { InstagramIcon, TikTokIcon, WhatsAppIcon, XIcon } from '@/components/shared/brand-icons';
import { Container } from '@/components/shared/container';
import { footerCopy } from '@/content/pages';
import type { Navigation, SiteSettings } from '@/content/schema';
import { cn } from '@/lib/cn';
import { whatsappUrl } from '@/lib/utm';

const PAYMENT_BADGES = [
  { file: 'paypal.png', name: 'PayPal' },
  { file: 'mastercard.png', name: 'Mastercard' },
  { file: 'visa.png', name: 'Visa' },
  { file: 'maestro.png', name: 'Maestro' },
  { file: 'apple-pay.png', name: 'Apple Pay' },
  { file: 'mada.png', name: 'mada' },
];

const TRUST_BADGES = [
  { file: 'saudi-business-center.png', name: 'المركز السعودي للأعمال', w: 233, h: 81 },
  { file: 'ministry-of-commerce.png', name: 'وزارة التجارة', w: 229, h: 81 },
];

const linkCls =
  'inline-block py-1 text-white/90 transition-colors duration-(--duration-fast) hover:text-accent focus-visible:outline-accent';

/** Strings the newsletter slot needs (BRD 4.5); the form itself lives in `modules/forms`. */
export const newsletterCopy = {
  label: footerCopy.newsletterLabel,
  placeholder: footerCopy.newsletterPlaceholder,
  button: footerCopy.newsletterButton,
  success: footerCopy.newsletterSuccess,
  invalid: footerCopy.newsletterError,
  unavailable: footerCopy.newsletterUnavailable,
};

/**
 * Site footer (BRD 6.3.2, copy 4.5). Navy, four columns, badges strip, contact line. The
 * newsletter form is passed in by the layout so `core` never imports a feature module.
 */
export function Footer({
  newsletter,
  navigation,
  site,
}: {
  newsletter: ReactNode;
  navigation: Navigation;
  site: SiteSettings;
}) {
  const year = new Date().getFullYear();
  const socials = [
    { href: site.social.x, label: footerCopy.socialAria.x, Icon: XIcon },
    { href: site.social.instagram, label: footerCopy.socialAria.instagram, Icon: InstagramIcon },
    { href: site.social.tiktok, label: footerCopy.socialAria.tiktok, Icon: TikTokIcon },
    {
      href: whatsappUrl(site.contact.whatsapp),
      label: footerCopy.socialAria.whatsapp,
      Icon: WhatsAppIcon,
    },
  ];

  return (
    <footer className="bg-navy text-white/90">
      <Container className="pt-16 pb-10 md:pt-20">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.4fr] lg:gap-8">
          <div className="flex flex-col items-start gap-5">
            <Link href="/" className="inline-block rounded-inner" aria-label={site.brandName}>
              <Image
                src="/images/logo/logo-white-footer.png"
                alt=""
                width={220}
                height={80}
                className="h-10 w-auto"
              />
            </Link>
            <p className="max-w-xs text-small text-white/75">{site.tagline}</p>
            <ul className="flex items-center gap-2">
              {socials.map(({ href, label, Icon }) => (
                <li key={href}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener"
                    aria-label={label}
                    className="grid size-11 place-items-center rounded-pill border border-white/15 text-white/90 transition-colors duration-(--duration-fast) hover:border-accent hover:text-accent"
                  >
                    <Icon size={18} />
                  </a>
                </li>
              ))}
            </ul>
            <p className="flex flex-wrap items-center gap-x-3 text-small text-white/75">
              <a href={`mailto:${site.contact.email}`} className={cn(linkCls, 'py-0')}>
                <bdi dir="ltr">{site.contact.email}</bdi>
              </a>
              <span aria-hidden="true">·</span>
              <a href={`tel:${site.contact.phoneIntl}`} className={cn(linkCls, 'py-0')}>
                <bdi dir="ltr">{site.contact.phone}</bdi>
              </a>
            </p>
          </div>

          <FooterColumn title={footerCopy.linksTitle}>
            {navigation.primary.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={linkCls}>
                  {item.label}
                </Link>
              </li>
            ))}
          </FooterColumn>

          <FooterColumn title={footerCopy.policiesTitle}>
            {navigation.policies.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={linkCls}>
                  {item.label}
                </Link>
              </li>
            ))}
          </FooterColumn>

          <div>
            <h2 className="mb-4 text-h4 text-white">{footerCopy.newsletterTitle}</h2>
            {newsletter}
          </div>
        </div>

        <div className="mt-14 border-t border-white/10 pt-8">
          <h2 id="footer-badges" className="sr-only">
            {footerCopy.badgesCaption}
          </h2>
          <div
            className="flex flex-wrap items-center gap-x-8 gap-y-5"
            aria-labelledby="footer-badges"
          >
            <ul className="flex flex-wrap items-center gap-2">
              {PAYMENT_BADGES.map((b) => (
                <li
                  key={b.file}
                  className="grid h-9 place-items-center rounded-inner bg-white px-2.5"
                >
                  <Image
                    src={`/images/badges/${b.file}`}
                    alt={b.name}
                    width={44}
                    height={28}
                    className="h-5 w-auto"
                  />
                </li>
              ))}
            </ul>
            <ul className="flex items-center gap-2">
              {TRUST_BADGES.map((b) => (
                <li
                  key={b.file}
                  className="grid h-9 place-items-center rounded-inner bg-white px-2.5"
                >
                  <Image
                    src={`/images/badges/${b.file}`}
                    alt={b.name}
                    width={b.w}
                    height={b.h}
                    className="h-6 w-auto"
                  />
                </li>
              ))}
            </ul>
            <Image
              src="/images/badges/misk-foundation-logo.png"
              alt="مؤسسة مسك"
              width={400}
              height={230}
              className="h-10 w-auto rounded-inner bg-white p-1"
            />
          </div>
        </div>

        <div className="mt-8 border-t border-white/10 pt-6 text-center text-small text-white/75">
          <p>{footerCopy.copyright.replace('{year}', String(year))}</p>
        </div>
      </Container>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: ReactNode }) {
  return (
    <nav aria-label={title}>
      <h2 className="mb-4 text-h4 text-white">{title}</h2>
      <ul className="flex flex-col gap-1">{children}</ul>
    </nav>
  );
}
