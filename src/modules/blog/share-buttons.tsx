'use client';

import { Link2 } from 'lucide-react';
import { useState } from 'react';
import { WhatsAppIcon, XIcon } from '@/components/shared/brand-icons';
import { Icon } from '@/components/shared/icon';

interface ShareButtonsProps {
  url: string;
  title: string;
  label: string;
  copyLabel: string;
  copiedLabel: string;
  whatsappAria: string;
  xAria: string;
}

const CIRCLE =
  'grid size-11 place-items-center rounded-pill border border-border bg-surface text-text transition-colors duration-(--duration-fast) hover:border-primary hover:text-primary';

/** Share row (BRD 6.11): WhatsApp, X, copy link with a transient confirmation. */
export function ShareButtons({
  url,
  title,
  label,
  copyLabel,
  copiedLabel,
  whatsappAria,
  xAria,
}: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const text = encodeURIComponent(`${title} ${url}`);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked (insecure context or permission): the URL bar still has the link.
    }
  }

  return (
    <div className="flex items-center gap-3" data-share="">
      <span className="text-small font-medium text-text-muted">{label}</span>
      <ul className="flex items-center gap-2">
        <li>
          <a
            href={`https://wa.me/?text=${text}`}
            target="_blank"
            rel="noopener"
            aria-label={whatsappAria}
            className={CIRCLE}
          >
            <WhatsAppIcon className="size-5" />
          </a>
        </li>
        <li>
          <a
            href={`https://x.com/intent/post?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`}
            target="_blank"
            rel="noopener"
            aria-label={xAria}
            className={CIRCLE}
          >
            <XIcon className="size-5" />
          </a>
        </li>
        <li>
          <button type="button" onClick={copy} aria-label={copyLabel} className={CIRCLE}>
            <Icon icon={Link2} size={20} />
          </button>
        </li>
      </ul>
      <span aria-live="polite" className="text-small text-success" data-share-copied="">
        {copied ? copiedLabel : ''}
      </span>
    </div>
  );
}
