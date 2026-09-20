import Link from 'next/link';
import { WhatsAppIcon } from '@/components/shared/whatsapp-icon';
import { Button } from '@/components/shared/button';
import { Container } from '@/components/shared/container';
import { StaticImage } from '@/components/shared/static-image';
import { whatsappUrl } from '@/lib/utm';

interface StatusPageProps {
  title: string;
  text: string;
  button: string;
  /** Where the button goes: the locale's home (`/` or `/en`). */
  home: string;
  /** WhatsApp line (runtime errors, BRD 8.11): the number and the link text. */
  whatsapp?: { number: string; label: string };
}

/** Centred status layout shared by 404 and the error boundaries (BRD 6.13). No ribbon. */
export function StatusPage({ title, text, button, home, whatsapp }: StatusPageProps) {
  return (
    <Container className="flex min-h-[70svh] flex-col items-center justify-center gap-6 py-24 text-center">
      <StaticImage
        src="/images/logo/icon-128.png"
        alt=""
        width={64}
        height={64}
        className="size-16 rounded-inner"
      />
      <h1 className="text-h1">{title}</h1>
      <p className="lead text-text-muted">{text}</p>
      <div className="mt-2 flex flex-col items-center gap-4 sm:flex-row">
        <Button asChild size="lg">
          <Link href={home}>{button}</Link>
        </Button>
        {whatsapp && (
          <a
            href={whatsappUrl(whatsapp.number)}
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-2 py-2 font-medium text-primary hover:underline"
          >
            <WhatsAppIcon size={18} className="text-whatsapp" />
            {whatsapp.label}
          </a>
        )}
      </div>
    </Container>
  );
}
